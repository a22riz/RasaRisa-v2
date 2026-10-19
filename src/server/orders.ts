import { prisma } from "@/lib/prisma";
import { ORDER_EXPIRY_HOURS, TRACKING_EXPIRY_DAYS, ERRORS, FULFILLMENT_GROUP_LABELS, type OrderStatus, type FulfillmentGroupStatus } from "@/lib/constants";
import {
  validateTransition,
  nextGroupStatus,
  validateGroupTransition,
  deriveOrderStatusFromGroups,
} from "@/lib/status-machine";
import { formatPoLabel } from "@/lib/format";
import type { Cart } from "@/lib/validation";

export async function getCatalog() {
  const now = new Date();
  return prisma.poBatch.findMany({
    where: {
      status: "OPEN",
      closeDate: { gt: now },
    },
    include: {
      poItems: {
        include: {
          product: true,
        },
      },
    },
    orderBy: { readyDate: "asc" },
  });
}

export async function createOrder(
  cart: Cart,
  buyerName: string,
  buyerWa: string,
  fulfillment: "PICKUP" | "DELIVERY",
  address?: string,
) {
  // Validate cart items against open PO batches
  const poBatchIds = [...new Set(cart.items.map((i) => i.poBatchId))];
  const poBatches = await prisma.poBatch.findMany({
    where: { id: { in: poBatchIds } },
    include: {
      poItems: {
        include: { product: true },
      },
    },
  });

  // Check PO not closed
  const now = new Date();
  for (const batch of poBatches) {
    if (batch.status === "CLOSED" || batch.closeDate <= now) {
      throw new Error("Pre-order sudah ditutup");
    }
  }

  // Build order items with prices
  const orderItems = cart.items.map((item) => {
    const batch = poBatches.find((b) => b.id === item.poBatchId);
    if (!batch) throw new Error("Pre-order sudah ditutup");
    const poItem = batch.poItems.find((pi) => pi.productId === item.productId);
    if (!poItem) throw new Error("Pre-order sudah ditutup");
    const price = poItem.priceOverride ?? poItem.product.price;
    return {
      productId: item.productId,
      poBatchId: item.poBatchId,
      quantity: item.quantity,
      price,
    };
  });

  const totalAmount = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const expiresAt = new Date(now.getTime() + ORDER_EXPIRY_HOURS * 3600000);
  const trackingExpiresAt = new Date(
    now.getTime() + TRACKING_EXPIRY_DAYS * 86400000,
  );

  // Generate order number: RR-YYYYMMDD-XXXX
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const orderNumber = `RR-${dateStr}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const trackingId = crypto.randomUUID();

  const order = await prisma.order.create({
    data: {
      orderNumber,
      trackingId,
      buyerName,
      buyerWa,
      fulfillment,
      address: fulfillment === "DELIVERY" ? address : null,
      status: "WAITING_PAYMENT",
      expiresAt,
      totalAmount,
      items: {
        create: orderItems,
      },
      statusHistory: {
        create: {
          status: "WAITING_PAYMENT",
          note: "Pesanan dibuat",
        },
      },
    },
    include: { items: { include: { product: true, poBatch: true } } },
  });

  return { order, trackingExpiresAt };
}

export async function getOrderByTracking(trackingId: string) {
  const order = await prisma.order.findUnique({
    where: { trackingId },
    include: {
      items: { include: { product: true, poBatch: true } },
      statusHistory: { orderBy: { createdAt: "asc" } },
      fulfillmentGroups: { include: { poBatch: true } },
    },
  });

  if (!order) return null;

  // Lazy auto-expire
  if (
    order.status === "WAITING_PAYMENT" &&
    !order.receiptImage &&
    order.expiresAt < new Date()
  ) {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "EXPIRED",
        statusHistory: {
          create: {
            status: "EXPIRED",
            note: "Otomatis kedaluwarsa, bukti transfer tidak diunggah",
          },
        },
      },
    });
    return { ...order, status: "EXPIRED" as const };
  }

  return order;
}

export async function getOrderById(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: true, poBatch: true } },
      statusHistory: { orderBy: { createdAt: "asc" } },
      fulfillmentGroups: { include: { poBatch: true } },
    },
  });
}

export async function attachReceipt(orderId: string, filename: string) {
  return prisma.order.update({
    where: { id: orderId },
    data: {
      receiptImage: filename,
      receiptUploadedAt: new Date(),
    },
  });
}

// Confirm payment: WAITING_PAYMENT -> PAYMENT_CONFIRMED + create one
// FulfillmentGroup per PoBatch in the order (all start at PROCESSING).
// Receipt must already be attached.
export async function confirmPayment(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) return { ok: false as const, error: "Pesanan tidak ditemukan" };
  if (!order.receiptImage) return { ok: false as const, error: ERRORS.NO_RECEIPT };

  const v = validateTransition(order.status as OrderStatus, "PAYMENT_CONFIRMED");
  if (!v.ok) return { ok: false as const, error: v.error };

  const poBatchIds = [...new Set(order.items.map((i) => i.poBatchId))];
  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: {
        status: "PAYMENT_CONFIRMED",
        paymentConfirmedAt: new Date(),
        fulfillmentGroups: {
          create: poBatchIds.map((poBatchId) => ({ poBatchId })),
        },
      },
    }),
    prisma.statusHistory.create({
      data: { orderId, status: "PAYMENT_CONFIRMED", note: "Pembayaran dikonfirmasi admin" },
    }),
  ]);

  return { ok: true as const };
}

// Advance a single fulfillment group to its next status and re-derive the
// order status (least-advanced group wins). Logs a history entry per advance.
export async function advanceGroup(orderId: string, poBatchId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { fulfillmentGroups: { include: { poBatch: true } } },
  });
  if (!order) return { ok: false as const, error: "Pesanan tidak ditemukan" };

  const orderStatus = order.status as OrderStatus;
  if (
    orderStatus !== "PAYMENT_CONFIRMED" &&
    orderStatus !== "PROCESSING" &&
    orderStatus !== "READY_FOR_DELIVERY"
  ) {
    return { ok: false as const, error: ERRORS.STATUS_BACKWARD };
  }

  const group = order.fulfillmentGroups.find((g) => g.poBatchId === poBatchId);
  if (!group) return { ok: false as const, error: "Batch tidak ditemukan" };

  const current = group.status as FulfillmentGroupStatus;
  const next = nextGroupStatus(current);
  if (!next) return { ok: false as const, error: ERRORS.STATUS_BACKWARD };

  const v = validateGroupTransition(current, next);
  if (!v.ok) return { ok: false as const, error: v.error };

  const projected = order.fulfillmentGroups.map((g) =>
    g.id === group.id
      ? { status: next }
      : { status: g.status as FulfillmentGroupStatus },
  );
  const derived = deriveOrderStatusFromGroups(projected);
  const label = formatPoLabel(group.poBatch.readyDate);
  const note = `Batch ${label}: ${FULFILLMENT_GROUP_LABELS[next]}`;

  await prisma.$transaction(async (tx) => {
    await tx.fulfillmentGroup.update({
      where: { id: group.id },
      data: { status: next },
    });
    if (derived && derived !== orderStatus) {
      await tx.order.update({ where: { id: orderId }, data: { status: derived } });
      await tx.statusHistory.create({ data: { orderId, status: derived, note } });
    } else {
      await tx.statusHistory.create({ data: { orderId, status: orderStatus, note } });
    }
  });

  return { ok: true as const, derived };
}

export async function autoExpireOrders() {
  const now = new Date();
  const expired = await prisma.order.findMany({
    where: {
      status: "WAITING_PAYMENT",
      receiptImage: null,
      expiresAt: { lt: now },
    },
    select: { id: true },
  });

  if (expired.length === 0) return 0;

  await prisma.order.updateMany({
    where: { id: { in: expired.map((o) => o.id) } },
    data: { status: "EXPIRED" },
  });

  await prisma.statusHistory.createMany({
    data: expired.map((o) => ({
      orderId: o.id,
      status: "EXPIRED",
      note: "Otomatis kedaluwarsa, bukti transfer tidak diunggah",
    })),
  });

  return expired.length;
}
