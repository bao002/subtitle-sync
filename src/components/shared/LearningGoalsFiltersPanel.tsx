import React, { useMemo, useState } from "react";
import {
  Filter,
  Sliders,
  CheckCircle2,
  Minus,
  Plus,
  Languages,
  RotateCcw,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { type Row } from "@/lib/subtitles";
import {
  computeLanguageCriteriaStats,
  computeOverallCriteriaStats,
  getEligibleLanguageRecords,
} from "@/utils/newSubtitlesParser";
import { SUPPORTED_LANGUAGES_CATALOG } from "@/utils/appSettings";

export const MAX_WORDS_OPTIONS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 25, 30, 35, 40, 50,
];

export interface LearningGoalsFiltersPanelProps {
  maxWords: number;
  onMaxWordsChange: (val: number) => void;
  skipIncompleteSentences: boolean;
  onSkipIncompleteSentencesChange: (val: boolean) => void;
  /** Per-language max words allowed for translation: { [langCode]: maxWords } */
  languageMaxWords?: Record<string, number>;
  /** Callback when max words allowed for a specific language is updated */
  onLanguageMaxWordsChange?: (langCode: string, val: number | undefined) => void;
  /** Per-language complete sentence filter: { [langCode]: boolean } */
  languageSkipIncomplete?: Record<string, boolean>;
  /** Callback when complete sentence filter for a specific language is updated */
  onLanguageSkipIncompleteChange?: (langCode: string, val: boolean | undefined) => void;
  /** Optional callback to reset all per-language row criteria to defaults */
  onResetAllLanguageCriteria?: () => void;
  /** Available or approved learning languages */
  learningLanguages?: Array<{ code: string; name: string }>;
  /** Subtitle rows used to calculate live eligible/valid record statistics per condition */
  rows?: Row[];
  /** Base/default subtitle language code used as fallback text when checking translations */
  baseLanguage?: string;
  minWords?: number;
  maxWordsLimit?: number;
  compact?: boolean;
  className?: string;
}

/**
 * Shared Learning Goals Subtitle Row Filters Panel
 * Used with 100% parity across both Advanced Mode (Stage 2 Learning Goals) and Beginner Mode.
 * Allows user to:
 * 1. Limit max words per subtitle row via a responsive slider (skipping rows exceeding word count).
 * 2. Set per-language max words allowed for translation (skipping translation for languages exceeding limit).
 * 3. Toggle skipping incomplete sentences (records not ending with ',', '.', '?', '!').
 */
