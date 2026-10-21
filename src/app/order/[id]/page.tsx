import { CopyButton } from "@/components/buyer/copy-button";
import { ReceiptUpload } from "@/components/buyer/receipt-upload";
import { Logo } from "@/components/logo";
import { type OrderStatus, STATUS_LABELS } from "@/lib/constants";
import { formatCurrency, formatDateTime, formatPoLabel } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { getOrderById } from "@/server/orders";
import Link from "next/link";
import { notFound } from "next/navigation";

const FOOD_EMOJIS = ["🍲", "🍗", "🐟", "🥤"];

export default async function OrderConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ track?: string }>;
}) {
  const { id } = await params;
  const { track } = await searchParams;
  const order = await getOrderById(id);
  if (!order) notFound();

  const bankSetting = await prisma.setting.findUnique({
    where: { key: "bank_account" },
  });
  const bankValue = bankSetting?.value ?? "BCA 1234567890 a.n. Rasa Risa";
  const bankParts = bankValue.split(" ");
  const bankName = bankParts[0] ?? "BCA";
  const bankNum = bankParts[1] ?? "1234567890";
  const bankHolder = bankParts.slice(2).join(" ") || "a.n. Rasa Risa";

  // Group items by ready date
  const groups = new Map<string, typeof order.items>();
  for (const item of order.items) {
    const label = formatPoLabel(item.poBatch.readyDate).replace("PO ", "");
    const group = groups.get(label) ?? [];
    group.push(item);
    groups.set(label, group);
  }

  // Detect if admin requested re-upload (specific note from requestReupload action)
  const reuploadRequest = order.statusHistory
    .filter(
      (h) =>
        h.status === "WAITING_PAYMENT" && h.note === "Admin meminta unggah ulang bukti transfer"
    )
    .slice(-1)[0];
  const showReuploadBanner = !!reuploadRequest && !order.receiptImage;

  return (
    <div className="min-h-screen">
      <header className="rr-topbar rr-topbar-centered">
        <Link href="/" className="rr-logo">
          <Logo />
        </Link>
      </header>

      {/* Success banner */}
      <div className="max-w-[720px] mx-auto mt-7 md:mt-10 px-5 md:px-6 text-center">
        <div
          className="w-18 h-18 rounded-full bg-leaf text-white inline-flex items-center justify-center text-4xl mb-4"
          style={{
            width: 72,
            height: 72,
            boxShadow: "0 8px 24px rgba(56,142,60,0.3)",
            animation: "pop 0.4s cubic-bezier(0.34,1.56,0.64,1)",
          }}
        >
          ✓
        </div>
        <h1 className="font-serif font-bold text-[1.6rem] md:text-3xl mb-2">
          Pesanan <span className="text-tomato font-bold">{order.orderNumber}</span> berhasil
          dibuat!
        </h1>
        <p className="text-ink-muted text-lg mb-1.5">
          Terima kasih, {order.buyerName}. Kami udah terima pesananmu.
        </p>
        <div className="rr-status-badge rr-status-waiting">
          <span className="dot" /> {STATUS_LABELS[order.status as OrderStatus]}
        </div>
      </div>

      <div className="max-w-[720px] mx-auto px-5 md:px-6 py-8 pb-14">
        {/* Bank details */}
        <div className="rr-card">
          <h2>📤 Transfer ke rekening ini</h2>
          <p className="rr-card-sub">
            Transfer sesuai total di bawah, lalu unggah bukti transfer di bawahnya.
          </p>

          <div
            className="rounded-xl p-5 text-center"
            style={{ background: "var(--color-cream)", border: "1px dashed var(--color-turmeric)" }}
          >
            <p className="text-[13px] font-semibold text-ink-muted uppercase tracking-wide mb-2">
              Bank {bankName}
            </p>
            <p className="font-serif text-[1.6rem] md:text-3xl font-bold tracking-wide mb-1.5 break-all">
              {bankNum}
            </p>
            <p className="text-sm text-ink-muted">{bankHolder}</p>

            <CopyButton value={bankNum} />

            <div className="mt-4 pt-4 border-t border-soft-grey flex justify-between items-center">
              <span className="text-sm text-ink-muted">Jumlah yang harus ditransfer</span>
              <span className="font-serif text-2xl font-bold text-tomato">
                {formatCurrency(order.totalAmount)}
              </span>
            </div>
            <p className="mt-3.5 text-[13px] text-danger flex items-center justify-center gap-1.5">
              ⏰ Unggah bukti sebelum {formatDateTime(order.expiresAt)}
            </p>
          </div>
        </div>

        {/* Upload receipt */}
        <div className="rr-card">
          <h2>🧾 Unggah bukti transfer</h2>
          <p className="rr-card-sub">
            Setelah transfer, unggah screenshot/foto bukti di sini. Kami verifikasi, lalu konfirmasi
            pesananmu.
          </p>

          {order.receiptImage ? (
            <div
              className="flex items-center gap-4 p-4 rounded-xl"
              style={{
                background: "rgba(56,142,60,0.06)",
                border: "1px solid rgba(56,142,60,0.2)",
              }}
            >
              <div className="w-16 h-16 rounded-lg rr-img-c flex items-center justify-center text-2xl shrink-0">
                🧾
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-leaf mb-0.5">
                  Bukti transfer berhasil diunggah
                </h3>
                <p className="text-xs text-ink-muted">
                  {order.receiptImage} ·{" "}
                  {order.receiptUploadedAt ? formatDateTime(order.receiptUploadedAt) : ""}
                </p>
              </div>
              <Link href={`/order/${order.id}?track=${track}`} className="rr-action-btn">
                Ganti
              </Link>
            </div>
          ) : (
            <div>
              {showReuploadBanner && (
                <div
                  className="flex items-center gap-2.5 p-3.5 rounded-xl mb-3"
                  style={{
                    background: "rgba(230,57,70,0.06)",
                    border: "1px solid rgba(230,57,70,0.2)",
                  }}
                >
                  <span className="text-lg">⚠️</span>
                  <p className="text-sm text-tomato font-medium">
                    Admin meminta unggah ulang bukti transfer. Transfer sesuai total, lalu unggah
                    bukti baru di bawah.
                  </p>
                </div>
              )}
              <ReceiptUpload orderId={order.id} />
            </div>
          )}
        </div>

        {/* Tracking link */}
        {track && (
          <div className="rr-card">
            <h2>🔗 Pantau pesananmu</h2>
            <p className="rr-card-sub">
              Simpan link ini. Kamu bisa cek status pesanan kapan saja tanpa chat kami.
            </p>

            <div
              className="rounded-xl p-5 flex flex-col md:flex-row md:items-center gap-4"
              style={{
                background: "linear-gradient(135deg, rgba(230,57,70,0.06), rgba(244,162,97,0.06))",
                border: "1px solid rgba(230,57,70,0.15)",
              }}
            >
              <div className="w-11 h-11 rounded-[10px] bg-tomato text-white flex items-center justify-center text-2xl shrink-0">
                📍
              </div>
              <div className="flex-1 min-w-0 md:min-w-[200px]">
                <h3 className="font-serif text-base font-semibold mb-0.5">Link tracking pesanan</h3>
                <p className="text-[13px] text-ink-muted rr-break-words">
                  rasarisa.id/track/{track}
                </p>
              </div>
              <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                <CopyButton
                  path={`/track/${track}`}
                  label="📋 Salin link"
                  className="rr-btn-ghost w-full md:w-auto justify-center"
                />
                <Link
                  href={`/track/${track}`}
                  className="rr-btn-ghost w-full md:w-auto justify-center"
                  style={{
                    background: "var(--color-ink)",
                    color: "white",
                    borderColor: "var(--color-ink)",
                  }}
                >
                  Buka tracking →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Order summary mini */}
        <div className="rr-card">
          <h2>Ringkasan pesanan</h2>
          <p className="rr-card-sub">
            {order.orderNumber} · {order.buyerName} ·{" "}
            {order.fulfillment === "DELIVERY"
              ? "Antar ke rumah"
              : order.fulfillment === "COD_DELIVERY"
                ? "Antar Bayar di Tempat"
                : "Ambil sendiri"}
          </p>

          <div className="rounded-xl p-4 mt-1" style={{ background: "var(--color-cream)" }}>
            {[...groups.entries()].map(([label, items], groupIdx) => (
              <div key={label} className={groupIdx > 0 ? "mt-4" : ""}>
                <p className="text-xs font-semibold text-turmeric mb-1">Ready {label}</p>
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between text-[13px] py-1.5 text-ink-muted"
                  >
                    <span>
                      {item.product.name} ×{item.quantity}
                    </span>
                    <span className="text-ink font-medium">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            ))}

            <div className="flex justify-between text-[13px] py-1.5 text-ink-muted">
              <span>Ongkos kirim</span>
              <span className="text-leaf font-medium">Gratis</span>
            </div>

            <div className="flex justify-between pt-3 mt-2.5 border-t-2 border-soft-grey text-base font-bold">
              <span>Total</span>
              <span className="text-tomato">{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>

          <div className="flex gap-3 mt-2 flex-wrap">
            <Link href="/" className="rr-btn-ghost flex-1 text-center min-w-[160px]">
              ← Kembali ke menu
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
