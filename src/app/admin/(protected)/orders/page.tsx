import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { STATUS_LABELS, type OrderStatus } from "@/lib/constants";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { autoExpireOrders } from "@/server/orders";

const STATUS_COLORS: Record<OrderStatus, string> = {
  WAITING_PAYMENT: "bg-turmeric/20 text-ink",
  PAYMENT_CONFIRMED: "bg-turmeric/20 text-ink",
  PROCESSING: "bg-turmeric/20 text-ink",
  READY_FOR_DELIVERY: "bg-leaf/20 text-leaf",
  COMPLETED: "bg-leaf/20 text-leaf",
  EXPIRED: "bg-danger/10 text-danger",
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  await autoExpireOrders();
  const { filter } = await searchParams;

  const where = filter === "verify"
    ? { status: "WAITING_PAYMENT" as OrderStatus, receiptImage: { not: null } }
    : filter === "active"
      ? { status: { in: ["WAITING_PAYMENT", "PAYMENT_CONFIRMED", "PROCESSING", "READY_FOR_DELIVERY"] as OrderStatus[] } }
      : {};

  const orders = await prisma.order.findMany({
    where,
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
  });

  const filters = [
    { value: "", label: "Semua" },
    { value: "verify", label: "Perlu Verifikasi" },
    { value: "active", label: "Aktif" },
  ];

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-ink">Pesanan</h1>

      <div className="mt-4 flex gap-2">
        {filters.map((f) => (
          <Link
            key={f.value}
            href={f.value ? `/admin/orders?filter=${f.value}` : "/admin/orders"}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
              (filter ?? "") === f.value
                ? "border-tomato bg-tomato text-white"
                : "border-soft-grey bg-card text-ink"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        {orders.length === 0 ? (
          <div className="rounded-xl border border-soft-grey bg-card p-8 text-center text-ink-muted">
            Tidak ada data untuk periode ini
          </div>
        ) : (
          orders.map((order) => (
            <Link
              key={order.id}
              href={`/admin/orders/${order.id}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-soft-grey bg-card p-3 transition hover:border-turmeric"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-ink">{order.orderNumber}</p>
                <p className="truncate text-sm text-ink-muted">
                  {order.buyerName} - {order.items.length} item
                </p>
                <p className="text-xs text-ink-muted">{formatDateTime(order.createdAt)}</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-ink">{formatCurrency(order.totalAmount)}</p>
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status]}`}
                >
                  {STATUS_LABELS[order.status]}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
