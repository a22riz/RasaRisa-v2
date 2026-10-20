"use client";

import { useState } from "react";
import { saveSettings } from "@/app/actions/admin/settings";

export function SettingsForm({
  bankAccount,
  adminWa,
  deliveryNote,
}: {
  bankAccount: string;
  adminWa: string;
  deliveryNote: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setSaved(false);
    const result = await saveSettings(formData);
    if (!result.ok) {
      setError(result.error ?? "Gagal menyimpan");
    } else {
      setSaved(true);
    }
  }

  return (
    <form action={handleSubmit} className="rr-card" style={{ marginBottom: 0 }}>
      <div className="rr-field">
        <label htmlFor="bank_account">
          Rekening Bank <span className="req">*</span>
        </label>
        <input
          id="bank_account"
          name="bank_account"
          type="text"
          required
          defaultValue={bankAccount}
          placeholder="BCA 1234567890 a.n. Rasa Risa"
        />
        <p className="hint">Format: [Bank] [No Rek] a.n. [Nama]</p>
      </div>

      <div className="rr-field">
        <label htmlFor="admin_wa">
          Nomor WhatsApp Admin <span className="req">*</span>
        </label>
        <input
          id="admin_wa"
          name="admin_wa"
          type="tel"
          required
          defaultValue={adminWa}
          placeholder="08xxxxxxxxxx"
        />
        <p className="hint">
          Nomor ini dipakai untuk tombol hubungi admin di halaman pembeli.
        </p>
      </div>

      <div className="rr-field">
        <label htmlFor="delivery_note">Catatan Pengiriman (opsional)</label>
        <textarea
          id="delivery_note"
          name="delivery_note"
          rows={2}
          defaultValue={deliveryNote}
          placeholder="Antar gratis area sekitar. Hubungi WA untuk jangkauan."
        />
      </div>

      {error && (
        <div className="rounded-lg border border-danger bg-danger/10 p-3 text-sm text-danger mb-4">
          {error}
        </div>
      )}
      {saved && (
        <div className="rounded-lg border border-leaf bg-leaf/10 p-3 text-sm text-leaf mb-4">
          Pengaturan tersimpan.
        </div>
      )}

      <button type="submit" className="rr-btn-primary flex-1 justify-center">
        Simpan Pengaturan
      </button>
    </form>
  );
}
