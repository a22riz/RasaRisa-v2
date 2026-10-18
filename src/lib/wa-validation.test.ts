import { describe, it, expect } from "vitest";
import { waSchema } from "./validation";

describe("WA validation", () => {
  const validNumbers = [
    "081234567890",
    "08123456789",
    "+6281234567890",
    "6281234567890",
    "0812345678901",
    "08987654321",
  ];

  const invalidNumbers = [
    "",
    "12345",
    "0712345678",
    "081234", // too short
    "081234567890123456", // too long
    "halo",
    "+6281234",
    "6271234567890", // 07 not 08
  ];

  it.each(validNumbers)("accepts valid WA: %s", (num) => {
    const result = waSchema.safeParse(num);
    expect(result.success).toBe(true);
  });

  it.each(invalidNumbers)("rejects invalid WA: %s", (num) => {
    const result = waSchema.safeParse(num);
    expect(result.success).toBe(false);
  });
});
