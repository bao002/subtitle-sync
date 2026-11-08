import React, { useState, useEffect, useRef } from "react";
import { AlertTriangle, X, Copy, Trash2, ChevronDown, ChevronUp, Bug, ExternalLink } from "lucide-react";
import { logBuffer, LogEntry, logError, leadToLogRecord, copyAllLogToClipboard } from "@/utils/logBuffer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface FloatingErrorButtonProps {
  className?: string;
  initialErrors?: LogEntry[];
  onErrorsChange?: (errors: LogEntry[]) => void;
}

export const FloatingErrorButton: React.FC<FloatingErrorButtonProps> = ({
  className = "",
  initialErrors,
  onErrorsChange,
}) => {
  const [errors, setErrors] = useState<LogEntry[]>(() => {
    if (initialErrors) return initialErrors;
    return logBuffer.getEntries().filter((e) => e.level === "ERROR");
  });
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expandedErrorId, setExpandedErrorId] = useState<string | null>(null);

  // Position state with default top-right (offset from top bar)
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("yt_floating_error_pos");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (typeof parsed?.x === "number" && typeof parsed?.y === "number") {
            return parsed;
          }
        }
      } catch {
        // ignore
      }
      return {
        x: Math.max(16, window.innerWidth - 80),
        y: 80,
      };
    }
    return { x: 300, y: 80 };
  });

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ clientX: number; clientY: number } | null>(null);
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasMovedRef = useRef(false);

  // Subscribe to logBuffer for new ERROR level logs
  useEffect(() => {
    const updateErrors = () => {
      const allErrors = logBuffer.getEntries().filter((e) => e.level === "ERROR");
      setErrors(allErrors);
      onErrorsChange?.(allErrors);
    };

    const unsubscribe = logBuffer.subscribe(updateErrors);

    // Global uncaught error listener
    const handleGlobalError = (event: ErrorEvent) => {
      logError("GlobalError", event.message || "Uncaught runtime error", {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason instanceof Error ? event.reason.message : String(event.reason);
      logError("UnhandledPromise", reason, { reason: event.reason });
    };

    window.addEventListener("error", handleGlobalError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      unsubscribe();
      window.removeEventListener("error", handleGlobalError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, [onErrorsChange]);

  // Keep clamped to viewport
  const clampPosition = (x: number, y: number) => {
    if (typeof window === "undefined") return { x, y };
    const maxX = Math.max(16, window.innerWidth - 64);
    const maxY = Math.max(16, window.innerHeight - 64);
    return {
      x: Math.min(maxX, Math.max(16, x)),
      y: Math.min(maxY, Math.max(16, y)),
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    dragStartRef.current = { clientX: e.clientX, clientY: e.clientY };
    startPosRef.current = { ...position };
    hasMovedRef.current = false;
    isDraggingRef.current = true;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !dragStartRef.current) return;
      const dx = e.clientX - dragStartRef.current.clientX;
      const dy = e.clientY - dragStartRef.current.clientY;
      if (Math.hypot(dx, dy) > 8) {
        hasMovedRef.current = true;
      }
      setPosition(clampPosition(startPosRef.current.x + dx, startPosRef.current.y + dy));
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        dragStartRef.current = null;
        try {
          localStorage.setItem("yt_floating_error_pos", JSON.stringify(position));
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [position]);

  const handleClearErrors = () => {
    // Remove ERROR entries from buffer or clear
    logBuffer.clear();
    setErrors([]);
    setIsOpen(false);
  };

  const handleCopyErrors = () => {
    const text = errors
      .map(
        (err) =>
          `[${err.formattedTime}] [${err.category}] ${err.message}${
            err.stack ? `\nStack: ${err.stack}` : ""
          }${err.details ? `\nDetails: ${JSON.stringify(err.details, null, 2)}` : ""}`,
      )
      .join("\n\n---\n\n");
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyAllLogs = async () => {
    await copyAllLogToClipboard();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeadToLog = (entryId?: string) => {
    leadToLogRecord(entryId);
    setIsOpen(false);
  };

  // Only render when errors exist
  if (errors.length === 0) {
    return null;
  }

  const latestError = errors[errors.length - 1];

  return (
    <>
      <div
        data-testid="floating-error-button-container"
        role="region"
        aria-label="Floating Error Notification"
        style={{
          position: "fixed",
          left: `${position.x}px`,
          top: `${position.y}px`,
          touchAction: "none",
          zIndex: 9998,
        }}
        className={`select-none ${className}`}
        onMouseDown={handleMouseDown}
      >
        <button
          type="button"
          data-testid="floating-error-button"
          data-action="floating-alert-button"
          aria-label={`Open error inspector: ${errors.length} active error${errors.length > 1 ? "s" : ""}`}
          title={`Error rising: ${errors.length} error${errors.length > 1 ? "s" : ""}. Latest: ${latestError?.message}. Click to inspect in log.`}
          onClick={(e) => {
            if (hasMovedRef.current) {
              e.preventDefault();
              return;
            }
            // Lead directly to universal log element and open inspector modal
            if (latestError) {
              leadToLogRecord(latestError.id);
            } else {
              leadToLogRecord();
            }
            setIsOpen(true);
          }}
          className="relative flex h-12 w-12 items-center justify-center rounded-full border-2 border-rose-500 bg-rose-600 text-white shadow-2xl shadow-rose-500/50 hover:bg-rose-700 active:scale-95 transition-transform duration-150 animate-bounce"
        >
          <AlertTriangle className="h-6 w-6 fill-current text-white shrink-0" />
          <span
            data-testid="floating-error-count-badge"
            className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-rose-700 text-[10px] font-bold shadow-md border border-rose-300"
          >
            {errors.length > 99 ? "99+" : errors.length}
          </span>
        </button>
      </div>

      {/* Error Details Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          data-testid="floating-error-modal"
          className="max-w-2xl max-h-[85vh] flex flex-col bg-card border-rose-500/40 text-card-foreground shadow-2xl p-4 sm:p-6"
        >
          <DialogHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <DialogTitle className="text-sm font-semibold flex items-center gap-2">
                <span>Application Errors Rising</span>
                <span className="rounded-full bg-rose-500/20 text-rose-700 dark:text-rose-300 px-2 py-0.5 text-xs font-mono font-bold">
                  {errors.length}
                </span>
              </DialogTitle>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Button
                type="button"
                variant="default"
                size="sm"
                data-testid="copy-all-log-clipboard-btn"
                onClick={() => void handleCopyAllLogs()}
                className="h-7 px-2.5 text-xs gap-1.5 bg-rose-600 hover:bg-rose-700 text-white"
                title="Copy all activity log, timestamps, state machine actions and reproduction data to clipboard"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>{copied ? "Copied All!" : "Copy All Log"}</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                data-testid="lead-to-log-element-btn"
                onClick={() => handleLeadToLog(latestError?.id)}
                className="h-7 px-2.5 text-xs gap-1.5 text-primary border-primary/40 hover:bg-primary/10"
                title="Lead to bottom log viewer element and inspect focused record"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Inspect in Log</span>
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                data-testid="clear-floating-errors-btn"
                onClick={handleClearErrors}
                className="h-7 px-2.5 text-xs gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear</span>
              </Button>
            </div>
          </DialogHeader>

          {/* Errors List */}
          <div className="flex-1 overflow-y-auto space-y-2.5 py-3 pr-1 text-xs">
            {errors.map((err, idx) => {
              const isExpanded = expandedErrorId === err.id;
              return (
                <div
                  key={err.id || idx}
                  data-testid="floating-error-item"
                  className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3 space-y-1.5 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                      <span className="font-mono text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                        {err.formattedTime}
                      </span>
                      <span className="font-semibold text-rose-700 dark:text-rose-300">
                        [{err.category}]
                      </span>
                      <span className="font-medium text-foreground break-words">{err.message}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        data-testid="btn-lead-to-log-record"
                        onClick={() => handleLeadToLog(err.id)}
                        className="px-2 py-0.5 text-[10px] bg-primary/10 text-primary hover:bg-primary/20 rounded font-medium flex items-center gap-1"
                        title="Inspect in bottom log viewer with stack trace and state sequence"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>Inspect in Log</span>
                      </button>
                      {(err.details || err.stack) && (
                        <button
                          type="button"
                          onClick={() => setExpandedErrorId(isExpanded ? null : err.id)}
                          className="p-1 text-muted-foreground hover:text-foreground shrink-0"
                          title={isExpanded ? "Collapse details" : "Expand details"}
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="space-y-1.5 mt-2">
                      {err.stack && (
                        <div>
                          <div className="text-[10px] font-semibold text-rose-600 dark:text-rose-400">Stack Trace:</div>
                          <pre className="mt-0.5 rounded bg-rose-950/20 text-rose-300 p-2 font-mono text-[10px] overflow-x-auto max-h-36 whitespace-pre-wrap border border-rose-500/20">
                            {err.stack}
                          </pre>
                        </div>
                      )}
                      {err.details && (
                        <div>
                          <div className="text-[10px] font-semibold text-muted-foreground">Details:</div>
                          <pre className="mt-0.5 rounded bg-muted/80 p-2 font-mono text-[10px] text-muted-foreground overflow-x-auto max-h-40 whitespace-pre-wrap">
                            {typeof err.details === "string"
                              ? err.details
                              : JSON.stringify(err.details, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FloatingErrorButton;
