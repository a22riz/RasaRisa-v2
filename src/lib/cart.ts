import { cookies } from "next/headers";
import { cartSchema, type Cart, type CartItem } from "./validation";

const CART_COOKIE = "rasarisa-cart";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function getCart(): Promise<Cart> {
  const store = await cookies();
  const raw = store.get(CART_COOKIE)?.value;
  if (!raw) return { items: [] };
  try {
    return cartSchema.parse(JSON.parse(raw));
  } catch {
    return { items: [] };
  }
}

export async function saveCart(cart: Cart): Promise<void> {
  const store = await cookies();
  store.set(CART_COOKIE, JSON.stringify(cart), {
    httpOnly: true,
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function clearCart(): Promise<void> {
  const store = await cookies();
  store.delete(CART_COOKIE);
}

export async function addToCart(productId: string, poBatchId: string, quantity = 1): Promise<Cart> {
  const cart = await getCart();
  const existing = cart.items.find(
    (i) => i.productId === productId && i.poBatchId === poBatchId,
  );
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.items.push({ productId, poBatchId, quantity });
  }
  await saveCart(cart);
  return cart;
}

export async function updateCartQuantity(
  productId: string,
  poBatchId: string,
  quantity: number,
): Promise<Cart> {
  const cart = await getCart();
  if (quantity <= 0) {
    cart.items = cart.items.filter(
      (i) => !(i.productId === productId && i.poBatchId === poBatchId),
    );
  } else {
    const item = cart.items.find(
      (i) => i.productId === productId && i.poBatchId === poBatchId,
    );
    if (item) item.quantity = quantity;
  }
  await saveCart(cart);
  return cart;
}

export async function removeFromCart(productId: string, poBatchId: string): Promise<Cart> {
  const cart = await getCart();
  cart.items = cart.items.filter(
    (i) => !(i.productId === productId && i.poBatchId === poBatchId),
  );
  await saveCart(cart);
  return cart;
}

export function cartItemCount(cart: Cart): number {
  return cart.items.reduce((sum, i) => sum + i.quantity, 0);
}

export type { CartItem };
