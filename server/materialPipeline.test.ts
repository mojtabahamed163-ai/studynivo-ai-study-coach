import { afterEach, describe, expect, it, vi } from "vitest";
import { transcribeAudio } from "./materialPipeline";

describe("audio transcription pipeline", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.MANUS_API_URL;
    delete process.env.MANUS_API_KEY;
  });

  it("sends audio as multipart and returns detected language, duration, and timestamp segments", async () => {
    process.env.MANUS_API_URL = "https://speech.test";
    process.env.MANUS_API_KEY = "test-key";
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      text: "Cell division separates genetic material into daughter cells.",
      language: "en",
      duration: 91.4,
      segments: [{ id: 0, start: 12.2, end: 18.7, text: "Cell division separates genetic material." }],
    }), { status: 200, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await transcribeAudio(Buffer.from("ID3 lecture bytes"), "audio/mpeg");
    expect(result).toMatchObject({ text: "Cell division separates genetic material into daughter cells.", detectedLanguage: "en", audioDurationSeconds: 91, transcriptSegments: [{ start: 12.2, end: 18.7 }] });
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://speech.test/v1/audio/transcriptions");
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({ Authorization: "Bearer test-key" });
    expect(init.body).toBeInstanceOf(FormData);
  });
});
