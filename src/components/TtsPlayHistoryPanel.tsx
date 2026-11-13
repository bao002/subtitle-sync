import React, { useMemo, useState, useSyncExternalStore } from "react";
import {
  Check,
  Clock,
  Copy,
  Film,
  History,
  Languages,
  Play,
  Search,
  Trash2,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RTL } from "@/lib/subtitles";
import {
  clearTtsPlayHistory,
  formatTtsPlayHistoryDebugReport,
  formatVideoTimestampSec,
  getTtsPlayHistorySnapshot,
  subscribeToTtsPlayHistory,
  type TtsPlayHistoryEntry,
} from "@/utils/ttsPlayHistory";

export interface TtsPlayHistoryPanelProps {
  currentVideoId?: string;
  entriesOverride?: readonly TtsPlayHistoryEntry[];
  onReplayEntry?: (entry: TtsPlayHistoryEntry) => void;
  onNavigateToVideo?: (videoId: string, timeSec: number) => void;
  onClearHistory?: () => void;
  className?: string;
}

const SOURCE_LABELS: Record<TtsPlayHistoryEntry["source"], string> = {
  auto_playback: "Auto Playback",
  subtitle_table_cue: "Table Cue",
  learning_or_alternative_view: "Game / Alt View",
  zero_knowledge: "Zero Knowledge",
};

