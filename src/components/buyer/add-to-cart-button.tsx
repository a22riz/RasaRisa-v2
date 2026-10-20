"use client";

import { useState, useTransition } from "react";
import { addItem } from "@/app/actions/cart";

export function AddToCartButton({
  productId,
  poBatchId,
}: {
  productId: string;
  poBatchId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [showAdded, setShowAdded] = useState(false);

  function handleClick() {
    startTransition(async () => {
      await addItem(productId, poBatchId, 1);
      // Brief "Ditambah" feedback so the buyer sees the add landed.
      setShowAdded(true);
      await new Promise((r) => setTimeout(r, 1200));
      setShowAdded(false);
    });
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={handleClick}
      aria-live="polite"
      className="bg-tomato text-white rounded-lg px-4 py-2 text-[13px] font-semibold transition hover:bg-tomato-dark disabled:opacity-50"
      style={{
        animation: showAdded ? "btnPop 0.3s ease" : undefined,
        background: showAdded ? "var(--color-leaf)" : undefined,
      }}
    >
      {isPending ? "..." : showAdded ? "✓ Ditambah" : "+ Tambah"}
    </button>
  );
}
