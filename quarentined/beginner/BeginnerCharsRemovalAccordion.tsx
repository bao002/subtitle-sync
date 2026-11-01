import React from "react";

export interface BeginnerCharsRemovalAccordionProps {
  children: React.ReactNode;
}

export function BeginnerCharsRemovalAccordion({ children }: BeginnerCharsRemovalAccordionProps) {
  return (
    <details
      className="rounded-lg border border-emerald-500/25 bg-emerald-500/5 p-3"
      data-testid="beginner-chars-removal-accordion"
      data-control-category="daily-usage"
    >
      <summary className="cursor-pointer text-xs font-semibold text-foreground">
        Stage 3: Special Characters Removal &amp; Sanitization
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}
