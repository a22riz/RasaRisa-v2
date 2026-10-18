import Link from "next/link";
import { getCart, cartItemCount } from "@/lib/cart";
import { getCatalog } from "@/server/orders";
import { formatCurrency, formatPoLabel } from "@/lib/format";
import { CheckoutForm } from "@/components/buyer/checkout-form";
import { ERRORS } from "@/lib/constants";

export default async function CheckoutPage() {
  const [cart, batches] = await Promise.all([getCart(), getCatalog()]);

  const count = cartItemCount(cart);

  // Resolve product names + prices from catalog data
  const productMap = new Map<string, { name: string; price: number }>();
  const batchMap = new Map<string, string>();
  for (const batch of batches) {
    batchMap.set(batch.id, formatPoLabel(batch.readyDate));
    for (const { product } of batch.poItems) {
      productMap.set(product.id, { name: product.name, price: product.price });
    }
  }

  const lines = cart.items
    .map((item) => {
      const product = productMap.get(item.productId);
      const poLabel = batchMap.get(item.poBatchId) ?? "";
      if (!product) return null;
      return {
        productId: item.productId,
        poBatchId: item.poBatchId,
        quantity: item.quantity,
        productName: product.name,
        poLabel,
        price: product.price,
      };
    })
    .filter((l): l is NonNullable<typeof l> => l !== null);

  const total = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-soft-grey bg-cream/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link href="/" className="font-serif text-xl font-bold text-tomato">
            RasaRisa
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-soft-grey bg-card px-4 py-2 text-sm font-medium text-ink transition hover:border-turmeric"
          >
            Kembali ke Menu
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        {count === 0 || lines.length === 0 ? (
          <div className="rounded-xl border border-soft-grey bg-card p-8 text-center">
            <p className="text-ink-muted">Keranjang masih kosong.</p>
            <Link
              href="/"
              className="mt-4 inline-block rounded-lg bg-tomato px-4 py-2 text-sm font-semibold text-white"
            >
              Lihat Menu
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-6">
              <div>
                <h2 className="font-serif text-xl font-bold text-ink">Pesanan</h2>
                <div className="mt-4 space-y-3">
                  {lines.map((line) => (
                    <div
                      key={`${line.productId}-${line.poBatchId}`}
                      className="flex items-baseline justify-between rounded-lg border border-soft-grey bg-card p-3"
                    >
                      <div className="flex-1 pr-3">
                        <p className="font-medium text-ink">{line.productName}</p>
                        <p className="text-xs text-ink-muted">{line.poLabel}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-ink-muted">{line.quantity}x</p>
                        <p className="font-medium text-ink">
                          {formatCurrency(line.price * line.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="lg:sticky lg:top-20">
              <CheckoutForm cart={cart} lines={lines} total={total} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
