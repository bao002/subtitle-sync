import React, { useState, useEffect, useRef, useCallback } from "react";
import { Json3 } from "../lib/subtitles";
import { getRandomRetryDelayMs } from "../lib/playback-preferences";
import { subtitleRequestQueue } from "../utils/subtitleRequestQueue";
import {
  RotateCcw,
  Pause,
  Play,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";

export interface FloatingSubtitleRetryIndicatorProps {
  targetLanguages: string[];
  tracks: Record<string, Json3> | null;
  onFetchLanguage: (code: string) => Promise<boolean | void>;
  isFetching: boolean;
  autoRetryEnabled?: boolean;
  minPacingSec?: number;
  maxPacingSec?: number;
  onToggleAutoRetry?: (enabled: boolean) => void;
  floating?: boolean;
}

export function FloatingSubtitleRetryIndicator({
  targetLanguages,
  tracks,
  onFetchLanguage,
  isFetching,
  autoRetryEnabled = true,
  minPacingSec = 3,
  maxPacingSec = 8,
  onToggleAutoRetry,
  floating = false,
}: FloatingSubtitleRetryIndicatorProps) {
  // Compute which favorite languages still lack valid subtitle cues
  const pendingLanguages = targetLanguages.filter((code) => {
    const track = tracks?.[code];
    return !track || !track.events || track.events.length === 0;
  });

  // Default to retrying by default as requested
  const [isPaused, setIsPaused] = useState<boolean>(!autoRetryEnabled);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(minPacingSec);
  const [currentlyFetchingLang, setCurrentlyFetchingLang] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const nextScheduledDelayMs = useRef<number>(minPacingSec * 1000);

  // Sync isPaused with external autoRetryEnabled changes if provided
  useEffect(() => {
    setIsPaused(!autoRetryEnabled);
  }, [autoRetryEnabled]);

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  const triggerNextFetch = useCallback(async () => {
    if (pendingLanguages.length === 0 || isFetching) return;
    const targetLang = pendingLanguages[0]!;
    setCurrentlyFetchingLang(targetLang);
    clearTimers();

    try {
      await onFetchLanguage(targetLang);
    } finally {
      setCurrentlyFetchingLang(null);
    }
  }, [pendingLanguages, isFetching, onFetchLanguage, clearTimers]);

  // Main pacing and retry scheduling loop
  useEffect(() => {
    // If no pending languages, all are fetched!
    if (pendingLanguages.length === 0) {
      clearTimers();
      setSecondsRemaining(0);
      return;
    }

    // If user paused or auto-retry disabled or already actively fetching, hold off
    if (isPaused || isFetching) {
      clearTimers();
      return;
    }

    // Pick randomized delay between minPacingSec and maxPacingSec to avoid YouTube API bursts
    const delayMs = getRandomRetryDelayMs(minPacingSec, maxPacingSec);
    nextScheduledDelayMs.current = delayMs;
    const initialSeconds = Math.max(1, Math.round(delayMs / 1000));
    setSecondsRemaining(initialSeconds);

    clearTimers();

    // Secondary 1s ticker for user-visible countdown
    countdownIntervalRef.current = setInterval(() => {
      setSecondsRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    // Primary timeout executing next paced fetch
    timerRef.current = setTimeout(() => {
      clearTimers();
      triggerNextFetch();
    }, delayMs);

    return () => {
      clearTimers();
    };
  }, [
    pendingLanguages.length,
    isPaused,
    isFetching,
    minPacingSec,
    maxPacingSec,
    triggerNextFetch,
    clearTimers,
  ]);

  // If no target languages are selected, don't show the indicator
  if (targetLanguages.length === 0) {
    return null;
  }

  const allFetched = pendingLanguages.length === 0;

  const handleTogglePause = () => {
    const nextState = !isPaused;
    setIsPaused(nextState);
    subtitleRequestQueue.setPaused(nextState);
    onToggleAutoRetry?.(!nextState);
  };

  const handleManualRetryNow = () => {
    clearTimers();
    triggerNextFetch();
  };

  return (
    <div
      data-testid="floating-subtitle-retry-indicator"
      className={
        floating
          ? "fixed bottom-20 right-4 z-40 max-w-xs transition-all duration-300 sm:bottom-6 sm:right-6"
          : "relative w-full max-w-none transition-all duration-300"
      }
    >
      <div
        className={`overflow-hidden rounded-xl border bg-background/95 shadow-xl backdrop-blur-md transition-all ${
          allFetched
            ? "border-emerald-500/40 shadow-emerald-500/5"
            : isPaused
              ? "border-amber-500/40 shadow-amber-500/5"
              : "border-primary/50 shadow-primary/10"
        }`}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-2 border-b border-border/50 px-3 py-2 bg-muted/30">
          <div className="flex items-center gap-1.5 min-w-0">
            {allFetched ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            ) : isFetching || currentlyFetchingLang ? (
              <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
            ) : (
              <Clock className="h-4 w-4 text-primary shrink-0" />
            )}
            <span className="text-xs font-semibold text-foreground truncate">
              {allFetched
                ? "Subtitles Loaded"
                : isFetching
                  ? `Fetching ${currentlyFetchingLang ?? "subtitles"}…`
                  : isPaused
                    ? "Retry Paused"
                    : "Auto-Fetching Subtitles"}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {!allFetched && (
              <button
                type="button"
                onClick={handleTogglePause}
                data-testid={isPaused ? "floating-retry-resume-btn" : "floating-retry-pause-btn"}
                className={`p-1 rounded-md text-xs transition ${
                  isPaused
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
                }`}
                title={isPaused ? "Resume auto-fetching" : "Pause auto-fetching"}
                aria-label={isPaused ? "Resume auto-retry" : "Pause auto-retry"}
              >
                {isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsMinimized((prev) => !prev)}
              data-testid="floating-retry-minimize-btn"
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition"
              title={isMinimized ? "Expand indicator" : "Minimize indicator"}
              aria-label={isMinimized ? "Expand indicator" : "Minimize indicator"}
            >
              {isMinimized ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Content Body (collapsible) */}
        {!isMinimized && (
          <div className="p-3 space-y-2 text-xs">
            {allFetched ? (
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span>All {targetLanguages.length} favorited languages fetched successfully!</span>
              </div>
            ) : (
              <>
                {/* Status line */}
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Pending languages:</span>
                  <span className="font-semibold text-foreground">
                    {pendingLanguages.length} of {targetLanguages.length}
                  </span>
                </div>

                {/* Pending language tags */}
                <div className="flex flex-wrap gap-1">
                  {pendingLanguages.map((lang) => (
                    <span
                      key={lang}
                      className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-primary/10 text-primary border border-primary/20 uppercase"
                    >
                      {lang}
                    </span>
                  ))}
                </div>

                {/* Pacing Info & Countdown */}
                <div className="rounded-lg bg-muted/40 p-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">
                      {isPaused
                        ? "Paced retry is paused"
                        : isFetching
                          ? "Request in progress…"
                          : "Next request in:"}
                    </span>
                    <span
                      data-testid="floating-retry-countdown"
                      className="font-mono text-xs font-bold text-primary"
                    >
                      {isPaused ? "Paused" : isFetching ? "Fetching…" : `${secondsRemaining}s`}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <ShieldCheck className="h-3 w-3 text-emerald-500 shrink-0" />
                    <span>
                      API safe pacing: {minPacingSec}s–{maxPacingSec}s jitter
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleManualRetryNow}
                    disabled={isFetching || pendingLanguages.length === 0}
                    data-testid="floating-retry-now-btn"
                    className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground font-medium text-xs hover:bg-primary/90 disabled:opacity-50 transition active:scale-95 shadow-xs"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Retry Now</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleTogglePause}
                    data-testid="floating-retry-toggle-btn"
                    className="px-2.5 py-1.5 rounded-lg border border-border bg-background hover:bg-muted font-medium text-xs text-foreground transition active:scale-95"
                  >
                    {isPaused ? "Resume" : "Pause"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
