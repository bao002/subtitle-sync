import React, { useState, useMemo } from "react";
import {
  Check,
  Subtitles,
  Sparkles,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Crown,
  RotateCcw,
} from "lucide-react";
import { LANGS, type Json3 } from "@/lib/subtitles";
import {
  analyzeDefaultSubtitlesPunctuation,
  resolveKingOfComma,
  type SubtitlePunctuationStats,
} from "@/utils/subtitlePunctuationStats";
import { generateMotherTongueFromKingOfComma } from "@/utils/defaultLanguageManager";
import { useIsElementEnabled } from "@/utils/performanceModeManager";

export interface DetectedSubtitleTrack {
  lang: string;
  langName: string;
  json: Json3;
  rawData?: string;
  url?: string;
  timestamp?: number;
  cuesCount?: number;
}

export interface SwitchableDefaultSubtitlesBarProps {
  videoId: string;
  defaultLanguages: string[];
  activeLanguage: string;
  onSelectLanguage: (langCode: string) => void;
  motherTongueLanguage?: string;
  onResetToKingOfComma?: () => void;
  tracks?: Record<string, Json3> | null;
  detectedTracks?: Record<string, DetectedSubtitleTrack>;
  className?: string;
  isPlayground?: boolean;
  defaultExpandedStats?: boolean;
}

function sameLanguageCode(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  const na = a === "iw" ? "he" : a.toLowerCase();
  const nb = b === "iw" ? "he" : b.toLowerCase();
  return na === nb;
}

/**
 * SwitchableDefaultSubtitlesBar
 *
 * Displays the switchable list of default subtitle languages fetched from YouTube's API
 * around the video player component (both on the main video player and in the playground).
 *
 * Features:
 * - Defines `king-of-comma`: identifies the language with the highest count of `,` punctuation signs,
 *   which is selected automatically as the base language for translation.
 * - Defines `mother-tongue-language`: acts as the `default-language` and is generated automatically
 *   based on `king-of-comma`.
 * - Exposes full punctuation counting statistics for all default subtitle candidates.
 */
