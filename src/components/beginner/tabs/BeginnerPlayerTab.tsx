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
}) => {
  // Find currently active cue index
  const activeCueIndex = useMemo(() => {
    return cues.findIndex((c) => currentTime >= c.start && currentTime < c.start + c.duration);
  }, [cues, currentTime]);

  return (
    <div className="space-y-3 max-w-4xl mx-auto p-3" data-testid="beginner-player-tab">
      {/* Player Header Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-sm flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={onTogglePlay}
            className={`h-8 px-3 text-xs font-medium rounded-lg flex items-center gap-1.5 ${
              isPlaying
                ? "bg-amber-600 hover:bg-amber-500 text-white"
                : "bg-emerald-600 hover:bg-emerald-500 text-white"
            }`}
            data-testid="btn-player-play-pause"
          >
            {isPlaying ? (
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
            className="h-8 px-2 text-xs border-slate-700 hover:bg-slate-800 text-slate-300"
            data-testid="btn-player-rewind"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            -5s
          </Button>

          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-300 px-2 py-1 bg-slate-950 rounded border border-slate-800">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>{fmt(currentTime)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[11px] border-slate-700 text-slate-300">
            Base: <strong className="ml-1 text-emerald-400">{baseLanguage.toUpperCase()}</strong>
          </Badge>
          {targetLanguage && (
            <Badge variant="outline" className="text-[11px] border-slate-700 text-slate-300">
              Target:{" "}
              <strong className="ml-1 text-indigo-400">{targetLanguage.toUpperCase()}</strong>
            </Badge>
          )}
          <Badge variant="outline" className="text-[11px] border-slate-700 text-slate-400">
            {cues.length} cues
          </Badge>
        </div>
      </div>

      {/* Synchronized Subtitles Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-2.5 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span>Click any line to seek video</span>
          <div className="flex items-center gap-2 text-[11px]">
            {onBackToPreferences && (
              <button
                type="button"
                onClick={onBackToPreferences}
                className="hover:text-slate-200 text-slate-400 underline underline-offset-2"
              >
                Adjust Voice &amp; Speed
              </button>
            )}
            <span>•</span>
            {onBackToParsing && (
              <button
                type="button"
                onClick={onBackToParsing}
                className="hover:text-slate-200 text-slate-400 underline underline-offset-2"
              >
                Adjust Punctuation
              </button>
            )}
          </div>
        </div>

        <div
          className="max-h-[500px] overflow-y-auto divide-y divide-slate-800/60"
          data-testid="cues-table"
        >
          {cues.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 space-y-1">
              <Subtitles className="w-6 h-6 mx-auto text-slate-600 mb-1" />
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
                      ? "bg-emerald-950/40 text-slate-100 border-l-4 border-l-emerald-500"
                      : "hover:bg-slate-800/50 text-slate-300"
                  }`}
                  data-testid={`cue-row-${idx}`}
                >
                  <div className="font-mono text-[11px] text-slate-500 shrink-0 pt-0.5 w-12">
                    {fmt(cue.start)}
                  </div>

                  <div className="space-y-1 flex-1 min-w-0">
                    <div
                      className={`font-medium transition-all ${
                        isActive ? "text-emerald-300 font-semibold" : "text-slate-100"
                      }`}
                      style={{ fontSize: `${Math.round(14 * subtitlesRatio)}px` }}
                    >
                      {cue.baseText}
                    </div>

                    {cue.targetText && (
                      <div className="text-xs text-slate-400">{cue.targetText}</div>
                    )}
                  </div>

                  {isActive && (
                    <div className="shrink-0 pt-0.5">
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
