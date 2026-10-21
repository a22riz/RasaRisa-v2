"use client";

import { submitCheckout } from "@/app/actions/order";
import { formatCurrency } from "@/lib/format";
import type { Cart } from "@/lib/validation";
import { useState, useTransition } from "react";

interface CartLine {
  productId: string;
  poBatchId: string;
  quantity: number;
  productName: string;
  poLabel: string;
  price: number;
}

type FulfillmentType = "PICKUP" | "DELIVERY" | "COD_DELIVERY";

export function CheckoutForm({
  cart,
  lines,
  total,
  adminWa,
}: {
  cart: Cart;
  lines: CartLine[];
  total: number;
  adminWa: string;
}) {
  const [buyerName, setBuyerName] = useState("");
  const [buyerWa, setBuyWa] = useState("");
  const [fulfillment, setFulfillment] = useState<FulfillmentType>("DELIVERY");
  const [address, setAddress] = useState("");
  const [adminConfirmed, setAdminConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isDelivery = fulfillment === "DELIVERY";
  const deliveryDataReady = Boolean(
    isDelivery && buyerName.trim() && buyerWa.trim() && address.trim(),
  );
  const canSubmit = isDelivery ? deliveryDataReady && adminConfirmed : true;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    startTransition(async () => {
      const result = await submitCheckout({
        buyerName,
        buyerWa,
        fulfillment,
        address: address || undefined,
        items: cart.items,
      });
      if (!result.ok) {
        setError(result.error);
      }
    });
  }

  function buildWaLink(): string {
    const waNumber = adminWa.replace(/^0/, "62").replace(/\D/g, "");
    const itemLines = lines
      .map((l) => `  - ${l.productName} (${formatCurrency(l.price)}) x${l.quantity}`)
      .join("\n");
    const text = encodeURIComponent(
      `Halo RasaRisa, saya ${buyerName}.\n\n` +
        `Alamat: ${address}\n\n` +
        `Pesanan:\n${itemLines}\n\n` +
        `Total: ${formatCurrency(total)}\n\n` +
        `Apakah alamat saya masuk area antar dan berapa biaya pengirimannya? Terima kasih.`,
    );
    return `https://wa.me/${waNumber}?text=${text}`;
  }

  return (
    <form id="checkout-form" onSubmit={handleSubmit} className="contents">
      {/* Langkah 1: Opsi Pengiriman */}
      <div className="rr-card">
        <div className="rr-step-head">
          <span className="rr-step-num rr-step-active">1</span>
          <div>
            <h2>Opsi Pengiriman</h2>
            <p className="rr-card-sub">
              Pilih cara terima pesanan, lalu konfirmasi dengan admin.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 mb-4.5 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setFulfillment("DELIVERY")}
            className={`rr-fulfill-opt ${isDelivery ? "selected" : ""}`}
          >
            <span className="fo-icon">🛵</span>
            <div className="fo-title">Antar ke rumah</div>
            <div className="fo-desc">
              Gratis area tertentu, hubungi admin untuk jangkauan dan biaya pengiriman.
            </div>
          </button>
          <button
            type="button"
            onClick={() => setFulfillment("PICKUP")}
            className={`rr-fulfill-opt ${fulfillment === "PICKUP" ? "selected" : ""}`}
          >
            <span className="fo-icon">🏪</span>
            <div className="fo-title">Ambil sendiri</div>
            <div className="fo-desc">Pickup di lokasi kami sesuai jadwal ready.</div>
          </button>
        </div>

        {isDelivery ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-3.5">
              <div className="rr-field" style={{ marginBottom: 0 }}>
                <label htmlFor="buyerName">
                  Nama <span className="req">*</span>
                </label>
                <input
                  id="buyerName"
                  type="text"
                  required
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="Nama lengkap"
                />
              </div>
              <div className="rr-field" style={{ marginBottom: 0 }}>
                <label htmlFor="buyerWa">
                  Nomor WhatsApp <span className="req">*</span>
                </label>
                <input
                  id="buyerWa"
                  type="tel"
                  required
                  value={buyerWa}
                  onChange={(e) => setBuyWa(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                />
              </div>
            </div>
            <div className="rr-field" style={{ marginBottom: 0 }}>
              <label htmlFor="address">
                Alamat pengiriman <span className="req">*</span>
              </label>
              <textarea
                id="address"
                rows={2}
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Jl. Melati No. 12, Bandung"
              />
              <p className="hint">Contoh: nama jalan, nomor rumah, RT/RW, kelurahan.</p>
            </div>

            <div className="rr-wa-contact mt-3.5">
              <div className="flex-1 min-w-[200px]">
                <p className="text-sm font-semibold text-ink">Cek area antar dan ongkir</p>
                <p className="text-[13px] text-ink-muted mt-0.5">
                  Data kamu ikut terisi otomatis di pesan WhatsApp ke admin.
                </p>
              </div>
              {deliveryDataReady ? (
                <a
                  href={buildWaLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rr-btn-primary inline-flex items-center gap-2"
                  style={{ background: "var(--color-leaf)" }}
                >
                  <span>💬</span> Hubungi Admin
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="rr-btn-primary inline-flex items-center gap-2 opacity-50 cursor-not-allowed"
                  style={{ background: "var(--color-leaf)" }}
                >
                  <span>💬</span> Hubungi Admin
                </button>
              )}
            </div>
            <p className="text-[13px] text-ink-muted mt-3">
              Setelah admin konfirmasi ongkir, lanjut ke checkout di bawah.
            </p>
          </>
        ) : (
          <div
            className="rounded-xl p-4"
            style={{ background: "var(--color-cream)", border: "1px solid var(--color-soft-grey)" }}
          >
            <p className="text-[13px] text-ink-muted">
              Ambil di lokasi kami sesuai jadwal ready. Lanjut ke checkout di bawah untuk isi data
              pemesan.
            </p>
          </div>
        )}
      </div>

      {/* Langkah 2: Checkout */}
      <div className="rr-card">
        <div className="rr-step-head">
          <span className={`rr-step-num ${canSubmit ? "rr-step-active" : ""}`}>2</span>
          <div>
            <h2>Checkout</h2>
            <p className="rr-card-sub">
              {isDelivery
                ? "Konfirmasi pengiriman, lalu buat pesanan."
                : "Isi data pemesan, lalu buat pesanan."}
            </p>
          </div>
        </div>

        {isDelivery ? (
          <label className="rr-confirm-check">
            <input
              type="checkbox"
              checked={adminConfirmed}
              onChange={(e) => setAdminConfirmed(e.target.checked)}
            />
            <span>Saya sudah konfirmasi ongkir dengan admin</span>
          </label>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="rr-field" style={{ marginBottom: 0 }}>
              <label htmlFor="buyerName">
                Nama <span className="req">*</span>
              </label>
              <input
                id="buyerName"
                type="text"
                required
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="Nama lengkap"
              />
            </div>
            <div className="rr-field" style={{ marginBottom: 0 }}>
              <label htmlFor="buyerWa">
                Nomor WhatsApp <span className="req">*</span>
              </label>
              <input
                id="buyerWa"
                type="tel"
                required
                value={buyerWa}
                onChange={(e) => setBuyWa(e.target.value)}
                placeholder="08xxxxxxxxxx"
              />
              <p className="hint">Untuk konfirmasi pesanan via WhatsApp.</p>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-danger bg-danger/10 p-3 text-sm text-danger mt-3">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending || !canSubmit}
          className="rr-btn-primary w-full justify-center mt-4"
          style={{ borderRadius: 10, padding: "14px 28px", fontSize: 15, fontWeight: 700 }}
        >
          {isPending ? "Memproses" : "Buat Pesanan"}
        </button>
      </div>
    </form>
  );
}
