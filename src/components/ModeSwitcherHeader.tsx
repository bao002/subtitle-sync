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
      className={`flex items-center justify-between gap-3 px-3 py-2 bg-slate-900/90 border-b border-slate-800 text-xs text-slate-200 transition-colors ${className}`}
      data-testid="mode-switcher-header"
    >
      <div className="flex items-center gap-2">
        <Badge
          variant="outline"
          className={`flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-medium border ${
            isBeginner
              ? "bg-emerald-950/60 text-emerald-300 border-emerald-700/60"
              : "bg-indigo-950/60 text-indigo-300 border-indigo-700/60"
          }`}
          data-testid="mode-badge"
        >
          {isBeginner ? (
            <>
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Beginner Mode (Guided Tabs)</span>
            </>
          ) : (
            <>
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
              <span>Advanced Studio (Full Controls)</span>
            </>
          )}
        </Badge>
        <span className="hidden sm:inline text-slate-400 text-[11px]">
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
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
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
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
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
