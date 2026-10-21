"use client";

import { useState } from "react";

type PoChip = {
  id: string;
  dateLabel: string;
  timeLabel: string;
};

export function PoChipSelector({ chips }: { chips: PoChip[] }) {
  const [activeId, setActiveId] = useState(chips[0]?.id);

  return (
    <div className="flex gap-2.5 flex-wrap">
      {chips.map((chip) => (
        <a
          key={chip.id}
          href={`#po-${chip.id}`}
          className={`rr-po-chip ${activeId === chip.id ? "active" : ""}`}
          onClick={() => setActiveId(chip.id)}
          aria-current={activeId === chip.id ? "true" : undefined}
        >
          <span className="rr-po-chip-date">{chip.dateLabel}</span>
          <span className="rr-po-chip-meta">Tutup {chip.timeLabel}</span>
        </a>
      ))}
    </div>
  );
}
