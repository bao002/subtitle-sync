import React, { useState, useSyncExternalStore } from "react";
import { Activity, AlertTriangle, Check, Copy, Trash2, ChevronUp, ChevronDown, ListFilter } from "lucide-react";
import { getLogEntriesSnapshot, logBuffer, subscribeToLogEntries, type LogEntry } from "@/utils/logBuffer";
import { Button } from "@/components/ui/button";

function formatDetails(details: unknown): string {
  if (typeof details === "string") return details;
  try {
    return JSON.stringify(details, null, 2);
  } catch {
    return String(details);
  }
}

interface BottomLogViewerProps {
  className?: string;
  defaultExpanded?: boolean;
}

export const BottomLogViewer: React.FC<BottomLogViewerProps> = ({
  className = "",
  defaultExpanded = false,
}) => {
  const entries = useSyncExternalStore(
    subscribeToLogEntries,
    getLogEntriesSnapshot,
    getLogEntriesSnapshot,
  );
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [filterLevel, setFilterLevel] = useState<"ALL" | "ACTIONS_ERRORS">("ALL");

  const visibleEntries = entries.filter((entry) => {
    if (filterLevel === "ACTIONS_ERRORS") {
      return entry.level === "ACTION" || entry.level === "ERROR";
    }
    return true;
  });

  const latestEntry = entries.length > 0 ? entries[entries.length - 1] : null;

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(logBuffer.copyAll());
      setCopyStatus("copied");
      setTimeout(() => setCopyStatus("idle"), 2500);
    } catch {
      setCopyStatus("failed");
      setTimeout(() => setCopyStatus("idle"), 2500);
    }
  };

  const handleClear = () => {
    logBuffer.clear();
  };

  return (
    <footer
      id="bottom-log-viewer"
      data-testid="bottom-log-viewer"
      className={`w-full border-t border-border bg-card/95 backdrop-blur shadow-md transition-all duration-200 text-foreground ${className}`}
    >
      {/* Collapsed / Header Bar */}
      <div className="flex items-center justify-between px-3 py-2 sm:px-4 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            data-testid="bottom-log-toggle-btn"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="flex items-center gap-1.5 font-semibold text-primary hover:underline cursor-pointer"
            aria-expanded={isExpanded}
            aria-controls="bottom-log-content"
          >
            <Activity className="h-4 w-4 shrink-0 text-primary" />
            <span>Activity & State Log</span>
            <span className="rounded-full bg-primary/15 text-primary text-[10px] px-2 py-0.2 font-mono font-bold">
              {entries.length}
            </span>
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ml-0.5" />
            ) : (
              <ChevronUp className="h-3.5 w-3.5 text-muted-foreground ml-0.5" />
            )}
          </button>

          {!isExpanded && latestEntry && (
            <div className="hidden md:flex items-center gap-1.5 min-w-0 text-[11px] text-muted-foreground truncate border-l border-border/60 pl-2">
              <span className={`font-bold font-mono uppercase text-[9px] px-1 py-0.2 rounded ${
                latestEntry.level === "ERROR"
                  ? "bg-destructive/15 text-destructive"
                  : "bg-muted text-foreground"
              }`}>
                {latestEntry.level}
              </span>
              <span className="font-semibold text-foreground truncate">{latestEntry.category}:</span>
              <span className="truncate">{latestEntry.message}</span>
            </div>
          )}
        </div>

        {/* Action Controls: Copy, Clear, and Filter */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isExpanded && (
            <div className="flex items-center border border-border rounded-md overflow-hidden bg-background mr-1 text-[11px]">
              <button
                type="button"
                data-testid="bottom-log-filter-all"
                onClick={() => setFilterLevel("ALL")}
                className={`px-2 py-0.5 transition-colors ${
                  filterLevel === "ALL"
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All
              </button>
              <button
                type="button"
                data-testid="bottom-log-filter-actions-errors"
                onClick={() => setFilterLevel("ACTIONS_ERRORS")}
                className={`px-2 py-0.5 transition-colors ${
                  filterLevel === "ACTIONS_ERRORS"
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Actions/Errors
              </button>
            </div>
          )}

          <Button
            type="button"
            size="sm"
            variant="outline"
            data-testid="bottom-log-copy-button"
            onClick={() => void handleCopyAll()}
            className="h-7 px-2 text-[11px] flex items-center gap-1"
            title="Copy log to clipboard"
          >
            {copyStatus === "copied" ? (
              <>
                <Check className="h-3 w-3 text-emerald-500" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                <span>Copy Log</span>
              </>
            )}
          </Button>

          <Button
            type="button"
            size="sm"
            variant="ghost"
            data-testid="bottom-log-clear-button"
            onClick={handleClear}
            disabled={entries.length === 0}
            className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
            title="Clear all log entries"
          >
            <Trash2 className="h-3 w-3" />
            <span className="hidden sm:inline">Clear</span>
          </Button>
        </div>
      </div>

      {/* Expanded Log Entries Container */}
      {isExpanded && (
        <div
          id="bottom-log-content"
          data-testid="bottom-log-content"
          className="border-t border-border/60 bg-muted/20 max-h-64 sm:max-h-80 overflow-y-auto p-2 sm:p-3 space-y-1.5 text-xs font-mono"
        >
          {visibleEntries.length === 0 ? (
            <p className="text-center py-4 text-xs text-muted-foreground" data-testid="bottom-log-empty">
              No state machine or activity logs recorded yet.
            </p>
          ) : (
            <ol className="divide-y divide-border/40" data-testid="bottom-log-list">
              {[...visibleEntries].reverse().map((entry: LogEntry) => {
                const isError = entry.level === "ERROR";
                const isAction = entry.level === "ACTION";
                return (
                  <li key={entry.id} className="py-1.5 px-2 hover:bg-muted/40 rounded transition-colors">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <time className="text-[10px] text-muted-foreground">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </time>
                      <span
                        className={`text-[9px] font-bold px-1 py-0.2 rounded uppercase ${
                          isError
                            ? "bg-destructive/20 text-destructive border border-destructive/30"
                            : isAction
                              ? "bg-sky-500/20 text-sky-600 dark:text-sky-300 border border-sky-500/30"
                              : "bg-muted text-muted-foreground border border-border"
                        }`}
                      >
                        {entry.level}
                      </span>
                      <span className="text-[11px] font-semibold text-foreground">{entry.category}</span>
                      <span className="text-[11px] text-foreground/90 break-words">{entry.message}</span>
                    </div>
                    {entry.details !== undefined && (
                      <pre className="mt-1 whitespace-pre-wrap break-words rounded bg-background/80 p-1.5 text-[10px] text-muted-foreground border border-border/50">
                        {formatDetails(entry.details)}
                      </pre>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      )}
    </footer>
  );
};
