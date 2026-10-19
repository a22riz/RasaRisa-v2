import Link from "next/link";
import { LoginForm } from "@/components/admin/login-form";
import { Logo } from "@/components/logo";

export default async function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <Link href="/" className="inline-block">
            <Logo />
          </Link>
          <p className="mt-2 text-sm text-ink-muted">Admin Dashboard</p>
        </div>
        <div className="rr-card" style={{ marginBottom: 0 }}>
          <LoginForm />
        </div>
        <p className="text-center text-xs text-ink-muted mt-4">
          <Link href="/" className="hover:text-tomato transition">← Kembali ke katalog</Link>
        </p>
      </div>
    </div>
  );
}
