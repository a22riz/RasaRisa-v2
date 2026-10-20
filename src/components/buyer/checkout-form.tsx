"use client";

import { useState, useTransition } from "react";
import { submitCheckout } from "@/app/actions/order";
import type { Cart } from "@/lib/validation";

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
  lines: _lines,
  total: _total,
  adminWa,
}: {
  cart: Cart;
  lines: CartLine[];
  total: number;
  adminWa: string;
}) {
  const [buyerName, setBuyerName] = useState("");
  const [buyerWa, setBuyerWa] = useState("");
  const [fulfillment, setFulfillment] = useState<FulfillmentType>("DELIVERY");
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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

  const needsAddress = fulfillment === "DELIVERY" || fulfillment === "COD_DELIVERY";

  // Build WA link for COD delivery inquiry
  function buildWaLink(): string {
    const waNumber = adminWa.replace(/^0/, "62").replace(/\D/g, "");
    const text = encodeURIComponent(
      `Halo RasaRisa, saya mau tanya kurir dan biaya untuk antar bayar di tempat.`,
    );
    return `https://wa.me/${waNumber}?text=${text}`;
  }

  return (
    <form id="checkout-form" onSubmit={handleSubmit} className="contents">
      {/* Fulfillment */}
      <div className="rr-card">
        <h2>Pengiriman</h2>
        <p className="rr-card-sub">Pilih cara kamu mau terima pesanan.</p>

        <div className="grid grid-cols-1 gap-3 mb-4.5 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setFulfillment("DELIVERY")}
            className={`rr-fulfill-opt ${fulfillment === "DELIVERY" ? "selected" : ""}`}
          >
            <span className="fo-icon">🛵</span>
            <div className="fo-title">Antar ke rumah</div>
            <div className="fo-desc">Gratis, kami antar sendiri ke alamatmu.</div>
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
          <button
            type="button"
            onClick={() => setFulfillment("COD_DELIVERY")}
            className={`rr-fulfill-opt ${fulfillment === "COD_DELIVERY" ? "selected" : ""}`}
          >
            <span className="fo-icon">📦</span>
            <div className="fo-title">Antar Bayar di Tempat</div>
            <div className="fo-desc">Diantar kurir, ongkir bayar di tempat.</div>
          </button>
        </div>

        {needsAddress && (
          <div className="rr-field" style={{ marginBottom: 0 }}>
            <label>
              Alamat pengiriman <span className="req">*</span>
            </label>
            <textarea
              rows={2}
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Jl. Melati No. 12, Bandung"
            />
            <p className="hint">Contoh: nama jalan, nomor rumah, RT/RW, kelurahan.</p>
          </div>
        )}

        {fulfillment === "COD_DELIVERY" && (
          <div
            className="mt-3.5 rounded-xl p-4 flex items-center gap-3 flex-wrap"
            style={{ background: "var(--color-cream)", border: "1px dashed var(--color-turmeric)" }}
          >
            <div className="flex-1 min-w-[200px]">
              <p className="text-sm font-semibold text-ink">
                Tanya kurir dan biaya pengiriman
              </p>
              <p className="text-[13px] text-ink-muted mt-0.5">
                Hubungi admin via WhatsApp untuk info kurir dan ongkir ke alamatmu.
              </p>
            </div>
            <a
              href={buildWaLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="rr-btn-primary inline-flex items-center gap-2"
              style={{ background: "var(--color-leaf)" }}
            >
              <span>💬</span> Hubungi Admin
            </a>
          </div>
        )}
      </div>

      {/* Buyer data */}
      <div className="rr-card">
        <h2>Data Pemesan</h2>
        <p className="rr-card-sub">Untuk konfirmasi pesanan dan link tracking.</p>

        <div className="grid grid-cols-2 gap-3.5">
          <div className="rr-field" style={{ marginBottom: 0 }}>
            <label>
              Nama <span className="req">*</span>
            </label>
            <input
              type="text"
              required
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              placeholder="Nama lengkap"
            />
          </div>
          <div className="rr-field" style={{ marginBottom: 0 }}>
            <label>
              Nomor WhatsApp <span className="req">*</span>
            </label>
            <input
              type="tel"
              required
              value={buyerWa}
              onChange={(e) => setBuyerWa(e.target.value)}
              placeholder="08xxxxxxxxxx"
            />
            <p className="hint">Untuk konfirmasi pesanan via WhatsApp.</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-danger bg-danger/10 p-3 text-sm text-danger">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rr-btn-primary w-full justify-center lg:hidden"
      >
        {isPending ? "Memproses" : "Buat Pesanan"}
      </button>
    </form>
  );
}
