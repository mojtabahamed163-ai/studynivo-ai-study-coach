import { Check, RotateCcw, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { trStatic } from "@/i18n";

export function FlashcardsReview({
  subjectId,
  subjectName,
}: {
  subjectId: string;
  subjectName: string;
}) {
  const id = Number(subjectId);
  const utils = trpc.useUtils();
  const cards = trpc.workspace.flashcards.useQuery(
    { subjectId: id, dueOnly: true },
    { enabled: /^\d+$/.test(subjectId), retry: false }
  );
  const generate = trpc.workspace.generateFlashcards.useMutation({
    onSuccess: () => utils.workspace.flashcards.invalidate(),
  });
  const review = trpc.workspace.reviewFlashcard.useMutation({
    onSuccess: () => utils.workspace.flashcards.invalidate(),
  });
  const [revealed, setRevealed] = useState(false);
  const card = cards.data?.[0];
  const act = async (correct: boolean, confidence: "low" | "medium" | "high") => {
    if (!card) return;
    try {
      await review.mutateAsync({ cardId: card.id, correct, confidence });
      setRevealed(false);
    } catch {
      // The mutation error is rendered below so the card remains reviewable.
    }
  };
  return (
    <div className="mt-6 max-w-2xl">
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="kicker">{trStatic("Spaced recall")}</div>
            <h2 className="mt-2 text-xl font-extrabold">
              {subjectName} · {trStatic("Review queue")}
            </h2>
          </div>
          <span className="topic-chip">
            {cards.data?.length ?? 0} {trStatic("due")}
          </span>
        </div>
        {cards.isLoading && (
          <div className="mt-6 text-sm text-[#78898a]">
            {trStatic("Loading review queue…")}
          </div>
        )}
        {!cards.isLoading && !card && (
          !cards.isError && (
          <div className="mt-6 rounded-2xl bg-[#f1f8f5] p-5">
            <div className="flex items-center gap-2 text-sm font-extrabold text-[#2d675e]">
              <Sparkles className="size-4" />
              {trStatic("Your queue is clear")}
            </div>
            <p className="mt-2 text-xs leading-5 text-[#6d8580]">
              {trStatic(
                "Generate grounded cards from the topics in this subject, or come back when another card is due."
              )}
            </p>
            <button
              className="btn-primary mt-5"
              disabled={generate.isPending}
              onClick={() => void generate.mutateAsync({ subjectId: id })}
            >
              {trStatic("Build cards from topics")}
            </button>
          </div>)
        )}
        {cards.isError && (
          <div role="alert" className="mt-6 rounded-2xl border border-[#f0d1ca] bg-[#fff6f3] p-5 text-sm font-semibold text-[#9b5149]">
            {trStatic("Could not load your review queue. Please retry.")}
            <button className="btn-light mt-4" onClick={() => void cards.refetch()}>
              {trStatic("Retry")}
            </button>
          </div>
        )}
        {generate.isError && (
          <div role="alert" className="mt-4 text-sm font-semibold text-[#9b5149]">
            {trStatic("Cards could not be generated from the current sources. Please retry.")}
          </div>
        )}
        {review.isError && (
          <div role="alert" className="mt-4 text-sm font-semibold text-[#9b5149]">
            {trStatic("Your review was not saved. Please retry.")}
          </div>
        )}
        {card && (
          <>
            <div
              className="mt-6 flashcard"
              onClick={() => setRevealed(value => !value)}
              onKeyDown={event => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setRevealed(value => !value);
                }
              }}
              role="button"
              tabIndex={0}
              aria-expanded={revealed}
            >
              <div className="kicker">
                {revealed ? trStatic("Answer") : trStatic("Prompt")}
              </div>
              <div className="mt-4 text-2xl font-extrabold tracking-[-.04em]">
                {revealed ? card.back : card.front}
              </div>
              <div className="mt-5 text-xs font-bold text-[#0f766e]">
                {trStatic("Tap to reveal")} · {card.difficulty}
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
            <div className="mt-4 text-[11px] text-[#8a9898]">
              {card.sourceRef || trStatic("Grounded in this subject material")}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
