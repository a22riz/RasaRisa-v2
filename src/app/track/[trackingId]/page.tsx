import { ReceiptUpload } from "@/components/buyer/receipt-upload";
import { Logo } from "@/components/logo";
import {
  FULFILLMENT_GROUP_LABELS,
  FULFILLMENT_GROUP_STATUSES,
  type FulfillmentGroupStatus,
  type OrderStatus,
  STATUS_LABELS,
} from "@/lib/constants";
import { formatCurrency, formatDateTime, formatPoLabel } from "@/lib/format";
import { getOrderByTracking } from "@/server/orders";
import Link from "next/link";

const TIMELINE: { status: OrderStatus; label: string; step: number }[] = [
  { status: "WAITING_PAYMENT", label: "Pesanan Dibuat", step: 1 },
  { status: "WAITING_PAYMENT", label: "Menunggu Pembayaran", step: 2 },
  { status: "PAYMENT_CONFIRMED", label: "Pembayaran Dikonfirmasi", step: 3 },
  { status: "PROCESSING", label: "Diproses", step: 4 },
  { status: "READY_FOR_DELIVERY", label: "Siap Dikirim", step: 5 },
  { status: "COMPLETED", label: "Selesai", step: 6 },
];

function statusToStep(status: OrderStatus): number {
  const map: Record<OrderStatus, number> = {
    WAITING_PAYMENT: 1,
    PAYMENT_CONFIRMED: 2,
    PROCESSING: 3,
    READY_FOR_DELIVERY: 4,
    COMPLETED: 6,
    EXPIRED: -1,
  };
  return map[status];
}

