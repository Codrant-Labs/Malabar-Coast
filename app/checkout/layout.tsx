import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Secure Checkout",
  robots: { index: false, follow: false, noarchive: true, nosnippet: true },
};

export default function CheckoutLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}

