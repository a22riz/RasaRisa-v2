import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderById } from "@/server/orders";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { STATUS_LABELS } from "@/lib/constants";
import { ReceiptUpload } from "@/components/buyer/receipt-upload";

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

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-soft-grey bg-cream/95 backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 py-3">
          <Link href="/" className="font-serif text-xl font-bold text-tomato">
            RasaRisa
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="rounded-xl border border-leaf bg-leaf/10 p-4">
          <h1 className="font-serif text-2xl font-bold text-leaf">Pesanan Diterima</h1>
          <p className="mt-1 text-sm text-ink">
            Nomor pesanan: <strong>{order.orderNumber}</strong>
          </p>
        </div>

        <div className="mt-6 rounded-xl border border-soft-grey bg-card p-4">
          <h2 className="font-serif text-lg font-bold text-ink">Rincian Pesanan</h2>
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

        <div className="mt-6 rounded-xl border border-soft-grey bg-card p-4">
          <h2 className="font-serif text-lg font-bold text-ink">Pembayaran</h2>
          <p className="mt-2 text-sm text-ink-muted">
            Transfer ke rekening berikut, lalu unggah bukti transfer.
          </p>
          <div className="mt-3 rounded-lg border border-turmeric bg-turmeric/10 p-3">
            <p className="font-serif text-lg font-bold text-ink">
              {bankSetting?.value ?? "BCA 1234567890 a.n. Rasa Risa"}
            </p>
          </div>
          <p className="mt-2 text-sm text-ink-muted">
            Batas unggah bukti: {formatDateTime(order.expiresAt)}
          </p>
        </div>

        {order.receiptImage ? (
          <div className="mt-6 rounded-xl border border-leaf bg-leaf/10 p-4">
            <p className="font-medium text-leaf">
              Bukti transfer sudah diunggah. Menunggu konfirmasi admin.
            </p>
          </div>
        ) : (
          <div className="mt-6">
            <ReceiptUpload orderId={order.id} />
          </div>
        )}

        {track && (
          <div className="mt-6 rounded-xl border border-soft-grey bg-card p-4 text-center">
            <p className="text-sm text-ink-muted">
              Simpan link ini untuk melacak pesanan kamu:
            </p>
            <Link
              href={`/track/${track}`}
              className="mt-2 inline-block font-medium text-tomato underline"
            >
              Lacak Pesanan
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
