import { CheckoutResult } from "../../components/checkout-result";

export default async function CancelledPage({ searchParams }: { searchParams: Promise<{ order_id?: string }> }) {
  const { order_id } = await searchParams;
  return <CheckoutResult kind="cancelled" orderId={order_id} />;
}
