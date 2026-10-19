import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { adminLogout } from "@/app/actions/admin/auth";
import { Logo } from "@/components/logo";

const navSections = [
  {
    section: "Utama",
    items: [
      { href: "/admin", label: "Dashboard", icon: "📊" },
      { href: "/admin/orders", label: "Pesanan", icon: "📦" },
      { href: "/admin/products", label: "Katalog Menu", icon: "🍽️" },
      { href: "/admin/po", label: "Kelola PO", icon: "📅" },
    ],
  },
  {
    section: "Laporan",
    items: [
      { href: "/admin/reports", label: "Laporan Keuangan", icon: "💰" },
    ],
  },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session.adminId) {
    redirect("/admin/login");
  }

  const currentPath = "/admin"; // Static for now; active state via URL matching in client

  return (
    <div className="grid min-h-screen" style={{ gridTemplateColumns: "240px 1fr" }}>
      {/* Sidebar */}
      <aside className="rr-sidebar hidden lg:block">
        <div className="rr-sidebar-logo">
          <Logo variant="light" />
        </div>
        {navSections.map((sec) => (
          <div key={sec.section}>
            <div className="rr-nav-section">{sec.section}</div>
            {sec.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rr-nav-item ${item.href === "/admin" ? "active" : ""}`}
              >
                <span className="icon">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        ))}
        <div className="rr-nav-section">Akun</div>
        <form action={adminLogout}>
          <button type="submit" className="rr-nav-item" style={{ background: "none", border: "none", width: "100%", textAlign: "left" }}>
            <span className="icon">🚪</span>
            Keluar
          </button>
        </form>
      </aside>

      {/* Mobile sidebar (horizontal scroll) */}
      <aside className="lg:hidden rr-sidebar" style={{ position: "static", height: "auto", display: "flex", overflowX: "auto", padding: "12px", gap: 4 }}>
        <Link href="/admin" className="rr-nav-item active" style={{ borderLeft: "none", borderBottom: "3px solid var(--color-tomato)", whiteSpace: "nowrap" }}>
          📊 Dashboard
        </Link>
        <Link href="/admin/orders" className="rr-nav-item" style={{ borderLeft: "none", whiteSpace: "nowrap" }}>
          📦 Pesanan
        </Link>
        <Link href="/admin/products" className="rr-nav-item" style={{ borderLeft: "none", whiteSpace: "nowrap" }}>
          🍽️ Menu
        </Link>
        <Link href="/admin/po" className="rr-nav-item" style={{ borderLeft: "none", whiteSpace: "nowrap" }}>
          📅 PO
        </Link>
        <Link href="/admin/reports" className="rr-nav-item" style={{ borderLeft: "none", whiteSpace: "nowrap" }}>
          💰 Laporan
        </Link>
      </aside>

      <main className="bg-cream overflow-y-auto" style={{ padding: "28px 32px" }}>
        {children}
      </main>
    </div>
  );
}
