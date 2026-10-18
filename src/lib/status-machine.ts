import { ERRORS, STATUS_TRANSITIONS, type OrderStatus } from "./constants";

export function nextStatus(current: OrderStatus): OrderStatus | null {
  return STATUS_TRANSITIONS[current];
}

export function isTerminal(status: OrderStatus): boolean {
  return status === "COMPLETED" || status === "EXPIRED";
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  if (from === to) return false;
  if (isTerminal(from)) return false;
  // Forward-only: must be the immediate next status, OR WAITING_PAYMENT -> EXPIRED
  if (to === "EXPIRED") return from === "WAITING_PAYMENT";
  return nextStatus(from) === to;
}

export function validateTransition(
  from: OrderStatus,
  to: OrderStatus,
): { ok: true } | { ok: false; error: string } {
  if (canTransition(from, to)) return { ok: true };
  return { ok: false, error: ERRORS.STATUS_BACKWARD };
}
