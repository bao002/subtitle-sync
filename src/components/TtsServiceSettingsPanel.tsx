import React, { useState } from "react";
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  Play,
  Loader2,
  Eye,
  EyeOff,
  ExternalLink,
  Volume2,
  Sparkles,
} from "lucide-react";
import {
  type AlternativeTtsEngine,
  type AlternativeTtsMode,
  type LovableTtsProvider,
  type RemoteTtsValidationResult,
  LOVABLE_TTS_PROVIDERS,
  LOVABLE_TTS_DOCS_URL,
  LOVABLE_TTS_OPENAPI_URL,
  getVoicesForProvider,
  getDefaultVoiceForProvider,
  isSpeakApiPersonalToken,
  getAlternativeTtsAnonymousMode,
  setAlternativeTtsAnonymousMode,
} from "@/lib/alternative-tts";
import { ExternalTtsDebuggerPanel } from "@/components/ExternalTtsDebuggerPanel";

export interface TtsServiceSettingsPanelProps {
  mode: AlternativeTtsMode;
  onModeChange: (mode: AlternativeTtsMode) => void;
  engine: AlternativeTtsEngine;
  onEngineChange: (engine: AlternativeTtsEngine) => void;
  provider: LovableTtsProvider;
  onProviderChange: (provider: LovableTtsProvider) => void;
  voice: string;
  onVoiceChange: (voice: string) => void;
  speechRate: number;
  onSpeechRateChange: (rate: number) => void;
  baseLanguage?: string;
  currentKeyInput?: string;
  hasCustomKey?: boolean;
  hasCustomSpeakToken?: boolean;
  hasServerKey?: boolean;
  onSaveKey?: (key: string) => void;
  onClearKey?: () => void;
  onValidateService: () => Promise<void> | void;
  onTestAudio: () => Promise<void> | void;
  isValidating?: boolean;
  isTestingAudio?: boolean;
  validationResult?: RemoteTtsValidationResult | null;
  isAnonymous?: boolean;
  onAnonymousChange?: (anonymous: boolean) => void;
  showDebugger?: boolean;
  className?: string;
}

/**
 * Reactive TTS Service Settings Panel.
 *
 * Enforces strict reactive visibility to eliminate UI clutter:
 * 1. Direct Google TTS (google_translate):
 *    - Hides provider selector (irrelevant for Google direct)
 *    - Hides voice selector (Google direct has single voice)
 *    - Hides API key input (Google direct is free, public, rejects keys)
 *    - Single validate button + single test audio button (no duplications!)
 * 2. Lovable Speak API (tts3.lovable.app):
 *    - Shows provider selector ("auto", "google", "openrouter", "gemini", etc.)
 *    - When provider is "google" or "auto": hides API key and voice dropdown
 *    - When provider is keyed (openrouter, openai, elevenlabs, etc.): dynamically shows provider voices and token input
 *    - Single validate button + single test audio button
 */
