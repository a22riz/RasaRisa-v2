"use client";

import { useState, useTransition } from "react";
import { adminLogin } from "@/app/actions/admin/auth";

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await adminLogin(formData);
      if (!result.ok) {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rr-field" style={{ marginBottom: 0 }}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="admin@rasarisa.id"
        />
      </div>
      <div className="rr-field" style={{ marginBottom: 0 }}>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          required
        />
      </div>
      {error && (
        <div className="rounded-lg border border-danger bg-danger/10 p-3 text-sm text-danger">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="rr-btn-primary w-full justify-center"
        style={{ borderRadius: 10, padding: 13, fontSize: 15, fontWeight: 700 }}
      >
        {isPending ? "Memproses..." : "Masuk"}
      </button>
    </form>
  );
}
