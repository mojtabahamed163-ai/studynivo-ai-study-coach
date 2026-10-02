import { ENV } from "../_core/env";

export type SourceRef = { label: string; page?: number; section?: string; timestamp?: number };
export type GroundedAnswer = { answer: string; sourceRefs: SourceRef[]; confidence: "low" | "medium" | "high"; insufficientContext: boolean; conflicts: Array<{ claim: string; sources: SourceRef[] }> };
export type InterfaceLocale = "en" | "ar" | "es" | "pt" | "fr" | "de" | "it" | "tr" | "ja" | "ko" | "zh" | "hi" | "ru" | "id";

const languageNames: Record<InterfaceLocale, string> = { en: "English", ar: "Arabic", es: "Spanish", pt: "Brazilian Portuguese", fr: "French", de: "German", it: "Italian", tr: "Turkish", ja: "Japanese", ko: "Korean", zh: "Simplified Chinese", hi: "Hindi", ru: "Russian", id: "Indonesian" };

type ChatMessage = { role: "system" | "user" | "assistant"; content: string | Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }> };

export async function chatCompletion(messages: ChatMessage[], options?: { model?: string; jsonSchema?: Record<string, unknown> }) {
  if (!ENV.forgeApiUrl || !ENV.forgeApiKey) throw new Error("Built-in AI is not available in this environment");
  const body: Record<string, unknown> = { messages, model: options?.model, temperature: 0.2 };
  if (options?.jsonSchema) body.response_format = { type: "json_schema", json_schema: { name: "studynivo_response", strict: true, schema: options.jsonSchema } };
  const response = await fetch(`${ENV.forgeApiUrl.replace(/\/+$/, "")}/v1/chat/completions`, { method: "POST", headers: { Authorization: `Bearer ${ENV.forgeApiKey}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const payload = await response.json().catch(() => ({})) as { error?: { message?: string }; choices?: Array<{ message?: { content?: string } }> };
  if (!response.ok || payload.error) throw new Error(payload.error?.message || `AI request failed (${response.status})`);
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI returned no usable content");
  return content;
}

export function groundedSystemPrompt(subjectName: string, sourceContext: string, locale: InterfaceLocale = "en") {
  return `You are StudyNivo, a careful study coach. Answer only from the provided material for the subject ${subjectName}. Respond in ${languageNames[locale]}. Keep proper nouns and formulas intact. If the context is insufficient, say so clearly and set insufficientContext=true. Never invent a page, quote, formula, or fact. If sources conflict, surface the conflict and cite each source. Context:\n${sourceContext}`;
}
