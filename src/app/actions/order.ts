"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getCart, clearCart } from "@/lib/cart";
import { checkoutSchema, type CheckoutInput } from "@/lib/validation";
import { createOrder, attachReceipt } from "@/server/orders";
import { validateFile, saveUpload } from "@/lib/uploads";

export async function submitCheckout(input: CheckoutInput) {
  const cart = await getCart();
  if (cart.items.length === 0) {
    return { ok: false, error: "Keranjang kosong" };
  }

  const parsed = checkoutSchema.safeParse({ ...input, items: cart.items });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  try {
    const { order } = await createOrder(
      cart,
      parsed.data.buyerName,
      parsed.data.buyerWa,
      parsed.data.fulfillment,
      parsed.data.address,
    );
    await clearCart();
    redirect(`/order/${order.id}?track=${order.trackingId}`);
  } catch (e) {
    if (e instanceof Error && e.message === "NEXT_REDIRECT") throw e;
    const msg = e instanceof Error ? e.message : "Terjadi kesalahan";
    return { ok: false, error: msg };
  }
}

export async function uploadReceipt(orderId: string, formData: FormData) {
  const file = formData.get("receipt") as File | null;
  if (!file) {
    return { ok: false, error: "Pilih file bukti transfer" };
  }

  const validation = validateFile(file);
  if (!validation.ok) return validation;

  try {
    const filename = await saveUpload(file);
    await attachReceipt(orderId, filename);
    return { ok: true, message: "Bukti transfer berhasil diunggah" };
  } catch {
    return { ok: false, error: "Gagal mengunggah file" };
  }
}
