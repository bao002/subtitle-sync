import React, { useState, useEffect } from "react";
import {
  Sliders,
  Volume2,
  VolumeX,
  Gauge,
  Languages,
  Plus,
  X,
  Check,
  ArrowRight,
  Play,
  RotateCcw,
  Loader2,
  Eye,
  EyeOff,
  Film,
  Mic,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  deduplicateVoices,
  getLanguageVoices,
  getCachedVoices,
  SpeechVoiceLike,
} from "@/utils/speechVoiceUtils";
import {
  ALL_KNOWN_LANGUAGES,
  getOpenRouterApiKeySetting,
  setOpenRouterApiKeySetting,
} from "@/utils/appSettings";
import {
  playAlternativeTtsAudio,
  getUseAlternativeTts,
  setUseAlternativeTts,
  getAlternativeTtsMode,
  setAlternativeTtsMode,
  getLovableTtsProvider,
  setLovableTtsProvider,
  getLovableTtsVoice,
  setLovableTtsVoice,
  getLovableTtsSpeed,
  setLovableTtsSpeed,
  getLovableTtsApiKey,
  setLovableTtsApiKey,
  getServerOpenRouterApiKey,
  hasCustomOpenRouterApiKey,
  LOVABLE_TTS_OPENAPI_URL,
  LOVABLE_VOICES,
  OPENROUTER_VOICES,
  type AlternativeTtsMode,
  type LovableTtsProvider,
} from "@/lib/alternative-tts";

export interface BeginnerPreferencesTabProps {
  order: "video-first" | "tts-first";
  onOrderChange: (order: "video-first" | "tts-first") => void;
  ttsSpeed: number;
  onTtsSpeedChange: (speed: number) => void;
  ttsVoice: string;
  onTtsVoiceChange: (voiceURI: string) => void;
  favoriteLanguages: string[];
  onFavoriteLanguagesChange: (langs: string[]) => void;
  showVideoSubtitles: boolean;
  onToggleVideoSubtitles: () => void;
  baseLanguage?: string;
  perLanguageTtsSettingsSlot?: React.ReactNode;
  onContinueToNextTab?: () => void;
}

