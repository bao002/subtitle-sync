import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Columns2, Pin, PinOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type PanelId, ACCORDION_THEMES } from "@/config/accordionThemes";

const ACCORDION_AUTO_FOLD_MS = 5_000;

export interface AccordionSectionProps {
  id: PanelId;
  title: string;
  videoId?: string;
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  wide?: boolean;
  onToggleWide?: () => void;
}

export function AccordionSection({
  id,
  title,
  videoId,
  children,
  open,
  onOpenChange,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  wide = false,
  onToggleWide,
}: AccordionSectionProps) {
  const theme = ACCORDION_THEMES[id] || {
    borderLeft: "border-l-4 border-l-neutral-500",
    summaryBg: "bg-muted/30 hover:bg-muted/50",
    badgeBg: "bg-neutral-500/20 text-neutral-600 dark:text-neutral-300 border-neutral-500/30",
    dotBg: "bg-neutral-500",
    tagColor: "neutral",
  };
  // Auto-fold an open, unpinned section after five seconds without interaction.
  const pinKey = `yt_accordion_pinned_${id}`;
  const [pinned, setPinned] = useState(false);
  useEffect(() => {
    try {
      setPinned(localStorage.getItem(pinKey) === "1");
    } catch {
      // ignore storage errors
    }
  }, [pinKey]);
  const [activityTick, setActivityTick] = useState(0);
  useEffect(() => {
    if (!open || pinned) return;
    const timer = window.setTimeout(() => onOpenChange(false), ACCORDION_AUTO_FOLD_MS);
    return () => window.clearTimeout(timer);
  }, [open, pinned, activityTick, onOpenChange]);
  const markActivity = () => setActivityTick((t) => t + 1);
  const togglePinned = () => {
    setPinned((p) => {
      try {
        localStorage.setItem(pinKey, p ? "0" : "1");
      } catch {
        // ignore storage errors
      }
      return !p;
    });
  };

  return (
    <details
      data-panel={title.toLowerCase().replace(/\s+/g, "-")}
      data-panel-id={id}
      data-accordion-type={id}
      data-accordion-color={theme.tagColor}
      data-video-id={videoId}
      open={open}
      onPointerDown={markActivity}
      onKeyDown={markActivity}
      onFocus={markActivity}
      onToggle={(event) => onOpenChange(event.currentTarget.open)}
      className={`overflow-hidden rounded-lg border border-border bg-card text-sm ${theme.borderLeft} ${wide ? "lg:col-span-2" : ""}`}
    >
      <summary
        data-testid={`accordion-bar-${id}`}
        className={`flex cursor-pointer list-none items-center gap-1 px-3 py-1 marker:hidden transition-colors ${theme.summaryBg}`}
      >
        <ChevronDown
          aria-hidden="true"
          className={`size-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
        <h2 className="mr-auto text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-2">
          <span>{title}</span>
          <span
            data-testid={`accordion-color-badge-${id}`}
            className={`inline-block size-2 rounded-full ${theme.dotBg}`}
            aria-hidden="true"
          />
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          data-testid={`accordion-pin-${id}`}
          aria-pressed={pinned}
          onClick={(event) => {
            event.preventDefault();
            togglePinned();
          }}
          aria-label={pinned ? `Unpin ${title} (allow auto-fold)` : `Pin ${title} open`}
          title={pinned ? "Pinned: stays open" : "Pin to keep open (otherwise folds automatically)"}
          className={pinned ? "text-primary" : "text-muted-foreground"}
        >
          {pinned ? <Pin aria-hidden="true" /> : <PinOff aria-hidden="true" />}
        </Button>
        {onToggleWide && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            data-testid={`accordion-width-${id}`}
            aria-label={wide ? `Set ${title} to half width` : `Set ${title} to full width`}
            title={wide ? "Set to half width" : "Set to full width"}
            onClick={(event) => {
              event.preventDefault();
              onToggleWide();
            }}
          >
            <Columns2 aria-hidden="true" />
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={!canMoveUp}
          onClick={(event) => {
            event.preventDefault();
            onMoveUp();
          }}
          aria-label={`Move ${title} earlier`}
          title={`Move ${title} earlier`}
        >
          <ChevronUp aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={!canMoveDown}
          onClick={(event) => {
            event.preventDefault();
            onMoveDown();
          }}
          aria-label={`Move ${title} later`}
          title={`Move ${title} later`}
        >
          <ChevronDown aria-hidden="true" />
        </Button>
      </summary>
      <div className="border-t border-border p-2 sm:p-3">{children}</div>
    </details>
  );
}
