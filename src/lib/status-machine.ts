import {
  ERRORS,
  GROUP_STATUS_TRANSITIONS,
  STATUS_TRANSITIONS,
  type FulfillmentGroupStatus,
  type OrderStatus,
} from "./constants";

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

// --- Fulfillment group machine ---

export function nextGroupStatus(
  current: FulfillmentGroupStatus,
): FulfillmentGroupStatus | null {
  return GROUP_STATUS_TRANSITIONS[current];
}

export function isGroupTerminal(status: FulfillmentGroupStatus): boolean {
  return status === "COMPLETED";
}

export function canTransitionGroup(
  from: FulfillmentGroupStatus,
  to: FulfillmentGroupStatus,
): boolean {
  if (from === to) return false;
  if (isGroupTerminal(from)) return false;
  return nextGroupStatus(from) === to;
}

export function validateGroupTransition(
  from: FulfillmentGroupStatus,
  to: FulfillmentGroupStatus,
): { ok: true } | { ok: false; error: string } {
  if (canTransitionGroup(from, to)) return { ok: true };
  return { ok: false, error: ERRORS.STATUS_BACKWARD };
}

// Derive order status from fulfillment groups.
// Returns the LEAST-advanced group status (order reflects minimum progress).
// Order is only "READY" when every batch is ready, "COMPLETED" when all done.
// FulfillmentGroupStatus names map 1:1 to OrderStatus names.
export function deriveOrderStatusFromGroups(
  groups: { status: FulfillmentGroupStatus }[],
): OrderStatus | null {
  if (groups.length === 0) return null;
  const rank: Record<FulfillmentGroupStatus, number> = {
    PROCESSING: 0,
    READY_FOR_DELIVERY: 1,
    COMPLETED: 2,
  };
  let min: FulfillmentGroupStatus = "COMPLETED";
  for (const g of groups) {
    if (rank[g.status] < rank[min]) min = g.status;
  }
  // ponytail: FulfillmentGroupStatus values are a subset of OrderStatus.
  // Safe cast; upgrade path: if group statuses ever diverge from order
  // statuses, add an explicit mapping table here.
  return min as OrderStatus;
}
