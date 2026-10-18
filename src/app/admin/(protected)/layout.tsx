import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { adminLogout } from "@/app/actions/admin/auth";

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Pesanan" },
  { href: "/admin/products", label: "Produk" },
  { href: "/admin/po", label: "Pre-Order" },
  { href: "/admin/reports", label: "Laporan" },
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

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="border-b border-soft-grey bg-card lg:border-r lg:border-b-0 lg:w-56 lg:shrink-0">
        <div className="p-4">
          <Link href="/admin" className="font-serif text-xl font-bold text-tomato">
            RasaRisa
          </Link>
          <p className="text-xs text-ink-muted">Admin Panel</p>
        </div>
        <nav className="flex gap-1 overflow-x-auto p-2 lg:flex-col lg:gap-0">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-ink transition hover:bg-cream lg:block"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-2">
          <form action={adminLogout}>
            <button
              type="submit"
              className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-danger transition hover:bg-danger/5"
            >
              Keluar
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 bg-cream p-4 lg:p-8">{children}</main>
    </div>
  );
}
