import { prisma } from "@/lib/prisma";
import { ORDER_EXPIRY_HOURS, TRACKING_EXPIRY_DAYS } from "@/lib/constants";
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
