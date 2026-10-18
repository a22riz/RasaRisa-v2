import Link from "next/link";
import { getCatalog } from "@/server/orders";
import { getCart, cartItemCount } from "@/lib/cart";
import { formatCurrency, formatPoLabel, formatDate } from "@/lib/format";
import { AddToCartButton } from "@/components/buyer/add-to-cart-button";

export default async function CatalogPage() {
  const [batches, cart] = await Promise.all([getCatalog(), getCart()]);
  const count = cartItemCount(cart);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-soft-grey bg-cream/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-serif text-xl font-bold text-tomato">RasaRisa</span>
          </Link>
          <Link
            href="/checkout"
            className="relative rounded-lg border border-soft-grey bg-card px-4 py-2 text-sm font-medium text-ink transition hover:border-turmeric"
          >
            Keranjang
            {count > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-tomato px-1 text-xs font-bold text-white">
                {count}
              </span>
            )}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="font-serif text-3xl font-bold text-ink sm:text-4xl">
            Makan enak, tanpa ribet
          </h1>
          <p className="mt-2 text-ink-muted">
            Pesan sekarang, ambil atau diantar sesuai jadwal
          </p>
        </div>

        {batches.length === 0 ? (
          <div className="rounded-xl border border-soft-grey bg-card p-8 text-center">
            <p className="text-ink-muted">
              Belum ada pre-order terbuka. Cek lagi nanti ya.
            </p>
          </div>
        ) : (
          batches.map((batch) => (
            <section key={batch.id} className="mb-10">
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-serif text-2xl font-bold text-ink">
                  {formatPoLabel(batch.readyDate)}
                </h2>
                <p className="text-sm text-ink-muted">
                  Siap {formatDate(batch.readyDate)}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {batch.poItems.map(({ product }) => (
                  <article
                    key={product.id}
                    className="flex flex-col rounded-xl border border-soft-grey bg-card p-4"
                  >
                    <div className="mb-3 flex-1">
                      <h3 className="font-serif text-lg font-semibold text-ink">
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="mt-1 text-sm text-ink-muted">
                          {product.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-serif text-lg font-bold text-tomato">
                        {formatCurrency(product.price)}
                      </span>
                      <AddToCartButton
                        productId={product.id}
                        poBatchId={batch.id}
                      />
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))
        )}
      </main>
    </div>
  );
}
