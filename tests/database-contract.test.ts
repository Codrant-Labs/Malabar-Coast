import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("database schema contains the atomic checkout and transition boundary", async () => {
  const schema = await readFile(new URL("../supabase/schema.sql", import.meta.url), "utf8");
  assert.match(schema, /create unique index if not exists orders_idempotency_key_hash_uidx/i);
  assert.match(schema, /create or replace function public\.create_checkout_order/i);
  assert.match(schema, /on conflict \(idempotency_key_hash\).*do nothing/i);
  assert.match(schema, /create or replace function public\.transition_order_status/i);
  assert.match(schema, /for update/i);
});

test("payment event RPC requires provider identity and value inputs", async () => {
  const schema = await readFile(new URL("../supabase/schema.sql", import.meta.url), "utf8");
  assert.match(schema, /p_provider_reference text default null/i);
  assert.match(schema, /p_amount_pence integer default null/i);
  assert.match(schema, /p_currency text default null/i);
  assert.match(schema, /payment_reversed/i);
  assert.match(schema, /payment_disputed/i);
});