export const TtsServiceSettingsPanel: React.FC<TtsServiceSettingsPanelProps> = ({
  mode,
  onModeChange,
  engine,
  onEngineChange,
  provider,
  onProviderChange,
  voice,
  onVoiceChange,
  speechRate,
  onSpeechRateChange,
  baseLanguage = "en",
  currentKeyInput = "",
  hasCustomKey = false,
  hasCustomSpeakToken = false,
  hasServerKey = false,
  onSaveKey,
  onClearKey,
  onValidateService,
  onTestAudio,
  isValidating = false,
  isTestingAudio = false,
  validationResult = null,
  isAnonymous,
  onAnonymousChange,
  showDebugger = true,
  className = "",
}) => {
  const [keyInput, setKeyInput] = useState(currentKeyInput);
  const [showKeyPassword, setShowKeyPassword] = useState(false);
  const [keySavedFeedback, setKeySavedFeedback] = useState(false);
  const [anonymousState, setAnonymousState] = useState<boolean>(() => {
    if (isAnonymous !== undefined) return isAnonymous;
    return getAlternativeTtsAnonymousMode();
  });

  React.useEffect(() => {
    if (isAnonymous !== undefined) {
      setAnonymousState(isAnonymous);
    }
  }, [isAnonymous]);

  const handleAnonymousToggle = (val: boolean) => {
    setAnonymousState(val);
    setAlternativeTtsAnonymousMode(val);
    onAnonymousChange?.(val);
  };

  // Sync state if prop changes from outside
  React.useEffect(() => {
    setKeyInput(currentKeyInput);
  }, [currentKeyInput]);

  const isGoogleDirect = engine === "google_translate";
  const isLovablePublicProvider = engine === "lovable" && (provider === "google" || provider === "auto");
  const isKeyedProvider = engine === "lovable" && !isLovablePublicProvider;
  const isValidationOk = Boolean(validationResult && validationResult.ok);

  const availableVoices = isGoogleDirect ? [] : getVoicesForProvider(provider);

  const handleSaveKeyClick = () => {
    if (onSaveKey) {
      onSaveKey(keyInput);
      setKeySavedFeedback(true);
      setTimeout(() => setKeySavedFeedback(false), 2000);
    }
  };

  const handleClearKeyClick = () => {
    setKeyInput("");
    if (onClearKey) {
      onClearKey();
    }
  };

  return (
    <div
      data-testid="tts-service-settings-panel"
      className={`space-y-3 p-3 rounded-lg border border-border bg-card text-card-foreground text-xs ${className}`}
    >
      {/* 1. Mode Selector: Always vs Fallback only */}
      <div className="space-y-1.5 pb-2 border-b border-border/50">
        <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px] block">
          Playback Mode
        </span>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              name="tts-panel-playback-mode"
              data-testid="alternative-tts-mode-always"
              value="always"
              checked={mode === "always"}
              onChange={() => onModeChange("always")}
            />
            <span className="font-medium text-foreground">Always use speech service</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground">
            <input
              type="radio"
              name="tts-panel-playback-mode"
              data-testid="alternative-tts-mode-fallback"
              value="fallback_only"
              checked={mode === "fallback_only"}
              onChange={() => onModeChange("fallback_only")}
            />
            <span>Fallback only when device speech fails</span>
          </label>
        </div>
      </div>

      {/* 2. TTS Service / Engine Selector */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <label htmlFor="tts-panel-engine-select" className="text-muted-foreground font-semibold">
            TTS Service:
          </label>
          <select
            id="tts-panel-engine-select"
            data-testid="alternative-tts-engine-select"
            value={engine}
            onChange={(e) => onEngineChange(e.target.value as AlternativeTtsEngine)}
            className="rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground font-medium shadow-2xs transition-all focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="lovable">Lovable Speak API (tts3.lovable.app)</option>
            <option value="google_translate">Google TTS (Direct translate_tts)</option>
          </select>
        </div>

        {engine === "lovable" && (
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <a
              href={LOVABLE_TTS_DOCS_URL}
              target="_blank"
              rel="noreferrer"
              data-testid="lovable-tts-docs-link"
              className="text-primary hover:underline inline-flex items-center gap-0.5"
            >
              Docs ↗
            </a>
            <a
              href={LOVABLE_TTS_OPENAPI_URL}
              target="_blank"
              rel="noreferrer"
              data-testid="lovable-tts-openapi-link"
              className="text-muted-foreground hover:underline inline-flex items-center gap-0.5"
            >
              OpenAPI ↗
            </a>
          </div>
        )}
      </div>

      {/* 3. Reactive Controls Card */}
      <div
        data-testid="tts-reactive-controls-card"
        className="space-y-3 p-3 rounded-lg bg-muted/40 border border-border/60"
      >
        {/* Direct Google TTS Mode: Clean, zero irrelevant menus */}
        {isGoogleDirect ? (
          <div
            data-testid="google-direct-notice"
            className="flex items-center justify-between gap-2 p-2 rounded-md bg-emerald-500/10 border border-emerald-500/25 text-emerald-800 dark:text-emerald-200 text-xs"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <span className="font-semibold block text-[11.5px]">Direct Google TTS Selected</span>
                <span className="text-[10.5px] opacity-90">
                  Public high-speed audio stream via Google Translate. No provider keys or custom voice menus required.
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] font-semibold shrink-0">
              Free & Public
            </span>
          </div>
        ) : (
          /* Lovable Speak API Mode: Reactive Provider & Voice Selection */
          <div className="space-y-3" data-testid="lovable-speak-api-controls">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              {/* Provider Selection */}
              <div className="flex items-center gap-2">
                <label htmlFor="tts-panel-provider-select" className="text-muted-foreground font-medium">
                  Provider:
                </label>
                <select
                  id="tts-panel-provider-select"
                  data-testid="lovable-tts-provider-select"
                  value={provider}
                  onChange={(e) => {
                    const nextProvider = e.target.value as LovableTtsProvider;
                    onProviderChange(nextProvider);
                    const newVoices = getVoicesForProvider(nextProvider);
                    if (newVoices.length > 0 && !newVoices.includes(voice)) {
                      onVoiceChange(getDefaultVoiceForProvider(nextProvider));
                    }
                  }}
                  className="rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground font-mono font-medium shadow-2xs transition-all focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  {LOVABLE_TTS_PROVIDERS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              {/* Voice Selection (Dynamically shown only when provider offers choices) */}
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground font-medium">Voice:</span>
                {availableVoices.length === 0 ? (
                  <span
                    data-testid="tts-default-voice-indicator"
                    className="text-xs text-muted-foreground italic px-2 py-0.5 rounded bg-background border border-border/60"
                  >
                    Default (Standard voice)
                  </span>
                ) : (
                  <select
                    data-testid="lovable-tts-voice-select"
                    value={voice || getDefaultVoiceForProvider(provider)}
                    onChange={(e) => onVoiceChange(e.target.value)}
                    className="rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground font-medium shadow-2xs transition-all focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    {availableVoices.map((v) => (
                      <option key={v} value={v}>
                        {v} {v === getDefaultVoiceForProvider(provider) ? "(Default)" : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* API Key / Speak API Token Input (Strictly shown only for keyed providers) */}
            {isKeyedProvider ? (
              <div
                data-testid="tts-token-input-section"
                className="space-y-1.5 pt-2 border-t border-border/60"
              >
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <label
                    htmlFor="tts-panel-token-input"
                    className="text-muted-foreground font-medium flex items-center gap-1.5 flex-wrap"
                  >
                    <span>Speak API Token / Provider Key:</span>
                    {hasCustomSpeakToken ? (
                      <span
                        data-testid="speak-token-custom-badge"
                        className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/30"
                      >
                        ✓ Speak API token (spk_...) saved
                      </span>
                    ) : hasCustomKey ? (
                      <span
                        data-testid="openrouter-key-custom-badge"
                        className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/30"
                      >
                        ✓ Provider key saved
                      </span>
                    ) : hasServerKey ? (
                      <span
                        data-testid="openrouter-key-server-badge"
                        className="text-[10px] text-primary font-medium"
                      >
                        (Using server .env key)
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">
                        (Optional - free tier default)
                      </span>
                    )}
                  </label>
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <input
                      id="tts-panel-token-input"
                      data-testid="openrouter-tts-key-input"
                      type={showKeyPassword ? "text" : "password"}
                      value={keyInput}
                      onChange={(e) => setKeyInput(e.target.value)}
                      placeholder={
                        hasServerKey
                          ? "Using server key (or enter spk_... / sk-or-...)"
                          : "spk_... (Speak API token) or sk-or-... / sk_..."
                      }
                      className="w-full rounded border border-input bg-background px-2.5 py-1 pr-8 text-xs font-mono text-foreground placeholder:text-muted-foreground/60"
                    />
                    <button
                      type="button"
                      data-testid="toggle-show-openrouter-key-btn"
                      onClick={() => setShowKeyPassword(!showKeyPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs cursor-pointer"
                      title={showKeyPassword ? "Hide key" : "Show key"}
                    >
                      {showKeyPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>

                  <button
                    type="button"
                    data-testid="save-openrouter-key-btn"
                    onClick={handleSaveKeyClick}
                    className="px-2.5 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium cursor-pointer"
                  >
                    {keySavedFeedback ? "Saved!" : "Save"}
                  </button>

                  {keyInput && (
                    <button
                      type="button"
                      data-testid="clear-openrouter-key-btn"
                      onClick={handleClearKeyClick}
                      className="px-2 py-1 rounded border border-input bg-background text-muted-foreground hover:text-foreground text-xs cursor-pointer"
                      title="Clear custom key"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <p className="text-[10.5px] text-muted-foreground leading-normal mt-0.5">
                  Enter your Speak API Personal Token (<code className="font-mono text-primary">spk_...</code>) from tts3.lovable.app or an upstream provider key (<code className="font-mono text-primary">sk_...</code>, <code className="font-mono text-primary">sk-or-...</code>).
                </p>
              </div>
            ) : (
              <div
                data-testid="public-tier-notice"
                className="text-[11px] text-muted-foreground/90 italic pt-1 border-t border-border/40"
              >
                Auto / Google provider on Speak API operates in public mode without required API keys.
              </div>
            )}
          </div>
        )}

        {/* 4. Speech Rate Notice & Control */}
        <div
          data-testid="lovable-tts-native-speed-notice"
          className="flex items-center justify-between rounded border border-border/50 bg-background/50 px-2.5 py-1.5 text-xs"
        >
          <span className="text-muted-foreground font-medium">TTS Speech Rate:</span>
          <div className="flex items-center gap-1.5">
            <span className="text-foreground font-mono text-[11px]">
              {(speechRate ?? 0.5).toFixed(1)}x
            </span>
            <select
              data-testid="main-settings-tts-rate-select"
              aria-label="TTS speech rate"
              value={(speechRate ?? 0.5).toFixed(1)}
              onChange={(e) => onSpeechRateChange(Number(e.target.value))}
              className="rounded border border-input bg-background px-1.5 py-0.5 text-xs font-mono cursor-pointer"
            >
              {[0.5, 0.6, 0.7, 0.8, 0.9, 1.0].map((rateVal) => (
                <option key={rateVal} value={rateVal.toFixed(1)}>
                  {rateVal.toFixed(1)}×
                </option>
              ))}
            </select>
          </div>
        </div>
        {/* 4b. Anonymity Mode Selector (Regular vs Anonymous) */}
        <div
          data-testid="tts-anonymity-mode-control"
          className="flex flex-wrap items-center justify-between gap-2 rounded border border-border/50 bg-background/50 px-2.5 py-1.5 text-xs"
        >
          <div className="flex flex-col">
            <span className="text-foreground font-medium flex items-center gap-1.5">
              <span>Access Mode:</span>
              <span
                data-testid="tts-anonymity-status-label"
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                  anonymousState
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {anonymousState ? "Anonymous" : "Regular"}
              </span>
            </span>
            <span className="text-[10.5px] text-muted-foreground">
              {anonymousState
                ? "Anonymous: strips cookies, session tokens, and personal identifiers"
                : "Regular: uses standard credentials and session tracking"}
            </span>
          </div>

          <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded border border-input">
            <button
              type="button"
              data-testid="tts-anonymity-regular-btn"
              onClick={() => handleAnonymousToggle(false)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer transition-all ${
                !anonymousState
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Regular
            </button>
            <button
              type="button"
              data-testid="tts-anonymity-anonymous-btn"
              onClick={() => handleAnonymousToggle(true)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer transition-all ${
                anonymousState
                  ? "bg-amber-500 text-white dark:bg-amber-600 font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Anonymous
            </button>
          </div>
        </div>
      </div>

      {/* 5. Clean Action Buttons Row: First show Validation button. After validation is OK -> show Play button. */}
      <div
        data-testid="tts-service-action-buttons-row"
        className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/50"
      >
        {!isValidationOk ? (
          <>
            {/* First show Validation button */}
            <button
              type="button"
              data-testid="btn-validate-remote-tts"
              disabled={isValidating}
              onClick={() => onValidateService()}
              className="px-2.5 py-1 rounded border border-primary/40 bg-primary/10 hover:bg-primary/20 text-xs font-mono inline-flex items-center gap-1.5 text-primary disabled:opacity-60 cursor-pointer font-medium shadow-2xs"
            >
              {isValidating ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Validating Service…</span>
                </>
              ) : (
                <>
                  <Activity className="h-3 w-3" />
                  <span>
                    Validate {isGoogleDirect ? "Google TTS Directly" : "TTS3 Service"}
                  </span>
                </>
              )}
            </button>

            <span
              data-testid="tts-validation-required-hint"
              className="text-[11px] text-muted-foreground font-mono inline-flex items-center gap-1"
            >
              <AlertCircle className="h-3 w-3 text-muted-foreground/70" />
              <span>Validate service first to enable playback</span>
            </span>
          </>
        ) : (
          <>
            {/* After validation is OK - show Play button */}
            <button
              type="button"
              data-testid="test-alternative-tts-btn"
              disabled={isTestingAudio}
              onClick={() => onTestAudio()}
              className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono inline-flex items-center gap-1.5 disabled:opacity-60 cursor-pointer font-semibold shadow-xs"
            >
              {isTestingAudio ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin text-white" />
                  <span>Playing test audio…</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>
                    ▶ Play Test Audio ({isGoogleDirect ? "Google Direct" : `TTS3 / ${provider}`})
                  </span>
                </>
              )}
            </button>

            {/* Re-validate secondary button */}
            <button
              type="button"
              data-testid="btn-validate-remote-tts"
              disabled={isValidating}
              onClick={() => onValidateService()}
              className="px-2 py-1 rounded border border-border bg-background hover:bg-muted text-[11px] font-mono inline-flex items-center gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
              title="Re-validate service endpoint"
            >
              {isValidating ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Activity className="h-3 w-3" />
              )}
              <span>Re-validate</span>
            </button>
          </>
        )}
      </div>

      {/* 6. Validation Status Feedback Card */}
      {validationResult && (
        <div
          data-testid="remote-tts-validation-details"
          className={`flex flex-wrap items-center justify-between gap-2 p-2 rounded border text-xs ${
            validationResult.ok
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
              : "bg-destructive/10 border-destructive/30 text-destructive"
          }`}
        >
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              data-testid="remote-tts-validation-badge"
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium font-mono ${
                validationResult.ok
                  ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                  : "bg-destructive/20 text-destructive"
              }`}
            >
              {validationResult.ok ? (
                <>
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Available ({validationResult.latencyMs}ms)</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-3 w-3" />
                  <span>Unavailable ({validationResult.latencyMs}ms)</span>
                </>
              )}
            </span>
            <span className="font-semibold">{validationResult.serviceName}:</span>
            <span className="text-[11px] opacity-90">
              {validationResult.ok
                ? validationResult.details || "Audio stream verified"
                : validationResult.error || "Service check failed"}
            </span>
          </div>
          <span className="text-[10px] font-mono opacity-70">
            Checked {new Date(validationResult.timestamp).toLocaleTimeString()}
          </span>
        </div>
      )}

      {/* 7. External TTS Request/Response Debugger Panel */}
      {showDebugger && <ExternalTtsDebuggerPanel className="mt-2" />}
    </div>
  );
};
