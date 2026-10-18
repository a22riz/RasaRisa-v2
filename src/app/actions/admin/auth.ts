"use server";

import { redirect } from "next/navigation";
import { login as doLogin, logout as doLogout } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";
import { revalidatePath } from "next/cache";

export async function adminLogin(formData: FormData) {
  const email = (formData.get("email") as string)?.trim();
  const password = (formData.get("password") as string) ?? "";

  const parsed = loginSchema.safeParse({ email, password });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const result = await doLogin(parsed.data.email, parsed.data.password);
  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  revalidatePath("/admin");
  redirect("/admin");
}

export async function adminLogout() {
  await doLogout();
  revalidatePath("/admin");
  redirect("/admin/login");
}
