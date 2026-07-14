"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

type WorldpaySessions = { card?: string; cvv?: string };
type WorldpayCheckout = { generateSessions: (callback: (error: unknown, sessions?: WorldpaySessions) => void) => void; remove?: () => void };
type WorldpayGlobal = { checkout: { init: (options: Record<string, unknown>, callback: (error: unknown, checkout?: WorldpayCheckout) => void) => void } };

declare global { interface Window { Worldpay?: WorldpayGlobal } }

export type WorldpayCardHandle = { generateSessions: () => Promise<WorldpaySessions> };

export const WorldpayCardFields = forwardRef<WorldpayCardHandle, { checkoutId: string; environment: "try" | "live" }>(function WorldpayCardFields({ checkoutId, environment }, ref) {
  const checkoutRef = useRef<WorldpayCheckout | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let disposed = false;
    const initialize = () => {
      if (!window.Worldpay || disposed) return;
      window.Worldpay.checkout.init({
        id: checkoutId,
        form: "#worldpay-card-form",
        fields: { pan: { selector: "#card-pan" }, expiry: { selector: "#card-expiry" }, cvv: { selector: "#card-cvv" } },
        styles: {
          input: { color: "#10201c", "font-family": "Arial, sans-serif", "font-size": "16px" },
          "input:focus": { color: "#10201c" },
          "input.is-invalid": { color: "#9d2b22" },
          "input.is-valid": { color: "#10201c" },
        },
        accessibility: { ariaLabel: { pan: "Card number", expiry: "Expiry date", cvv: "Security code" } },
        acceptedCardBrands: ["visa", "mastercard", "amex"],
        enablePanFormatting: true,
      }, (error, checkout) => {
        if (disposed) return;
        if (error || !checkout) return setStatus("error");
        checkoutRef.current = checkout;
        setStatus("ready");
      });
    };

    if (window.Worldpay) initialize();
    else {
      const script = document.createElement("script");
      script.src = environment === "live" ? "https://access.worldpay.com/access-checkout/v2/checkout.js" : "https://try.access.worldpay.com/access-checkout/v2/checkout.js";
      script.async = true;
      script.onload = initialize;
      script.onerror = () => setStatus("error");
      document.head.appendChild(script);
    }
    return () => {
      disposed = true;
      checkoutRef.current?.remove?.();
      checkoutRef.current = null;
    };
  }, [checkoutId, environment]);

  useImperativeHandle(ref, () => ({
    generateSessions: () => new Promise<WorldpaySessions>((resolve, reject) => {
      const checkout = checkoutRef.current;
      if (!checkout) return reject(new Error("Secure card fields are not ready."));
      checkout.generateSessions((error, sessions) => {
        if (error || !sessions?.card || !sessions?.cvv) reject(new Error("Check the card details and try again."));
        else resolve(sessions);
      });
    }),
  }), []);

  return (
    <div className="worldpayFields" id="worldpay-card-form">
      <div className="worldpayStatus" role="status">{status === "loading" ? "Loading secure card fields…" : status === "error" ? "Secure card fields could not load." : "Card details are encrypted by Worldpay."}</div>
      <label>Card number<div id="card-pan" className="worldpayField" /></label>
      <div className="worldpayFieldRow"><label>Expiry date<div id="card-expiry" className="worldpayField" /></label><label>Security code<div id="card-cvv" className="worldpayField" /></label></div>
    </div>
  );
});
