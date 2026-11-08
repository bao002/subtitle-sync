import { APP_VERSION } from "../config/appConfig";
import {
  getFavoriteLanguagesPreference,
  getTargetLanguagesPreference,
  getBaseLanguagePreference,
  getPrimaryTtsLanguagePreference,
  getTtsRatiosPreference,
  getTtsBlacklist,
  getRatioCompositionsPreference,
  getTtsRatesPreference,
  getTtsVoicesPreference,
  getTtsLanguageOrdersPreference,
  getSubtitleRequestModePreference,
  getSectionOrderPreference,
  getTtsServiceTypePreference,
  getTtsAlternativeServicePreference,
  getTtsCustomEndpointPreference,
  setFavoriteLanguagesPreference,
  setTargetLanguagesPreference,
  setBaseLanguagePreference,
  setPrimaryTtsLanguagePreference,
  setTtsRatioPreference,
  setTtsBlacklist,
  saveRatioCompositionPreference,
  setTtsRatePreference,
  setTtsVoicePreference,
  setTtsLanguageOrderPreference,
  setSubtitleRequestModePreference,
  setSectionOrderPreference,
  setTtsServiceTypePreference,
  setTtsAlternativeServicePreference,
  setTtsCustomEndpointPreference,
  getAllZeroKnowledgeInLang,
  setAllZeroKnowledgeInLang,
  getPickWordStrategy,
  setPickWordStrategy,
  PickWordStrategy,
} from "../lib/playback-preferences";
import {
  getSpeakApiToken,
  setSpeakApiToken,
  getProviderApiKey,
  setProviderApiKey,
  getUseAlternativeTts,
  setUseAlternativeTts,
  getAlternativeTtsMode,
  setAlternativeTtsMode,
  getTtsFallbackOrder,
  setTtsFallbackOrder,
  TtsFallbackOrder,
  STORAGE_KEY_ALTERNATIVE_TTS_SPEAK_API_TOKEN,
  STORAGE_KEY_ALTERNATIVE_TTS_PROVIDER_API_KEY,
  STORAGE_KEY_USE_ALTERNATIVE_TTS,
  STORAGE_KEY_ALTERNATIVE_TTS_MODE,
  STORAGE_KEY_TTS_FALLBACK_ORDER,
} from "../lib/alternative-tts";
import {
  getStoredRatioCompositions,
  getActiveRatioCompositionId,
  setActiveRatioCompositionId,
  LanguageRatioComposition,
  RATIO_COMPOSITIONS_STORAGE_KEY,
  ACTIVE_RATIO_COMPOSITION_KEY,
} from "./ratioCompositionsManager";
import { loadAppSettings, saveAppSettings, AppSettings } from "./appSettings";

export interface ApplicationSettingsBackup {
  schemaVersion: number;
  exportedAt: string;
  appVersion: string;
  preferences: {
    favoriteLanguages?: string[];
    targetLanguages?: string[];
    baseLanguage?: string;
    primaryTtsLang?: string;
    ttsRatios?: Record<string, number>;
    ttsBlacklist?: string[];
    ratioCompositions?: Record<string, Record<string, number>>;
    ttsRates?: Record<string, number>;
    ttsVoices?: Record<string, string>;
    ttsLanguageOrders?: Record<string, string>;
    subtitleRequestMode?: string;
    sectionOrder?: string;
    ttsServiceType?: string;
    ttsAlternativeService?: string;
    ttsCustomEndpoint?: string;
    appSettings?: AppSettings;
    [key: string]: unknown;
  };
  rawLocalStorage?: Record<string, string>;
}

export interface ImportSettingsResult {
  success: boolean;
  importedKeysCount: number;
  message: string;
  error?: string;
}

function getSafeStorage(): {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  length?: number;
  key?: (idx: number) => string | null;
} | null {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }
  if (
    typeof globalThis !== "undefined" &&
    (globalThis as unknown as { localStorage?: Storage }).localStorage
  ) {
    return (globalThis as unknown as { localStorage: Storage }).localStorage;
  }
  return null;
}

