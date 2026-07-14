import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { OrderRecord } from "./orders";

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
