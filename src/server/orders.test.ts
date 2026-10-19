import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  createOrder,
  attachReceipt,
  confirmPayment,
  advanceGroup,
} from "@/server/orders";
import { ERRORS, type FulfillmentGroupStatus } from "@/lib/constants";

const RUN = process.env.RUN_DB_TESTS === "1";

// These tests hit the live dev database. Skipped by default; run with:
//   RUN_DB_TESTS=1 npx vitest run src/server/orders.test.ts
describe.skipIf(!RUN)("fulfillment flow (live DB)", () => {
  const cleanup: string[] = [];

  afterAll(async () => {
    if (cleanup.length > 0) {
      await prisma.order.deleteMany({ where: { id: { in: cleanup } } });
    }
    await prisma.$disconnect();
  });

  let satBatchId = "";
  let sunBatchId = "";
  let satProduct: { id: string } | null = null;
  let sunProduct: { id: string } | null = null;

  beforeAll(async () => {
    const batches = await prisma.poBatch.findMany({
      where: { status: "OPEN" },
      include: { poItems: { include: { product: true } } },
      orderBy: { readyDate: "asc" },
    });
    expect(batches.length).toBeGreaterThanOrEqual(2);
    satBatchId = batches[0].id;
    sunBatchId = batches[1].id;
    satProduct = batches[0].poItems[0]?.product ?? null;
    sunProduct = batches[1].poItems[0]?.product ?? null;
    expect(satProduct).not.toBeNull();
    expect(sunProduct).not.toBeNull();
  });

  async function mkOrder(poBatchId: string, productId: string, qty = 1) {
    const cart = {
      items: [{ productId, poBatchId, quantity: qty }],
    };
    const { order } = await createOrder(
      cart,
      "Tester",
      "081234567890",
      "PICKUP",
    );
    cleanup.push(order.id);
    return order;
  }

  async function reload(orderId: string) {
    const o = await prisma.order.findUnique({
      where: { id: orderId },
      include: { fulfillmentGroups: true },
    });
    if (!o) throw new Error("order gone");
    return o;
  }

  it("creates fulfillment groups on payment confirm", async () => {
    const order = await mkOrder(satBatchId, satProduct!.id);
    await attachReceipt(order.id, "test-receipt.jpg");

    const r = await confirmPayment(order.id);
    expect(r.ok).toBe(true);

    const reloaded = await reload(order.id);
    expect(reloaded.status).toBe("PAYMENT_CONFIRMED");
    expect(reloaded.fulfillmentGroups).toHaveLength(1);
    expect(reloaded.fulfillmentGroups[0].status).toBe("PROCESSING");
  });

  it("rejects confirmPayment without receipt", async () => {
    const order = await mkOrder(satBatchId, satProduct!.id);
    const r = await confirmPayment(order.id);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe(ERRORS.NO_RECEIPT);
  });

  it("multi-PO: derives order status as least-advanced group", async () => {
    // Build a single order mixing items from both PO batches.
    const cart = {
      items: [
        { productId: satProduct!.id, poBatchId: satBatchId, quantity: 2 },
        { productId: sunProduct!.id, poBatchId: sunBatchId, quantity: 1 },
      ],
    };
    const { order } = await createOrder(cart, "Tester", "081234567890", "DELIVERY", "Jl. Test");
    cleanup.push(order.id);
    await attachReceipt(order.id, "multi-receipt.jpg");
    await confirmPayment(order.id);

    let reloaded = await reload(order.id);
    expect(reloaded.fulfillmentGroups).toHaveLength(2);
    // Both start PROCESSING.

    // Advance batch1 -> READY; batch2 still PROCESSING -> order PROCESSING.
    let r = await advanceGroup(order.id, satBatchId);
    expect(r.ok).toBe(true);
    reloaded = await reload(order.id);
    expect(reloaded.status).toBe("PROCESSING");

    // Advance batch2 -> READY; both READY -> order READY_FOR_DELIVERY.
    r = await advanceGroup(order.id, sunBatchId);
    expect(r.ok).toBe(true);
    reloaded = await reload(order.id);
    expect(reloaded.status).toBe("READY_FOR_DELIVERY");

    // Complete batch1; batch2 still READY -> order stays READY_FOR_DELIVERY.
    r = await advanceGroup(order.id, satBatchId);
    expect(r.ok).toBe(true);
    reloaded = await reload(order.id);
    expect(reloaded.status).toBe("READY_FOR_DELIVERY");

    // Complete batch2; both COMPLETED -> order COMPLETED.
    r = await advanceGroup(order.id, sunBatchId);
    expect(r.ok).toBe(true);
    reloaded = await reload(order.id);
    expect(reloaded.status).toBe("COMPLETED");

    const allDone = reloaded.fulfillmentGroups.every(
      (g) => g.status === "COMPLETED",
    );
    expect(allDone).toBe(true);
  });

  it("single-PO: advances through PROCESSING -> READY -> COMPLETED", async () => {
    const order = await mkOrder(satBatchId, satProduct!.id);
    await attachReceipt(order.id, "single-receipt.jpg");
    await confirmPayment(order.id);

    // First advance (only group) -> READY_FOR_DELIVERY.
    let r = await advanceGroup(order.id, satBatchId);
    expect(r.ok).toBe(true);
    let reloaded = await reload(order.id);
    expect(reloaded.status).toBe("READY_FOR_DELIVERY");

    // Second advance -> COMPLETED.
    r = await advanceGroup(order.id, satBatchId);
    expect(r.ok).toBe(true);
    reloaded = await reload(order.id);
    expect(reloaded.status).toBe("COMPLETED");
  });

  it("rejects advancing a group that is COMPLETED", async () => {
    const order = await mkOrder(satBatchId, satProduct!.id);
    await attachReceipt(order.id, "term-receipt.jpg");
    await confirmPayment(order.id);
    await advanceGroup(order.id, satBatchId); // -> READY
    await advanceGroup(order.id, satBatchId); // -> COMPLETED
    const r = await advanceGroup(order.id, satBatchId);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe(ERRORS.STATUS_BACKWARD);
  });

  // Reference to keep the type import meaningful for editors.
  void (null as unknown as FulfillmentGroupStatus);
});
