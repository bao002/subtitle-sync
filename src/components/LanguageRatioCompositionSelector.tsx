import React from "react";
import { Sliders, BookmarkCheck } from "lucide-react";
import {
  type LanguageRatioComposition,
  getStoredRatioCompositions,
} from "@/utils/ratioCompositionsManager";

export interface LanguageRatioCompositionSelectorProps {
  activeCompositionId: string;
  onSelectComposition: (composition: LanguageRatioComposition) => void;
  compositions?: LanguageRatioComposition[];
  className?: string;
  compact?: boolean;
}

/**
 * LanguageRatioCompositionSelector
 *
 * An easy dropdown list located next/around the video player that allows users
 * to quickly switch between stored language ratio compositions.
 */
export const LanguageRatioCompositionSelector: React.FC<
  LanguageRatioCompositionSelectorProps
> = ({
  activeCompositionId,
  onSelectComposition,
  compositions: propCompositions,
  className = "",
  compact = false,
}) => {
  const compositions = propCompositions || getStoredRatioCompositions();
  const activeComp =
    compositions.find((c) => c.id === activeCompositionId) || compositions[0];

  return (
    <div
      data-testid="ratio-compositions-selector-container"
      id="ratio-compositions-selector-container"
      className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-border/80 bg-card/85 text-xs shadow-xs backdrop-blur-xs ${className}`}
    >
      <div className="flex items-center gap-1.5 text-muted-foreground shrink-0">
        <Sliders className="h-3.5 w-3.5 text-primary shrink-0" />
        {!compact && (
          <span className="font-semibold text-foreground text-[11px] hidden sm:inline">
            Ratio Composition:
          </span>
        )}
      </div>

      <div className="relative inline-flex items-center">
        <select
          data-testid="ratio-compositions-dropdown"
          id="ratio-compositions-dropdown"
          aria-label="Language ratio compositions dropdown"
          value={activeComp?.id || ""}
          onChange={(e) => {
            const selected = compositions.find((c) => c.id === e.target.value);
            if (selected) {
              onSelectComposition(selected);
            }
          }}
          className="rounded-md border border-input bg-background/95 hover:bg-background px-2.5 py-1 pr-6 text-xs font-medium text-foreground transition-colors shadow-2xs focus:outline-hidden focus:ring-1 focus:ring-primary cursor-pointer max-w-[200px] truncate"
        >
          {compositions.map((comp) => {
            return (
              <option key={comp.id} value={comp.id}>
                {comp.name} {comp.isBuiltIn ? "(Preset)" : "(Custom)"}
              </option>
            );
          })}
        </select>
      </div>

      {activeComp && (
        <span
          data-testid="active-ratio-composition-badge"
          className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 shrink-0 hidden md:inline-flex items-center gap-1"
          title={`Active ratio composition: ${activeComp.name}`}
        >
          <BookmarkCheck className="h-2.5 w-2.5" />
          <span>Active</span>
        </span>
      )}
    </div>
  );
};
