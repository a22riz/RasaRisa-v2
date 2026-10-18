import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/format";
import { STATUS_LABELS, type OrderStatus } from "@/lib/constants";
import { autoExpireOrders } from "@/server/orders";

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

  // Status breakdown
  const statusBreakdown = new Map<OrderStatus, number>();
  for (const order of orders) {
    statusBreakdown.set(
      order.status as OrderStatus,
      (statusBreakdown.get(order.status as OrderStatus) ?? 0) + 1,
    );
  }

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-ink">Laporan</h1>

      <form className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="from" className="block text-xs font-medium text-ink-muted">
            Dari
          </label>
          <input
            id="from"
            name="from"
            type="date"
            defaultValue={fromDate.toISOString().slice(0, 10)}
            className="mt-1 rounded-lg border border-soft-grey bg-card px-3 py-2 text-sm text-ink"
          />
        </div>
        <div>
          <label htmlFor="to" className="block text-xs font-medium text-ink-muted">
            Sampai
          </label>
          <input
            id="to"
            name="to"
            type="date"
            defaultValue={toDate.toISOString().slice(0, 10)}
            className="mt-1 rounded-lg border border-soft-grey bg-card px-3 py-2 text-sm text-ink"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-tomato px-4 py-2 text-sm font-semibold text-white transition hover:bg-tomato/90"
        >
          Filter
        </button>
      </form>

      {totalOrders === 0 ? (
        <div className="mt-6 rounded-xl border border-soft-grey bg-card p-8 text-center text-ink-muted">
          Tidak ada data untuk periode ini
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="rounded-xl border border-soft-grey bg-card p-4">
              <p className="text-sm text-ink-muted">Total Pesanan</p>
              <p className="mt-1 font-serif text-2xl font-bold text-ink">{totalOrders}</p>
            </div>
            <div className="rounded-xl border border-soft-grey bg-card p-4">
              <p className="text-sm text-ink-muted">Selesai</p>
              <p className="mt-1 font-serif text-2xl font-bold text-ink">
                {completedOrders.length}
              </p>
            </div>
            <div className="rounded-xl border border-soft-grey bg-card p-4">
              <p className="text-sm text-ink-muted">Total Pendapatan</p>
              <p className="mt-1 font-serif text-2xl font-bold text-leaf">
                {formatCurrency(totalRevenue)}
              </p>
            </div>
            <div className="rounded-xl border border-soft-grey bg-card p-4">
              <p className="text-sm text-ink-muted">Rata-rata/Pesanan</p>
              <p className="mt-1 font-serif text-2xl font-bold text-ink">
                {formatCurrency(avgOrderValue)}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-soft-grey bg-card p-4">
              <h2 className="font-serif text-lg font-bold text-ink">Produk Terlaris</h2>
              <div className="mt-3 space-y-2">
                {topProducts.length === 0 ? (
                  <p className="text-sm text-ink-muted">
                    Tidak ada data untuk periode ini
                  </p>
                ) : (
                  topProducts.map((p, idx) => (
                    <div
                      key={idx}
                      className="flex items-baseline justify-between border-b border-soft-grey pb-2 last:border-0"
                    >
                      <div>
                        <p className="font-medium text-ink">{p.name}</p>
                        <p className="text-xs text-ink-muted">{p.qty}x terjual</p>
                      </div>
                      <p className="font-medium text-ink">{formatCurrency(p.revenue)}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-xl border border-soft-grey bg-card p-4">
              <h2 className="font-serif text-lg font-bold text-ink">Status Pesanan</h2>
              <div className="mt-3 space-y-2">
                {[...statusBreakdown.entries()].map(([status, count]) => (
                  <div
                    key={status}
                    className="flex items-baseline justify-between border-b border-soft-grey pb-2 last:border-0"
                  >
                    <span className="text-sm text-ink">{STATUS_LABELS[status]}</span>
                    <span className="font-medium text-ink">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
