import { useEffect, useState, useSyncExternalStore } from "react";
import { Activity, AlertTriangle, Check, Copy, Trash2, X } from "lucide-react";
import {
  copyErrorOnlyToClipboard,
  copyLogAroundErrorToClipboard,
  getLogEntriesSnapshot,
  logBuffer,
  subscribeToLogEntries,
} from "@/utils/logBuffer";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

function formatDetails(details: unknown): string {
  if (typeof details === "string") return details;
  try {
    return JSON.stringify(details, null, 2);
  } catch {
    return String(details);
  }
}

export function StateMachineActionLogsInspector({ isOpen, onClose }: Props) {
  const entries = useSyncExternalStore(
    subscribeToLogEntries,
    getLogEntriesSnapshot,
    getLogEntriesSnapshot,
  );
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [copiedErrorAction, setCopiedErrorAction] = useState<string | null>(null);
  const [filterLevel] = useState<"ALL" | "ACTIONS_ERRORS">("ALL");
  const visibleEntries = entries.filter((entry) => {
    if (filterLevel === "ACTIONS_ERRORS") {
      return entry.level === "ACTION" || entry.level === "ERROR";
    }
    return true;
  });

  const errorEntries = entries.filter((entry) => entry.level === "ERROR");
  const hasErrors = errorEntries.length > 0;
  const latestError = hasErrors ? errorEntries[errorEntries.length - 1] : null;

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    setCopyStatus("idle");
    setCopiedErrorAction(null);
  }, [isOpen]);

  if (!isOpen) return null;

  const markCopiedErrorAction = (key: string) => {
    setCopiedErrorAction(key);
    setTimeout(() => {
      setCopiedErrorAction((prev) => (prev === key ? null : prev));
    }, 2200);
  };

  const handleCopyErrorOnly = async (errorId?: string) => {
    const key = errorId ? `error-only:${errorId}` : "error-only:header";
    try {
      const ok = await copyErrorOnlyToClipboard(errorId);
      if (!ok) {
        await navigator.clipboard.writeText(logBuffer.formatOnlyErrorLogs(errorId));
      }
      markCopiedErrorAction(key);
    } catch {
      setCopyStatus("failed");
    }
  };

  const handleCopyAroundError = async (errorId?: string) => {
    const key = errorId ? `around-error:${errorId}` : "around-error:header";
    try {
      const ok = await copyLogAroundErrorToClipboard(errorId);
      if (!ok) {
        await navigator.clipboard.writeText(logBuffer.formatLogAroundError(errorId));
      }
      markCopiedErrorAction(key);
    } catch {
      setCopyStatus("failed");
    }
  };

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(logBuffer.copyAll());
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
  };

  return (
    <div
      id="state-machine-action-logs-modal"
      data-testid="state-machine-action-logs-modal"
      className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center p-0 sm:p-5 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="state-machine-action-logs-title"
        className="w-full max-w-5xl h-[100dvh] sm:h-[85vh] bg-neutral-900 border-0 sm:border sm:border-neutral-800 sm:rounded-xl shadow-2xl flex flex-col overflow-hidden text-neutral-200 pb-[env(safe-area-inset-bottom)]"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-neutral-950/90 border-b border-neutral-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Activity className="w-5 h-5 text-sky-400 shrink-0" />
            <div className="min-w-0">
              <h2 id="state-machine-action-logs-title" className="text-sm font-semibold text-white">
                State Machine Actions
              </h2>
              <p className="text-xs text-neutral-400">
                {visibleEntries.length} action and error records
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {hasErrors && (
              <>
                <button
                  type="button"
                  data-testid="state-machine-copy-error-only-button"
                  onClick={() => void handleCopyErrorOnly(latestError?.id)}
                  className="inline-flex items-center gap-1.5 min-h-9 px-2.5 rounded-md border border-red-800/70 bg-red-950/50 hover:bg-red-900/60 text-red-200 text-xs font-medium"
                  title="Copy only the error log without surrounding logs"
                >
                  {copiedErrorAction === `error-only:${latestError?.id}` ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {copiedErrorAction === `error-only:${latestError?.id}`
                      ? "Copied Error!"
                      : "Copy Error Only"}
                  </span>
                </button>
                <button
                  type="button"
                  data-testid="state-machine-copy-around-error-button"
                  onClick={() => void handleCopyAroundError(latestError?.id)}
                  className="inline-flex items-center gap-1.5 min-h-9 px-2.5 rounded-md border border-amber-700/70 bg-amber-950/40 hover:bg-amber-900/50 text-amber-200 text-xs font-medium"
                  title="Copy only the log window around the error (not all logs)"
                >
                  {copiedErrorAction === `around-error:${latestError?.id}` ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {copiedErrorAction === `around-error:${latestError?.id}`
                      ? "Copied Context!"
                      : "Copy Around Error"}
                  </span>
                </button>
              </>
            )}
            <button
              type="button"
              data-testid="copy-all-action-logs-button"
              onClick={() => void handleCopyAll()}
              className="inline-flex items-center gap-2 min-h-9 px-3 rounded-md bg-sky-700 hover:bg-sky-600 text-white text-xs font-medium"
              title="Copy all diagnostic logs, including errors"
            >
              {copyStatus === "copied" ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              <span>{copyStatus === "copied" ? "Copied" : "Copy All Logs"}</span>
            </button>
            <button
              type="button"
              data-testid="clear-action-logs-button"
              onClick={() => logBuffer.clear()}
              disabled={entries.length === 0}
              className="inline-flex items-center justify-center min-h-9 min-w-9 rounded-md text-neutral-300 hover:bg-neutral-800 disabled:opacity-40"
              title="Clear all diagnostic logs"
              aria-label="Clear all diagnostic logs"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center min-h-9 min-w-9 rounded-md text-neutral-300 hover:bg-neutral-800"
              title="Close action logs"
              aria-label="Close action logs"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {copyStatus === "failed" && (
          <p className="px-4 py-2 text-xs text-red-300 bg-red-950/40" role="status">
            Clipboard access failed. Allow clipboard access and try again.
          </p>
        )}

        <div className="flex-1 min-h-0 overflow-y-auto">
          {visibleEntries.length === 0 ? (
            <p className="px-5 py-8 text-sm text-neutral-400" data-testid="empty-action-logs">
              No state-machine actions or errors have been recorded.
            </p>
          ) : (
            <ol className="divide-y divide-neutral-800" data-testid="action-log-list">
              {[...visibleEntries].reverse().map((entry) => {
                const isError = entry.level === "ERROR";
                return (
                  <li key={entry.id} className="grid grid-cols-[auto_1fr] gap-3 px-4 py-3">
                    <span
                      className={`mt-0.5 inline-flex items-center justify-center w-7 h-7 rounded-md ${
                        isError ? "bg-red-950/70 text-red-300" : "bg-sky-950/70 text-sky-300"
                      }`}
                      aria-label={isError ? "Error" : "Action"}
                    >
                      {isError ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : (
                        <Activity className="w-4 h-4" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                          <time
                            className="font-mono text-[11px] text-neutral-400"
                            dateTime={new Date(entry.timestamp).toISOString()}
                          >
                            {new Date(entry.timestamp).toISOString()}
                          </time>
                          <span
                            className={`text-[10px] font-bold uppercase ${
                              isError ? "text-red-300" : "text-sky-300"
                            }`}
                          >
                            {entry.level}
                          </span>
                          <span className="text-[11px] text-neutral-500">{entry.category}</span>
                        </div>
                        {isError && (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              data-testid={`state-machine-copy-error-only-${entry.id}`}
                              onClick={() => void handleCopyErrorOnly(entry.id)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-red-800/70 bg-red-950/40 hover:bg-red-900/50 text-[11px] text-red-200 font-medium"
                              title="Copy only this error log"
                            >
                              {copiedErrorAction === `error-only:${entry.id}` ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span>Copied Error!</span>
                                </>
                              ) : (
                                <>
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>Copy Error Only</span>
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              data-testid={`state-machine-copy-around-error-${entry.id}`}
                              onClick={() => void handleCopyAroundError(entry.id)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-amber-700/70 bg-amber-950/40 hover:bg-amber-900/50 text-[11px] text-amber-200 font-medium"
                              title="Copy only the log window around this error"
                            >
                              {copiedErrorAction === `around-error:${entry.id}` ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span>Copied Context!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy Around Error</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-neutral-100 break-words">{entry.message}</p>
                      {entry.details !== undefined && (
                        <pre className="mt-2 whitespace-pre-wrap break-words rounded-md bg-neutral-950/70 p-2 text-[11px] leading-relaxed text-neutral-300">
                          {formatDetails(entry.details)}
                        </pre>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </section>
    </div>
  );
}
