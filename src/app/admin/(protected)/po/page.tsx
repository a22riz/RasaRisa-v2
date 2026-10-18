import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate, formatDateShort } from "@/lib/format";
import { createPoBatch, closePoBatch } from "@/app/actions/admin/po";
import { ERRORS } from "@/lib/constants";

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

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-ink">Pre-Order</h1>

      <div className="mt-6 rounded-xl border border-soft-grey bg-card p-4">
        <h2 className="font-serif text-lg font-bold text-ink">Buat PO Baru</h2>
        <form action={createPoBatch} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="readyDate" className="block text-sm font-medium text-ink">
                Tanggal Siap (Ambil/Antar)
              </label>
              <input
                id="readyDate"
                name="readyDate"
                type="datetime-local"
                required
                className="mt-1 w-full rounded-lg border border-soft-grey bg-card px-3 py-2 text-ink"
              />
            </div>
            <div>
              <label htmlFor="closeDate" className="block text-sm font-medium text-ink">
                Tutup PO
              </label>
              <input
                id="closeDate"
                name="closeDate"
                type="datetime-local"
                required
                className="mt-1 w-full rounded-lg border border-soft-grey bg-card px-3 py-2 text-ink"
              />
            </div>
          </div>
          <div>
            <p className="block text-sm font-medium text-ink">Pilih Produk</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {products.length === 0 ? (
                <p className="text-sm text-ink-muted">
                  Belum ada produk aktif.{" "}
                  <Link href="/admin/products/new" className="text-tomato underline">
                    Tambah produk dulu
                  </Link>
                </p>
              ) : (
                products.map((product) => (
                  <label
                    key={product.id}
                    className="flex items-center gap-2 rounded-lg border border-soft-grey p-2"
                  >
                    <input
                      type="checkbox"
                      name="productId"
                      value={product.id}
                      className="h-4 w-4 rounded border-soft-grey"
                    />
                    <span className="text-sm text-ink">{product.name}</span>
                  </label>
                ))
              )}
            </div>
          </div>
          <button
            type="submit"
            className="rounded-lg bg-tomato px-4 py-2.5 font-semibold text-white transition hover:bg-tomato/90"
          >
            Buat PO
          </button>
        </form>
      </div>

      <div className="mt-6 space-y-2">
        <h2 className="font-serif text-lg font-bold text-ink">Daftar PO</h2>
        {batches.length === 0 ? (
          <div className="rounded-xl border border-soft-grey bg-card p-8 text-center text-ink-muted">
            Belum ada PO dibuat.
          </div>
        ) : (
          batches.map((batch) => (
            <div
              key={batch.id}
              className="rounded-lg border border-soft-grey bg-card p-3"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <p className="font-serif text-lg font-bold text-ink">
                    Siap {formatDate(batch.readyDate)}
                  </p>
                  <p className="text-sm text-ink-muted">
                    Tutup {formatDateShort(batch.closeDate)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      batch.status === "OPEN"
                        ? "bg-leaf/20 text-leaf"
                        : "bg-soft-grey text-ink-muted"
                    }`}
                  >
                    {batch.status === "OPEN" ? "Buka" : "Tutup"}
                  </span>
                  <span className="text-sm text-ink-muted">
                    {batch.orderItems.length} pesanan
                  </span>
                  {batch.status === "OPEN" && (
                    <form action={closePoBatch.bind(null, batch.id)}>
                      <button
                        type="submit"
                        className="rounded-lg border border-soft-grey px-3 py-1 text-xs font-medium text-ink transition hover:border-turmeric"
                      >
                        Tutup
                      </button>
                    </form>
                  )}
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {batch.poItems.map(({ product }) => (
                  <span
                    key={product.id}
                    className="rounded-full bg-cream px-2 py-0.5 text-xs text-ink-muted"
                  >
                    {product.name}
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
