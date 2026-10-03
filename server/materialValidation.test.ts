import { describe, expect, it } from "vitest";
import {
  decodeBase64Payload,
  hasExpectedSignature,
  sanitizeMaterialName,
} from "./materialValidation";

describe("uploaded material validation", () => {
  it("accepts a correctly typed PDF data URL", () => {
    const bytes = Buffer.from("%PDF-1.7 sample document");
    const data = decodeBase64Payload(
      `data:application/pdf;base64,${bytes.toString("base64")}`,
      "pdf",
      "application/pdf"
    );
    expect(hasExpectedSignature(data, "pdf", "application/pdf")).toBe(true);
  });

  it("rejects malformed base64 and a MIME mismatch", () => {
    expect(() => decodeBase64Payload("%%%", "pdf", "application/pdf")).toThrow(
      "INVALID_BASE64_PAYLOAD"
    );
    expect(() =>
      decodeBase64Payload(
        "data:image/png;base64,SGVsbG8=",
        "image",
        "image/jpeg"
      )
    ).toThrow("FILE_MIME_MISMATCH");
  });

  it("checks the WebP container brand, not only a generic RIFF header", () => {
    expect(
      hasExpectedSignature(
        Buffer.from("RIFF0000WEBP", "ascii"),
        "image",
        "image/webp"
      )
    ).toBe(true);
    expect(
      hasExpectedSignature(
        Buffer.from("RIFF0000WAVE", "ascii"),
        "image",
        "image/webp"
      )
    ).toBe(false);
  });

  it("keeps only a safe filename leaf", () => {
    expect(sanitizeMaterialName("../../notes\\final?.pdf")).toBe("final_.pdf");
    expect(() => sanitizeMaterialName("../../")).toThrow("INVALID_FILE_NAME");
  });
});
