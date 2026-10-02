import { ArrowRight, Check, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { trStatic } from "@/i18n";

export function PersistedPracticeTest({
  subjectId,
  onExit,
}: {
  subjectId: string;
  onExit: () => void;
}) {
  const id = Number(subjectId);
  const [attemptId, setAttemptId] = useState<number>();
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState("");
  const [confidence, setConfidence] = useState<"low" | "medium" | "high">(
    "medium"
  );
  const [result, setResult] = useState<{
    score: number;
    total: number;
    completed: boolean;
  }>();
  const create = trpc.workspace.createQuiz.useMutation({
    onSuccess: attempt => {
      setAttemptId(attempt.id);
      setIndex(0);
      setSelected("");
    },
  });
  const answer = trpc.workspace.answerQuiz.useMutation({
    onSuccess: value => {
      setResult(value);
      if (!value.completed) {
        setIndex(current => current + 1);
        setSelected("");
      }
    },
  });
  const attempt = create.data || (attemptId ? undefined : undefined);
  const questions = (attempt?.questions || []) as Array<{
    prompt: string;
    options: string[];
    sourceRef: string;
  }>;
  const question = questions[index];
  if (!attemptId)
    return (
      <div className="mx-auto max-w-3xl">
        <div className="card p-7">
          <div className="eyebrow">{trStatic("Practice test")}</div>
          <h1 className="page-title">
            {trStatic("Test what you can recall.")}
          </h1>
          <p className="page-subtitle">
            {trStatic(
              "Your answers and confidence are saved to this subject’s learning history."
            )}
          </p>
          <button
            className="btn-primary mt-7"
            disabled={create.isPending}
            onClick={() =>
              void create.mutateAsync({ subjectId: id, kind: "practice" })
            }
          >
            {create.isPending ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            {trStatic("Start persisted test")}
          </button>
          <button className="btn-quiet mt-4" onClick={onExit}>
            {trStatic("Back to subject")}
          </button>
          {create.error && (
            <p className="mt-4 text-sm text-[#a05f46]">
              {trStatic("Add indexed topics before starting a test.")}
            </p>
          )}
        </div>
      </div>
    );
  if (result?.completed)
    return (
      <div className="mx-auto max-w-3xl">
        <div className="card p-7">
          <div className="eyebrow">{trStatic("Practice report")}</div>
          <h1 className="page-title">{trStatic("Your result is saved.")}</h1>
          <div className="mt-7 grid grid-cols-2 gap-3">
            <div className="soft-card p-5">
              <div className="metric-label">{trStatic("Score")}</div>
              <div className="metric-value">
                {result.score}/{result.total}
              </div>
            </div>
            <div className="soft-card p-5">
              <div className="metric-label">{trStatic("Next step")}</div>
              <div className="mt-2 text-lg font-extrabold text-[#0f766e]">
                {result.score < result.total
                  ? trStatic("Review mistakes")
                  : trStatic("Keep it warm")}
              </div>
            </div>
          </div>
          <button className="btn-primary mt-7" onClick={onExit}>
            {trStatic("Back to subject")}
          </button>
        </div>
      </div>
    );
  if (!question)
    return (
      <div className="card p-7">
        <p>{trStatic("Preparing questions…")}</p>
      </div>
    );
  return (
    <div className="mx-auto max-w-3xl">
      <button className="btn-quiet -ml-2 mb-5" onClick={onExit}>
        <ArrowRight className="size-4 rotate-180" />
        {trStatic("Exit test")}
      </button>
      <div className="card p-7">
        <div className="flex items-center justify-between">
          <div className="eyebrow">{trStatic("Saved practice test")}</div>
          <span className="topic-chip">
            {index + 1} / {questions.length}
          </span>
        </div>
        <div className="progress-track mt-5">
          <div
            className="progress-fill"
            style={{ width: `${((index + 1) / questions.length) * 100}%` }}
          />
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
          <span className="self-center text-xs font-extrabold text-[#66787a]">
            {trStatic("Confidence")}
          </span>
          {(["low", "medium", "high"] as const).map(value => (
            <button
              key={value}
              className={`btn-light ${confidence === value ? "border-[#75b8aa] bg-[#eef8f4] text-[#0f766e]" : ""}`}
              onClick={() => setConfidence(value)}
            >
              {value}
            </button>
          ))}
        </div>
        <button
          className="btn-primary mt-7 w-full"
          disabled={!selected || answer.isPending}
          onClick={() =>
            void answer.mutateAsync({
              attemptId: attemptId!,
              questionIndex: index,
              answer: selected,
              confidence,
            })
          }
        >
          {answer.isPending ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Check className="size-4" />
          )}
          {index + 1 === questions.length
            ? trStatic("Finish test")
            : trStatic("Save answer")}
        </button>
      </div>
    </div>
  );
}