/**
 * Exports current application settings and preferences into a standardized JSON backup object.
 */
export function createApplicationSettingsBackup(): ApplicationSettingsBackup {
  const preferences: ApplicationSettingsBackup["preferences"] = {
    favoriteLanguages: getFavoriteLanguagesPreference(),
    targetLanguages: getTargetLanguagesPreference(),
    baseLanguage: getBaseLanguagePreference(),
    primaryTtsLang: getPrimaryTtsLanguagePreference() ?? undefined,
    ttsRatios: getTtsRatiosPreference(),
    ttsBlacklist: getTtsBlacklist(),
    ratioCompositions: getRatioCompositionsPreference(),
    ttsRates: getTtsRatesPreference(),
    ttsVoices: getTtsVoicesPreference(),
    ttsLanguageOrders: getTtsLanguageOrdersPreference(),
    subtitleRequestMode: getSubtitleRequestModePreference(),
    sectionOrder: getSectionOrderPreference(),
    ttsServiceType: getTtsServiceTypePreference(),
    ttsAlternativeService: getTtsAlternativeServicePreference(),
    ttsCustomEndpoint: getTtsCustomEndpointPreference() ?? undefined,
    zeroKnowledgeInLang: getAllZeroKnowledgeInLang(),
    pickWordStrategy: getPickWordStrategy(),
    speakApiToken: getSpeakApiToken(),
    providerApiKey: getProviderApiKey(),
    useAlternativeTts: getUseAlternativeTts(),
    alternativeTtsMode: getAlternativeTtsMode(),
    ttsFallbackOrder: getTtsFallbackOrder(),
    storedRatioCompositions: getStoredRatioCompositions(),
    activeRatioCompositionId: getActiveRatioCompositionId(),
    appSettings: loadAppSettings(),
  };

  const rawLocalStorage: Record<string, string> = {};
  const s = getSafeStorage();

  if (s && typeof s.length === "number" && typeof s.key === "function") {
    for (let i = 0; i < s.length; i++) {
      const k = s.key(i);
      if (k && k.startsWith("yt_") && !k.startsWith("yt_subtitles_")) {
        const val = s.getItem(k);
        if (val !== null) {
          rawLocalStorage[k] = val;
        }
      }
    }
  }

  // Ensure explicit storage keys are included without omission or redaction
  const explicitStorageKeys = [
    STORAGE_KEY_ALTERNATIVE_TTS_SPEAK_API_TOKEN,
    STORAGE_KEY_ALTERNATIVE_TTS_PROVIDER_API_KEY,
    STORAGE_KEY_USE_ALTERNATIVE_TTS,
    STORAGE_KEY_ALTERNATIVE_TTS_MODE,
    STORAGE_KEY_TTS_FALLBACK_ORDER,
    RATIO_COMPOSITIONS_STORAGE_KEY,
    ACTIVE_RATIO_COMPOSITION_KEY,
  ];
  for (const k of explicitStorageKeys) {
    if (!rawLocalStorage[k]) {
      const v = s?.getItem(k);
      if (v !== null && v !== undefined) {
        rawLocalStorage[k] = v;
      }
    }
  }

  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    appVersion: APP_VERSION,
    preferences,
    rawLocalStorage,
  };
}

/**
 * Returns formatted JSON string of application settings.
 */
export function exportApplicationSettingsJson(pretty = true): string {
  const backup = createApplicationSettingsBackup();
  return JSON.stringify(backup, null, pretty ? 2 : undefined);
}

/**
 * Triggers a browser file download of the application settings backup.
 */
