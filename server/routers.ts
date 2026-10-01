import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { chatCompletion, groundedSystemPrompt } from "./ai/client";
import { chunkText, selectRelevantChunks } from "./ai/materialProcessor";
import { addSavedItem, addTextMaterial, createStudySession, createSubject, getSubject, listSubjects, updateStudySession } from "./db";

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
    startSession: protectedProcedure.input(z.object({ subjectId: z.number().int().positive(), topicId: z.number().int().positive().optional(), durationMinutes: z.number().int().min(10).max(180) })).mutation(({ ctx, input }) => createStudySession(ctx.user.id, input)),
    updateSession: protectedProcedure.input(z.object({ sessionId: z.number().int().positive(), elapsedSeconds: z.number().int().min(0), status: z.enum(["active", "paused", "completed"]) })).mutation(({ ctx, input }) => updateStudySession(ctx.user.id, input.sessionId, input)),
    saveItem: protectedProcedure.input(z.object({ subjectId: z.number().int().positive(), title: z.string().min(1).max(255), excerpt: z.string().optional(), sourceRef: z.string().max(255).optional() })).mutation(({ ctx, input }) => addSavedItem(ctx.user.id, input)),
  }),
  ai: router({
    askTextMaterial: protectedProcedure.input(z.object({ subjectName: z.string().min(1).max(160), question: z.string().min(2).max(1200), context: z.string().min(1).max(16000), sourceRef: z.string().max(255).optional() })).mutation(async ({ input }) => {
      const chunks = selectRelevantChunks(chunkText(input.context), input.question, 5);
      if (!chunks.length) return { answer: "The available material is not enough to answer this yet. Add clearer notes or ask about a concept that appears in the source.", sourceRefs: [], confidence: "low" as const, insufficientContext: true, conflicts: [] };
      const context = chunks.map((chunk) => `[${input.sourceRef || chunk.sourceRef}] ${chunk.text}`).join("\n\n");
      const answer = await chatCompletion([{ role: "system", content: groundedSystemPrompt(input.subjectName, context) }, { role: "user", content: input.question }]);
      return { answer, sourceRefs: chunks.map((chunk) => ({ label: input.sourceRef || chunk.sourceRef })), confidence: "medium" as const, insufficientContext: false, conflicts: [] };
    }),
    askMaterial: protectedProcedure.input(z.object({ subjectId: z.number().int().positive(), question: z.string().min(2).max(1200) })).mutation(async ({ ctx, input }) => {
      const subject = await getSubject(ctx.user.id, input.subjectId);
      if (!subject) throw new Error("Subject not found");
      const chunks = subject.materials.flatMap((material) => material.textContent ? chunkText(material.textContent).map((chunk) => ({ ...chunk, sourceRef: material.sourceRef || chunk.sourceRef })) : []);
      const relevant = selectRelevantChunks(chunks, input.question, 5);
      if (!relevant.length) return { answer: "The available material is not enough to answer this yet. Add clearer notes or a text source to continue.", sourceRefs: [], confidence: "low" as const, insufficientContext: true, conflicts: [] };
      const context = relevant.map((chunk) => `[${chunk.sourceRef}] ${chunk.text}`).join("\n\n");
      const answer = await chatCompletion([{ role: "system", content: groundedSystemPrompt(subject.name, context) }, { role: "user", content: input.question }]);
      return { answer, sourceRefs: relevant.map((chunk) => ({ label: chunk.sourceRef })), confidence: "medium" as const, insufficientContext: false, conflicts: [] };
    }),
  }),
});

export type AppRouter = typeof appRouter;
