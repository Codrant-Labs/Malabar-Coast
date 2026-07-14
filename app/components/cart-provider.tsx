"use client";

import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getMenuItem, type MenuItem } from "../lib/menu";
import { CartDrawer } from "./cart-drawer";

export type CartItem = { id: string; quantity: number; note?: string };
export type CartLine = CartItem & { menuItem: MenuItem; lineTotalPence: number };

type CartContextValue = {
  items: CartItem[];
  lines: CartLine[];
  itemCount: number;
  subtotalPence: number;
  isCartOpen: boolean;
  hydrated: boolean;
  addItem: (id: string) => void;
  removeItem: (id: string) => void;
  setQuantity: (id: string, quantity: number) => void;
  setNote: (id: string, note: string) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const storageKey = "malabar-coast-cart-v1";

function safeStoredCart(): CartItem[] {
  try {
    const value = window.localStorage.getItem(storageKey);
    if (!value) return [];
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const candidate = item as Partial<CartItem>;
      if (typeof candidate.id !== "string" || !getMenuItem(candidate.id)) return [];
      const quantity = Math.min(20, Math.max(1, Number(candidate.quantity) || 1));
      return [{ id: candidate.id, quantity, note: typeof candidate.note === "string" ? candidate.note.slice(0, 240) : "" }];
    });
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isCartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setItems(safeStoredCart());
      setHydrated(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(storageKey, JSON.stringify(items));
  }, [hydrated, items]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setCartOpen(false));
    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  useEffect(() => {
    if (!isCartOpen) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setCartOpen(false);
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isCartOpen]);

  const addItem = useCallback((id: string) => {
    const item = getMenuItem(id);
    if (!item?.available) return;
    setItems((current) => {
      const existing = current.find((line) => line.id === id);
      if (existing) return current.map((line) => line.id === id ? { ...line, quantity: Math.min(20, line.quantity + 1) } : line);
      return [...current, { id, quantity: 1 }];
    });
    setCartOpen(true);
  }, []);

  const removeItem = useCallback((id: string) => setItems((current) => current.filter((item) => item.id !== id)), []);
  const setQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) return removeItem(id);
    setItems((current) => current.map((item) => item.id === id ? { ...item, quantity: Math.min(20, quantity) } : item));
  }, [removeItem]);
  const setNote = useCallback((id: string, note: string) => setItems((current) => current.map((item) => item.id === id ? { ...item, note: note.slice(0, 240) } : item)), []);
  const clearCart = useCallback(() => setItems([]), []);

  const lines = useMemo(() => items.flatMap((item) => {
    const menuItem = getMenuItem(item.id);
    return menuItem?.available ? [{ ...item, menuItem, lineTotalPence: menuItem.pricePence * item.quantity }] : [];
  }), [items]);
  const itemCount = lines.reduce((total, line) => total + line.quantity, 0);
  const subtotalPence = lines.reduce((total, line) => total + line.lineTotalPence, 0);

  const value = useMemo<CartContextValue>(() => ({
    items, lines, itemCount, subtotalPence, isCartOpen, hydrated,
    addItem, removeItem, setQuantity, setNote, clearCart,
    openCart: () => setCartOpen(true), closeCart: () => setCartOpen(false),
  }), [items, lines, itemCount, subtotalPence, isCartOpen, hydrated, addItem, removeItem, setQuantity, setNote, clearCart]);

  return <CartContext.Provider value={value}>{children}<CartDrawer /></CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
