import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createProduct, updateProduct } from "@/app/actions/admin/product";
import { formatCurrency } from "@/lib/format";

export default async function ProductFormPage({
  params,
}: {
  params?: Promise<{ id: string }>;
}) {
  const resolvedParams = params ? await params : undefined;
  const product = resolvedParams?.id
    ? await prisma.product.findUnique({ where: { id: resolvedParams.id } })
    : null;

  if (resolvedParams?.id && !product) notFound();

  const action = product
    ? updateProduct.bind(null, product.id)
    : createProduct;

  return (
    <div>
      <Link
        href="/admin/products"
        className="mb-4 inline-block text-sm font-medium text-tomato"
      >
        Kembali ke Produk
      </Link>
      <h1 className="font-serif text-2xl font-bold text-ink">
        {product ? "Edit Produk" : "Tambah Produk"}
      </h1>

      <form action={action} className="mt-6 max-w-lg space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-ink">
            Nama Item
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={product?.name ?? ""}
            className="mt-1 w-full rounded-lg border border-soft-grey bg-card px-3 py-2 text-ink"
          />
        </div>
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-ink">
            Harga (Rp)
          </label>
          <input
            id="price"
            name="price"
            type="number"
            required
            min="1"
            defaultValue={product?.price ?? ""}
            className="mt-1 w-full rounded-lg border border-soft-grey bg-card px-3 py-2 text-ink"
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-ink">
            Deskripsi (opsional)
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={product?.description ?? ""}
            className="mt-1 w-full rounded-lg border border-soft-grey bg-card px-3 py-2 text-ink"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            id="isActive"
            name="isActive"
            type="checkbox"
            defaultChecked={product?.isActive ?? true}
            className="h-4 w-4 rounded border-soft-grey"
          />
          <label htmlFor="isActive" className="text-sm font-medium text-ink">
            Produk aktif
          </label>
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            className="rounded-lg bg-tomato px-4 py-2.5 font-semibold text-white transition hover:bg-tomato/90"
          >
            Simpan
          </button>
          <Link
            href="/admin/products"
            className="rounded-lg border border-soft-grey bg-card px-4 py-2.5 text-sm font-medium text-ink transition hover:border-turmeric"
          >
            Batal
          </Link>
        </div>
      </form>
    </div>
  );
}
