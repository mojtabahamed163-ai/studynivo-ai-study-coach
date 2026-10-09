import { ENV } from "../_core/env";

export type SourceRef = { label: string; page?: number; section?: string; timestamp?: number };
export type GroundedPracticeQuestion = { question: string; answer: string; explanation: string; sourceRef: SourceRef };
export type GroundedCheckQuestion = { question: string; expectedAnswer: string; explanation: string; sourceRef: SourceRef };
export type GroundedAnswer = { answer: string; sourceRefs: SourceRef[]; confidence: "low" | "medium" | "high"; insufficientContext: boolean; conflicts: Array<{ claim: string; sources: SourceRef[] }>; evidence: Array<{ quote: string; sourceRef: SourceRef }>; practiceQuestions: GroundedPracticeQuestion[]; checkQuestion: GroundedCheckQuestion };
export type InterfaceLocale = "en" | "ar" | "es" | "pt" | "fr" | "de" | "it" | "tr" | "ja" | "ko" | "zh" | "hi" | "ru" | "id";

const languageNames: Record<InterfaceLocale, string> = { en: "English", ar: "Arabic", es: "Spanish", pt: "Brazilian Portuguese", fr: "French", de: "German", it: "Italian", tr: "Turkish", ja: "Japanese", ko: "Korean", zh: "Simplified Chinese", hi: "Hindi", ru: "Russian", id: "Indonesian" };

type ChatMessage = { role: "system" | "user" | "assistant"; content: string | Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }> };

export const groundedAnswerJsonSchema: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  properties: {
    answer: { type: "string" },
    evidence: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          quote: { type: "string" },
          sourceRef: { type: "object", additionalProperties: false, properties: { label: { type: "string" } }, required: ["label"] },
        },
        required: ["quote", "sourceRef"],
      },
    },
    sourceRefs: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: { label: { type: "string" } },
        required: ["label"],
      },
    },
    confidence: { type: "string", enum: ["low", "medium", "high"] },
    insufficientContext: { type: "boolean" },
    conflicts: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          claim: { type: "string" },
          sources: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: { label: { type: "string" } },
              required: ["label"],
            },
          },
        },
        required: ["claim", "sources"],
      },
    },
    practiceQuestions: {
      type: "array",
      minItems: 0,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          question: { type: "string" },
          answer: { type: "string" },
          explanation: { type: "string" },
          sourceRef: { type: "object", additionalProperties: false, properties: { label: { type: "string" } }, required: ["label"] },
        },
        required: ["question", "answer", "explanation", "sourceRef"],
      },
    },
    checkQuestion: {
      type: "object",
      additionalProperties: false,
      properties: {
        question: { type: "string" },
        expectedAnswer: { type: "string" },
        explanation: { type: "string" },
        sourceRef: { type: "object", additionalProperties: false, properties: { label: { type: "string" } }, required: ["label"] },
      },
      required: ["question", "expectedAnswer", "explanation", "sourceRef"],
    },
  },
  required: [
    "answer",
    "evidence",
    "sourceRefs",
    "confidence",
    "insufficientContext",
    "conflicts",
    "practiceQuestions",
    "checkQuestion",
  ],
};

export async function chatCompletion(messages: ChatMessage[], options?: { model?: string; jsonSchema?: Record<string, unknown>; timeoutMs?: number }) {
  if (!ENV.forgeApiUrl || !ENV.forgeApiKey) throw new Error("Built-in AI is not available in this environment");
  const body: Record<string, unknown> = { messages, model: options?.model, temperature: 0.2 };
  if (options?.jsonSchema) body.response_format = { type: "json_schema", json_schema: { name: "studynivo_response", strict: true, schema: options.jsonSchema } };
  const response = await fetch(`${ENV.forgeApiUrl.replace(/\/+$/, "")}/v1/chat/completions`, { method: "POST", headers: { Authorization: `Bearer ${ENV.forgeApiKey}`, "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(options?.timeoutMs ?? 60_000) });
  const payload = await response.json().catch(() => ({})) as { error?: { message?: string }; choices?: Array<{ message?: { content?: string } }> };
  if (!response.ok || payload.error) throw new Error(`AI request failed (${response.status})`);
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI returned no usable content");
  return content;
}

export function groundedSystemPrompt(subjectName: string, sourceContext: string, locale: InterfaceLocale = "en", teachingMode = "answer the student’s question") {
  return `You are StudyNivo, a careful and patient study teacher. Answer only from the provided material for the subject ${subjectName}. Respond in ${languageNames[locale]}.

Teach for understanding, not just correctness:
- Teaching mode requested: ${teachingMode}.
- Start with a one-sentence direct answer in plain language.
- When the material describes a process, method, or lesson, explain it in short numbered steps in the order supported by the source.
- Define important terms briefly before using them, and keep formulas and proper nouns intact.
- End with a concise takeaway or memory cue only when it is supported by the material.
- Include 1–5 short evidence quotes copied exactly from the context for the key explanation, each paired with its exact source label. Never paraphrase inside a quote.
- Create 3–5 concise practice questions from the same supplied context. For each, include the correct answer and a short explanation of why it is correct. Create one final short check question with an expected answer and a short explanation of the key idea. Every question and answer must be supported by the context and must cite an exact supplied source label.
- Use short paragraphs and clear bullets; adapt the depth to the question and do not pad the answer.

If the context is insufficient for a complete explanation, say exactly what the material does and does not establish, set insufficientContext=true, use empty practiceQuestions and an empty checkQuestion, and do not fill missing steps from general knowledge. Never invent a source label, page, quote, formula, example, or fact. Return only source labels exactly as they appear in the supplied context. If sources conflict, explain the conflict and cite only the supplied source labels. Context:\n${sourceContext}`;
}