export const LearningGoalsFiltersPanel: React.FC<LearningGoalsFiltersPanelProps> = React.memo(
  ({
    maxWords,
    onMaxWordsChange,
    skipIncompleteSentences,
    onSkipIncompleteSentencesChange,
    languageMaxWords = {},
    onLanguageMaxWordsChange,
    languageSkipIncomplete = {},
    onLanguageSkipIncompleteChange,
    onResetAllLanguageCriteria,
    learningLanguages = [],
    rows,
    baseLanguage,
    minWords = 1,
    maxWordsLimit = 50,
    compact = false,
    className = "",
  }) => {
    const safeMaxWords = Math.max(
      minWords,
      Math.min(maxWordsLimit, typeof maxWords === "number" && !isNaN(maxWords) ? maxWords : 10),
    );

    const uniqueLearningLanguages = useMemo(() => {
      const seen = new Set<string>();
      const list: Array<{ code: string; name: string }> = [];

      for (const l of learningLanguages) {
        if (!l.code || seen.has(l.code)) continue;
        seen.add(l.code);
        list.push(l);
      }

      const allOverrideCodes = new Set([
        ...Object.keys(languageMaxWords),
        ...Object.keys(languageSkipIncomplete),
      ]);
      for (const code of allOverrideCodes) {
        if (!code || seen.has(code)) continue;
        seen.add(code);
        const catalogMatch = SUPPORTED_LANGUAGES_CATALOG.find((c) => c.code === code);
        list.push({
          code,
          name: catalogMatch ? catalogMatch.name : code.toUpperCase(),
        });
      }

      return list;
    }, [learningLanguages, languageMaxWords, languageSkipIncomplete]);

    const activeOverridesCount = useMemo(() => {
      let count = 0;
      uniqueLearningLanguages.forEach((l) => {
        const hasWordOverride =
          typeof languageMaxWords[l.code] === "number" && languageMaxWords[l.code] > 0;
        const hasPunctOverride = typeof languageSkipIncomplete[l.code] === "boolean";
        if (hasWordOverride || hasPunctOverride) count++;
      });
      return count;
    }, [uniqueLearningLanguages, languageMaxWords, languageSkipIncomplete]);

    const effectiveDefaultLang = baseLanguage || uniqueLearningLanguages[0]?.code || "";
    const [expandedLangs, setExpandedLangs] = useState<Record<string, boolean>>({});

    const toggleExpandLang = (langCode: string) => {
      setExpandedLangs((prev) => ({
        ...prev,
        [langCode]: !prev[langCode],
      }));
    };

    const overallStats = useMemo(() => {
      if (!rows || rows.length === 0) return null;
      return computeOverallCriteriaStats(
        rows,
        effectiveDefaultLang,
        safeMaxWords,
        skipIncompleteSentences,
        languageMaxWords,
        languageSkipIncomplete,
      );
    }, [
      rows,
      effectiveDefaultLang,
      safeMaxWords,
      skipIncompleteSentences,
      languageMaxWords,
      languageSkipIncomplete,
    ]);

    const handleResetAll = () => {
      if (onResetAllLanguageCriteria) {
        onResetAllLanguageCriteria();
      } else {
        uniqueLearningLanguages.forEach((l) => {
          if (onLanguageMaxWordsChange) onLanguageMaxWordsChange(l.code, undefined);
          if (onLanguageSkipIncompleteChange) onLanguageSkipIncompleteChange(l.code, undefined);
        });
      }
    };

    const handleDecrement = (e: React.MouseEvent) => {
      e.preventDefault();
      onMaxWordsChange(Math.max(minWords, safeMaxWords - 1));
    };

    const handleIncrement = (e: React.MouseEvent) => {
      e.preventDefault();
      onMaxWordsChange(Math.min(maxWordsLimit, safeMaxWords + 1));
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseInt(e.target.value, 10);
      if (!isNaN(val)) {
        onMaxWordsChange(Math.max(minWords, Math.min(maxWordsLimit, val)));
      }
    };

    return (
      <div
        id="learning-goals-filters-panel"
        data-testid="learning-goals-filters-panel"
        className={`rounded-lg border border-border bg-card/60 p-3 space-y-3 ${className}`}
      >
        <div className="flex items-center justify-between border-b border-border/60 pb-2 gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary shrink-0" />
            <h4 className="font-semibold text-xs text-foreground">
              Learning Goals: Subtitle Row Filters
            </h4>
          </div>
          <div className="flex items-center gap-2">
            {overallStats && (
              <span
                data-testid="learning-goals-overall-stats"
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded border font-semibold ${
                  overallStats.eligible === 0
                    ? "bg-destructive/10 text-destructive border-destructive/25"
                    : overallStats.eligible < overallStats.total
                      ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25"
                      : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25"
                }`}
                title={`${overallStats.eligible} of ${overallStats.total} subtitle records are eligible/valid based on all active conditions (${overallStats.percentage}%)`}
              >
                {overallStats.eligible}/{overallStats.total} valid ({overallStats.percentage}%)
              </span>
            )}
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
              Row Criteria
            </span>
          </div>
        </div>

        {/* 1. Max Words Per Subtitle Row Slider */}
        <div
          id="learning-goals-max-words-section"
          data-testid="learning-goals-max-words-section"
          className="space-y-2 bg-background/70 p-2.5 rounded-md border border-border/70"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <Sliders className="h-3.5 w-3.5 text-primary shrink-0" />
              <label
                htmlFor="learning-goals-max-words-input"
                data-testid="learning-goals-max-words-label"
                className="text-xs font-medium text-foreground cursor-pointer select-none"
              >
                Max Words Per Subtitle Row:
              </label>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
              {/* Dropdown list for selecting max words */}
              <select
                id="learning-goals-max-words-dropdown"
                data-testid="learning-goals-max-words-dropdown"
                value={safeMaxWords}
                onChange={(e) => onMaxWordsChange(parseInt(e.target.value, 10))}
                aria-label="Select max words per subtitle row"
                className="h-6 rounded border border-input bg-background px-1.5 font-mono text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
              >
                {MAX_WORDS_OPTIONS.map((val) => (
                  <option key={val} value={val}>
                    {val} words {val === 10 ? "(Default)" : ""}
                  </option>
                ))}
              </select>
              <button
                type="button"
                data-testid="learning-goals-decrement-btn"
                onClick={handleDecrement}
                disabled={safeMaxWords <= minWords}
                aria-label="Decrease max words"
                className="flex h-6 w-5 items-center justify-center rounded border border-input text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Minus className="h-2.5 w-2.5" />
              </button>
              <input
                id="learning-goals-max-words-input"
                data-testid="learning-goals-max-words-input"
                type="number"
                min={minWords}
                max={maxWordsLimit}
                value={safeMaxWords}
                onChange={handleInputChange}
                aria-label="Max words per subtitle row"
                className="h-6 w-10 text-center font-mono text-xs font-semibold rounded border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <button
                type="button"
                data-testid="learning-goals-increment-btn"
                onClick={handleIncrement}
                disabled={safeMaxWords >= maxWordsLimit}
                aria-label="Increase max words"
                className="flex h-6 w-5 items-center justify-center rounded border border-input text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="h-2.5 w-2.5" />
              </button>
              <span
                data-testid="learning-goals-max-words-value"
                className="text-[11px] font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 ml-1"
              >
                {safeMaxWords} words
              </span>
            </div>
          </div>

          <div className="pt-1 px-1">
            <Slider
              data-testid="learning-goals-max-words-slider"
              min={minWords}
              max={maxWordsLimit}
              step={1}
              value={[safeMaxWords]}
              onValueChange={([val]) => {
                if (typeof val === "number") {
                  onMaxWordsChange(val);
                }
              }}
              className="w-full cursor-pointer py-1"
              aria-label="Max words per row slider"
            />
          </div>

          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Limits row length by skipping any subtitle record containing more than{" "}
            <strong className="text-foreground font-mono">{safeMaxWords}</strong> words.
          </p>
        </div>

        {/* 2. Per-Language Max Words Allowed for Translation */}
        {uniqueLearningLanguages.length > 0 && onLanguageMaxWordsChange && (
          <div
            id="learning-goals-per-language-max-words-section"
            data-testid="learning-goals-per-language-max-words-section"
            className="space-y-2 bg-background/70 p-2.5 rounded-md border border-border/70"
          >
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 min-w-0">
                <Languages className="h-3.5 w-3.5 text-primary shrink-0" />
                <span
                  data-testid="learning-goals-per-language-label"
                  className="text-xs font-semibold text-foreground select-none"
                >
                  Per-Language Max Words &amp; Row Criteria:
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  data-testid="learning-goals-active-overrides-count"
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    activeOverridesCount > 0
                      ? "bg-primary/15 text-primary font-bold border border-primary/20"
                      : "text-muted-foreground"
                  }`}
                >
                  {activeOverridesCount > 0
                    ? `${activeOverridesCount} active override(s)`
                    : `Inheriting global (${safeMaxWords}w)`}
                </span>
                {activeOverridesCount > 0 && (
                  <button
                    type="button"
                    data-testid="learning-goals-reset-all-lang-criteria-btn"
                    onClick={handleResetAll}
                    className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 px-1.5 py-0.5 rounded border border-border/60 hover:bg-muted/50 cursor-pointer transition-colors"
                    title="Reset all per-language criteria to global defaults"
                  >
                    <RotateCcw className="h-2.5 w-2.5" />
                    <span>Reset All</span>
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              {uniqueLearningLanguages.map((lang, idx) => {
                const customVal = languageMaxWords[lang.code];
                const hasWordOverride = typeof customVal === "number" && customVal > 0;
                const effectiveVal = hasWordOverride ? customVal : safeMaxWords;
                const hasPunctOverride = typeof languageSkipIncomplete[lang.code] === "boolean";
                const effectivePunct = hasPunctOverride
                  ? Boolean(languageSkipIncomplete[lang.code])
                  : Boolean(skipIncompleteSentences);
                const isLangActive = hasWordOverride || hasPunctOverride;
                const langStats =
                  rows && rows.length > 0
                    ? computeLanguageCriteriaStats(
                        rows,
                        lang.code,
                        effectiveDefaultLang,
                        effectiveVal,
                        effectivePunct,
                      )
                    : null;
                const hasRecordsToInspect = Boolean(rows && rows.length > 0);
                const isExpanded = Boolean(expandedLangs[lang.code]) && hasRecordsToInspect;
                const eligibleRecords = isExpanded
                  ? getEligibleLanguageRecords(
                      rows || [],
                      lang.code,
                      effectiveDefaultLang,
                      effectiveVal,
                      effectivePunct,
                    )
                  : [];

                return (
                  <div
                    key={`${lang.code}-${idx}`}
                    data-testid={`learning-goals-lang-row-criteria-${lang.code}`}
                    className="rounded-md bg-card/60 border border-border/60 text-xs overflow-hidden"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2">
                      <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                        {hasRecordsToInspect ? (
                          <button
                            type="button"
                            data-testid={`learning-goals-lang-toggle-records-${lang.code}`}
                            onClick={() => toggleExpandLang(lang.code)}
                            aria-expanded={isExpanded}
                            aria-label={`${isExpanded ? "Collapse" : "Unfold"} eligible records for ${lang.name}`}
                            title="Click to unfold eligible records and matching default language text"
                            className="inline-flex items-center gap-1.5 text-left rounded px-1 py-0.5 -ml-1 hover:bg-muted/60 transition-colors cursor-pointer"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-3.5 w-3.5 text-primary shrink-0" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            )}
                            <span className="font-medium text-foreground">{lang.name}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              ({lang.code})
                            </span>
                            {langStats && (
                              <span
                                data-testid={`learning-goals-lang-stats-${lang.code}`}
                                className={`text-[10px] font-mono px-1.5 py-0.5 rounded border font-semibold ${
                                  langStats.eligible === 0
                                    ? "bg-destructive/10 text-destructive border-destructive/25"
                                    : langStats.eligible < langStats.total
                                      ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25"
                                      : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25"
                                }`}
                                title={`${langStats.eligible} of ${langStats.total} records valid/eligible for ${lang.name} (${langStats.percentage}%)`}
                              >
                                {langStats.eligible}/{langStats.total} valid ({langStats.percentage}
                                %)
                              </span>
                            )}
                          </button>
                        ) : (
                          <>
                            <span className="font-medium text-foreground">{lang.name}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              ({lang.code})
                            </span>
                            {Array.isArray(rows) && (
                              <span
                                data-testid={`learning-goals-lang-stats-empty-${lang.code}`}
                                className="text-[10px] font-mono text-muted-foreground/70 px-1"
                              >
                                0 records
                              </span>
                            )}
                          </>
                        )}
                        {isLangActive ? (
                          <span
                            data-testid={`learning-goals-lang-active-status-${lang.code}`}
                            className="text-[9px] font-mono bg-primary/15 text-primary border border-primary/25 px-1.5 py-0.5 rounded font-semibold inline-flex items-center gap-1"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-primary inline-block" />
                            <span>
                              Active: {effectiveVal}w
                              {hasPunctOverride ? (effectivePunct ? " • punct" : " • all") : ""}
                            </span>
                          </span>
                        ) : (
                          <span
                            data-testid={`learning-goals-lang-active-status-${lang.code}`}
                            className="text-[9px] font-mono text-muted-foreground/80 px-1"
                          >
                            Default ({safeMaxWords}w)
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {/* Per-language complete sentence criteria toggle */}
                        {onLanguageSkipIncompleteChange && (
                          <div className="flex items-center gap-1 mr-1">
                            <label
                              htmlFor={`lang-complete-toggle-${lang.code}`}
                              className="text-[10px] text-muted-foreground cursor-pointer select-none"
                            >
                              Punct:
                            </label>
                            <Switch
                              id={`lang-complete-toggle-${lang.code}`}
                              data-testid={`learning-goals-lang-complete-switch-${lang.code}`}
                              checked={effectivePunct}
                              onCheckedChange={(checked) =>
                                onLanguageSkipIncompleteChange(lang.code, checked)
                              }
                              aria-label={`Complete sentence filter for ${lang.name}`}
                              className="scale-75 origin-left"
                            />
                          </div>
                        )}

                        {/* Word limit decrement, input, increment */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            data-testid={`learning-goals-lang-decrement-${lang.code}`}
                            onClick={() => {
                              const nextVal = Math.max(minWords, effectiveVal - 1);
                              onLanguageMaxWordsChange(lang.code, nextVal);
                            }}
                            disabled={effectiveVal <= minWords}
                            aria-label={`Decrease max words for ${lang.name}`}
                            className="flex h-5 w-5 items-center justify-center rounded border border-input text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-40 transition-colors"
                          >
                            <Minus className="h-2.5 w-2.5" />
                          </button>
                          <input
                            data-testid={`learning-goals-lang-max-words-input-${lang.code}`}
                            type="number"
                            min={minWords}
                            max={maxWordsLimit}
                            value={effectiveVal}
                            onChange={(e) => {
                              const parsed = parseInt(e.target.value, 10);
                              if (!isNaN(parsed)) {
                                onLanguageMaxWordsChange(
                                  lang.code,
                                  Math.max(minWords, Math.min(maxWordsLimit, parsed)),
                                );
                              }
                            }}
                            aria-label={`Max words for ${lang.name}`}
                            className="h-5 w-9 text-center font-mono text-xs font-semibold rounded border border-input bg-background text-foreground focus:outline-none"
                          />
                          <button
                            type="button"
                            data-testid={`learning-goals-lang-increment-${lang.code}`}
                            onClick={() => {
                              const nextVal = Math.min(maxWordsLimit, effectiveVal + 1);
                              onLanguageMaxWordsChange(lang.code, nextVal);
                            }}
                            disabled={effectiveVal >= maxWordsLimit}
                            aria-label={`Increase max words for ${lang.name}`}
                            className="flex h-5 w-5 items-center justify-center rounded border border-input text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-40 transition-colors"
                          >
                            <Plus className="h-2.5 w-2.5" />
                          </button>

                          {isLangActive && (
                            <button
                              type="button"
                              data-testid={`learning-goals-lang-reset-${lang.code}`}
                              onClick={() => {
                                onLanguageMaxWordsChange(lang.code, undefined);
                                if (onLanguageSkipIncompleteChange) {
                                  onLanguageSkipIncompleteChange(lang.code, undefined);
                                }
                              }}
                              className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-0.5 px-1 py-0.5 rounded border border-border/40 hover:bg-muted/40 ml-1 cursor-pointer"
                              title={`Reset ${lang.name} to global defaults`}
                            >
                              <RotateCcw className="h-2.5 w-2.5" />
                              <span>Reset</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div
                        data-testid={`learning-goals-lang-eligible-records-${lang.code}`}
                        className="border-t border-border/60 bg-background/60 px-2 pb-2 pt-1.5"
                      >
                        {eligibleRecords.length === 0 ? (
                          <p
                            data-testid={`learning-goals-lang-eligible-empty-${lang.code}`}
                            className="py-2 text-center text-[11px] text-muted-foreground"
                          >
                            No eligible records match the condition ({effectiveVal}w max
                            {effectivePunct ? ", complete sentences" : ""}).
                          </p>
                        ) : (
                          <div className="max-h-52 overflow-y-auto rounded border border-border/50">
                            <table
                              data-testid={`learning-goals-lang-eligible-table-${lang.code}`}
                              className="w-full border-collapse text-[11px]"
                            >
                              <thead className="sticky top-0 bg-muted/90 backdrop-blur-xs border-b border-border/60 text-[10px] uppercase tracking-wider text-muted-foreground">
                                <tr>
                                  <th className="px-2 py-1 text-left font-semibold w-1/2">
                                    {lang.name} ({lang.code})
                                  </th>
                                  <th className="px-2 py-1 text-left font-semibold w-1/2 border-l border-border/40">
                                    Default ({(effectiveDefaultLang || "base").toUpperCase()})
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border/40">
                                {eligibleRecords.map((rec) => (
                                  <tr
                                    key={rec.index}
                                    data-testid={`learning-goals-lang-eligible-row-${lang.code}-${rec.index}`}
                                    className="hover:bg-muted/30 transition-colors align-top"
                                  >
                                    <td className="px-2 py-1 text-foreground">
                                      <span className="text-[9px] font-mono text-muted-foreground mr-1">
                                        #{rec.index + 1}
                                      </span>
                                      {rec.languageText ? (
                                        <span>{rec.languageText}</span>
                                      ) : (
                                        <span className="italic text-muted-foreground">
                                          {rec.evaluatedText} (default fallback)
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-2 py-1 text-muted-foreground border-l border-border/40">
                                      {rec.defaultLanguageText || "—"}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed pt-0.5">
              Sentences exceeding a language's word limit are excluded from translation and
              narration for that language.
            </p>
          </div>
        )}

        {/* 3. Complete Sentence Filter Control */}
        <div
          id="learning-goals-complete-sentence-section"
          data-testid="learning-goals-complete-sentence-section"
          className="flex items-center justify-between gap-3 p-2.5 rounded-md bg-background/70 border border-border/70"
        >
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
              <label
                htmlFor="learning-goals-skip-incomplete-switch"
                data-testid="learning-goals-skip-incomplete-label"
                className="text-xs font-medium text-foreground cursor-pointer select-none"
              >
                Complete Sentences Only
              </label>
              <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-bold border border-border">
                Ends with , . ? !
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Skip any record that does not end with terminal punctuation (
              <code className="text-primary font-mono text-[10px]">,</code>,{" "}
              <code className="text-primary font-mono text-[10px]">.</code>,{" "}
              <code className="text-primary font-mono text-[10px]">?</code>,{" "}
              <code className="text-primary font-mono text-[10px]">!</code>).
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <select
              id="learning-goals-complete-sentence-dropdown"
              data-testid="learning-goals-complete-sentence-dropdown"
              value={skipIncompleteSentences ? "complete" : "all"}
              onChange={(e) => onSkipIncompleteSentencesChange(e.target.value === "complete")}
              aria-label="Sentence completeness criteria dropdown"
              className="h-6 rounded border border-input bg-background px-1.5 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
            >
              <option value="all">All Sentences</option>
              <option value="complete">Complete Sentences Only</option>
            </select>
            <Switch
              id="learning-goals-skip-incomplete-switch"
              data-testid="learning-goals-skip-incomplete-switch"
              checked={skipIncompleteSentences}
              onCheckedChange={onSkipIncompleteSentencesChange}
              aria-label="Skip incomplete sentences"
              className="shrink-0"
            />
          </div>
        </div>
      </div>
    );
  },
);
