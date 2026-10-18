import Link from "next/link";
import { getOrderByTracking } from "@/server/orders";
import { formatCurrency, formatDateTime, formatDate } from "@/lib/format";
import { STATUS_LABELS, type OrderStatus } from "@/lib/constants";

const TIMELINE_ORDER: OrderStatus[] = [
  "WAITING_PAYMENT",
  "PAYMENT_CONFIRMED",
  "PROCESSING",
  "READY_FOR_DELIVERY",
  "COMPLETED",
];

export default async function TrackingPage({
  params,
}: {
  params: Promise<{ trackingId: string }>;
}) {
  const { trackingId } = await params;
  const order = await getOrderByTracking(trackingId);

  if (!order) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="rounded-xl border border-soft-grey bg-card p-8 text-center">
          <h1 className="font-serif text-xl font-bold text-ink">
            Link tidak valid atau sudah kedaluwarsa
          </h1>
          <Link
            href="/"
            className="mt-4 inline-block rounded-lg bg-tomato px-4 py-2 text-sm font-semibold text-white"
          >
            Ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  const isExpired = order.status === "EXPIRED";
  const currentStep = TIMELINE_ORDER.indexOf(order.status);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-soft-grey bg-cream/95 backdrop-blur">
        <div className="mx-auto max-w-2xl px-4 py-3">
          <Link href="/" className="font-serif text-xl font-bold text-tomato">
            RasaRisa
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6 text-center">
          <h1 className="font-serif text-2xl font-bold text-ink">
            Lacak Pesanan
          </h1>
          <p className="mt-1 text-sm text-ink-muted">{order.orderNumber}</p>
        </div>

        {isExpired ? (
          <div className="rounded-xl border border-danger bg-danger/10 p-6 text-center">
            <p className="font-serif text-lg font-bold text-danger">
              Pesanan Kedaluwarsa
            </p>
            <p className="mt-1 text-sm text-ink-muted">
              Bukti transfer tidak diunggah dalam batas waktu.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {TIMELINE_ORDER.map((status, idx) => {
              const done = idx <= currentStep && currentStep >= 0;
              const isCurrent = idx === currentStep;
              return (
                <div
                  key={status}
                  className={`flex items-center gap-3 rounded-lg border p-3 ${
                    isCurrent
                      ? "border-tomato bg-tomato/5"
                      : done
                        ? "border-leaf bg-leaf/5"
                        : "border-soft-grey bg-card"
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                      done
                        ? "bg-leaf text-white"
                        : isCurrent
                          ? "bg-tomato text-white"
                          : "bg-soft-grey text-ink-muted"
                    }`}
                  >
                    {done && !isCurrent ? "OK" : idx + 1}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      done || isCurrent ? "text-ink" : "text-ink-muted"
                    }`}
                  >
                    {STATUS_LABELS[status]}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 rounded-xl border border-soft-grey bg-card p-4">
          <h2 className="font-serif text-lg font-bold text-ink">Item Pesanan</h2>
          <div className="mt-3 space-y-2">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-baseline justify-between border-b border-soft-grey pb-2 last:border-0"
              >
                <div>
                  <p className="font-medium text-ink">{item.product.name}</p>
                  <p className="text-xs text-ink-muted">{item.quantity}x</p>
                </div>
                <p className="font-medium text-ink">
                  {formatCurrency(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="font-serif text-lg font-bold text-ink">Total</span>
            <span className="font-serif text-xl font-bold text-tomato">
              {formatCurrency(order.totalAmount)}
            </span>
          </div>
        </div>

        {order.fulfillment === "DELIVERY" && (
          <div className="mt-4 rounded-xl border border-soft-grey bg-card p-4">
            <p className="text-sm text-ink-muted">
              Pesanan akan diantar sesuai jadwal.
            </p>
          </div>
        )}

        {order.status === "READY_FOR_DELIVERY" && (
          <div className="mt-4 rounded-xl border border-leaf bg-leaf/10 p-4">
            <p className="font-serif text-lg font-bold text-leaf">
              Siap diambil!
            </p>
            <p className="mt-1 text-sm text-ink">
              {order.fulfillment === "PICKUP"
                ? `Ambil pesanan kamu pada ${formatDate(order.items[0]?.poBatch?.readyDate ?? order.createdAt)}`
                : "Pesanan akan segera diantar."}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
