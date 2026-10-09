import { groundedAnswerSchema } from "./schemas";

export type VerifiedGroundedAnswer = {
  answer: string;
  evidence: Array<{ quote: string; sourceRef: { label: string } }>;
  sourceRefs: Array<{ label: string }>;
  confidence: "low" | "medium" | "high";
  insufficientContext: boolean;
  conflicts: Array<{ claim: string; sources: Array<{ label: string }> }>;
  practiceQuestions: Array<{ question: string; answer: string; explanation: string; sourceRef: { label: string } }>;
  checkQuestion: { question: string; expectedAnswer: string; explanation: string; sourceRef: { label: string } };
};

const emptyCheckQuestion = {
  question: "",
  expectedAnswer: "",
  explanation: "",
  sourceRef: { label: "" },
};

function hasSourceOverlap(value: string, sourceText: string) {
  const source = sourceText.toLocaleLowerCase();
  const terms = value
    .toLocaleLowerCase()
    .normalize("NFKC")
    .split(/[^\p{L}\p{N}]+/u)
    .filter(term => term.length > 2);
  return terms.some(term => source.includes(term));
}

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
      practiceQuestions: [],
      checkQuestion: emptyCheckQuestion,
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
      practiceQuestions: [],
      checkQuestion: emptyCheckQuestion,
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
  const practiceQuestions = parsed.data.practiceQuestions
    .map(item => {
      const label = item.sourceRef.label.trim();
      const source = evidenceSources.find(candidate => candidate.sourceRef === label);
      if (
        !item.question.trim() ||
        !item.answer.trim() ||
        !item.explanation.trim() ||
        !allowed.has(label) ||
        !source ||
        !hasSourceOverlap(`${item.question} ${item.answer} ${item.explanation}`, source.text)
      )
        return null;
      return {
        question: item.question.trim(),
        answer: item.answer.trim(),
        explanation: item.explanation.trim(),
        sourceRef: { label },
      };
    })
    .filter(
      (
        item
      ): item is {
        question: string;
        answer: string;
        explanation: string;
        sourceRef: { label: string };
      } => Boolean(item)
    )
    .slice(0, 5);
  const rawCheck = parsed.data.checkQuestion;
  const checkLabel = rawCheck.sourceRef.label.trim();
  const checkSource = evidenceSources.find(candidate => candidate.sourceRef === checkLabel);
  const checkQuestion =
    rawCheck.question.trim() &&
    rawCheck.expectedAnswer.trim() &&
    rawCheck.explanation.trim() &&
    allowed.has(checkLabel) &&
    checkSource &&
    hasSourceOverlap(`${rawCheck.question} ${rawCheck.expectedAnswer} ${rawCheck.explanation}`, checkSource.text)
      ? {
          question: rawCheck.question.trim(),
          expectedAnswer: rawCheck.expectedAnswer.trim(),
          explanation: rawCheck.explanation.trim(),
          sourceRef: { label: checkLabel },
        }
      : emptyCheckQuestion;
  const insufficientContext =
    parsed.data.insufficientContext ||
    sourceRefs.length === 0 ||
    evidence.length === 0 ||
    (!parsed.data.insufficientContext && (practiceQuestions.length < 3 || !checkQuestion.question));
  return {
    answer: insufficientContext ? fallbackAnswer : parsed.data.answer,
    evidence,
    sourceRefs,
    confidence: insufficientContext ? "low" : parsed.data.confidence,
    insufficientContext,
    conflicts,
    practiceQuestions: insufficientContext ? [] : practiceQuestions,
    checkQuestion: insufficientContext ? emptyCheckQuestion : checkQuestion,
  };
}
