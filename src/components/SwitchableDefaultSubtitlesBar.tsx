import React from "react";
import { Check, Subtitles, Sparkles } from "lucide-react";
import { LANGS, type Json3 } from "@/lib/subtitles";
import type { DetectedSubtitleTrack } from "@/components/VideoPlayground";

export interface SwitchableDefaultSubtitlesBarProps {
  videoId: string;
  defaultLanguages: string[];
  activeLanguage: string;
  onSelectLanguage: (langCode: string) => void;
  tracks?: Record<string, Json3> | null;
  detectedTracks?: Record<string, DetectedSubtitleTrack>;
  className?: string;
  isPlayground?: boolean;
}

/**
 * SwitchableDefaultSubtitlesBar
 *
 * Displays the switchable list of default subtitle languages fetched from YouTube's API
 * around the video player component (both on the main video player and in the playground).
 * Preserves all fetched default subtitle tracks and allows 1-click switching of the active default language.
 */
export const SwitchableDefaultSubtitlesBar: React.FC<SwitchableDefaultSubtitlesBarProps> = ({
  videoId,
  defaultLanguages,
  activeLanguage,
  onSelectLanguage,
  tracks,
  detectedTracks,
  className = "",
  isPlayground = false,
}) => {
  // Deduplicate and filter non-empty languages
  const uniqueLangs = Array.from(
    new Set(defaultLanguages.filter((code) => Boolean(code && typeof code === "string"))),
  );

  return (
    <div
      data-testid="switchable-default-subtitles-bar"
      id="switchable-default-subtitles-bar"
      className={`flex flex-wrap items-center justify-between gap-2.5 px-3 py-2 text-xs border border-border/80 bg-card/90 rounded-lg shadow-sm backdrop-blur-sm ${className}`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
          <Subtitles className="h-3.5 w-3.5" />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-semibold text-foreground tracking-tight">
            Default Subtitles ({uniqueLangs.length}):
          </span>
          <span className="text-[11px] text-muted-foreground hidden sm:inline">
            (Fetched from YouTube API)
          </span>
        </div>
      </div>

      <div
        data-testid="switchable-default-subtitles-list"
        className="flex flex-wrap items-center gap-1.5"
      >
        {uniqueLangs.length > 0 ? (
          uniqueLangs.map((langCode) => {
            const normalizedCode = langCode === "iw" ? "he" : langCode;
            const isActive =
              activeLanguage === langCode ||
              activeLanguage === normalizedCode ||
              (activeLanguage === "he" && langCode === "iw") ||
              (activeLanguage === "iw" && langCode === "he");

            const meta = LANGS.find(
              (l) => l.code === langCode || l.code === normalizedCode,
            );
            const displayName = meta?.name || langCode.toUpperCase();

            // Check cues count if available
            const track = tracks?.[langCode] || tracks?.[normalizedCode];
            const detected = detectedTracks?.[langCode] || detectedTracks?.[normalizedCode];
            const cuesCount =
              track?.events?.length ||
              (Array.isArray(track) ? (track as unknown as unknown[]).length : 0) ||
              detected?.cuesCount ||
              0;

            return (
              <button
                key={langCode}
                type="button"
                data-testid={`default-subtitle-lang-btn-${langCode}`}
                aria-pressed={isActive}
                onClick={() => onSelectLanguage(langCode)}
                title={`Switch active default subtitle to ${displayName} (${langCode})`}
                className={`group relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-all cursor-pointer ${
                  isActive
                    ? "border-primary bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/40 font-semibold"
                    : "border-border bg-background/80 hover:bg-muted text-foreground hover:border-primary/50"
                }`}
              >
                {isActive && <Check className="h-3 w-3 shrink-0 stroke-[2.5]" />}
                <span>{displayName}</span>
                <span
                  className={`text-[10px] font-mono ${
                    isActive ? "text-primary-foreground/80" : "text-muted-foreground"
                  }`}
                >
                  ({langCode})
                </span>
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
    </div>
  );
};
