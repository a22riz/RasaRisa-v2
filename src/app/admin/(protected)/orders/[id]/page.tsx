import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDateTime, formatPoLabel } from "@/lib/format";
import { STATUS_LABELS, FULFILLMENT_LABELS, FULFILLMENT_GROUP_LABELS, type OrderStatus, type FulfillmentGroupStatus } from "@/lib/constants";
import { OrderActions } from "@/components/admin/order-actions";

const STATUS_BADGE_CLASS: Record<OrderStatus, string> = {
  WAITING_PAYMENT: "rr-status-waiting",
  PAYMENT_CONFIRMED: "rr-status-confirmed",
  PROCESSING: "rr-status-processing",
  READY_FOR_DELIVERY: "rr-status-ready",
  COMPLETED: "rr-status-done",
  EXPIRED: "rr-status-expired",
};

const TIMELINE: { status: OrderStatus; label: string }[] = [
  { status: "WAITING_PAYMENT", label: "Menunggu Pembayaran" },
  { status: "PAYMENT_CONFIRMED", label: "Pembayaran Dikonfirmasi" },
  { status: "PROCESSING", label: "Diproses" },
  { status: "READY_FOR_DELIVERY", label: "Siap Diambil/Dikirim" },
  { status: "COMPLETED", label: "Selesai" },
];

function statusStep(status: OrderStatus): number {
  if (status === "EXPIRED") return -1;
  return TIMELINE.findIndex((t) => t.status === status);
}

