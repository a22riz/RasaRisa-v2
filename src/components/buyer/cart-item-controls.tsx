"use client";

import { useTransition } from "react";
import { changeQuantity, removeItem } from "@/app/actions/cart";
import { formatCurrency } from "@/lib/format";

export function CartItemControls({
  productId,
  poBatchId,
  quantity,
  price,
}: {
  productId: string;
  poBatchId: string;
  quantity: number;
  price: number;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <div className="rr-qty" aria-disabled={isPending}>
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await changeQuantity(productId, poBatchId, quantity - 1);
            })
          }
        >
          −
        </button>
        <span>{quantity}</span>
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await changeQuantity(productId, poBatchId, quantity + 1);
            })
          }
        >
          +
        </button>
      </div>
      <div className="text-right">
        <div className="font-bold text-sm min-w-[70px]">
          {formatCurrency(price * quantity)}
        </div>
        <button
          className="text-ink-muted hover:text-danger text-base px-1"
          type="button"
          disabled={isPending}
          aria-label="Hapus item"
          onClick={() =>
            startTransition(async () => {
              await removeItem(productId, poBatchId);
            })
          }
        >
          ✕
        </button>
      </div>
    </>
  );
}
