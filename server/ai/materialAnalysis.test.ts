import { describe, expect, it, vi } from "vitest";
import { extractTopicInsights } from "./materialAnalysis";

vi.mock("./client", () => ({
  chatCompletion: vi.fn(async () => JSON.stringify({ topics: [
    { name: "Cell division", note: "Understand how genetic material is separated.", sourceRef: "Lecture · Text section 1" },
    { name: "DNA replication", note: "Remember the major steps of replication.", sourceRef: "Lecture · Text section 2" },
  ] })),
}));

describe("material topic analysis", () => {
  it("returns normalized, deduplicated study-worthy topics across chunks", async () => {
    const text = Array.from({ length: 12 }, (_, index) => `Cell division and DNA replication are important concepts in lecture section ${index}.`).join(" ");
    const result = await extractTopicInsights(text, "Lecture", "Biology");
    expect(result).toHaveLength(2);
    expect(result.map((topic) => topic.name)).toEqual(["Cell division", "DNA replication"]);
    expect(result[0]?.sourceRef).toContain("Lecture · Text section 1");
  });
});
