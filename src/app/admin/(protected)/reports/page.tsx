import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDateShort } from "@/lib/format";
import { STATUS_LABELS, type OrderStatus } from "@/lib/constants";
import { autoExpireOrders } from "@/server/orders";

const STATUS_BADGE_CLASS: Record<OrderStatus, string> = {
  WAITING_PAYMENT: "rr-status-waiting",
  PAYMENT_CONFIRMED: "rr-status-confirmed",
  PROCESSING: "rr-status-processing",
  READY_FOR_DELIVERY: "rr-status-ready",
  COMPLETED: "rr-status-done",
  EXPIRED: "rr-status-expired",
};

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  await autoExpireOrders();
  const { from, to } = await searchParams;

  const now = new Date();
  const fromDate = from ? new Date(from) : new Date(now.getFullYear(), now.getMonth(), 1);
  const toDate = to ? new Date(to) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: fromDate, lte: toDate },
    },
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
  });

  const completedOrders = orders.filter((o) => o.status === "COMPLETED");
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalOrders = orders.length;
  const avgOrderValue = completedOrders.length > 0 ? Math.round(totalRevenue / completedOrders.length) : 0;

  // Product performance
  const productStats = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const order of completedOrders) {
    for (const item of order.items) {
      const key = item.productId;
      const existing = productStats.get(key) ?? {
        name: item.product.name,
        qty: 0,
        revenue: 0,
      };
      existing.qty += item.quantity;
      existing.revenue += item.price * item.quantity;
      productStats.set(key, existing);
    }
  }

  const topProducts = [...productStats.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);
  const maxRevenue = topProducts.length > 0 ? topProducts[0].revenue : 1;

  // Status breakdown
  const statusBreakdown = new Map<OrderStatus, number>();
  for (const order of orders) {
    statusBreakdown.set(
      order.status as OrderStatus,
      (statusBreakdown.get(order.status as OrderStatus) ?? 0) + 1,
    );
  }

  const stats = [
    { icon: "📋", label: "Total Pesanan", val: String(totalOrders) },
    { icon: "✅", label: "Selesai", val: String(completedOrders.length) },
    { icon: "💰", label: "Total Pendapatan", val: formatCurrency(totalRevenue) },
    { icon: "📊", label: "Rata-rata/Pesanan", val: formatCurrency(avgOrderValue) },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif font-bold text-3xl">Laporan Keuangan</h1>
        <p className="text-ink-muted text-sm mt-0.5">
          Ringkasan {formatDateShort(fromDate)} sampai {formatDateShort(toDate)}.
        </p>
      </div>

      {/* Date filter */}
      <form className="flex flex-wrap items-end gap-3 mb-6">
        <div className="rr-field" style={{ marginBottom: 0 }}>
          <label htmlFor="from">Dari</label>
          <input
            id="from"
            name="from"
            type="date"
            defaultValue={fromDate.toISOString().slice(0, 10)}
            style={{ width: "auto" }}
          />
        </div>
        <div className="rr-field" style={{ marginBottom: 0 }}>
          <label htmlFor="to">Sampai</label>
          <input
            id="to"
            name="to"
            type="date"
            defaultValue={toDate.toISOString().slice(0, 10)}
            style={{ width: "auto" }}
          />
        </div>
        <button type="submit" className="rr-btn-primary">Filter</button>
      </form>

      {totalOrders === 0 ? (
        <div className="rr-card text-center py-12">
          <p className="text-4xl mb-3">📊</p>
          <p className="text-ink-muted">Tidak ada data untuk periode ini</p>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
            {stats.map((stat) => (
              <div key={stat.label} className="rr-stat-card">
                <div className="stat-icon">{stat.icon}</div>
                <div className="stat-label">{stat.label}</div>
                <div className="stat-val">{stat.val}</div>
              </div>
            ))}
          </div>

          <div className="grid gap-6" style={{ gridTemplateColumns: "1fr 1fr" }}>
            {/* Product performance bar chart */}
            <div className="rr-card" style={{ marginBottom: 0 }}>
              <h2 className="font-serif text-lg font-semibold mb-4">🏆 Produk Terlaris</h2>
              {topProducts.length === 0 ? (
                <p className="text-sm text-ink-muted text-center py-6">
                  Tidak ada data untuk periode ini
                </p>
              ) : (
                <div className="space-y-3">
                  {topProducts.map((p, idx) => {
                    const pct = Math.round((p.revenue / maxRevenue) * 100);
                    return (
                      <div key={idx}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-ink">{p.name}</span>
                          <span className="text-ink-muted text-xs">{p.qty}x terjual</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-7 rounded-md overflow-hidden" style={{ background: "var(--color-cream)" }}>
                            <div
                              className="h-full rounded-md flex items-center justify-end pr-2"
                              style={{
                                width: `${Math.max(pct, 8)}%`,
                                background: idx === 0
                                  ? "linear-gradient(90deg, var(--color-tomato), var(--color-turmeric))"
                                  : "linear-gradient(90deg, var(--color-turmeric), var(--color-leaf))",
                                transition: "width 0.3s",
                              }}
                            >
                              <span className="text-[11px] font-semibold text-white whitespace-nowrap">
                                {formatCurrency(p.revenue)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Status breakdown */}
            <div className="rr-card" style={{ marginBottom: 0 }}>
              <h2 className="font-serif text-lg font-semibold mb-4">📈 Status Pesanan</h2>
              <div className="space-y-2.5">
                {[...statusBreakdown.entries()].map(([status, count]) => {
                  const pct = totalOrders > 0 ? Math.round((count / totalOrders) * 100) : 0;
                  return (
                    <div key={status}>
                      <div className="flex justify-between text-sm mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`rr-status-badge ${STATUS_BADGE_CLASS[status]}`} style={{ padding: "2px 8px", fontSize: 11 }}>
                            <span className="dot" style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor" }} />
                            {STATUS_LABELS[status]}
                          </span>
                        </div>
                        <span className="text-ink-muted text-xs">{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--color-cream)" }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, background: "var(--color-tomato)" }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recent orders */}
          <div className="rr-card mt-6" style={{ marginBottom: 0, padding: 0, overflow: "hidden" }}>
            <div className="p-4 border-b border-soft-grey">
              <h2 className="font-serif text-lg font-semibold">Detail Pesanan</h2>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left p-3 px-4 text-xs font-semibold text-ink-muted uppercase tracking-wide border-b border-soft-grey bg-cream">Pesanan</th>
                    <th className="text-left p-3 px-4 text-xs font-semibold text-ink-muted uppercase tracking-wide border-b border-soft-grey bg-cream hide-mobile">Customer</th>
                    <th className="text-left p-3 px-4 text-xs font-semibold text-ink-muted uppercase tracking-wide border-b border-soft-grey bg-cream">Total</th>
                    <th className="text-left p-3 px-4 text-xs font-semibold text-ink-muted uppercase tracking-wide border-b border-soft-grey bg-cream">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-turmeric/5">
                      <td className="p-3.5 px-4 text-sm font-semibold text-tomato border-b border-soft-grey">{order.orderNumber}</td>
                      <td className="p-3.5 px-4 text-sm border-b border-soft-grey hide-mobile">{order.buyerName}</td>
                      <td className="p-3.5 px-4 text-sm font-medium border-b border-soft-grey">{formatCurrency(order.totalAmount)}</td>
                      <td className="p-3.5 px-4 border-b border-soft-grey">
                        <span className={`rr-status-badge ${STATUS_BADGE_CLASS[order.status as OrderStatus]}`} style={{ padding: "4px 10px", fontSize: 12 }}>
                          <span className="dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor" }} />
                          {STATUS_LABELS[order.status as OrderStatus]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
