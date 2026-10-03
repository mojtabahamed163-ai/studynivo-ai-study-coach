import { describe, expect, it } from "vitest";
import { isCurrentSessionVersion } from "./sessionVersion";

describe("session version invalidation", () => {
  it("accepts legacy tokens only while the stored version is still zero", () => {
    expect(isCurrentSessionVersion(undefined, 0)).toBe(true);
    expect(isCurrentSessionVersion(undefined, 1)).toBe(false);
  });

  it("rejects a token after its account version changes", () => {
    expect(isCurrentSessionVersion(4, 4)).toBe(true);
    expect(isCurrentSessionVersion(4, 5)).toBe(false);
    expect(isCurrentSessionVersion("5", 5)).toBe(false);
  });
});
