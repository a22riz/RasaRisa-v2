export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

// PO label like "PO Sabtu, 18 Okt"
export function formatPoLabel(readyDate: Date | string): string {
  const d = typeof readyDate === "string" ? new Date(readyDate) : readyDate;
  const weekday = new Intl.DateTimeFormat("id-ID", { weekday: "long" }).format(d);
  const day = d.getDate();
  const month = new Intl.DateTimeFormat("id-ID", { month: "short" }).format(d);
  return `PO ${weekday}, ${day} ${month}`;
}

// "18 Okt" — day + month short (for hero tag)
export function formatDayMonth(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const day = d.getDate();
  const month = new Intl.DateTimeFormat("id-ID", { month: "short" }).format(d);
  return `${day} ${month}`;
}

// "Sabtu, 18 Okt" — weekday, day + month short (for PO chip)
export function formatWeekdayDayMonth(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const weekday = new Intl.DateTimeFormat("id-ID", { weekday: "long" }).format(d);
  const day = d.getDate();
  const month = new Intl.DateTimeFormat("id-ID", { month: "short" }).format(d);
  return `${weekday}, ${day} ${month}`;
}

// "Jumat, 23.59" — weekday, HH.MM (for close label)
export function formatWeekdayTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const weekday = new Intl.DateTimeFormat("id-ID", { weekday: "long" }).format(d);
  const time = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
  return `${weekday}, ${time}`;
}
