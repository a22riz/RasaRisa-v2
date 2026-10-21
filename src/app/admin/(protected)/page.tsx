import { type OrderStatus, STATUS_LABELS } from "@/lib/constants";
import { formatCurrency, formatDateShort } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { autoExpireOrders } from "@/server/orders";
import Link from "next/link";

const STATUS_BADGE_CLASS: Record<OrderStatus, string> = {
  WAITING_PAYMENT: "rr-status-waiting",
  PAYMENT_CONFIRMED: "rr-status-confirmed",
  PROCESSING: "rr-status-processing",
  READY_FOR_DELIVERY: "rr-status-ready",
  COMPLETED: "rr-status-done",
  EXPIRED: "rr-status-expired",
};

const weekdayShort = (d: Date) => new Intl.DateTimeFormat("id-ID", { weekday: "short" }).format(d);
const monthShort = (d: Date) => new Intl.DateTimeFormat("id-ID", { month: "short" }).format(d);

function poReadySummary(items: { poBatch: { readyDate: Date | string } }[]): string {
  const dates = [
    ...new Set(
      items.map((i) => {
        const d = new Date(i.poBatch.readyDate);
        return `${d.getDate()} ${monthShort(d)}`;
      })
    ),
  ];
  return dates.join(" + ");
}

