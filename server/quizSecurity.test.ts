import { describe, expect, it } from "vitest";
import {
  nextUnansweredQuestionIndex,
  redactQuizAttempt,
  redactQuizQuestions,
  shouldRevealQuizFeedback,
  visibleQuizScore,
} from "./quizSecurity";

describe("quiz answer privacy", () => {
  it("removes answer keys while keeping the question payload intact", () => {
    const result = redactQuizQuestions([
      {
        prompt: "Which action best checks recall?",
        options: ["Read", "Explain"],
        answer: "Explain",
        correctAnswer: "Explain",
        explanation: "Explain is correct because it requires recall.",
        isCorrect: true,
        sourceRef: "Chapter 1",
      },
    ]);
    expect(result).toEqual([
      {
        prompt: "Which action best checks recall?",
        options: ["Read", "Explain"],
        sourceRef: "Chapter 1",
      },
    ]);
    expect(JSON.stringify(result)).not.toMatch(/"(answer|correctAnswer|explanation|isCorrect)"/);
  });

  it("fails closed for malformed stored JSON", () => {
    expect(redactQuizQuestions(null)).toEqual([]);
    expect(redactQuizQuestions([null, "bad", { answer: "secret" }])).toEqual([
      {},
    ]);
  });

  it("withholds mock feedback until completion but permits immediate practice feedback", () => {
    expect(shouldRevealQuizFeedback("mock", "active")).toBe(false);
    expect(shouldRevealQuizFeedback("mock", "completed")).toBe(true);
    expect(shouldRevealQuizFeedback("practice", "active")).toBe(true);
    expect(visibleQuizScore("mock", "active", 2)).toBeNull();
    expect(visibleQuizScore("mock", "completed", 2)).toBe(2);
  });

  it("hides the initial mock score and explanatory answer content from create payloads", () => {
    const attempt = redactQuizAttempt({
      id: 4,
      kind: "mock",
      status: "active",
      score: 0,
      questions: [{
        prompt: "Which choice matches the notes?",
        options: ["A", "B"],
        answer: "A",
        explanation: "A is correct because the source states so.",
        sourceRef: "Lecture",
      }],
    });
    expect(attempt.score).toBeNull();
    expect(attempt.questions).toEqual([{
      prompt: "Which choice matches the notes?",
      options: ["A", "B"],
      sourceRef: "Lecture",
    }]);
  });

  it("requires the next unanswered question in sequence", () => {
    expect(nextUnansweredQuestionIndex(4, [])).toBe(0);
    expect(nextUnansweredQuestionIndex(4, [0, 2])).toBe(1);
    expect(nextUnansweredQuestionIndex(4, [0, 1, 2, 3])).toBe(4);
  });
});
