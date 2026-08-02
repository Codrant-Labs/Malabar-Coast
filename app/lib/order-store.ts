import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { getAllowedAdminTransitions, resolvePaymentTransition, type OrderRecord, type OrderStatus, type PaymentProvider, type PaymentStatus } from "./orders";

const dataDirectory = path.join(process.cwd(), ".data");
const dataFile = path.join(dataDirectory, "orders.json");
let writeQueue: Promise<void> = Promise.resolve();

function hasSupabase() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

async function supabaseRequest(pathname: string, init: RequestInit) {
  const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/${pathname}`, {
    ...init,
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...init.headers,
    },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Order database request failed (${response.status}).`);
  return response;
}

async function supabaseRpc<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const response = await supabaseRequest(`rpc/${name}`, { method: "POST", body: JSON.stringify(body) });
  return response.json() as Promise<T>;
}

async function readLocalOrders(): Promise<OrderRecord[]> {
  try {
    return JSON.parse(await readFile(dataFile, "utf8")) as OrderRecord[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

async function writeLocalOrders(orders: OrderRecord[]) {
  await mkdir(dataDirectory, { recursive: true });
  const temporaryFile = `${dataFile}.${process.pid}.tmp`;
  await writeFile(temporaryFile, JSON.stringify(orders, null, 2), "utf8");
  await rename(temporaryFile, dataFile);
}

export async function getOrder(id: string): Promise<OrderRecord | null> {
  if (hasSupabase()) {
    const response = await supabaseRequest(`orders?id=eq.${encodeURIComponent(id)}&select=data&limit=1`, { method: "GET" });
    const rows = await response.json() as { data: OrderRecord }[];
    return rows[0]?.data ?? null;
  }
  return (await readLocalOrders()).find((order) => order.id === id) ?? null;
}

export type AtomicCheckoutResult = {
  result: "created" | "existing" | "conflict";
  order: OrderRecord;
};

export async function createCheckoutOrderAtomic(order: OrderRecord): Promise<AtomicCheckoutResult> {
  if (!order.idempotencyKeyHash || !order.requestFingerprint) throw new Error("Checkout idempotency data is missing.");
  if (hasSupabase()) {
    return supabaseRpc<AtomicCheckoutResult>("create_checkout_order", {
      p_id: order.id,
      p_provider: order.provider,
      p_idempotency_key_hash: order.idempotencyKeyHash,
      p_request_fingerprint: order.requestFingerprint,
      p_data: order,
      p_created_at: order.createdAt,
    });
  }
  if (process.env.NODE_ENV === "production") throw new Error("Order storage is not configured. Add Supabase environment variables.");

  let result: AtomicCheckoutResult | undefined;
  writeQueue = writeQueue.then(async () => {
    const orders = await readLocalOrders();
    const existing = orders.find((candidate) => candidate.idempotencyKeyHash === order.idempotencyKeyHash);
    if (existing) {
      result = { result: existing.requestFingerprint === order.requestFingerprint ? "existing" : "conflict", order: existing };
      return;
    }
    await writeLocalOrders([...orders, order]);
    result = { result: "created", order };
  });
  await writeQueue;
  if (!result) throw new Error("Atomic checkout creation did not return a result.");
  return result;
}

export function isDurableOrderStorageConfigured() {
  return hasSupabase();
}

export async function checkDurableOrderStorage() {
  if (!hasSupabase()) return false;
  try {
    await supabaseRequest("orders?select=id&limit=1", { method: "GET", headers: { Prefer: "return=minimal" } });
    return true;
  } catch {
    return false;
  }
}

export async function listOrders(limit = 100): Promise<OrderRecord[]> {
  const safeLimit = Math.min(250, Math.max(1, Math.floor(limit)));
  if (hasSupabase()) {
    const query = new URLSearchParams({ select: "data", order: "created_at.desc", limit: String(safeLimit) });
    const response = await supabaseRequest(`orders?${query}`, { method: "GET" });
    const rows = await response.json() as { data: OrderRecord }[];
    return rows.map((row) => row.data);
  }
  return (await readLocalOrders())
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, safeLimit);
}

export async function attachCheckoutProviderReference(id: string, provider: PaymentProvider, providerReference: string, providerCheckoutUrl?: string) {
  if (hasSupabase()) {
    return supabaseRpc<OrderRecord | null>("attach_checkout_provider_reference", {
      p_order_id: id,
      p_provider: provider,
      p_provider_reference: providerReference,
      p_provider_checkout_url: providerCheckoutUrl || null,
    });
  }

  let result: OrderRecord | null = null;
  writeQueue = writeQueue.then(async () => {
    const orders = await readLocalOrders();
    const index = orders.findIndex((order) => order.id === id && order.provider === provider);
    if (index < 0) return;
    const current = orders[index];
    if (current.providerReference && current.providerReference !== providerReference) return;
    const now = new Date().toISOString();
    result = {
      ...current,
      providerReference,
      providerCheckoutUrl: providerCheckoutUrl || current.providerCheckoutUrl,
      updatedAt: now,
    };
    orders[index] = result;
    await writeLocalOrders(orders);
  });
  await writeQueue;
  return result;
}

export async function transitionOrderStatus(id: string, nextStatus: OrderStatus) {
  if (hasSupabase()) {
    return supabaseRpc<OrderRecord | null>("transition_order_status", { p_order_id: id, p_next_status: nextStatus });
  }

  let result: OrderRecord | null = null;
  writeQueue = writeQueue.then(async () => {
    const orders = await readLocalOrders();
    const index = orders.findIndex((order) => order.id === id);
    if (index < 0 || !getAllowedAdminTransitions(orders[index]).includes(nextStatus)) return;
    const current = orders[index];
    const now = new Date().toISOString();
    const updated: OrderRecord = {
      ...current,
      status: nextStatus,
      updatedAt: now,
      statusHistory: [
        ...(current.statusHistory || []),
        { status: nextStatus, at: now, actor: "admin" as const },
      ].slice(-100),
    };
    orders[index] = updated;
    await writeLocalOrders(orders);
    result = updated;
  });
  await writeQueue;
  return result;
}

export async function applyPaymentEvent(input: {
  provider: PaymentProvider;
  eventId: string;
  orderId: string;
  paymentStatus: PaymentStatus;
  outcome: string;
  providerReference?: string;
  amountPence?: number;
  currency?: string;
}) {
  if (hasSupabase()) {
    return supabaseRpc<boolean>("apply_order_payment_event", {
      p_provider: input.provider,
      p_event_id: input.eventId,
      p_order_id: input.orderId,
      p_payment_status: input.paymentStatus,
      p_outcome: input.outcome,
      p_provider_reference: input.providerReference || null,
      p_amount_pence: input.amountPence ?? null,
      p_currency: input.currency || null,
    });
  }

  let applied = false;
  writeQueue = writeQueue.then(async () => {
    const orders = await readLocalOrders();
    const index = orders.findIndex((order) => order.id === input.orderId && order.provider === input.provider);
    if (index < 0) return;
    const current = orders[index];
    if (current.processedWebhookIds?.includes(input.eventId)) return;
    if (current.providerReference && input.providerReference && current.providerReference !== input.providerReference) return;
    if (input.amountPence !== undefined && input.amountPence !== current.totalPence) return;
    if (input.currency && input.currency.toUpperCase() !== current.currency) return;
    const identityRequired = input.provider === "stripe" && ["paid", "partially_refunded", "refunded", "disputed", "reversed"].includes(input.paymentStatus);
    if (identityRequired && (!input.providerReference || input.amountPence !== current.totalPence || input.currency?.toUpperCase() !== current.currency)) return;
    const now = new Date().toISOString();
    const transition = resolvePaymentTransition(current, input.paymentStatus);
    orders[index] = {
      ...current,
      status: transition.orderStatus,
      paymentStatus: transition.paymentStatus,
      providerOutcome: input.outcome.slice(0, 180),
      providerReference: input.providerReference || current.providerReference,
      processedWebhookIds: [...(current.processedWebhookIds || []), input.eventId].slice(-50),
      statusHistory: transition.orderStatus === current.status
        ? current.statusHistory
        : [...(current.statusHistory || []), { status: transition.orderStatus, at: now, actor: "payment_provider" as const }].slice(-100),
      updatedAt: now,
    };
    await writeLocalOrders(orders);
    applied = true;
  });
  await writeQueue;
  return applied;
}
