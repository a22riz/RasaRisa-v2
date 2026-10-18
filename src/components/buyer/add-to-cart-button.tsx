"use client";

import { useTransition } from "react";
import { addItem } from "@/app/actions/cart";

export function AddToCartButton({
  productId,
  poBatchId,
}: {
  productId: string;
  poBatchId: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(async () => { await addItem(productId, poBatchId, 1); })}
      className="rounded-lg bg-tomato px-4 py-2 text-sm font-semibold text-white transition hover:bg-tomato/90 disabled:opacity-50"
    >
      {isPending ? "..." : "Tambah"}
    </button>
  );
}
