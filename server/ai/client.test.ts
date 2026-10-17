import { afterEach, describe, expect, it, vi } from "vitest";
import { chatCompletion } from "./client";

describe("AI provider fallback", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("uses Gemini when the Manus-compatible provider is not configured", async () => {
    vi.stubEnv("MANUS_API_URL", "");
    vi.stubEnv("MANUS_API_KEY", "");
    vi.stubEnv("GEMINI_API_KEY", "test-gemini-key");
    vi.stubEnv("GEMINI_MODEL", "gemini-test");
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({
      candidates: [{ content: { parts: [{ text: "```json\n{\"answer\":\"شرح واضح\"}\n```" }] } }],
    }), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(chatCompletion([
      { role: "system", content: "You are a grounded teacher." },
      { role: "user", content: "Explain this." },
    ], { jsonSchema: { type: "object" } })).resolves.toBe('{"answer":"شرح واضح"}');

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("models/gemini-test:generateContent");
    expect(url).toContain("key=test-gemini-key");
    expect(JSON.parse(String(request.body)).generationConfig.responseMimeType).toBe("application/json");
  });
});
