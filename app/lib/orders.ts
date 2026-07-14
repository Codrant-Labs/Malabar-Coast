import { getMenuItem } from "./menu";

export type PaymentProvider = "stripe" | "worldpay";
export type FulfilmentMethod = "collection" | "delivery";
export type OrderStatus = "pending_payment" | "paid" | "payment_failed" | "cancelled" | "expired";

export type CheckoutCartItem = { id: string; quantity: number; note?: string };
export type OrderLine = {
  menuItemId: string;
  name: string;
  unitPricePence: number;
  quantity: number;
  note: string;
  lineTotalPence: number;
};

export type CustomerDetails = {
  name: string;
  email: string;
  phone: string;
};

export type DeliveryAddress = {
  line1: string;
  line2: string;
  city: string;
  postcode: string;
};

export type OrderRecord = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: OrderStatus;
  provider: PaymentProvider;
  providerReference?: string;
  providerCheckoutUrl?: string;
  providerOutcome?: string;
  processedWebhookIds?: string[];
  customer: CustomerDetails;
  fulfilment: FulfilmentMethod;
  requestedTime: string;
  deliveryAddress?: DeliveryAddress;
  orderNote: string;
  lines: OrderLine[];
  subtotalPence: number;
  deliveryFeePence: number;
  totalPence: number;
  currency: "GBP";
};

export class CheckoutValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CheckoutValidationError";
  }
}

function cleanText(value: unknown, label: string, maxLength: number, required = true) {
  const text = typeof value === "string" ? value.trim().slice(0, maxLength) : "";
  if (required && !text) throw new CheckoutValidationError(`${label} is required.`);
  return text;
}

export function getDeliveryFeePence() {
  const configured = Number(process.env.DELIVERY_FEE_PENCE);
  return Number.isInteger(configured) && configured >= 0 ? configured : 350;
}

export function validateCheckout(input: unknown) {
  if (!input || typeof input !== "object") throw new CheckoutValidationError("Checkout details are missing.");
  const body = input as Record<string, unknown>;
  if (body.provider !== "stripe" && body.provider !== "worldpay") throw new CheckoutValidationError("Choose a payment method.");
  const provider: PaymentProvider = body.provider;
  if (body.fulfilment !== "collection" && body.fulfilment !== "delivery") throw new CheckoutValidationError("Choose collection or delivery.");
  const fulfilment: FulfilmentMethod = body.fulfilment;

  const customerInput = body.customer && typeof body.customer === "object" ? body.customer as Record<string, unknown> : {};
  const customer: CustomerDetails = {
    name: cleanText(customerInput.name, "Name", 100),
    email: cleanText(customerInput.email, "Email", 160).toLowerCase(),
    phone: cleanText(customerInput.phone, "Phone", 40),
  };
  if (!/^\S+@\S+\.\S+$/.test(customer.email)) throw new CheckoutValidationError("Enter a valid email address.");

  const cart = Array.isArray(body.cart) ? body.cart : [];
  if (cart.length === 0) throw new CheckoutValidationError("Your order is empty.");
  if (cart.length > 60) throw new CheckoutValidationError("Your order contains too many lines.");

  const combined = new Map<string, CheckoutCartItem>();
  for (const entry of cart) {
    if (!entry || typeof entry !== "object") throw new CheckoutValidationError("An order line is invalid.");
    const candidate = entry as Record<string, unknown>;
    const id = cleanText(candidate.id, "Dish", 100);
    const quantity = Number(candidate.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) throw new CheckoutValidationError("Dish quantities must be between 1 and 20.");
    const existing = combined.get(id);
    const nextQuantity = (existing?.quantity ?? 0) + quantity;
    if (nextQuantity > 20) throw new CheckoutValidationError("A dish quantity cannot exceed 20.");
    combined.set(id, { id, quantity: nextQuantity, note: cleanText(candidate.note, "Dish note", 240, false) });
  }

  const lines: OrderLine[] = Array.from(combined.values()).map((entry) => {
    const item = getMenuItem(entry.id);
    if (!item?.available) throw new CheckoutValidationError("A dish in your order is no longer available. Please review your order.");
    return { menuItemId: item.id, name: item.name, unitPricePence: item.pricePence, quantity: entry.quantity, note: entry.note ?? "", lineTotalPence: item.pricePence * entry.quantity };
  });

  let deliveryAddress: DeliveryAddress | undefined;
  if (fulfilment === "delivery") {
    const address = body.deliveryAddress && typeof body.deliveryAddress === "object" ? body.deliveryAddress as Record<string, unknown> : {};
    deliveryAddress = {
      line1: cleanText(address.line1, "Address line 1", 120),
      line2: cleanText(address.line2, "Address line 2", 120, false),
      city: cleanText(address.city, "Town or city", 80),
      postcode: cleanText(address.postcode, "Postcode", 16).toUpperCase(),
    };
  }

  const subtotalPence = lines.reduce((total, line) => total + line.lineTotalPence, 0);
  const deliveryFeePence = fulfilment === "delivery" ? getDeliveryFeePence() : 0;
  return {
    provider,
    fulfilment,
    customer,
    deliveryAddress,
    requestedTime: cleanText(body.requestedTime, "Requested time", 80),
    orderNote: cleanText(body.orderNote, "Order note", 500, false),
    lines,
    subtotalPence,
    deliveryFeePence,
    totalPence: subtotalPence + deliveryFeePence,
    worldpaySessions: body.worldpaySessions && typeof body.worldpaySessions === "object" ? body.worldpaySessions as { card?: string; cvv?: string } : undefined,
  };
}
