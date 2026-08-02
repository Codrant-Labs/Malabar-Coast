"use client";

import { useEffect } from "react";

export function OrderStatusRefresh({ orderId, initialStatus }: { orderId: string; initialStatus: string }) {
  useEffect(() => {
    if (["completed", "payment_failed", "cancelled", "expired"].includes(initialStatus)) return;
    let active = true;
    const interval = window.setInterval(async () => {
      try {
        const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, { cache: "no-store" });
        if (!response.ok) return;
        const result = await response.json() as { status?: string };
        if (active && result.status && result.status !== initialStatus) window.location.reload();
      } catch {
        // The visible page remains the source of truth when a background check is unavailable.
      }
    }, 10_000);
    return () => { active = false; window.clearInterval(interval); };
  }, [initialStatus, orderId]);

  return <span className="orderAutoRefresh" role="status">Status checks refresh automatically while this page is open.</span>;
}
