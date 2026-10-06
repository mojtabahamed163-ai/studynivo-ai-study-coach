import { PDFParse } from "pdf-parse";
import * as mammoth from "mammoth";
import { chatCompletion } from "./ai/client";
import { chunkText } from "./ai/materialProcessor";
import { ENV } from "./_core/env";
import {
  claimMaterialJob,
  listRecoverableMaterialJobs,
  updateMaterialJob,
  updateMaterialProcessing,
} from "./db";
import { storageGetSignedUrl } from "./storage";
import {
  hasExpectedSignature,
  MAX_AUDIO_BYTES,
  MAX_MATERIAL_BYTES,
  MaterialKind,
} from "./materialValidation";

export type TranscriptSegment = {
  id?: number;
  start: number;
  end: number;
  text: string;
  avg_logprob?: number;
  no_speech_prob?: number;
  compression_ratio?: number;
};

export type UploadedMaterial = {
  userId: number;
  materialId: number;
  jobId: number;
  kind: MaterialKind;
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

const MAX_PROCESSING_ATTEMPTS = 3;
const RETRY_DELAY_MS = [1000, 3000];

function detectLanguage(text: string) {
  if (/[^\u0000-\u007f]/.test(text))
    return /[\u0600-\u06ff]/.test(text) ? "ar" : "multilingual";
  return "en";
}

function processingFailureMessage(kind: MaterialKind) {
  if (kind === "audio")
    return "Audio processing failed. Check the recording and try again.";
  if (kind === "image")
    return "Image text extraction failed. Check the image and try again.";
  return "Document processing failed. Check the file and try again.";
}

function isRetryable(error: unknown) {
  if (!(error instanceof Error)) return false;
  if (error.name === "AbortError" || error.name === "TimeoutError") return true;
  if (/fetch failed|network|ECONNRESET|ETIMEDOUT|EAI_AGAIN/i.test(error.message))
    return true;
  const status = error.message.match(/\b(408|429|5\d\d)\b/)?.[1];
  return Boolean(status);
}

function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
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

async function extractImage(
  buffer: Buffer,
  mimeType: string
): Promise<ExtractedMaterial> {
  const content = await chatCompletion(
    [
      {
        role: "system",
        content:
          "You are a careful OCR engine. Extract only text visibly present in the image. Preserve line breaks, formulas, punctuation, and the original language. Return valid JSON only.",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Read all legible text in this image. Return an object with text (string), language (BCP-47 short code or multilingual), and confidence (number from 0 to 1). If the image is blank or unreadable, use an empty text string and confidence below 0.5.",
          },
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${buffer.toString("base64")}`,
            },
          },
        ],
      },
    ],
    {
      jsonSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
          text: { type: "string" },
          language: { type: "string" },
          confidence: { type: "number", minimum: 0, maximum: 1 },
        },
        required: ["text", "language", "confidence"],
      },
    }
  );
  const parsed = JSON.parse(content) as {
    text?: string;
    language?: string;
    confidence?: number;
  };
  return {
    text: parsed.text?.trim() || "",
    pageCount: 1,
    confidence: Math.max(0, Math.min(1, parsed.confidence ?? 0)),
    detectedLanguage: parsed.language || "multilingual",
  };
}

export async function transcribeAudio(
  buffer: Buffer,
  mimeType: string
): Promise<ExtractedMaterial> {
  if (!ENV.forgeApiUrl || !ENV.forgeApiKey)
    throw new Error("SPEECH_SERVICE_NOT_CONFIGURED");
  const form = new FormData();
  form.append("file", new Blob([buffer as any], { type: mimeType }), "lecture-audio");
  form.append("model", "whisper-1");
  form.append("response_format", "verbose_json");
  form.append(
    "prompt",
    "Transcribe the lecture accurately. Preserve the speaker's language, technical vocabulary, formulas, and meaningful pauses. Do not summarize."
  );
  const response = await fetch(
    `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/audio/transcriptions`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
      body: form,
      signal: AbortSignal.timeout(300_000),
    }
  );
  if (!response.ok)
    throw new Error(`SPEECH_TRANSCRIPTION_FAILED_${response.status}`);
  const result = (await response.json()) as {
    text?: string;
    language?: string;
    duration?: number;
    segments?: TranscriptSegment[];
  };
  return {
    text: result.text?.trim() || "",
    detectedLanguage: result.language || "multilingual",
    audioDurationSeconds:
      typeof result.duration === "number"
        ? Math.round(result.duration)
        : undefined,
    transcriptSegments: Array.isArray(result.segments) ? result.segments : [],
  };
}

export async function processUploadedMaterial(input: UploadedMaterial) {
  try {
    if (!(await claimMaterialJob(input.userId, input.jobId))) return false;
  } catch {
    console.error("[Material pipeline] could not claim job", {
      jobId: input.jobId,
    });
    return false;
  }

  for (let attempt = 1; attempt <= MAX_PROCESSING_ATTEMPTS; attempt += 1) {
    try {
      await updateMaterialJob(input.userId, input.jobId, { status: "running" });
      await updateMaterialProcessing(input.userId, input.materialId, {
        status: "extracting",
      });
      const extracted =
        input.kind === "pdf"
          ? await extractPdf(input.buffer)
          : input.kind === "docx"
            ? await extractDocx(input.buffer)
            : input.kind === "image"
              ? await extractImage(input.buffer, input.mimeType)
              : await transcribeAudio(input.buffer, input.mimeType);
      const isAudio = input.kind === "audio";
      const common = {
        pageCount: extracted.pageCount,
        audioDurationSeconds: extracted.audioDurationSeconds,
        transcriptSegments: extracted.transcriptSegments,
        detectedLanguage: extracted.detectedLanguage || detectLanguage(extracted.text),
        ocrConfidence:
          extracted.confidence === undefined
            ? undefined
            : Math.round(extracted.confidence * 100),
      };
      if (
        !extracted.text ||
        extracted.text.length < 20 ||
        (extracted.confidence !== undefined && extracted.confidence < 0.72)
      ) {
        await updateMaterialProcessing(input.userId, input.materialId, {
          status: "needs_review",
          ...common,
          errorCode: isAudio ? "SHORT_OR_EMPTY_TRANSCRIPT" : "LOW_OCR_CONFIDENCE",
          errorMessage: isAudio
            ? "The recording produced a short or empty transcript. Check that speech is audible and try again."
            : "The extracted text is short or uncertain. Review the source before studying from it.",
        });
        await updateMaterialJob(input.userId, input.jobId, { status: "completed" });
        return true;
      }
      await updateMaterialProcessing(input.userId, input.materialId, {
        status: "indexing",
        textContent: extracted.text,
        ...common,
      });
      if (!chunkText(extracted.text).length) throw new Error("EMPTY_CHUNK_INDEX");
      await updateMaterialProcessing(input.userId, input.materialId, {
        status: "indexed",
        textContent: extracted.text,
        ...common,
        errorCode: null,
        errorMessage: null,
      });
      await updateMaterialJob(input.userId, input.jobId, { status: "completed" });
      return true;
    } catch (error) {
      if (attempt < MAX_PROCESSING_ATTEMPTS && isRetryable(error)) {
        try {
          await wait(RETRY_DELAY_MS[attempt - 1] ?? 3000);
        } catch {}
        continue;
      }
      const code = isRetryable(error)
        ? "PROCESSING_SERVICE_UNAVAILABLE"
        : "MATERIAL_PROCESSING_FAILED";
      const message = processingFailureMessage(input.kind);
      console.error("[Material pipeline] processing failed", {
        jobId: input.jobId,
        kind: input.kind,
        attempt,
        code,
      });
      try {
        await updateMaterialProcessing(input.userId, input.materialId, {
          status: "failed",
          errorCode: code,
          errorMessage: message,
        });
        await updateMaterialJob(input.userId, input.jobId, {
          status: "failed",
          errorMessage: message,
        });
      } catch {
        console.error("[Material pipeline] could not persist failure", {
          jobId: input.jobId,
        });
      }
      return false;
    }
  }
  return false;
}

export function enqueueMaterialProcessing(input: UploadedMaterial) {
  setImmediate(() => {
    void processUploadedMaterial(input).catch(() => {
      console.error("[Material pipeline] unexpected job failure", {
        jobId: input.jobId,
      });
    });
  });
}

let recoveryStarted = false;

export function startMaterialJobRecovery() {
  if (recoveryStarted || !process.env.DATABASE_URL) return;
  recoveryStarted = true;
  let recoveryInProgress = false;
  const recover = async () => {
    if (recoveryInProgress) return;
    recoveryInProgress = true;
    try {
      const jobs = await listRecoverableMaterialJobs();
      for (const job of jobs) {
        if (
          !job.storageKey ||
          !job.mimeType ||
          !["pdf", "docx", "image", "audio"].includes(job.kind)
        )
          continue;
        const kind = job.kind as MaterialKind;
        const maxBytes = kind === "audio" ? MAX_AUDIO_BYTES : MAX_MATERIAL_BYTES;
        try {
          const url = await storageGetSignedUrl(job.storageKey);
          const response = await fetch(url, {
            signal: AbortSignal.timeout(60_000),
          });
          if (!response.ok) continue;
          const contentLength = Number(response.headers.get("content-length"));
          if (Number.isFinite(contentLength) && contentLength > maxBytes) continue;
          const buffer = Buffer.from(await response.arrayBuffer());
          if (
            !buffer.length ||
            buffer.length > maxBytes ||
            !hasExpectedSignature(buffer, kind, job.mimeType)
          )
            continue;
          enqueueMaterialProcessing({
            userId: job.userId,
            materialId: job.materialId,
            jobId: job.jobId,
            kind,
            mimeType: job.mimeType,
            buffer,
          });
        } catch {
          // Leave the persistent job recoverable; a later pass can retry the download.
        }
      }
    } catch {
      console.error("[Material pipeline] recovery scan failed");
    } finally {
      recoveryInProgress = false;
    }
  };
  void recover();
  const timer = setInterval(() => void recover(), 60_000);
  timer.unref?.();
}
