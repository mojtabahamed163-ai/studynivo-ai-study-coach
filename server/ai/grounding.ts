import { groundedAnswerSchema } from "./schemas";

export type VerifiedGroundedAnswer = {
  answer: string;
  sourceRefs: Array<{ label: string }>;
  confidence: "low" | "medium" | "high";
  insufficientContext: boolean;
  conflicts: Array<{ claim: string; sources: Array<{ label: string }> }>;
};

export function parseGroundedAnswer(
  raw: string,
  allowedLabels: Iterable<string>,
  fallbackAnswer: string
): VerifiedGroundedAnswer {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return {
      answer: fallbackAnswer,
      sourceRefs: [],
      confidence: "low",
      insufficientContext: true,
      conflicts: [],
    };
  }
  const parsed = groundedAnswerSchema.safeParse(value);
  if (!parsed.success) {
    return {
      answer: fallbackAnswer,
      sourceRefs: [],
      confidence: "low",
      insufficientContext: true,
      conflicts: [],
    };
  }
  const allowed = new Set(allowedLabels);
  const sourceRefs = [
    ...new Set(
      parsed.data.sourceRefs
        .map(reference => reference.label.trim())
        .filter(label => label && allowed.has(label))
    ),
  ].map(label => ({ label }));
  const conflicts = parsed.data.conflicts.flatMap(conflict => {
    const sources = [
      ...new Set(
        conflict.sources
          .map(reference => reference.label.trim())
          .filter(label => label && allowed.has(label))
      ),
    ].map(label => ({ label }));
    return sources.length
      ? [{ claim: conflict.claim, sources }]
      : [];
  });
  const insufficientContext =
    parsed.data.insufficientContext || sourceRefs.length === 0;
  return {
    answer: insufficientContext && sourceRefs.length === 0
      ? fallbackAnswer
      : parsed.data.answer,
    sourceRefs,
    confidence: insufficientContext ? "low" : parsed.data.confidence,
    insufficientContext,
    conflicts,
  };
}
