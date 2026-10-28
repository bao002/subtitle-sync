import React from "react";
import { Check, Languages, Sparkles, FileCode } from "lucide-react";

import { type Row, type Json3, subtitleColumnName } from "@/lib/subtitles";
import { SubtitleRow, type SubtitleColumn } from "@/components/SubtitleRow";
import { type SpeechProgress } from "@/components/HighlightedSubtitle";
import { NewSubtitlesParserBar } from "@/components/NewSubtitlesParserBar";
import { SimpleParserConfig, DEFAULT_SIMPLE_PARSER_CONFIG } from "@/utils/newSubtitlesParser";

export interface SubtitlesTablePanelProps {
  isAndroid: boolean;
  rows: Row[];
  displayedRows: Row[];
  cols: SubtitleColumn[];
  baseLanguage?: string;
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
  primaryTtsLang?: string;
  onLoadCachedAiSubtitles?: () => void;
  hasCachedAi?: boolean;
  onSpeakCue?: (text: string, lang: string) => void;
  parserConfig?: SimpleParserConfig;
  onParserConfigChange?: (config: SimpleParserConfig) => void;
}

export function SubtitlesTablePanel({
  isAndroid,
  rows,
  displayedRows,
  cols,
  baseLanguage,
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
  primaryTtsLang,
  onLoadCachedAiSubtitles,
  hasCachedAi,
  onSpeakCue,
  parserConfig: externalParserConfig,
  onParserConfigChange,
}: SubtitlesTablePanelProps) {
  const [localParserConfig, setLocalParserConfig] = React.useState<SimpleParserConfig>(
    DEFAULT_SIMPLE_PARSER_CONFIG,
  );
  const activeParserConfig = externalParserConfig || localParserConfig;
  const handleParserConfigChange = onParserConfigChange || setLocalParserConfig;

  return (
    <div
      id="subtitles-table-panel"
      data-testid="subtitles-table-panel"
      data-control-category="daily-usage"
      className="max-h-[calc(100vh-8rem)] overflow-auto rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-1"
    >
      <NewSubtitlesParserBar
        config={activeParserConfig}
        onChange={handleParserConfigChange}
        sentenceCount={rows.length}
      />
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
            {hasCachedAi && onLoadCachedAiSubtitles && (
              <button
                type="button"
                data-testid="load-cached-ai-subtitles-viewer-btn"
                onClick={onLoadCachedAiSubtitles}
                className="inline-flex items-center gap-1 rounded bg-primary/10 hover:bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary transition-colors cursor-pointer"
                title="Load and apply cached AI-punctuated subtitles"
              >
                <Sparkles className="h-3 w-3" />
                <span>Load Cached AI</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <label htmlFor="subtitles-limit-select" className="text-muted-foreground">
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
      {!isAndroid && rows.length > 0 && hasCachedAi && onLoadCachedAiSubtitles && (
        <div
          data-testid="web-subtitles-cached-ai-bar"
          className="flex items-center justify-between border-b border-border bg-primary/5 px-3 py-1.5 text-xs"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="font-medium text-foreground">Cached AI Subtitles Available</span>
          </div>
          <button
            type="button"
            data-testid="load-cached-ai-subtitles-viewer-btn"
            onClick={onLoadCachedAiSubtitles}
            className="inline-flex items-center gap-1.5 rounded bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
            title="Load and apply cached AI-punctuated subtitles"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Load Cached AI Subtitles</span>
          </button>
        </div>
      )}
      <table data-testid="subtitles-table" className="w-full border-collapse text-sm">
        <thead data-testid="subtitles-table-head" className="sticky top-0 z-10 bg-secondary">
          <tr>
            <th data-testid="table-header-time" className="w-24 px-3 py-2 text-left font-medium">Time</th>
            {cols.map((l) => (
              <th key={l.code} data-testid={`table-header-col-${l.code}`} className="px-3 py-2 text-left font-medium">
                <span className="inline-flex items-center gap-1.5">
                  {subtitleColumnName(l.code, l.name)}
                  {l.isYouTubeOrJson && (
                    <FileCode
                      className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400"
                      aria-label="YouTube subtitles or JSON artifact"
                      data-testid={`column-source-youtube-or-json-${l.code}`}
                      title="Parsed from YouTube subtitles or .json artifact"
                    />
                  )}
                  {l.isOnDemandTranslation && (
                    <Sparkles
                      className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400"
                      aria-label="On-demand translation"
                      data-testid={`column-source-on-demand-${l.code}`}
                      title="On-demand translation"
                    />
                  )}
                  {l.isYouTubeTranslated && (
                    <Languages
                      className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400"
                      aria-label="YouTube translation"
                      data-testid={`youtube-translation-indicator-${l.code}`}
                      title="Translated by YouTube"
                    />
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody data-testid="subtitles-table-body">
          {displayedRows.length === 0 ? (
            <tr>
              <td
                colSpan={Math.max(1, cols.length + 1)}
                className="py-12 text-center text-sm text-muted-foreground"
                data-testid="subtitles-table-empty-notice"
              >
                No subtitles loaded for this video.
              </td>
            </tr>
          ) : (
            displayedRows.map((r, i) => {
              const actualIndex =
                isAndroid && subtitlesLimit > 0 ? (subtitlesPage - 1) * subtitlesLimit + i : i;
              return (
                <SubtitleRow
                  key={actualIndex}
                  r={r}
                  actualIndex={actualIndex}
                  isActive={actualIndex === active}
                  cols={cols}
                  baseLanguage={baseLanguage}
                  speechProgress={speechProgress}
                  tracks={tracks}
                  onSeek={onSeek}
                  spokenLangs={spokenLangs}
                  ttsRatios={ttsRatios}
                  primaryTtsLang={primaryTtsLang}
                  onSpeakCue={onSpeakCue}
                />
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
