import { afterEach, describe, expect, it } from "vitest";
import {
  clearAuthFailures,
  isAuthRateLimited,
  recordAuthFailure,
  resetAuthRateLimitForTests,
} from "./authRateLimit";

describe("authentication failure limits", () => {
  afterEach(resetAuthRateLimitForTests);

  it("limits repeated failures by IP and the IP/identifier pair", () => {
    for (let index = 0; index < 8; index += 1) {
      recordAuthFailure("127.0.0.1", "email", "student@example.com", 1_000);
    }
    expect(
      isAuthRateLimited("127.0.0.1", "email", "student@example.com", 2_000)
    ).toBe(true);
    expect(
      isAuthRateLimited("127.0.0.2", "email", "student@example.com", 2_000)
    ).toBe(false);
    expect(
      isAuthRateLimited("127.0.0.1", "email", "another@example.com", 2_000)
    ).toBe(false);
  });

  it("keeps a higher abuse ceiling for a shared IP", () => {
    for (let index = 0; index < 80; index += 1) {
      recordAuthFailure("127.0.0.3", "email", `user${index}@example.com`, 1_000);
    }
    expect(
      isAuthRateLimited("127.0.0.3", "email", "new-user@example.com", 2_000)
    ).toBe(true);
  });

  it("expires counters after the 15-minute window", () => {
    for (let index = 0; index < 8; index += 1) {
      recordAuthFailure("127.0.0.1", "phone", "+15551234567", 1_000);
    }
    expect(
      isAuthRateLimited(
        "127.0.0.1",
        "phone",
        "+15551234567",
        1_000 + 15 * 60 * 1000
      )
    ).toBe(false);
  });

  it("clears counters after successful authentication", () => {
    for (let index = 0; index < 8; index += 1) {
      recordAuthFailure("127.0.0.1", "email", "a@example.com", 1_000);
    }
    clearAuthFailures("127.0.0.1", "email", "a@example.com");
    expect(
      isAuthRateLimited("127.0.0.1", "email", "a@example.com", 2_000)
    ).toBe(false);
  });
});