export default async function AdminDashboardPage() {
  await autoExpireOrders();

  const [needVerification, todayOrders, totalRevenue, activePoCount, recentOrders, activePos] =
    await Promise.all([
      prisma.order.count({
        where: { status: "WAITING_PAYMENT", receiptImage: { not: null } },
      }),
      prisma.order.count({
        where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      }),
      prisma.order.aggregate({
        where: { status: "COMPLETED" },
        _sum: { totalAmount: true },
      }),
      prisma.poBatch.count({ where: { status: "OPEN" } }),
      prisma.order.findMany({
        take: 8,
        orderBy: { createdAt: "desc" },
        include: { items: { include: { product: true, poBatch: true } } },
      }),
      prisma.poBatch.findMany({
        where: { status: "OPEN" },
        include: { orderItems: true },
        orderBy: { readyDate: "asc" },
        take: 3,
      }),
    ]);

  const stats = [
    { icon: "📦", label: "Pesanan hari ini", val: String(todayOrders) },
    { icon: "⏳", label: "Perlu verifikasi", val: String(needVerification) },
    {
      icon: "💰",
      label: "Pendapatan (selesai)",
      val: formatCurrency(totalRevenue._sum.totalAmount ?? 0),
    },
    { icon: "📅", label: "PO aktif", val: String(activePoCount) },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-serif font-bold text-3xl">Selamat datang, Risa 👋</h1>
          <p className="text-ink-muted text-sm mt-0.5">
            Ini ringkasan RasaRisa hari ini, {formatDateShort(new Date())}.
          </p>
        </div>
        <div className="flex gap-2.5 flex-wrap">
          <Link href="/admin/po" className="rr-btn-ghost">
            📅 Kelola PO
          </Link>
          <Link href="/admin/po" className="rr-btn-primary">
            + Buka PO Baru
          </Link>
        </div>
      </div>

      <div
        className="grid gap-4 mb-7"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}
      >
        {stats.map((stat) => (
          <div key={stat.label} className="rr-stat-card">
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-label">{stat.label}</div>
            <div className="stat-val">{stat.val}</div>
          </div>
        ))}
      </div>

      {activePos.length > 0 && (
        <div className="rr-card" style={{ marginBottom: 24, padding: 0, overflow: "hidden" }}>
          <div className="flex justify-between items-center p-5 border-b border-soft-grey">
            <h2 className="font-serif text-xl font-semibold">📅 PO yang sedang berjalan</h2>
            <Link href="/admin/po" className="rr-btn-ghost text-sm">
              Lihat semua
            </Link>
          </div>
          <div className="flex flex-col gap-3 p-4">
            {activePos.map((po) => {
              const ready = new Date(po.readyDate);
              const close = new Date(po.closeDate);
              const hoursLeft = Math.round((close.getTime() - Date.now()) / 3600000);
              const poStatus =
                hoursLeft < 0
                  ? { class: "closed", label: "Selesai" }
                  : hoursLeft < 6
                    ? { class: "soon", label: `Tutup ${hoursLeft} jam` }
                    : { class: "open", label: "Dibuka" };
              return (
                <div
                  key={po.id}
                  className="grid items-center rounded-xl p-4.5 border border-soft-grey bg-card transition hover:bg-cream rr-po-row-grid"
                >
                  <div className="rr-po-date-badge">
                    <span className="day">{weekdayShort(ready)}</span>
                    <span className="num">{ready.getDate()}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-[15px] mb-0.5">
                      PO {weekdayShort(ready)}, {ready.getDate()} {monthShort(ready)}
                    </div>
                    <div className="text-[13px] text-ink-muted">
                      Tutup {weekdayShort(close)}, {close.getDate()} {monthShort(close)}{" "}
                      {String(close.getHours()).padStart(2, "0")}.
                      {String(close.getMinutes()).padStart(2, "0")}
                    </div>
                  </div>
                  <div className="rr-grid-actions">
                    <div className="text-center rounded-lg bg-cream p-1.5">
                      <strong className="block font-serif text-lg text-ink leading-none">
                        {po.orderItems.length}
                      </strong>
                      <span className="text-[11px] text-ink-muted">pesanan</span>
                    </div>
                    <span className={`rr-po-status ${poStatus.class}`}>{poStatus.label}</span>
                    <Link
                      href="/admin/orders"
                      className="rr-action-btn primary justify-self-center"
                    >
                      Lihat
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="rr-card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="p-4 border-b border-soft-grey flex gap-2 flex-wrap items-center">
          <Link
            href="/admin/orders?filter=verify"
            className={`rr-filter-chip ${needVerification > 0 ? "active" : ""}`}
          >
            Perlu verifikasi ({needVerification})
          </Link>
          <Link href="/admin/orders" className="rr-filter-chip">
            Semua
          </Link>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left p-3 px-4 text-xs font-semibold text-ink-muted uppercase tracking-wide border-b border-soft-grey bg-cream">
                  Pesanan
                </th>
                <th className="text-left p-3 px-4 text-xs font-semibold text-ink-muted uppercase tracking-wide border-b border-soft-grey bg-cream hide-mobile">
                  Customer
                </th>
                <th className="text-left p-3 px-4 text-xs font-semibold text-ink-muted uppercase tracking-wide border-b border-soft-grey bg-cream hide-mobile">
                  PO Ready
                </th>
                <th className="text-left p-3 px-4 text-xs font-semibold text-ink-muted uppercase tracking-wide border-b border-soft-grey bg-cream">
                  Total
                </th>
                <th className="text-left p-3 px-4 text-xs font-semibold text-ink-muted uppercase tracking-wide border-b border-soft-grey bg-cream">
                  Status
                </th>
                <th className="text-left p-3 px-4 text-xs font-semibold text-ink-muted uppercase tracking-wide border-b border-soft-grey bg-cream">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-ink-muted">
                    Belum ada pesanan.
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => {
                  const poReady = poReadySummary(order.items);
                  const needsAction = order.status === "WAITING_PAYMENT" && order.receiptImage;
                  return (
                    <tr key={order.id} className="hover:bg-turmeric/5">
                      <td className="p-3.5 px-4 text-sm font-semibold text-tomato border-b border-soft-grey">
                        {order.orderNumber}
                      </td>
                      <td className="p-3.5 px-4 text-sm border-b border-soft-grey hide-mobile">
                        {order.buyerName}
                      </td>
                      <td className="p-3.5 px-4 text-sm text-ink-muted border-b border-soft-grey hide-mobile">
                        {poReady}
                      </td>
                      <td className="p-3.5 px-4 text-sm font-medium border-b border-soft-grey">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="p-3.5 px-4 border-b border-soft-grey">
                        <span
                          className={`rr-status-badge ${STATUS_BADGE_CLASS[order.status as OrderStatus]}`}
                          style={{ padding: "4px 10px", fontSize: 12 }}
                        >
                          <span
                            className="dot"
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              background: "currentColor",
                            }}
                          />
                          {STATUS_LABELS[order.status as OrderStatus]}
                        </span>
                      </td>
                      <td className="p-3.5 px-4 border-b border-soft-grey">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className={`rr-action-btn ${needsAction ? "primary" : ""}`}
                        >
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
