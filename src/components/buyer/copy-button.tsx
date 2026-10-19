"use client";

import { useState } from "react";

export function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard?.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="mt-3.5 rr-btn-ghost text-[13px]"
    >
      {copied ? "✓ Disalin" : "📋 Salin nomor rekening"}
    </button>
  );
}
