import React from "react";
import {
  Check,
  Languages,
  Sparkles,
  FileCode,
  Columns,
  Filter,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  Table as TableIcon,
} from "lucide-react";

import { type Row, type Json3, subtitleColumnName } from "@/lib/subtitles";
import { SubtitleRow, type SubtitleColumn } from "@/components/SubtitleRow";
import { type SpeechProgress } from "@/components/HighlightedSubtitle";
import {
  SimpleParserConfig,
  DEFAULT_SIMPLE_PARSER_CONFIG,
  countWords,
  isCompleteSentence,
} from "@/utils/newSubtitlesParser";
import { LearningGoalsFiltersPanel } from "@/components/shared/LearningGoalsFiltersPanel";
import {
  getZeroKnowledgeInLang,
  getPickWordStrategy,
  getTableDisplayModePreference,
  setTableDisplayModePreference,
  type TableDisplayMode,
} from "@/lib/playback-preferences";
import { getLanguageColorPalette } from "@/utils/languageColors";

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
  onSelectBaseLanguage?: (langCode: string) => void;
  spokenLangs: string[];
  ttsRatios: Record<string, number>;
  primaryTtsLang?: string;
  blacklist?: string[];
  onLoadCachedAiSubtitles?: () => void;
  hasCachedAi?: boolean;
  onSpeakCue?: (text: string, lang: string) => void;
  parserConfig?: SimpleParserConfig;
  onParserConfigChange?: (config: SimpleParserConfig) => void;
  onScrollToActivePosition?: () => void;
  onTablePlay?: () => void;
  tableDisplayMode?: TableDisplayMode;
  onTableDisplayModeChange?: (mode: TableDisplayMode) => void;
  languageMaxWords?: Record<string, number>;
  onLanguageMaxWordsChange?: (langCode: string, val: number | undefined) => void;
  languageSkipIncomplete?: Record<string, boolean>;
  onLanguageSkipIncompleteChange?: (langCode: string, val: boolean | undefined) => void;
  onResetAllLanguageCriteria?: () => void;
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
  onSelectBaseLanguage,
  spokenLangs,
  ttsRatios,
  primaryTtsLang,
  blacklist,
  onLoadCachedAiSubtitles,
  hasCachedAi,
  onSpeakCue,
  parserConfig: externalParserConfig,
  onParserConfigChange,
  onTablePlay,
  tableDisplayMode: externalTableDisplayMode,
  onTableDisplayModeChange,
  languageMaxWords,
  onLanguageMaxWordsChange,
  languageSkipIncomplete,
  onLanguageSkipIncompleteChange,
  onResetAllLanguageCriteria,
}: SubtitlesTablePanelProps) {
  const [localParserConfig, setLocalParserConfig] = React.useState<SimpleParserConfig>(
    DEFAULT_SIMPLE_PARSER_CONFIG,
  );
  const [freezeColumns, setFreezeColumns] = React.useState<boolean>(true);
  const [showRowCriteria, setShowRowCriteria] = React.useState<boolean>(true);
  const [internalDisplayMode, setInternalDisplayMode] = React.useState<TableDisplayMode>(() => {
    return externalTableDisplayMode || getTableDisplayModePreference();
  });

  const activeDisplayMode = externalTableDisplayMode || internalDisplayMode;

  const handleDisplayModeToggle = (mode: TableDisplayMode) => {
    setInternalDisplayMode(mode);
    setTableDisplayModePreference(mode);
    onTableDisplayModeChange?.(mode);
  };

  const shouldFreezeColumns = !isAndroid && freezeColumns;
  const activeParserConfig = externalParserConfig || localParserConfig;
  const handleParserConfigChange = onParserConfigChange || setLocalParserConfig;
  const [showQuarantinedParser, setShowQuarantinedParser] = React.useState(false);

  // Filter subtitle rows based on default language word count and sentence completion
  const effectiveDisplayedRows = React.useMemo(() => {
    const defaultLang = baseLanguage || cols[0]?.code || "";
    const maxWords = activeParserConfig?.maxWordsPerSentence;
    const skipIncomplete = Boolean(activeParserConfig?.skipIncompleteSentences);

    return displayedRows.filter((r) => {
      const defText = (defaultLang && r.texts[defaultLang]) || Object.values(r.texts)[0] || "";
      if (typeof maxWords === "number" && maxWords > 0) {
        if (countWords(defText) > maxWords) {
          return false;
        }
      }
      if (skipIncomplete && defText && !isCompleteSentence(defText)) {
        return false;
      }
      return true;
    });
  }, [
    displayedRows,
    baseLanguage,
    cols,
    activeParserConfig?.maxWordsPerSentence,
    activeParserConfig?.skipIncompleteSentences,
  ]);

  return (
    <>
      {/* Dynamic Row Criteria Subtitle Filters (Max Words Slider & Complete Sentences Only) - Positioned outside scrollable subtitles-table-panel */}
      <div
        id="subtitles-table-row-criteria-container"
        data-testid="subtitles-table-row-criteria-container"
        className="rounded-xl border border-border/70 bg-card/60 p-2 shadow-2xs mb-2"
      >
        <div className="flex items-center justify-between pb-1.5 px-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-primary" />
              <span>Row Criteria</span>
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">
              (Dynamic Table View)
            </span>
          </div>
          <button
            type="button"
            data-testid="toggle-row-criteria-visibility-btn"
            onClick={() => setShowRowCriteria((prev) => !prev)}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            {showRowCriteria ? (
              <>
                <ChevronUp className="h-3 w-3" />
                <span>Collapse</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3" />
                <span>Expand ({activeParserConfig.maxWordsPerSentence ?? 10} words max)</span>
              </>
            )}
          </button>
        </div>
        {showRowCriteria && (
          <LearningGoalsFiltersPanel
            maxWords={activeParserConfig.maxWordsPerSentence ?? 10}
            onMaxWordsChange={(val) => {
              handleParserConfigChange({
                ...activeParserConfig,
                maxWordsPerSentence: val,
              });
            }}
            skipIncompleteSentences={Boolean(activeParserConfig.skipIncompleteSentences)}
            onSkipIncompleteSentencesChange={(val) => {
              handleParserConfigChange({
                ...activeParserConfig,
                skipIncompleteSentences: val,
              });
            }}
            learningLanguages={cols.map((c) => ({
              code: c.code,
              name: c.name || c.code.toUpperCase(),
            }))}
            languageMaxWords={languageMaxWords}
            onLanguageMaxWordsChange={onLanguageMaxWordsChange}
            languageSkipIncomplete={languageSkipIncomplete}
            onLanguageSkipIncompleteChange={onLanguageSkipIncompleteChange}
            onResetAllLanguageCriteria={onResetAllLanguageCriteria}
          />
        )}
      </div>

      <div
        id="subtitles-table-panel"
        data-testid="subtitles-table-panel"
        data-control-category="daily-usage"
        className="custom-beautiful-scrollbar max-h-[calc(100vh-8rem)] overflow-auto rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-1"
      >
        {showQuarantinedParser ? (
          <div className="relative">
            <div className="flex items-center justify-between px-3 py-1 bg-amber-500/10 border-b border-amber-500/30 text-[11px] text-amber-800 dark:text-amber-200">
              <span className="font-semibold">
                Notice: Experimental Inner Subtitles Parser (Quarantined by Default)
              </span>
              <button
                type="button"
                data-testid="hide-quarantined-parser-btn"
                onClick={() => setShowQuarantinedParser(false)}
                className="text-[10px] underline hover:text-foreground cursor-pointer"
              >
                Quarantine / Hide
              </button>
            </div>
            <NewSubtitlesParserBar
              config={activeParserConfig}
              onChange={handleParserConfigChange}
              sentenceCount={rows.length}
            />
          </div>
        ) : (
          <div
            data-testid="subtitles-parser-quarantined-banner"
            className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-muted/40 border-b border-border text-[11px] text-muted-foreground"
          >
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-foreground/80">Inner Parser Quarantined:</span>
              <span>
                YouTube translations are naturally punctuated and used directly as translation
                source.
              </span>
            </div>
            <button
              type="button"
              data-testid="btn-toggle-quarantined-parser"
              onClick={() => setShowQuarantinedParser(true)}
              className="text-[10px] font-medium text-primary underline hover:text-primary/80 cursor-pointer"
            >
              Show Inner Parser
            </button>
          </div>
        )}
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
        {rows.length > 0 && (
          <div
            data-testid="subtitles-position-actions-bar"
            className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/25 px-3 py-1.5 text-xs"
          >
            <div className="flex flex-wrap items-center gap-2">
              {!isAndroid && (
                <button
                  type="button"
                  id="toggle-freeze-columns-btn"
                  data-testid="toggle-freeze-columns-btn"
                  onClick={() => setFreezeColumns((prev) => !prev)}
                  className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium transition-colors cursor-pointer ${
                    freezeColumns
                      ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                      : "border-border bg-background text-muted-foreground hover:bg-muted"
                  }`}
                  title={
                    freezeColumns
                      ? "Click to unfreeze first 2 columns"
                      : "Click to freeze first 2 columns (Time & Default Subtitles)"
                  }
                >
                  <Columns className="h-3.5 w-3.5" />
                  <span>{freezeColumns ? "Columns Frozen (1 & 2)" : "Freeze Columns"}</span>
                </button>
              )}

              {/* 1 Table vs Multiple Tables display mode toggle */}
              <div
                data-testid="table-display-mode-controls"
                className="inline-flex items-center rounded-lg border border-border/80 bg-background/80 p-0.5 shadow-2xs"
              >
                <button
                  type="button"
                  data-testid="btn-table-mode-single"
                  onClick={() => handleDisplayModeToggle("single")}
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                    activeDisplayMode === "single"
                      ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Display all language tracks aligned in 1 single unified parallel table"
                >
                  <TableIcon className="h-3 w-3" />
                  <span>1 Table</span>
                </button>
                <button
                  type="button"
                  data-testid="btn-table-mode-multiple"
                  onClick={() => handleDisplayModeToggle("multiple")}
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                    activeDisplayMode === "multiple"
                      ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Display separate synchronized tables for each language track"
                >
                  <LayoutGrid className="h-3 w-3" />
                  <span>Multiple Tables ({cols.length})</span>
                </button>
              </div>

              <button
                type="button"
                data-testid="toggle-table-display-mode-btn"
                onClick={() =>
                  handleDisplayModeToggle(activeDisplayMode === "single" ? "multiple" : "single")
                }
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-0.5 text-xs font-medium hover:bg-muted cursor-pointer"
                title="Toggle between 1 Table and Multiple Tables"
              >
                <LayoutGrid className="h-3 w-3" />
                <span>
                  {activeDisplayMode === "single" ? "Split to Multiple" : "Merge to 1 Table"}
                </span>
              </button>

              <span className="text-[11px] text-muted-foreground font-mono">
                {rows.length} {rows.length === 1 ? "sentence" : "sentences"}
              </span>
            </div>
          </div>
        )}
        {activeDisplayMode === "single" ? (
          <table
            data-testid="subtitles-table"
            onClick={(e) => {
              if (
                (e.target as HTMLElement).closest("button") ||
                (e.target as HTMLElement).closest("input") ||
                (e.target as HTMLElement).closest("select")
              ) {
                return;
              }
              onTablePlay?.();
            }}
            className="w-full border-collapse text-sm cursor-pointer"
          >
            <thead
              data-testid="subtitles-table-head"
              className="sticky top-0 z-20 bg-secondary/95 backdrop-blur-md shadow-xs border-b border-border/70"
            >
              <tr>
                <th
                  data-testid="table-header-index"
                  className={`w-14 min-w-[3.5rem] max-w-[3.5rem] px-2.5 py-2.5 text-center font-semibold text-xs tracking-wider uppercase text-muted-foreground ${
                    shouldFreezeColumns
                      ? "sticky left-0 z-30 bg-secondary/95 backdrop-blur-md shadow-[1px_0_0_0_rgba(0,0,0,0.1)]"
                      : ""
                  }`}
                  title="Sentence Running Index"
                >
                  #
                </th>
                <th
                  data-testid="table-header-time"
                  className={`w-28 min-w-[7rem] max-w-[7rem] px-3 py-2.5 text-left font-semibold text-xs tracking-wider uppercase text-muted-foreground ${
                    shouldFreezeColumns
                      ? "sticky left-14 z-30 bg-secondary/95 backdrop-blur-md shadow-[1px_0_0_0_rgba(0,0,0,0.1)]"
                      : ""
                  }`}
                >
                  Time
                </th>
                {cols.map((l, idx) => {
                  const isFirstCol = idx === 0;
                  const isDefault = l.code === baseLanguage || (isFirstCol && !baseLanguage);
                  const palette = getLanguageColorPalette(l.code);
                  return (
                    <th
                      key={`${l.code}-${idx}`}
                      data-testid={`table-header-col-${l.code}`}
                      data-lang-col={l.code}
                      className={`px-3 py-2.5 text-left font-semibold text-xs min-w-[12rem] border-b-2 ${palette.headerBorder} ${palette.headerBg} ${palette.headerText} ${
                        shouldFreezeColumns && isFirstCol
                          ? "sticky left-42 z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.15)]"
                          : ""
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 font-medium">
                          <span
                            className={`inline-block w-2 h-2 rounded-full ${palette.dot || palette.accentBar}`}
                            aria-hidden="true"
                          />
                          {subtitleColumnName(l.code, l.name)}
                          {l.isYouTubeOrJson && (
                            <span title="Parsed from YouTube subtitles or .json artifact">
                              <FileCode
                                className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400"
                                aria-label="YouTube subtitles or JSON artifact"
                                data-testid={`column-source-youtube-or-json-${l.code}`}
                              />
                            </span>
                          )}
                          {l.isOnDemandTranslation && (
                            <span title="On-demand translation">
                              <Sparkles
                                className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400"
                                aria-label="On-demand translation"
                                data-testid={`column-source-on-demand-${l.code}`}
                              />
                            </span>
                          )}
                          {l.isYouTubeTranslated && (
                            <span title="Translated by YouTube">
                              <Languages
                                className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400"
                                aria-label="YouTube translation"
                                data-testid={`youtube-translation-indicator-${l.code}`}
                              />
                            </span>
                          )}
                        </span>
                        {isDefault ? (
                          <span
                            data-testid={`table-col-default-badge-${l.code}`}
                            className="inline-flex items-center gap-1 rounded bg-primary/20 text-primary px-1.5 py-0.5 text-[10px] font-semibold tracking-tight"
                            title="Active Default Translation Source"
                          >
                            <Check className="h-2.5 w-2.5" />
                            <span>Default</span>
                          </span>
                        ) : onSelectBaseLanguage ? (
                          <button
                            type="button"
                            data-testid={`table-set-default-btn-${l.code}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectBaseLanguage(l.code);
                            }}
                            className="inline-flex items-center gap-1 rounded-md border border-border/80 bg-background/80 hover:bg-muted text-[10px] text-muted-foreground hover:text-foreground px-2 py-0.5 transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                            title={`Set ${l.name || l.code} as default translation source`}
                          >
                            Set Default
                          </button>
                        ) : null}
                        {getZeroKnowledgeInLang(l.code) && (
                          <span
                            data-testid={`table-col-zero-knowledge-badge-${l.code}`}
                            className="inline-flex items-center gap-1 rounded bg-amber-500/15 text-amber-500 dark:text-amber-400 border border-amber-500/30 px-1 py-0.2 text-[9px] font-semibold"
                            title={`Zero Knowledge Mode (${getPickWordStrategy(l.code)} word): Learns words rather than sentences`}
                          >
                            Words ({getPickWordStrategy(l.code)})
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody data-testid="subtitles-table-body">
              {effectiveDisplayedRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={Math.max(1, cols.length + 2)}
                    className="py-12 text-center text-sm text-muted-foreground"
                    data-testid="subtitles-table-empty-notice"
                  >
                    {displayedRows.length === 0
                      ? "No subtitles loaded for this video."
                      : `No subtitle records match current row criteria (max ${activeParserConfig.maxWordsPerSentence ?? 10} words).`}
                  </td>
                </tr>
              ) : (
                effectiveDisplayedRows.map((r, i) => {
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
                      blacklist={blacklist}
                      onSpeakCue={onSpeakCue}
                      freezeColumns={shouldFreezeColumns}
                    />
                  );
                })
              )}
            </tbody>
          </table>
        ) : (
          <div
            data-testid="subtitles-multiple-tables-container"
            className="flex flex-col gap-5 p-2"
          >
            {cols.length === 0 ? (
              <div
                data-testid="subtitles-multiple-tables-empty"
                className="py-12 text-center text-sm text-muted-foreground"
              >
                No subtitle columns selected or loaded.
              </div>
            ) : (
              cols.map((col, colIdx) => {
                const isFirstCol = colIdx === 0;
                const isDefault = col.code === baseLanguage || (isFirstCol && !baseLanguage);
                const palette = getLanguageColorPalette(col.code);
                return (
                  <div
                    key={`${col.code}-${colIdx}`}
                    data-testid={`subtitles-single-lang-card-${col.code}`}
                    className="rounded-xl border border-border/80 bg-card/60 shadow-xs overflow-hidden"
                  >
                    <div
                      className={`px-3 py-2 border-b flex items-center justify-between flex-wrap gap-2 ${palette.headerBg} ${palette.headerBorder}`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-block w-2.5 h-2.5 rounded-full ${palette.dot || palette.accentBar}`}
                          aria-hidden="true"
                        />
                        <span className={`font-semibold text-xs ${palette.headerText}`}>
                          {subtitleColumnName(col.code, col.name)}
                        </span>
                        {col.isYouTubeOrJson && (
                          <span title="Parsed from YouTube subtitles or .json artifact">
                            <FileCode
                              className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400"
                              aria-label="YouTube subtitles or JSON artifact"
                              data-testid={`column-source-youtube-or-json-${col.code}`}
                            />
                          </span>
                        )}
                        {col.isOnDemandTranslation && (
                          <span title="On-demand translation">
                            <Sparkles
                              className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400"
                              aria-label="On-demand translation"
                              data-testid={`column-source-on-demand-${col.code}`}
                            />
                          </span>
                        )}
                        {col.isYouTubeTranslated && (
                          <span title="Translated by YouTube">
                            <Languages
                              className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400"
                              aria-label="YouTube translation"
                              data-testid={`youtube-translation-indicator-${col.code}`}
                            />
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {isDefault ? (
                          <span
                            data-testid={`table-col-default-badge-${col.code}`}
                            className="inline-flex items-center gap-1 rounded bg-primary/20 text-primary px-1.5 py-0.5 text-[10px] font-semibold tracking-tight"
                            title="Active Default Translation Source"
                          >
                            <Check className="h-2.5 w-2.5" />
                            <span>Default</span>
                          </span>
                        ) : onSelectBaseLanguage ? (
                          <button
                            type="button"
                            data-testid={`table-set-default-btn-${col.code}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectBaseLanguage(col.code);
                            }}
                            className="inline-flex items-center gap-1 rounded-md border border-border/80 bg-background/80 hover:bg-muted text-[10px] text-muted-foreground hover:text-foreground px-2 py-0.5 transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                            title={`Set ${col.name || col.code} as default translation source`}
                          >
                            Set Default
                          </button>
                        ) : null}
                        {getZeroKnowledgeInLang(col.code) && (
                          <span
                            data-testid={`table-col-zero-knowledge-badge-${col.code}`}
                            className="inline-flex items-center gap-1 rounded bg-amber-500/15 text-amber-500 dark:text-amber-400 border border-amber-500/30 px-1 py-0.2 text-[9px] font-semibold"
                            title={`Zero Knowledge Mode (${getPickWordStrategy(col.code)} word): Learns words rather than sentences`}
                          >
                            Words ({getPickWordStrategy(col.code)})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table
                        data-testid={`subtitles-table-${col.code}`}
                        onClick={(e) => {
                          if (
                            (e.target as HTMLElement).closest("button") ||
                            (e.target as HTMLElement).closest("input") ||
                            (e.target as HTMLElement).closest("select")
                          ) {
                            return;
                          }
                          onTablePlay?.();
                        }}
                        className="w-full border-collapse text-sm cursor-pointer"
                      >
                        <thead className="sticky top-0 z-10 bg-secondary/95 backdrop-blur-md shadow-xs border-b border-border/70">
                          <tr>
                            <th
                              data-testid={`table-header-index-${col.code}`}
                              className="w-14 min-w-[3.5rem] max-w-[3.5rem] px-2.5 py-2 text-center font-semibold text-xs tracking-wider uppercase text-muted-foreground"
                              title="Sentence Running Index"
                            >
                              #
                            </th>
                            <th
                              data-testid={`table-header-time-${col.code}`}
                              className="w-28 min-w-[7rem] max-w-[7rem] px-3 py-2 text-left font-semibold text-xs tracking-wider uppercase text-muted-foreground"
                            >
                              Time
                            </th>
                            <th
                              data-testid={`table-header-col-${col.code}`}
                              data-lang-col={col.code}
                              className="px-3 py-2 text-left font-semibold text-xs"
                            >
                              {subtitleColumnName(col.code, col.name)}
                            </th>
                          </tr>
                        </thead>
                        <tbody data-testid={`subtitles-table-body-${col.code}`}>
                          {effectiveDisplayedRows.length === 0 ? (
                            <tr>
                              <td
                                colSpan={3}
                                className="py-8 text-center text-sm text-muted-foreground"
                                data-testid={`subtitles-table-empty-notice-${col.code}`}
                              >
                                {displayedRows.length === 0
                                  ? "No subtitles loaded for this video."
                                  : `No subtitle records match current row criteria (max ${activeParserConfig.maxWordsPerSentence ?? 10} words).`}
                              </td>
                            </tr>
                          ) : (
                            effectiveDisplayedRows.map((r, i) => {
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
                                  cols={[col]}
                                  baseLanguage={baseLanguage}
                                  speechProgress={speechProgress}
                                  tracks={tracks}
                                  onSeek={onSeek}
                                  spokenLangs={spokenLangs}
                                  ttsRatios={ttsRatios}
                                  primaryTtsLang={primaryTtsLang}
                                  blacklist={blacklist}
                                  onSpeakCue={onSpeakCue}
                                  freezeColumns={false}
                                />
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </>
  );
}