const FOOD_EMOJIS = ["🍲", "🍗", "🐟", "🥤", "🍛", "🥘"];

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: true, poBatch: true } },
      statusHistory: { orderBy: { createdAt: "asc" } },
      fulfillmentGroups: { include: { poBatch: true } },
    },
  });

  if (!order) notFound();

  const currentStep = statusStep(order.status as OrderStatus);
  const isExpired = order.status === "EXPIRED";

  // Group items by ready date
  const groups = new Map<string, typeof order.items>();
  for (const item of order.items) {
    const label = formatPoLabel(item.poBatch.readyDate).replace("PO ", "");
    const group = groups.get(label) ?? [];
    group.push(item);
    groups.set(label, group);
  }

  // Group status by ready-date label (for inline display + actions)
  const groupStatusByLabel = new Map<string, string>();
  for (const fg of order.fulfillmentGroups) {
    const label = formatPoLabel(fg.poBatch.readyDate).replace("PO ", "");
    groupStatusByLabel.set(label, fg.status);
  }

  // Group info for OrderActions
  const actionGroups = order.fulfillmentGroups
    .map((fg) => ({
      poBatchId: fg.poBatchId,
      label: formatPoLabel(fg.poBatch.readyDate),
      status: fg.status as FulfillmentGroupStatus,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const historyMap = new Map<OrderStatus, string>();
  for (const h of order.statusHistory) {
    historyMap.set(h.status as OrderStatus, formatDateTime(h.createdAt));
  }

  return (
    <div>
      <Link href="/admin/orders" className="rr-action-btn mb-4 inline-flex">
        ← Kembali ke Pesanan
      </Link>

      <div className="rr-order-detail-grid grid gap-6 items-start" style={{ gridTemplateColumns: "1fr 320px" }}>
        <div className="space-y-5 min-w-0">
          {/* Order header */}
          <div className="rr-card" style={{ marginBottom: 0 }}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h1 className="font-serif text-2xl font-bold text-ink">
                {order.orderNumber}
              </h1>
              <span className={`rr-status-badge ${STATUS_BADGE_CLASS[order.status as OrderStatus]}`}>
                <span className="dot" style={{ width: 8, height: 8, borderRadius: "50%", background: "currentColor" }} />
                {STATUS_LABELS[order.status as OrderStatus]}
              </span>
            </div>
            <p className="mt-1 text-sm text-ink-muted">
              Dibuat {formatDateTime(order.createdAt)}
              {isExpired && ` · Expired ${formatDateTime(order.expiresAt)}`}
            </p>
          </div>

          {/* Status timeline */}
          {!isExpired && (
            <div className="rr-card" style={{ marginBottom: 0 }}>
              <h2 className="font-serif text-lg font-semibold mb-4">Progress Pesanan</h2>
              <div className="flex items-center">
                {TIMELINE.map((tl, idx) => {
                  const isDone = idx <= currentStep;
                  const isCurrent = idx === currentStep;
                  return (
                    <div key={tl.status} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center gap-1.5">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{
                            background: isDone ? "var(--color-leaf)" : "var(--color-cream)",
                            border: `2px solid ${isDone ? "var(--color-leaf)" : "var(--color-soft-grey)"}`,
                            color: isDone ? "white" : "var(--color-ink-muted)",
                            boxShadow: isCurrent ? "0 0 0 4px rgba(56,142,60,0.15)" : undefined,
                          }}
                        >
                          {isDone ? "✓" : idx + 1}
                        </div>
                        <span
                          className="text-[10px] font-medium text-center max-w-[80px] leading-tight"
                          style={{ color: isDone ? "var(--color-ink)" : "var(--color-ink-muted)" }}
                        >
                          {tl.label}
                        </span>
                      </div>
                      {idx < TIMELINE.length - 1 && (
                        <div
                          className="h-0.5 flex-1 mx-1 mb-5"
                          style={{
                            background: idx < currentStep ? "var(--color-leaf)" : "var(--color-soft-grey)",
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Items grouped by ready date */}
          <div className="rr-card" style={{ marginBottom: 0 }}>
            <h2 className="font-serif text-lg font-semibold mb-4">Item Pesanan</h2>
            <div className="rounded-xl p-4" style={{ background: "var(--color-cream)" }}>
              {[...groups.entries()].map(([label, items], groupIdx) => (
                <div key={label} className={groupIdx > 0 ? "mt-4 pt-4 border-t border-soft-grey" : ""}>
                  <div className="rr-ready-group-head">
                    <span className="dot" /> Ready {label}
                    {groupStatusByLabel.has(label) && (
                      <span
                        className="ml-auto text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
                        style={{
                          background: groupStatusByLabel.get(label) === "COMPLETED"
                            ? "rgba(56,142,60,0.12)"
                            : groupStatusByLabel.get(label) === "READY_FOR_DELIVERY"
                              ? "rgba(244,162,97,0.15)"
                              : "var(--color-cream)",
                          color: groupStatusByLabel.get(label) === "COMPLETED"
                            ? "var(--color-leaf)"
                            : groupStatusByLabel.get(label) === "READY_FOR_DELIVERY"
                              ? "var(--color-turmeric)"
                              : "var(--color-ink-muted)",
                        }}
                      >
                        {FULFILLMENT_GROUP_LABELS[groupStatusByLabel.get(label) as FulfillmentGroupStatus]}
                      </span>
                    )}
                  </div>
                  {items.map((item, idx) => {
                    const emoji = FOOD_EMOJIS[idx % FOOD_EMOJIS.length];
                    return (
                      <div key={item.id} className="flex items-center justify-between py-1.5">
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">{emoji}</span>
                          <div>
                            <p className="text-sm font-medium text-ink">{item.product.name}</p>
                            <p className="text-xs text-ink-muted">{item.quantity}x {formatCurrency(item.price)}</p>
                          </div>
                        </div>
                        <p className="text-sm font-medium text-ink">{formatCurrency(item.price * item.quantity)}</p>
                      </div>
                    );
                  })}
                </div>
              ))}
              <div className="flex justify-between pt-3 mt-2 border-t-2 border-soft-grey">
                <span className="font-serif text-base font-bold">Total</span>
                <span className="font-serif text-xl font-bold text-tomato">{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Buyer data */}
          <div className="rr-card" style={{ marginBottom: 0 }}>
            <h2 className="font-serif text-lg font-semibold mb-3">Data Pembeli</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-muted">Nama</dt>
                <dd className="font-medium text-ink">{order.buyerName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">WhatsApp</dt>
                <dd className="font-medium text-ink">{order.buyerWa}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Pengiriman</dt>
                <dd className="font-medium text-ink">{FULFILLMENT_LABELS[order.fulfillment]}</dd>
              </div>
              {order.address && (
                <div className="flex justify-between gap-4">
                  <dt className="shrink-0 text-ink-muted">Alamat</dt>
                  <dd className="text-right font-medium text-ink">{order.address}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Receipt */}
          {order.receiptImage ? (
            <div className="rr-card" style={{ marginBottom: 0 }}>
              <h2 className="font-serif text-lg font-semibold mb-3">🧾 Bukti Transfer</h2>
              <div className="overflow-hidden rounded-lg border border-soft-grey">
                <img
                  src={`/api/uploads/${order.receiptImage}`}
                  alt="Bukti transfer"
                  className="w-full"
                />
              </div>
              <p className="text-xs text-ink-muted mt-2">
                Diunggah {order.receiptUploadedAt ? formatDateTime(order.receiptUploadedAt) : "-"}
              </p>
            </div>
          ) : (
            <div className="rr-card" style={{ marginBottom: 0 }}>
              <h2 className="font-serif text-lg font-semibold mb-2">🧾 Bukti Transfer</h2>
              <div className="rounded-lg p-4 text-center" style={{ background: "var(--color-cream)", border: "1px dashed var(--color-soft-grey)" }}>
                <p className="text-sm text-ink-muted">Menunggu bukti transfer dari pembeli</p>
              </div>
            </div>
          )}

          {/* Status history */}
          <div className="rr-card" style={{ marginBottom: 0 }}>
            <h2 className="font-serif text-lg font-semibold mb-3">Riwayat Status</h2>
            <div className="space-y-2">
              {order.statusHistory.map((h) => (
                <div key={h.id} className="flex items-baseline justify-between border-b border-soft-grey pb-2 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-ink">
                      {STATUS_LABELS[h.status as OrderStatus]}
                    </p>
                    {h.note && <p className="text-xs text-ink-muted">{h.note}</p>}
                  </div>
                  <p className="text-xs text-ink-muted">{formatDateTime(h.createdAt)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions sidebar */}
        <div className="sticky top-8">
          <div className="rr-card" style={{ marginBottom: 0 }}>
            <h2 className="font-serif text-lg font-semibold mb-3">Aksi Pesanan</h2>
            <OrderActions
              orderId={order.id}
              currentStatus={order.status as OrderStatus}
              hasReceipt={!!order.receiptImage}
              groups={actionGroups}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
