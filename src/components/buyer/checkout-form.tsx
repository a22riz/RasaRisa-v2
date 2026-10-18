"use client";

import { useState, useTransition } from "react";
import { submitCheckout } from "@/app/actions/order";
import { formatCurrency } from "@/lib/format";
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
  lines,
  total,
}: {
  cart: Cart;
  lines: CartLine[];
  total: number;
}) {
  const [buyerName, setBuyerName] = useState("");
  const [buyerWa, setBuyerWa] = useState("");
  const [fulfillment, setFulfillment] = useState<"PICKUP" | "DELIVERY">("PICKUP");
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="font-serif text-xl font-bold text-ink">Data Pemesan</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-ink">
              Nama
            </label>
            <input
              id="name"
              type="text"
              required
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-soft-grey bg-card px-3 py-2 text-ink"
              placeholder="Nama lengkap"
            />
          </div>
          <div>
            <label htmlFor="wa" className="block text-sm font-medium text-ink">
              Nomor WhatsApp
            </label>
            <input
              id="wa"
              type="tel"
              required
              value={buyerWa}
              onChange={(e) => setBuyerWa(e.target.value)}
              className="mt-1 w-full rounded-lg border border-soft-grey bg-card px-3 py-2 text-ink"
              placeholder="0812xxxxxxxx"
            />
          </div>
        </div>
      </div>

      <div>
        <h2 className="font-serif text-xl font-bold text-ink">Pengiriman</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setFulfillment("PICKUP")}
            className={`rounded-lg border px-4 py-3 text-sm font-medium transition ${
              fulfillment === "PICKUP"
                ? "border-tomato bg-tomato text-white"
                : "border-soft-grey bg-card text-ink"
            }`}
          >
            Ambil Sendiri
          </button>
          <button
            type="button"
            onClick={() => setFulfillment("DELIVERY")}
            className={`rounded-lg border px-4 py-3 text-sm font-medium transition ${
              fulfillment === "DELIVERY"
                ? "border-tomato bg-tomato text-white"
                : "border-soft-grey bg-card text-ink"
            }`}
          >
            Antar
          </button>
        </div>
        {fulfillment === "DELIVERY" && (
          <div className="mt-3">
            <label htmlFor="addr" className="block text-sm font-medium text-ink">
              Alamat Pengiriman
            </label>
            <textarea
              id="addr"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="mt-1 w-full rounded-lg border border-soft-grey bg-card px-3 py-2 text-ink"
              rows={3}
              placeholder="Alamat lengkap"
            />
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-danger bg-danger/10 p-3 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-soft-grey bg-card p-4">
        <div className="flex items-baseline justify-between pb-2">
          <span className="font-serif text-lg font-bold text-ink">Total</span>
          <span className="font-serif text-2xl font-bold text-tomato">
            {formatCurrency(total)}
          </span>
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-tomato px-4 py-3 font-semibold text-white transition hover:bg-tomato/90 disabled:opacity-50"
      >
        {isPending ? "Memproses" : "Konfirmasi Pesanan"}
      </button>
    </form>
  );
}
