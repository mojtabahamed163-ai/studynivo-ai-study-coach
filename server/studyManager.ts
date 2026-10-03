export type StudySignal = {
  subjectId: number;
  subjectName: string;
  topicId?: number;
  topicName?: string;
  mastery: number;
  examDays?: number;
  repeatedMistakes?: number;
  dueReviews?: number;
  confidence?: number;
  minutesRemaining?: number;
  lastStudiedAt?: string;
};

export type StudyRecommendation = {
  subjectId: number;
  topicId?: number;
  title: string;
  reason: string;
  recommendedMinutes: number;
  score: number;
};

export type MistakeReviewHistoryItem = {
  key: string;
  subjectId: number;
  subjectName: string;
  topicId?: number;
  topicName?: string;
  prompt: string;
  selectedAnswer: string;
  correctAnswer: string;
  explanation?: string;
  sourceRef: string;
  isCorrect: boolean;
  confidence: "low" | "medium" | "high" | null;
  createdAt: Date | string;
};

export function rankStudySignals(
  signals: StudySignal[],
  availableMinutes = 30,
  now = Date.now()
): StudyRecommendation | null {
  if (!signals.length || !Number.isFinite(availableMinutes) || availableMinutes <= 0)
    return null;
  const ranked = signals.map(signal => {
    const examDays = signal.examDays;
    const urgency =
      examDays === undefined || examDays < 0
        ? 0
        : Math.max(0, 30 - examDays) * 1.5 + (examDays <= 7 ? 18 : 0);
    const weakness = Math.max(0, 100 - clamp(signal.mastery, 0, 100)) * 1.15;
    const mistakes = Math.min(42, Math.max(0, signal.repeatedMistakes ?? 0) * 11);
    const dueReviews = Math.min(32, Math.max(0, signal.dueReviews ?? 0) * 6);
    const lowConfidence =
      signal.confidence === undefined
        ? 0
        : Math.max(0, 100 - clamp(signal.confidence, 0, 100)) * 0.28;
    const unfinished = signal.minutesRemaining
      ? Math.min(20, Math.max(0, signal.minutesRemaining) / 3)
      : 0;
    const lastStudiedTime = signal.lastStudiedAt
      ? new Date(signal.lastStudiedAt).getTime()
      : Number.NaN;
    const staleDays = Number.isFinite(lastStudiedTime)
      ? Math.max(0, (now - lastStudiedTime) / 86_400_000)
      : 0;
    const staleness = Math.min(21, staleDays * 1.5);
    const score = urgency + weakness + mistakes + dueReviews + lowConfidence + unfinished + staleness;
    const topicName = signal.topicName?.trim();
    let reason = "Keep the concept active with recall";
    if (examDays !== undefined && examDays >= 0 && examDays <= 7)
      reason = "Exam soon — prioritize this topic";
    else if ((signal.repeatedMistakes ?? 0) > 0)
      reason = "Repeated mistakes need another recall pass";
    else if ((signal.dueReviews ?? 0) > 0)
      reason = "A spaced review is due";
    else if (signal.confidence !== undefined && signal.confidence < 50)
      reason = "Low confidence — check your recall";
    else if (staleDays >= 5)
      reason = "Return to this topic after a study break";
    else if (signal.mastery < 60)
      reason = "A weak topic needs another pass";
    const recommendedMinutes = Math.max(
      1,
      Math.min(
        Math.floor(availableMinutes),
        examDays !== undefined && examDays >= 0 && examDays <= 7
          ? 30
          : signal.mastery < 50 || (signal.repeatedMistakes ?? 0) > 1
            ? 25
            : 15
      )
    );
    return {
      subjectId: signal.subjectId,
      topicId: signal.topicId,
      title: `${signal.subjectName}${topicName ? ` — ${topicName}` : ""}`,
      reason,
      recommendedMinutes,
      score: Math.round(score * 10) / 10,
    };
  });
  return ranked.sort((a, b) => b.score - a.score || a.subjectId - b.subjectId || (a.topicId ?? 0) - (b.topicId ?? 0))[0] ?? null;
}

export function buildUnresolvedMistakeReviews(
  history: MistakeReviewHistoryItem[]
) {
  const ordered = [...history].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const latest = new Map<string, MistakeReviewHistoryItem>();
  const missedCounts = new Map<string, number>();
  for (const item of ordered) {
    if (!latest.has(item.key)) latest.set(item.key, item);
    if (!item.isCorrect || item.confidence === "low")
      missedCounts.set(item.key, (missedCounts.get(item.key) ?? 0) + 1);
  }
  return [...latest.entries()]
    .filter(([, item]) => !item.isCorrect || item.confidence === "low")
    .map(([key, item]) => ({
      ...item,
      missedCount: missedCounts.get(key) ?? 1,
    }))
    .sort((a, b) => b.missedCount - a.missedCount || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 100);
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, Number.isFinite(value) ? value : minimum));
}
