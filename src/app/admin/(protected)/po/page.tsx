import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate, formatDateShort } from "@/lib/format";
import { createPoBatch, closePoBatch } from "@/app/actions/admin/po";

const weekdayShort = (d: Date) =>
  new Intl.DateTimeFormat("id-ID", { weekday: "short" }).format(d);
const monthShort = (d: Date) =>
  new Intl.DateTimeFormat("id-ID", { month: "short" }).format(d);

export default async function AdminPoPage() {
  const [batches, products] = await Promise.all([
    prisma.poBatch.findMany({
      include: {
        poItems: { include: { product: true } },
        orderItems: true,
      },
      orderBy: { readyDate: "desc" },
    }),
    prisma.product.findMany({ where: { isActive: true } }),
  ]);

  const totalOrders = batches.reduce((sum, b) => sum + b.orderItems.length, 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif font-bold text-3xl">Kelola Pre-Order</h1>
        <p className="text-ink-muted text-sm mt-0.5">
          Buka PO baru dengan tanggal ready, pilih produk yang tersedia.
        </p>
      </div>

      {/* Create PO form */}
      <div className="rr-card" style={{ marginBottom: 24 }}>
        <h2 className="font-serif text-xl font-semibold mb-1">📅 Buka PO Baru</h2>
        <p className="rr-card-sub">
          Set tanggal siap (ambil/antar) dan tutup PO. Pembeli bisa pesan sampai PO ditutup.
        </p>

        <form action={createPoBatch} className="space-y-4">
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
            <div className="rr-field" style={{ marginBottom: 0 }}>
              <label htmlFor="readyDate">
                Tanggal Siap <span className="req">*</span>
              </label>
              <input
                id="readyDate"
                name="readyDate"
                type="datetime-local"
                required
              />
              <p className="hint">Kapan pesanan siap diambil/diantar.</p>
            </div>
            <div className="rr-field" style={{ marginBottom: 0 }}>
              <label htmlFor="closeDate">
                Tutup PO <span className="req">*</span>
              </label>
              <input
                id="closeDate"
                name="closeDate"
                type="datetime-local"
                required
              />
              <p className="hint">Pembeli gak bisa pesan setelah ini.</p>
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-semibold mb-2 text-ink">
              Pilih Produk <span className="req">*</span>
            </label>
            {products.length === 0 ? (
              <div className="rounded-lg p-4 text-center" style={{ background: "var(--color-cream)", border: "1px dashed var(--color-soft-grey)" }}>
                <p className="text-sm text-ink-muted">
                  Belum ada produk aktif.{" "}
                  <Link href="/admin/products/new" className="text-tomato font-medium underline">
                    Tambah produk dulu
                  </Link>
                </p>
              </div>
            ) : (
              <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
                {products.map((product) => (
                  <label
                    key={product.id}
                    className="flex items-center gap-2.5 rounded-lg border border-soft-grey p-3 cursor-pointer transition hover:border-tomato"
                    style={{ background: "var(--color-card)" }}
                  >
                    <input
                      type="checkbox"
                      name="productId"
                      value={product.id}
                      className="h-4 w-4 rounded border-soft-grey"
                    />
                    <span className="text-sm text-ink font-medium">{product.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <button type="submit" className="rr-btn-primary">
            + Buat PO
          </button>
        </form>
      </div>

      {/* PO list */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-serif text-xl font-semibold">Daftar PO</h2>
          <span className="text-sm text-ink-muted">{batches.length} PO · {totalOrders} pesanan</span>
        </div>

        {batches.length === 0 ? (
          <div className="rr-card text-center py-12">
            <p className="text-4xl mb-3">📅</p>
            <p className="text-ink-muted">Belum ada PO dibuat. Buka PO pertama kamu di atas.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {batches.map((batch) => {
              const ready = new Date(batch.readyDate);
              const close = new Date(batch.closeDate);
              const hoursLeft = Math.round((close.getTime() - Date.now()) / 3600000);
              const isOpen = batch.status === "OPEN";
              const poStatus =
                !isOpen
                  ? { class: "closed", label: "Selesai" }
                  : hoursLeft < 0
                    ? { class: "closed", label: "Selesai" }
                    : hoursLeft < 6
                      ? { class: "soon", label: `Tutup ${hoursLeft} jam` }
                      : { class: "open", label: "Dibuka" };
              return (
                <div key={batch.id} className="rr-card" style={{ marginBottom: 0 }}>
                  <div className="grid items-center gap-4" style={{ gridTemplateColumns: "52px 1fr auto auto auto" }}>
                    <div className="rr-po-date-badge">
                      <span className="day">{weekdayShort(ready)}</span>
                      <span className="num">{ready.getDate()}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-[15px] mb-0.5">
                        PO {weekdayShort(ready)}, {ready.getDate()} {monthShort(ready)}
                      </div>
                      <div className="text-[13px] text-ink-muted">
                        Tutup {formatDateShort(close)} · {batch.orderItems.length} pesanan · {batch.poItems.length} item
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {batch.poItems.map(({ product }) => (
                          <span key={product.id} className="text-[11px] bg-cream text-ink-muted px-2 py-0.5 rounded-full">
                            {product.name}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className={`rr-po-status ${poStatus.class}`}>{poStatus.label}</span>
                    <Link href="/admin/orders" className="rr-action-btn">Lihat pesanan</Link>
                    {isOpen && (
                      <form action={closePoBatch.bind(null, batch.id)}>
                        <button type="submit" className="rr-action-btn">Tutup PO</button>
                      </form>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
