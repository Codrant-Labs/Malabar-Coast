"use client";

import { useState } from "react";
import { useCart } from "./cart-provider";

export function AddToOrder({ id, compact = false }: { id: string; compact?: boolean }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  return (
    <button
      className={`addToOrder ${compact ? "isCompact" : ""} ${added ? "isAdded" : ""}`}
      type="button"
      onClick={() => {
        addItem(id);
        setAdded(true);
        window.setTimeout(() => setAdded(false), 1200);
      }}
    >
      <span>{added ? "Added" : "Add to order"}</span><b aria-hidden="true">{added ? "✓" : "+"}</b>
    </button>
  );
}
