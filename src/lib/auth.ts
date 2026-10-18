import { cookies } from "next/headers";
import { getIronSession, type SessionOptions } from "iron-session";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { LOCKOUT_THRESHOLD, LOCKOUT_MINUTES } from "./constants";

export interface AdminSession {
  adminId?: string;
  email?: string;
}

const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || "change-me-to-a-long-random-string-at-least-32-chars",
  cookieName: "rasarisa-admin",
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
  },
};

export async function getSession() {
  const store = await cookies();
  return getIronSession<AdminSession>(store, sessionOptions);
}

export async function requireAdmin(): Promise<AdminSession> {
  const session = await getSession();
  if (!session.adminId) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function login(
  email: string,
  password: string,
): Promise<{ ok: true; session: AdminSession } | { ok: false; error: string }> {
  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin) {
    return { ok: false, error: "Email atau password salah" };
  }

  // Lockout check
  if (admin.lockedUntil && admin.lockedUntil > new Date()) {
    const minsLeft = Math.ceil((admin.lockedUntil.getTime() - Date.now()) / 60000);
    return {
      ok: false,
      error: `Akun terkunci. Coba lagi dalam ${minsLeft} menit.`,
    };
  }

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) {
    const attempts = admin.failedAttempts + 1;
    const shouldLock = attempts >= LOCKOUT_THRESHOLD;
    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        failedAttempts: attempts,
        lockedUntil: shouldLock
          ? new Date(Date.now() + LOCKOUT_MINUTES * 60000)
          : null,
      },
    });
    return { ok: false, error: "Email atau password salah" };
  }

  // Reset on success
  await prisma.admin.update({
    where: { id: admin.id },
    data: { failedAttempts: 0, lockedUntil: null },
  });

  const session = await getSession();
  session.adminId = admin.id;
  session.email = admin.email;
  await session.save();

  return { ok: true, session };
}

export async function logout(): Promise<void> {
  const session = await getSession();
  session.destroy();
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}
