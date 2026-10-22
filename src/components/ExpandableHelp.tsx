import React, { useState } from "react";
import { HelpCircle, ChevronDown, ChevronUp, Info } from "lucide-react";

export interface ExpandableHelpProps {
  /**
   * Optional title to display next to the expand button.
   * If omitted, renders as an inline icon trigger.
   */
  title?: React.ReactNode;
  /**
   * Leading icon displayed before title.
   */
  icon?: React.ReactNode;
  /**
   * Explanatory text or elements revealed when expanded.
   */
  content: React.ReactNode;
  /**
   * Initial expanded state. Default is false (collapsed).
   */
  defaultExpanded?: boolean;
  /**
   * Visual presentation mode:
   * - "inline": Subtle inline icon button next to an existing label.
   * - "row": Full row with icon, title, and right-aligned expand button.
   * - "pill": Compact button pill trigger.
   */
  mode?: "inline" | "row" | "pill";
  /**
   * Custom tooltip for the trigger button.
   */
  tooltip?: string;
  testId?: string;
  btnTestId?: string;
  textTestId?: string;
  className?: string;
}

/**
 * ExpandableHelp
 * Progressive disclosure component that replaces verbose static text paragraphs
 * with concise titles/icons and a click-to-expand explanation button.
 */
export const ExpandableHelp: React.FC<ExpandableHelpProps> = ({
  title,
  icon,
  content,
  defaultExpanded = false,
  mode = title ? "row" : "inline",
  tooltip = "More info & explanation",
  testId,
  btnTestId,
  textTestId,
  className = "",
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);

  if (mode === "inline") {
    return (
      <span className={`inline-flex items-center align-middle ${className}`} data-testid={testId}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded((prev) => !prev);
          }}
          data-testid={btnTestId}
          aria-expanded={isExpanded}
          title={isExpanded ? "Collapse explanation" : tooltip}
          className="ml-1.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-border/80 bg-muted/60 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors text-[10px] font-semibold active:scale-95"
        >
          {isExpanded ? (
            <ChevronUp className="h-2.5 w-2.5" />
          ) : (
            <HelpCircle className="h-2.5 w-2.5 text-primary/70" />
          )}
          <span className="sr-only">{tooltip}</span>
        </button>

        {isExpanded && (
          <span
            data-testid={textTestId}
            className="mt-1 block w-full rounded-md border border-border/60 bg-muted/40 p-2 text-[11px] leading-relaxed text-muted-foreground animate-in fade-in duration-150"
          >
            {content}
          </span>
        )}
      </span>
    );
  }

  if (mode === "pill") {
    return (
      <div className={`space-y-1.5 ${className}`} data-testid={testId}>
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          data-testid={btnTestId}
          aria-expanded={isExpanded}
          title={tooltip}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition active:scale-95 shadow-2xs"
        >
          {icon}
          {title && <span>{title}</span>}
          {isExpanded ? (
            <ChevronUp className="h-3 w-3 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          )}
        </button>
        {isExpanded && (
          <div
            data-testid={textTestId}
            className="rounded-lg border border-border/60 bg-muted/30 p-2.5 text-[11px] leading-relaxed text-muted-foreground animate-in fade-in duration-150"
          >
            {content}
          </div>
        )}
      </div>
    );
  }

  // mode === "row"
  return (
    <div className={`space-y-1.5 ${className}`} data-testid={testId}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {icon}
          {title && (
            <span className="text-xs font-semibold text-foreground truncate">{title}</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          data-testid={btnTestId}
          aria-expanded={isExpanded}
          title={isExpanded ? "Hide details" : tooltip}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline transition-colors shrink-0 px-1 py-0.5"
        >
          <span>{isExpanded ? "Hide Details" : "Learn More"}</span>
          {isExpanded ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </button>
      </div>
      {isExpanded && (
        <div
          data-testid={textTestId}
          className="rounded-lg border border-primary/20 bg-primary/5 p-2.5 text-[11px] leading-relaxed text-muted-foreground animate-in fade-in duration-150"
        >
          {content}
        </div>
      )}
    </div>
  );
};
