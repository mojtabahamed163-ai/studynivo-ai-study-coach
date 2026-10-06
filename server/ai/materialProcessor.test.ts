import { describe, expect, it } from "vitest";
import { normalizeSearchText, selectRelevantChunks } from "./materialProcessor";

describe("material retrieval", () => {
  it("normalizes Arabic variants and diacritics", () => {
    expect(normalizeSearchText("إِعادةُ المراجعة")).toBe("اعادة المراجعة");
  });

  it("ranks chunks by query coverage and exact phrase", () => {
    const result = selectRelevantChunks(
      [
        { index: 0, text: "DNA is copied during replication.", sourceRef: "Text section 1" },
        { index: 1, text: "DNA replication is a process where DNA is copied.", sourceRef: "Text section 2" },
        { index: 2, text: "Cell membranes control transport.", sourceRef: "Text section 3" },
      ],
      "DNA replication"
    );
    expect(result.map(chunk => chunk.index)).toEqual([1, 0]);
  });
});
