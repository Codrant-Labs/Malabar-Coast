import {randomBytes} from "node:crypto";
import {existsSync} from "node:fs";
import {loadEnvFile} from "node:process";
import {createClient} from "@supabase/supabase-js";

if (existsSync(".env.local")) loadEnvFile(".env.local");
const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serverKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !serverKey || !publishableKey) throw new Error("Supabase Realtime configuration is incomplete.");

async function main() {
  const channelName = `admin-activity-transport-${randomBytes(8).toString("hex")}`;
  const eventId = randomBytes(12).toString("hex");
  const subscriber = createClient(url!, publishableKey!, {auth: {autoRefreshToken: false, persistSession: false}});
  const publisher = createClient(url!, serverKey!, {auth: {autoRefreshToken: false, persistSession: false}});
  let resolveReceived!: () => void;
  const received = new Promise<void>((resolve) => { resolveReceived = resolve; });
  const subscribed = new Promise<void>((resolve, reject) => {
    subscriber.channel(channelName).on("broadcast", {event: "activity-changed"}, ({payload}) => {
      if (payload?.eventId === eventId) resolveReceived();
    }).subscribe((status) => {
      if (status === "SUBSCRIBED") resolve();
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") reject(new Error(`Realtime subscription ${status.toLowerCase()}.`));
    });
  });
  const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Realtime transport test timed out.")), 12_000));
  try {
    await Promise.race([subscribed, timeout]);
    const result = await publisher.channel(channelName).httpSend("activity-changed", {eventId, kind: "transport-test", changedAt: new Date().toISOString()});
    if (!result.success) throw new Error("Realtime publisher did not accept the test event.");
    await Promise.race([received, timeout]);
    console.log(JSON.stringify({subscribed: true, published: true, received: true}));
  } finally {
    await Promise.all([subscriber.removeAllChannels(), publisher.removeAllChannels()]);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Realtime transport test failed.");
  process.exitCode = 1;
});
