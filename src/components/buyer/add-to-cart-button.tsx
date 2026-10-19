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
      className="bg-tomato text-white rounded-lg px-4 py-2 text-[13px] font-semibold transition hover:bg-tomato-dark disabled:opacity-50"
    >
      {isPending ? "..." : "+ Tambah"}
    </button>
  );
}
