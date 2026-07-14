"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "./cart-provider";

export function CheckoutResult({ kind, orderId }: { kind: "success" | "cancelled" | "failure"; orderId?: string }) {
  const { clearCart } = useCart();
  useEffect(() => {
    if (kind === "success") {
      const frame = window.requestAnimationFrame(clearCart);
      return () => window.cancelAnimationFrame(frame);
    }
  }, [clearCart, kind]);

  const content = kind === "success"
    ? { eyebrow: "Order received", title: "Thank you.", copy: "Your payment has been submitted. We are preparing your order details and will use the email or phone number provided if we need anything else." }
    : kind === "cancelled"
      ? { eyebrow: "Payment cancelled", title: "Your order is saved.", copy: "Nothing has been charged. Your dishes are still in the cart, ready whenever you want to try again." }
      : { eyebrow: "Payment unsuccessful", title: "Let’s try again.", copy: "The payment did not complete. Check the details or choose another payment method; your cart has not been cleared." };

  return <main className={`checkoutResult is${kind}`}><div><p>{content.eyebrow}</p><h1>{content.title}</h1><span>{content.copy}</span>{orderId && <small>Order reference · {orderId}</small>}<div><Link href={kind === "success" ? "/menu" : "/checkout"}>{kind === "success" ? "Return to the menu" : "Return to checkout"} <b>→</b></Link><Link href="/">Home</Link></div></div></main>;
}
