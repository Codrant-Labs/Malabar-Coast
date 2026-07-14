"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { formatPrice } from "../lib/menu";
import { useCart } from "./cart-provider";

export function CartDrawer() {
  const { lines, itemCount, subtotalPence, isCartOpen, closeCart, removeItem, setQuantity, setNote } = useCart();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isCartOpen) return;
    const frame = window.requestAnimationFrame(() => closeRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [isCartOpen]);

  return (
    <>
      <button className={`cartScrim ${isCartOpen ? "isOpen" : ""}`} type="button" aria-label="Close order" tabIndex={-1} onClick={closeCart} />
      <aside className={`cartDrawer ${isCartOpen ? "isOpen" : ""}`} aria-label="Your order" aria-hidden={!isCartOpen} inert={!isCartOpen}>
        <header>
          <div><span>Your order</span><strong>{itemCount} {itemCount === 1 ? "item" : "items"}</strong></div>
          <button ref={closeRef} type="button" onClick={closeCart} aria-label="Close order"><i /><i /></button>
        </header>
        {lines.length === 0 ? (
          <div className="cartEmpty"><span>Nothing aboard yet.</span><p>Choose dishes from the full menu and they will appear here.</p><Link href="/menu" onClick={closeCart}>Explore the menu <b>→</b></Link></div>
        ) : (
          <>
            <div className="cartLines">
              {lines.map((line) => (
                <article className="cartLine" key={line.id}>
                  <div className="cartLineHeading"><strong>{line.menuItem.name}</strong><span>{formatPrice(line.lineTotalPence)}</span></div>
                  <p>{line.menuItem.description}</p>
                  <div className="quantityControl" aria-label={`Quantity for ${line.menuItem.name}`}>
                    <button type="button" onClick={() => setQuantity(line.id, line.quantity - 1)} aria-label="Decrease quantity">−</button>
                    <span>{line.quantity}</span>
                    <button type="button" onClick={() => setQuantity(line.id, line.quantity + 1)} aria-label="Increase quantity">+</button>
                    <button className="removeLine" type="button" onClick={() => removeItem(line.id)}>Remove</button>
                  </div>
                  <label>Dish note<textarea value={line.note ?? ""} onChange={(event) => setNote(line.id, event.target.value)} maxLength={240} placeholder="No onion, extra mild…" /></label>
                </article>
              ))}
            </div>
            <footer>
              <div><span>Subtotal</span><strong>{formatPrice(subtotalPence)}</strong></div>
              <p>Delivery fees, if selected, are calculated at checkout.</p>
              <Link href="/checkout" onClick={closeCart}>Continue to checkout <span>→</span></Link>
            </footer>
          </>
        )}
      </aside>
    </>
  );
}
