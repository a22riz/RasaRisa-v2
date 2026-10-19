"use client";

import { useState, useTransition } from "react";
import {
  advanceFulfillmentGroup,
  requestReupload,
  updateOrderStatus,
} from "@/app/actions/admin/order";
import {
  ERRORS,
  FULFILLMENT_GROUP_LABELS,
  NEXT_GROUP_STATUS,
  NEXT_STATUS,
  STATUS_LABELS,
  type FulfillmentGroupStatus,
  type OrderStatus,
} from "@/lib/constants";

export type GroupInfo = {
  poBatchId: string;
  label: string;
  status: FulfillmentGroupStatus;
};

export function OrderActions({
  orderId,
  currentStatus,
  hasReceipt,
  groups,
}: {
  orderId: string;
  currentStatus: OrderStatus;
  hasReceipt: boolean;
  groups: GroupInfo[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setError(null);
    setSuccess(null);
  }

  function handleConfirmPayment() {
    reset();
    startTransition(async () => {
      const result = await updateOrderStatus(orderId, "PAYMENT_CONFIRMED");
      if (!result.ok) setError(result.error ?? "Terjadi kesalahan");
      else setSuccess("Pembayaran dikonfirmasi, batch mulai diproses");
    });
  }

  function handleAdvanceGroup(poBatchId: string, label: string) {
    reset();
    startTransition(async () => {
      const result = await advanceFulfillmentGroup(orderId, poBatchId);
      if (!result.ok) setError(result.error ?? "Terjadi kesalahan");
      else setSuccess(`Batch ${label} diperbarui`);
    });
  }

  function handleReupload() {
    reset();
    startTransition(async () => {
      const result = await requestReupload(orderId);
      if (!result.ok) setError(result.error ?? "Terjadi kesalahan");
      else setSuccess("Pembeli diminta unggah ulang bukti transfer");
    });
  }

  const isTerminal = currentStatus === "COMPLETED" || currentStatus === "EXPIRED";
  const isPaymentPhase = currentStatus === "WAITING_PAYMENT";
  const isFulfillmentPhase =
    currentStatus === "PAYMENT_CONFIRMED" ||
    currentStatus === "PROCESSING" ||
    currentStatus === "READY_FOR_DELIVERY";

  // Suppress unused-next-status lint: order-level NEXT_STATUS only applies to
  // the payment transition now. Fulfillment uses NEXT_GROUP_STATUS per batch.
  void NEXT_STATUS;

  return (
    <div className="space-y-3">
      {/* Payment phase: confirm payment + re-upload */}
      {isPaymentPhase && (
        <>
          {hasReceipt ? (
            <button
              type="button"
              onClick={handleConfirmPayment}
              disabled={isPending}
              className="rr-btn-primary w-full justify-center"
              style={{ borderRadius: 10, padding: 13, fontSize: 15, fontWeight: 700 }}
            >
              {isPending ? "Memproses..." : "Konfirmasi Pembayaran"}
            </button>
          ) : (
            <div className="rounded-lg border border-soft-grey bg-cream p-3 text-sm text-ink-muted text-center">
              {ERRORS.NO_RECEIPT}
            </div>
          )}

          {hasReceipt && (
            <button
              type="button"
              onClick={handleReupload}
              disabled={isPending}
              className="rr-btn-ghost w-full justify-center"
            >
              Minta Unggah Ulang Bukti
            </button>
          )}
        </>
      )}

      {/* Fulfillment phase: per-batch advance */}
      {isFulfillmentPhase && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide">
            Lanjutkan per batch
          </p>
          {groups.map((g) => {
            const next = NEXT_GROUP_STATUS[g.status];
            return (
              <div
                key={g.poBatchId}
                className="rounded-lg border border-soft-grey p-3"
                style={{ background: "var(--color-cream)" }}
              >
                <div className="flex items-baseline justify-between gap-2 mb-2">
                  <span className="text-sm font-semibold text-ink">{g.label}</span>
                  <span className="text-xs text-ink-muted">
                    {FULFILLMENT_GROUP_LABELS[g.status]}
                  </span>
                </div>
                {next ? (
                  <button
                    type="button"
                    onClick={() => handleAdvanceGroup(g.poBatchId, g.label)}
                    disabled={isPending}
                    className="rr-btn-primary w-full justify-center"
                    style={{ borderRadius: 8, padding: 9, fontSize: 13, fontWeight: 600 }}
                  >
                    {isPending ? "Memproses..." : `Lanjut ke: ${FULFILLMENT_GROUP_LABELS[next]}`}
                  </button>
                ) : (
                  <div className="text-center text-xs text-leaf font-medium py-1.5">
                    Batch selesai ✓
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Terminal */}
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
