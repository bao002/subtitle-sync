import React from "react";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
  RefreshCw,
  Square,
  Gauge,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface VideoPlaybackControlsProps {
  isPlaying: boolean;
  currentTimeSec: number;
  durationSec: number;
  playbackRate: number;
  activeSectionIndex?: number;
  totalSections?: number;
  isPausedForSpeech?: boolean;
  speakingLangName?: string;
  onTogglePlay: () => void;
  onSeek: (seconds: number) => void;
  onRewind: (seconds?: number) => void;
  onFastForward: (seconds?: number) => void;
  onPrevSection?: () => void;
  onNextSection?: () => void;
  onReplaySection?: () => void;
  onStop?: () => void;
  onRateChange?: (rate: number) => void;
  className?: string;
}

/**
 * Format numeric seconds into standard MM:SS or HH:MM:SS display string.
 */
export function formatTimecode(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "00:00";
  const floored = Math.floor(totalSeconds);
  const hours = Math.floor(floored / 3600);
  const minutes = Math.floor((floored % 3600) / 60);
  const seconds = floored % 60;

  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  if (hours > 0) {
    const hh = String(hours).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

const PLAYBACK_RATES = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

/**
 * VideoPlaybackControls
 * Mobile-first playback control bar placed directly beneath the video player viewport.
 * Provides large, accessible touch targets for Play/Pause, timeline scrubbing,
 * quick +/- 5s skips, subtitle section jumps, and playback rate adjustments.
 */
export const VideoPlaybackControls: React.FC<VideoPlaybackControlsProps> = ({
  isPlaying,
  currentTimeSec,
  durationSec,
  playbackRate,
  activeSectionIndex = -1,
  totalSections = 0,
  isPausedForSpeech = false,
  speakingLangName,
  onTogglePlay,
  onSeek,
  onRewind,
  onFastForward,
  onPrevSection,
  onNextSection,
  onReplaySection,
  onStop,
  onRateChange,
  className = "",
}) => {
  const safeDuration = Number.isFinite(durationSec) && durationSec > 0 ? durationSec : 0;
  const safeCurrent = Math.max(0, Math.min(currentTimeSec, safeDuration || currentTimeSec));
  const progressPercent = safeDuration > 0 ? (safeCurrent / safeDuration) * 100 : 0;

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSec = parseFloat(e.target.value);
    if (!Number.isNaN(newSec)) {
      onSeek(newSec);
    }
  };

  const handleCycleSpeed = () => {
    if (!onRateChange) return;
    const currentIndex = PLAYBACK_RATES.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % PLAYBACK_RATES.length;
    onRateChange(PLAYBACK_RATES[nextIndex] ?? 1.0);
  };

  return (
    <div
      data-testid="video-playback-controls"
      aria-label="Video playback controls"
      className={`rounded-lg border border-border bg-card p-3 shadow-sm select-none transition-colors ${className}`}
    >
      {/* 1. Timecode, Section Badge & Status Indicators */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span
            data-testid="player-control-time-display"
            className="font-mono font-semibold text-foreground"
          >
            {formatTimecode(safeCurrent)} / {formatTimecode(safeDuration)}
          </span>
          {totalSections > 0 && activeSectionIndex >= 0 && (
            <span
              data-testid="player-control-section-badge"
              className="rounded-md bg-muted px-2 py-0.5 font-medium text-foreground text-[11px]"
            >
              Section {activeSectionIndex + 1} of {totalSections}
            </span>
          )}
        </div>

        {/* Dynamic status hint (Speech, Paused, Playing) */}
        <div className="flex items-center gap-1.5 text-[11px]">
          {isPausedForSpeech && (
            <span
              data-testid="player-control-speech-hint"
              className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 font-semibold text-amber-600 dark:text-amber-400 animate-pulse"
            >
              <Volume2 className="h-3 w-3" />
              {speakingLangName ? `Speaking ${speakingLangName}…` : "Speaking section…"}
            </span>
          )}
          {!isPausedForSpeech && isPlaying && (
            <span
              data-testid="player-control-playing-status"
              className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 font-medium"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-ping" />
              Playing
            </span>
          )}
          {!isPausedForSpeech && !isPlaying && (
            <span
              data-testid="player-control-paused-status"
              className="text-muted-foreground font-medium"
            >
              Paused
            </span>
          )}
        </div>
      </div>

      {/* 2. Interactive Timeline Scrubbing Bar */}
      <div className="relative flex items-center py-1">
        <input
          type="range"
          id="player-control-seekbar"
          data-testid="player-control-seekbar"
          aria-label="Seek video position"
          min={0}
          max={safeDuration > 0 ? safeDuration : 100}
          step={0.1}
          value={safeCurrent}
          onChange={handleSeekChange}
          className="w-full h-2.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none focus:ring-2 focus:ring-primary/40 touch-none"
        />
        {/* Subtle filled progress track for visual clarity */}
        <div
          className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 h-2.5 bg-primary/20 rounded-l-lg"
          style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
        />
      </div>

      {/* 3. Primary Mobile-Friendly Button Ribbon */}
      <div className="flex items-center justify-between gap-1 pt-1 sm:gap-2">
        {/* Skip to Previous Section */}
        <Button
          type="button"
          size="sm"
          variant="outline"
          data-testid="player-control-prev-section"
          aria-label="Previous section"
          title="Jump to previous subtitle section"
          onClick={onPrevSection}
          disabled={!onPrevSection || activeSectionIndex <= 0}
          className="h-10 px-2 sm:px-3 text-xs gap-1 min-w-[36px]"
        >
          <SkipBack className="h-4 w-4 shrink-0" />
          <span className="hidden md:inline">Prev Sec</span>
        </Button>

        {/* Rewind -5s */}
        <Button
          type="button"
          size="sm"
          variant="outline"
          data-testid="player-control-rewind"
          aria-label="Rewind 5 seconds"
          title="Rewind 5 seconds (-5s)"
          onClick={() => onRewind(5)}
          className="h-10 px-2.5 sm:px-3.5 text-xs font-semibold gap-1 min-w-[44px]"
        >
          <RotateCcw className="h-4 w-4 shrink-0" />
          <span>-5s</span>
        </Button>

        {/* Main Central Play / Pause Button (Extra large touch target for mobile) */}
        <Button
          type="button"
          size="default"
          variant={isPlaying || isPausedForSpeech ? "secondary" : "default"}
          data-testid="player-control-play-pause"
          aria-label={isPlaying || isPausedForSpeech ? "Pause playback" : "Play video"}
          title={isPlaying || isPausedForSpeech ? "Pause playback (Space)" : "Play video (Space)"}
          onClick={onTogglePlay}
          className={`h-11 flex-1 max-w-[170px] min-w-[90px] gap-2 rounded-lg font-bold text-sm shadow-sm transition-transform active:scale-95 ${
            isPlaying || isPausedForSpeech
              ? "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border"
              : "bg-primary text-primary-foreground hover:bg-primary/90 ring-2 ring-primary/20"
          }`}
        >
          {isPlaying || isPausedForSpeech ? (
            <>
              <Pause className="h-5 w-5 fill-current shrink-0" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="h-5 w-5 fill-current shrink-0 text-primary-foreground" />
              <span>Play</span>
            </>
          )}
        </Button>

        {/* Fast-Forward +5s */}
        <Button
          type="button"
          size="sm"
          variant="outline"
          data-testid="player-control-forward"
          aria-label="Fast-forward 5 seconds"
          title="Fast-forward 5 seconds (+5s)"
          onClick={() => onFastForward(5)}
          className="h-10 px-2.5 sm:px-3.5 text-xs font-semibold gap-1 min-w-[44px]"
        >
          <span>+5s</span>
          <RotateCw className="h-4 w-4 shrink-0" />
        </Button>

        {/* Skip to Next Section */}
        <Button
          type="button"
          size="sm"
          variant="outline"
          data-testid="player-control-next-section"
          aria-label="Next section"
          title="Jump to next subtitle section"
          onClick={onNextSection}
          disabled={
            !onNextSection || (totalSections > 0 && activeSectionIndex >= totalSections - 1)
          }
          className="h-10 px-2 sm:px-3 text-xs gap-1 min-w-[36px]"
        >
          <span className="hidden md:inline">Next Sec</span>
          <SkipForward className="h-4 w-4 shrink-0" />
        </Button>
      </div>

      {/* 4. Secondary Action Row (Replay Section, Stop, Speed Rate) */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 pt-2 border-t border-border/60 text-xs">
        <div className="flex items-center gap-1.5">
          {onReplaySection && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              data-testid="player-control-replay-section"
              aria-label="Replay current section"
              title="Replay active subtitle section from start"
              onClick={onReplaySection}
              disabled={activeSectionIndex < 0}
              className="h-8 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="h-3.5 w-3.5 shrink-0" />
              <span>Replay Section</span>
            </Button>
          )}

          {onStop && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              data-testid="player-control-stop"
              aria-label="Stop video"
              title="Stop video and rewind to beginning"
              onClick={onStop}
              className="h-8 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
            >
              <Square className="h-3.5 w-3.5 shrink-0" />
              <span>Stop</span>
            </Button>
          )}
        </div>

        {/* Speed Rate Toggle */}
        <Button
          type="button"
          size="sm"
          variant="outline"
          data-testid="player-control-speed"
          aria-label={`Playback speed: ${playbackRate}x. Click to change`}
          title={`Cycle playback speed (Current: ${playbackRate}x)`}
          onClick={handleCycleSpeed}
          className="h-8 px-2.5 font-mono text-xs font-semibold gap-1 border-input hover:bg-accent"
        >
          <Gauge className="h-3.5 w-3.5 text-primary" />
          <span>{playbackRate}x</span>
        </Button>
      </div>
    </div>
  );
};

export default VideoPlaybackControls;
