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

export function CheckoutForm({
  cart,
  lines: _lines,
  total: _total,
}: {
  cart: Cart;
  lines: CartLine[];
  total: number;
}) {
  const [buyerName, setBuyerName] = useState("");
  const [buyerWa, setBuyerWa] = useState("");
  const [fulfillment, setFulfillment] = useState<"PICKUP" | "DELIVERY">("DELIVERY");
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

  return (
    <form id="checkout-form" onSubmit={handleSubmit} className="contents">
      {/* Fulfillment */}
      <div className="rr-card">
        <h2>Pengiriman</h2>
        <p className="rr-card-sub">Pilih cara kamu mau terima pesanan.</p>

        <div className="grid grid-cols-2 gap-3 mb-4.5">
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
        </div>

        {fulfillment === "DELIVERY" && (
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
