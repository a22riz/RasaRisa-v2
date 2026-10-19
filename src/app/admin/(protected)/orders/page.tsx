import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { STATUS_LABELS, type OrderStatus } from "@/lib/constants";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { autoExpireOrders } from "@/server/orders";

const STATUS_BADGE_CLASS: Record<OrderStatus, string> = {
  WAITING_PAYMENT: "rr-status-waiting",
  PAYMENT_CONFIRMED: "rr-status-confirmed",
  PROCESSING: "rr-status-processing",
  READY_FOR_DELIVERY: "rr-status-ready",
  COMPLETED: "rr-status-done",
  EXPIRED: "rr-status-expired",
};

const monthShort = (d: Date) =>
  new Intl.DateTimeFormat("id-ID", { month: "short" }).format(d);

function poReadySummary(items: { poBatch: { readyDate: Date | string } }[]): string {
  const dates = [...new Set(items.map((i) => {
    const d = new Date(i.poBatch.readyDate);
    return `${d.getDate()} ${monthShort(d)}`;
  }))];
  return dates.join(" + ");
}

const filters = [
  { value: "", label: "Semua" },
  { value: "verify", label: "Perlu Verifikasi" },
  { value: "active", label: "Aktif" },
  { value: "done", label: "Selesai" },
];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  await autoExpireOrders();
  const { filter } = await searchParams;

  const where =
    filter === "verify"
      ? { status: "WAITING_PAYMENT" as OrderStatus, receiptImage: { not: null } }
      : filter === "active"
        ? { status: { in: ["WAITING_PAYMENT", "PAYMENT_CONFIRMED", "PROCESSING", "READY_FOR_DELIVERY"] as OrderStatus[] } }
        : filter === "done"
          ? { status: { in: ["COMPLETED", "EXPIRED"] as OrderStatus[] } }
          : {};

  const orders = await prisma.order.findMany({
    where,
    include: { items: { include: { product: true, poBatch: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="font-serif font-bold text-3xl mb-6">Pesanan</h1>

      <div className="flex gap-2 mb-4 flex-wrap">
        {filters.map((f) => (
          <Link
            key={f.value}
            href={f.value ? `/admin/orders?filter=${f.value}` : "/admin/orders"}
            className={`rr-filter-chip ${(filter ?? "") === f.value ? "active" : ""}`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="rr-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left p-3 px-4 text-xs font-semibold text-ink-muted uppercase tracking-wide border-b border-soft-grey bg-cream">Pesanan</th>
                <th className="text-left p-3 px-4 text-xs font-semibold text-ink-muted uppercase tracking-wide border-b border-soft-grey bg-cream hide-mobile">Customer</th>
                <th className="text-left p-3 px-4 text-xs font-semibold text-ink-muted uppercase tracking-wide border-b border-soft-grey bg-cream hide-mobile">PO Ready</th>
                <th className="text-left p-3 px-4 text-xs font-semibold text-ink-muted uppercase tracking-wide border-b border-soft-grey bg-cream hide-mobile">Tanggal</th>
                <th className="text-left p-3 px-4 text-xs font-semibold text-ink-muted uppercase tracking-wide border-b border-soft-grey bg-cream">Total</th>
                <th className="text-left p-3 px-4 text-xs font-semibold text-ink-muted uppercase tracking-wide border-b border-soft-grey bg-cream">Status</th>
                <th className="text-left p-3 px-4 text-xs font-semibold text-ink-muted uppercase tracking-wide border-b border-soft-grey bg-cream">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-ink-muted">
                    Tidak ada data untuk periode ini
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const poReady = poReadySummary(order.items);
                  const needsAction = order.status === "WAITING_PAYMENT" && order.receiptImage;
                  return (
                    <tr key={order.id} className="hover:bg-turmeric/5">
                      <td className="p-3.5 px-4 text-sm font-semibold text-tomato border-b border-soft-grey">{order.orderNumber}</td>
                      <td className="p-3.5 px-4 text-sm border-b border-soft-grey hide-mobile">
                        {order.buyerName}
                        <span className="block text-xs text-ink-muted">{order.items.length} item</span>
                      </td>
                      <td className="p-3.5 px-4 text-sm text-ink-muted border-b border-soft-grey hide-mobile">{poReady}</td>
                      <td className="p-3.5 px-4 text-sm text-ink-muted border-b border-soft-grey hide-mobile">{formatDateTime(order.createdAt)}</td>
                      <td className="p-3.5 px-4 text-sm font-medium border-b border-soft-grey">{formatCurrency(order.totalAmount)}</td>
                      <td className="p-3.5 px-4 border-b border-soft-grey">
                        <span className={`rr-status-badge ${STATUS_BADGE_CLASS[order.status as OrderStatus]}`} style={{ padding: "4px 10px", fontSize: 12 }}>
                          <span className="dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor" }} />
                          {STATUS_LABELS[order.status as OrderStatus]}
                        </span>
                      </td>
                      <td className="p-3.5 px-4 border-b border-soft-grey">
                        <Link href={`/admin/orders/${order.id}`} className={`rr-action-btn ${needsAction ? "primary" : ""}`}>
                          {needsAction ? "Lihat bukti" : "Lihat"}
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
