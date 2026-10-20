import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { adminLogout } from "@/app/actions/admin/auth";
import { prisma } from "@/lib/prisma";
import { Logo } from "@/components/logo";
import { AdminNav } from "@/components/admin/admin-nav";

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
        <AdminNav verifyCount={verifyCount} />
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
