import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { adminLogout } from "@/app/actions/admin/auth";
import { prisma } from "@/lib/prisma";
import { Logo } from "@/components/logo";

const navSections = [
  {
    section: "Utama",
    items: [
      { href: "/admin", label: "Dashboard", icon: "📊" },
      { href: "/admin/orders", label: "Pesanan", icon: "📦", badge: true },
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

  const verifyCount = await prisma.order.count({
    where: { status: "WAITING_PAYMENT", receiptImage: { not: null } },
  });

  return (
    <div className="rr-admin-layout">
      <aside className="rr-sidebar">
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
                {item.badge && verifyCount > 0 && (
                  <span className="rr-nav-badge">{verifyCount}</span>
                )}
              </Link>
            ))}
          </div>
        ))}
        <div className="rr-nav-section">Akun</div>
        <form action={adminLogout}>
          <button type="submit" className="rr-nav-item rr-nav-logout">
            <span className="icon">🚪</span>
            Keluar
          </button>
        </form>
      </aside>

      <main className="rr-admin-main">
        {children}
      </main>
    </div>
  );
}
