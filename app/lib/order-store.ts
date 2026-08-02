import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { getAllowedAdminTransitions, type OrderRecord, type OrderStatus, type PaymentProvider, type PaymentStatus } from "./orders";

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

export async function createOrder(order: OrderRecord) {
  if (hasSupabase()) {
    await supabaseRequest("orders", { method: "POST", body: JSON.stringify({ id: order.id, status: order.status, provider: order.provider, data: order, created_at: order.createdAt, updated_at: order.updatedAt }) });
    return order;
  }
  if (process.env.NODE_ENV === "production") throw new Error("Order storage is not configured. Add Supabase environment variables.");
  writeQueue = writeQueue.then(async () => {
    const orders = await readLocalOrders();
    if (!orders.some((candidate) => candidate.id === order.id)) await writeLocalOrders([...orders, order]);
  });
  await writeQueue;
  return order;
}

export async function getOrder(id: string): Promise<OrderRecord | null> {
  if (hasSupabase()) {
    const response = await supabaseRequest(`orders?id=eq.${encodeURIComponent(id)}&select=data&limit=1`, { method: "GET" });
    const rows = await response.json() as { data: OrderRecord }[];
    return rows[0]?.data ?? null;
  }
  return (await readLocalOrders()).find((order) => order.id === id) ?? null;
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

export async function getOrderByIdempotencyHash(hash: string): Promise<OrderRecord | null> {
  if (hasSupabase()) {
    const query = new URLSearchParams({
      "data->>idempotencyKeyHash": `eq.${hash}`,
      select: "data",
      limit: "1",
    });
    const response = await supabaseRequest(`orders?${query}`, { method: "GET" });
    const rows = await response.json() as { data: OrderRecord }[];
    return rows[0]?.data ?? null;
  }
  return (await readLocalOrders()).find((order) => order.idempotencyKeyHash === hash) ?? null;
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

export async function updateOrder(id: string, changes: Partial<OrderRecord>) {
  const current = await getOrder(id);
  if (!current) return null;
  const updated: OrderRecord = { ...current, ...changes, id: current.id, updatedAt: new Date().toISOString() };
  if (hasSupabase()) {
    await supabaseRequest(`orders?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ status: updated.status, provider: updated.provider, data: updated, updated_at: updated.updatedAt }) });
    return updated;
  }
  writeQueue = writeQueue.then(async () => {
    const orders = await readLocalOrders();
    await writeLocalOrders(orders.map((order) => order.id === id ? updated : order));
  });
  await writeQueue;
  return updated;
}

export async function transitionOrderStatus(id: string, nextStatus: OrderStatus) {
  const current = await getOrder(id);
  if (!current || !getAllowedAdminTransitions(current).includes(nextStatus)) return null;
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

  if (hasSupabase()) {
    const query = new URLSearchParams({ id: `eq.${id}`, status: `eq.${current.status}` });
    const response = await supabaseRequest(`orders?${query}`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ status: nextStatus, data: updated, updated_at: now }),
    });
    const rows = await response.json() as unknown[];
    return rows.length ? updated : null;
  }

  let result: OrderRecord | null = null;
  writeQueue = writeQueue.then(async () => {
    const orders = await readLocalOrders();
    const index = orders.findIndex((order) => order.id === id && order.status === current.status);
    if (index < 0) return;
    orders[index] = updated;
    await writeLocalOrders(orders);
    result = updated;
  });
  await writeQueue;
  return result;
}

function nextPaymentOrderStatus(current: OrderStatus, paymentStatus: PaymentStatus): OrderStatus {
  if (paymentStatus === "paid" && ["pending_payment", "payment_failed"].includes(current)) return "paid";
  if (paymentStatus === "failed" && current === "pending_payment") return "payment_failed";
  if (paymentStatus === "cancelled" && current === "pending_payment") return "cancelled";
  if (paymentStatus === "expired" && current === "pending_payment") return "expired";
  return current;
}

export async function applyPaymentEvent(input: {
  provider: PaymentProvider;
  eventId: string;
  orderId: string;
  paymentStatus: PaymentStatus;
  outcome: string;
  providerReference?: string;
}) {
  if (hasSupabase()) {
    const response = await supabaseRequest("rpc/apply_order_payment_event", {
      method: "POST",
      body: JSON.stringify({
        p_provider: input.provider,
        p_event_id: input.eventId,
        p_order_id: input.orderId,
        p_payment_status: input.paymentStatus,
        p_outcome: input.outcome,
        p_provider_reference: input.providerReference || null,
      }),
    });
    return Boolean(await response.json());
  }

  let applied = false;
  writeQueue = writeQueue.then(async () => {
    const orders = await readLocalOrders();
    const index = orders.findIndex((order) => order.id === input.orderId && order.provider === input.provider);
    if (index < 0) return;
    const current = orders[index];
    if (current.processedWebhookIds?.includes(input.eventId)) return;
    const now = new Date().toISOString();
    const nextStatus = nextPaymentOrderStatus(current.status, input.paymentStatus);
    orders[index] = {
      ...current,
      status: nextStatus,
      paymentStatus: input.paymentStatus,
      providerOutcome: input.outcome.slice(0, 180),
      providerReference: input.providerReference || current.providerReference,
      processedWebhookIds: [...(current.processedWebhookIds || []), input.eventId].slice(-50),
      statusHistory: nextStatus === current.status
        ? current.statusHistory
        : [...(current.statusHistory || []), { status: nextStatus, at: now, actor: "payment_provider" as const }].slice(-100),
      updatedAt: now,
    };
    await writeLocalOrders(orders);
    applied = true;
  });
  await writeQueue;
  return applied;
}
