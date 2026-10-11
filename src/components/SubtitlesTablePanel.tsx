import React from "react";
import { Check } from "lucide-react";
import { type Row, type Json3 } from "@/lib/subtitles";
import { SubtitleRow, type SubtitleColumn } from "@/components/SubtitleRow";
import { type SpeechProgress } from "@/components/HighlightedSubtitle";

export interface SubtitlesTablePanelProps {
  isAndroid: boolean;
  rows: Row[];
  displayedRows: Row[];
  cols: SubtitleColumn[];
  subtitlesLimit: number;
  setSubtitlesLimit: (limit: number) => void;
  subtitlesPage: number;
  setSubtitlesPage: React.Dispatch<React.SetStateAction<number>>;
  active: number;
  allFavoritesAligned: boolean;
  targetLanguages: string[];
  speechProgress: SpeechProgress;
  tracks: Record<string, Json3> | null;
  onSeek: (r: Row, index: number) => void;
  spokenLangs: string[];
  ttsRatios: Record<string, number>;
}

export function SubtitlesTablePanel({
  isAndroid,
  rows,
  displayedRows,
  cols,
  subtitlesLimit,
  setSubtitlesLimit,
  subtitlesPage,
  setSubtitlesPage,
  active,
  allFavoritesAligned,
  targetLanguages,
  speechProgress,
  tracks,
  onSeek,
  spokenLangs,
  ttsRatios,
}: SubtitlesTablePanelProps) {
  return (
    <div
      id="subtitles-table-panel"
      data-testid="subtitles-table-panel"
      className="max-h-[calc(100vh-8rem)] overflow-auto"
    >
      {isAndroid && rows.length > 0 && (
        <div
          data-testid="android-subtitles-pagination-bar"
          className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/40 px-3 py-2 text-xs"
        >
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">
              Lines{" "}
              {subtitlesLimit > 0
                ? `${(subtitlesPage - 1) * subtitlesLimit + 1}–${Math.min(
                    subtitlesPage * subtitlesLimit,
                    rows.length,
                  )}`
                : `1–${rows.length}`}{" "}
              of {rows.length}
            </span>
            <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-normal text-primary">
              First 10 lines of favorite languages
            </span>
            {allFavoritesAligned && targetLanguages.length > 0 && (
              <span
                data-testid="subtitles-sync-aligned"
                className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400"
              >
                <Check className="h-3 w-3" />
                Favorites Aligned ({targetLanguages.length})
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <label
                htmlFor="subtitles-limit-select"
                className="text-muted-foreground"
              >
                Lines per view:
              </label>
              <select
                id="subtitles-limit-select"
                value={subtitlesLimit}
                onChange={(e) => {
                  setSubtitlesLimit(Number(e.target.value));
                  setSubtitlesPage(1);
                }}
                className="rounded border border-input bg-background px-2 py-1 text-xs"
              >
                <option value={10}>10 (Default)</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={0}>All ({rows.length})</option>
              </select>
            </div>
            {subtitlesLimit > 0 && Math.ceil(rows.length / subtitlesLimit) > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={subtitlesPage <= 1}
                  onClick={() => setSubtitlesPage((p) => Math.max(1, p - 1))}
                  className="rounded border border-border px-2 py-0.5 hover:bg-muted disabled:opacity-40"
                >
                  Prev
                </button>
                <span className="px-1 tabular-nums">
                  {subtitlesPage} / {Math.ceil(rows.length / subtitlesLimit)}
                </span>
                <button
                  type="button"
                  disabled={subtitlesPage >= Math.ceil(rows.length / subtitlesLimit)}
                  onClick={() =>
                    setSubtitlesPage((p) =>
                      Math.min(Math.ceil(rows.length / subtitlesLimit), p + 1),
                    )
                  }
                  className="rounded border border-border px-2 py-0.5 hover:bg-muted disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0 z-10 bg-secondary">
          <tr>
            <th className="w-24 px-3 py-2 text-left font-medium">Time</th>
            {cols.map((l) => (
              <th key={l.code} className="px-3 py-2 text-left font-medium">
                {l.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayedRows.map((r, i) => {
            const actualIndex =
              isAndroid && subtitlesLimit > 0
                ? (subtitlesPage - 1) * subtitlesLimit + i
                : i;
            return (
              <SubtitleRow
                key={actualIndex}
                r={r}
                actualIndex={actualIndex}
                isActive={actualIndex === active}
                cols={cols}
                speechProgress={speechProgress}
                tracks={tracks}
                onSeek={onSeek}
                spokenLangs={spokenLangs}
                ttsRatios={ttsRatios}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
