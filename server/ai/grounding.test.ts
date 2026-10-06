import { describe, expect, it } from "vitest";
import { parseGroundedAnswer } from "./grounding";

const fallback = "Could not verify an answer from the selected sources.";

describe("grounded answer validation", () => {
  it("keeps only exact source labels supplied to the model", () => {
    const answer = parseGroundedAnswer(
      JSON.stringify({
        answer: "The material supports spaced recall.",
        sourceRefs: [
          { label: "Lecture notes · 00:12" },
          { label: "Fabricated chapter 9, page 400", page: 400 },
        ],
        confidence: "high",
        insufficientContext: false,
        conflicts: [],
      }),
      ["Lecture notes · 00:12"],
      fallback
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
        sourceRefs: [{ label: "Unknown" }],
        confidence: "high",
        insufficientContext: false,
        conflicts: [],
      }),
      ["Known"],
      fallback
    );
    expect(ungrounded).toMatchObject({
      answer: fallback,
      sourceRefs: [],
      confidence: "low",
      insufficientContext: true,
    });
    expect(parseGroundedAnswer("not-json", [], fallback).answer).toBe(fallback);
  });
});
