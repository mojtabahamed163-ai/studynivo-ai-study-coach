import { z } from "zod";

export const sourceRefSchema = z.object({ label: z.string(), page: z.number().optional(), section: z.string().optional(), timestamp: z.number().optional() });
export const groundedPracticeQuestionSchema = z.object({ question: z.string().min(1), answer: z.string().min(1), explanation: z.string().min(1), sourceRef: sourceRefSchema });
export const groundedCheckQuestionSchema = z.object({ question: z.string(), expectedAnswer: z.string(), explanation: z.string(), sourceRef: sourceRefSchema });
export const groundedAnswerSchema = z.object({ answer: z.string(), evidence: z.array(z.object({ quote: z.string().min(1), sourceRef: sourceRefSchema })).max(8), sourceRefs: z.array(sourceRefSchema), confidence: z.enum(["low", "medium", "high"]), insufficientContext: z.boolean(), conflicts: z.array(z.object({ claim: z.string(), sources: z.array(sourceRefSchema) })), practiceQuestions: z.array(groundedPracticeQuestionSchema).max(5).default([]), checkQuestion: groundedCheckQuestionSchema.default({ question: "", expectedAnswer: "", explanation: "", sourceRef: { label: "" } }) });
export const topicExtractionSchema = z.object({ topics: z.array(z.object({ name: z.string(), summary: z.string(), sourceRefs: z.array(sourceRefSchema), needsMemorization: z.boolean() })) });
