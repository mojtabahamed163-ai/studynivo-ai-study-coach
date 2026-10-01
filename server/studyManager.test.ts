import { describe, expect, it } from "vitest";
import { chunkText } from "./ai/materialProcessor";
import { rankStudySignals } from "./studyManager";

describe("StudyNivo study manager", () => {
  it("prioritizes an urgent weak topic", () => {
    const result = rankStudySignals([
      { subjectId: 1, subjectName: "Biology", topicId: 2, topicName: "Genetics", mastery: 42, examDays: 5, repeatedMistakes: 2 },
      { subjectId: 3, subjectName: "History", topicId: 4, topicName: "Dates", mastery: 80, examDays: 14 },
    ], 30);
    expect(result?.title).toContain("Biology");
    expect(result?.recommendedMinutes).toBe(30);
  });

  it("chunks long material with source labels", () => {
    const chunks = chunkText("Cell structure. ".repeat(500), 180, 20);
    expect(chunks.length).toBeGreaterThan(2);
    expect(chunks[0]?.sourceRef).toBe("Text section 1");
    expect(chunks.every((chunk) => chunk.text.length > 0)).toBe(true);
  });
});
