import { CheckoutResult } from "../../components/checkout-result";

export default async function FailurePage({ searchParams }: { searchParams: Promise<{ order_id?: string }> }) {
  const { order_id } = await searchParams;
  return <CheckoutResult kind="failure" orderId={order_id} />;
}
