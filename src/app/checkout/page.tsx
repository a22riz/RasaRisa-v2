import Link from "next/link";
import { getCart, cartItemCount } from "@/lib/cart";
import { getCatalog } from "@/server/orders";
import { formatCurrency, formatPoLabel } from "@/lib/format";
import { CheckoutForm } from "@/components/buyer/checkout-form";
import { CartItemControls } from "@/components/buyer/cart-item-controls";
import { Logo } from "@/components/logo";

const FOOD_EMOJIS = ["🍲", "🍗", "🐟", "🥤"];
const IMG_CLASSES = ["rr-img-a", "rr-img-b", "rr-img-c", "rr-img-d"];

export default async function CheckoutPage() {
  const [cart, batches] = await Promise.all([getCart(), getCatalog()]);
  const count = cartItemCount(cart);

  const productMap = new Map<string, { name: string; price: number }>();
  const batchMap = new Map<string, string>();
  for (const batch of batches) {
    batchMap.set(batch.id, formatPoLabel(batch.readyDate).replace("PO ", ""));
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
  const totalItems = lines.reduce((sum, l) => sum + l.quantity, 0);

  // Group by ready date
  const groups = new Map<string, typeof lines>();
  for (const line of lines) {
    const group = groups.get(line.poLabel) ?? [];
    group.push(line);
    groups.set(line.poLabel, group);
  }

  return (
    <div className="min-h-screen">
      <header className="rr-topbar">
        <Link href="/" className="rr-logo">
          <Logo />
        </Link>
        <Link href="/" className="text-ink-muted text-sm font-medium inline-flex items-center gap-1.5 hover:text-tomato transition">
          ← Kembali ke menu
        </Link>
      </header>

      <div className="max-w-[1120px] mx-auto px-6 py-8 grid gap-8 items-start" style={{ gridTemplateColumns: "1.5fr 1fr" }}>
        <div>
          <h1 className="font-serif font-bold text-3xl mb-1.5">Checkout</h1>
          <p className="text-ink-muted text-sm mb-7">
            Periksa pesananmu, isi data pengiriman, lalu buat pesanan.
          </p>

          {/* Steps */}
          <div className="flex gap-2 mb-7 items-center">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-leaf">
              <span className="w-[26px] h-[26px] rounded-full bg-leaf text-white border border-leaf flex items-center justify-center text-[13px] font-bold">✓</span>
              Pilih Menu
            </div>
            <div className="flex-1 h-px bg-soft-grey min-w-5" />
            <div className="flex items-center gap-2 text-[13px] font-semibold text-ink">
              <span className="w-[26px] h-[26px] rounded-full bg-tomato text-white border border-tomato flex items-center justify-center text-[13px] font-bold">2</span>
              Checkout
            </div>
            <div className="flex-1 h-px bg-soft-grey min-w-5" />
            <div className="flex items-center gap-2 text-[13px] font-semibold text-ink-muted">
              <span className="w-[26px] h-[26px] rounded-full bg-card border border-soft-grey flex items-center justify-center text-[13px] font-bold">3</span>
              Bayar
            </div>
          </div>

          {count === 0 || lines.length === 0 ? (
            <div className="rr-card text-center py-12">
              <p className="text-4xl mb-3">🛒</p>
              <p className="text-ink-muted">Keranjang masih kosong.</p>
              <Link href="/" className="rr-btn-primary mt-4">
                Lihat Menu
              </Link>
            </div>
          ) : (
            <>
              {/* Cart items grouped by ready date */}
              <div className="rr-card">
                <h2>Pesananmu</h2>
                <p className="rr-card-sub">
                  Item dikelompokkan per tanggal ready. Satu transaksi, bisa beberapa tanggal.
                </p>

                {[...groups.entries()].map(([poLabel, items], groupIdx) => (
                  <div key={poLabel} className={groupIdx > 0 ? "mt-5" : ""}>
                    <div className="rr-ready-group-head">
                      <span className="dot" /> Ready {poLabel}
                    </div>
                    {items.map((item, idx) => {
                      const emoji = FOOD_EMOJIS[idx % FOOD_EMOJIS.length];
                      const imgClass = IMG_CLASSES[idx % IMG_CLASSES.length];
                      return (
                        <div
                          key={`${item.productId}-${item.poBatchId}`}
                          className="grid gap-3.5 items-center py-3 border-b border-soft-grey last:border-0"
                          style={{ gridTemplateColumns: "56px 1fr auto auto" }}
                        >
                          <div className={`${imgClass} w-14 h-14 rounded-[10px] flex items-center justify-center text-2xl`}>
                            {emoji}
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold">{item.productName}</h3>
                            <p className="text-xs text-ink-muted">{formatCurrency(item.price)}</p>
                          </div>
                          <CartItemControls
                            productId={item.productId}
                            poBatchId={item.poBatchId}
                            quantity={item.quantity}
                            price={item.price}
                          />
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              <CheckoutForm cart={cart} lines={lines} total={total} />
            </>
          )}
        </div>

        {/* Summary */}
        {count > 0 && lines.length > 0 && (
          <div className="sticky top-20">
            <div className="rr-card" style={{ marginBottom: 0 }}>
              <h2 className="font-serif text-xl font-semibold mb-4">Ringkasan Pesanan</h2>
              <div className="flex justify-between text-sm py-1.5 text-ink-muted">
                <span>Subtotal ({totalItems} item)</span>
                <span className="text-ink font-medium">{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between text-sm py-1.5 text-ink-muted">
                <span>Ongkos kirim</span>
                <span className="text-leaf font-medium">Gratis</span>
              </div>
              <div className="flex justify-between text-sm py-1.5 text-ink-muted">
                <span>Biaya layanan</span>
                <span className="text-ink font-medium">{formatCurrency(0)}</span>
              </div>
              <div className="flex justify-between pt-3.5 mt-2 border-t-2 border-soft-grey text-[17px] font-bold">
                <span>Total</span>
                <span className="text-tomato">{formatCurrency(total)}</span>
              </div>
              <button
                type="submit"
                form="checkout-form"
                className="rr-btn-primary w-full mt-4.5 justify-center"
                style={{ borderRadius: 10, padding: 14, fontSize: 15, fontWeight: 700 }}
              >
                Buat Pesanan
              </button>
              <p className="text-xs text-ink-muted mt-3 text-center leading-relaxed">
                Dengan buat pesanan, kamu setuju transfer sesuai total di atas.
                Detail rekening muncul setelah pesanan dibuat.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
