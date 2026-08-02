create table if not exists public.orders (
  id text primary key,
  status text not null,
  provider text not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_status_created_at_idx on public.orders (status, created_at desc);

alter table public.orders enable row level security;

-- No public policies are intentional. Only the server-side service role may read or write orders.

create table if not exists public.order_payment_events (
  provider text not null,
  event_id text not null,
  order_id text not null references public.orders(id) on delete cascade,
  payment_status text not null,
  outcome text not null,
  created_at timestamptz not null default now(),
  primary key (provider, event_id)
);

create index if not exists order_payment_events_order_id_idx
  on public.order_payment_events (order_id, created_at desc);

alter table public.order_payment_events enable row level security;

-- Atomically records provider events and updates payment state. Duplicate events are ignored.
create or replace function public.apply_order_payment_event(
  p_provider text,
  p_event_id text,
  p_order_id text,
  p_payment_status text,
  p_outcome text,
  p_provider_reference text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_status text;
  next_status text;
  changed_at timestamptz := now();
  recent_event_ids jsonb;
  next_history jsonb;
begin
  if p_provider not in ('stripe', 'worldpay')
    or p_payment_status not in ('pending', 'paid', 'failed', 'cancelled', 'expired')
    or length(p_event_id) < 3
    or length(p_event_id) > 180
    or length(p_order_id) < 16
    or length(p_order_id) > 80 then
    raise exception 'Invalid payment event';
  end if;

  select status into current_status
  from public.orders
  where id = p_order_id and provider = p_provider
  for update;

  if not found then
    return false;
  end if;

  insert into public.order_payment_events (provider, event_id, order_id, payment_status, outcome)
  values (p_provider, p_event_id, p_order_id, p_payment_status, left(p_outcome, 180))
  on conflict (provider, event_id) do nothing;

  if not found then
    return false;
  end if;

  next_status := case
    when p_payment_status = 'paid' and current_status in ('pending_payment', 'payment_failed') then 'paid'
    when p_payment_status = 'failed' and current_status = 'pending_payment' then 'payment_failed'
    when p_payment_status = 'cancelled' and current_status = 'pending_payment' then 'cancelled'
    when p_payment_status = 'expired' and current_status = 'pending_payment' then 'expired'
    else current_status
  end;

  select coalesce(jsonb_agg(value order by ordinality), '[]'::jsonb)
  into recent_event_ids
  from (
    select value, ordinality
    from jsonb_array_elements(coalesce((select data from public.orders where id = p_order_id)->'processedWebhookIds', '[]'::jsonb))
      with ordinality
    order by ordinality desc
    limit 49
  ) recent;

  select case
    when next_status = current_status then coalesce(data->'statusHistory', '[]'::jsonb)
    else coalesce(data->'statusHistory', '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
      'status', next_status,
      'at', to_char(changed_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
      'actor', 'payment_provider'
    ))
  end
  into next_history
  from public.orders
  where id = p_order_id;

  update public.orders
  set
    status = next_status,
    updated_at = changed_at,
    data = data || jsonb_build_object(
      'status', next_status,
      'paymentStatus', p_payment_status,
      'providerOutcome', left(p_outcome, 180),
      'providerReference', coalesce(p_provider_reference, data->>'providerReference'),
      'processedWebhookIds', recent_event_ids || jsonb_build_array(p_event_id),
      'statusHistory', next_history,
      'updatedAt', to_char(changed_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    )
  where id = p_order_id and provider = p_provider;

  return true;
end;
$$;

revoke all on function public.apply_order_payment_event(text, text, text, text, text, text) from public;
grant execute on function public.apply_order_payment_event(text, text, text, text, text, text) to service_role;
