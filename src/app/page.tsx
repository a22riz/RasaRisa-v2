import Link from "next/link";
import { getCatalog } from "@/server/orders";
import { getCart, cartItemCount } from "@/lib/cart";
import { formatCurrency, formatPoLabel, formatDayMonth, formatWeekdayDayMonth, formatWeekdayTime } from "@/lib/format";
import { AddToCartButton } from "@/components/buyer/add-to-cart-button";
import { Logo } from "@/components/logo";

const FOOD_EMOJIS = ["🍲", "🍗", "🐟", "🥤", "🍛", "🥘", "🍜", "🧁"];
const IMG_CLASSES = ["rr-img-a", "rr-img-b", "rr-img-c", "rr-img-d"];

export default async function CatalogPage() {
  const [batches, cart] = await Promise.all([getCatalog(), getCart()]);
  const count = cartItemCount(cart);

  return (
    <div className="min-h-screen">
      <header className="rr-topbar">
        <Link href="/" className="rr-logo">
          <Logo />
        </Link>
        <div className="flex gap-2.5 items-center">
          <button type="button" className="rr-icon-btn">Pesanan Saya</button>
          <Link href="/checkout" className="rr-icon-btn rr-cart-btn">
            Keranjang
            {count > 0 && <span className="rr-badge-cart">{count}</span>}
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section
        className="max-w-[1120px] mx-auto px-6 pt-14 pb-10 grid items-center gap-10"
        style={{ gridTemplateColumns: batches.length > 0 ? "1.1fr 1fr" : "1fr" }}
      >
        <div>
          {batches.length > 0 && (
            <div className="rr-po-pill mb-4">
              <span className="dot" /> Pre-order sedang dibuka
            </div>
          )}
          <h1 className="font-serif font-bold leading-tight mb-3.5" style={{ fontSize: "2.75rem" }}>
            Makanan rumahan,{" "}
            <span className="text-tomato italic">diantar ke rumah.</span>
          </h1>
          <p className="text-ink-muted text-lg mb-5.5 max-w-[480px]">
            Pesan hari ini, kami masak fresh, antar sesuai jadwal yang kamu pilih.
            Tanpa repot masak, tanpa keluar rumah.
          </p>
          {batches.length > 0 && (
            <a href="#menu" className="rr-btn-primary">
              Lihat Menu <span>→</span>
            </a>
          )}
        </div>
        {batches.length > 0 && (
          <div
            className="rounded-[18px] overflow-hidden relative shadow-lg"
            style={{
              aspectRatio: "4/3.2",
              background: "linear-gradient(135deg, var(--color-turmeric) 0%, var(--color-tomato) 100%)",
            }}
          >
            <span className="absolute top-4 left-4 bg-white/90 text-ink px-3 py-1.5 rounded-full text-xs font-semibold">
              Masakan Ibu, {formatDayMonth(batches[0].readyDate)}
            </span>
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-9xl">
              🍜
            </span>
          </div>
        )}
      </section>

      {/* PO selector chips */}
      {batches.length > 0 && (
        <div className="max-w-[1120px] mx-auto px-6 pb-7">
          <p className="text-[13px] text-ink-muted mb-2.5 font-medium">Pilih tanggal ready:</p>
          <div className="flex gap-2.5 flex-wrap">
            {batches.map((batch, idx) => (
              <a
                key={batch.id}
                href={`#po-${batch.id}`}
                className={`rr-po-chip ${idx === 0 ? "active" : ""}`}
              >
                <span className="rr-po-chip-date">
                  {formatWeekdayDayMonth(batch.readyDate)}
                </span>
                <span className="rr-po-chip-meta">
                  Tutup {formatWeekdayTime(batch.closeDate)}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Menu sections */}
      {batches.length === 0 ? (
        <div className="max-w-[1120px] mx-auto px-6 pb-14">
          <div className="rr-card text-center py-12">
            <p className="text-4xl mb-3">🍽️</p>
            <p className="text-ink-muted">
              Belum ada pre-order terbuka. Cek lagi nanti ya.
            </p>
          </div>
        </div>
      ) : (
        batches.map((batch, batchIdx) => (
          <section key={batch.id} id={`po-${batch.id}`} className="max-w-[1120px] mx-auto px-6 pb-14 scroll-mt-20">
            <div
              id="menu"
              className="flex justify-between items-end mb-6 border-b border-soft-grey pb-3.5"
            >
              <div>
                <h2 className="font-serif font-semibold text-2xl">
                  Menu siap {formatPoLabel(batch.readyDate).replace("PO ", "")}
                </h2>
                <p className="text-ink-muted text-sm mt-1">
                  Pilih item, lanjut checkout. Bisa campur dari tanggal ready yang berbeda.
                </p>
              </div>
            </div>

            <div
              className="grid gap-[22px]"
              style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}
            >
              {batch.poItems.map(({ product }, idx) => {
                const emoji = FOOD_EMOJIS[idx % FOOD_EMOJIS.length];
                const imgClass = IMG_CLASSES[idx % IMG_CLASSES.length];
                return (
                  <article
                    key={product.id}
                    className="bg-card rounded-[14px] overflow-hidden border border-transparent transition-all hover:-translate-y-[3px] hover:border-tomato/20"
                    style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
                  >
                    <div
                      className={`${imgClass} flex items-center justify-center`}
                      style={{ aspectRatio: "4/3" }}
                    >
                      <span className="text-4xl">{emoji}</span>
                    </div>
                    <div className="px-[18px] pt-4 pb-[18px]">
                      <span
                        className="inline-flex items-center gap-1 text-[11px] font-semibold rounded-full mb-2.5"
                        style={{ color: "var(--color-turmeric)", background: "rgba(244,162,97,0.15)", padding: "3px 9px" }}
                      >
                        🍳 Ready {formatPoLabel(batch.readyDate).replace("PO ", "")}
                      </span>
                      <h3 className="font-serif text-lg font-semibold mb-1">{product.name}</h3>
                      {product.description && (
                        <p className="text-[13px] text-ink-muted mb-3.5 leading-snug">
                          {product.description}
                        </p>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-lg">{formatCurrency(product.price)}</span>
                        <AddToCartButton productId={product.id} poBatchId={batch.id} />
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
