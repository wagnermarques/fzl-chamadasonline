import { describe, expect, it } from "vitest";
import { generateCode } from "../src/lib/codeGenerator.js";

describe("generateCode", () => {
  it("generates a code of the requested length from the safe alphabet (no 0/O/1/I)", () => {
    for (let i = 0; i < 50; i++) {
      const code = generateCode(5);
      expect(code).toHaveLength(5);
      expect(code).toMatch(/^[A-HJ-NP-Z2-9]+$/);
    }
  });

  it("respects a different requested length", () => {
    expect(generateCode(6)).toHaveLength(6);
  });
});
