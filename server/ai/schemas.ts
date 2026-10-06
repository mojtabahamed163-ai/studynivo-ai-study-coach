import { z } from "zod";

export const sourceRefSchema = z.object({ label: z.string(), page: z.number().optional(), section: z.string().optional(), timestamp: z.number().optional() });
export const groundedAnswerSchema = z.object({ answer: z.string(), sourceRefs: z.array(sourceRefSchema), confidence: z.enum(["low", "medium", "high"]), insufficientContext: z.boolean(), conflicts: z.array(z.object({ claim: z.string(), sources: z.array(sourceRefSchema) })) });
export const topicExtractionSchema = z.object({ topics: z.array(z.object({ name: z.string(), summary: z.string(), sourceRefs: z.array(sourceRefSchema), needsMemorization: z.boolean() })) });
