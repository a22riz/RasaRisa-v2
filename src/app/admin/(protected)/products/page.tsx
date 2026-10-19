import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/format";

const FOOD_EMOJIS = ["🍲", "🍗", "🐟", "🥤", "🍛", "🥘", "🍜", "🧁"];
const IMG_CLASSES = ["rr-img-a", "rr-img-b", "rr-img-c", "rr-img-d"];

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-serif font-bold text-3xl">Katalog Menu</h1>
          <p className="text-ink-muted text-sm mt-0.5">Kelola item yang bisa dipesan pembeli.</p>
        </div>
        <Link href="/admin/products/new" className="rr-btn-primary">+ Tambah Produk</Link>
      </div>

      {products.length === 0 ? (
        <div className="rr-card text-center py-12">
          <p className="text-4xl mb-3">🍽️</p>
          <p className="text-ink-muted mb-4">Belum ada produk. Tambahkan produk pertama kamu.</p>
          <Link href="/admin/products/new" className="rr-btn-primary">+ Tambah Produk</Link>
        </div>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
          {products.map((product, idx) => {
            const emoji = FOOD_EMOJIS[idx % FOOD_EMOJIS.length];
            const imgClass = IMG_CLASSES[idx % IMG_CLASSES.length];
            return (
              <Link
                key={product.id}
                href={`/admin/products/${product.id}`}
                className="bg-card rounded-[14px] overflow-hidden border border-soft-grey transition hover:border-tomato"
                style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
              >
                <div className={`${imgClass} flex items-center justify-center`} style={{ aspectRatio: "4/3" }}>
                  <span className="text-4xl">{emoji}</span>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-serif text-lg font-semibold">{product.name}</h3>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${
                        product.isActive
                          ? "bg-leaf/12 text-leaf"
                          : "bg-soft-grey text-ink-muted"
                      }`}
                    >
                      {product.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>
                  {product.description && (
                    <p className="text-[13px] text-ink-muted mb-2 line-clamp-2 leading-snug">
                      {product.description}
                    </p>
                  )}
                  <p className="font-bold text-lg text-tomato">{formatCurrency(product.price)}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
