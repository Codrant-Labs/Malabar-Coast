import type { Metadata } from "next";
import { CheckoutForm } from "../components/checkout-form";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Review and pay for your Malabar Coast order.",
  robots: { index: false, follow: false, noarchive: true, nosnippet: true },
};

export default function CheckoutPage() {
  return <CheckoutForm />;
}
