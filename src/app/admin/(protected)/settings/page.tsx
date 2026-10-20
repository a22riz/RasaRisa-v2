import { prisma } from "@/lib/prisma";
import { SettingsForm } from "@/components/admin/settings-form";

async function getSetting(key: string): Promise<string> {
  const s = await prisma.setting.findUnique({ where: { key } });
  return s?.value ?? "";
}

export default async function AdminSettingsPage() {
  const [bankAccount, adminWa, deliveryNote] = await Promise.all([
    getSetting("bank_account"),
    getSetting("admin_wa"),
    getSetting("delivery_note"),
  ]);

  return (
    <div className="max-w-xl">
      <h1 className="font-serif text-3xl font-bold mb-1">Pengaturan</h1>
      <p className="text-ink-muted text-sm mb-6">
        Ubah data kontak dan rekening untuk pembeli.
      </p>

      <SettingsForm
        bankAccount={bankAccount}
        adminWa={adminWa}
        deliveryNote={deliveryNote}
      />
    </div>
  );
}
