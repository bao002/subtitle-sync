import React, { useMemo } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Subtitles,
  ExternalLink,
  ChevronRight,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fmt } from "@/lib/subtitles";

export interface SubtitleCueDisplay {
  id: string;
  start: number;
  duration: number;
  baseText: string;
  targetText?: string;
}

export interface BeginnerPlayerTabProps {
  cues: SubtitleCueDisplay[];
  currentTime: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSeek: (seconds: number) => void;
  baseLanguage: string;
  targetLanguage: string;
  subtitlesRatio?: number;
  onBackToPreferences?: () => void;
  onBackToParsing?: () => void;
  subtitlesTableSlot?: React.ReactNode;
  onSpeakCue?: (text: string, lang: string) => void;
  speakingLang?: string | null;
}

export const BeginnerPlayerTab: React.FC<BeginnerPlayerTabProps> = ({
  cues,
  currentTime,
  isPlaying,
  onTogglePlay,
  onSeek,
  baseLanguage,
  targetLanguage,
  subtitlesRatio = 1.0,
  onBackToPreferences,
  onBackToParsing,
  subtitlesTableSlot,
  onSpeakCue,
  speakingLang,
}) => {
  // Find currently active cue index
  const activeCueIndex = useMemo(() => {
    return cues.findIndex((c) => currentTime >= c.start && currentTime < c.start + c.duration);
  }, [cues, currentTime]);

  return (
    <div
      className="space-y-3 max-w-4xl mx-auto p-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/5"
      data-testid="beginner-player-tab"
      data-control-category="daily-usage"
    >
      {/* Player Header Controls */}
      <div className="bg-card border border-border rounded-xl p-3 shadow-sm flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={onTogglePlay}
            className={`h-8 px-3 text-xs font-medium rounded-lg flex items-center gap-1.5 ${
              isPlaying || Boolean(speakingLang)
                ? "bg-amber-600 hover:bg-amber-500 text-white"
                : "bg-emerald-600 hover:bg-emerald-500 text-white"
            }`}
            data-testid="btn-player-play-pause"
          >
            {isPlaying || Boolean(speakingLang) ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Play</span>
              </>
            )}
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onSeek(Math.max(0, currentTime - 5))}
            className="h-8 px-2 text-xs border-border hover:bg-muted text-foreground"
            data-testid="btn-player-rewind"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            -5s
          </Button>

          <div className="flex items-center gap-1.5 text-xs font-mono text-foreground px-2 py-1 bg-muted/60 rounded border border-border">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span>{fmt(currentTime)}</span>
          </div>

          {onSpeakCue && cues.some((cue) => cue.targetText) && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                const targetCue = activeCueIndex >= 0 ? cues[activeCueIndex] : cues[0];
                if (targetCue) {
                  if (targetCue.targetText && targetLanguage) {
                    onSpeakCue(targetCue.targetText, targetLanguage);
                  }
                }
              }}
              className="h-8 px-2.5 text-xs border-border hover:bg-muted text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5"
              data-testid="btn-player-speak-current"
              title="Listen to current subtitle with TTS"
            >
              <Volume2
                className={`w-3.5 h-3.5 ${speakingLang ? "animate-bounce text-emerald-500" : "text-emerald-500"}`}
              />
              <span>{speakingLang ? "Speaking…" : "Speak Cue"}</span>
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            data-testid="player-base-lang-badge"
            className="text-[11px] border-border text-foreground"
          >
            Base:{" "}
            <strong className="ml-1 text-emerald-600 dark:text-emerald-400">
              {baseLanguage.toUpperCase()}
            </strong>
          </Badge>
          {targetLanguage && (
            <Badge
              variant="outline"
              data-testid="player-target-lang-badge"
              className="text-[11px] border-border text-foreground"
            >
              Target: <strong className="ml-1 text-primary">{targetLanguage.toUpperCase()}</strong>
            </Badge>
          )}
          <Badge
            variant="outline"
            data-testid="player-cues-count-badge"
            className="text-[11px] border-border text-muted-foreground"
          >
            {cues.length} cues
          </Badge>
        </div>
      </div>

      {/* Synchronized Subtitles Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="p-2.5 bg-muted/40 border-b border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>Click any line to seek video</span>
          <div className="flex items-center gap-2 text-[11px]">
            {onBackToPreferences && (
              <button
                type="button"
                onClick={onBackToPreferences}
                className="hover:text-foreground text-muted-foreground underline underline-offset-2"
              >
                Adjust Voice &amp; Speed
              </button>
            )}
            <span>•</span>
            {onBackToParsing && (
              <button
                type="button"
                onClick={onBackToParsing}
                className="hover:text-foreground text-muted-foreground underline underline-offset-2"
              >
                Adjust Punctuation
              </button>
            )}
          </div>
        </div>

        {subtitlesTableSlot ? (
          <div className="p-2">
            {subtitlesTableSlot}
            <div data-testid="cues-table" className="hidden" />
          </div>
        ) : (
          <div
            className="max-h-[500px] overflow-y-auto divide-y divide-border/60"
            data-testid="cues-table"
          >
            {cues.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground space-y-1">
                <Subtitles className="w-6 h-6 mx-auto text-muted-foreground/60 mb-1" />
                <p>No subtitle cues loaded for this track yet.</p>
              </div>
            ) : (
              cues.map((cue, idx) => {
                const isActive = idx === activeCueIndex;
                return (
                  <div
                    key={cue.id || idx}
                    onClick={() => onSeek(cue.start)}
                    className={`p-3 text-left transition-colors cursor-pointer flex items-start gap-3 ${
                      isActive
                        ? "bg-primary/10 text-foreground border-l-4 border-l-primary"
                        : "hover:bg-muted/50 text-foreground"
                    }`}
                    data-testid={`cue-row-${idx}`}
                  >
                    <div
                      data-testid="cue-timestamp"
                      className="font-mono text-[11px] text-muted-foreground shrink-0 pt-0.5 w-12"
                    >
                      {fmt(cue.start)}
                    </div>

                    <div className="space-y-1 flex-1 min-w-0">
                      <div
                        data-testid="cue-base-text"
                        className={`font-medium transition-all ${
                          isActive ? "text-primary font-semibold" : "text-foreground"
                        }`}
                        style={{ fontSize: `${Math.round(14 * subtitlesRatio)}px` }}
                      >
                        {cue.baseText}
                      </div>

                      {cue.targetText && (
                        <div
                          data-testid="cue-target-text"
                          className="text-xs text-muted-foreground"
                        >
                          {cue.targetText}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0 pt-0.5">
                      {onSpeakCue && cue.targetText && targetLanguage && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSpeakCue(cue.targetText, targetLanguage);
                          }}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-muted rounded"
                          data-testid={`btn-speak-cue-${idx}`}
                          title={`Listen to pronunciation (${cue.targetText && targetLanguage ? targetLanguage.toUpperCase() : baseLanguage.toUpperCase()})`}
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {isActive && (
                        <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse ml-0.5" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};