export const TtsPlayHistoryPanel: React.FC<TtsPlayHistoryPanelProps> = ({
  currentVideoId,
  entriesOverride,
  onReplayEntry,
  onNavigateToVideo,
  onClearHistory,
  className = "",
}) => {
  const storeEntries = useSyncExternalStore(
    subscribeToTtsPlayHistory,
    getTtsPlayHistorySnapshot,
    getTtsPlayHistorySnapshot,
  );
  const entries = entriesOverride ?? storeEntries;

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [onlyCurrentVideo, setOnlyCurrentVideo] = useState<boolean>(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");

  const filteredEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return entries.filter((entry) => {
      if (onlyCurrentVideo && currentVideoId && entry.videoId !== currentVideoId) {
        return false;
      }
      if (!q) return true;
      return (
        entry.sentence.toLowerCase().includes(q) ||
        entry.playedText.toLowerCase().includes(q) ||
        entry.translationText.toLowerCase().includes(q) ||
        entry.translationLang.toLowerCase().includes(q) ||
        entry.spokenLang.toLowerCase().includes(q) ||
        entry.videoId.toLowerCase().includes(q) ||
        entry.videoTitle.toLowerCase().includes(q) ||
        entry.ttsProvider.toLowerCase().includes(q)
      );
    });
  }, [entries, onlyCurrentVideo, currentVideoId, searchQuery]);

  const handleCopyReport = async () => {
    const report = formatTtsPlayHistoryDebugReport(
      filteredEntries,
      onlyCurrentVideo ? currentVideoId : undefined,
    );
    try {
      await navigator.clipboard.writeText(report);
      setCopyStatus("copied");
      setTimeout(() => setCopyStatus("idle"), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleClear = () => {
    if (onClearHistory) {
      onClearHistory();
    } else {
      clearTtsPlayHistory();
    }
  };

  return (
    <section
      id="tts-play-history-panel"
      data-testid="tts-play-history-panel"
      className={`rounded-xl border border-border bg-card p-4 sm:p-5 text-foreground shadow-sm space-y-4 ${className}`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <History className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-foreground">TTS-Play History</h2>
              <span
                data-testid="tts-history-count"
                className="rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 px-2 py-0.5 text-[10px] font-mono font-bold"
              >
                {filteredEntries.length}
                {filteredEntries.length !== entries.length ? ` / ${entries.length}` : ""}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Audit trail of played sentences, translations used, video context, and timestamps to debug &amp; reproduce playback behavior.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {currentVideoId && (
            <Button
              type="button"
              size="sm"
              variant={onlyCurrentVideo ? "default" : "outline"}
              data-testid="tts-history-video-filter-btn"
              onClick={() => setOnlyCurrentVideo((v) => !v)}
              className="h-7 px-2.5 text-[11px] gap-1"
            >
              <Film className="h-3 w-3" />
              <span>{onlyCurrentVideo ? `Only ${currentVideoId}` : "All Videos"}</span>
            </Button>
          )}

          <Button
            type="button"
            size="sm"
            variant="outline"
            data-testid="tts-history-copy-report-btn"
            disabled={filteredEntries.length === 0}
            onClick={() => void handleCopyReport()}
            className="h-7 px-2.5 text-[11px] gap-1"
            title="Copy structured TTS-play history report for debugging/reproduction"
          >
            {copyStatus === "copied" ? (
              <>
                <Check className="h-3 w-3 text-emerald-500" />
                <span>Copied Report</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                <span>Copy Debug Report</span>
              </>
            )}
          </Button>

          <Button
            type="button"
            size="sm"
            variant="ghost"
            data-testid="tts-history-clear-btn"
            disabled={entries.length === 0}
            onClick={handleClear}
            className="h-7 px-2 text-[11px] gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
            title="Clear TTS-Play history"
          >
            <Trash2 className="h-3 w-3" />
            <span>Clear</span>
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          data-testid="tts-history-search-input"
          placeholder="Filter by sentence, translation, language, video ID/title, or provider..."
          className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* History List */}
      <div
        data-testid="tts-history-list"
        className="max-h-[460px] overflow-y-auto space-y-2 pr-1"
      >
        {filteredEntries.length === 0 ? (
          <div
            data-testid="tts-history-empty"
            className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center text-xs text-muted-foreground"
          >
            {entries.length === 0
              ? "No TTS-play events recorded yet. Play a video with subtitles or click a Listen/Speak button to populate this history."
              : "No TTS-play history entries match the current filter."}
          </div>
        ) : (
          filteredEntries.map((entry, idx) => {
            const isBaseRtl = RTL.has(entry.baseLang);
            const isTranslationRtl = RTL.has(entry.translationLang);
            const localTimeLabel = new Date(entry.timestamp).toLocaleString();

            return (
              <article
                key={entry.id}
                data-testid={`tts-history-item-${idx}`}
                className="rounded-lg border border-border/80 bg-background/80 p-3 text-xs space-y-2 hover:border-amber-500/40 transition-colors"
              >
                {/* Top metadata strip: When, Which Video, Video Playback Time, Source/Provider */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      data-testid={`tts-history-when-${idx}`}
                      className="inline-flex items-center gap-1 font-mono text-foreground"
                      title={entry.formattedTime}
                    >
                      <Clock className="h-3 w-3 text-amber-500" />
                      <span>{localTimeLabel}</span>
                    </span>

                    <span
                      data-testid={`tts-history-video-${idx}`}
                      className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 font-medium text-foreground"
                    >
                      <Film className="h-3 w-3 text-sky-500" />
                      <span className="truncate max-w-[180px]" title={entry.videoTitle}>
                        {entry.videoTitle}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        ({entry.videoId} @ {formatVideoTimestampSec(entry.videoTimeSec)})
                      </span>
                    </span>

                    {entry.rowIndex >= 0 && (
                      <span className="rounded bg-muted/70 px-1.5 py-0.5 font-mono text-[10px]">
                        Row #{entry.rowIndex + 1}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      data-testid={`tts-history-provider-${idx}`}
                      className="rounded border border-border bg-card px-1.5 py-0.5 text-[10px] font-mono"
                    >
                      {SOURCE_LABELS[entry.source] || entry.source} · {entry.ttsProvider}
                    </span>

                    {onReplayEntry && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        data-testid={`tts-history-replay-${idx}`}
                        onClick={() => onReplayEntry(entry)}
                        className="h-6 px-2 text-[10px] gap-1"
                        title="Replay spoken audio"
                      >
                        <Volume2 className="h-3 w-3 text-primary" />
                        <span>Replay</span>
                      </Button>
                    )}

                    {onNavigateToVideo && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        data-testid={`tts-history-jump-${idx}`}
                        onClick={() => onNavigateToVideo(entry.videoId, entry.videoTimeSec)}
                        className="h-6 px-2 text-[10px] gap-1"
                        title="Jump to this video and timestamp"
                      >
                        <Play className="h-3 w-3 text-emerald-500" />
                        <span>Go to Video</span>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Sentence & Translation Pair */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="rounded border border-border/60 bg-card/60 p-2 space-y-0.5">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Sentence Played ({entry.baseLang})
                    </div>
                    <p
                      dir={isBaseRtl ? "rtl" : "ltr"}
                      data-testid={`tts-history-sentence-${idx}`}
                      className="font-medium text-foreground leading-snug break-words"
                    >
                      {entry.sentence}
                    </p>
                    {entry.playedText && entry.playedText !== entry.sentence && (
                      <p className="text-[11px] text-amber-600 dark:text-amber-300 font-medium">
                        Spoken segment ({entry.spokenLang}): {entry.playedText}
                      </p>
                    )}
                  </div>

                  <div className="rounded border border-border/60 bg-card/60 p-2 space-y-0.5">
                    <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <Languages className="h-3 w-3 text-indigo-500" />
                      <span>Translation Used ({entry.translationLang})</span>
                    </div>
                    <p
                      dir={isTranslationRtl ? "rtl" : "ltr"}
                      data-testid={`tts-history-translation-${idx}`}
                      className="font-medium text-indigo-700 dark:text-indigo-300 leading-snug break-words"
                    >
                      {entry.translationText || entry.playedText || "(none)"}
                    </p>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
};
