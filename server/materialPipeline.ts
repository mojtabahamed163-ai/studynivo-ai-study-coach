import { PDFParse } from "pdf-parse";
import * as mammoth from "mammoth";
import { chatCompletion } from "./ai/client";
import { chunkText } from "./ai/materialProcessor";
import { ENV } from "./_core/env";
import { updateMaterialJob, updateMaterialProcessing } from "./db";

export type TranscriptSegment = { id?: number; start: number; end: number; text: string; avg_logprob?: number; no_speech_prob?: number; compression_ratio?: number };

export type UploadedMaterial = {
  userId: number;
  materialId: number;
  jobId: number;
  kind: "pdf" | "docx" | "image" | "audio";
  mimeType: string;
  buffer: Buffer;
};

type ExtractedMaterial = {
  text: string;
  pageCount?: number;
  confidence?: number;
  detectedLanguage?: string;
  audioDurationSeconds?: number;
  transcriptSegments?: TranscriptSegment[];
};

function detectLanguage(text: string) {
  if (/[^\u0000-\u007f]/.test(text)) return /[\u0600-\u06ff]/.test(text) ? "ar" : "multilingual";
  return "en";
}

async function extractPdf(buffer: Buffer): Promise<ExtractedMaterial> {
  const parser = new PDFParse({ data: buffer });
  try {
    const info = await parser.getInfo();
    const result = await parser.getText();
    return { text: result.text.trim(), pageCount: info.total };
  } finally {
    await parser.destroy();
  }
}

async function extractDocx(buffer: Buffer): Promise<ExtractedMaterial> {
  const result = await mammoth.extractRawText({ buffer });
  return { text: result.value.trim() };
}

async function extractImage(buffer: Buffer, mimeType: string): Promise<ExtractedMaterial> {
  const content = await chatCompletion([
    { role: "system", content: "You are a careful OCR engine. Extract only text visibly present in the image. Preserve line breaks, formulas, punctuation, and the original language. Return valid JSON only." },
    { role: "user", content: [
      { type: "text", text: "Read all legible text in this image. Return an object with text (string), language (BCP-47 short code or multilingual), and confidence (number from 0 to 1). If the image is blank or unreadable, use an empty text string and confidence below 0.5." },
      { type: "image_url", image_url: { url: `data:${mimeType};base64,${buffer.toString("base64")}` } },
    ] },
  ], { jsonSchema: { type: "object", additionalProperties: false, properties: { text: { type: "string" }, language: { type: "string" }, confidence: { type: "number", minimum: 0, maximum: 1 } }, required: ["text", "language", "confidence"] } });
  const parsed = JSON.parse(content) as { text?: string; language?: string; confidence?: number };
  return { text: parsed.text?.trim() || "", pageCount: 1, confidence: Math.max(0, Math.min(1, parsed.confidence ?? 0)), detectedLanguage: parsed.language || "multilingual" };
}

export async function transcribeAudio(buffer: Buffer, mimeType: string): Promise<ExtractedMaterial> {
  if (!ENV.forgeApiUrl || !ENV.forgeApiKey) throw new Error("SPEECH_SERVICE_NOT_CONFIGURED");
  const form = new FormData();
  form.append("file", new Blob([buffer as any], { type: mimeType }), "lecture-audio");
  form.append("model", "whisper-1");
  form.append("response_format", "verbose_json");
  form.append("prompt", "Transcribe the lecture accurately. Preserve the speaker's language, technical vocabulary, formulas, and meaningful pauses. Do not summarize.");
  const response = await fetch(`${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/audio/transcriptions`, { method: "POST", headers: { Authorization: `Bearer ${ENV.forgeApiKey}` }, body: form });
  if (!response.ok) {
    const detail = await response.text().catch(() => response.statusText);
    throw new Error(`SPEECH_TRANSCRIPTION_FAILED_${response.status}: ${detail.slice(0, 400)}`);
  }
  const result = await response.json() as { text?: string; language?: string; duration?: number; segments?: TranscriptSegment[] };
  return { text: result.text?.trim() || "", detectedLanguage: result.language || "multilingual", audioDurationSeconds: typeof result.duration === "number" ? Math.round(result.duration) : undefined, transcriptSegments: Array.isArray(result.segments) ? result.segments : [] };
}

export async function processUploadedMaterial(input: UploadedMaterial) {
  await updateMaterialJob(input.userId, input.jobId, { status: "running", attempts: 1 });
  await updateMaterialProcessing(input.userId, input.materialId, { status: "extracting" });
  try {
    const extracted = input.kind === "pdf" ? await extractPdf(input.buffer) : input.kind === "docx" ? await extractDocx(input.buffer) : input.kind === "image" ? await extractImage(input.buffer, input.mimeType) : await transcribeAudio(input.buffer, input.mimeType);
    const confidence = extracted.confidence;
    const isAudio = input.kind === "audio";
    const common = { pageCount: extracted.pageCount, audioDurationSeconds: extracted.audioDurationSeconds, transcriptSegments: extracted.transcriptSegments, detectedLanguage: extracted.detectedLanguage || detectLanguage(extracted.text), ocrConfidence: confidence === undefined ? undefined : Math.round(confidence * 100) };
    if (!extracted.text || extracted.text.length < 20 || (confidence !== undefined && confidence < 0.72)) {
      await updateMaterialProcessing(input.userId, input.materialId, { status: "needs_review", ...common, errorCode: isAudio ? "SHORT_OR_EMPTY_TRANSCRIPT" : "LOW_OCR_CONFIDENCE", errorMessage: isAudio ? "The recording produced a short or empty transcript. Check that speech is audible and try again." : "The extracted text is short or uncertain. Review the source image before studying from it." });
      await updateMaterialJob(input.userId, input.jobId, { status: "completed" });
      return;
    }
    await updateMaterialProcessing(input.userId, input.materialId, { status: "indexing", textContent: extracted.text, ...common });
    const chunks = chunkText(extracted.text);
    if (!chunks.length) throw new Error("EMPTY_CHUNK_INDEX");
    await updateMaterialProcessing(input.userId, input.materialId, { status: "indexed", textContent: extracted.text, ...common });
    await updateMaterialJob(input.userId, input.jobId, { status: "completed" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown extraction error";
    await updateMaterialProcessing(input.userId, input.materialId, { status: "failed", errorCode: input.kind === "audio" ? "TRANSCRIPTION_FAILED" : "EXTRACTION_FAILED", errorMessage: message });
    await updateMaterialJob(input.userId, input.jobId, { status: "failed", errorMessage: message });
  }
}

export function enqueueMaterialProcessing(input: UploadedMaterial) {
  setImmediate(() => { void processUploadedMaterial(input); });
}
