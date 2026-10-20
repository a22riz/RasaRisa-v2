import { z } from "zod";

export const cartItemSchema = z.object({
  productId: z.string().min(1),
  poBatchId: z.string().min(1),
  quantity: z.number().int().min(1),
});

export type CartItem = z.infer<typeof cartItemSchema>;

export const cartSchema = z.object({
  items: z.array(cartItemSchema),
});

export type Cart = z.infer<typeof cartSchema>;

// Indonesian WA number validation: starts with 08 or +62, 10-15 digits total
export const waSchema = z
  .string()
  .min(1, "Nomor WA wajib diisi")
  .regex(/^(\+62|62|0)8[1-9]\d{6,11}$/, "Nomor WA tidak valid");

export const checkoutSchema = z.object({
  buyerName: z.string().min(1, "Nama pelanggan dan nomor WA wajib diisi"),
  buyerWa: waSchema,
  fulfillment: z.enum(["PICKUP", "DELIVERY", "COD_DELIVERY"]),
  address: z.string().optional(),
  items: z.array(cartItemSchema).min(1, "Keranjang kosong"),
}).refine(
  (data) =>
    (data.fulfillment !== "DELIVERY" && data.fulfillment !== "COD_DELIVERY") ||
    (data.address && data.address.length > 0),
  { message: "Alamat wajib diisi untuk pengiriman" },
);

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const productSchema = z.object({
  name: z.string().min(1, "Nama item dan harga wajib diisi"),
  description: z.string().optional(),
  price: z.number().int().min(1, "Nama item dan harga wajib diisi"),
  image: z.string().optional(),
  isActive: z.boolean().default(true),
});

export type ProductInput = z.infer<typeof productSchema>;

export const poBatchSchema = z.object({
  readyDate: z.string().min(1, "Tambahkan minimal satu tanggal pengambilan/pengiriman"),
  closeDate: z.string().min(1, "Tanggal tutup wajib diisi"),
  productIds: z.array(z.string()).min(1, "Pilih minimal satu produk"),
}).refine(
  (data) => new Date(data.closeDate) <= new Date(data.readyDate),
  { message: "Tanggal tutup harus sebelum tanggal siap" },
);

export type PoBatchInput = z.infer<typeof poBatchSchema>;

export const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

export type LoginInput = z.infer<typeof loginSchema>;
