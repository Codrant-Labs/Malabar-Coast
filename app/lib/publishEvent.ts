import { getSupabaseChannelClient } from "./config/supabase_channel";

export type AdminActivityKind = "order" | "reservation" | "hall";

export async function publishAdminActivityEvent(kind: AdminActivityKind, recordId: string) {
  let supabase: ReturnType<typeof getSupabaseChannelClient>;
  try {
    supabase = getSupabaseChannelClient();
  } catch (error) {
    console.warn("The record was saved, but the admin notification client is unavailable.", error instanceof Error ? error.name : "UnknownError");
    return false;
  }

  const channel = supabase.channel("admin-activity");
  try {
    const result = await channel.httpSend("activity-changed", {
      kind,
      recordId,
      changedAt: new Date().toISOString(),
    });

    if (!result.success) {
      console.warn("The record was saved, but the admin notification could not be published.");
      return false;
    }
    return true;
  } catch (error) {
    console.warn("The record was saved, but the admin notification failed.", error instanceof Error ? error.name : "UnknownError");
    return false;
  } finally {
    void supabase.removeChannel(channel);
  }
}

export function publishPaymentCompletionEvent(orderId: string) {
  return publishAdminActivityEvent("order", orderId);
}
