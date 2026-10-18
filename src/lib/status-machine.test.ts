import { describe, it, expect } from "vitest";
import {
  canTransition,
  nextStatus,
  isTerminal,
  validateTransition,
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
