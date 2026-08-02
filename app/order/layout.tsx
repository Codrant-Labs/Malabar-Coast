import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order Status",
  robots: { index: false, follow: false, noarchive: true, nosnippet: true, noimageindex: true },
};

export default function OrderLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
