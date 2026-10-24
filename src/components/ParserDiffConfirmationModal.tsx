import React, { useState, useEffect } from "react";
import {
  AlertCircle,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Columns,
  Layers,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  type ParserDiffResult,
  type ChangedRecordDiff,
  getNextChangeIndex,
  getPrevChangeIndex,
} from "@/utils/parserDiffHelper";

export interface ParserDiffConfirmationModalProps {
  isOpen: boolean;
  inline?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  diffResult: ParserDiffResult | null;
  proposedCriteriaNames: string[];
}

export function ParserDiffConfirmationModal({
  isOpen,
  inline = false,
  onClose,
  onConfirm,
  diffResult,
  proposedCriteriaNames,
}: ParserDiffConfirmationModalProps) {
  const [selectedChangeIdx, setSelectedChangeIdx] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setSelectedChangeIdx(0);
    }
  }, [isOpen]);

  if (!isOpen || !diffResult) return null;

  const totalChanges = diffResult.totalChanges;
  const currentDiff: ChangedRecordDiff | undefined = diffResult.changedRecords[selectedChangeIdx];

  const handleNext = () => {
    setSelectedChangeIdx((prev) => getNextChangeIndex(prev, totalChanges));
  };

  const handlePrev = () => {
    setSelectedChangeIdx((prev) => getPrevChangeIndex(prev, totalChanges));
  };

  const body = (
    <div
      className={
        inline
          ? "relative w-full max-w-3xl"
          : "relative w-full max-w-3xl rounded-xl border border-border bg-card shadow-2xl text-card-foreground my-8 flex flex-col max-h-[90vh]"
      }
      data-testid={inline ? "parser-diff-inline-review" : undefined}
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Layers className="h-4 w-4" />
            </span>
            <h2 id="parser-diff-dialog-title" className="text-base font-semibold text-foreground">
              Confirm Parser Settings Change
            </h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Review how the proposed criteria impact sentence boundaries before applying.
          </p>
        </div>
        {!inline && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            data-testid="btn-parser-diff-close"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="bg-muted/40 border-b border-border px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-muted-foreground">Proposed Active Criteria:</span>
          <div className="flex flex-wrap gap-1">
            {proposedCriteriaNames.map((name) => (
              <span
                key={name}
                className="rounded border border-primary/20 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <span>Total rows:</span>
          <span className="font-mono font-medium text-foreground">
            {diffResult.totalBefore} → {diffResult.totalAfter}
          </span>
          <span className="text-muted-foreground/60">·</span>
          <span className="font-medium text-amber-600 dark:text-amber-400">
            {totalChanges} changed record {totalChanges === 1 ? "group" : "groups"}
          </span>
        </div>
      </div>

      <div className="p-5 overflow-y-auto flex-1 space-y-4">
        {totalChanges === 0 ? (
          <div
            data-testid="parser-diff-empty-state"
            className="rounded-lg border border-border bg-background p-6 text-center space-y-2"
          >
            <Check className="mx-auto h-8 w-8 text-emerald-500" />
            <p className="font-medium text-sm text-foreground">No Subtitle Changes Detected</p>
            <p className="text-xs text-muted-foreground">
              The proposed parser options yield identical sentence divisions to the current
              settings.
            </p>
          </div>
        ) : currentDiff ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border bg-background p-2.5">
              <div className="flex items-center gap-2">
                <span
                  data-testid="parser-diff-stepper-label"
                  className="text-xs font-semibold text-foreground"
                >
                  Changed Record {selectedChangeIdx + 1} of {totalChanges}
                </span>
                <span
                  data-testid="parser-diff-type-badge"
                  className={`rounded px-2 py-0.5 text-[10px] uppercase tracking-wide font-semibold border ${
                    currentDiff.changeType === "split"
                      ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30"
                      : currentDiff.changeType === "merged"
                        ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30"
                        : currentDiff.changeType === "timing"
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                          : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                  }`}
                >
                  {currentDiff.changeType}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                  <Clock className="h-3 w-3" />
                  {currentDiff.timeRange.formatted}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={totalChanges <= 1}
                  onClick={handlePrev}
                  data-testid="btn-parser-diff-prev"
                  className="h-7 px-2.5 text-xs flex items-center gap-1"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Previous</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={totalChanges <= 1}
                  onClick={handleNext}
                  data-testid="btn-parser-diff-next"
                  className="h-7 px-2.5 text-xs flex items-center gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <p
              data-testid="parser-diff-description"
              className="text-xs font-medium text-foreground bg-primary/5 border border-primary/15 rounded-md px-3 py-2"
            >
              {currentDiff.description}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div
                data-testid="parser-diff-before-card"
                className="rounded-lg border border-border bg-background p-3.5 space-y-2.5"
              >
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Current Settings (Before)
                  </span>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {currentDiff.beforeRecords.length} record(s)
                  </span>
                </div>

                {currentDiff.beforeRecords.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">None</p>
                ) : (
                  <div className="space-y-2">
                    {currentDiff.beforeRecords.map((item, idx) => (
                      <div
                        key={`before-${item.index}-${idx}`}
                        className="rounded-md border border-border/80 bg-muted/20 p-2 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                          <span>Row #{item.index + 1}</span>
                          <span>{item.formattedTime}</span>
                        </div>
                        <p className="text-foreground leading-relaxed">
                          {item.text || "(empty text)"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div
                data-testid="parser-diff-after-card"
                className="rounded-lg border border-primary/40 bg-primary/5 p-3.5 space-y-2.5 shadow-xs"
              >
                <div className="flex items-center justify-between border-b border-primary/20 pb-2">
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-primary" />
                    Proposed Settings (After)
                  </span>
                  <span className="text-[11px] text-primary font-mono font-medium">
                    {currentDiff.afterRecords.length} record(s)
                  </span>
                </div>

                {currentDiff.afterRecords.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">None</p>
                ) : (
                  <div className="space-y-2">
                    {currentDiff.afterRecords.map((item, idx) => (
                      <div
                        key={`after-${item.index}-${idx}`}
                        className="rounded-md border border-primary/30 bg-background p-2 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-[10px] text-primary font-mono font-medium">
                          <span>Row #{item.index + 1}</span>
                          <span>{item.formattedTime}</span>
                        </div>
                        <p className="text-foreground font-medium leading-relaxed">
                          {item.text || "(empty text)"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {totalChanges > 1 && (
              <div className="pt-2 border-t border-border space-y-2">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Direct jump to changed record:</span>
                  <span>Click any slot to inspect</span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-muted/20 rounded border border-border">
                  {diffResult.changedRecords.map((change, idx) => (
                    <button
                      key={change.id}
                      type="button"
                      onClick={() => setSelectedChangeIdx(idx)}
                      data-testid={`btn-parser-diff-jump-${idx}`}
                      className={`rounded px-2 py-0.5 text-[11px] font-mono transition-all ${
                        idx === selectedChangeIdx
                          ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                          : "bg-background text-foreground border border-border hover:bg-muted"
                      }`}
                      title={`${change.changeType} @ ${change.timeRange.formatted}: ${change.description}`}
                    >
                      #{idx + 1} ({change.timeRange.formatted})
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/20 px-5 py-3.5">
        <p className="text-xs text-muted-foreground">
          Applying resets ongoing audio playback and recalculates parallel sentence alignments.
        </p>
        <div className="flex items-center gap-2">
          {!inline && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              data-testid="btn-parser-diff-cancel"
              className="text-xs"
            >
              Cancel / Keep Current
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            onClick={onConfirm}
            data-testid="btn-parser-diff-apply"
            className="text-xs bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5"
          >
            <Check className="h-3.5 w-3.5" />
            <span>{inline ? "Apply review" : "Confirm & Apply Settings"}</span>
          </Button>
        </div>
      </div>
    </div>
  );

  return inline ? (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="parser-diff-dialog-title"
      data-testid="parser-diff-inline-review-container"
      className="rounded-xl border border-border bg-card p-2 shadow-sm"
    >
      {body}
    </div>
  ) : (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="parser-diff-dialog-title"
      data-testid="parser-diff-confirmation-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
    >
      {body}
    </div>
  );
}
