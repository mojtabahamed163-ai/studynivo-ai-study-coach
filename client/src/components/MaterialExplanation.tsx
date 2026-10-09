import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  FileSearch,
  LoaderCircle,
  RotateCcw,
  Send,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Locale } from "@/i18n";
import { trStatic } from "@/i18n";

type Material = {
  id: string;
  name: string;
  type: string;
  size: string;
  status: "indexed" | "queued" | "extracting" | "indexing" | "needs_review";
  text?: string;
  sourceRef?: string;
  error?: string;
};

type Subject = {
  id: string;
  name: string;
  materials: Material[];
};

type SourceRef = { label: string };
type Evidence = { quote: string; sourceRef: SourceRef };
type PracticeQuestion = {
  question: string;
  answer: string;
  explanation: string;
  sourceRef: SourceRef;
};
type CheckQuestion = {
  question: string;
  expectedAnswer: string;
  explanation: string;
  sourceRef: SourceRef;
};
type ExplanationResult = {
  answer: string;
  evidence: Evidence[];
  sourceRefs: SourceRef[];
  confidence: "low" | "medium" | "high";
  insufficientContext: boolean;
  conflicts: Array<{ claim: string; sources: SourceRef[] }>;
  practiceQuestions: PracticeQuestion[];
  checkQuestion: CheckQuestion;
};
type Action = "simple" | "steps" | "example" | "compare" | "check";
type Section = { index: number; label: string; text: string };
type SavedTurn = {
  id: string;
  prompt: string;
  action: Action;
  materialLabel: string;
  sectionLabel?: string;
  result: ExplanationResult;
  createdAt: string;
};

type Props = { subject: Subject; locale: Locale };

const actionOptions: Array<{ id: Action; label: string; prompt: string }> = [
  { id: "simple", label: "Explain this simply", prompt: "Explain this selected section simply for a beginner." },
  { id: "steps", label: "Explain step by step", prompt: "Explain this selected section step by step in the order supported by the source." },
  { id: "example", label: "Give me an example", prompt: "Give me an example from this selected section. If the file has no example, say so clearly." },
  { id: "compare", label: "What is the difference?", prompt: "What is the difference between the two concepts in this selected section? Name them only if the file identifies both." },
  { id: "check", label: "Test my understanding", prompt: "Teach this selected section briefly, then focus on testing my understanding." },
];

function splitIntoSections(text: string): Section[] {
  const normalized = text.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").trim();
  if (!normalized) return [];
  const sections: Section[] = [];
  let cursor = 0;
  let index = 0;
  while (cursor < normalized.length) {
    const end = Math.min(normalized.length, cursor + 1800);
    const boundary = end < normalized.length
      ? Math.max(normalized.lastIndexOf("\n", end), normalized.lastIndexOf(".", end))
      : end;
    const safeEnd = boundary > cursor + 990 ? boundary + 1 : end;
    const sectionText = normalized.slice(cursor, safeEnd).trim();
    if (sectionText) sections.push({ index, label: `Text section ${index + 1}`, text: sectionText });
    if (safeEnd >= normalized.length) break;
    cursor = Math.max(cursor + 1, safeEnd - 180);
    index += 1;
  }
  return sections;
}

