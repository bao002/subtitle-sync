import React from "react";
import { Sparkles, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface ModeSwitcherHeaderProps {
  currentMode: "beginner" | "expert";
  onModeChange: (mode: "beginner" | "expert") => void;
  className?: string;
}

export const ModeSwitcherHeader: React.FC<ModeSwitcherHeaderProps> = ({
  currentMode,
  onModeChange,
  className = "",
}) => {
  const isBeginner = currentMode === "beginner";

  return (
    <div
      id="mode-switcher-header"
      className={`hidden items-center justify-between gap-3 px-3 py-2 bg-card/90 border-b border-border text-xs text-foreground transition-colors ${className}`}
      data-testid="mode-switcher-header"
    >
      <div className="flex items-center gap-2">
        <Badge
          variant="outline"
          className={`flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-medium border ${
            isBeginner
              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
              : "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30"
          }`}
          data-testid="mode-badge"
        >
          {isBeginner ? (
            <>
              <Sparkles className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
              <span>Beginner Mode (Guided Tabs)</span>
            </>
          ) : (
            <>
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
              <span>Advanced Studio (Full Controls)</span>
            </>
          )}
        </Badge>
        <span className="hidden sm:inline text-muted-foreground text-[11px]">
          {isBeginner
            ? "Step-by-step setup with auto-detected subtitles"
            : "Direct multi-panel controls & detailed inspectors"}
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          size="sm"
          variant={isBeginner ? "secondary" : "ghost"}
          onClick={() => onModeChange("beginner")}
          className={`h-7 px-2.5 text-xs font-medium rounded-md transition-all ${
            isBeginner
              ? "bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
          data-testid="btn-mode-beginner"
        >
          <Sparkles className="w-3 h-3 mr-1" />
          Beginner
        </Button>
        <Button
          type="button"
          size="sm"
          variant={!isBeginner ? "secondary" : "ghost"}
          onClick={() => onModeChange("expert")}
          className={`h-7 px-2.5 text-xs font-medium rounded-md transition-all ${
            !isBeginner
              ? "bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
          data-testid="btn-mode-expert"
        >
          <SlidersHorizontal className="w-3 h-3 mr-1" />
          Advanced
        </Button>
      </div>
    </div>
  );
};
