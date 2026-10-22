import React, { useEffect, useRef, useState } from "react";
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Check,
  RotateCcw,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { type ParserDiffResult } from "@/utils/parserDiffHelper";

export interface ParserRealtimeSimulationProps {
  diffResult: ParserDiffResult | null;
  baseLanguage?: string;
  onApply?: () => void;
  onRevert?: () => void;
  isSimulating?: boolean;
}

export const ParserRealtimeSimulation: React.FC<ParserRealtimeSimulationProps> = ({
  diffResult,
  baseLanguage = "en",
  onApply,
  onRevert,
  isSimulating = false,
}) => {
  const [activeDiffIndex, setActiveDiffIndex] = useState(0);
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const diffCardRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const totalChanges = diffResult?.totalChanges ?? 0;
  const changedRecords = diffResult?.changedRecords ?? [];

  // Reset or clamp index when changes update
  useEffect(() => {
    if (activeDiffIndex >= totalChanges && totalChanges > 0) {
      setActiveDiffIndex(0);
    }
  }, [totalChanges, activeDiffIndex]);

  // Auto-scroll to active diff appearance
  useEffect(() => {
    if (!autoScroll || totalChanges === 0) return;
    const targetElement = diffCardRefs.current[activeDiffIndex];
    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest",
      });
    }
  }, [activeDiffIndex, autoScroll, totalChanges]);

  if (!diffResult) return null;

  const handleNextDiff = () => {
    if (totalChanges <= 0) return;
    setActiveDiffIndex((prev) => (prev + 1) % totalChanges);
  };

  const handlePrevDiff = () => {
    if (totalChanges <= 0) return;
    setActiveDiffIndex((prev) => (prev - 1 + totalChanges) % totalChanges);
  };

  return (
    <div
      data-testid="parser-realtime-simulation"
      className="rounded-xl border border-primary/30 bg-primary/5 p-3.5 space-y-3 transition-all"
    >
      {/* Simulation Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-primary/20 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-foreground">
                Real-time Diff Simulation
              </span>
              <Badge
                variant={totalChanges > 0 ? "default" : "secondary"}
                data-testid="diff-count-badge"
                className="text-[10px] h-4 px-1.5 py-0"
              >
                {totalChanges} {totalChanges === 1 ? "differing section" : "differing sections"}
              </Badge>
              {isSimulating && (
                <span className="text-[10px] text-primary animate-pulse font-medium">
                  Live Preview
                </span>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground">
              Showing strictly the sections where your parser settings make a difference.
            </p>
          </div>
        </div>

        {/* Stepper & Auto-scroll Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <label
            data-testid="auto-scroll-diff-label"
            className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer select-none"
            title="Automatically scroll to the next difference appearance"
          >
            <input
              type="checkbox"
              data-testid="auto-scroll-diff-toggle"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="h-3 w-3 rounded border-border text-primary focus:ring-primary cursor-pointer"
            />
            <span>Auto-scroll</span>
          </label>

          {totalChanges > 0 && (
            <div className="flex items-center gap-1">
              <span
                data-testid="diff-active-indicator"
                className="text-[10px] font-mono text-muted-foreground px-1"
              >
                {activeDiffIndex + 1} of {totalChanges}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePrevDiff}
                data-testid="prev-diff-btn"
                className="h-6 w-6 p-0 text-xs"
                title="Previous difference"
                aria-label="Previous difference"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleNextDiff}
                data-testid="next-diff-btn"
                className="h-6 w-6 p-0 text-xs"
                title="Next difference (auto-scrolls)"
                aria-label="Next difference"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          {onApply && (
            <Button
              type="button"
              size="sm"
              onClick={onApply}
              data-testid="btn-apply-parser-simulation"
              className="h-6 text-xs px-2.5 bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
            >
              <Check className="h-3 w-3 mr-1" />
              Apply
            </Button>
          )}

          {onRevert && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRevert}
              data-testid="btn-revert-parser-simulation"
              className="h-6 text-xs px-2 text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Revert
            </Button>
          )}
        </div>
      </div>

      {/* Differing Sections Display Only */}
      <div
        ref={scrollContainerRef}
        data-testid="diff-sections-only"
        className="max-h-72 overflow-y-auto space-y-2 pr-1"
      >
        {totalChanges === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground italic rounded-lg border border-border/50 bg-background/50">
            All subtitle sections are identical under current settings (no difference found).
          </div>
        ) : (
          changedRecords.map((diff, idx) => {
            const isActive = idx === activeDiffIndex;
            return (
              <div
                key={diff.id || idx}
                id={`diff-section-${idx}`}
                data-testid={`diff-section-${idx}`}
                data-active={isActive ? "true" : "false"}
                ref={(el) => {
                  diffCardRefs.current[idx] = el;
                }}
                onClick={() => setActiveDiffIndex(idx)}
                className={`rounded-lg border p-2.5 transition-all text-xs cursor-pointer ${
                  isActive
                    ? "border-primary bg-background shadow-xs ring-1 ring-primary/40"
                    : "border-border/70 bg-card hover:bg-muted/40 opacity-80 hover:opacity-100"
                }`}
              >
                {/* Diff Header */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono text-[10px] font-bold text-primary px-1.5 py-0.5 rounded bg-primary/10">
                      Diff #{idx + 1}
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono h-4 px-1.5 py-0">
                      <Clock className="h-2.5 w-2.5 mr-1" />
                      {diff.timeRange.formatted}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="text-[10px] capitalize h-4 px-1.5 py-0 font-normal"
                    >
                      {diff.changeType}
                    </Badge>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{diff.description}</span>
                </div>

                {/* Before vs After Side-by-Side Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  {/* Before */}
                  <div className="rounded border border-amber-500/20 bg-amber-500/5 p-2 space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                      <span>BEFORE ({diff.beforeRecords.length} records)</span>
                    </div>
                    <div className="space-y-1 font-sans text-foreground/90">
                      {diff.beforeRecords.map((r, rIdx) => (
                        <div key={rIdx} className="text-[11px] leading-relaxed">
                          <span className="font-mono text-[9px] text-muted-foreground mr-1">
                            [{r.formattedTime}]
                          </span>
                          <span>{r.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* After */}
                  <div className="rounded border border-emerald-500/20 bg-emerald-500/5 p-2 space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                      <span>AFTER ({diff.afterRecords.length} records)</span>
                      <ArrowRight className="h-3 w-3" />
                    </div>
                    <div className="space-y-1 font-sans text-foreground/90">
                      {diff.afterRecords.map((r, rIdx) => (
                        <div key={rIdx} className="text-[11px] leading-relaxed">
                          <span className="font-mono text-[9px] text-muted-foreground mr-1">
                            [{r.formattedTime}]
                          </span>
                          <span className="font-medium text-emerald-800 dark:text-emerald-200">
                            {r.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
