import Link from "next/link";
import { LoginForm } from "@/components/admin/login-form";

export default async function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl border border-soft-grey bg-card p-6">
        <div className="mb-6 text-center">
          <Link href="/" className="font-serif text-2xl font-bold text-tomato">
            RasaRisa
          </Link>
          <p className="mt-1 text-sm text-ink-muted">Admin Dashboard</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
