"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
  {
    section: "Pengaturan",
    items: [
      { href: "/admin/settings", label: "Pengaturan", icon: "⚙️" },
    ],
  },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname.startsWith(href);
}

export function AdminNav({ verifyCount }: { verifyCount: number }) {
  const pathname = usePathname();

  return (
    <>
      {navSections.map((sec) => (
        <div key={sec.section}>
          <div className="rr-nav-section">{sec.section}</div>
          {sec.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rr-nav-item ${isActive(pathname, item.href) ? "active" : ""}`}
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
    </>
  );
}