export default async function TrackingPage({
  params,
}: {
  params: Promise<{ trackingId: string }>;
}) {
  const { trackingId } = await params;
  const order = await getOrderByTracking(trackingId);

  if (!order) {
    return (
      <div className="min-h-screen">
        <header className="rr-topbar rr-topbar-centered">
          <Link href="/" className="rr-logo">
            <Logo />
          </Link>
        </header>
        <div className="text-center px-6 py-15">
          <div className="text-5xl mb-4 opacity-40">🔗</div>
          <h1 className="font-serif text-2xl mb-2.5 text-ink-muted">
            Link tidak valid atau sudah kedaluwarsa
          </h1>
          <p className="text-ink-muted mb-6">
            Cek lagi link kamu, atau hubungi kami kalau butuh bantuan.
          </p>
          <Link
            href="/"
            className="inline-block bg-ink text-white px-6 py-3 rounded-[10px] font-semibold text-sm"
          >
            Ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  const isExpired = order.status === "EXPIRED";
  const currentStep = statusToStep(order.status as OrderStatus);

  const HERO_STYLE: Record<OrderStatus, { icon: string; bg: string; fg: string }> = {
    WAITING_PAYMENT: { icon: "🧾", bg: "rgba(244,162,97,0.15)", fg: "var(--color-turmeric)" },
    PAYMENT_CONFIRMED: { icon: "✅", bg: "rgba(56,142,60,0.12)", fg: "var(--color-leaf)" },
    PROCESSING: { icon: "🍳", bg: "rgba(56,142,60,0.12)", fg: "var(--color-leaf)" },
    READY_FOR_DELIVERY: { icon: "📦", bg: "rgba(244,162,97,0.15)", fg: "var(--color-turmeric)" },
    COMPLETED: { icon: "🎉", bg: "rgba(56,142,60,0.12)", fg: "var(--color-leaf)" },
    EXPIRED: { icon: "⌛", bg: "rgba(211,47,47,0.1)", fg: "var(--color-danger)" },
  };
  const heroStyle = HERO_STYLE[order.status as OrderStatus];
  const heroIcon = heroStyle.icon;

  // Group items by ready date
  const groups = new Map<string, typeof order.items>();
  for (const item of order.items) {
    const label = formatPoLabel(item.poBatch.readyDate).replace("PO ", "");
    const group = groups.get(label) ?? [];
    group.push(item);
    groups.set(label, group);
  }

  // Get timeline history
  const historyMap = new Map<OrderStatus, string>();
  for (const h of order.statusHistory) {
    historyMap.set(h.status as OrderStatus, formatDateTime(h.createdAt));
  }

  // Detect if admin requested re-upload (specific note from requestReupload action)
  const reuploadRequest = order.statusHistory
    .filter(
      (h) =>
        h.status === "WAITING_PAYMENT" && h.note === "Admin meminta unggah ulang bukti transfer"
    )
    .slice(-1)[0];
  const showReuploadBanner = !!reuploadRequest && !order.receiptImage && !isExpired;

  // Contextual note per current status
  const stepNotes: Record<OrderStatus, { title: string; detail: React.ReactNode }> = {
    WAITING_PAYMENT: order.receiptImage
      ? {
          title: "Sedang diverifikasi admin",
          detail: "Bukti transfer sudah diunggah. Admin akan verifikasi dan konfirmasi pesananmu.",
        }
      : showReuploadBanner
        ? {
            title: "Admin meminta unggah ulang bukti transfer",
            detail: (
              <>
                Bukti transfer sebelumnya perlu diunggah ulang. Transfer sesuai total, lalu unggah
                bukti baru di bawah.
              </>
            ),
          }
        : {
            title: "Sedang menunggu bukti transfer",
            detail: (
              <>
                Unggah bukti transfer sebelum <strong>{formatDateTime(order.expiresAt)}</strong>.
                Kalau lewat, pesanan otomatis dibatalkan.
              </>
            ),
          },
    PAYMENT_CONFIRMED: {
      title: "Pembayaran terverifikasi",
      detail: "Admin sudah konfirmasi pembayaranmu. Pesanan sedang disiapkan untuk diproses.",
    },
    PROCESSING: {
      title: "Pesanan sedang diproses",
      detail:
        "Makanan sedang dimasak fresh oleh tim dapur. Tunggu sampai siap untuk diambil/diantar.",
    },
    READY_FOR_DELIVERY: {
      title: "Pesanan siap",
      detail:
        order.fulfillment === "PICKUP"
          ? "Pesanan siap diambil. Datang ke lokasi kami sesuai jadwal ready."
          : "Pesanan siap dan sedang diantar ke alamatmu. Pastikan nomor WA aktif.",
    },
    COMPLETED: {
      title: "Pesanan selesai",
      detail: "Terima kasih sudah pesan di RasaRisa. Sampai jumpa di pre-order berikutnya.",
    },
    EXPIRED: {
      title: "Pesanan kedaluwarsa",
      detail: "Pesanan dibatalkan karena bukti transfer tidak diunggah sebelum tenggat.",
    },
  };
  const stepNote = stepNotes[order.status as OrderStatus];

  return (
    <div className="min-h-screen">
      <header className="rr-topbar rr-topbar-centered">
        <Link href="/" className="rr-logo">
          <Logo />
        </Link>
      </header>

      <div className="max-w-[680px] mx-auto px-5 md:px-6 py-7 md:py-9 pb-12 md:pb-14">
        {/* Status Hero */}
        <div className="rr-track-hero">
          <div
            className="rr-track-hero-icon"
            style={{ background: heroStyle.bg, color: heroStyle.fg }}
          >
            <span aria-hidden>{heroIcon}</span>
          </div>
          <div className="rr-track-hero-body">
            <p className="text-[12px] font-semibold text-ink-muted uppercase tracking-wide mb-1">
              Pesanan {order.orderNumber}
            </p>
            <h1>{STATUS_LABELS[order.status as OrderStatus]}</h1>
            <p className="text-sm font-semibold mb-2" style={{ color: heroStyle.fg }}>
              {stepNote.title}
            </p>
            <div
              className="text-[13px] text-ink-muted px-3.5 py-2.5 rounded-lg"
              style={{ background: "var(--color-cream)" }}
            >
              {stepNote.detail}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="rr-card rr-timeline-card" style={{ borderRadius: 16 }}>
          <h2 className="font-serif text-lg font-semibold mb-6 text-ink-muted">Progress pesanan</h2>

          {TIMELINE.map((tl, idx) => {
            const isDone = idx < currentStep;
            const isCurrent = idx === currentStep;
            const isPending = !isDone && !isCurrent;
            const time = historyMap.get(tl.status);

            return (
              <div key={tl.label} className="grid relative pb-7 last:pb-0 rr-timeline-row">
                {/* Connecting line */}
                {idx < TIMELINE.length - 1 && (
                  <div
                    className="absolute"
                    style={{
                      left: 17,
                      top: 36,
                      bottom: 0,
                      width: 2,
                      background: "var(--color-soft-grey)",
                    }}
                  />
                )}

                {/* Dot */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold relative z-10"
                  style={{
                    background: isDone
                      ? "var(--color-leaf)"
                      : isCurrent
                        ? "var(--color-turmeric)"
                        : "var(--color-cream)",
                    border: `2px solid ${
                      isDone
                        ? "var(--color-leaf)"
                        : isCurrent
                          ? "var(--color-turmeric)"
                          : "var(--color-soft-grey)"
                    }`,
                    color: isDone || isCurrent ? "white" : "var(--color-ink-muted)",
                    boxShadow: isCurrent ? "0 0 0 6px rgba(244,162,97,0.18)" : undefined,
                    animation: isCurrent ? "ring 2s infinite" : undefined,
                  }}
                >
                  {isDone ? "✓" : tl.step}
                </div>

                {/* Content */}
                <div>
                  <h3
                    className="text-[15px] font-semibold mb-0.5"
                    style={{
                      color: isPending ? "var(--color-ink-muted)" : "var(--color-ink)",
                    }}
                  >
                    {tl.label}
                  </h3>
                  {isDone && time && <p className="text-xs text-leaf font-medium">{time}</p>}
                  {isCurrent && !isExpired && (
                    <p className="text-xs text-turmeric font-semibold">Sedang berlangsung</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Per-batch fulfillment progress (after payment is confirmed) */}
        {order.fulfillmentGroups.length > 0 && (
          <div className="rr-card rr-timeline-card" style={{ borderRadius: 16 }}>
            <h2 className="font-serif text-lg font-semibold mb-4">Progress per batch</h2>
            {[...order.fulfillmentGroups]
              .sort((a, b) => a.poBatch.readyDate.getTime() - b.poBatch.readyDate.getTime())
              .map((fg) => {
                const label = formatPoLabel(fg.poBatch.readyDate).replace("PO ", "");
                const current = fg.status as FulfillmentGroupStatus;
                const currentIdx = FULFILLMENT_GROUP_STATUSES.indexOf(current);
                return (
                  <div key={fg.id} className="mb-5 last:mb-0">
                    <div className="rr-ready-group-head" style={{ marginBottom: 12 }}>
                      <span className="dot" /> Ready {label}
                    </div>
                    <div className="flex items-center rr-timeline-scroll">
                      {FULFILLMENT_GROUP_STATUSES.map((st, idx) => {
                        const isDone = idx < currentIdx;
                        const isCurrent = idx === currentIdx;
                        const isLast = idx === FULFILLMENT_GROUP_STATUSES.length - 1;
                        return (
                          <div key={st} className="flex items-center flex-1 last:flex-none">
                            <div className="flex flex-col items-center gap-1">
                              <div
                                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold"
                                style={{
                                  background:
                                    isDone || isCurrent
                                      ? "var(--color-leaf)"
                                      : "var(--color-cream)",
                                  border: `2px solid ${isDone || isCurrent ? "var(--color-leaf)" : "var(--color-soft-grey)"}`,
                                  color: isDone || isCurrent ? "white" : "var(--color-ink-muted)",
                                  boxShadow: isCurrent
                                    ? "0 0 0 4px rgba(56,142,60,0.15)"
                                    : undefined,
                                }}
                              >
                                {isDone ? "✓" : idx + 1}
                              </div>
                              <span
                                className="text-[9px] font-medium text-center max-w-[70px] leading-tight"
                                style={{
                                  color:
                                    isDone || isCurrent
                                      ? "var(--color-ink)"
                                      : "var(--color-ink-muted)",
                                }}
                              >
                                {FULFILLMENT_GROUP_LABELS[st]}
                              </span>
                            </div>
                            {!isLast && (
                              <div
                                className="h-0.5 flex-1 mx-1 mb-4"
                                style={{
                                  background:
                                    idx < currentIdx
                                      ? "var(--color-leaf)"
                                      : "var(--color-soft-grey)",
                                }}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* Order summary (no personal data) */}
        <div className="rr-card" style={{ borderRadius: 16 }}>
          <h2 className="font-serif text-lg font-semibold mb-4">Detail pesanan</h2>

          {[...groups.entries()].map(([label, items]) => (
            <div key={label} className="mb-4 last:mb-0">
              <div className="rr-ready-group-head">
                <span className="dot" /> Ready {label}
              </div>
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm py-1.5 text-ink-muted">
                  <span className="min-w-0 rr-break-words">
                    {item.product.name} ×{item.quantity}
                  </span>
                  <span className="text-ink font-medium">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          ))}

          <div className="mt-4 pt-4 border-t border-soft-grey flex items-center gap-2.5 text-sm">
            <span className="text-lg">{order.fulfillment === "PICKUP" ? "🏪" : "🛵"}</span>
            <span>
              {order.fulfillment === "PICKUP"
                ? "Ambil sendiri"
                : order.fulfillment === "COD_DELIVERY"
                  ? "Antar Bayar di Tempat"
                  : "Antar ke rumah · Gratis"}
            </span>
          </div>

          {/* Upload CTA */}
          {order.status === "WAITING_PAYMENT" && !order.receiptImage && (
            <div
              className="mt-5 rounded-xl p-5 text-center"
              style={{
                background: "linear-gradient(135deg, rgba(230,57,70,0.06), rgba(244,162,97,0.06))",
                border: "1px dashed var(--color-turmeric)",
              }}
            >
              {showReuploadBanner ? (
                <>
                  <div className="flex items-center justify-center gap-2 mb-1.5">
                    <span className="text-lg">⚠️</span>
                    <h3 className="font-serif text-base text-tomato">
                      Unggah ulang bukti transfer
                    </h3>
                  </div>
                  <p className="text-[13px] text-ink-muted mb-3.5">
                    Bukti transfer sebelumnya perlu diunggah ulang. Transfer sesuai total, lalu
                    unggah bukti baru di sini.
                  </p>
                </>
              ) : (
                <>
                  <h3 className="font-serif text-base mb-1.5">Unggah bukti transfer</h3>
                  <p className="text-[13px] text-ink-muted mb-3.5">
                    Belum unggah bukti? Transfer dulu, lalu unggah di sini.
                  </p>
                </>
              )}
              <ReceiptUpload orderId={order.id} />
            </div>
          )}

          {order.receiptImage && order.status === "WAITING_PAYMENT" && (
            <div
              className="mt-5 rounded-xl p-4 text-center"
              style={{
                background: "rgba(56,142,60,0.06)",
                border: "1px solid rgba(56,142,60,0.2)",
              }}
            >
              <p className="text-sm font-semibold text-leaf">
                Bukti transfer sudah diunggah. Menunggu konfirmasi admin.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
