import type { Metadata } from "next";
import "./admin.css";

export const metadata: Metadata = {
  title: "Restaurant Operations",
  robots: { index: false, follow: false, noarchive: true, nosnippet: true, noimageindex: true },
};

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
