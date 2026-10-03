import { describe, expect, it } from "vitest";
import { chunkText } from "./ai/materialProcessor";
import {
  buildUnresolvedMistakeReviews,
  rankStudySignals,
  type MistakeReviewHistoryItem,
} from "./studyManager";

const baseMistake = (overrides: Partial<MistakeReviewHistoryItem> = {}): MistakeReviewHistoryItem => ({
  key: "biology:genetics",
  subjectId: 1,
  subjectName: "Biology",
  topicId: 2,
  topicName: "Genetics",
  prompt: "Which action checks recall?",
  selectedAnswer: "Read it once",
  correctAnswer: "Explain it and answer a new question",
  sourceRef: "Lecture 3 · p. 14",
  isCorrect: false,
  confidence: "low",
  createdAt: "2026-10-01T10:00:00.000Z",
  ...overrides,
});

describe("StudyNivo study manager", () => {
  it("prioritizes exam urgency, repeated mistakes, and due review", () => {
    const result = rankStudySignals(
      [
        {
          subjectId: 1,
          subjectName: "Biology",
          topicId: 2,
          topicName: "Genetics",
          mastery: 42,
          examDays: 5,
          repeatedMistakes: 2,
          dueReviews: 2,
          confidence: 35,
        },
        { subjectId: 3, subjectName: "History", topicId: 4, topicName: "Dates", mastery: 80, examDays: 14 },
      ],
      30
    );
    expect(result?.title).toContain("Biology");
    expect(result?.recommendedMinutes).toBe(30);
    expect(result?.reason).toContain("Exam soon");
  });

  it("respects the available time and returns no task for a zero-minute budget", () => {
    const signal = [{ subjectId: 1, subjectName: "Biology", mastery: 10 }];
    expect(rankStudySignals(signal, 8)?.recommendedMinutes).toBe(8);
    expect(rankStudySignals(signal, 0)).toBeNull();
  });

  it("uses the newest result to clear a mistake only after confident recall", () => {
    const resolved = buildUnresolvedMistakeReviews([
      baseMistake({ isCorrect: true, confidence: "high", createdAt: "2026-10-03T10:00:00Z" }),
      baseMistake({ createdAt: "2026-10-02T10:00:00Z" }),
    ]);
    expect(resolved).toHaveLength(0);

    const stillDue = buildUnresolvedMistakeReviews([
      baseMistake({ isCorrect: true, confidence: "low", createdAt: "2026-10-03T10:00:00Z" }),
      baseMistake({ createdAt: "2026-10-02T10:00:00Z" }),
    ]);
    expect(stillDue).toHaveLength(1);
    expect(stillDue[0]?.missedCount).toBe(2);
    expect(stillDue[0]?.confidence).toBe("low");
  });

  it("chunks long material with source labels", () => {
    const chunks = chunkText("Cell structure. ".repeat(500), 180, 20);
    expect(chunks.length).toBeGreaterThan(2);
    expect(chunks[0]?.sourceRef).toBe("Text section 1");
    expect(chunks.every(chunk => chunk.text.length > 0)).toBe(true);
  });
});
