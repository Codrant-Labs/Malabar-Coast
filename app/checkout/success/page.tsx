import { CheckoutResult } from "../../components/checkout-result";

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ order_id?: string }> }) {
  const { order_id } = await searchParams;
  return <CheckoutResult kind="success" orderId={order_id} />;
}
