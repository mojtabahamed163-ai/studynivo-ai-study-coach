import { ArrowRight, Check, CircleAlert, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { trStatic, type Locale } from "@/i18n";

type ReviewAnswer = {
  questionIndex: number;
  prompt: string;
  selectedAnswer: string;
  correctAnswer?: string;
  explanation?: string;
  sourceRef?: string;
  isCorrect?: boolean;
  confidence: "low" | "medium" | "high";
};

type PublicQuestion = {
  prompt: string;
  options: string[];
  sourceRef: string;
};

function readAttemptIdFromUrl() {
  if (typeof window === "undefined") return undefined;
  const id = Number(new URLSearchParams(window.location.search).get("attempt"));
  return Number.isSafeInteger(id) && id > 0 ? id : undefined;
}

export function PersistedPracticeTest({
  subjectId,
  onExit,
  kind = "practice",
  locale,
}: {
  subjectId: string;
  onExit: () => void;
  kind?: "practice" | "mock";
  locale: Locale;
}) {
  const id = Number(subjectId);
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [attemptId, setAttemptId] = useState<number | undefined>(readAttemptIdFromUrl);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState("");
  const [confidence, setConfidence] = useState<"low" | "medium" | "high">("medium");
  const [result, setResult] = useState<{ score: number | null; total: number; completed: boolean }>();
  const [reviewAnswers, setReviewAnswers] = useState<ReviewAnswer[]>([]);
  const attemptProgress = trpc.workspace.quizAttemptProgress.useQuery(
    { attemptId: attemptId ?? 1, subjectId: Number.isInteger(id) ? id : 1, kind },
    { enabled: Boolean(attemptId) && Number.isInteger(id) && id > 0, retry: false }
  );
  const create = trpc.workspace.createQuiz.useMutation({
    onSuccess: attempt => {
      setAttemptId(attempt.id);
      setIndex(0);
      setSelected("");
      setResult(undefined);
      setReviewAnswers([]);
      setLocation(`/${kind === "mock" ? "mock" : "practice"}/${subjectId}?attempt=${attempt.id}`);
    },
  });
  const answer = trpc.workspace.answerQuiz.useMutation({
    onSuccess: () => {
      if (attemptId)
        void utils.workspace.quizAttemptProgress.invalidate({
          attemptId,
          subjectId: id,
          kind,
        });
      void utils.workspace.studyRecommendation.invalidate();
      void utils.workspace.mistakeReviewQueue.invalidate();
    },
  });
  const attempt = create.data;
  const questions = (attemptProgress.data?.questions ?? attempt?.questions ?? []) as PublicQuestion[];
  const question = questions[index];
  const persistedAnswers = (attemptProgress.data?.answers ?? []) as ReviewAnswer[];
  const completedResult =
    attemptProgress.data?.status === "completed"
      ? {
          score: attemptProgress.data.score ?? 0,
          total: attemptProgress.data.total,
          completed: true,
        }
      : undefined;
  const displayedAnswers = persistedAnswers.length ? persistedAnswers : reviewAnswers;

  useEffect(() => {
    const progress = attemptProgress.data;
    if (!progress) return;
    const answered = new Set(progress.answers.map(item => item.questionIndex));
    const firstUnanswered = progress.questions.findIndex((_, questionIndex) => !answered.has(questionIndex));
    setIndex(firstUnanswered < 0 ? progress.questions.length : firstUnanswered);
    setReviewAnswers(progress.answers as ReviewAnswer[]);
    setSelected("");
    if (progress.status === "completed")
      setResult({ score: progress.score ?? 0, total: progress.total, completed: true });
  }, [attemptProgress.data]);

  const submitAnswer = async () => {
    if (!attemptId || !question || !selected) return;
    const selectedAnswer = selected;
    const answerConfidence = confidence;
    try {
      const response = await answer.mutateAsync({
        attemptId,
        questionIndex: index,
        answer: selectedAnswer,
        confidence: answerConfidence,
      });
      setReviewAnswers(previous => [
        ...previous.filter(item => item.questionIndex !== index),
        {
          questionIndex: index,
          prompt: question.prompt,
          selectedAnswer,
          correctAnswer: response.correctAnswer,
          explanation: response.explanation,
          sourceRef: response.sourceRef,
          isCorrect: response.isCorrect,
          confidence: answerConfidence,
        },
      ].sort((a, b) => a.questionIndex - b.questionIndex));
      setResult(response);
      if (!response.completed) {
        setIndex(current => current + 1);
        setSelected("");
      }
    } catch {
      // The mutation's error state is rendered below; keep the selected response available to retry.
    }
  };

  if (attemptId && attemptProgress.isLoading)
    return (
      <div className="card mx-auto max-w-3xl p-7">
        <LoaderCircle className="size-5 animate-spin text-[#0f766e]" />
        <p className="mt-3">{trStatic("Restoring your saved test…")}</p>
      </div>
    );

  if (attemptId && attemptProgress.error)
    return (
      <div className="card mx-auto max-w-3xl p-7">
        <CircleAlert className="size-5 text-[#b9802c]" />
        <p role="alert" className="mt-3">{trStatic("Could not restore this test. Please return to the subject and start again.")}</p>
        <button className="btn-primary mt-5" onClick={onExit}>{trStatic("Back to subject")}</button>
      </div>
    );

  if (result?.completed && !completedResult)
    return (
      <div className="card mx-auto max-w-3xl p-7">
        <LoaderCircle className="size-5 animate-spin text-[#0f766e]" />
        <p className="mt-3">{trStatic("Restoring your saved test…")}</p>
      </div>
    );

  if (!attemptId)
    return (
      <div className="mx-auto max-w-3xl">
        <div className="card p-7">
          <div className="eyebrow">
            {trStatic(kind === "mock" ? "Full mock exam" : "Practice test")}
          </div>
          <h1 className="page-title">{trStatic("Test what you can recall.")}</h1>
          <p className="page-subtitle">
            {trStatic("Your answers and confidence are saved to this subject’s learning history.")}
          </p>
          {kind === "mock" && (
            <div className="soft-card mt-5 p-4 text-sm">
              {trStatic("A mock exam creates one source-grounded question for every indexed topic, up to 50 topics.")}
            </div>
          )}
          <button
            className="btn-primary mt-7"
            disabled={create.isPending || !Number.isInteger(id) || id < 1}
            onClick={() => void create.mutateAsync({ subjectId: id, kind, locale })}
          >
            {create.isPending ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}
            {create.isPending ? trStatic("Preparing questions…") : trStatic("Start persisted test")}
          </button>
          <button className="btn-quiet mt-4" onClick={onExit}>{trStatic("Back to subject")}</button>
          {create.error && (
            <p role="alert" className="mt-4 text-sm text-[#a05f46]">
              {trStatic("Could not generate source-grounded questions. Check indexed material and try again when the AI service is available.")}
            </p>
          )}
        </div>
      </div>
    );

  if (completedResult?.completed)
    return (
      <div className="mx-auto max-w-3xl">
        <div className="card p-7">
          <div className="eyebrow">
            {trStatic(kind === "mock" ? "Mock exam report" : "Practice report")}
          </div>
          <h1 className="page-title">{trStatic("Your result is saved.")}</h1>
          <div className="mt-7 grid grid-cols-2 gap-3">
            <div className="soft-card p-5">
              <div className="metric-label">{trStatic("Score")}</div>
              <div className="metric-value">{completedResult.score}/{completedResult.total}</div>
            </div>
            <div className="soft-card p-5">
              <div className="metric-label">{trStatic("Next step")}</div>
              <div className="mt-2 text-lg font-extrabold text-[#0f766e]">
                {completedResult.score < completedResult.total ? trStatic("Review mistakes") : trStatic("Keep it warm")}
              </div>
            </div>
          </div>
          <div className="mt-8 grid gap-3">
            <h2 className="text-base font-extrabold">{trStatic("Answer review")}</h2>
            {displayedAnswers.map((item, answerIndex) => (
              <article key={`${item.questionIndex}-${item.sourceRef}`} className="soft-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-extrabold">{item.questionIndex + 1}. {item.prompt}</h3>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${item.isCorrect ? "bg-[#e4f4ee] text-[#14765f]" : "bg-[#fbedea] text-[#a4483e]"}`}>
                    {item.isCorrect ? trStatic("Correct") : trStatic("Review needed")}
                  </span>
                </div>
                <div className="mt-4 grid gap-2 text-xs leading-5">
                  <p><strong>{trStatic("Your answer")}:</strong> {item.selectedAnswer}</p>
                  {!item.isCorrect && <p><strong>{trStatic("Correct answer")}:</strong> {item.correctAnswer}</p>}
                  <p className="text-[#718087]">{item.explanation}</p>
                  <p className="text-[#718087]"><strong>{trStatic("Source")}:</strong> {item.sourceRef} · {trStatic("Confidence")}: {trStatic(item.confidence)}</p>
                </div>
              </article>
            ))}
          </div>
          <button className="btn-primary mt-7" onClick={onExit}>{trStatic("Back to subject")}</button>
        </div>
      </div>
    );

  if (!question)
    return (
      <div className="card p-7">
        <CircleAlert className="size-5 text-[#b9802c]" />
        <p className="mt-3">{trStatic("This test has no remaining questions.")}</p>
        <button className="btn-quiet mt-4" onClick={onExit}>{trStatic("Back to subject")}</button>
      </div>
    );

  return (
    <div className="mx-auto max-w-3xl">
      <button className="btn-quiet -ml-2 mb-5" onClick={onExit}>
        <ArrowRight className="size-4 rotate-180" />
        {trStatic("Exit test")}
      </button>
      <div className="card p-7">
        <div className="flex items-center justify-between gap-3">
          <div className="eyebrow">{trStatic(kind === "mock" ? "Saved mock exam" : "Saved practice test")}</div>
          <span className="topic-chip">{index + 1} / {questions.length}</span>
        </div>
        <div className="progress-track mt-5">
          <div className="progress-fill" style={{ width: `${((index + 1) / questions.length) * 100}%` }} />
        </div>
        <h1 className="mt-8 text-2xl font-extrabold">{question.prompt}</h1>
        <div className="mt-6 grid gap-3">
          {question.options.map(option => (
            <button
              key={option}
              className={`rounded-2xl border p-4 text-left text-sm font-bold ${selected === option ? "border-[#5db9ae] bg-[#eaf4f1] text-[#0f766e]" : "border-[#e3ebe7] text-[#52656a]"}`}
              onClick={() => setSelected(option)}
            >
              {option}
            </button>
          ))}
        </div>
        <div className="mt-7 flex flex-wrap gap-2">
          <span className="self-center text-xs font-extrabold text-[#66787a]">{trStatic("Confidence")}</span>
          {(["low", "medium", "high"] as const).map(value => (
            <button
              key={value}
              aria-pressed={confidence === value}
              className={`btn-light ${confidence === value ? "border-[#75b8aa] bg-[#eef8f4] text-[#0f766e]" : ""}`}
              onClick={() => setConfidence(value)}
            >
              {trStatic(value[0].toUpperCase() + value.slice(1))}
            </button>
          ))}
        </div>
        {answer.error && (
          <p role="alert" className="mt-4 text-xs font-semibold text-[#a4483e]">
            {trStatic("Could not save this answer. Please retry.")}
          </p>
        )}
        <button
          className="btn-primary mt-7 w-full"
          disabled={!selected || answer.isPending}
          onClick={() => void submitAnswer()}
        >
          {answer.isPending ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}
          {index + 1 === questions.length ? trStatic("Finish test") : trStatic("Save answer")}
        </button>
      </div>
    </div>
  );
}
