import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/format";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <h1 className="font-serif text-2xl font-bold text-ink">Produk</h1>
        <Link
          href="/admin/products/new"
          className="rounded-lg bg-tomato px-4 py-2 text-sm font-semibold text-white transition hover:bg-tomato/90"
        >
          Tambah Produk
        </Link>
      </div>

      <div className="mt-4 space-y-2">
        {products.length === 0 ? (
          <div className="rounded-xl border border-soft-grey bg-card p-8 text-center text-ink-muted">
            Belum ada produk. Tambahkan produk pertama kamu.
          </div>
        ) : (
          products.map((product) => (
            <Link
              key={product.id}
              href={`/admin/products/${product.id}`}
              className="flex items-center justify-between rounded-lg border border-soft-grey bg-card p-3 transition hover:border-turmeric"
            >
              <div className="flex-1">
                <p className="font-medium text-ink">{product.name}</p>
                {product.description && (
                  <p className="truncate text-sm text-ink-muted">{product.description}</p>
                )}
              </div>
              <div className="text-right">
                <p className="font-medium text-ink">{formatCurrency(product.price)}</p>
                <span
                  className={`text-xs font-medium ${product.isActive ? "text-leaf" : "text-ink-muted"}`}
                >
                  {product.isActive ? "Aktif" : "Nonaktif"}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
