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
