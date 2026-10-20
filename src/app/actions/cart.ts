"use server";

import { revalidatePath } from "next/cache";
import {
  getCart,
  addToCart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
} from "@/lib/cart";

export async function addItem(
  productId: string,
  poBatchId: string,
  quantity = 1,
): Promise<{ count: number }> {
  const cart = await addToCart(productId, poBatchId, quantity);
  revalidatePath("/");
  revalidatePath("/checkout");
  return { count: cart.items.reduce((sum, i) => sum + i.quantity, 0) };
}

export async function changeQuantity(
  productId: string,
  poBatchId: string,
  quantity: number,
) {
  await updateCartQuantity(productId, poBatchId, quantity);
  revalidatePath("/");
  revalidatePath("/checkout");
}

export async function removeItem(productId: string, poBatchId: string) {
  await removeFromCart(productId, poBatchId);
  revalidatePath("/");
  revalidatePath("/checkout");
}

export async function emptyCart() {
  await clearCart();
  revalidatePath("/");
  revalidatePath("/checkout");
}
