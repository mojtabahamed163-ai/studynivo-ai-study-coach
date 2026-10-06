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
});
