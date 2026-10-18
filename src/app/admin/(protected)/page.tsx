import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { autoExpireOrders } from "@/server/orders";
import { formatCurrency } from "@/lib/format";

export default async function AdminDashboardPage() {
  // Lazy auto-expire on admin access
  await autoExpireOrders();

  const [needVerification, todayOrders, totalRevenue, activePoCount, recentOrders] =
    await Promise.all([
      prisma.order.count({
        where: {
          status: "WAITING_PAYMENT",
          receiptImage: { not: null },
        },
      }),
      prisma.order.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.order.aggregate({
        where: { status: "COMPLETED" },
        _sum: { totalAmount: true },
      }),
      prisma.poBatch.count({
        where: { status: "OPEN" },
      }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { items: { include: { product: true } } },
      }),
    ]);

  const stats = [
    { label: "Perlu Verifikasi", value: needVerification, href: "/admin/orders?filter=verify", color: "tomato" },
    { label: "Pesanan Hari Ini", value: todayOrders, href: "/admin/orders", color: "turmeric" },
    { label: "Total Pendapatan", value: formatCurrency(totalRevenue._sum.totalAmount ?? 0), href: "/admin/reports", color: "leaf" },
    { label: "PO Aktif", value: activePoCount, href: "/admin/po", color: "ink" },
  ];

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-ink">Dashboard</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-xl border border-soft-grey bg-card p-4 transition hover:border-turmeric"
          >
            <p className="text-sm text-ink-muted">{stat.label}</p>
            <p className="mt-1 font-serif text-2xl font-bold text-ink">
              {stat.value}
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <div className="flex items-baseline justify-between">
          <h2 className="font-serif text-xl font-bold text-ink">Pesanan Terbaru</h2>
          <Link
            href="/admin/orders"
            className="text-sm font-medium text-tomato"
          >
            Lihat Semua
          </Link>
        </div>
        <div className="mt-4 space-y-2">
          {recentOrders.length === 0 ? (
            <div className="rounded-xl border border-soft-grey bg-card p-6 text-center text-ink-muted">
              Belum ada pesanan.
            </div>
          ) : (
            recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="flex items-center justify-between rounded-lg border border-soft-grey bg-card p-3 transition hover:border-turmeric"
              >
                <div>
                  <p className="font-medium text-ink">{order.orderNumber}</p>
                  <p className="text-sm text-ink-muted">
                    {order.buyerName} - {order.items.length} item
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-ink">
                    {formatCurrency(order.totalAmount)}
                  </p>
                  <p className="text-sm text-ink-muted">
                    {order.status.replace(/_/g, " ").toLowerCase()}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
