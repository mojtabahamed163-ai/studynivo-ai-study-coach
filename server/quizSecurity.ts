export function redactQuizQuestions(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.flatMap(question => {
    if (!question || typeof question !== "object" || Array.isArray(question))
      return [];
    const {
      answer: _answer,
      correctAnswer: _correctAnswer,
      explanation: _explanation,
      isCorrect: _isCorrect,
      ...publicQuestion
    } = question as Record<string, unknown>;
    return [publicQuestion];
  });
}

export function shouldRevealQuizFeedback(
  kind: "practice" | "mock",
  status: "active" | "completed"
) {
  return kind === "practice" || status === "completed";
}

export function visibleQuizScore(
  kind: "practice" | "mock",
  status: "active" | "completed",
  score: number
) {
  return shouldRevealQuizFeedback(kind, status) ? score : null;
}

export function redactQuizAttempt<
  T extends {
    kind: "practice" | "mock";
    status: "active" | "completed";
    score: number | null;
    questions: unknown;
  },
>(attempt: T) {
  return {
    ...attempt,
    score: visibleQuizScore(attempt.kind, attempt.status, attempt.score ?? 0),
    questions: redactQuizQuestions(attempt.questions),
  };
}

export function nextUnansweredQuestionIndex(
  total: number,
  answeredIndexes: readonly number[]
) {
  const answered = new Set(answeredIndexes);
  for (let index = 0; index < total; index += 1) {
    if (!answered.has(index)) return index;
  }
  return total;
}
