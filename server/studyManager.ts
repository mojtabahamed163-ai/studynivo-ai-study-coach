export type StudySignal = { subjectId: number; subjectName: string; topicId?: number; topicName?: string; mastery: number; examDays?: number; repeatedMistakes?: number; minutesRemaining?: number; lastStudiedAt?: string };

export type StudyRecommendation = { subjectId: number; topicId?: number; title: string; reason: string; recommendedMinutes: number; score: number };

export function rankStudySignals(signals: StudySignal[], availableMinutes = 30): StudyRecommendation | null {
  if (!signals.length) return null;
  const ranked = signals.map((signal) => {
    const urgency = signal.examDays === undefined ? 0 : Math.max(0, 30 - signal.examDays) * 1.6;
    const weakness = Math.max(0, 100 - signal.mastery) * 1.25;
    const mistakes = (signal.repeatedMistakes ?? 0) * 8;
    const unfinished = signal.minutesRemaining ? Math.min(20, signal.minutesRemaining / 3) : 0;
    const score = urgency + weakness + mistakes + unfinished;
    const recommendedMinutes = Math.max(10, Math.min(availableMinutes, signal.mastery < 50 ? 30 : 20));
    return { subjectId: signal.subjectId, topicId: signal.topicId, title: `${signal.subjectName}${signal.topicName ? ` — ${signal.topicName}` : ""}`, reason: signal.examDays !== undefined && signal.examDays <= 7 ? `Exam in ${signal.examDays} days + priority weakness` : signal.mastery < 60 ? "Weak topic needs another pass" : "Keep the concept active with recall", recommendedMinutes, score };
  });
  return ranked.sort((a, b) => b.score - a.score)[0] ?? null;
}
