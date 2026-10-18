import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { STATUS_LABELS, FULFILLMENT_LABELS } from "@/lib/constants";
import { OrderActions } from "@/components/admin/order-actions";
import type { OrderStatus } from "@/lib/constants";

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
    },
  });

  if (!order) notFound();

  return (
    <div>
      <Link
        href="/admin/orders"
        className="mb-4 inline-block text-sm font-medium text-tomato"
      >
        Kembali ke Pesanan
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="rounded-xl border border-soft-grey bg-card p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h1 className="font-serif text-xl font-bold text-ink">
                {order.orderNumber}
              </h1>
              <span className="rounded-full bg-turmeric/20 px-3 py-0.5 text-sm font-medium text-ink">
                {STATUS_LABELS[order.status as OrderStatus]}
              </span>
            </div>
            <p className="mt-1 text-sm text-ink-muted">
              {formatDateTime(order.createdAt)}
            </p>
          </div>

          <div className="rounded-xl border border-soft-grey bg-card p-4">
            <h2 className="font-serif text-lg font-bold text-ink">Item</h2>
            <div className="mt-3 space-y-2">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-baseline justify-between border-b border-soft-grey pb-2 last:border-0"
                >
                  <div>
                    <p className="font-medium text-ink">{item.product.name}</p>
                    <p className="text-xs text-ink-muted">
                      {item.quantity}x {formatCurrency(item.price)}
                    </p>
                  </div>
                  <p className="font-medium text-ink">
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                </div>
              ))}
              <div className="flex items-baseline justify-between pt-2">
                <span className="font-serif text-lg font-bold text-ink">Total</span>
                <span className="font-serif text-xl font-bold text-tomato">
                  {formatCurrency(order.totalAmount)}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-soft-grey bg-card p-4">
            <h2 className="font-serif text-lg font-bold text-ink">Data Pembeli</h2>
            <dl className="mt-3 space-y-2 text-sm">
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
                <dd className="font-medium text-ink">
                  {FULFILLMENT_LABELS[order.fulfillment]}
                </dd>
              </div>
              {order.address && (
                <div className="flex justify-between gap-4">
                  <dt className="shrink-0 text-ink-muted">Alamat</dt>
                  <dd className="text-right font-medium text-ink">{order.address}</dd>
                </div>
              )}
            </dl>
          </div>

          {order.receiptImage && (
            <div className="rounded-xl border border-soft-grey bg-card p-4">
              <h2 className="font-serif text-lg font-bold text-ink">Bukti Transfer</h2>
              <div className="mt-3 overflow-hidden rounded-lg border border-soft-grey">
                <img
                  src={`/api/uploads/${order.receiptImage}`}
                  alt="Bukti transfer"
                  className="w-full"
                />
              </div>
            </div>
          )}

          <div className="rounded-xl border border-soft-grey bg-card p-4">
            <h2 className="font-serif text-lg font-bold text-ink">Riwayat Status</h2>
            <div className="mt-3 space-y-2">
              {order.statusHistory.map((h) => (
                <div
                  key={h.id}
                  className="flex items-baseline justify-between border-b border-soft-grey pb-2 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-ink">
                      {STATUS_LABELS[h.status as OrderStatus]}
                    </p>
                    {h.note && (
                      <p className="text-xs text-ink-muted">{h.note}</p>
                    )}
                  </div>
                  <p className="text-xs text-ink-muted">
                    {formatDateTime(h.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:sticky lg:top-8">
          <div className="rounded-xl border border-soft-grey bg-card p-4">
            <h2 className="font-serif text-lg font-bold text-ink">Aksi</h2>
            <div className="mt-3">
              <OrderActions
                orderId={order.id}
                currentStatus={order.status as OrderStatus}
                hasReceipt={!!order.receiptImage}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
