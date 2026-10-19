import { describe, it, expect } from "vitest";
import {
  canTransition,
  nextStatus,
  isTerminal,
  validateTransition,
  nextGroupStatus,
  isGroupTerminal,
  canTransitionGroup,
  validateGroupTransition,
  deriveOrderStatusFromGroups,
} from "./status-machine";
import { ERRORS } from "./constants";

describe("status machine", () => {
  describe("nextStatus", () => {
    it("returns next status for forward-only transitions", () => {
      expect(nextStatus("WAITING_PAYMENT")).toBe("PAYMENT_CONFIRMED");
      expect(nextStatus("PAYMENT_CONFIRMED")).toBe("PROCESSING");
      expect(nextStatus("PROCESSING")).toBe("READY_FOR_DELIVERY");
      expect(nextStatus("READY_FOR_DELIVERY")).toBe("COMPLETED");
    });

    it("returns null for terminal statuses", () => {
      expect(nextStatus("COMPLETED")).toBeNull();
      expect(nextStatus("EXPIRED")).toBeNull();
    });
  });

  describe("isTerminal", () => {
    it("returns true for COMPLETED and EXPIRED", () => {
      expect(isTerminal("COMPLETED")).toBe(true);
      expect(isTerminal("EXPIRED")).toBe(true);
    });

    it("returns false for non-terminal statuses", () => {
      expect(isTerminal("WAITING_PAYMENT")).toBe(false);
      expect(isTerminal("PAYMENT_CONFIRMED")).toBe(false);
      expect(isTerminal("PROCESSING")).toBe(false);
      expect(isTerminal("READY_FOR_DELIVERY")).toBe(false);
    });
  });

  describe("canTransition", () => {
    it("allows forward transitions", () => {
      expect(canTransition("WAITING_PAYMENT", "PAYMENT_CONFIRMED")).toBe(true);
      expect(canTransition("PAYMENT_CONFIRMED", "PROCESSING")).toBe(true);
      expect(canTransition("PROCESSING", "READY_FOR_DELIVERY")).toBe(true);
      expect(canTransition("READY_FOR_DELIVERY", "COMPLETED")).toBe(true);
    });

    it("allows WAITING_PAYMENT to EXPIRED", () => {
      expect(canTransition("WAITING_PAYMENT", "EXPIRED")).toBe(true);
    });

    it("rejects backward transitions", () => {
      expect(canTransition("PROCESSING", "PAYMENT_CONFIRMED")).toBe(false);
      expect(canTransition("READY_FOR_DELIVERY", "PROCESSING")).toBe(false);
      expect(canTransition("COMPLETED", "READY_FOR_DELIVERY")).toBe(false);
    });

    it("rejects transitions from terminal statuses", () => {
      expect(canTransition("COMPLETED", "WAITING_PAYMENT")).toBe(false);
      expect(canTransition("EXPIRED", "WAITING_PAYMENT")).toBe(false);
    });

    it("rejects same-status transitions", () => {
      expect(canTransition("WAITING_PAYMENT", "WAITING_PAYMENT")).toBe(false);
    });

    it("rejects EXPIRED from non-WAITING_PAYMENT statuses", () => {
      expect(canTransition("PROCESSING", "EXPIRED")).toBe(false);
      expect(canTransition("COMPLETED", "EXPIRED")).toBe(false);
    });
  });

  describe("validateTransition", () => {
    it("returns ok for valid forward transition", () => {
      const result = validateTransition("WAITING_PAYMENT", "PAYMENT_CONFIRMED");
      expect(result.ok).toBe(true);
    });

    it("returns error with backward message for invalid transition", () => {
      const result = validateTransition("PROCESSING", "PAYMENT_CONFIRMED");
      if (!result.ok) {
        expect(result.error).toBe(ERRORS.STATUS_BACKWARD);
      }
    });

    it("returns error for transition from terminal status", () => {
      const result = validateTransition("COMPLETED", "READY_FOR_DELIVERY");
      if (!result.ok) {
        expect(result.error).toBe(ERRORS.STATUS_BACKWARD);
      }
    });
  });
});

describe("fulfillment group machine", () => {
  describe("nextGroupStatus", () => {
    it("returns next status for forward-only transitions", () => {
      expect(nextGroupStatus("PROCESSING")).toBe("READY_FOR_DELIVERY");
      expect(nextGroupStatus("READY_FOR_DELIVERY")).toBe("COMPLETED");
    });

    it("returns null for terminal status", () => {
      expect(nextGroupStatus("COMPLETED")).toBeNull();
    });
  });

  describe("isGroupTerminal", () => {
    it("returns true only for COMPLETED", () => {
      expect(isGroupTerminal("COMPLETED")).toBe(true);
      expect(isGroupTerminal("PROCESSING")).toBe(false);
      expect(isGroupTerminal("READY_FOR_DELIVERY")).toBe(false);
    });
  });

  describe("canTransitionGroup", () => {
    it("allows forward transitions", () => {
      expect(canTransitionGroup("PROCESSING", "READY_FOR_DELIVERY")).toBe(true);
      expect(canTransitionGroup("READY_FOR_DELIVERY", "COMPLETED")).toBe(true);
    });

    it("rejects backward transitions", () => {
      expect(canTransitionGroup("READY_FOR_DELIVERY", "PROCESSING")).toBe(false);
      expect(canTransitionGroup("COMPLETED", "READY_FOR_DELIVERY")).toBe(false);
    });

    it("rejects same-status transitions", () => {
      expect(canTransitionGroup("PROCESSING", "PROCESSING")).toBe(false);
    });
  });

  describe("validateGroupTransition", () => {
    it("returns ok for valid forward transition", () => {
      const result = validateGroupTransition("PROCESSING", "READY_FOR_DELIVERY");
      expect(result.ok).toBe(true);
    });

    it("returns backward error for invalid transition", () => {
      const result = validateGroupTransition("COMPLETED", "READY_FOR_DELIVERY");
      if (!result.ok) {
        expect(result.error).toBe(ERRORS.STATUS_BACKWARD);
      }
    });
  });

  describe("deriveOrderStatusFromGroups", () => {
    it("returns null for empty groups", () => {
      expect(deriveOrderStatusFromGroups([])).toBeNull();
    });

    it("returns the least-advanced status (min)", () => {
      const mixed = [
        { status: "READY_FOR_DELIVERY" as const },
        { status: "PROCESSING" as const },
      ];
      expect(deriveOrderStatusFromGroups(mixed)).toBe("PROCESSING");
    });

    it("returns READY only when all groups are READY or beyond", () => {
      const all = [
        { status: "READY_FOR_DELIVERY" as const },
        { status: "COMPLETED" as const },
      ];
      expect(deriveOrderStatusFromGroups(all)).toBe("READY_FOR_DELIVERY");
    });

    it("returns COMPLETED only when all groups COMPLETED", () => {
      const all = [
        { status: "COMPLETED" as const },
        { status: "COMPLETED" as const },
      ];
      expect(deriveOrderStatusFromGroups(all)).toBe("COMPLETED");
    });

    it("single group reflects that group's status", () => {
      expect(deriveOrderStatusFromGroups([{ status: "PROCESSING" }])).toBe(
        "PROCESSING",
      );
      expect(deriveOrderStatusFromGroups([{ status: "COMPLETED" }])).toBe(
        "COMPLETED",
      );
    });
  });
});
