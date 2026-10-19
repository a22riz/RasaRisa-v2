"use client";

import { useState, useTransition } from "react";
import { uploadReceipt } from "@/app/actions/order";

export function ReceiptUpload({ orderId }: { orderId: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    startTransition(async () => {
      const result = await uploadReceipt(orderId, formData);
      if (result.ok) {
        setMessage(result.message ?? "Bukti transfer berhasil diunggah");
        form.reset();
      } else {
        setError(result.error ?? "Gagal mengunggah");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label
        htmlFor="receipt"
        className="block rounded-xl p-8 text-center cursor-pointer transition"
        style={{
          border: "2px dashed var(--color-soft-grey)",
          background: "var(--color-cream)",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-tomato)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-soft-grey)"; }}
      >
        <div className="text-4xl mb-2.5">📷</div>
        <h3 className="font-serif text-lg font-semibold mb-1">Klik untuk unggah bukti transfer</h3>
        <p className="text-[13px] text-ink-muted">atau seret foto ke sini</p>
        <span className="inline-block mt-2.5 px-3 py-1.5 bg-card rounded-full text-xs text-ink-muted">
          JPG atau PNG, maksimal 5MB
        </span>
      </label>
      <input
        id="receipt"
        type="file"
        name="receipt"
        accept="image/jpeg,image/png"
        required
        className="hidden"
        onChange={(e) => { const f = e.currentTarget.form; f?.requestSubmit(); }}
      />
      {message && (
        <p className="rounded-lg border border-leaf bg-leaf/10 p-3 text-sm text-leaf">{message}</p>
      )}
      {error && (
        <p className="rounded-lg border border-danger bg-danger/10 p-3 text-sm text-danger">{error}</p>
      )}
      {isPending && (
        <p className="text-sm text-ink-muted">Mengunggah...</p>
      )}
    </form>
  );
}
