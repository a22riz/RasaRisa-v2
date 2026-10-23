import { AddToCartButton } from "@/components/buyer/add-to-cart-button";
import { CartToast } from "@/components/buyer/cart-toast";
import { PoChipSelector } from "@/components/buyer/po-chip-selector";
import { Logo } from "@/components/logo";
import { cartItemCount, getCart } from "@/lib/cart";
import {
  formatCurrency,
  formatPoLabel,
  formatWeekdayDayMonth,
  formatWeekdayTime,
} from "@/lib/format";
import { getCatalog } from "@/server/orders";
import Link from "next/link";

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
          <Link href="/checkout" className="rr-icon-btn rr-cart-btn">
            Keranjang
            {count > 0 && <span className="rr-badge-cart">{count}</span>}
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-[1120px] mx-auto px-5 pt-9 pb-7 md:px-6 md:pt-16 md:pb-10">
        <div className="rr-hero-grid">
          <div className="rr-hero-text">
            {batches.length > 0 && (
              <div className="rr-po-pill mb-4">
                <span className="dot" /> Pre-order sedang dibuka
              </div>
            )}
            <h1 className="font-serif font-bold leading-tight mb-3.5 text-[2rem] md:text-[2.75rem]">
              Makan Praktis, Enak, <span className="text-tomato italic">Tanpa Ribet!</span>
            </h1>
            <p className="text-ink-muted text-lg mb-5.5 max-w-[480px]">
              Pesan hari ini, kami masak fresh, antar sesuai jadwal yang kamu pilih. Tanpa repot
              masak, tanpa keluar rumah.
            </p>
            {batches.length > 0 && (
              <a href="#menu" className="rr-btn-primary">
                Lihat Menu <span>→</span>
              </a>
            )}
          </div>

          {batches.length > 0 && (
            <aside className="rr-howto">
              <h2 className="rr-howto-title">Cara pesan, 3 langkah</h2>
              <p className="rr-howto-sub">Gampang, tanpa bikin akun.</p>
              <div className="rr-howto-step">
                <span className="rr-howto-num rr-howto-num-1">1</span>
                <div>
                  <p className="rr-howto-step-title">Pilih menu</p>
                  <p className="rr-howto-step-desc">
                    Tentukan tanggal ready, lalu pilih item favoritmu.
                  </p>
                </div>
              </div>
              <div className="rr-howto-step">
                <span className="rr-howto-num rr-howto-num-2">2</span>
                <div>
                  <p className="rr-howto-step-title">Checkout</p>
                  <p className="rr-howto-step-desc">
                    Isi nama dan nomor WA, pilih ambil sendiri atau diantar.
                  </p>
                </div>
              </div>
              <div className="rr-howto-step">
                <span className="rr-howto-num rr-howto-num-3">3</span>
                <div>
                  <p className="rr-howto-step-title">Bayar dan terima</p>
                  <p className="rr-howto-step-desc">
                    Transfer manual, upload bukti, pesananmu kami antar sesuai jadwal.
                  </p>
                </div>
              </div>
            </aside>
          )}
        </div>
      </section>

      {/* PO selector chips */}
      {batches.length > 0 && (
        <div className="max-w-[1120px] mx-auto px-5 md:px-6 pb-7">
          <p className="text-[13px] text-ink-muted mb-2.5 font-medium">Pilih tanggal ready:</p>
          <PoChipSelector
            chips={batches.map((batch) => ({
              id: batch.id,
              dateLabel: formatWeekdayDayMonth(batch.readyDate),
              timeLabel: formatWeekdayTime(batch.closeDate),
            }))}
          />
        </div>
      )}

      {/* Menu sections */}
      {batches.length === 0 ? (
        <div className="max-w-[1120px] mx-auto px-5 md:px-6 pb-14">
          <div className="rr-card text-center py-12">
            <p className="text-4xl mb-3">🍽️</p>
            <p className="text-ink-muted">Belum ada pre-order terbuka. Cek lagi nanti ya.</p>
          </div>
        </div>
      ) : (
        batches.map((batch, batchIdx) => (
          <section
            key={batch.id}
            id={`po-${batch.id}`}
            className="max-w-[1120px] mx-auto px-5 md:px-6 pb-14 scroll-mt-20"
          >
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
                        style={{
                          color: "var(--color-turmeric)",
                          background: "rgba(244,162,97,0.15)",
                          padding: "3px 9px",
                        }}
                      >
                        🍳 Ready {formatPoLabel(batch.readyDate).replace("PO ", "")}
                      </span>
                      <h3 className="font-serif text-lg font-semibold mb-1 rr-break-words">
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="text-[13px] text-ink-muted mb-3.5 leading-snug">
                          {product.description}
                        </p>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-lg">{formatCurrency(product.price)}</span>
                        <AddToCartButton
                          productId={product.id}
                          poBatchId={batch.id}
                          productName={product.name}
                        />
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))
      )}
      <CartToast />
    </div>
  );
}
