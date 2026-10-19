import React, { memo } from "react";
import { Volume2 } from "lucide-react";
import { type Row, type Json3, fmt, RTL } from "@/lib/subtitles";
import {
  isSubtitleInstanceEligibleForTTS,
  shouldHighlightSentenceForTTS,
} from "@/lib/playback-preferences";
import { HighlightedSubtitle, type SpeechProgress } from "@/components/HighlightedSubtitle";

export interface SubtitleColumn {
  code: string;
  name: string;
  tts: string;
}

export interface SubtitleRowProps {
  r: Row;
  actualIndex: number;
  isActive: boolean;
  cols: SubtitleColumn[];
  speechProgress: SpeechProgress;
  tracks: Record<string, Json3> | null;
  onSeek: (r: Row, index: number) => void;
  spokenLangs?: string[];
  ttsRatios?: Record<string, number>;
  onSpeakCue?: (text: string, lang: string) => void;
}

export const SubtitleRow = memo(function SubtitleRow({
  r,
  actualIndex,
  isActive,
  cols,
  speechProgress,
  tracks,
  onSeek,
  spokenLangs,
  ttsRatios,
  onSpeakCue,
}: SubtitleRowProps) {
  return (
    <tr
      key={actualIndex}
      id={`subtitle-cue-row-${actualIndex}`}
      data-testid={`subtitle-cue-row-${actualIndex}`}
      data-row={actualIndex}
      onClick={() => onSeek(r, actualIndex)}
      className={`cursor-pointer border-t border-border align-top ${isActive ? "bg-accent" : "hover:bg-muted"}`}
    >
      <td className="whitespace-nowrap px-3 py-2 tabular-nums text-muted-foreground">
        {fmt(r.start)}–{fmt(r.end)}
      </td>
      {cols.map((l) => {
        const isSpoken = Boolean(spokenLangs?.includes(l.code));
        const ratio = ttsRatios?.[l.code] ?? 1;
        const isEligible = isSubtitleInstanceEligibleForTTS(actualIndex, ratio);
        const isPronouncedHighlight = shouldHighlightSentenceForTTS(actualIndex, ratio, isSpoken);
        return (
          <td
            key={l.code}
            dir={RTL.has(l.code) ? "rtl" : "ltr"}
            data-testid={`subtitle-cell-${actualIndex}-${l.code}`}
            data-tts-pronounced={isPronouncedHighlight ? "true" : undefined}
            className={`px-3 py-2 leading-relaxed transition-colors ${
              isPronouncedHighlight
                ? "bg-primary/10 border-s-2 border-primary/60 dark:bg-primary/15 dark:border-primary/80"
                : ""
            }`}
          >
            {tracks && !tracks[l.code] && !r.texts[l.code] ? null : (
              <div
                data-testid={`sentence-container-${actualIndex}-${l.code}`}
                data-tts-pronounced-highlight={isPronouncedHighlight ? "true" : "false"}
                className={`flex items-start justify-between gap-1.5 p-1 rounded transition-colors ${
                  isPronouncedHighlight
                    ? "bg-primary/15 text-foreground font-medium ring-1 ring-primary/25 shadow-xs dark:bg-primary/20 dark:ring-primary/40"
                    : ""
                }`}
              >
                <div className="flex-1">
                  <HighlightedSubtitle
                    text={r.texts[l.code] ?? ""}
                    progress={
                      speechProgress?.row === actualIndex && speechProgress.lang === l.code
                        ? speechProgress
                        : null
                    }
                    isPronouncedHighlighted={isPronouncedHighlight}
                  />
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {onSpeakCue && r.texts[l.code] && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSpeakCue(r.texts[l.code] || "", l.code);
                      }}
                      className="opacity-40 hover:opacity-100 p-0.5 rounded text-muted-foreground hover:text-foreground transition-opacity"
                      data-testid={`btn-speak-cell-${actualIndex}-${l.code}`}
                      title={`Listen to pronunciation (${l.name})`}
                    >
                      <Volume2 className="h-3 w-3" />
                    </button>
                  )}
                  {isSpoken && ratio > 1 && (
                    <span
                      data-testid={`row-${actualIndex}-tts-status-${l.code}`}
                      className={`inline-flex items-center px-1 py-0.2 rounded text-[9px] font-mono select-none ${
                        isEligible
                          ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                          : "opacity-35 text-muted-foreground line-through"
                      }`}
                      title={
                        isEligible
                          ? `TTS will play this sentence (1:${ratio} ratio)`
                          : `TTS skipped for this sentence (1:${ratio} ratio)`
                      }
                    >
                      TTS
                    </span>
                  )}
                </div>
              </div>
            )}
          </td>
        );
      })}
    </tr>
  );
});
