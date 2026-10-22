/**
 * URL State & Cache Reset Manager
 * - Synchronizes active video, timestamp, target language, TTS, captions, and layout mode to URL params.
 * - Handles URL-driven zero-memory cache resets via `reset_${cache/localstorage/all/etc}=true`.
 */

import { validateYouTubeUrl, DEFAULT_VIDEO_ID, DEFAULT_VIDEO_URL } from "./youtube";
import { clearSubtitleCache } from "./subtitleCache";
import { logInfo, logWarn } from "./logBuffer";

export const DEMO_SITE_BASE_URL = "https://mostuf2556.github.io/subtitle-sync";

export interface UrlAppState {
  videoId?: string;
  url?: string;
  time?: number;
  targetLang?: string;
  targetLanguages?: string[];
  targetLangs?: string[];
  autoTTS?: boolean;
  captionsEnabled?: boolean;
  mode?: "compact" | "expanded";
  // Rich sharable link parameters
  subUrl?: string; // Default subtitles URL (timedtext URL or fixture link)
  subtitlesUrl?: string; // Explicit alias for subtitles URL
  subData?: string; // Direct JSON3 / cues string payload
  subLang?: string; // Language code of default subtitles (e.g. "en")
  sourceLangCode?: string; // Alias for source language code
  openRouterApiKey?: string; // OpenRouter API key for quick AI restoration
  ttsProvider?: string; // TTS Provider identifier
}

export interface CreateShareableLinkOptions {
  videoId?: string;
  targetLang?: string;
  targetLangs?: string[];
  subUrl?: string;
  subtitlesUrl?: string;
  subData?: string;
  subLang?: string;
  sourceLangCode?: string;
  openRouterApiKey?: string;
  ttsProvider?: string;
  time?: number;
  baseUrl?: string;
  useDemoSiteBase?: boolean;
}

/**
 * Checks for any URL parameter starting with `reset_` or `reset=true`
 * and performs the corresponding storage/memory wipe for zero-memory testing.
 */
export function checkAndPerformUrlCacheReset(): { wasReset: boolean; resetKeys: string[] } {
  if (typeof window === "undefined" || !window.location) {
    return { wasReset: false, resetKeys: [] };
  }

  try {
    const params = new URLSearchParams(window.location.search);
    const resetKeys: string[] = [];

    params.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      const lowerVal = value.toLowerCase();
      if (
        (lowerKey.startsWith("reset_") || lowerKey === "reset") &&
        (lowerVal === "true" || lowerVal === "1" || lowerVal === "")
      ) {
        resetKeys.push(key);
      }
    });

    if (resetKeys.length === 0) {
      return { wasReset: false, resetKeys: [] };
    }

    // Determine reset scope
    const isFullReset = resetKeys.some((k) => {
      const lk = k.toLowerCase();
      return (
        lk === "reset" ||
        lk === "reset_all" ||
        lk === "reset_cache" ||
        lk === "reset_storage" ||
        lk === "reset_localstorage" ||
        lk === "reset_localhost" ||
        lk === "reset_memory"
      );
    });

    if (isFullReset) {
      try {
        localStorage.clear();
      } catch {}
      try {
        sessionStorage.clear();
      } catch {}
      clearSubtitleCache();
      logInfo(
        "System",
        `🧹 Full Zero-Memory Cache Reset triggered via URL [${resetKeys.join(", ")}]. All localStorage, sessionStorage, and memory caches wiped.`,
      );
    } else {
      // Granular resets
      resetKeys.forEach((k) => {
        const lk = k.toLowerCase();
        if (lk.includes("subtitles") || lk.includes("captions")) {
          clearSubtitleCache();
          Object.keys(localStorage).forEach((storageKey) => {
            if (storageKey.startsWith("yt_subtitles_")) {
              localStorage.removeItem(storageKey);
            }
          });
          logInfo("System", `🧹 Subtitles Cache Reset via ${k}`);
        }
        if (lk.includes("settings")) {
          localStorage.removeItem("yt_app_settings_v1");
          logInfo("System", `🧹 Settings Reset via ${k}`);
        }
        if (lk.includes("library") || lk.includes("history")) {
          localStorage.removeItem("yt_video_library_v2");
          localStorage.removeItem("yt_video_history");
          logInfo("System", `🧹 Video Library Reset via ${k}`);
        }
      });
    }

    // Clean up reset params from current browser URL bar without page reload
    const cleanParams = new URLSearchParams(window.location.search);
    resetKeys.forEach((k) => cleanParams.delete(k));
    const newSearch = cleanParams.toString();
    const newRelativePathQuery =
      window.location.pathname + (newSearch ? `?${newSearch}` : "") + window.location.hash;
    window.history.replaceState(null, "", newRelativePathQuery);

    return { wasReset: true, resetKeys };
  } catch (err) {
    console.warn("[UrlStateManager] Cache reset error:", err);
    return { wasReset: false, resetKeys: [] };
  }
}

