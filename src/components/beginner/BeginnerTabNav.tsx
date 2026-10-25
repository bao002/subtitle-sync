import React from "react";
import {
  Tv,
  Sliders,
  Split,
  PlayCircle,
  Lock,
  Check,
  SlidersHorizontal,
  ArrowRight,
} from "lucide-react";
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
    category: "new-user" | "daily-usage";
    icon: React.ComponentType<{ className?: string }>;
    requiresUnlock: boolean;
  }> = [
    {
      id: "preferences",
      step: 1,
      title: "Voice & Preferences",
      subtitle: "Set up once",
      category: "new-user",
      icon: Sliders,
      requiresUnlock: false,
    },
    {
      id: "video",
      step: 2,
      title: "Video & Captions",
      subtitle: hasBaseSubtitle ? `Base: ${baseLanguageName || "Selected"}` : "Daily viewing",
      category: "daily-usage",
      icon: Tv,
      requiresUnlock: false,
    },
    {
      id: "parsing",
      step: 3,
      title: "Subtitle Parsing",
      subtitle: "Punctuation & Clean",
      category: "daily-usage",
      icon: Split,
      requiresUnlock: true,
    },
    {
      id: "player",
      step: 4,
      title: "Sync Player",
      subtitle: "Dual Subtitles",
      category: "daily-usage",
      icon: PlayCircle,
      requiresUnlock: true,
    },
  ];

  return (
    <nav
      className="w-full max-w-full bg-card/95 backdrop-blur-xs border-b border-border px-2 py-1.5 sm:py-2 overflow-hidden shadow-2xs"
      aria-label="Beginner Mode Steps"
      data-testid="beginner-tab-nav"
    >
      <div className="w-full max-w-4xl mx-auto flex items-center justify-between gap-1 sm:gap-2 overflow-x-auto scrollbar-none pb-0.5">
        {tabs.map((tab, index) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isDisabled = tab.requiresUnlock && !isUnlocked;
          const isCompleted =
            tab.id === "preferences"
              ? activeTab !== "preferences"
              : tab.id === "video"
                ? hasBaseSubtitle
                : isUnlocked;
          const categoryClass =
            tab.category === "new-user"
              ? "border-amber-500/30 bg-amber-500/5"
              : "border-emerald-500/30 bg-emerald-500/5";

          return (
            <React.Fragment key={tab.id}>
              <button
                type="button"
                disabled={isDisabled}
                onClick={() => onTabChange(tab.id)}
                className={`flex-1 min-w-0 sm:min-w-[110px] md:min-w-[130px] max-w-[200px] flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-lg text-left transition-all border ${
                  isActive
                    ? tab.category === "new-user"
                      ? "bg-amber-500/15 border-amber-500/60 text-foreground shadow-sm ring-1 ring-amber-500/30"
                      : "bg-emerald-500/15 border-emerald-500/60 text-foreground shadow-sm ring-1 ring-emerald-500/30"
                    : isDisabled
                      ? "bg-muted/40 border-border/40 text-muted-foreground/50 cursor-not-allowed opacity-60"
                      : `${categoryClass} text-foreground hover:bg-muted/60`
                }`}
                data-testid={`beginner-tab-${tab.id}`}
                data-control-category={tab.category}
                aria-current={isActive ? "page" : undefined}
              >
                <div
                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center shrink-0 text-[11px] sm:text-xs font-semibold ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : isDisabled
                        ? "bg-muted text-muted-foreground"
                        : isCompleted
                          ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                          : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isDisabled ? (
                    <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  ) : isCompleted && !isActive ? (
                    <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  ) : (
                    <span>{tab.step}</span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] sm:text-xs font-medium truncate">{tab.title}</span>
                  </div>
                  <div className="hidden sm:block text-[10px] text-muted-foreground truncate">
                    {tab.subtitle}
                  </div>
                </div>
              </button>
              {index < tabs.length - 1 && (
                <ArrowRight
                  className="h-3 w-3 shrink-0 text-muted-foreground/70"
                  aria-hidden="true"
                  data-testid={`beginner-flow-arrow-${tab.id}`}
                />
              )}
            </React.Fragment>
          );
        })}

        {onSwitchToAdvanced && (
          <div className="shrink-0 pl-1">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onSwitchToAdvanced}
              className="h-7 sm:h-8 px-2 sm:px-2.5 text-[11px] sm:text-xs text-muted-foreground hover:text-foreground hover:bg-muted border-border rounded-lg flex items-center gap-1 sm:gap-1.5 transition-colors shrink-0"
              data-testid="nav-switch-to-advanced"
              title="Switch to Advanced Studio (Full Controls)"
            >
              <SlidersHorizontal className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" />
              <span className="hidden md:inline">Advanced Studio</span>
              <span className="hidden sm:inline md:hidden">Advanced</span>
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
};
