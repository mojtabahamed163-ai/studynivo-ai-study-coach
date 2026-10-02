import { BookmarkPlus, FileSearch, LoaderCircle, Search } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { trStatic } from "@/i18n";

type MaterialSearchProps = { subjectId: string; subjectName: string };

export function MaterialSearch({
  subjectId,
  subjectName,
}: MaterialSearchProps) {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [saved, setSaved] = useState<string[]>([]);
  const search = trpc.workspace.searchMaterials.useQuery(
    { subjectId: Number(subjectId), query: submittedQuery },
    {
      enabled: /^\d+$/.test(subjectId) && submittedQuery.length >= 2,
      retry: false,
    }
  );
  const utils = trpc.useUtils();
  const save = trpc.workspace.saveItem.useMutation();

  const submit = () => setSubmittedQuery(query.trim());
  const saveResult = async (
    result: NonNullable<typeof search.data>[number]
  ) => {
    const resultKey = `${result.materialId}-${result.section}`;
    if (saved.includes(resultKey)) return;
    await save.mutateAsync({
      subjectId: Number(subjectId),
      title: result.excerpt.slice(0, 120),
      excerpt: result.excerpt,
      sourceRef: [
        result.sourceRef,
        result.page ? `${trStatic("Page")} ${result.page}` : result.section,
        result.timestamp ? `at ${result.timestamp}` : "",
      ]
        .filter(Boolean)
        .join(" · "),
    });
    setSaved(current => [...current, resultKey]);
    await utils.workspace.savedItems.invalidate();
  };

  return (
    <div className="card p-6">
      <div className="flex items-start gap-3">
        <div className="grid size-10 place-items-center rounded-xl bg-[#eaf4f1] text-[#0f766e]">
          <FileSearch className="size-5" />
        </div>
        <div>
          <div className="kicker">{trStatic("Search your material")}</div>
          <h2 className="mt-1 text-xl font-extrabold">
            {trStatic("Find the exact passage")}
          </h2>
          <p className="mt-2 text-xs leading-5 text-[#849194]">
            {trStatic(
              "Search only inside indexed sources in this subject space. Results keep their source context."
            )}
          </p>
        </div>
      </div>
      <div className="mt-5 flex gap-2">
        <input
          className="input"
          value={query}
          onChange={event => setQuery(event.target.value)}
          onKeyDown={event => {
            if (event.key === "Enter") submit();
          }}
          placeholder={trStatic("e.g. inheritance patterns")}
        />
        <button
          className="btn-primary shrink-0"
          onClick={submit}
          disabled={query.trim().length < 2}
        >
          <Search className="size-4" />
          {trStatic("Search")}
        </button>
      </div>
      {search.isFetching && (
        <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-[#728486]">
          <LoaderCircle className="size-4 animate-spin text-[#0f766e]" />
          {trStatic("Searching indexed sources…")}
        </div>
      )}
      {submittedQuery &&
        !search.isFetching &&
        !search.data?.length &&
        !search.isError && (
          <div className="mt-5 rounded-2xl bg-[#f7faf8] p-4 text-sm leading-6 text-[#718184]">
            {trStatic(
              "No matching passage was found in this subject’s indexed material."
            )}
          </div>
        )}
      {search.isError && (
        <div className="mt-5 rounded-2xl border border-[#f0d9b7] bg-[#fff9ef] p-4 text-sm leading-6 text-[#8a682d]">
          {trStatic(
            "Search is unavailable right now. Try again when the material index is ready."
          )}
        </div>
      )}
      {!!search.data?.length && (
        <div className="mt-5 space-y-3">
          {search.data.map((result, index) => (
            <div
              key={`${result.materialId}-${result.section}-${index}`}
              className="rounded-2xl border border-[#e5ece8] p-4"
            >
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-extrabold text-[#3c4e54]">
                    {result.materialName}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#5c7073]">
                    {result.excerpt}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold text-[#7f9090]">
                    <span className="source-pill">{result.section}</span>
                    {result.page && (
                      <span className="source-pill">
                        {trStatic("Page")} {result.page}
                      </span>
                    )}
                    {result.timestamp && (
                      <span className="source-pill">{result.timestamp}</span>
                    )}
                  </div>
                </div>
                <button
                  className="btn-quiet shrink-0"
                  disabled={
                    saved.includes(`${result.materialId}-${result.section}`) ||
                    save.isPending
                  }
                  onClick={() => void saveResult(result)}
                >
                  <BookmarkPlus className="size-4" />
                  {saved.includes(`${result.materialId}-${result.section}`)
                    ? trStatic("Saved")
                    : trStatic("Save")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-4 text-[10px] font-semibold text-[#98a4a4]">
        {subjectName} · {trStatic("Grounded search")}
      </div>
    </div>
  );
}
