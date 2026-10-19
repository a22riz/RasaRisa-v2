export const ORDER_STATUSES = [
  "WAITING_PAYMENT",
  "PAYMENT_CONFIRMED",
  "PROCESSING",
  "READY_FOR_DELIVERY",
  "COMPLETED",
  "EXPIRED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  WAITING_PAYMENT: "Menunggu Pembayaran",
  PAYMENT_CONFIRMED: "Pembayaran Dikonfirmasi",
  PROCESSING: "Diproses",
  READY_FOR_DELIVERY: "Siap Diambil",
  COMPLETED: "Selesai",
  EXPIRED: "Kedaluwarsa",
};

// Forward-only state machine. Terminal states: COMPLETED, EXPIRED.
export const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus | null> = {
  WAITING_PAYMENT: "PAYMENT_CONFIRMED",
  PAYMENT_CONFIRMED: "PROCESSING",
  PROCESSING: "READY_FOR_DELIVERY",
  READY_FOR_DELIVERY: "COMPLETED",
  COMPLETED: null,
  EXPIRED: null,
};

export const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = STATUS_TRANSITIONS;

export const ERRORS = {
  PRODUCT_NAME_PRICE: "Nama item dan harga wajib diisi",
  PO_NO_DATE: "Tambahkan minimal satu tanggal pengambilan/pengiriman",
  CHECKOUT_NAME_WA: "Nama pelanggan dan nomor WA wajib diisi",
  WA_INVALID: "Nomor WA tidak valid",
  PO_CLOSED: "Pre-order sudah ditutup",
  FILE_FORMAT: "Format file harus JPG atau PNG, maksimal 5MB",
  UPLOAD_SUCCESS: "Bukti transfer berhasil diunggah",
  NO_RECEIPT: "Menunggu bukti transfer dari pembeli",
  STATUS_BACKWARD: "Status mundur tidak diizinkan",
  TRACKING_INVALID: "Link tidak valid atau sudah kedaluwarsa",
  REPORT_NO_DATA: "Tidak ada data untuk periode ini",
} as const;

export const FULFILLMENT_LABELS = {
  PICKUP: "Ambil Sendiri",
  DELIVERY: "Antar",
} as const;

// Fulfillment groups: one per PoBatch in an order. Tracks per-batch progress
// after payment is confirmed. Order status = least-advanced group status.
// (Order COMPLETED only when ALL groups COMPLETED.)
export const FULFILLMENT_GROUP_STATUSES = [
  "PROCESSING",
  "READY_FOR_DELIVERY",
  "COMPLETED",
] as const;

export type FulfillmentGroupStatus = (typeof FULFILLMENT_GROUP_STATUSES)[number];

export const FULFILLMENT_GROUP_LABELS: Record<FulfillmentGroupStatus, string> = {
  PROCESSING: "Diproses",
  READY_FOR_DELIVERY: "Siap Diambil",
  COMPLETED: "Selesai",
};

// Forward-only. Groups start at PROCESSING when payment is confirmed.
export const GROUP_STATUS_TRANSITIONS: Record<
  FulfillmentGroupStatus,
  FulfillmentGroupStatus | null
> = {
  PROCESSING: "READY_FOR_DELIVERY",
  READY_FOR_DELIVERY: "COMPLETED",
  COMPLETED: null,
};

export const NEXT_GROUP_STATUS = GROUP_STATUS_TRANSITIONS;

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_MIME = ["image/jpeg", "image/png"];
export const ORDER_EXPIRY_HOURS = 24;
export const TRACKING_EXPIRY_DAYS = 90;
export const LOCKOUT_THRESHOLD = 5;
export const LOCKOUT_MINUTES = 15;
