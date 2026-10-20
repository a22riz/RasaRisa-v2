"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { waSchema } from "@/lib/validation";
import { requireAdmin, hashPassword } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function saveSettings(formData: FormData) {
  await requireAdmin();

  const bankAccount = (formData.get("bank_account") as string)?.trim();
  const adminWa = (formData.get("admin_wa") as string)?.trim();
  const deliveryNote = (formData.get("delivery_note") as string)?.trim();

  if (!bankAccount) {
    return { ok: false, error: "Rekening bank wajib diisi" };
  }

  const waCheck = waSchema.safeParse(adminWa);
  if (!waCheck.success) {
    return { ok: false, error: "Nomor WA tidak valid" };
  }

  await Promise.all([
    prisma.setting.upsert({
      where: { key: "bank_account" },
      update: { value: bankAccount },
      create: { key: "bank_account", value: bankAccount },
    }),
    prisma.setting.upsert({
      where: { key: "admin_wa" },
      update: { value: adminWa },
      create: { key: "admin_wa", value: adminWa },
    }),
    prisma.setting.upsert({
      where: { key: "delivery_note" },
      update: { value: deliveryNote ?? "" },
      create: { key: "delivery_note", value: deliveryNote ?? "" },
    }),
  ]);

  revalidatePath("/admin/settings");
  return { ok: true };
}

export async function changePassword(formData: FormData) {
  const session = await requireAdmin();

  const currentPassword = (formData.get("current_password") as string) ?? "";
  const newPassword = (formData.get("new_password") as string) ?? "";

  if (newPassword.length < 8) {
    return { ok: false, error: "Password baru minimal 8 karakter" };
  }

  const admin = await prisma.admin.findUnique({
    where: { id: session.adminId },
  });
  if (!admin) {
    return { ok: false, error: "Admin tidak ditemukan" };
  }

  const valid = await bcrypt.compare(currentPassword, admin.passwordHash);
  if (!valid) {
    return { ok: false, error: "Password saat ini salah" };
  }

  const newHash = await hashPassword(newPassword);
  await prisma.admin.update({
    where: { id: admin.id },
    data: { passwordHash: newHash },
  });

  return { ok: true };
}
