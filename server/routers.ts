import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { chatCompletion, groundedSystemPrompt } from "./ai/client";
import { chunkText, selectRelevantChunks } from "./ai/materialProcessor";
import { addSavedItem, addTextMaterial, createStudySession, createSubject, createUploadedMaterial, getSubject, listSubjects, retryUploadedMaterial, saveTopicInsights, searchSubjectMaterials, updateStudySession, listFlashcards, generateFlashcardsFromTopics, reviewFlashcard, createQuizAttempt, answerQuizQuestion } from "./db";
import { extractTopicInsights } from "./ai/materialAnalysis";
import { enqueueMaterialProcessing } from "./materialPipeline";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => { const cookieOptions = getSessionCookieOptions(ctx.req); ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 }); return { success: true } as const; }),
  }),
  workspace: router({
    subjects: protectedProcedure.query(({ ctx }) => listSubjects(ctx.user.id)),
    subject: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(({ ctx, input }) => getSubject(ctx.user.id, input.id)),
    createSubject: protectedProcedure.input(z.object({ name: z.string().trim().min(1).max(160), examDate: z.string().optional(), color: z.string().optional() })).mutation(({ ctx, input }) => createSubject(ctx.user.id, input)),
    addTextMaterial: protectedProcedure.input(z.object({ subjectId: z.number().int().positive(), name: z.string().min(1).max(255), kind: z.string().min(1).max(32), textContent: z.string().min(1), sourceRef: z.string().max(255).optional() })).mutation(({ ctx, input }) => addTextMaterial(ctx.user.id, input)),
    uploadMaterial: protectedProcedure.input(z.object({ subjectId: z.number().int().positive(), name: z.string().min(1).max(255), mimeType: z.enum(["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/png", "image/jpeg", "image/webp", "audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4", "audio/webm"]), base64: z.string().min(1).max(70_000_000) })).mutation(async ({ ctx, input }) => {
      const result = await createUploadedMaterial(ctx.user.id, input);
      if (!result.duplicate && result.jobId) enqueueMaterialProcessing({ userId: ctx.user.id, materialId: result.materialId, jobId: result.jobId, kind: input.mimeType === "application/pdf" ? "pdf" : input.mimeType.startsWith("image/") ? "image" : input.mimeType.startsWith("audio/") ? "audio" : "docx", mimeType: input.mimeType, buffer: result.buffer });
      return { materialId: result.materialId, duplicate: result.duplicate, status: result.duplicate ? "already_uploaded" as const : "queued" as const };
    }),
    retryMaterial: protectedProcedure.input(z.object({ materialId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const result = await retryUploadedMaterial(ctx.user.id, input.materialId);
      enqueueMaterialProcessing({ userId: ctx.user.id, materialId: input.materialId, jobId: result.jobId, kind: result.kind, mimeType: result.mimeType!, buffer: result.buffer });
      return { materialId: input.materialId, status: "queued" as const };
    }),
    analyzeMaterial: protectedProcedure.input(z.object({ subjectId: z.number().int().positive(), materialId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const subject = await getSubject(ctx.user.id, input.subjectId);
      const material = subject?.materials.find((item) => item.id === input.materialId);
      if (!subject || !material) throw new Error("Material not found");
      if (material.status !== "indexed" || !material.textContent) throw new Error("MATERIAL_NOT_INDEXED");
      const insights = await extractTopicInsights(material.textContent, material.sourceRef || material.name, subject.name);
      const created = await saveTopicInsights(ctx.user.id, input.subjectId, insights);
      return { created, total: insights.length };
    }),
    searchMaterials: protectedProcedure.input(z.object({ subjectId: z.number().int().positive(), query: z.string().trim().min(2).max(200) })).query(({ ctx, input }) => searchSubjectMaterials(ctx.user.id, input.subjectId, input.query)),
    generateFlashcards: protectedProcedure.input(z.object({ subjectId: z.number().int().positive() })).mutation(({ ctx, input }) => generateFlashcardsFromTopics(ctx.user.id, input.subjectId)),
    flashcards: protectedProcedure.input(z.object({ subjectId: z.number().int().positive(), dueOnly: z.boolean().optional() })).query(({ ctx, input }) => listFlashcards(ctx.user.id, input.subjectId, input.dueOnly)),
    reviewFlashcard: protectedProcedure.input(z.object({ cardId: z.number().int().positive(), correct: z.boolean(), confidence: z.enum(["low", "medium", "high"]) })).mutation(({ ctx, input }) => reviewFlashcard(ctx.user.id, input)),
    createQuiz: protectedProcedure.input(z.object({ subjectId: z.number().int().positive(), kind: z.enum(["practice", "mock"]) })).mutation(({ ctx, input }) => createQuizAttempt(ctx.user.id, input.subjectId, input.kind)),
    answerQuiz: protectedProcedure.input(z.object({ attemptId: z.number().int().positive(), questionIndex: z.number().int().min(0), answer: z.string(), confidence: z.enum(["low", "medium", "high"]) })).mutation(({ ctx, input }) => answerQuizQuestion(ctx.user.id, input)),
    startSession: protectedProcedure.input(z.object({ subjectId: z.number().int().positive(), topicId: z.number().int().positive().optional(), durationMinutes: z.number().int().min(10).max(180) })).mutation(({ ctx, input }) => createStudySession(ctx.user.id, input)),
    updateSession: protectedProcedure.input(z.object({ sessionId: z.number().int().positive(), elapsedSeconds: z.number().int().min(0), status: z.enum(["active", "paused", "completed"]) })).mutation(({ ctx, input }) => updateStudySession(ctx.user.id, input.sessionId, input)),
    saveItem: protectedProcedure.input(z.object({ subjectId: z.number().int().positive(), title: z.string().min(1).max(255), excerpt: z.string().optional(), sourceRef: z.string().max(255).optional() })).mutation(({ ctx, input }) => addSavedItem(ctx.user.id, input)),
  }),
  ai: router({
    askTextMaterial: protectedProcedure.input(z.object({ subjectName: z.string().min(1).max(160), question: z.string().min(2).max(1200), context: z.string().min(1).max(16000), sourceRef: z.string().max(255).optional(), locale: z.enum(["en", "ar", "es", "pt", "fr", "de", "it", "tr", "ja", "ko", "zh", "hi", "ru", "id"]).default("en") })).mutation(async ({ input }) => {
      const chunks = selectRelevantChunks(chunkText(input.context), input.question, 5);
      if (!chunks.length) return { answer: "The available material is not enough to answer this yet. Add clearer notes or ask about a concept that appears in the source.", sourceRefs: [], confidence: "low" as const, insufficientContext: true, conflicts: [] };
      const context = chunks.map((chunk) => `[${input.sourceRef || chunk.sourceRef}] ${chunk.text}`).join("\n\n");
      const answer = await chatCompletion([{ role: "system", content: groundedSystemPrompt(input.subjectName, context, input.locale) }, { role: "user", content: input.question }]);
      return { answer, sourceRefs: chunks.map((chunk) => ({ label: input.sourceRef || chunk.sourceRef })), confidence: "medium" as const, insufficientContext: false, conflicts: [] };
    }),
    askMaterial: protectedProcedure.input(z.object({ subjectId: z.number().int().positive(), question: z.string().min(2).max(1200), locale: z.enum(["en", "ar", "es", "pt", "fr", "de", "it", "tr", "ja", "ko", "zh", "hi", "ru", "id"]).default("en") })).mutation(async ({ ctx, input }) => {
      const subject = await getSubject(ctx.user.id, input.subjectId);
      if (!subject) throw new Error("Subject not found");
      const chunks = subject.materials.flatMap((material) => {
        if (!material.textContent) return [];
        const transcript = Array.isArray(material.transcriptSegments) ? (material.transcriptSegments as Array<{ start?: number; text?: string }>).filter((segment) => segment.text).map((segment) => { const seconds = Math.max(0, Math.floor(segment.start ?? 0)); return `[${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}] ${segment.text}`; }).join("\n") : material.textContent;
        return chunkText(transcript).map((chunk) => ({ ...chunk, sourceRef: `${material.sourceRef || material.name}${material.kind === "audio" ? ` · ${chunk.text.match(/\[(\d+:\d{2})\]/)?.[1] ?? "audio"}` : ""}` }));
      });
      const relevant = selectRelevantChunks(chunks, input.question, 5);
      if (!relevant.length) return { answer: "The available material is not enough to answer this yet. Add clearer notes or a text source to continue.", sourceRefs: [], confidence: "low" as const, insufficientContext: true, conflicts: [] };
      const context = relevant.map((chunk) => `[${chunk.sourceRef}] ${chunk.text}`).join("\n\n");
      const answer = await chatCompletion([{ role: "system", content: groundedSystemPrompt(subject.name, context, input.locale) }, { role: "user", content: input.question }]);
      return { answer, sourceRefs: relevant.map((chunk) => ({ label: chunk.sourceRef })), confidence: "medium" as const, insufficientContext: false, conflicts: [] };
    }),
  }),
});

export type AppRouter = typeof appRouter;
