import React from "react";
import { Gauge, Languages, Film } from "lucide-react";
import { getLanguageVoices, getUniqueVoiceKey, SpeechVoiceLike } from "@/utils/speechVoiceUtils";
import { getLanguageTtsRatio } from "@/lib/playback-preferences";
import {
  VideoPlaybackPrecedenceBar,
  getVideoBarIndex,
  updatePrecedenceFromVideoBarIndex,
} from "@/components/VideoPlaybackPrecedenceBar";
import type { SectionOrder } from "@/lib/playback-preferences";

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
  languageOrders: Record<string, SectionOrder>;
  defaultOrder: SectionOrder;
  voiceSelections: Record<string, string>;
  primaryLang?: string;
  onPrimaryLangChange?: (languageCode: string) => void;
  onRatioChange: (languageCode: string, ratio: number) => void;
  onRateChange: (languageCode: string, rate: number) => void;
  onOrderChange: (languageCode: string, order: SectionOrder) => void;
  onDefaultOrderChange?: (order: SectionOrder) => void;
  onVoiceChange: (languageCode: string, voiceURI: string) => void;
}

const ratioPresets = [1, 2, 3, 4, 5, 7, 10];

export const PerLanguageTtsPreferences: React.FC<PerLanguageTtsPreferencesProps> = ({
  languages,
  voices,
  ratios,
  rates,
  languageOrders,
  defaultOrder,
  voiceSelections,
  primaryLang,
  onPrimaryLangChange,
  onRatioChange,
  onRateChange,
  onOrderChange,
  onDefaultOrderChange,
  onVoiceChange,
}) => {
  const effectivePrimary = primaryLang || languages[0]?.code || "";
  const primaryLangObj = languages.find((l) => l.code === effectivePrimary);
  const orderedCodes = languages.map((l) => l.code);
  const activeVideoBarIndex = getVideoBarIndex(orderedCodes, languageOrders, defaultOrder);
  const handleSetVideoBarPosition = (newIndex: number) => {
    const { sectionOrder: nextSectionOrder, languageOrders: nextLanguageOrders } =
      updatePrecedenceFromVideoBarIndex(orderedCodes, newIndex);
    onDefaultOrderChange?.(nextSectionOrder);
    for (const [code, ord] of Object.entries(nextLanguageOrders)) {
      onOrderChange(code, ord);
    }
  };

  return (
    <section
      className="bg-card border border-border rounded-xl p-3.5 shadow-sm space-y-3"
      data-testid="beginner-per-language-tts-settings"
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-semibold text-foreground">Per-language TTS settings</h3>
        </div>
        {languages.length > 1 && onPrimaryLangChange && (
          <button
            type="button"
            data-testid="tts-switch-roles-button"
            onClick={() => {
              const other = languages.find((l) => l.code !== effectivePrimary);
              if (other) onPrimaryLangChange(other.code);
            }}
            className="inline-flex items-center gap-1 rounded border border-border bg-background hover:bg-muted px-2 py-0.5 text-[11px] font-medium text-primary transition-colors"
            title="Switch primary and secondary roles"
          >
            ⇄ Switch Primary/Secondary
          </button>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground">
        Choose narration frequency, speed, and device voice. Secondary languages are activated
        relative to the primary language.
      </p>

      {languages.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
          Add a favorite language below to configure its TTS settings.
        </p>
      ) : (
        <div className="space-y-2">
          {activeVideoBarIndex === 0 && (
            <VideoPlaybackPrecedenceBar
              currentPosition={0}
              totalRecords={languages.length}
              onMoveUp={() => handleSetVideoBarPosition(0)}
              onMoveDown={() => handleSetVideoBarPosition(1)}
              onPlaceAtTop={() => handleSetVideoBarPosition(0)}
              onPlaceAtBottom={() => handleSetVideoBarPosition(languages.length)}
            />
          )}
          {languages.map((language, index) => {
            const languageVoices = getLanguageVoices(voices, language.tts, true);
            const ratio = getLanguageTtsRatio(ratios, language.code);
            const rate = rates[language.code] ?? 0.5;
            const isPrimary = language.code === effectivePrimary;
            return (
              <React.Fragment key={language.code}>
                <div
                  className="grid grid-cols-1 gap-2 rounded-lg border border-border/60 bg-muted/20 p-2 sm:grid-cols-[minmax(8rem,1fr)_auto_minmax(8rem,1fr)_minmax(10rem,1.5fr)_minmax(9rem,1fr)_auto] sm:items-center"
                  data-testid={`beginner-tts-language-${language.code}`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <Languages className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    {isPrimary ? (
                      <span className="truncate text-xs font-semibold text-primary flex items-center gap-1">
                        <span data-testid={`tts-switch-primary-${language.code}`}>
                          {language.name}
                        </span>
                        <span
                          data-testid={`tts-role-badge-${language.code}`}
                          className="rounded bg-primary/20 text-primary border border-primary/40 px-1 py-0.2 text-[9px] font-bold uppercase tracking-wider"
                        >
                          Primary
                        </span>
                      </span>
                    ) : (
                      <div className="flex items-center gap-1 truncate">
                        {onPrimaryLangChange ? (
                          <button
                            type="button"
                            data-testid={`tts-switch-primary-${language.code}`}
                            onClick={() => onPrimaryLangChange(language.code)}
                            className="truncate text-xs font-semibold text-foreground hover:text-primary hover:underline transition-colors cursor-pointer text-left"
                            title={`Set ${language.name} as Primary`}
                          >
                            {language.name}
                          </button>
                        ) : (
                          <span className="truncate text-xs font-semibold text-foreground">
                            {language.name}
                          </span>
                        )}
                        <span
                          data-testid={`tts-role-badge-${language.code}`}
                          className="rounded bg-muted text-muted-foreground border border-border px-1 py-0.2 text-[9px] font-medium"
                          title={`Relative to ${primaryLangObj?.name || "Primary"}`}
                        >
                          Sec (
                          {primaryLangObj?.name ? `rel. ${primaryLangObj.name}` : "rel. primary"})
                        </span>
                      </div>
                    )}
                  </div>
                  <label className="flex items-center gap-1.5 text-xs">
                    <span
                      className="text-muted-foreground truncate"
                      title={
                        isPrimary
                          ? "Speaks 1 in N sentences"
                          : `Speaks 1 in N sentences relative to ${primaryLangObj?.name || "primary"} activations`
                      }
                    >
                      Ratio
                    </span>
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
                          {isPrimary
                            ? `1:${preset} (Every ${preset === 1 ? "sentence" : `${preset} sentences`})`
                            : `1:${preset} (Every ${preset}× of ${primaryLangObj?.name || "Primary"})`}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex min-w-0 items-center gap-2 text-xs">
                    <span className="shrink-0 text-muted-foreground">Speed</span>
                    <select
                      aria-label={`${language.name} speech rate`}
                      data-testid={`beginner-tts-speed-${language.code}`}
                      value={rate.toFixed(1)}
                      onChange={(event) => onRateChange(language.code, Number(event.target.value))}
                      className="rounded border border-input bg-background px-1.5 py-1 text-xs font-mono"
                    >
                      {[0.5, 0.6, 0.7, 0.8, 0.9, 1.0].map((rateVal) => (
                        <option key={rateVal} value={rateVal.toFixed(1)}>
                          {rateVal.toFixed(1)}×
                        </option>
                      ))}
                    </select>
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
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      data-testid={`btn-place-video-before-${language.code}`}
                      onClick={() => handleSetVideoBarPosition(index)}
                      className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-[11px] font-medium transition-colors cursor-pointer shrink-0 ${
                        activeVideoBarIndex === index
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-muted-foreground hover:text-foreground"
                      }`}
                      title={`Place video playing precedence before ${language.name}`}
                    >
                      <Film className="h-3 w-3 shrink-0" />
                      <span className="hidden sm:inline">Place Video Here</span>
                    </button>
                  </div>
                </div>
                {activeVideoBarIndex === index + 1 && (
                  <VideoPlaybackPrecedenceBar
                    currentPosition={index + 1}
                    totalRecords={languages.length}
                    onMoveUp={() => handleSetVideoBarPosition(index)}
                    onMoveDown={() =>
                      handleSetVideoBarPosition(Math.min(languages.length, index + 2))
                    }
                    onPlaceAtTop={() => handleSetVideoBarPosition(0)}
                    onPlaceAtBottom={() => handleSetVideoBarPosition(languages.length)}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}
    </section>
  );
};
