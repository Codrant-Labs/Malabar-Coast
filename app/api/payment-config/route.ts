import { NextResponse } from "next/server";
import { getDeliveryFeePence } from "../../lib/orders";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    stripe: Boolean(process.env.STRIPE_SECRET_KEY),
    worldpay: Boolean(process.env.NEXT_PUBLIC_WORLDPAY_CHECKOUT_ID && process.env.WORLDPAY_USERNAME && process.env.WORLDPAY_PASSWORD && process.env.WORLDPAY_MERCHANT_ENTITY),
    worldpayCheckoutId: process.env.NEXT_PUBLIC_WORLDPAY_CHECKOUT_ID || "",
    worldpayEnvironment: process.env.WORLDPAY_ENVIRONMENT === "live" ? "live" : "try",
    deliveryFeePence: getDeliveryFeePence(),
  });
}
