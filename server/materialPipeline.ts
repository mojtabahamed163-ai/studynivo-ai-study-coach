import { PDFParse } from "pdf-parse";
import * as mammoth from "mammoth";
import { chatCompletion } from "./ai/client";
import { chunkText } from "./ai/materialProcessor";
import { updateMaterialJob, updateMaterialProcessing } from "./db";

export type UploadedMaterial = {
  userId: number;
  materialId: number;
  jobId: number;
  kind: "pdf" | "docx" | "image";
  mimeType: string;
  buffer: Buffer;
};

function detectLanguage(text: string) {
  if (/[^\u0000-\u007f]/.test(text)) return /[\u0600-\u06ff]/.test(text) ? "ar" : "multilingual";
  return "en";
}

async function extractPdf(buffer: Buffer) {
  const parser = new PDFParse({ data: buffer });
  try {
    const info = await parser.getInfo();
    const result = await parser.getText();
    return { text: result.text.trim(), pageCount: info.total, confidence: undefined };
  } finally {
    await parser.destroy();
  }
}

async function extractDocx(buffer: Buffer) {
  const result = await mammoth.extractRawText({ buffer });
  return { text: result.value.trim(), pageCount: undefined, confidence: undefined };
}

async function extractImage(buffer: Buffer, mimeType: string) {
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

export async function processUploadedMaterial(input: UploadedMaterial) {
  await updateMaterialJob(input.userId, input.jobId, { status: "running", attempts: 1 });
  await updateMaterialProcessing(input.userId, input.materialId, { status: "extracting" });
  try {
    const extracted = input.kind === "pdf" ? await extractPdf(input.buffer) : input.kind === "docx" ? await extractDocx(input.buffer) : await extractImage(input.buffer, input.mimeType);
    const confidence = extracted.confidence;
    if (!extracted.text || extracted.text.length < 20 || (confidence !== undefined && confidence < 0.72)) {
      await updateMaterialProcessing(input.userId, input.materialId, { status: "needs_review", pageCount: extracted.pageCount, detectedLanguage: "detectedLanguage" in extracted ? extracted.detectedLanguage : "unknown", ocrConfidence: confidence === undefined ? undefined : Math.round(confidence * 100), errorCode: "LOW_OCR_CONFIDENCE", errorMessage: "The extracted text is short or uncertain. Review the source image before studying from it." });
      await updateMaterialJob(input.userId, input.jobId, { status: "completed" });
      return;
    }
    await updateMaterialProcessing(input.userId, input.materialId, { status: "indexing", textContent: extracted.text, pageCount: extracted.pageCount, detectedLanguage: "detectedLanguage" in extracted ? extracted.detectedLanguage : detectLanguage(extracted.text), ocrConfidence: confidence === undefined ? undefined : Math.round(confidence * 100) });
    const chunks = chunkText(extracted.text);
    if (!chunks.length) throw new Error("EMPTY_CHUNK_INDEX");
    await updateMaterialProcessing(input.userId, input.materialId, { status: "indexed", textContent: extracted.text, pageCount: extracted.pageCount, detectedLanguage: "detectedLanguage" in extracted ? extracted.detectedLanguage : detectLanguage(extracted.text), ocrConfidence: confidence === undefined ? undefined : Math.round(confidence * 100) });
    await updateMaterialJob(input.userId, input.jobId, { status: "completed" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown extraction error";
    await updateMaterialProcessing(input.userId, input.materialId, { status: "failed", errorCode: "EXTRACTION_FAILED", errorMessage: message });
    await updateMaterialJob(input.userId, input.jobId, { status: "failed", errorMessage: message });
  }
}

export function enqueueMaterialProcessing(input: UploadedMaterial) {
  setImmediate(() => { void processUploadedMaterial(input); });
}
