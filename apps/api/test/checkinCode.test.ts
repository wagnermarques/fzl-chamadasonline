import { describe, expect, it } from "vitest";
import { generateCode } from "../src/lib/checkinCode.js";

describe("generateCode", () => {
  it("generates a 5-character code from the safe alphabet (no 0/O/1/I)", () => {
    for (let i = 0; i < 50; i++) {
      const code = generateCode();
      expect(code).toHaveLength(5);
      expect(code).toMatch(/^[A-HJ-NP-Z2-9]+$/);
    }
  });
});
