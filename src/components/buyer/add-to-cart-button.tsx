"use client";

import { useState, useTransition } from "react";
import { addItem } from "@/app/actions/cart";

export function AddToCartButton({
  productId,
  poBatchId,
  productName,
}: {
  productId: string;
  poBatchId: string;
  productName: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [showAdded, setShowAdded] = useState(false);

  function handleClick() {
    startTransition(async () => {
      await addItem(productId, poBatchId, 1);
    });
    // Toast event fires immediately (survives revalidation).
    window.dispatchEvent(
      new CustomEvent("rr-cart-added", { detail: { name: productName } }),
    );
    // Button feedback.
    setShowAdded(true);
    setTimeout(() => setShowAdded(false), 1500);
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
      {isPending ? "..." : showAdded ? "✓" : "+ Tambah"}
    </button>
  );
}
