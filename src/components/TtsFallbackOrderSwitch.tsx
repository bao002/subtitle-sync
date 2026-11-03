import React from "react";
import { Settings, Sparkles, Volume2, Globe, ArrowRight, ExternalLink } from "lucide-react";
import {
  type TtsFallbackOrder,
  DEFAULT_TTS_FALLBACK_ORDER,
  getTtsFallbackOrder,
  setTtsFallbackOrder,
} from "@/lib/alternative-tts";

export interface TtsFallbackOrderOption {
  id: TtsFallbackOrder;
  label: string;
  shortLabel: string;
  steps: Array<{ label: string; type: "google" | "tts3" | "native" }>;
  description: string;
}

export const TTS_FALLBACK_ORDER_OPTIONS: TtsFallbackOrderOption[] = [
  {
    id: "google_tts3_native",
    label: "1. Google directly ➔ 2. TTS3 service ➔ 3. Native voice",
    shortLabel: "Google ➔ TTS3 ➔ Native",
    steps: [
      { label: "Google Direct", type: "google" },
      { label: "TTS3 Service", type: "tts3" },
      { label: "Native Device", type: "native" },
    ],
    description: "Direct public Google stream first, fallback to TTS3, then local voice",
  },
  {
    id: "tts3_google_native",
    label: "1. TTS3 service ➔ 2. Google directly ➔ 3. Native voice",
    shortLabel: "TTS3 ➔ Google ➔ Native",
    steps: [
      { label: "TTS3 Service", type: "tts3" },
      { label: "Google Direct", type: "google" },
      { label: "Native Device", type: "native" },
    ],
    description: "TTS3 multi-provider voice first, fallback to Google, then local voice",
  },
  {
    id: "native_google_tts3",
    label: "1. Native voice ➔ 2. Google directly ➔ 3. TTS3 service",
    shortLabel: "Native ➔ Google ➔ TTS3",
    steps: [
      { label: "Native Device", type: "native" },
      { label: "Google Direct", type: "google" },
      { label: "TTS3 Service", type: "tts3" },
    ],
    description: "Device speech first; external services if local voice is unavailable",
  },
  {
    id: "google_native",
    label: "1. Google directly ➔ 2. Native voice",
    shortLabel: "Google ➔ Native",
    steps: [
      { label: "Google Direct", type: "google" },
      { label: "Native Device", type: "native" },
    ],
    description: "Google Translate direct stream with device speech fallback",
  },
  {
    id: "tts3_native",
    label: "1. TTS3 service ➔ 2. Native voice",
    shortLabel: "TTS3 ➔ Native",
    steps: [
      { label: "TTS3 Service", type: "tts3" },
      { label: "Native Device", type: "native" },
    ],
    description: "TTS3 service with device speech fallback",
  },
  {
    id: "native_only",
    label: "Native voice only (no external services)",
    shortLabel: "Native only",
    steps: [{ label: "Native Device", type: "native" }],
    description: "Offline native device speech only without external network calls",
  },
];

export interface TtsFallbackOrderSwitchProps {
  currentOrder?: TtsFallbackOrder;
  onOrderChange?: (order: TtsFallbackOrder) => void;
  onNavigateToSetup?: () => void;
  tts3TokenConfigured?: boolean;
  tts3Provider?: string;
  className?: string;
  compact?: boolean;
}

export const TtsFallbackOrderSwitch: React.FC<TtsFallbackOrderSwitchProps> = ({
  currentOrder,
  onOrderChange,
  onNavigateToSetup,
  tts3TokenConfigured = false,
  tts3Provider = "auto",
  className = "",
  compact = false,
}) => {
  const [internalOrder, setInternalOrder] = React.useState<TtsFallbackOrder>(() => {
    if (currentOrder) return currentOrder;
    return getTtsFallbackOrder();
  });

  React.useEffect(() => {
    if (currentOrder) {
      setInternalOrder(currentOrder);
    }
  }, [currentOrder]);

  const handleSelectOrder = (newOrder: TtsFallbackOrder) => {
    setInternalOrder(newOrder);
    setTtsFallbackOrder(newOrder);
    onOrderChange?.(newOrder);
  };

  const activeOption =
    TTS_FALLBACK_ORDER_OPTIONS.find((opt) => opt.id === internalOrder) ||
    TTS_FALLBACK_ORDER_OPTIONS[0];

  const renderStepBadge = (step: { label: string; type: "google" | "tts3" | "native" }, index: number) => {
    let badgeColor = "bg-muted text-muted-foreground border-border";
    let icon = <Volume2 className="h-3 w-3" />;

    if (step.type === "google") {
      badgeColor = "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30";
      icon = <Globe className="h-3 w-3" />;
    } else if (step.type === "tts3") {
      badgeColor = "bg-primary/15 text-primary border-primary/30";
      icon = <Sparkles className="h-3 w-3" />;
    }

    return (
      <span
        key={step.type + index}
        data-testid={`tts-fallback-step-${step.type}`}
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] font-mono border font-medium ${badgeColor}`}
      >
        {icon}
        <span>{step.label}</span>
      </span>
    );
  };

  return (
    <div
      data-testid="tts-fallback-order-switch"
      data-control-category="daily-usage"
      className={`rounded-lg border border-border/80 bg-card/90 text-card-foreground p-2 sm:p-2.5 text-xs shadow-2xs ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2">
          <label
            htmlFor="tts-fallback-order-select"
            className="text-foreground font-semibold flex items-center gap-1.5 text-xs"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>TTS Fallback Order:</span>
          </label>
          <select
            id="tts-fallback-order-select"
            data-testid="tts-fallback-order-select"
            value={internalOrder}
            onChange={(e) => handleSelectOrder(e.target.value as TtsFallbackOrder)}
            className="rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground font-mono font-medium shadow-2xs transition-all focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer max-w-[280px] sm:max-w-none"
          >
            {TTS_FALLBACK_ORDER_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Quick Link/Button navigating directly to TTS service setup */}
        {onNavigateToSetup && (
          <button
            type="button"
            data-testid="btn-navigate-to-tts-setup"
            onClick={onNavigateToSetup}
            className="inline-flex items-center gap-1 px-2 py-1 rounded border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-medium transition-colors cursor-pointer"
            title="Configure TTS3 Personal Token and Provider (default: auto)"
          >
            <Settings className="h-3 w-3" />
            <span>TTS Service Setup</span>
            <span className="text-[10px] opacity-75 font-mono">
              ({tts3Provider === "auto" ? "auto" : tts3Provider})
            </span>
          </button>
        )}
      </div>

      {/* Visual Sequence Chain */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border/50 text-[11px]">
        <span className="text-muted-foreground text-[10.5px]">Sequence:</span>
        <div className="flex flex-wrap items-center gap-1">
          {activeOption.steps.map((step, idx) => (
            <React.Fragment key={step.type + idx}>
              {idx > 0 && <ArrowRight className="h-2.5 w-2.5 text-muted-foreground/60" />}
              {renderStepBadge(step, idx)}
            </React.Fragment>
          ))}
        </div>

        {tts3TokenConfigured && (
          <span
            data-testid="tts3-token-active-badge"
            className="ml-auto text-[10px] text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/30"
          >
            ✓ TTS3 Token Active
          </span>
        )}
      </div>
    </div>
  );
};
