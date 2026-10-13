import React, { useState, useEffect, useMemo } from "react";
import {
  Trophy,
  X,
  Trash2,
  Search,
  RotateCcw,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Globe,
  Radio,
} from "lucide-react";
import {
  getWinnerPromotionHistory,
  getWinnerPromotionStats,
  clearWinnerPromotionHistory,
  WinnerPromotionRecord,
  WinnerPromotionStats,
} from "../utils/winnerPromotionTracker";
import { formatRelativeTime } from "../utils/videoLibraryManager";
import { Button } from "./ui/button";

export interface WinnerPromotionReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectVideo?: (videoId: string) => void;
}

export function WinnerPromotionReportModal({
  isOpen,
  onClose,
  onSelectVideo,
}: WinnerPromotionReportModalProps) {
  const [history, setHistory] = useState<WinnerPromotionRecord[]>(() =>
    getWinnerPromotionHistory(),
  );
  const [stats, setStats] = useState<WinnerPromotionStats>(() =>
    getWinnerPromotionStats(),
  );
  const [searchQuery, setSearchQuery] = useState("");

  const refreshData = () => {
    setHistory(getWinnerPromotionHistory());
    setStats(getWinnerPromotionStats());
  };

  useEffect(() => {
    if (isOpen) {
      refreshData();
    }
  }, [isOpen]);

  // Listen for live updates
  useEffect(() => {
    const handleUpdate = () => {
      refreshData();
    };
    window.addEventListener("winner-promotion-updated", handleUpdate);
    return () => {
      window.removeEventListener("winner-promotion-updated", handleUpdate);
    };
  }, []);

  const filteredHistory = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return history;
    return history.filter(
      (item) =>
        item.videoId.toLowerCase().includes(q) ||
        item.lang.toLowerCase().includes(q) ||
        item.mode.toLowerCase().includes(q) ||
        item.send.toLowerCase().includes(q) ||
        (item.videoTitle && item.videoTitle.toLowerCase().includes(q)),
    );
  }, [history, searchQuery]);

  if (!isOpen) return null;

  const handleClear = () => {
    if (window.confirm("Clear all winner promotion history across all videos?")) {
      clearWinnerPromotionHistory();
      refreshData();
    }
  };

  const tlangPct =
    stats.totalWins > 0
      ? Math.round((stats.modeCounts.tlang / stats.totalWins) * 100)
      : 50;
  const langPct =
    stats.totalWins > 0
      ? Math.round((stats.modeCounts.lang / stats.totalWins) * 100)
      : 50;

  const sessionPct =
    stats.totalWins > 0
      ? Math.round((stats.sendCounts.session / stats.totalWins) * 100)
      : 50;
  const anonPct =
    stats.totalWins > 0
      ? Math.round((stats.sendCounts.anon / stats.totalWins) * 100)
      : 50;

  return (
    <div
      data-testid="winner-promotion-report-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl rounded-xl border border-border bg-card shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4 bg-muted/40">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/15 text-amber-500 border border-amber-500/30">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                Winner Promotion Report
                <span className="text-[11px] font-mono font-normal px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {stats.totalWins} wins recorded
                </span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Historical record of which subtitle fetch strategies won for past videos
              </p>
            </div>
          </div>

          <button
            type="button"
            data-testid="winner-promotion-close-btn"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
          {/* Summary Stats Grid */}
          <div
            data-testid="winner-stats-summary"
            className="grid grid-cols-2 sm:grid-cols-4 gap-3"
          >
            <div className="rounded-lg border border-border bg-background p-3">
              <span className="text-[11px] text-muted-foreground">Total Wins</span>
              <p className="text-xl font-bold text-foreground mt-0.5">{stats.totalWins}</p>
              <span className="text-[10px] text-muted-foreground">
                across {stats.uniqueVideos} unique videos
              </span>
            </div>

            <div className="rounded-lg border border-border bg-background p-3">
              <span className="text-[11px] text-muted-foreground">Mode Distribution</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-sm font-bold text-primary">tlang: {tlangPct}%</span>
                <span className="text-xs text-muted-foreground font-medium">lang: {langPct}%</span>
              </div>
              <span className="text-[10px] text-muted-foreground">
                {stats.modeCounts.tlang} vs {stats.modeCounts.lang}
              </span>
            </div>

            <div className="rounded-lg border border-border bg-background p-3">
              <span className="text-[11px] text-muted-foreground">Transport Distribution</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-sm font-bold text-emerald-500">session: {sessionPct}%</span>
                <span className="text-xs text-muted-foreground font-medium">anon: {anonPct}%</span>
              </div>
              <span className="text-[10px] text-muted-foreground">
                {stats.sendCounts.session} vs {stats.sendCounts.anon}
              </span>
            </div>

            <div className="rounded-lg border border-border bg-background p-3">
              <span className="text-[11px] text-muted-foreground">Top Combination</span>
              <div className="flex items-center gap-1.5 mt-1 font-mono font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span className="truncate">{stats.topCombination || "tlang/session"}</span>
              </div>
              <span className="text-[10px] text-muted-foreground">promoted to 1st place</span>
            </div>
          </div>

          {/* Search & Actions Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                data-testid="winner-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search history by video ID, language (he, it), or mode..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={refreshData}
                className="h-8 text-xs"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                Refresh
              </Button>
              {history.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  data-testid="winner-promotion-clear-btn"
                  onClick={handleClear}
                  className="h-8 text-xs text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Clear History
                </Button>
              )}
            </div>
          </div>

          {/* History Records Table */}
          <div className="rounded-lg border border-border overflow-hidden bg-background">
            {filteredHistory.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Trophy className="h-8 w-8 mx-auto mb-2 opacity-30 text-amber-500" />
                <p className="font-medium">No promotion records found</p>
                <p className="text-[11px] mt-1 text-muted-foreground">
                  {searchQuery
                    ? "Try adjusting your search query."
                    : "When subtitles are fetched, the winning strategy will be recorded here."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table
                  data-testid="winner-history-table"
                  className="w-full text-left text-xs"
                >
                  <thead className="bg-muted/50 text-[11px] font-semibold text-muted-foreground border-b border-border">
                    <tr>
                      <th className="py-2 px-3">Video</th>
                      <th className="py-2 px-3">Language</th>
                      <th className="py-2 px-3">Winning Strategy</th>
                      <th className="py-2 px-3">Transport</th>
                      <th className="py-2 px-3">Cues</th>
                      <th className="py-2 px-3 text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-medium text-foreground">
                          <button
                            type="button"
                            onClick={() => {
                              onSelectVideo?.(item.videoId);
                              onClose();
                            }}
                            className="inline-flex items-center gap-1 hover:text-primary transition underline-offset-2 hover:underline text-left"
                            title={`Load video ${item.videoId}`}
                          >
                            <span>{item.videoId}</span>
                            <ExternalLink className="h-3 w-3 opacity-60" />
                          </button>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-mono uppercase font-semibold text-foreground px-1.5 py-0.5 rounded bg-muted">
                            {item.lang}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold ${
                              item.mode === "tlang"
                                ? "bg-blue-500/10 text-blue-500 border border-blue-500/30"
                                : "bg-purple-500/10 text-purple-500 border border-purple-500/30"
                            }`}
                          >
                            <Globe className="h-2.5 w-2.5" />
                            {item.mode} ({item.mode === "tlang" ? "Translation" : "Direct Track"})
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold ${
                              item.send === "session"
                                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30"
                                : "bg-zinc-500/10 text-zinc-400 border border-zinc-500/30"
                            }`}
                          >
                            {item.send === "session" ? (
                              <ShieldCheck className="h-2.5 w-2.5" />
                            ) : (
                              <Radio className="h-2.5 w-2.5" />
                            )}
                            {item.send}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-muted-foreground">
                          {item.cuesCount !== undefined ? `${item.cuesCount} cues` : "—"}
                        </td>
                        <td className="py-2.5 px-3 text-right text-muted-foreground font-mono text-[11px]">
                          {formatRelativeTime(item.timestamp)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border px-5 py-3 bg-muted/30 flex justify-end">
          <Button type="button" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

export default WinnerPromotionReportModal;