/**
 * Parses application state from an arbitrary URL query string or search string
 */
export function parseShareableUrlState(searchOrQuery: string): UrlAppState {
  try {
    const rawSearch = searchOrQuery.startsWith("?")
      ? searchOrQuery.slice(1)
      : searchOrQuery.includes("?")
        ? searchOrQuery.slice(searchOrQuery.indexOf("?") + 1)
        : searchOrQuery;
    const params = new URLSearchParams(rawSearch);
    const state: UrlAppState = {};

    // Video ID or URL
    const rawUrlOrId =
      params.get("url") ||
      params.get("v") ||
      params.get("video") ||
      params.get("link") ||
      params.get("text");
    if (rawUrlOrId) {
      const validation = validateYouTubeUrl(rawUrlOrId);
      if (validation.isValid && validation.parsed) {
        state.videoId = validation.parsed.videoId;
        state.url = rawUrlOrId.startsWith("http")
          ? rawUrlOrId
          : `https://www.youtube.com/watch?v=${validation.parsed.videoId}`;
      } else if (rawUrlOrId.length === 11 && !rawUrlOrId.includes(" ")) {
        state.videoId = rawUrlOrId;
        state.url = `https://www.youtube.com/watch?v=${rawUrlOrId}`;
      }
    }

    // Playback time
    const t = params.get("t") || params.get("time") || params.get("start");
    if (t) {
      const sec = parseFloat(t);
      if (!isNaN(sec) && sec >= 0) {
        state.time = sec;
      }
    }

    // Target Language(s)
    const rawTargetLangs =
      params.get("Target_langs") ||
      params.get("target_langs") ||
      params.get("target_lang") ||
      params.get("target") ||
      params.get("tlang") ||
      params.get("lang");
    if (rawTargetLangs) {
      const langs = rawTargetLangs
        .split(",")
        .map((l) => l.toLowerCase().trim())
        .filter(Boolean);
      if (langs.length > 0) {
        state.targetLanguages = langs;
        state.targetLangs = langs;
        state.targetLang = langs[0];
      }
    }

    // Default Subtitles URL
    const subUrl =
      params.get("sub_url") ||
      params.get("subtitles_url") ||
      params.get("subs_url") ||
      params.get("caption_url") ||
      params.get("observed_url");
    if (subUrl) {
      const trimmed = subUrl.trim();
      state.subUrl = trimmed;
      state.subtitlesUrl = trimmed;
    }

    // Default Subtitles Data
    const subData = params.get("sub_data") || params.get("subs_data");
    if (subData) {
      state.subData = subData.trim();
    }

    // Default Subtitles Language / Source Language Code
    const subLang =
      params.get("source_lang_code") ||
      params.get("source_lang") ||
      params.get("sub_lang") ||
      params.get("base_lang");
    if (subLang) {
      state.subLang = subLang.toLowerCase().trim();
      state.sourceLangCode = state.subLang;
    }

    // TTS Provider
    const ttsProv = params.get("tts_provider") || params.get("ttsProvider");
    if (ttsProv) {
      state.ttsProvider = ttsProv.trim();
    }

    // OpenRouter API Key (handles plain and encoded)
    const openRouterApiKey =
      params.get("encoded_openrouter_key") ||
      params.get("openrouter_key") ||
      params.get("openrouter_api_key") ||
      params.get("ai_key") ||
      params.get("openrouterKey");
    if (openRouterApiKey) {
      let cleanedKey = openRouterApiKey.trim();
      try {
        cleanedKey = decodeURIComponent(cleanedKey);
      } catch {}
      state.openRouterApiKey = cleanedKey;
    }

    // Auto-TTS
    const tts = params.get("tts") || params.get("speech");
    if (tts !== null) {
      state.autoTTS = tts === "1" || tts === "true" || tts === "on";
    }

    // Captions toggle
    const cc = params.get("cc") || params.get("captions") || params.get("subs");
    if (cc !== null) {
      state.captionsEnabled = cc === "1" || cc === "true" || cc === "on";
    }

    // Mode
    const mode = params.get("mode") || params.get("layout");
    if (mode === "compact" || mode === "expanded") {
      state.mode = mode;
    }

    return state;
  } catch (err) {
    console.warn("[UrlStateManager] Error parsing URL app state:", err);
    return {};
  }
}

