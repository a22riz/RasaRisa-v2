"use client";

import { useState, useTransition } from "react";
import { uploadReceipt } from "@/app/actions/order";
import { ERRORS } from "@/lib/constants";

export function ReceiptUpload({ orderId }: { orderId: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await uploadReceipt(orderId, formData);
      if (result.ok) {
        setMessage(result.message ?? "Bukti transfer berhasil diunggah");
        e.currentTarget.reset();
      } else {
        setError(result.error ?? "Gagal mengunggah");
      }
    });
  }

  return (
    <div className="rounded-xl border border-soft-grey bg-card p-4">
      <h3 className="font-serif text-lg font-bold text-ink">Unggah Bukti Transfer</h3>
      <p className="mt-1 text-sm text-ink-muted">
        Format file harus JPG atau PNG, maksimal 5MB.
      </p>
      <form onSubmit={handleSubmit} className="mt-3 space-y-3">
        <input
          type="file"
          name="receipt"
          accept="image/jpeg,image/png"
          required
          className="block w-full text-sm text-ink-muted file:mr-3 file:rounded-lg file:border-0 file:bg-turmeric file:px-4 file:py-2 file:font-medium file:text-ink"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-tomato px-4 py-2 text-sm font-semibold text-white transition hover:bg-tomato/90 disabled:opacity-50"
        >
          {isPending ? "Mengunggah" : "Unggah"}
        </button>
      </form>
      {message && (
        <p className="mt-3 rounded-lg border border-leaf bg-leaf/10 p-3 text-sm text-leaf">
          {message}
        </p>
      )}
      {error && (
        <p className="mt-3 rounded-lg border border-danger bg-danger/10 p-3 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
