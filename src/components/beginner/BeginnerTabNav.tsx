import React from "react";
import { Tv, Sliders, Split, PlayCircle, Lock, Check, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

export type BeginnerTabId = "video" | "preferences" | "parsing" | "player";

export interface BeginnerTabNavProps {
  activeTab: BeginnerTabId;
  onTabChange: (tab: BeginnerTabId) => void;
  isUnlocked: boolean; // True when base subtitle is selected
  hasBaseSubtitle: boolean;
  baseLanguageName?: string;
  onSwitchToAdvanced?: () => void;
}

export const BeginnerTabNav: React.FC<BeginnerTabNavProps> = ({
  activeTab,
  onTabChange,
  isUnlocked,
  hasBaseSubtitle,
  baseLanguageName,
  onSwitchToAdvanced,
}) => {
  const tabs: Array<{
    id: BeginnerTabId;
    step: number;
    title: string;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
    requiresUnlock: boolean;
  }> = [
    {
      id: "video",
      step: 1,
      title: "Video & Captions",
      subtitle: hasBaseSubtitle ? `Base: ${baseLanguageName || "Selected"}` : "Start & Intercept",
      icon: Tv,
      requiresUnlock: false,
    },
    {
      id: "preferences",
      step: 2,
      title: "Voice & Preferences",
      subtitle: "Order, TTS & Ratio",
      icon: Sliders,
      requiresUnlock: true,
    },
    {
      id: "parsing",
      step: 3,
      title: "Subtitle Parsing",
      subtitle: "Punctuation & Clean",
      icon: Split,
      requiresUnlock: true,
    },
    {
      id: "player",
      step: 4,
      title: "Sync Player",
      subtitle: "Dual Subtitles",
      icon: PlayCircle,
      requiresUnlock: true,
    },
  ];

  return (
    <nav
      className="w-full bg-slate-900 border-b border-slate-800 px-2 py-2"
      aria-label="Beginner Mode Steps"
      data-testid="beginner-tab-nav"
    >
      <div className="flex items-center justify-between gap-1 max-w-4xl mx-auto overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isDisabled = tab.requiresUnlock && !isUnlocked;
          const isCompleted = tab.id === "video" ? hasBaseSubtitle : isUnlocked;

          return (
            <button
              key={tab.id}
              type="button"
              disabled={isDisabled}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 min-w-[120px] max-w-[200px] flex items-center gap-2 p-2 rounded-lg text-left transition-all border ${
                isActive
                  ? "bg-slate-800 border-emerald-500/80 text-white shadow-sm ring-1 ring-emerald-500/30"
                  : isDisabled
                    ? "bg-slate-950/40 border-slate-800/40 text-slate-600 cursor-not-allowed opacity-60"
                    : "bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/60 hover:text-slate-100"
              }`}
              data-testid={`beginner-tab-${tab.id}`}
              aria-current={isActive ? "page" : undefined}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold ${
                  isActive
                    ? "bg-emerald-600 text-white"
                    : isDisabled
                      ? "bg-slate-800 text-slate-500"
                      : isCompleted
                        ? "bg-emerald-950 text-emerald-400 border border-emerald-700/60"
                        : "bg-slate-800 text-slate-300"
                }`}
              >
                {isDisabled ? (
                  <Lock className="w-3.5 h-3.5" />
                ) : isCompleted && !isActive ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <span>{tab.step}</span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium truncate">{tab.title}</span>
                </div>
                <div className="text-[10px] text-slate-400 truncate">{tab.subtitle}</div>
              </div>
            </button>
          );
        })}

        {onSwitchToAdvanced && (
          <div className="shrink-0 pl-1">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onSwitchToAdvanced}
              className="h-8 px-2.5 text-xs text-indigo-300 hover:text-indigo-100 hover:bg-indigo-950/70 border-indigo-700/60 rounded-lg flex items-center gap-1.5 transition-colors"
              data-testid="nav-switch-to-advanced"
              title="Switch to Advanced Studio (Full Controls)"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Advanced Studio</span>
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
};
