"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { productSchema } from "@/lib/validation";

function redirectWithError(error: string): never {
  redirect(`/admin/products?error=${encodeURIComponent(error)}`);
}

export async function createProduct(formData: FormData) {
  await requireAdmin();

  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const priceStr = formData.get("price") as string;
  const price = priceStr ? Number.parseInt(priceStr, 10) : NaN;

  const parsed = productSchema.safeParse({
    name,
    description: description || undefined,
    price,
    isActive: formData.get("isActive") === "on",
  });

  if (!parsed.success) {
    redirectWithError(parsed.error.issues[0].message);
  }

  await prisma.product.create({ data: parsed.data });
  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function updateProduct(id: string, formData: FormData) {
  await requireAdmin();

  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const priceStr = formData.get("price") as string;
  const price = priceStr ? Number.parseInt(priceStr, 10) : NaN;

  const parsed = productSchema.safeParse({
    name,
    description: description || undefined,
    price,
    isActive: formData.get("isActive") === "on",
  });

  if (!parsed.success) {
    redirectWithError(parsed.error.issues[0].message);
  }

  await prisma.product.update({ where: { id }, data: parsed.data });
  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function deleteProduct(id: string) {
  await requireAdmin();
  await prisma.product.delete({ where: { id } });
  revalidatePath("/admin/products");
  revalidatePath("/admin/po");
}
