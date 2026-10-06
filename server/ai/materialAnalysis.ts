import { chatCompletion } from "./client";
import { chunkText } from "./materialProcessor";

export type TopicInsight = { name: string; note: string; sourceRef: string };

const topicSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    topics: {
      type: "array",
      minItems: 0,
      maxItems: 8,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string", minLength: 2, maxLength: 180 },
          note: { type: "string", minLength: 2, maxLength: 500 },
          sourceRef: { type: "string", maxLength: 255 },
        },
        required: ["name", "note", "sourceRef"],
      },
    },
  },
  required: ["topics"],
} as const;

function normalizeName(value: string) {
  return value.trim().toLocaleLowerCase().replace(/\s+/g, " ");
}

export async function extractTopicInsights(text: string, sourceName: string, subjectName: string): Promise<TopicInsight[]> {
  const chunks = chunkText(text);
  if (!chunks.length) return [];
  const merged = new Map<string, TopicInsight>();
  const batches = Array.from({ length: Math.ceil(chunks.length / 8) }, (_, index) =>
    chunks.slice(index * 8, index * 8 + 8)
  );
  const analyzeBatch = async (batch: typeof chunks) => {
    const labels = new Map(
      batch.map(chunk => [
        `${sourceName} · ${chunk.sourceRef}`,
        `${sourceName} · ${chunk.sourceRef}`,
      ])
    );
    const context = batch.map((chunk) => `[${sourceName} · ${chunk.sourceRef}]\n${chunk.text}`).join("\n\n");
    const content = await chatCompletion([
      { role: "system", content: "You are StudyNivo's material analyst. Extract study-worthy topics from the provided source only. Keep topic names and notes in the source's main language. Do not invent facts, and do not write a generic summary. Return JSON only." },
      { role: "user", content: `Subject: ${subjectName}\nSource: ${sourceName}\nExtract up to eight distinct topics from this batch. Each note should say what the student should understand, remember, or practice. Include the exact source section label for each topic.\n\n${context}` },
    ], { jsonSchema: topicSchema });
    const parsed = JSON.parse(content) as { topics?: Array<{ name?: string; note?: string; sourceRef?: string }> };
    return (parsed.topics ?? [])
      .map(item => {
        const raw = item.sourceRef?.trim() || "";
        const label = labels.get(raw) ?? labels.get(`${sourceName} · ${raw}`);
        return label ? { ...item, sourceRef: label } : null;
      })
      .filter((item): item is { name?: string; note?: string; sourceRef: string } => Boolean(item));
  };
  // Keep a small concurrency cap so long images finish sooner without flooding the AI service.
  for (let offset = 0; offset < batches.length; offset += 3) {
    const results = await Promise.all(batches.slice(offset, offset + 3).map(analyzeBatch));
    for (const batchTopics of results) {
      for (const item of batchTopics) {
      if (!item.name?.trim() || !item.note?.trim()) continue;
      const name = item.name.trim();
      const key = normalizeName(name);
      const existing = merged.get(key);
      if (existing) {
        if (!existing.sourceRef.includes(item.sourceRef?.trim() || "")) existing.sourceRef = `${existing.sourceRef}; ${item.sourceRef?.trim() || sourceName}`.slice(0, 255);
      } else {
        merged.set(key, { name, note: item.note.trim(), sourceRef: (item.sourceRef?.trim() || sourceName).slice(0, 255) });
      }
      }
    }
  }
  return [...merged.values()].slice(0, 80);
}
