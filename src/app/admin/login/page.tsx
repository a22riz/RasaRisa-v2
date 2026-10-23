import { LoginForm } from "@/components/admin/login-form";
import { Logo } from "@/components/logo";
import Link from "next/link";

// Split layout: brand panel (dark brown, cream logo) anchors admin identity on
// the auth screen; form panel stays functional. turmeric accent on the value
// prop is the one deliberate accent on the brand panel.
export default async function AdminLoginPage() {
  return (
    <div className="min-h-screen md:grid md:grid-cols-2">
      <aside className="rr-login-brand">
        <div className="rr-login-brand-inner">
          <Logo variant="light" />
          <p className="rr-login-tagline">
            Makan Praktis, Enak, <span className="rr-login-accent">Tanpa Ribet!</span>
          </p>
          <p className="rr-login-support">
            Dapur rumahan untuk tetangga sekitar. Masuk untuk mengelola pesanan, pre-order, dan
            laporan.
          </p>
        </div>
      </aside>

      <main className="flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="rr-card" style={{ marginBottom: 0 }}>
            <h1 className="rr-login-heading">Masuk</h1>
            <p className="rr-card-sub">Kelola pesanan dan pre-order RasaRisa.</p>
            <LoginForm />
          </div>
          <p className="text-center text-xs text-ink-muted mt-4">
            <Link href="/" className="hover:text-tomato transition">
              ← Kembali ke katalog
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
