"use client";

import { useState, useTransition } from "react";
import { updateOrderStatus, requestReupload } from "@/app/actions/admin/order";
import { STATUS_LABELS, NEXT_STATUS, ERRORS, type OrderStatus } from "@/lib/constants";

export function OrderActions({
  orderId,
  currentStatus,
  hasReceipt,
}: {
  orderId: string;
  currentStatus: OrderStatus;
  hasReceipt: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const next = NEXT_STATUS[currentStatus];
  const isTerminal = next === null;

  function handleAdvance() {
    setError(null);
    setSuccess(null);
    if (!next) return;

    if (next === "PAYMENT_CONFIRMED" && !hasReceipt) {
      setError(ERRORS.NO_RECEIPT);
      return;
    }

    startTransition(async () => {
      const result = await updateOrderStatus(orderId, next);
      if (!result.ok) {
        setError(result.error ?? "Terjadi kesalahan");
      } else {
        setSuccess("Status diperbarui");
      }
    });
  }

  function handleReupload() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await requestReupload(orderId);
      if (!result.ok) {
        setError(result.error ?? "Terjadi kesalahan");
      } else {
        setSuccess("Pembeli diminta unggah ulang bukti transfer");
      }
    });
  }

  return (
    <div className="space-y-3">
      {!isTerminal && next && (
        <button
          type="button"
          onClick={handleAdvance}
          disabled={isPending}
          className="rr-btn-primary w-full justify-center"
          style={{ borderRadius: 10, padding: 13, fontSize: 15, fontWeight: 700 }}
        >
          {isPending ? "Memproses..." : `Lanjut ke: ${STATUS_LABELS[next]}`}
        </button>
      )}

      {currentStatus === "WAITING_PAYMENT" && hasReceipt && (
        <button
          type="button"
          onClick={handleReupload}
          disabled={isPending}
          className="rr-btn-ghost w-full justify-center"
        >
          Minta Unggah Ulang Bukti
        </button>
      )}

      {currentStatus === "WAITING_PAYMENT" && !hasReceipt && (
        <div className="rounded-lg border border-turmeric bg-turmeric/10 p-3 text-sm text-ink">
          {ERRORS.NO_RECEIPT}
        </div>
      )}

      {isTerminal && (
        <div className="rounded-lg border border-soft-grey bg-cream p-3 text-sm text-ink-muted text-center">
          Status akhir. Tidak ada aksi lagi.
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-danger bg-danger/10 p-3 text-sm text-danger">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-leaf bg-leaf/10 p-3 text-sm text-leaf">
          {success}
        </div>
      )}
    </div>
  );
}
