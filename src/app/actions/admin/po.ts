"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { ERRORS } from "@/lib/constants";

function redirectWithError(error: string): never {
  redirect(`/admin/po?error=${encodeURIComponent(error)}`);
}

export async function createPoBatch(formData: FormData) {
  await requireAdmin();

  const readyDate = formData.get("readyDate") as string;
  const closeDate = formData.get("closeDate") as string;
  const productIds = formData.getAll("productId") as string[];

  if (!readyDate || !closeDate) {
    redirectWithError(ERRORS.PO_NO_DATE);
  }
  if (productIds.length === 0) {
    redirectWithError("Pilih minimal satu produk");
  }
  if (new Date(closeDate) > new Date(readyDate)) {
    redirectWithError("Tanggal tutup harus sebelum tanggal siap");
  }

  await prisma.poBatch.create({
    data: {
      readyDate: new Date(readyDate),
      closeDate: new Date(closeDate),
      status: "OPEN",
      poItems: {
        create: productIds.map((productId) => ({ productId })),
      },
    },
  });

  revalidatePath("/admin/po");
  revalidatePath("/");
  redirect("/admin/po");
}

export async function closePoBatch(poBatchId: string) {
  await requireAdmin();

  await prisma.poBatch.update({
    where: { id: poBatchId },
    data: { status: "CLOSED" },
  });

  revalidatePath("/admin/po");
  revalidatePath("/");
}
