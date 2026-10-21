"use client";

import { useEffect, useState } from "react";

type CartEventDetail = { name: string };

declare global {
  interface WindowEventMap {
    "rr-cart-added": CustomEvent<CartEventDetail>;
  }
}

export function CartToast() {
  const [items, setItems] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    function onAdd(e: CustomEvent<CartEventDetail>) {
      const id = Date.now() + Math.random();
      setItems((prev) => [...prev, { id, name: e.detail.name }]);
      setTimeout(() => {
        setItems((prev) => prev.filter((x) => x.id !== id));
      }, 2500);
    }
    window.addEventListener("rr-cart-added", onAdd as EventListener);
    return () => window.removeEventListener("rr-cart-added", onAdd as EventListener);
  }, []);

  if (items.length === 0) return null;

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center max-w-[calc(100vw-2rem)]"
      style={{ bottom: 24, pointerEvents: "none" }}
    >
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-2.5 rounded-xl px-4 py-3 shadow-lg"
          style={{
            background: "var(--color-leaf)",
            color: "white",
            fontSize: 14,
            fontWeight: 600,
            animation: "toastIn 0.3s cubic-bezier(0.34,1.56,0.64,1)",
          }}
        >
          <span className="text-base">✓</span>
          <span>{item.name} ditambah ke keranjang</span>
        </div>
      ))}
    </div>
  );
}
