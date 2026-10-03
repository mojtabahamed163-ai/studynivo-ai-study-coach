import { Check, RotateCcw, X } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { trStatic } from "@/i18n";

type MistakeReview = {
  key: string;
  subjectId: number;
  subjectName: string;
  topicName?: string;
  prompt: string;
  selectedAnswer: string;
  correctAnswer: string;
  explanation?: string;
  sourceRef: string;
  confidence: "low" | "medium" | "high" | null;
  isCorrect: boolean;
  missedCount: number;
};

export function ReviewQueue() {
  const utils = trpc.useUtils();
  const [, setLocation] = useLocation();
  const queue = trpc.workspace.reviewQueue.useQuery(undefined, { retry: false });
  const mistakes = trpc.workspace.mistakeReviewQueue.useQuery(undefined, {
    retry: false,
  });
  const review = trpc.workspace.reviewFlashcard.useMutation({
    onSuccess: () => {
      void utils.workspace.reviewQueue.invalidate();
      void utils.workspace.studyRecommendation.invalidate();
    },
  });
  const [revealed, setRevealed] = useState(false);
  const card = queue.data?.[0];
  const mistakeItems = (mistakes.data ?? []) as MistakeReview[];
  const waiting = (queue.data?.length ?? 0) + mistakeItems.length;
  const act = (correct: boolean, confidence: "low" | "medium" | "high") => {
    if (!card) return;
    setRevealed(false);
    void review.mutateAsync({ cardId: card.id, correct, confidence });
  };

  return (
    <>
      <div>
        <div className="eyebrow">{trStatic("Spaced review")}</div>
        <h1 className="page-title">{trStatic("Review me.")}</h1>
        <p className="page-subtitle">
          {trStatic(
            "Return to mistakes and low-confidence answers as well as cards due for review."
          )}
        </p>
      </div>
      <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_.7fr]">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="kicker">{trStatic("Priority queue")}</div>
              <h2 className="mt-2 text-xl font-extrabold">
                {waiting} {trStatic("reviews waiting")}
              </h2>
            </div>
            <RotateCcw className="size-5 text-[#0f766e]" />
          </div>
          {queue.isLoading || mistakes.isLoading ? (
            <p className="mt-6 text-sm text-[#748287]">{trStatic("Loading review queue…")}</p>
          ) : null}
          {(queue.error || mistakes.error) && (
            <p role="alert" className="mt-5 text-sm text-[#a4483e]">
              {trStatic("Could not load your review queue. Please retry.")}
            </p>
          )}
          {card ? (
            <>
              <div
                className="mt-6 flashcard cursor-pointer"
                role="button"
                tabIndex={0}
                onClick={() => setRevealed(value => !value)}
                onKeyDown={event => {
                  if (event.key === "Enter" || event.key === " ")
                    setRevealed(value => !value);
                }}
              >
                <div className="kicker">
                  {revealed ? trStatic("Answer") : trStatic("Prompt")}
                </div>
                <div className="mt-4 text-2xl font-extrabold">
                  {revealed ? card.back : card.front}
                </div>
                <div className="mt-5 text-xs font-bold text-[#0f766e]">
                  {card.sourceRef || trStatic("Grounded in your subject material")}
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  className="btn-light"
                  disabled={!revealed || review.isPending}
                  onClick={() => act(false, "low")}
                >
                  <X className="size-4 text-[#b9792e]" />
                  {trStatic("Need review")}
                </button>
                <button
                  className="btn-light"
                  disabled={!revealed || review.isPending}
                  onClick={() => act(true, "medium")}
                >
                  <RotateCcw className="size-4 text-[#0f766e]" />
                  {trStatic("Good")}
                </button>
                <button
                  className="btn-primary"
                  disabled={!revealed || review.isPending}
                  onClick={() => act(true, "high")}
                >
                  <Check className="size-4" />
                  {trStatic("Easy")}
                </button>
              </div>
            </>
          ) : null}
          {mistakeItems.length > 0 && (
            <section className="mt-8 border-t border-[#e4ece8] pt-6">
              <div className="kicker">{trStatic("Missed quiz answers")}</div>
              <div className="mt-4 grid gap-3">
                {mistakeItems.slice(0, 10).map(item => (
                  <article key={item.key} className="soft-card p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-xs font-extrabold text-[#0f766e]">
                          {item.subjectName}{item.topicName ? ` · ${item.topicName}` : ""}
                        </div>
                        <h3 className="mt-2 text-sm font-extrabold">{item.prompt}</h3>
                      </div>
                      <span className="topic-chip">
                        {item.missedCount} {trStatic("misses")}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-1 text-xs leading-5">
                      <p><strong>{trStatic("Your answer")}:</strong> {item.selectedAnswer || trStatic("No answer")}</p>
                      <p><strong>{trStatic("Correct answer")}:</strong> {item.correctAnswer}</p>
                      {item.explanation && <p className="text-[#718087]">{item.explanation}</p>}
                      <p className="text-[#718087]">
                        <strong>{trStatic("Source")}:</strong> {item.sourceRef} · {trStatic("Confidence")}: {trStatic(item.confidence === "low" ? "Low" : item.confidence === "high" ? "High" : "Medium")}
                      </p>
                    </div>
                    <button
                      className="btn-light mt-3"
                      onClick={() => setLocation(`/practice/${item.subjectId}`)}
                    >
                      {trStatic("Practice again")}
                    </button>
                  </article>
                ))}
              </div>
            </section>
          )}
          {!queue.isLoading && !mistakes.isLoading && waiting === 0 && (
            <div className="mt-6 rounded-2xl bg-[#f1f8f5] p-5 text-sm leading-6 text-[#53736b]">
              {trStatic(
                "Your review queue is clear. Build grounded flashcards or finish a test with confidence to keep progress reliable."
              )}
            </div>
          )}
        </div>
        <div className="card p-6">
          <div className="kicker">{trStatic("Why this queue?")}</div>
          <h2 className="mt-2 text-xl font-extrabold">
            {trStatic("Confidence is part of mastery.")}
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#7b8a8c]">
            {trStatic(
              "A wrong answer or a correct answer with low confidence returns here. A repeated mistake rises in priority until reliable recall is demonstrated."
            )}
          </p>
        </div>
      </div>
    </>
  );
}
