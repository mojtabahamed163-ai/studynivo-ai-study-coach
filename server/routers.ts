import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { invalidateUserSessions } from "./_core/customAuth";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  chatCompletion,
  groundedAnswerJsonSchema,
  groundedSystemPrompt,
} from "./ai/client";
import { chunkText, selectRelevantChunks } from "./ai/materialProcessor";
import { parseGroundedAnswer } from "./ai/grounding";
import {
  addSavedItem,
  addTextMaterial,
  createStudySession,
  createSubject,
  createUploadedMaterial,
  deleteSavedItem,
  getSubject,
  listSavedItems,
  listSubjects,
  retryUploadedMaterial,
  saveTopicInsights,
  searchSubjectMaterials,
  updateStudySession,
  listFlashcards,
  generateFlashcardsFromTopics,
  reviewFlashcard,
  createQuizAttempt,
  answerQuizQuestion,
  getQuizAttemptProgress,
  listDueFlashcardsForUser,
  getActiveStudySession,
  listMistakeReviewsForUser,
  getStudyRecommendationForUser,
  getUserLocale,
  setUserLocale,
} from "./db";
import { extractTopicInsights } from "./ai/materialAnalysis";
import { enqueueMaterialProcessing } from "./materialPipeline";

function insufficientContextMessage(locale: string, excerpt?: string) {
  const safeExcerpt = excerpt?.replace(/\s+/g, " ").trim().slice(0, 360);
  if (locale === "ar") {
    return safeExcerpt
      ? `المصدر يذكر: «${safeExcerpt}»\n\nلكن الملاحظات الحالية لا تحتوي على خطوات أو تفاصيل كافية لشرح الدرس كاملًا دون اختلاق معلومات. أضف صفحات أو ملاحظات أكثر، وسأشرحها خطوة بخطوة.`
      : "لا تحتوي المادة الحالية على تفاصيل كافية لشرح الدرس دون اختلاق معلومات. أضف ملاحظات أو صفحات أكثر، وسأشرحها خطوة بخطوة.";
  }
  return safeExcerpt
    ? `The source says: “${safeExcerpt}”\n\nThe current notes do not include enough steps or detail to explain the full lesson without inventing information. Add more pages or notes and I’ll explain it step by step.`
    : "The current material does not include enough detail to explain the lesson without inventing information. Add more notes or pages and I’ll explain it step by step.";
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    locale: protectedProcedure.query(({ ctx }) => getUserLocale(ctx.user.id)),
    setLocale: protectedProcedure
      .input(
        z.object({
          locale: z
            .string()
            .regex(/^(en|ar|es|pt|fr|de|it|tr|ja|ko|zh|hi|ru|id)$/),
        })
      )
      .mutation(({ ctx, input }) => setUserLocale(ctx.user.id, input.locale)),
    me: publicProcedure.query(opts => {
      const user = opts.ctx.user;
      if (!user) return null;
      return {
        id: user.id,
        openId: user.openId,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        loginMethod: user.loginMethod,
        role: user.role,
      };
    }),
    logout: publicProcedure.mutation(async ({ ctx }) => {
      if (ctx.user) await invalidateUserSessions(ctx.user.id);
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  workspace: router({
    subjects: protectedProcedure.query(({ ctx }) => listSubjects(ctx.user.id)),
    subject: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .query(({ ctx, input }) => getSubject(ctx.user.id, input.id)),
    createSubject: protectedProcedure
      .input(
        z.object({
          name: z.string().trim().min(1).max(160),
          examDate: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .optional(),
          color: z.string().optional(),
        })
      )
      .mutation(({ ctx, input }) => createSubject(ctx.user.id, input)),
    addTextMaterial: protectedProcedure
      .input(
        z.object({
          subjectId: z.number().int().positive(),
          name: z.string().min(1).max(255),
          kind: z.string().min(1).max(32),
          textContent: z.string().min(1),
          sourceRef: z.string().max(255).optional(),
        })
      )
      .mutation(({ ctx, input }) => addTextMaterial(ctx.user.id, input)),
    uploadMaterial: protectedProcedure
      .input(
        z.object({
          subjectId: z.number().int().positive(),
          name: z.string().min(1).max(255),
          mimeType: z.enum([
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "image/png",
            "image/jpeg",
            "image/webp",
            "audio/mpeg",
            "audio/wav",
            "audio/ogg",
            "audio/mp4",
            "audio/webm",
          ]),
          base64: z.string().min(1).max(70_000_000),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const result = await createUploadedMaterial(ctx.user.id, input);
        if (!result.duplicate && result.jobId)
          enqueueMaterialProcessing({
            userId: ctx.user.id,
            materialId: result.materialId,
            jobId: result.jobId,
            kind:
              input.mimeType === "application/pdf"
                ? "pdf"
                : input.mimeType.startsWith("image/")
                  ? "image"
                  : input.mimeType.startsWith("audio/")
                    ? "audio"
                    : "docx",
            mimeType: input.mimeType,
            buffer: result.buffer,
          });
        return {
          materialId: result.materialId,
          duplicate: result.duplicate,
          status: result.duplicate
            ? ("already_uploaded" as const)
            : ("queued" as const),
        };
      }),
    retryMaterial: protectedProcedure
      .input(z.object({ materialId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const result = await retryUploadedMaterial(
          ctx.user.id,
          input.materialId
        );
        enqueueMaterialProcessing({
          userId: ctx.user.id,
          materialId: input.materialId,
          jobId: result.jobId,
          kind: result.kind,
          mimeType: result.mimeType!,
          buffer: result.buffer,
        });
        return { materialId: input.materialId, status: "queued" as const };
      }),
    analyzeMaterial: protectedProcedure
      .input(
        z.object({
          subjectId: z.number().int().positive(),
          materialId: z.number().int().positive(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const subject = await getSubject(ctx.user.id, input.subjectId);
        const material = subject?.materials.find(
          item => item.id === input.materialId
        );
        if (!subject || !material) throw new Error("Material not found");
        if (material.status !== "indexed" || !material.textContent)
          throw new Error("MATERIAL_NOT_INDEXED");
        const insights = await extractTopicInsights(
          material.textContent,
          material.sourceRef || material.name,
          subject.name
        );
        const created = await saveTopicInsights(
          ctx.user.id,
          input.subjectId,
          insights
        );
        return { created, total: insights.length };
      }),
    searchMaterials: protectedProcedure
      .input(
        z.object({
          subjectId: z.number().int().positive(),
          query: z.string().trim().min(2).max(200),
        })
      )
      .query(({ ctx, input }) =>
        searchSubjectMaterials(ctx.user.id, input.subjectId, input.query)
      ),
    generateFlashcards: protectedProcedure
      .input(z.object({ subjectId: z.number().int().positive() }))
      .mutation(({ ctx, input }) =>
        generateFlashcardsFromTopics(ctx.user.id, input.subjectId)
      ),
    reviewQueue: protectedProcedure.query(({ ctx }) =>
      listDueFlashcardsForUser(ctx.user.id)
    ),
    mistakeReviewQueue: protectedProcedure.query(({ ctx }) =>
      listMistakeReviewsForUser(ctx.user.id)
    ),
    studyRecommendation: protectedProcedure
      .input(
        z.object({
          availableMinutes: z.number().int().min(1).max(180).default(30),
        })
      )
      .query(({ ctx, input }) =>
        getStudyRecommendationForUser(ctx.user.id, input.availableMinutes)
      ),
    flashcards: protectedProcedure
      .input(
        z.object({
          subjectId: z.number().int().positive(),
          dueOnly: z.boolean().optional(),
        })
      )
      .query(({ ctx, input }) =>
        listFlashcards(ctx.user.id, input.subjectId, input.dueOnly)
      ),
    reviewFlashcard: protectedProcedure
      .input(
        z.object({
          cardId: z.number().int().positive(),
          correct: z.boolean(),
          confidence: z.enum(["low", "medium", "high"]),
        })
      )
      .mutation(({ ctx, input }) => reviewFlashcard(ctx.user.id, input)),
    createQuiz: protectedProcedure
      .input(
        z.object({
          subjectId: z.number().int().positive(),
          kind: z.enum(["practice", "mock"]),
          locale: z
            .enum([
              "en", "ar", "es", "pt", "fr", "de", "it", "tr", "ja", "ko", "zh", "hi", "ru", "id",
            ])
            .default("en"),
        })
      )
      .mutation(({ ctx, input }) =>
        createQuizAttempt(ctx.user.id, input.subjectId, input.kind, input.locale)
      ),
    answerQuiz: protectedProcedure
      .input(
        z.object({
          attemptId: z.number().int().positive(),
          questionIndex: z.number().int().min(0),
          answer: z.string().min(1).max(1000),
          confidence: z.enum(["low", "medium", "high"]),
        })
      )
      .mutation(({ ctx, input }) => answerQuizQuestion(ctx.user.id, input)),
    quizAttemptProgress: protectedProcedure
      .input(
        z.object({
          attemptId: z.number().int().positive(),
          subjectId: z.number().int().positive(),
          kind: z.enum(["practice", "mock"]),
        })
      )
      .query(({ ctx, input }) =>
        getQuizAttemptProgress(
          ctx.user.id,
          input.attemptId,
          input.subjectId,
          input.kind
        )
      ),
    activeSession: protectedProcedure.query(({ ctx }) =>
      getActiveStudySession(ctx.user.id)
    ),
    startSession: protectedProcedure
      .input(
        z.object({
          subjectId: z.number().int().positive(),
          topicId: z.number().int().positive().optional(),
          durationMinutes: z.number().int().min(10).max(180),
        })
      )
      .mutation(({ ctx, input }) => createStudySession(ctx.user.id, input)),
    updateSession: protectedProcedure
      .input(
        z.object({
          sessionId: z.number().int().positive(),
          elapsedSeconds: z.number().int().min(0).max(10_800),
          status: z.enum(["active", "paused", "completed"]),
        })
      )
      .mutation(({ ctx, input }) =>
        updateStudySession(ctx.user.id, input.sessionId, input)
      ),
    saveItem: protectedProcedure
      .input(
        z.object({
          subjectId: z.number().int().positive(),
          title: z.string().min(1).max(255),
          excerpt: z.string().optional(),
          sourceRef: z.string().max(255).optional(),
        })
      )
      .mutation(({ ctx, input }) => addSavedItem(ctx.user.id, input)),
    savedItems: protectedProcedure.query(({ ctx }) =>
      listSavedItems(ctx.user.id)
    ),
    deleteSavedItem: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(({ ctx, input }) => deleteSavedItem(ctx.user.id, input.id)),
  }),
  ai: router({
    askTextMaterial: protectedProcedure
      .input(
        z.object({
          subjectName: z.string().min(1).max(160),
          question: z.string().min(2).max(1200),
          context: z.string().min(1).max(16000),
          sourceRef: z.string().max(255).optional(),
          locale: z
            .enum([
              "en",
              "ar",
              "es",
              "pt",
              "fr",
              "de",
              "it",
              "tr",
              "ja",
              "ko",
              "zh",
              "hi",
              "ru",
              "id",
            ])
            .default("en"),
        })
      )
      .mutation(async ({ input }) => {
        const chunks = selectRelevantChunks(
          chunkText(input.context),
          input.question,
          5
        );
        if (!chunks.length)
          return {
            answer: insufficientContextMessage(input.locale, input.context),
            sourceRefs: [],
            confidence: "low" as const,
            insufficientContext: true,
            conflicts: [],
          };
        const context = chunks
          .map(chunk => `[${input.sourceRef || chunk.sourceRef}] ${chunk.text}`)
          .join("\n\n");
        const answer = await chatCompletion([
          {
            role: "system",
            content: groundedSystemPrompt(
              input.subjectName,
              context,
              input.locale
            ),
          },
          { role: "user", content: input.question },
        ], { jsonSchema: groundedAnswerJsonSchema, timeoutMs: 60_000 });
        return parseGroundedAnswer(
          answer,
          chunks.map(chunk => input.sourceRef || chunk.sourceRef),
          insufficientContextMessage(input.locale, chunks[0]?.text)
        );
      }),
    askMaterial: protectedProcedure
      .input(
        z.object({
          subjectId: z.number().int().positive(),
          question: z.string().min(2).max(1200),
          locale: z
            .enum([
              "en",
              "ar",
              "es",
              "pt",
              "fr",
              "de",
              "it",
              "tr",
              "ja",
              "ko",
              "zh",
              "hi",
              "ru",
              "id",
            ])
            .default("en"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const subject = await getSubject(ctx.user.id, input.subjectId);
        if (!subject) throw new Error("Subject not found");
        const chunks = subject.materials.flatMap(material => {
          if (!material.textContent || material.status !== "indexed") return [];
          const transcript = Array.isArray(material.transcriptSegments)
            ? (
                material.transcriptSegments as Array<{
                  start?: number;
                  text?: string;
                }>
              )
                .filter(segment => segment.text)
                .map(segment => {
                  const seconds = Math.max(0, Math.floor(segment.start ?? 0));
                  return `[${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}] ${segment.text}`;
                })
                .join("\n")
            : material.textContent;
          return chunkText(transcript).map(chunk => ({
            ...chunk,
            sourceRef: `${material.sourceRef || material.name}${material.kind === "audio" ? ` · ${chunk.text.match(/\[(\d+:\d{2})\]/)?.[1] ?? "audio"}` : ""}`,
          }));
        });
        const relevant = selectRelevantChunks(chunks, input.question, 5);
        if (!relevant.length)
          return {
            answer: insufficientContextMessage(input.locale),
            sourceRefs: [],
            confidence: "low" as const,
            insufficientContext: true,
            conflicts: [],
          };
        const context = relevant
          .map(chunk => `[${chunk.sourceRef}] ${chunk.text}`)
          .join("\n\n");
        const answer = await chatCompletion([
          {
            role: "system",
            content: groundedSystemPrompt(subject.name, context, input.locale),
          },
          { role: "user", content: input.question },
        ], { jsonSchema: groundedAnswerJsonSchema, timeoutMs: 60_000 });
        return parseGroundedAnswer(
          answer,
          relevant.map(chunk => chunk.sourceRef),
          insufficientContextMessage(input.locale, relevant[0]?.text)
        );
      }),
  }),
});

export type AppRouter = typeof appRouter;