export const BeginnerPreferencesTab: React.FC<BeginnerPreferencesTabProps> = ({
  order,
  onOrderChange,
  ttsSpeed,
  onTtsSpeedChange,
  ttsVoice,
  onTtsVoiceChange,
  favoriteLanguages,
  onFavoriteLanguagesChange,
  showVideoSubtitles,
  onToggleVideoSubtitles,
  baseLanguage = "en",
  perLanguageTtsSettingsSlot,
  onContinueToNextTab,
}) => {
  const [voices, setVoices] = useState<SpeechVoiceLike[]>(() => getCachedVoices());
  const [isAuditioning, setIsAuditioning] = useState(false);
  const [newLangCode, setNewLangCode] = useState("");
  const [useAlternativeTtsState, setUseAlternativeTtsState] = useState<boolean>(() =>
    typeof window !== "undefined" ? getUseAlternativeTts() : false,
  );
  const [alternativeTtsModeState, setAlternativeTtsModeState] = useState<AlternativeTtsMode>(() =>
    typeof window !== "undefined" ? getAlternativeTtsMode() : "fallback_only",
  );
  const [lovableTtsProviderState, setLovableTtsProviderState] = useState<LovableTtsProvider>(() =>
    typeof window !== "undefined" ? getLovableTtsProvider() : "google",
  );
  const [lovableTtsVoiceState, setLovableTtsVoiceState] = useState<string>(() =>
    typeof window !== "undefined" ? getLovableTtsVoice() : "Kore",
  );
  const [lovableTtsSpeedState, setLovableTtsSpeedState] = useState<number>(() =>
    typeof window !== "undefined" ? getLovableTtsSpeed() : 1.0,
  );
  const [openRouterKeyInput, setOpenRouterKeyInput] = useState<string>(() =>
    typeof window !== "undefined"
      ? localStorage.getItem("yt_openrouter_api_key") ||
        localStorage.getItem("yt_openrouter_api_key_v1") ||
        localStorage.getItem("yt_alternative_tts_lovable_api_key_v1") ||
        ""
      : "",
  );
  const [showOpenRouterKey, setShowOpenRouterKey] = useState<boolean>(false);
  const [openRouterKeySaved, setOpenRouterKeySaved] = useState<boolean>(false);
  const [isTestingAlternativeTts, setIsTestingAlternativeTts] = useState<boolean>(false);
  const [showOrderHelp, setShowOrderHelp] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length > 0) {
        setVoices(deduplicateVoices(v));
      }
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  const filteredVoices = voices.length > 0 ? getLanguageVoices(voices, baseLanguage, true) : [];

  const handleTestVoice = () => {
    if (typeof window === "undefined") return;
    const text =
      baseLanguage === "he"
        ? "שלום, זו בדיקת קול עבור כתוביות"
        : "Hello, this is a subtitle voice preview.";

    const useAltTts = getUseAlternativeTts();
    const altMode = getAlternativeTtsMode();

    if (useAltTts && altMode === "always") {
      setIsAuditioning(true);
      playAlternativeTtsAudio(text, baseLanguage, ttsSpeed, undefined, "lovable", {
        provider: lovableTtsProviderState,
        voice:
          lovableTtsProviderState === "google"
            ? undefined
            : lovableTtsVoiceState || (lovableTtsProviderState === "openrouter" ? "alloy" : "Kore"),
        speed: ttsSpeed,
      })
        .catch(() => {})
        .finally(() => setIsAuditioning(false));
      return;
    }

    if (!("speechSynthesis" in window)) {
      if (useAltTts) {
        setIsAuditioning(true);
        playAlternativeTtsAudio(text, baseLanguage, ttsSpeed, undefined, "lovable", {
          provider: lovableTtsProviderState,
          voice:
            lovableTtsProviderState === "google"
              ? undefined
              : lovableTtsVoiceState ||
                (lovableTtsProviderState === "openrouter" ? "alloy" : "Kore"),
          speed: ttsSpeed,
        })
          .catch(() => {})
          .finally(() => setIsAuditioning(false));
      }
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = ttsSpeed;
      if (ttsVoice) {
        const found = voices.find((v) => v.voiceURI === ttsVoice);
        if (found) {
          const sysVoices = window.speechSynthesis.getVoices();
          const target = sysVoices.find((v) => v.voiceURI === found.voiceURI);
          if (target) utterance.voice = target;
        }
      }
      utterance.onend = () => setIsAuditioning(false);
      utterance.onerror = () => {
        if (useAltTts) {
          playAlternativeTtsAudio(text, baseLanguage, ttsSpeed, undefined, "lovable", {
            provider: lovableTtsProviderState,
            voice:
              lovableTtsProviderState === "google"
                ? undefined
                : lovableTtsVoiceState ||
                  (lovableTtsProviderState === "openrouter" ? "alloy" : "Kore"),
            speed: ttsSpeed,
          })
            .catch(() => {})
            .finally(() => setIsAuditioning(false));
        } else {
          setIsAuditioning(false);
        }
      };
      setIsAuditioning(true);
      window.speechSynthesis.speak(utterance);
    } catch {
      if (useAltTts) {
        playAlternativeTtsAudio(text, baseLanguage, ttsSpeed, undefined, "lovable", {
          provider: lovableTtsProviderState,
          voice:
            lovableTtsProviderState === "google"
              ? undefined
              : lovableTtsVoiceState ||
                (lovableTtsProviderState === "openrouter" ? "alloy" : "Kore"),
          speed: ttsSpeed,
        })
          .catch(() => {})
          .finally(() => setIsAuditioning(false));
      } else {
        setIsAuditioning(false);
      }
    }
  };

  const handleAddLanguage = (codeToAdd: string) => {
    if (!codeToAdd) return;
    const clean = codeToAdd.trim().toLowerCase();
    if (!favoriteLanguages.includes(clean)) {
      onFavoriteLanguagesChange([...favoriteLanguages, clean]);
    }
    setNewLangCode("");
  };

  const handleRemoveLanguage = (codeToRemove: string) => {
    onFavoriteLanguagesChange(favoriteLanguages.filter((l) => l !== codeToRemove));
  };

  const commonPresets = [
    { code: "en", name: "English" },
    { code: "he", name: "Hebrew (עברית)" },
    { code: "es", name: "Spanish (Español)" },
    { code: "fr", name: "French (Français)" },
    { code: "ru", name: "Russian (Русский)" },
    { code: "ar", name: "Arabic (العربية)" },
    { code: "de", name: "German (Deutsch)" },
  ];

  return (
    <div
      className="space-y-4 max-w-4xl mx-auto p-3 rounded-2xl border border-amber-500/30 bg-amber-500/5"
      data-testid="beginner-preferences-tab"
      data-control-category="new-user"
    >
      {/* Tab Title */}
      <div className="bg-card border border-border rounded-xl p-3.5 shadow-sm space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Step 1: General Preferences</h2>
            <p className="text-xs text-muted-foreground">
              Configure playback order, narration speed, speech voice, subtitle-overlay defaults,
              and favorite languages.
            </p>
          </div>
        </div>
      </div>

      <label className="flex items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5 text-xs">
        <span className="flex items-center gap-2 font-medium text-foreground">
          {showVideoSubtitles ? (
            <Eye className="h-4 w-4 text-amber-700 dark:text-amber-300" />
          ) : (
            <EyeOff className="h-4 w-4 text-amber-700 dark:text-amber-300" />
          )}
          Show subtitles over the video by default
        </span>
        <input
          type="checkbox"
          checked={showVideoSubtitles}
          onChange={onToggleVideoSubtitles}
          className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
          data-testid="beginner-overlay-preference"
        />
      </label>

      {/* 1. Playback Order */}
      <div className="bg-card border border-border rounded-xl p-3.5 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-primary" />
            <span>Playback Narration Order</span>
          </h3>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowOrderHelp(!showOrderHelp)}
              className="text-[11px] text-primary hover:underline flex items-center gap-1 font-medium"
              title="Learn how narration order works"
              aria-expanded={showOrderHelp}
            >
              <HelpCircle className="w-3 h-3" />
              <span>{showOrderHelp ? "Hide Info" : "Order Info"}</span>
            </button>
            <Badge variant="outline" className="text-[10px] text-muted-foreground border-border">
              {order === "video-first" ? "Video First" : "TTS First"}
            </Badge>
          </div>
        </div>

        {showOrderHelp && (
          <div className="rounded-md border border-border/60 bg-muted/30 p-2.5 text-[11px] leading-relaxed text-muted-foreground animate-in fade-in duration-150">
            Determine whether video audio leads and TTS follows, or TTS narrates the translated
            subtitle before continuing video playback.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => onOrderChange("video-first")}
            className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
              order === "video-first"
                ? "bg-primary/10 border-primary text-foreground ring-1 ring-primary/40 shadow-2xs"
                : "bg-background border-border hover:border-primary/50 text-foreground"
            }`}
            data-testid="order-video-first"
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                order === "video-first"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <Film className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Video First</span>
                {order === "video-first" && <Check className="w-3.5 h-3.5 text-primary" />}
              </div>
              <div className="text-[11px] text-muted-foreground truncate">
                Natural video dialogue pacing
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onOrderChange("tts-first")}
            className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
              order === "tts-first"
                ? "bg-primary/10 border-primary text-foreground ring-1 ring-primary/40 shadow-2xs"
                : "bg-background border-border hover:border-primary/50 text-foreground"
            }`}
            data-testid="order-tts-first"
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                order === "tts-first"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <Mic className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>TTS First</span>
                {order === "tts-first" && <Check className="w-3.5 h-3.5 text-primary" />}
              </div>
              <div className="text-[11px] text-muted-foreground truncate">
                Spoken subtitle translation leads
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* 2. TTS Speed & Voice Selection */}
      <div className="bg-card border border-border rounded-xl p-3.5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-semibold text-foreground">TTS Speed & Voice</h3>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleTestVoice}
            disabled={isAuditioning}
            className="h-7 px-2.5 text-[11px] border-primary/40 text-primary hover:bg-primary/10"
            data-testid="btn-test-voice"
          >
            <Volume2 className="w-3 h-3 mr-1" />
            {isAuditioning ? "Speaking..." : "Audition Voice"}
          </Button>
        </div>

        {/* Speed Slider */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Narration Speed</span>
            <span className="font-semibold text-primary font-mono" data-testid="tts-speed-val">
              {ttsSpeed.toFixed(2)}x
            </span>
          </div>
          <Slider
            value={[ttsSpeed]}
            onValueChange={([val]) => onTtsSpeedChange(val)}
            min={0.5}
            max={2.0}
            step={0.05}
            className="w-full"
            data-testid="tts-speed-slider"
          />
          <div className="flex items-center justify-between pt-1">
            {[0.75, 1.0, 1.25, 1.5].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => onTtsSpeedChange(preset)}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                  Math.abs(ttsSpeed - preset) < 0.02
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:text-foreground border border-border"
                }`}
              >
                {preset}x
              </button>
            ))}
          </div>
        </div>

        {/* Voice Selector */}
        <div className="space-y-1.5 pt-2">
          <label className="text-xs text-muted-foreground flex items-center justify-between">
            <span>Synthesis Voice</span>
            <span className="text-[10px] text-muted-foreground/70">
              {filteredVoices.length} voices found
            </span>
          </label>
          <select
            value={ttsVoice}
            onChange={(e) => onTtsVoiceChange(e.target.value)}
            className="w-full h-9 rounded-md bg-background border border-border text-foreground text-xs px-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
            data-testid="tts-voice-select"
          >
            <option value="">(Default System Voice)</option>
            {filteredVoices.map((voice) => (
              <option key={voice.voiceURI} value={voice.voiceURI}>
                {voice.name} ({voice.lang})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Alternative TTS Service (Lovable Speak API & Google Translate) */}
      <div
        className="bg-card border border-border rounded-xl p-3.5 shadow-sm space-y-2.5"
        data-testid="beginner-alternative-tts-card"
      >
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              id="beginner-alternative-tts-toggle"
              data-testid="beginner-alternative-tts-toggle"
              type="checkbox"
              checked={useAlternativeTtsState}
              onChange={(e) => {
                const checked = e.target.checked;
                setUseAlternativeTtsState(checked);
                setUseAlternativeTts(checked);
              }}
              className="rounded border-input text-primary focus:ring-primary h-4 w-4 cursor-pointer"
            />
            <span className="font-semibold text-xs text-foreground">
              Alternative TTS Service (Lovable Speak API &amp; Google Translate)
            </span>
          </label>
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
            Off by default
          </span>
        </div>

        {useAlternativeTtsState && (
          <div className="space-y-2.5 pt-1 pl-6">
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <label className="flex items-center gap-1.5 text-foreground cursor-pointer">
                <input
                  type="radio"
                  name="beginner-alternative-tts-mode"
                  data-testid="beginner-alternative-tts-mode-fallback"
                  value="fallback_only"
                  checked={alternativeTtsModeState === "fallback_only"}
                  onChange={() => {
                    setAlternativeTtsModeState("fallback_only");
                    setAlternativeTtsMode("fallback_only");
                  }}
                />
                Fallback when Web Speech fails
              </label>
              <label className="flex items-center gap-1.5 text-foreground cursor-pointer">
                <input
                  type="radio"
                  name="beginner-alternative-tts-mode"
                  data-testid="beginner-alternative-tts-mode-always"
                  value="always"
                  checked={alternativeTtsModeState === "always"}
                  onChange={() => {
                    setAlternativeTtsModeState("always");
                    setAlternativeTtsMode("always");
                  }}
                />
                Primary alternative engine
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-muted-foreground font-medium">TTS Engine:</span>
              <select
                data-testid="beginner-alternative-tts-engine-select"
                value="lovable"
                disabled
                className="rounded border border-input bg-background px-2 py-1 text-xs text-foreground font-medium opacity-90 cursor-default"
              >
                <option value="lovable">Lovable Speak API (tts2.lovable.app)</option>
              </select>
              <a
                href={LOVABLE_TTS_OPENAPI_URL}
                target="_blank"
                rel="noreferrer"
                data-testid="beginner-lovable-tts-openapi-link"
                className="text-primary hover:underline font-mono text-[11px] inline-flex items-center gap-0.5 ml-1"
              >
                OpenAPI 3.1.0 Spec ↗
              </a>
            </div>

            <div className="space-y-3 p-3 rounded-lg bg-muted/40 border border-border/60">
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground font-medium">Provider:</span>
                  <select
                    data-testid="beginner-lovable-tts-provider-select"
                    value={lovableTtsProviderState}
                    onChange={(e) => {
                      const p = e.target.value as LovableTtsProvider;
                      setLovableTtsProviderState(p);
                      setLovableTtsProvider(p);
                      if (
                        p === "openrouter" &&
                        !(OPENROUTER_VOICES as readonly string[]).includes(lovableTtsVoiceState)
                      ) {
                        setLovableTtsVoiceState("alloy");
                        setLovableTtsVoice("alloy");
                      } else if (
                        p === "lovable" &&
                        !(LOVABLE_VOICES as readonly string[]).includes(lovableTtsVoiceState)
                      ) {
                        setLovableTtsVoiceState("Kore");
                        setLovableTtsVoice("Kore");
                      }
                    }}
                    className="rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground font-mono font-medium shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary hover:border-primary/50 cursor-pointer"
                  >
                    <option value="lovable">lovable</option>
                    <option value="google">google</option>
                    <option value="openrouter">openrouter</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground font-medium">Voice:</span>
                  {lovableTtsProviderState === "google" ? (
                    <span className="text-xs text-muted-foreground italic px-2 py-0.5">
                      Default (Single voice)
                    </span>
                  ) : (
                    <select
                      data-testid="beginner-lovable-tts-voice-select"
                      value={
                        lovableTtsVoiceState ||
                        (lovableTtsProviderState === "openrouter" ? "alloy" : "Kore")
                      }
                      onChange={(e) => {
                        const v = e.target.value;
                        setLovableTtsVoiceState(v);
                        setLovableTtsVoice(v);
                      }}
                      className="rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground font-medium shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary hover:border-primary/50 cursor-pointer"
                    >
                      {lovableTtsProviderState === "openrouter"
                        ? OPENROUTER_VOICES.map((v) => (
                            <option key={v} value={v}>
                              {v} {v === "alloy" ? "(Default)" : ""}
                            </option>
                          ))
                        : LOVABLE_VOICES.map((v) => (
                            <option key={v} value={v}>
                              {v} {v === "Kore" ? "(Default)" : ""}
                            </option>
                          ))}
                    </select>
                  )}
                </div>
              </div>

              {/* OpenRouter API Key Settings */}
              <div className="space-y-1.5 pt-1 text-xs border-t border-border/40">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="beginner-openrouter-tts-key-input"
                    className="text-muted-foreground font-medium flex items-center gap-1.5"
                  >
                    <span>OpenRouter API Key:</span>
                    {hasCustomOpenRouterApiKey() ? (
                      <span
                        data-testid="beginner-custom-openrouter-key-badge"
                        className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal bg-emerald-500/10 px-1 rounded border border-emerald-500/30"
                      >
                        Custom key saved
                      </span>
                    ) : getServerOpenRouterApiKey() ? (
                      <span
                        data-testid="beginner-server-openrouter-key-badge"
                        className="text-[10px] text-blue-600 dark:text-blue-400 font-normal bg-blue-500/10 px-1 rounded border border-blue-500/30"
                      >
                        Using server .env key
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground font-normal">
                        (Optional - free tier default)
                      </span>
                    )}
                  </label>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <input
                      id="beginner-openrouter-tts-key-input"
                      data-testid="beginner-openrouter-tts-key-input"
                      type={showOpenRouterKey ? "text" : "password"}
                      value={openRouterKeyInput}
                      onChange={(e) => {
                        setOpenRouterKeyInput(e.target.value);
                        setOpenRouterKeySaved(false);
                      }}
                      placeholder={
                        getServerOpenRouterApiKey()
                          ? "Using server key (enter custom to override)"
                          : "sk-or-v1-..."
                      }
                      className="w-full rounded border border-input bg-background px-2.5 py-1 pr-8 text-xs font-mono text-foreground placeholder:text-muted-foreground/60"
                    />
                    <button
                      type="button"
                      data-testid="beginner-toggle-show-openrouter-key-btn"
                      onClick={() => setShowOpenRouterKey(!showOpenRouterKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                      title={showOpenRouterKey ? "Hide key" : "Show key"}
                    >
                      {showOpenRouterKey ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                  <button
                    type="button"
                    data-testid="beginner-save-openrouter-key-btn"
                    onClick={() => {
                      setLovableTtsApiKey(openRouterKeyInput);
                      setOpenRouterApiKeySetting(openRouterKeyInput);
                      setOpenRouterKeySaved(true);
                      setTimeout(() => setOpenRouterKeySaved(false), 2500);
                    }}
                    className="px-2.5 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium cursor-pointer"
                  >
                    {openRouterKeySaved ? "Saved!" : "Save"}
                  </button>
                  {openRouterKeyInput && (
                    <button
                      type="button"
                      data-testid="beginner-clear-openrouter-key-btn"
                      onClick={() => {
                        setOpenRouterKeyInput("");
                        setLovableTtsApiKey("");
                        setOpenRouterApiKeySetting("");
                      }}
                      className="px-2 py-1 rounded border border-input bg-background text-muted-foreground hover:text-foreground text-xs"
                      title="Clear custom key"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Native TTS Speed Notice (Uses native speech rate settings) */}
              <div
                data-testid="beginner-lovable-tts-native-speed-notice"
                className="flex items-center justify-between rounded border border-border/50 bg-muted/30 px-2.5 py-1.5 text-xs"
              >
                <span className="text-muted-foreground font-medium">TTS Speed:</span>
                <span className="text-foreground font-mono text-[11px]">
                  Uses native speech rate ({ttsSpeed.toFixed(1)}x)
                </span>
              </div>

              <p className="text-[10px] text-muted-foreground">
                Endpoint:{" "}
                <code className="bg-muted px-1 py-0.5 rounded text-[10px] font-mono">
                  https://tts2.lovable.app/api/public/tts
                </code>{" "}
                • Provider:{" "}
                <span className="font-semibold text-foreground font-mono">
                  {lovableTtsProviderState}
                </span>{" "}
                • Speaks subtitles using configured target language, current text, and native speech
                rate with voice:{" "}
                {lovableTtsProviderState === "google"
                  ? "Default"
                  : lovableTtsVoiceState ||
                    (lovableTtsProviderState === "openrouter" ? "alloy" : "Kore")}
                .
              </p>
            </div>

            <div>
              <button
                type="button"
                data-testid="btn-test-alternative-tts"
                disabled={isTestingAlternativeTts}
                onClick={async () => {
                  setIsTestingAlternativeTts(true);
                  try {
                    await playAlternativeTtsAudio(
                      "Hello world",
                      baseLanguage || "en",
                      ttsSpeed,
                      undefined,
                      "lovable",
                      {
                        provider: lovableTtsProviderState,
                        voice:
                          lovableTtsProviderState === "google"
                            ? undefined
                            : lovableTtsVoiceState ||
                              (lovableTtsProviderState === "openrouter" ? "alloy" : "Kore"),
                        speed: ttsSpeed,
                      },
                    );
                  } catch (err) {
                    console.warn("Test Alternative TTS error:", err);
                  } finally {
                    setIsTestingAlternativeTts(false);
                  }
                }}
                className="px-2.5 py-1 rounded border border-input bg-background hover:bg-muted text-xs font-mono inline-flex items-center gap-1.5 text-foreground disabled:opacity-60 cursor-pointer"
              >
                {isTestingAlternativeTts ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                    <span>Playing test audio…</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3 text-primary" />
                    <span>▶ Test Alternative TTS ("Hello world")</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {perLanguageTtsSettingsSlot}

      {/* 3. Favorite Languages Selector & Extender */}
      <div className="bg-card border border-border rounded-xl p-3.5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Languages className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-semibold text-foreground">Favorite Target Languages</h3>
          </div>
          <span className="text-[11px] text-muted-foreground">
            {favoriteLanguages.length} active
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground">
          The app fetches translations and prepares TTS speech for your favorite languages.
        </p>

        {/* Active Languages Chips */}
        <div className="flex flex-wrap gap-1.5 pt-1" data-testid="favorite-languages-chips">
          {favoriteLanguages.map((code) => {
            const found = ALL_KNOWN_LANGUAGES.find((l) => l.code === code);
            return (
              <Badge
                key={code}
                variant="secondary"
                className="bg-background border border-border text-foreground text-xs pl-2.5 pr-1 py-1 flex items-center gap-1.5"
                data-testid={`fav-lang-${code}`}
              >
                <span>{found ? found.name : code.toUpperCase()}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveLanguage(code)}
                  className="w-4 h-4 rounded hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"
                  aria-label={`Remove ${code}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            );
          })}
        </div>

        {/* Add Language Form */}
        <div className="flex items-center gap-2 pt-1">
          <select
            value={newLangCode}
            onChange={(e) => {
              if (e.target.value) {
                handleAddLanguage(e.target.value);
              }
            }}
            className="flex-1 h-8 rounded-md bg-background border border-border text-foreground text-xs px-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
            data-testid="add-lang-select"
          >
            <option value="">+ Add language to favorites...</option>
            {ALL_KNOWN_LANGUAGES.filter((l) => !favoriteLanguages.includes(l.code)).map((l) => (
              <option key={l.code} value={l.code}>
                {l.name} ({l.code})
              </option>
            ))}
          </select>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground pt-1">
          <span className="text-[10px] text-muted-foreground/70 mr-1">Quick add:</span>
          {commonPresets
            .filter((p) => !favoriteLanguages.includes(p.code))
            .map((p) => (
              <button
                key={p.code}
                type="button"
                onClick={() => handleAddLanguage(p.code)}
                className="px-2 py-0.5 rounded bg-background border border-border hover:border-primary/50 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              >
                +{p.name.split(" ")[0]}
              </button>
            ))}
        </div>
      </div>

      {/* Navigation Footer */}
      {onContinueToNextTab && (
        <div className="pt-2 flex justify-end">
          <Button
            type="button"
            size="sm"
            onClick={onContinueToNextTab}
            className="h-8 px-3 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-medium flex items-center gap-1.5"
            data-testid="btn-continue-to-video"
          >
            <span>Next: Video &amp; Captions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
};
