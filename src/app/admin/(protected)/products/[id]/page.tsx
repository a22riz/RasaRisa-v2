import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createProduct, updateProduct } from "@/app/actions/admin/product";

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
    <div className="max-w-xl">
      <Link href="/admin/products" className="rr-action-btn mb-4 inline-flex">
        ← Kembali ke Produk
      </Link>
      <h1 className="font-serif text-3xl font-bold mb-1">
        {product ? "Edit Produk" : "Tambah Produk"}
      </h1>
      <p className="text-ink-muted text-sm mb-6">
        {product ? "Ubah detail produk." : "Tambahkan item baru ke katalog menu."}
      </p>

      <form action={action} className="rr-card" style={{ marginBottom: 0 }}>
        <div className="rr-field">
          <label htmlFor="name">
            Nama Item <span className="req">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={product?.name ?? ""}
            placeholder="Contoh: Rendang Daging Sapi"
          />
        </div>

        <div className="rr-field">
          <label htmlFor="price">
            Harga (Rp) <span className="req">*</span>
          </label>
          <input
            id="price"
            name="price"
            type="number"
            required
            min="1"
            defaultValue={product?.price ?? ""}
            placeholder="50000"
          />
        </div>

        <div className="rr-field">
          <label htmlFor="description">Deskripsi (opsional)</label>
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={product?.description ?? ""}
            placeholder="Deskripsi singkat tentang menu ini"
          />
        </div>

        <div className="flex items-center gap-2 mb-5">
          <input
            id="isActive"
            name="isActive"
            type="checkbox"
            defaultChecked={product?.isActive ?? true}
            className="h-4 w-4 rounded border-soft-grey"
          />
          <label htmlFor="isActive" className="text-sm font-medium text-ink">
            Produk aktif (tampil di katalog pembeli)
          </label>
        </div>

        <div className="flex gap-3">
          <button type="submit" className="rr-btn-primary flex-1 justify-center">
            {product ? "Simpan Perubahan" : "Tambah Produk"}
          </button>
          <Link href="/admin/products" className="rr-btn-ghost">Batal</Link>
        </div>
      </form>
    </div>
  );
}
