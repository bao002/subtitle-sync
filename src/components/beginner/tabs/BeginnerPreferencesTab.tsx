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
import { ALL_KNOWN_LANGUAGES } from "@/utils/appSettings";
import {
  playAlternativeTtsAudio,
  getUseAlternativeTts,
  getAlternativeTtsMode,
} from "@/lib/alternative-tts";

export interface BeginnerPreferencesTabProps {
  order: "video-first" | "tts-first";
  onOrderChange: (order: "video-first" | "tts-first") => void;
  ttsSpeed: number;
  onTtsSpeedChange: (speed: number) => void;
  ttsVoice: string;
  onTtsVoiceChange: (voiceURI: string) => void;
  subtitlesRatio: number;
  onSubtitlesRatioChange: (ratio: number) => void;
  favoriteLanguages: string[];
  onFavoriteLanguagesChange: (langs: string[]) => void;
  baseLanguage?: string;
  onContinueToNextTab?: () => void;
}

export const BeginnerPreferencesTab: React.FC<BeginnerPreferencesTabProps> = ({
  order,
  onOrderChange,
  ttsSpeed,
  onTtsSpeedChange,
  ttsVoice,
  onTtsVoiceChange,
  subtitlesRatio,
  onSubtitlesRatioChange,
  favoriteLanguages,
  onFavoriteLanguagesChange,
  baseLanguage = "en",
  onContinueToNextTab,
}) => {
  const [voices, setVoices] = useState<SpeechVoiceLike[]>(() => getCachedVoices());
  const [isAuditioning, setIsAuditioning] = useState(false);
  const [newLangCode, setNewLangCode] = useState("");

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
      playAlternativeTtsAudio(text, baseLanguage, ttsSpeed)
        .catch(() => {})
        .finally(() => setIsAuditioning(false));
      return;
    }

    if (!("speechSynthesis" in window)) {
      if (useAltTts) {
        setIsAuditioning(true);
        playAlternativeTtsAudio(text, baseLanguage, ttsSpeed)
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
          playAlternativeTtsAudio(text, baseLanguage, ttsSpeed)
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
        playAlternativeTtsAudio(text, baseLanguage, ttsSpeed)
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
    <div className="space-y-4 max-w-4xl mx-auto p-3" data-testid="beginner-preferences-tab">
      {/* Tab Title */}
      <div className="bg-card border border-border rounded-xl p-3.5 shadow-sm space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Step 2: Voice & Playback Preferences
            </h2>
            <p className="text-xs text-muted-foreground">
              Configure playback order, narration speed, speech voice, subtitle sizing, and favorite
              languages.
            </p>
          </div>
        </div>
      </div>

      {/* 1. Playback Order */}
      <div className="bg-card border border-border rounded-xl p-3.5 shadow-sm space-y-2.5">
        <h3 className="text-xs font-semibold text-foreground flex items-center justify-between">
          <span>Playback Narration Order</span>
          <Badge variant="outline" className="text-[10px] text-muted-foreground border-border">
            {order === "video-first" ? "Video First" : "TTS First"}
          </Badge>
        </h3>
        <p className="text-[11px] text-muted-foreground">
          Determine whether video audio leads and TTS follows, or TTS narrates first.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => onOrderChange("video-first")}
            className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
              order === "video-first"
                ? "bg-primary/10 border-primary text-foreground ring-1 ring-primary/40"
                : "bg-background border-border hover:border-primary/50 text-foreground"
            }`}
            data-testid="order-video-first"
          >
            <div
              className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                order === "video-first"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border"
              }`}
            >
              {order === "video-first" && <Check className="w-3 h-3" />}
            </div>
            <div>
              <div className="text-xs font-semibold text-foreground">Video First (Recommended)</div>
              <div className="text-[11px] text-muted-foreground">
                Natural video pacing; audio cues align with on-screen dialogue.
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onOrderChange("tts-first")}
            className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
              order === "tts-first"
                ? "bg-primary/10 border-primary text-foreground ring-1 ring-primary/40"
                : "bg-background border-border hover:border-primary/50 text-foreground"
            }`}
            data-testid="order-tts-first"
          >
            <div
              className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                order === "tts-first"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border"
              }`}
            >
              {order === "tts-first" && <Check className="w-3 h-3" />}
            </div>
            <div>
              <div className="text-xs font-semibold text-foreground">TTS First</div>
              <div className="text-[11px] text-muted-foreground">
                Spoken subtitle translation plays before advancing the video track.
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* 2. TTS Speed & Voice Selection */}
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
            <span className="text-[10px] text-muted-foreground/70">{filteredVoices.length} voices found</span>
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

      {/* 3. Subtitles Ratio Slider */}
      <div className="bg-card border border-border rounded-xl p-3.5 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-foreground">Subtitles Sizing Ratio</h3>
          <span className="font-semibold text-primary text-xs font-mono" data-testid="ratio-val">
            {subtitlesRatio.toFixed(2)}x
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Scale primary subtitles font size relative to translated subtitles for comfortable
          reading.
        </p>

        <Slider
          value={[subtitlesRatio]}
          onValueChange={([val]) => onSubtitlesRatioChange(val)}
          min={0.6}
          max={1.8}
          step={0.05}
          className="w-full"
          data-testid="subtitles-ratio-slider"
        />

        {/* Visual Live Sizing Preview */}
        <div className="bg-background border border-border rounded-lg p-3 text-center space-y-1">
          <div
            className="text-foreground font-medium transition-all"
            style={{ fontSize: `${Math.round(14 * subtitlesRatio)}px` }}
          >
            Base Subtitle Line Preview
          </div>
          <div className="text-xs text-muted-foreground">Translated Secondary Subtitle Line Preview</div>
        </div>
      </div>

      {/* 4. Favorite Languages Selector & Extender */}
      <div className="bg-card border border-border rounded-xl p-3.5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Languages className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-semibold text-foreground">Favorite Target Languages</h3>
          </div>
          <span className="text-[11px] text-muted-foreground">{favoriteLanguages.length} active</span>
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
            data-testid="btn-continue-to-parsing"
          >
            <span>Next: Subtitle Parsing</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
};