/**
 * Parses initial application state from URL query parameters
 */
export function getAppStateFromUrl(): UrlAppState {
  if (typeof window === "undefined" || !window.location) return {};
  return parseShareableUrlState(window.location.search);
}

/**
 * Creates a rich shareable link containing videoId, default subtitles URL/data, OpenRouter API key, target languages, and TTS provider
 */
export function createShareableLink(options: CreateShareableLinkOptions): string {
  const origin =
    options.baseUrl ||
    (options.useDemoSiteBase
      ? DEMO_SITE_BASE_URL
      : typeof window !== "undefined" && window.location
        ? `${window.location.origin}${window.location.pathname}`
        : DEMO_SITE_BASE_URL);
  const params = new URLSearchParams();

  if (options.videoId) {
    params.set("v", options.videoId);
  }
  const sourceLang = (options.sourceLangCode || options.subLang || "").toLowerCase().trim();
  if (sourceLang) {
    params.set("source_lang_code", sourceLang);
    params.set("sub_lang", sourceLang);
  }
  const rawSubUrl = (options.subtitlesUrl || options.subUrl || "").trim();
  if (rawSubUrl) {
    params.set("subtitles_url", rawSubUrl);
    params.set("sub_url", rawSubUrl);
  }
  if (options.targetLangs && options.targetLangs.length > 0) {
    const joined = options.targetLangs.map((l) => l.toLowerCase().trim()).join(",");
    params.set("Target_langs", joined);
    params.set("target_langs", joined);
    if (!options.targetLang) {
      params.set("target_lang", options.targetLangs[0].toLowerCase().trim());
    }
  }
  if (options.targetLang) {
    const tl = options.targetLang.toLowerCase().trim();
    params.set("target_lang", tl);
    if (!params.has("Target_langs")) {
      params.set("Target_langs", tl);
    }
  }
  if (options.ttsProvider) {
    params.set("tts_provider", options.ttsProvider.trim());
  }
  if (options.openRouterApiKey && options.openRouterApiKey.trim()) {
    const rawKey = options.openRouterApiKey.trim();
    params.set("encoded_openrouter_key", encodeURIComponent(rawKey));
    params.set("openrouter_key", rawKey);
  }
  if (options.subData) {
    params.set("sub_data", options.subData.trim());
  }
  if (typeof options.time === "number" && options.time > 0) {
    params.set("t", Math.floor(options.time).toString());
  }

  const query = params.toString();
  return query ? `${origin}?${query}` : origin;
}

/**
 * Convenience method to explicitly create a subtitles share link based on the official demo site
 */
export function createDemoSubtitlesShareLink(options: CreateShareableLinkOptions): string {
  return createShareableLink({
    ...options,
    baseUrl: DEMO_SITE_BASE_URL,
    useDemoSiteBase: true,
  });
}

let updateDebounceTimer: NodeJS.Timeout | null = null;

/**
 * Updates the current browser URL query parameters to reflect the active application state
 */
export function syncAppStateToUrl(state: {
  videoId?: string;
  url?: string;
  time?: number;
  targetLang?: string;
  autoTTS?: boolean;
  captionsEnabled?: boolean;
  mode?: "compact" | "expanded";
}): void {
  if (typeof window === "undefined" || !window.location) return;

  if (updateDebounceTimer) {
    clearTimeout(updateDebounceTimer);
  }

  updateDebounceTimer = setTimeout(() => {
    try {
      const params = new URLSearchParams(window.location.search);

      if (state.videoId) {
        params.set("v", state.videoId);
      }

      if (typeof state.time === "number" && state.time > 0) {
        params.set("t", Math.floor(state.time).toString());
      } else {
        params.delete("t");
      }

      if (state.targetLang) {
        params.set("lang", state.targetLang);
      }

      if (state.autoTTS !== undefined) {
        if (state.autoTTS) {
          params.set("tts", "1");
        } else {
          params.delete("tts");
        }
      }

      if (state.captionsEnabled !== undefined) {
        if (!state.captionsEnabled) {
          params.set("cc", "0");
        } else {
          params.delete("cc");
        }
      }

      if (state.mode) {
        if (state.mode === "expanded") {
          params.set("mode", "expanded");
        } else {
          params.delete("mode"); // Compact is default
        }
      }

      const queryString = params.toString();
      const newUrl =
        window.location.pathname + (queryString ? `?${queryString}` : "") + window.location.hash;
      window.history.replaceState(null, "", newUrl);
    } catch {}
  }, 350);
}
