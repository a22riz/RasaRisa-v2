"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { validateTransition } from "@/lib/status-machine";
import type { OrderStatus } from "@/lib/constants";

export async function updateOrderStatus(orderId: string, newStatus: OrderStatus, note?: string) {
  await requireAdmin();

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    return { ok: false, error: "Pesanan tidak ditemukan" };
  }

  // Check receipt exists before confirming payment
  if (newStatus === "PAYMENT_CONFIRMED" && !order.receiptImage) {
    return { ok: false, error: "Menunggu bukti transfer dari pembeli" };
  }

  const validation = validateTransition(order.status as OrderStatus, newStatus);
  if (!validation.ok) {
    return { ok: false, error: validation.error };
  }

  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: {
        status: newStatus,
        paymentConfirmedAt: newStatus === "PAYMENT_CONFIRMED" ? new Date() : undefined,
      },
    }),
    prisma.statusHistory.create({
      data: {
        orderId,
        status: newStatus,
        note: note ?? null,
      },
    }),
  ]);

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/");

  return { ok: true };
}

export async function requestReupload(orderId: string) {
  await requireAdmin();

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.status !== "WAITING_PAYMENT") {
    return { ok: false, error: "Status mundur tidak diizinkan" };
  }

  // Clear receipt, stay in WAITING_PAYMENT
  await prisma.order.update({
    where: { id: orderId },
    data: {
      receiptImage: null,
      receiptUploadedAt: null,
    },
  });

  await prisma.statusHistory.create({
    data: {
      orderId,
      status: "WAITING_PAYMENT",
      note: "Admin meminta unggah ulang bukti transfer",
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/track", "layout");

  return { ok: true };
}
