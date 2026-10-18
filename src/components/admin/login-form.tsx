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
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-ink">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="mt-1 w-full rounded-lg border border-soft-grey bg-card px-3 py-2 text-ink"
          placeholder="admin@rasarisa.id"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-ink">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="mt-1 w-full rounded-lg border border-soft-grey bg-card px-3 py-2 text-ink"
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
        className="w-full rounded-lg bg-tomato px-4 py-3 font-semibold text-white transition hover:bg-tomato/90 disabled:opacity-50"
      >
        {isPending ? "Masuk" : "Masuk"}
      </button>
    </form>
  );
}