export const SwitchableDefaultSubtitlesBar: React.FC<SwitchableDefaultSubtitlesBarProps> = ({
  videoId: _videoId,
  defaultLanguages,
  activeLanguage,
  onSelectLanguage,
  motherTongueLanguage,
  onResetToKingOfComma,
  tracks,
  detectedTracks,
  className = "",
  isPlayground = false,
  defaultExpandedStats = false,
}) => {
  const [showStats, setShowStats] = useState<boolean>(defaultExpandedStats);
  const statsEnabled = useIsElementEnabled("default_subtitles_stats");

  // Deduplicate and merge defaultLanguages with non-empty fetched tracks
  const uniqueLangs = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    const appendIfValid = (code: string) => {
      if (!code || typeof code !== "string") return;
      const key = code.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      out.push(code);
    };
    defaultLanguages.forEach(appendIfValid);
    if (tracks) {
      Object.keys(tracks).forEach((code) => {
        const t = tracks[code];
        const hasCues =
          (t?.events?.length || 0) > 0 || (Array.isArray(t) && (t as unknown[]).length > 0);
        if (hasCues) appendIfValid(code);
      });
    }
    return out;
  }, [defaultLanguages, tracks]);

  // Calculate punctuation statistics and resolve `king-of-comma`
  const { statsMap, recommendedLang, kingOfCommaLang, maxCommas } = useMemo(() => {
    const analysis = analyzeDefaultSubtitlesPunctuation(uniqueLangs, tracks, activeLanguage);
    if (analysis.kingOfCommaLang) return analysis;
    const fallback = resolveKingOfComma(tracks, uniqueLangs, activeLanguage);
    return {
      statsMap: Object.keys(analysis.statsMap).length > 0 ? analysis.statsMap : fallback.statsMap,
      recommendedLang: fallback.kingOfCommaLang,
      kingOfCommaLang: fallback.kingOfCommaLang,
      maxCommas: fallback.maxCommas,
    };
  }, [uniqueLangs, tracks, activeLanguage]);

  // Generate `mother-tongue-language` from `king-of-comma`, acting as `default-language`
  const effectiveMotherTongue = useMemo(() => {
    if (motherTongueLanguage && motherTongueLanguage.trim()) {
      return motherTongueLanguage.trim();
    }
    return generateMotherTongueFromKingOfComma(kingOfCommaLang, activeLanguage);
  }, [motherTongueLanguage, kingOfCommaLang, activeLanguage]);

  const isManualOverrideActive = Boolean(
    kingOfCommaLang &&
    maxCommas > 0 &&
    activeLanguage &&
    !sameLanguageCode(activeLanguage, kingOfCommaLang),
  );

  const getDisplayName = (langCode: string) => {
    const normalizedCode = langCode === "iw" ? "he" : langCode;
    const meta = LANGS.find((l) => l.code === langCode || l.code === normalizedCode);
    return meta?.name || langCode.toUpperCase();
  };

  return (
    <div
      data-testid="switchable-default-subtitles-bar"
      id="switchable-default-subtitles-bar"
      data-king-of-comma={kingOfCommaLang || ""}
      data-mother-tongue-language={effectiveMotherTongue || ""}
      className={`flex flex-col gap-2 px-3 py-2 text-xs border border-border/70 bg-card/95 rounded-xl shadow-xs backdrop-blur-md studio-card-elevated ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
            <Subtitles className="h-3.5 w-3.5" />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-foreground tracking-tight">
              Default Subtitles ({uniqueLangs.length}):
            </span>

            {kingOfCommaLang && maxCommas > 0 && (
              <span
                data-testid="king-of-comma-summary"
                title={`king-of-comma: ${getDisplayName(kingOfCommaLang)} (${kingOfCommaLang}) has the most ',' commas (${maxCommas}) and is selected automatically as base for translation.`}
                className="inline-flex items-center gap-1 rounded-md border border-amber-500/40 bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300"
              >
                <Crown className="h-3 w-3 text-amber-500 shrink-0" />
                <span>
                  King of Comma: {getDisplayName(kingOfCommaLang)} ({kingOfCommaLang} · {maxCommas}
                  ,)
                </span>
              </span>
            )}

            {effectiveMotherTongue && (
              <span
                data-testid="mother-tongue-language-badge"
                title="mother-tongue-language acts as default-language and is generated based on king-of-comma."
                className="inline-flex items-center gap-1 rounded-md border border-primary/35 bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary"
              >
                <span>
                  Mother Tongue (Default): {getDisplayName(effectiveMotherTongue)} (
                  {effectiveMotherTongue})
                </span>
              </span>
            )}

            {isManualOverrideActive && onResetToKingOfComma && (
              <button
                type="button"
                data-testid="reset-to-king-of-comma-btn"
                onClick={onResetToKingOfComma}
                title={`Reset translation base & mother-tongue-language back to King of Comma (${kingOfCommaLang})`}
                className="inline-flex items-center gap-1 rounded-md border border-amber-500/50 bg-background hover:bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300 transition-colors cursor-pointer"
              >
                <RotateCcw className="h-2.5 w-2.5 shrink-0" />
                <span>Auto: King of Comma</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div
            data-testid="switchable-default-subtitles-list"
            className="flex flex-wrap items-center gap-1.5"
          >
            {uniqueLangs.length > 0 ? (
              uniqueLangs.map((langCode, idx) => {
                const normalizedCode = langCode === "iw" ? "he" : langCode;
                const isActive = sameLanguageCode(activeLanguage, langCode);
                const isMotherTongue = sameLanguageCode(effectiveMotherTongue, langCode);
                const displayName = getDisplayName(langCode);

                // Check cues count if available
                const track = tracks?.[langCode] || tracks?.[normalizedCode];
                const detected = detectedTracks?.[langCode] || detectedTracks?.[normalizedCode];
                const stats = statsMap[langCode] ||
                  statsMap[normalizedCode] || {
                    commas: 0,
                    periods: 0,
                    questionMarks: 0,
                    exclamationMarks: 0,
                    colons: 0,
                    semicolons: 0,
                    totalPunctuation: 0,
                    cuesCount: 0,
                    wordsCount: 0,
                    langCode,
                  };

                const cuesCount =
                  track?.events?.length ||
                  (Array.isArray(track) ? (track as unknown as unknown[]).length : 0) ||
                  detected?.cuesCount ||
                  stats.cuesCount ||
                  0;

                const isRecommended = sameLanguageCode(langCode, recommendedLang) && maxCommas > 0;

                return (
                  <button
                    key={`${langCode}-${idx}`}
                    type="button"
                    data-testid={`default-subtitle-lang-btn-${langCode}`}
                    data-king-of-comma={isRecommended ? "true" : "false"}
                    data-mother-tongue={isMotherTongue ? "true" : "false"}
                    aria-pressed={isActive}
                    onClick={() => onSelectLanguage(langCode)}
                    title={`Switch active default subtitle to ${displayName} (${langCode}). ${
                      isRecommended
                        ? `King of Comma (${stats.commas} ",") — auto base for translation.`
                        : ""
                    } Punctuation: ${stats.commas} commas, ${stats.periods} periods.`}
                    className={`group relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-all cursor-pointer ${
                      isActive
                        ? "border-primary bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/40 font-semibold"
                        : isRecommended
                          ? "border-amber-500/60 bg-amber-500/10 hover:bg-amber-500/15 text-foreground hover:border-amber-500"
                          : "border-border bg-background/80 hover:bg-muted text-foreground hover:border-primary/50"
                    }`}
                  >
                    {isActive && <Check className="h-3 w-3 shrink-0 stroke-[2.5]" />}

                    {/* King of Comma Icon next to default subtitle with highest comma count */}
                    {isRecommended && (
                      <span
                        data-testid="recommended-default-subtitle-icon"
                        className="inline-flex items-center gap-0.5 text-amber-500 dark:text-amber-300 shrink-0"
                        title={`King of Comma: Most commas (${stats.commas}) — auto base for translation`}
                      >
                        <Sparkles className="h-3.5 w-3.5 fill-amber-400 text-amber-500 animate-pulse" />
                        <span
                          data-testid={`king-of-comma-badge-${langCode}`}
                          className={`text-[9px] font-bold uppercase tracking-wide ${
                            isActive ? "text-amber-200" : "text-amber-700 dark:text-amber-300"
                          }`}
                        >
                          King of ,
                        </span>
                      </span>
                    )}

                    <span>{displayName}</span>
                    <span
                      className={`text-[10px] font-mono ${
                        isActive ? "text-primary-foreground/80" : "text-muted-foreground"
                      }`}
                    >
                      ({langCode})
                    </span>

                    {/* Comma Count Badge */}
                    {stats.commas > 0 && (
                      <span
                        data-testid={`default-subtitle-comma-count-${langCode}`}
                        className={`text-[9px] px-1 py-0.2 rounded font-mono font-medium ${
                          isRecommended
                            ? "bg-amber-500/30 text-amber-800 dark:text-amber-200 font-bold"
                            : isActive
                              ? "bg-black/25 text-white"
                              : "bg-muted text-muted-foreground"
                        }`}
                        title={`${stats.commas} comma (,) marks`}
                      >
                        ,{stats.commas}
                      </span>
                    )}

                    {cuesCount > 0 && (
                      <span
                        className={`text-[9px] px-1 py-0.2 rounded font-mono font-medium ${
                          isActive
                            ? "bg-black/20 text-white"
                            : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {cuesCount}
                      </span>
                    )}

                    {isActive && (
                      <span
                        data-testid="active-default-subtitle-indicator"
                        className="ml-0.5 inline-block size-1.5 rounded-full bg-white dark:bg-white animate-pulse"
                      />
                    )}
                  </button>
                );
              })
            ) : (
              <div
                data-testid="no-default-subtitles-indicator"
                className="flex items-center gap-1.5 text-[11px] text-muted-foreground italic py-0.5"
              >
                <Sparkles className="h-3 w-3 text-amber-500 shrink-0" />
                <span>
                  {isPlayground
                    ? "Choose another subtitle in YouTube player to add here"
                    : "Choose another subtitle from the video menu or CC button"}
                </span>
              </div>
            )}
          </div>

          {/* Toggle Punctuation Statistics Button (Hidden by default in Fast Mode) */}
          {statsEnabled && uniqueLangs.length > 0 && (
            <button
              type="button"
              data-testid="toggle-punctuation-stats-btn"
              onClick={() => setShowStats((prev) => !prev)}
              aria-expanded={showStats}
              title="Expose punctuation counting statistics for all default subtitles"
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border transition-colors cursor-pointer ${
                showStats
                  ? "bg-primary/10 border-primary/40 text-primary"
                  : "bg-muted/50 border-border/80 hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <BarChart3 className="h-3 w-3 shrink-0" />
              <span>Stats</span>
              {recommendedLang && maxCommas > 0 && (
                <span className="text-[10px] text-amber-500 font-semibold hidden md:inline">
                  (★ {recommendedLang.toUpperCase()}: {maxCommas} ,)
                </span>
              )}
              {showStats ? (
                <ChevronUp className="h-3 w-3 shrink-0" />
              ) : (
                <ChevronDown className="h-3 w-3 shrink-0" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Exposed Punctuation Statistics Breakdown Section (Hidden by default in Fast Mode) */}
      {statsEnabled && showStats && uniqueLangs.length > 0 && (
        <div
          data-testid="default-subtitles-punctuation-stats"
          className="w-full mt-1 pt-2 border-t border-border/60 space-y-2 text-xs animate-in fade-in-50 duration-150"
        >
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <BarChart3 className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>Punctuation Counting Statistics:</span>
            </div>
            {recommendedLang && maxCommas > 0 && (
              <span
                data-testid="recommended-track-callout"
                className="text-[11px] px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-medium inline-flex items-center gap-1"
              >
                <Sparkles className="h-3 w-3 fill-amber-400 text-amber-500 shrink-0" />
                <span>
                  King of Comma (Auto Base for Translation):{" "}
                  <strong>{getDisplayName(recommendedLang)}</strong> ({maxCommas} commas) &rarr;{" "}
                  Mother Tongue (Default):{" "}
                  <strong>{getDisplayName(effectiveMotherTongue || recommendedLang)}</strong>
                </span>
              </span>
            )}
          </div>

          <div className="overflow-x-auto rounded border border-border/60 bg-background/50">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="border-b border-border/60 bg-muted/40 text-muted-foreground font-semibold">
                  <th className="py-1 px-2.5">Track / Lang</th>
                  <th className="py-1 px-2 text-center text-amber-600 dark:text-amber-400 font-bold">
                    Commas (,)
                  </th>
                  <th className="py-1 px-2 text-center">Periods (.)</th>
                  <th className="py-1 px-2 text-center">Questions (?)</th>
                  <th className="py-1 px-2 text-center">Exclamations (!)</th>
                  <th className="py-1 px-2 text-center">Colons/Semi (: / ;)</th>
                  <th className="py-1 px-2 text-center font-medium">Total Punctuation</th>
                  <th className="py-1 px-2 text-center text-muted-foreground">Cues</th>
                </tr>
              </thead>
              <tbody>
                {uniqueLangs.map((code, idx) => {
                  const normalizedCode = code === "iw" ? "he" : code;
                  const stats: SubtitlePunctuationStats = statsMap[code] ||
                    statsMap[normalizedCode] || {
                      langCode: code,
                      commas: 0,
                      periods: 0,
                      questionMarks: 0,
                      exclamationMarks: 0,
                      colons: 0,
                      semicolons: 0,
                      totalPunctuation: 0,
                      cuesCount: 0,
                      wordsCount: 0,
                    };

                  const isRec = sameLanguageCode(code, recommendedLang) && maxCommas > 0;
                  const isCur = sameLanguageCode(code, activeLanguage);
                  const isMT = sameLanguageCode(code, effectiveMotherTongue);

                  return (
                    <tr
                      key={`${code}-${idx}`}
                      data-testid={`punctuation-stats-row-${code}`}
                      className={`border-b border-border/40 last:border-b-0 transition-colors ${
                        isRec ? "bg-amber-500/10 font-medium" : "hover:bg-muted/30"
                      }`}
                    >
                      <td className="py-1 px-2.5 flex items-center gap-1.5">
                        <span>{getDisplayName(code)}</span>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          ({code})
                        </span>
                        {isRec && (
                          <span
                            data-testid={`recommended-pill-${code}`}
                            className="px-1 py-0.2 rounded text-[9px] bg-amber-500/25 text-amber-700 dark:text-amber-300 font-semibold inline-flex items-center gap-0.5"
                          >
                            <Sparkles className="h-2.5 w-2.5 fill-amber-400" /> King of Comma
                          </span>
                        )}
                        {isMT && (
                          <span className="px-1 py-0.2 rounded text-[9px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold">
                            Mother Tongue
                          </span>
                        )}
                        {isCur && (
                          <span className="px-1 py-0.2 rounded text-[9px] bg-primary/20 text-primary font-semibold">
                            Default
                          </span>
                        )}
                      </td>
                      <td className="py-1 px-2 text-center font-bold text-amber-600 dark:text-amber-400">
                        {stats.commas}
                      </td>
                      <td className="py-1 px-2 text-center">{stats.periods}</td>
                      <td className="py-1 px-2 text-center">{stats.questionMarks}</td>
                      <td className="py-1 px-2 text-center">{stats.exclamationMarks}</td>
                      <td className="py-1 px-2 text-center">{stats.colons + stats.semicolons}</td>
                      <td className="py-1 px-2 text-center font-semibold text-foreground">
                        {stats.totalPunctuation}
                      </td>
                      <td className="py-1 px-2 text-center text-muted-foreground font-mono text-[10px]">
                        {stats.cuesCount}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-muted-foreground italic">
            King of Comma (most `,` punctuation signs) is automatically selected as the base for
            translation and generates the Mother Tongue default language.
          </p>
        </div>
      )}
    </div>
  );
};