export function downloadApplicationSettings(filename?: string): boolean {
  if (typeof window === "undefined" || !window.document) return false;
  try {
    const jsonStr = exportApplicationSettingsJson(true);
    const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const dateStr = new Date().toISOString().slice(0, 10);
    const actualFilename = filename || `subtitle-sync-settings-${dateStr}.json`;

    const a = document.createElement("a");
    a.href = url;
    a.download = actualFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.error("Failed to download application settings:", err);
    return false;
  }
}

/**
 * Validates whether an unknown parsed payload matches the settings backup schema.
 */
export function validateSettingsBackup(data: unknown): data is ApplicationSettingsBackup {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return false;
  }
  const obj = data as Partial<ApplicationSettingsBackup>;
  // Accepts if it has preferences object or rawLocalStorage object or schemaVersion
  const hasPreferences = obj.preferences && typeof obj.preferences === "object";
  const hasRaw = obj.rawLocalStorage && typeof obj.rawLocalStorage === "object";
  const hasSchema = typeof obj.schemaVersion === "number";
  return Boolean(hasPreferences || hasRaw || hasSchema);
}

/**
 * Imports application settings from JSON string or object, restores them to localStorage,
 * and notifies active components.
 */
export function importApplicationSettings(jsonOrObj: string | unknown): ImportSettingsResult {
  try {
    let parsed: unknown = jsonOrObj;
    if (typeof jsonOrObj === "string") {
      try {
        parsed = JSON.parse(jsonOrObj.trim());
      } catch (err) {
        return {
          success: false,
          importedKeysCount: 0,
          message: "Invalid JSON format: Could not parse input string.",
          error: String(err),
        };
      }
    }

    if (!validateSettingsBackup(parsed)) {
      return {
        success: false,
        importedKeysCount: 0,
        message: "Invalid settings format: Missing valid preferences or settings schema.",
        error: "Schema validation failed",
      };
    }

    let count = 0;
    const s = getSafeStorage();

    // 1. Restore raw localStorage keys if present
    if (parsed.rawLocalStorage && typeof parsed.rawLocalStorage === "object") {
      for (const [key, val] of Object.entries(parsed.rawLocalStorage)) {
        if (typeof key === "string" && typeof val === "string") {
          try {
            s?.setItem(key, val);
            count++;
          } catch {
            // ignore
          }
        }
      }
    }

    // 2. Restore individual preferences via validated setters
    const prefs = parsed.preferences;
    if (prefs && typeof prefs === "object") {
      if (Array.isArray(prefs.favoriteLanguages)) {
        setFavoriteLanguagesPreference(prefs.favoriteLanguages);
        count++;
      }
      if (Array.isArray(prefs.targetLanguages)) {
        setTargetLanguagesPreference(prefs.targetLanguages);
        count++;
      }
      if (typeof prefs.baseLanguage === "string") {
        setBaseLanguagePreference(prefs.baseLanguage);
        count++;
      }
      if (typeof prefs.primaryTtsLang === "string") {
        setPrimaryTtsLanguagePreference(prefs.primaryTtsLang);
        count++;
      }
      if (prefs.ttsRatios && typeof prefs.ttsRatios === "object") {
        for (const [lang, ratio] of Object.entries(prefs.ttsRatios)) {
          if (typeof ratio === "number") {
            setTtsRatioPreference(lang, ratio);
            count++;
          }
        }
      }
      if (Array.isArray(prefs.ttsBlacklist)) {
        setTtsBlacklist(prefs.ttsBlacklist);
        count++;
      }
      if (prefs.ratioCompositions && typeof prefs.ratioCompositions === "object") {
        for (const [name, comp] of Object.entries(prefs.ratioCompositions)) {
          if (typeof name === "string" && comp && typeof comp === "object") {
            saveRatioCompositionPreference(name, comp as Record<string, number>);
            count++;
          }
        }
      }
      if (prefs.ttsRates && typeof prefs.ttsRates === "object") {
        for (const [lang, rate] of Object.entries(prefs.ttsRates)) {
          if (typeof rate === "number") {
            setTtsRatePreference(lang, rate);
            count++;
          }
        }
      }
      if (prefs.ttsVoices && typeof prefs.ttsVoices === "object") {
        for (const [lang, voice] of Object.entries(prefs.ttsVoices)) {
          if (typeof voice === "string") {
            setTtsVoicePreference(lang, voice);
            count++;
          }
        }
      }
      if (prefs.ttsLanguageOrders && typeof prefs.ttsLanguageOrders === "object") {
        for (const [lang, order] of Object.entries(prefs.ttsLanguageOrders)) {
          if (typeof order === "string") {
            setTtsLanguageOrderPreference(lang, order as any);
            count++;
          }
        }
      }
      if (typeof prefs.subtitleRequestMode === "string") {
        setSubtitleRequestModePreference(prefs.subtitleRequestMode as any);
        count++;
      }
      if (typeof prefs.sectionOrder === "string") {
        setSectionOrderPreference(prefs.sectionOrder as any);
        count++;
      }
      if (typeof prefs.ttsServiceType === "string") {
        setTtsServiceTypePreference(prefs.ttsServiceType as any);
        count++;
      }
      if (typeof prefs.ttsAlternativeService === "string") {
        setTtsAlternativeServicePreference(prefs.ttsAlternativeService as any);
        count++;
      }
      if (typeof prefs.ttsCustomEndpoint === "string") {
        setTtsCustomEndpointPreference(prefs.ttsCustomEndpoint);
        count++;
      }
      if (prefs.zeroKnowledgeInLang && typeof prefs.zeroKnowledgeInLang === "object") {
        setAllZeroKnowledgeInLang(prefs.zeroKnowledgeInLang as Record<string, boolean>);
        count++;
      }
      if (
        typeof prefs.pickWordStrategy === "string" &&
        (prefs.pickWordStrategy === "longest" || prefs.pickWordStrategy === "random")
      ) {
        setPickWordStrategy(prefs.pickWordStrategy as PickWordStrategy);
        count++;
      }
      if (prefs.appSettings && typeof prefs.appSettings === "object") {
        saveAppSettings(prefs.appSettings as AppSettings);
        count++;
      }
      if (typeof prefs.speakApiToken === "string") {
        setSpeakApiToken(prefs.speakApiToken);
        count++;
      }
      if (typeof prefs.providerApiKey === "string") {
        setProviderApiKey(prefs.providerApiKey);
        count++;
      }
      if (typeof prefs.useAlternativeTts === "boolean") {
        setUseAlternativeTts(prefs.useAlternativeTts);
        count++;
      }
      if (typeof prefs.alternativeTtsMode === "string") {
        setAlternativeTtsMode(prefs.alternativeTtsMode as any);
        count++;
      }
      if (typeof prefs.ttsFallbackOrder === "string") {
        setTtsFallbackOrder(prefs.ttsFallbackOrder as TtsFallbackOrder);
        count++;
      }
      if (Array.isArray(prefs.storedRatioCompositions)) {
        try {
          s?.setItem(RATIO_COMPOSITIONS_STORAGE_KEY, JSON.stringify(prefs.storedRatioCompositions));
          count++;
        } catch {
          // ignore
        }
      }
      if (typeof prefs.activeRatioCompositionId === "string") {
        setActiveRatioCompositionId(prefs.activeRatioCompositionId);
        count++;
      }
    }

    // 3. Dispatch event to notify runtime React state
    if (typeof window !== "undefined") {
      try {
        window.dispatchEvent(
          new CustomEvent("yt:settings-imported", {
            detail: parsed,
          }),
        );
      } catch {
        // ignore
      }
    }

    return {
      success: true,
      importedKeysCount: count,
      message: `Successfully imported settings (${count} keys restored).`,
    };
  } catch (err) {
    return {
      success: false,
      importedKeysCount: 0,
      message: `Failed to import settings: ${String(err)}`,
      error: String(err),
    };
  }
}
