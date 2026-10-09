import { describe, expect, it } from "vitest";
import { parseGroundedAnswer } from "./grounding";

const fallback = "Could not verify an answer from the selected sources.";

describe("grounded answer validation", () => {
  it("keeps only exact source labels supplied to the model", () => {
    const answer = parseGroundedAnswer(
      JSON.stringify({
        answer: "The material supports spaced recall.",
        evidence: [{ quote: "spaced recall", sourceRef: { label: "Lecture notes · 00:12" } }],
        sourceRefs: [
          { label: "Lecture notes · 00:12" },
          { label: "Fabricated chapter 9, page 400", page: 400 },
        ],
        confidence: "high",
        insufficientContext: false,
        conflicts: [],
        practiceQuestions: [
          { question: "What supports spaced recall?", answer: "The material.", explanation: "The source says the material supports spaced recall.", sourceRef: { label: "Lecture notes · 00:12" } },
          { question: "What is recalled?", answer: "Material.", explanation: "The source names the material.", sourceRef: { label: "Lecture notes · 00:12" } },
          { question: "What is the method?", answer: "Spaced recall.", explanation: "The source names spaced recall.", sourceRef: { label: "Lecture notes · 00:12" } },
        ],
        checkQuestion: { question: "Name the method.", expectedAnswer: "Spaced recall.", explanation: "The source names spaced recall.", sourceRef: { label: "Lecture notes · 00:12" } },
      }),
      ["Lecture notes · 00:12"],
      fallback,
      [{ sourceRef: "Lecture notes · 00:12", text: "The material supports spaced recall." }]
    );
    expect(answer.sourceRefs).toEqual([{ label: "Lecture notes · 00:12" }]);
    expect(answer.answer).toBe("The material supports spaced recall.");
    expect(answer.confidence).toBe("high");
    expect(answer.insufficientContext).toBe(false);
  });

  it("downgrades ungrounded claims and malformed responses", () => {
    const ungrounded = parseGroundedAnswer(
      JSON.stringify({
        answer: "A claim with no known source.",
        evidence: [{ quote: "A claim with no known source.", sourceRef: { label: "Unknown" } }],
        sourceRefs: [{ label: "Unknown" }],
        confidence: "high",
        insufficientContext: false,
        conflicts: [],
      }),
      ["Known"],
      fallback,
      [{ sourceRef: "Known", text: "Known material only." }]
    );
    expect(ungrounded).toMatchObject({
      answer: fallback,
      sourceRefs: [],
      confidence: "low",
      insufficientContext: true,
    });
    expect(parseGroundedAnswer("not-json", [], fallback).answer).toBe(fallback);
  });

  it("rejects a valid source label when its evidence quote is not in the source", () => {
    const answer = parseGroundedAnswer(
      JSON.stringify({
        answer: "Unsupported expansion.",
        evidence: [{ quote: "Unsupported expansion.", sourceRef: { label: "Known" } }],
        sourceRefs: [{ label: "Known" }],
        confidence: "high",
        insufficientContext: false,
        conflicts: [],
      }),
      ["Known"],
      fallback,
      [{ sourceRef: "Known", text: "The source says only one supported fact." }]
    );
    expect(answer).toMatchObject({
      answer: fallback,
      evidence: [],
      confidence: "low",
      insufficientContext: true,
    });
  });

  it("keeps practice and check questions only when their source labels are allowed", () => {
    const answer = parseGroundedAnswer(
      JSON.stringify({
        answer: "The source explains the first step.",
        evidence: [{ quote: "first step", sourceRef: { label: "Lecture · Text section 1" } }],
        sourceRefs: [{ label: "Lecture · Text section 1" }],
        confidence: "high",
        insufficientContext: false,
        conflicts: [],
        practiceQuestions: [
          {
            question: "What is the first step?",
            answer: "Start with the input.",
            explanation: "The section names the input as the first step.",
            sourceRef: { label: "Lecture · Text section 1" },
          },
          {
            question: "What comes first?",
            answer: "The input.",
            explanation: "The source says the input comes first.",
            sourceRef: { label: "Lecture · Text section 1" },
          },
          {
            question: "Name the first part.",
            answer: "The first step.",
            explanation: "The source identifies the first step.",
            sourceRef: { label: "Lecture · Text section 1" },
          },
          {
            question: "What is not in the source?",
            answer: "Unknown.",
            explanation: "This source label was fabricated.",
            sourceRef: { label: "Invented page 9" },
          },
        ],
        checkQuestion: {
          question: "State the first step.",
          expectedAnswer: "Start with the input.",
          explanation: "The first step is the input.",
          sourceRef: { label: "Lecture · Text section 1" },
        },
      }),
      ["Lecture · Text section 1"],
      fallback,
      [{ sourceRef: "Lecture · Text section 1", text: "The first step is the input." }]
    );
    expect(answer.practiceQuestions).toHaveLength(3);
    expect(answer.checkQuestion.sourceRef.label).toBe("Lecture · Text section 1");
  });
});
