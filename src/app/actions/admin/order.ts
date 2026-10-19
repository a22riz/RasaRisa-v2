"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { validateTransition } from "@/lib/status-machine";
import {
  ERRORS,
  type OrderStatus,
} from "@/lib/constants";
import { confirmPayment, advanceGroup } from "@/server/orders";

// Order-level transitions: payment confirmation + auto-expire only.
// Fulfillment progress (PROCESSING/READY/COMPLETED) is driven per batch via
// advanceFulfillmentGroup, which derives the order status from groups.
export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
) {
  await requireAdmin();

  // Payment confirmation delegates to the server function (creates groups).
  if (newStatus === "PAYMENT_CONFIRMED") {
    const result = await confirmPayment(orderId);
    if (!result.ok) return result;
    revalidatePath("/admin");
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath("/");
    return { ok: true as const };
  }

  // EXPIRED (auto-expire path) or any other order-level transition.
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { ok: false as const, error: "Pesanan tidak ditemukan" };

  const v = validateTransition(order.status as OrderStatus, newStatus);
  if (!v.ok) return { ok: false as const, error: v.error };

  await prisma.$transaction([
    prisma.order.update({ where: { id: orderId }, data: { status: newStatus } }),
    prisma.statusHistory.create({ data: { orderId, status: newStatus, note: null } }),
  ]);

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/");
  return { ok: true as const };
}

// Advance a single fulfillment group to its next status. Order status is
// re-derived from all groups (least-advanced wins).
export async function advanceFulfillmentGroup(orderId: string, poBatchId: string) {
  await requireAdmin();
  const result = await advanceGroup(orderId, poBatchId);
  if (!result.ok) return result;
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/track", "layout");
  return { ok: true as const };
}

export async function requestReupload(orderId: string) {
  await requireAdmin();

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.status !== "WAITING_PAYMENT") {
    return { ok: false as const, error: ERRORS.STATUS_BACKWARD };
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

  return { ok: true as const };
}