function normalizeAnswer(value: string) {
  return value
    .toLocaleLowerCase()
    .normalize("NFKC")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function answerMatches(input: string, expected: string) {
  const inputTerms = new Set(normalizeAnswer(input).split(" ").filter(term => term.length > 2));
  const expectedTerms = normalizeAnswer(expected).split(" ").filter(term => term.length > 2);
  if (!inputTerms.size || !expectedTerms.length) return false;
  const matches = expectedTerms.filter(term => inputTerms.has(term)).length;
  return matches >= Math.max(1, Math.ceil(expectedTerms.length * 0.35));
}

function emptyResult(message: string): ExplanationResult {
  return {
    answer: message,
    evidence: [],
    sourceRefs: [],
    confidence: "low",
    insufficientContext: true,
    conflicts: [],
    practiceQuestions: [],
    checkQuestion: { question: "", expectedAnswer: "", explanation: "", sourceRef: { label: "" } },
  };
}

export function MaterialExplanation({ subject, locale }: Props) {
  const { user } = useAuth();
  const indexedMaterials = useMemo(
    () => subject.materials.filter(material => material.status === "indexed" && Boolean(material.text?.trim())),
    [subject.materials]
  );
  const [selectedMaterialId, setSelectedMaterialId] = useState("all");
  const [selectedSectionIndex, setSelectedSectionIndex] = useState("all");
  const [action, setAction] = useState<Action>("simple");
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<SavedTurn[]>([]);
  const [result, setResult] = useState<ExplanationResult | null>(null);
  const [lastRequest, setLastRequest] = useState<{ action: Action; prompt: string } | null>(null);
  const [loadedStorageKey, setLoadedStorageKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [revealedQuestions, setRevealedQuestions] = useState<number[]>([]);
  const [practiceInputs, setPracticeInputs] = useState<Record<number, string>>({});
  const [practiceFeedback, setPracticeFeedback] = useState<Record<number, "correct" | "review"> >({});
  const [checkInput, setCheckInput] = useState("");
  const [checkFeedback, setCheckFeedback] = useState<"correct" | "review" | "">("");
  const askMaterialMutation = trpc.ai.askMaterial.useMutation();

  const selectedMaterial = indexedMaterials.find(material => material.id === selectedMaterialId);
  const sections = useMemo(
    () => selectedMaterial?.text ? splitIntoSections(selectedMaterial.text) : [],
    [selectedMaterial?.text]
  );
  const selectedSection = selectedSectionIndex === "all"
    ? undefined
    : sections.find(section => String(section.index) === selectedSectionIndex);
  const storageKey = `studynivo-explanation-${user?.id ?? "preview"}-${subject.id}-${selectedMaterialId}-${selectedSectionIndex}`;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      const saved = raw ? JSON.parse(raw) as {
        turns?: SavedTurn[];
        result?: ExplanationResult | null;
        practiceInputs?: Record<number, string>;
        practiceFeedback?: Record<number, "correct" | "review">;
        checkInput?: string;
        checkFeedback?: "correct" | "review" | "";
        lastRequest?: { action: Action; prompt: string } | null;
      } : {};
      setTurns(Array.isArray(saved.turns) ? saved.turns : []);
      setResult(saved.result ?? null);
      setLastRequest(saved.lastRequest ?? null);
      setPracticeInputs(saved.practiceInputs ?? {});
      setPracticeFeedback(saved.practiceFeedback ?? {});
      setCheckInput(saved.checkInput ?? "");
      setCheckFeedback(saved.checkFeedback ?? "");
      setLoadedStorageKey(storageKey);
    } catch {
      setTurns([]);
      setResult(null);
      setLastRequest(null);
      setPracticeInputs({});
      setPracticeFeedback({});
      setCheckInput("");
      setCheckFeedback("");
      setLoadedStorageKey(storageKey);
    }
    setRevealedQuestions([]);
    setError("");
  }, [storageKey]);

  useEffect(() => {
    if (loadedStorageKey !== storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify({ turns, result, lastRequest, practiceInputs, practiceFeedback, checkInput, checkFeedback }));
    } catch {
      // A full localStorage should not block the explanation flow.
    }
  }, [loadedStorageKey, storageKey, turns, result, lastRequest, practiceInputs, practiceFeedback, checkInput, checkFeedback]);

  const chooseMaterial = (value: string) => {
    setSelectedMaterialId(value);
    setSelectedSectionIndex("all");
    setResult(null);
  };

  const runExplanation = async (requestedAction = action, requestedQuestion?: string) => {
    if (isLoading) return;
    if (!indexedMaterials.length) {
      setError(trStatic("Add and index a clear source before asking for an explanation.", locale));
      return;
    }
    const selectedAction = actionOptions.find(option => option.id === requestedAction) ?? actionOptions[0];
    const prompt = requestedQuestion?.trim() || question.trim() || selectedAction.prompt;
    setLastRequest({ action: requestedAction, prompt });
    setIsLoading(true);
    setError("");
    setResult(null);
    setRevealedQuestions([]);
    setPracticeInputs({});
    setPracticeFeedback({});
    setCheckInput("");
    setCheckFeedback("");
    try {
      const rawResult = /^\d+$/.test(subject.id)
        ? await askMaterialMutation.mutateAsync({
            subjectId: Number(subject.id),
            materialId: selectedMaterialId === "all" ? undefined : Number(selectedMaterialId),
            sectionIndex: selectedSection?.index,
            action: requestedAction,
            question: prompt,
            locale,
          })
        : await Promise.reject(new Error("A saved subject is required for grounded explanations."));
      const nextResult = rawResult as ExplanationResult;
      setResult(nextResult);
      const turn: SavedTurn = {
        id: `${Date.now()}`,
        prompt,
        action: requestedAction,
        materialLabel: selectedMaterial?.name ?? trStatic("All indexed sources", locale),
        sectionLabel: selectedSection?.label,
        result: nextResult,
        createdAt: new Date().toISOString(),
      };
      setTurns(previous => [turn, ...previous].slice(0, 8));
      setQuestion("");
    } catch (requestError) {
      console.error("[StudyNivo] explanation request failed", requestError);
      setError(trStatic("The grounded explanation is unavailable. Your question is still here; retry the same request.", locale));
    } finally {
      setIsLoading(false);
    }
  };

  const retry = () => {
    const last = lastRequest ?? (turns[0] ? { action: turns[0].action, prompt: turns[0].prompt } : null);
    if (!last) return;
    setAction(last.action);
    setQuestion(last.prompt);
    void runExplanation(last.action, last.prompt);
  };

  const latestResult = result;
  const sourceSummary = selectedMaterial
    ? selectedSection ? `${selectedMaterial.name} · ${selectedSection.label}` : selectedMaterial.name
    : trStatic("All indexed sources", locale);

  return (
    <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(290px,.65fr)]">
      <section className="card overflow-hidden">
        <div className="border-b border-[#e2ece7] bg-[#f7fbf9] p-6">
          <div className="flex items-start gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e5f4ef] text-[#0f766e]"><FileSearch className="size-5" /></div>
            <div>
              <div className="kicker">{trStatic("Explain from your material", locale)}</div>
              <h2 className="mt-1 text-xl font-extrabold">{trStatic("Choose the evidence first.", locale)}</h2>
              <p className="mt-2 text-sm leading-6 text-[#708084]">{trStatic("Every explanation stays inside this subject and points back to the selected source.", locale)}</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <label className="text-xs font-extrabold text-[#51666a]">
              {trStatic("File", locale)}
              <select className="input mt-2" value={selectedMaterialId} onChange={event => chooseMaterial(event.target.value)}>
                <option value="all">{trStatic("All indexed sources", locale)}</option>
                {indexedMaterials.map(material => <option key={material.id} value={material.id}>{material.name}</option>)}
              </select>
            </label>
            <label className="text-xs font-extrabold text-[#51666a]">
              {trStatic("Part of the file", locale)}
              <select className="input mt-2" value={selectedSectionIndex} onChange={event => setSelectedSectionIndex(event.target.value)} disabled={!selectedMaterial || !sections.length}>
                <option value="all">{trStatic("The whole selected file", locale)}</option>
                {sections.map(section => <option key={section.index} value={section.index}>{section.label}</option>)}
              </select>
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {actionOptions.map(option => (
              <button
                key={option.id}
                type="button"
                className={`explain-action ${action === option.id ? "active" : ""}`}
                onClick={() => { setAction(option.id); void runExplanation(option.id); }}
                disabled={isLoading || !indexedMaterials.length}
              >
                {trStatic(option.label, locale)}
              </button>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <input
              className="input"
              value={question}
              onChange={event => setQuestion(event.target.value)}
              onKeyDown={event => { if (event.key === "Enter") void runExplanation(); }}
              placeholder={trStatic("Ask about this selected section…", locale)}
              aria-label={trStatic("Your explanation question", locale)}
            />
            <button type="button" className="btn-primary shrink-0" onClick={() => void runExplanation()} disabled={isLoading || !question.trim()}>
              {isLoading ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}
              {trStatic("Ask", locale)}
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2 text-[11px] font-semibold text-[#788c8a]">
            <ShieldCheck className="size-3.5 text-[#0f766e]" />
            {trStatic("Grounded only in", locale)} {sourceSummary}
          </div>
        </div>

        {error && (
          <div role="alert" className="m-6 flex items-start gap-2 rounded-2xl border border-[#f0d1ca] bg-[#fff7f4] p-4 text-sm leading-6 text-[#974f47]">
            <CircleAlert className="mt-0.5 size-4 shrink-0" />
            <div className="flex-1">{error}</div>
            <button type="button" className="btn-quiet !min-h-8" onClick={retry}><RotateCcw className="size-3.5" />{trStatic("Retry", locale)}</button>
          </div>
        )}

        {!indexedMaterials.length ? (
          <div className="m-6 rounded-2xl border border-dashed border-[#bcd7ce] bg-[#fbfdfb] p-7 text-center">
            <BookOpen className="mx-auto size-7 text-[#0f766e]" />
            <h3 className="mt-3 text-sm font-extrabold">{trStatic("Add and index a clear source first.", locale)}</h3>
            <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-[#7d8c8f]">{trStatic("PDF, text, and reviewed image text can power this path. An unclear OCR result stays out of the explanation.", locale)}</p>
          </div>
        ) : isLoading ? (
          <div className="m-6 rounded-2xl border border-[#dcece7] bg-[#f5faf8] p-7" aria-live="polite">
            <div className="flex items-center gap-2 text-sm font-extrabold text-[#0f766e]"><LoaderCircle className="size-4 animate-spin" />{trStatic("Building a source-linked explanation…", locale)}</div>
            <div className="mt-5 h-3 animate-pulse rounded-full bg-[#dcece7]" />
            <div className="mt-3 h-3 w-4/5 animate-pulse rounded-full bg-[#dcece7]" />
            <div className="mt-3 h-3 w-3/5 animate-pulse rounded-full bg-[#dcece7]" />
          </div>
        ) : latestResult ? (
          <ExplanationResultView
            result={latestResult}
            locale={locale}
            revealedQuestions={revealedQuestions}
            setRevealedQuestions={setRevealedQuestions}
            practiceInputs={practiceInputs}
            setPracticeInputs={setPracticeInputs}
            practiceFeedback={practiceFeedback}
            setPracticeFeedback={setPracticeFeedback}
            checkInput={checkInput}
            setCheckInput={setCheckInput}
            checkFeedback={checkFeedback}
            setCheckFeedback={setCheckFeedback}
          />
        ) : (
          <div className="m-6 rounded-2xl border border-dashed border-[#d8e7e1] p-7 text-center text-sm text-[#788a8d]">
            {trStatic("Choose a file and a teaching action to begin.", locale)}
          </div>
        )}
      </section>

      <aside className="card h-fit p-5">
        <div className="kicker">{trStatic("Saved explanation path", locale)}</div>
        <h3 className="mt-2 text-lg font-extrabold">{trStatic("Keep the thread with the source.", locale)}</h3>
        <p className="mt-2 text-xs leading-5 text-[#7a898c]">{trStatic("Your recent explanations and check answers stay separated by account, subject, file, and section on this device.", locale)}</p>
        <div className="mt-5 space-y-3">
          {turns.length ? turns.slice(0, 4).map(turn => (
            <button
              type="button"
              key={turn.id}
              className="w-full rounded-2xl border border-[#e5ece8] p-3 text-left transition hover:border-[#a9d1c7] hover:bg-[#f7fbf9]"
              onClick={() => { setResult(turn.result); setAction(turn.action); }}
            >
              <div className="text-xs font-extrabold text-[#354c51]">{turn.prompt}</div>
              <div className="mt-1 text-[10px] font-semibold text-[#8a9898]">{turn.materialLabel}{turn.sectionLabel ? ` · ${turn.sectionLabel}` : ""}</div>
            </button>
          )) : <div className="rounded-2xl bg-[#f6f9f7] p-4 text-xs leading-5 text-[#849194]">{trStatic("Your explanation history will appear here after the first answer.", locale)}</div>}
        </div>
      </aside>
    </div>
  );
}

function ExplanationResultView({
  result,
  locale,
  revealedQuestions,
  setRevealedQuestions,
  practiceInputs,
  setPracticeInputs,
  practiceFeedback,
  setPracticeFeedback,
  checkInput,
  setCheckInput,
  checkFeedback,
  setCheckFeedback,
}: {
  result: ExplanationResult;
  locale: Locale;
  revealedQuestions: number[];
  setRevealedQuestions: (value: number[]) => void;
  practiceInputs: Record<number, string>;
  setPracticeInputs: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  practiceFeedback: Record<number, "correct" | "review">;
  setPracticeFeedback: React.Dispatch<React.SetStateAction<Record<number, "correct" | "review">>>;
  checkInput: string;
  setCheckInput: (value: string) => void;
  checkFeedback: "correct" | "review" | "";
  setCheckFeedback: (value: "correct" | "review" | "") => void;
}) {
  const showQuestion = (index: number) => setRevealedQuestions([...new Set([...revealedQuestions, index])]);
  const toggleQuestion = (index: number) => setRevealedQuestions(revealedQuestions.includes(index) ? revealedQuestions.filter(item => item !== index) : [...revealedQuestions, index]);
  const checkPractice = (index: number) => {
    const question = result.practiceQuestions[index];
    if (!question || !practiceInputs[index]?.trim()) return;
    const correct = answerMatches(practiceInputs[index], question.answer);
    setPracticeFeedback(previous => ({ ...previous, [index]: correct ? "correct" : "review" }));
    showQuestion(index);
  };
  const checkUnderstanding = () => {
    if (!checkInput.trim() || !result.checkQuestion.question) return;
    setCheckFeedback(answerMatches(checkInput, result.checkQuestion.expectedAnswer) ? "correct" : "review");
  };
  return (
    <div className="p-6">
      {result.insufficientContext && (
        <div role="status" className="mb-5 rounded-2xl border border-[#f0d1ca] bg-[#fff7f4] p-4 text-sm leading-6 text-[#914f47]">
          <div className="font-extrabold">{trStatic("I couldn’t find that information in the file.", locale)}</div>
          <div className="mt-1">{trStatic("No outside knowledge was presented as if it came from your material. Add a clearer or more complete section and try again.", locale)}</div>
        </div>
      )}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-[#0f766e]"><ShieldCheck className="size-4" />{trStatic("Source-linked explanation", locale)}</div>
        <span className="source-pill">{trStatic(result.confidence, locale)} {trStatic("confidence", locale)}</span>
      </div>
      <div className="mt-4 whitespace-pre-line text-sm leading-8 text-[#355451]">{result.answer}</div>

      {result.evidence.length > 0 && (
        <div className="mt-6 rounded-2xl border border-[#dcece7] bg-[#f6faf8] p-4">
          <div className="flex items-center gap-2 text-xs font-extrabold text-[#0f766e]"><FileSearch className="size-4" />{trStatic("Evidence from the selected material", locale)}</div>
          <div className="mt-3 space-y-2">
            {result.evidence.map((item, index) => (
              <blockquote key={`${item.sourceRef.label}-${index}`} className="border-l-2 border-[#9ecbc1] pl-3 text-xs leading-6 text-[#58726e]">
                “{item.quote}” <span className="font-extrabold text-[#0f766e]">· {item.sourceRef.label}</span>
              </blockquote>
            ))}
          </div>
        </div>
      )}

      {result.conflicts.length > 0 && (
        <div className="mt-4 rounded-2xl border border-[#ead9b8] bg-[#fffaf0] p-4 text-xs leading-6 text-[#80652f]">
          <div className="font-extrabold">{trStatic("The sources do not fully agree.", locale)}</div>
          {result.conflicts.map((conflict, index) => <div key={`${conflict.claim}-${index}`} className="mt-1">{conflict.claim} · {conflict.sources.map(source => source.label).join(" · ")}</div>)}
        </div>
      )}

      {result.practiceQuestions.length > 0 && (
        <div className="mt-7">
          <div className="kicker">{trStatic("Check the same section", locale)}</div>
          <h3 className="mt-2 text-xl font-extrabold">{trStatic("Try 3–5 short questions.", locale)}</h3>
          <div className="mt-4 space-y-3">
            {result.practiceQuestions.map((item, index) => {
              const revealed = revealedQuestions.includes(index);
              const feedback = practiceFeedback[index];
              return (
                <div key={`${item.question}-${index}`} className="rounded-2xl border border-[#e3ece8] p-4">
                  <div className="flex items-start gap-3">
                    <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#e9f5f1] text-xs font-extrabold text-[#0f766e]">{index + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-extrabold leading-6 text-[#354c51]">{item.question}</div>
                      <input
                        className="input mt-3"
                        value={practiceInputs[index] ?? ""}
                        onChange={event => setPracticeInputs(previous => ({ ...previous, [index]: event.target.value }))}
                        placeholder={trStatic("Answer in your own words…", locale)}
                        aria-label={`${trStatic("Answer", locale)} ${index + 1}`}
                      />
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <button type="button" className="btn-light !min-h-9 !text-xs" onClick={() => checkPractice(index)} disabled={!practiceInputs[index]?.trim()}><Check className="size-3.5" />{trStatic("Check answer", locale)}</button>
                        <button type="button" className="btn-quiet !min-h-9 !text-xs" onClick={() => toggleQuestion(index)}><ChevronDown className="size-3.5" />{revealed ? trStatic("Hide explanation", locale) : trStatic("Show explanation", locale)}</button>
                        <span className="source-pill">{item.sourceRef.label}</span>
                      </div>
                      {feedback && <div role="status" className={`mt-3 rounded-xl p-3 text-xs leading-5 ${feedback === "correct" ? "bg-[#edf8f1] text-[#3f7651]" : "bg-[#fff7f4] text-[#92534b]"}`}>{feedback === "correct" ? trStatic("Good recall. Keep the distinction clear.", locale) : trStatic("Not quite yet. Compare your answer with the source-backed correction below.", locale)}</div>}
                      {revealed && <div className="mt-3 rounded-xl bg-[#f6f9f7] p-3 text-xs leading-6 text-[#5b706f]"><div className="font-extrabold text-[#0f766e]">{trStatic("Answer", locale)}: {item.answer}</div><div className="mt-1">{item.explanation}</div></div>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {result.checkQuestion.question && (
        <div className="mt-7 rounded-2xl border-2 border-[#a9d1c7] bg-[#f4faf7] p-5">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-[#0f766e]"><CheckCircle2 className="size-4" />{trStatic("One last understanding check", locale)}</div>
          <h3 className="mt-3 text-base font-extrabold leading-6 text-[#304c4c]">{result.checkQuestion.question}</h3>
          <textarea className="textarea mt-3 min-h-[84px]" value={checkInput} onChange={event => setCheckInput(event.target.value)} placeholder={trStatic("Explain it without looking back…", locale)} />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button type="button" className="btn-primary" onClick={checkUnderstanding} disabled={!checkInput.trim()}><Check className="size-4" />{trStatic("Check my understanding", locale)}</button>
            <span className="source-pill">{result.checkQuestion.sourceRef.label}</span>
          </div>
          {checkFeedback && <div role="status" className={`mt-4 rounded-xl p-3 text-xs leading-6 ${checkFeedback === "correct" ? "bg-[#eaf7ef] text-[#39704d]" : "bg-[#fff7f4] text-[#92534b]"}`}><div className="font-extrabold">{checkFeedback === "correct" ? trStatic("That shows the core idea.", locale) : trStatic("Review the core idea once more.", locale)}</div><div className="mt-1">{result.checkQuestion.explanation} <span className="font-extrabold">{trStatic("Expected answer", locale)}: {result.checkQuestion.expectedAnswer}</span></div></div>}
        </div>
      )}
    </div>
  );
}
