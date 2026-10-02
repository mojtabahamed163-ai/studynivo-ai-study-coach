export type TextChunk = { index: number; text: string; sourceRef: string };

export function chunkText(text: string, maxCharacters = 1800, overlap = 180): TextChunk[] {
  const normalized = text.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").trim();
  if (!normalized) return [];
  const chunks: TextChunk[] = [];
  let cursor = 0;
  let index = 0;
  while (cursor < normalized.length) {
    const end = Math.min(normalized.length, cursor + maxCharacters);
    const boundary = end < normalized.length ? Math.max(normalized.lastIndexOf("\n", end), normalized.lastIndexOf(".", end)) : end;
    const safeEnd = boundary > cursor + Math.floor(maxCharacters * 0.55) ? boundary + 1 : end;
    chunks.push({ index, text: normalized.slice(cursor, safeEnd).trim(), sourceRef: `Text section ${index + 1}` });
    if (safeEnd >= normalized.length) break;
    cursor = Math.max(cursor + 1, safeEnd - overlap);
    index += 1;
  }
  return chunks.filter((chunk) => chunk.text.length > 0);
}

export function selectRelevantChunks(chunks: TextChunk[], query: string, limit = 5) {
  const terms = query.toLocaleLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  return [...chunks]
    .map((chunk) => ({ chunk, score: terms.reduce((score, term) => score + (chunk.text.toLocaleLowerCase().includes(term) ? 1 : 0), 0) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.chunk.index - b.chunk.index)
    .slice(0, limit)
    .map(({ chunk }) => chunk);
}
