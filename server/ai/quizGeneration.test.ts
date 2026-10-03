import { describe, expect, it } from "vitest";
import { validateGeneratedQuiz } from "./quizGeneration";

const topics = [
  { id: 5, name: "Cell division", mastery: 40 },
  { id: 6, name: "Genetics", mastery: 70 },
];

const valid = {
  questions: topics.map((topic, index) => ({
    topicId: topic.id,
    topic: "untrusted topic label",
    prompt: `Which statement about ${topic.name} is supported by the notes?`,
    options: ["Fact A", "Fact B", "Fact C", "Fact D"],
    answer: "Fact A",
    explanation: `The notes describe the process for ${topic.name}.`,
    sourceRef: "Lecture notes",
  })),
};
const sourceMap = new Map(topics.map(topic => [topic.id, new Set(["Lecture notes"])]));

describe("source-grounded quiz validation", () => {
  it("accepts four-option questions only for known topics and sources", () => {
    const result = validateGeneratedQuiz(JSON.stringify(valid), topics, sourceMap);
    expect(result).toHaveLength(2);
    expect(result[0]?.topic).toBe("Cell division");
    expect(result.every(question => question.options.includes(question.answer))).toBe(true);
  });

  it("rejects invented sources, wrong answers, duplicate topics, and incomplete exams", () => {
    const inventedSource = structuredClone(valid);
    inventedSource.questions[0]!.sourceRef = "Fabricated p. 99";
    expect(() => validateGeneratedQuiz(JSON.stringify(inventedSource), topics, sourceMap)).toThrow("INVALID_AI_QUIZ");

    const answerMismatch = structuredClone(valid);
    answerMismatch.questions[0]!.answer = "Not an option";
    expect(() => validateGeneratedQuiz(JSON.stringify(answerMismatch), topics, sourceMap)).toThrow("INVALID_AI_QUIZ");

    const incomplete = { questions: valid.questions.slice(0, 1) };
    expect(() => validateGeneratedQuiz(JSON.stringify(incomplete), topics, sourceMap)).toThrow("INCOMPLETE_AI_QUIZ");

    const wrongTopicSource = structuredClone(valid);
    const strictSources = new Map([
      [5, new Set(["Lecture 5"])],
      [6, new Set(["Lecture 6"])],
    ]);
    wrongTopicSource.questions[0]!.sourceRef = "Lecture 6";
    expect(() => validateGeneratedQuiz(JSON.stringify(wrongTopicSource), topics, strictSources)).toThrow("INVALID_AI_QUIZ");
  });
});
