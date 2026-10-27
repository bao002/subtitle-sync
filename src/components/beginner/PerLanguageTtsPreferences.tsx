import React from "react";
import { Gauge, Languages } from "lucide-react";
import { getLanguageVoices, getUniqueVoiceKey, SpeechVoiceLike } from "@/utils/speechVoiceUtils";
import { getLanguageTtsRatio } from "@/lib/playback-preferences";

export interface TtsPreferenceLanguage {
  code: string;
  name: string;
  tts: string;
}

interface PerLanguageTtsPreferencesProps {
  languages: TtsPreferenceLanguage[];
  voices: SpeechVoiceLike[];
  ratios: Record<string, number>;
  rates: Record<string, number>;
  voiceSelections: Record<string, string>;
  onRatioChange: (languageCode: string, ratio: number) => void;
  onRateChange: (languageCode: string, rate: number) => void;
  onVoiceChange: (languageCode: string, voiceURI: string) => void;
}

const ratioPresets = [1, 2, 3, 4, 5, 7, 10];

export const PerLanguageTtsPreferences: React.FC<PerLanguageTtsPreferencesProps> = ({
  languages,
  voices,
  ratios,
  rates,
  voiceSelections,
  onRatioChange,
  onRateChange,
  onVoiceChange,
}) => (
  <section
    className="bg-card border border-border rounded-xl p-3.5 shadow-sm space-y-3"
    data-testid="beginner-per-language-tts-settings"
  >
    <div className="flex items-center gap-2">
      <Gauge className="w-4 h-4 text-primary" />
      <h3 className="text-xs font-semibold text-foreground">Per-language TTS settings</h3>
    </div>
    <p className="text-[11px] text-muted-foreground">
      Choose narration frequency, speed, and an available device voice for each favorite language.
    </p>
    {languages.length === 0 ? (
      <p className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
        Add a favorite language below to configure its TTS settings.
      </p>
    ) : (
      <div className="space-y-2">
        {languages.map((language) => {
          const languageVoices = getLanguageVoices(voices, language.tts, true);
          const ratio = getLanguageTtsRatio(ratios, language.code);
          const rate = rates[language.code] ?? 0.5;
          return (
            <div
              key={language.code}
              className="grid grid-cols-1 gap-2 rounded-lg border border-border/60 bg-muted/20 p-2 sm:grid-cols-[minmax(6rem,1fr)_auto_minmax(8rem,1fr)_minmax(10rem,1.5fr)] sm:items-center"
              data-testid={`beginner-tts-language-${language.code}`}
            >
              <span className="flex items-center gap-1.5 truncate text-xs font-semibold text-foreground">
                <Languages className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                {language.name}
              </span>
              <label className="flex items-center gap-1.5 text-xs">
                <span className="text-muted-foreground">Speak</span>
                <select
                  aria-label={`${language.name} TTS sentence ratio`}
                  data-testid={`beginner-tts-ratio-${language.code}`}
                  value={ratio}
                  onChange={(event) =>
                    onRatioChange(
                      language.code,
                      Math.max(1, Math.min(10, Number(event.target.value))),
                    )
                  }
                  className="rounded border border-input bg-background px-1.5 py-1 text-xs"
                >
                  {ratioPresets.map((preset) => (
                    <option key={preset} value={preset}>
                      1:{preset}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex min-w-0 items-center gap-2 text-xs">
                <span className="shrink-0 text-muted-foreground">Speed</span>
                <input
                  aria-label={`${language.name} speech rate`}
                  data-testid={`beginner-tts-speed-${language.code}`}
                  type="range"
                  min={0.3}
                  max={1.5}
                  step={0.1}
                  value={rate}
                  onChange={(event) => onRateChange(language.code, Number(event.target.value))}
                  className="h-1.5 min-w-0 flex-1 cursor-pointer accent-primary"
                />
                <span className="w-8 shrink-0 text-right font-mono tabular-nums text-muted-foreground">
                  {rate.toFixed(1)}×
                </span>
              </label>
              <label className="flex min-w-0 items-center gap-1.5 text-xs">
                <span className="shrink-0 text-muted-foreground">Voice</span>
                <select
                  aria-label={`${language.name} voice`}
                  data-testid={`beginner-tts-voice-${language.code}`}
                  value={voiceSelections[language.code] ?? ""}
                  onChange={(event) => onVoiceChange(language.code, event.target.value)}
                  disabled={languageVoices.length === 0}
                  title={
                    languageVoices.length === 0
                      ? "No selectable voices on this device; the device default voice is used"
                      : "Choose a voice for this language"
                  }
                  className="min-w-0 flex-1 truncate rounded border border-input bg-background px-1.5 py-1 text-xs disabled:opacity-60"
                >
                  <option value="">
                    {languageVoices.length === 0 ? "Device voice" : "Default voice"}
                  </option>
                  {languageVoices.map((voice, index) => (
                    <option
                      key={getUniqueVoiceKey(voice, index)}
                      value={voice.voiceURI || voice.name}
                    >
                      {voice.name} {voice.lang ? `(${voice.lang})` : ""}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          );
        })}
      </div>
    )}
  </section>
);
