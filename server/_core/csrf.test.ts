import { describe, expect, it } from "vitest";
import { isTrustedApiMutation } from "./csrf";

const host = "studynivo.example";

describe("same-origin API mutation guard", () => {
  it("allows same-origin mutations over the request host", () => {
    expect(
      isTrustedApiMutation({
        method: "POST",
        headers: { host, origin: `https://${host}` },
      })
    ).toBe(true);
  });

  it("allows same-origin requests with an explicit port", () => {
    expect(
      isTrustedApiMutation({
        method: "POST",
        headers: { host: "localhost:3000", origin: "http://localhost:3000" },
      })
    ).toBe(true);
  });

  it("allows published same-origin mutations using the forwarded public host", () => {
    expect(
      isTrustedApiMutation({
        method: "POST",
        headers: {
          host: "internal-webdev:3000",
          "x-forwarded-host": host,
          origin: `https://${host}`,
        },
      })
    ).toBe(true);
  });

  it("allows published requests when the proxy appends an internal host", () => {
    expect(
      isTrustedApiMutation({
        method: "POST",
        headers: {
          host: "internal-webdev:3000",
          "x-forwarded-host": `${host}, internal-webdev:3000`,
          origin: `https://${host}`,
        },
      })
    ).toBe(true);
  });

  it("rejects a cross-site Origin even when Fetch Metadata is absent", () => {
    expect(
      isTrustedApiMutation({
        method: "POST",
        headers: { host, origin: "https://attacker.example" },
      })
    ).toBe(false);
  });

  it("allows embedded Preview metadata when Origin is still same-origin", () => {
    expect(
      isTrustedApiMutation({
        method: "POST",
        headers: {
          host,
          origin: `https://${host}`,
          "sec-fetch-site": "cross-site",
        },
      })
    ).toBe(true);
  });

  it("rejects cross-site source and missing source headers", () => {
    expect(
      isTrustedApiMutation({
        method: "POST",
        headers: {
          host,
          origin: "https://attacker.example",
          "sec-fetch-site": "cross-site",
        },
      })
    ).toBe(false);
    expect(isTrustedApiMutation({ method: "POST", headers: { host } })).toBe(
      false
    );
  });

  it("accepts safe reads without a browser Origin header", () => {
    expect(isTrustedApiMutation({ method: "GET", headers: { host } })).toBe(
      true
    );
  });
});
