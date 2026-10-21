"use client";

import { useState } from "react";

export function CopyButton({
  value,
  path,
  label = "📋 Salin nomor rekening",
  className = "rr-btn-ghost mt-3.5 text-[13px]",
}: {
  value?: string;
  path?: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    const text = path ? `${window.location.origin}${path}` : (value ?? "");
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button type="button" onClick={handleCopy} className={className}>
      {copied ? "✓ Disalin" : label}
    </button>
  );
}
