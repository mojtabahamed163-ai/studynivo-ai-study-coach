import { groundedAnswerSchema } from "./schemas";

export type VerifiedGroundedAnswer = {
  answer: string;
  evidence: Array<{ quote: string; sourceRef: { label: string } }>;
  sourceRefs: Array<{ label: string }>;
  confidence: "low" | "medium" | "high";
  insufficientContext: boolean;
  conflicts: Array<{ claim: string; sources: Array<{ label: string }> }>;
};

export function parseGroundedAnswer(
  raw: string,
  allowedLabels: Iterable<string>,
  fallbackAnswer: string,
  allowedEvidence: Iterable<{ sourceRef: string; text: string }> = []
): VerifiedGroundedAnswer {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return {
      answer: fallbackAnswer,
      evidence: [],
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
      evidence: [],
      sourceRefs: [],
      confidence: "low",
      insufficientContext: true,
      conflicts: [],
    };
  }
  const allowed = new Set(allowedLabels);
  const evidenceSources = [...allowedEvidence];
  const evidence = parsed.data.evidence
    .map(item => {
      const label = item.sourceRef.label.trim();
      const quote = item.quote.trim();
      const source = evidenceSources.find(candidate => candidate.sourceRef === label);
      if (!label || !quote || !allowed.has(label) || !source) return null;
      const normalizedQuote = quote.replace(/\s+/g, " ").toLocaleLowerCase();
      const normalizedText = source.text.replace(/\s+/g, " ").toLocaleLowerCase();
      return normalizedText.includes(normalizedQuote)
        ? { quote, sourceRef: { label } }
        : null;
    })
    .filter(
      (item): item is { quote: string; sourceRef: { label: string } } =>
        Boolean(item)
    );
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
    return sources.length ? [{ claim: conflict.claim, sources }] : [];
  });
  const insufficientContext =
    parsed.data.insufficientContext || sourceRefs.length === 0 || evidence.length === 0;
  return {
    answer: insufficientContext ? fallbackAnswer : parsed.data.answer,
    evidence,
    sourceRefs,
    confidence: insufficientContext ? "low" : parsed.data.confidence,
    insufficientContext,
    conflicts,
  };
}
