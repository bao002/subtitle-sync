/**
 * Alternative Text-to-Speech (TTS) Service
 * Supports:
 * 1. Lovable Speak API (OpenAPI 3.1.0: https://tts2.lovable.app/api/public/openapi.json)
 *    Endpoint: https://tts2.lovable.app/api/public/tts
 *    CORS enabled (access-control-allow-origin: *)
 *    Provides multi-provider synthesis: "google", "lovable", "openrouter"
 * 2. Google Translate TTS (Legacy fallback)
 *    Endpoint: https://translate.google.com/translate_tts?ie=UTF-8&client=gtx&tl={lang}&q={text}
 */

export const LOVABLE_TTS_BASE_URL = "https://tts2.lovable.app";
export const LOVABLE_TTS_ENDPOINT = "https://tts2.lovable.app/api/public/tts";
export const LOVABLE_TTS_OPENAPI_URL = "https://tts2.lovable.app/api/public/openapi.json";
export const GOOGLE_TRANSLATE_TTS_ENDPOINT = "https://translate.google.com/translate_tts";

const STORAGE_KEY_USE_ALTERNATIVE_TTS = "yt_use_alternative_tts_v1";
const STORAGE_KEY_ALTERNATIVE_TTS_MODE = "yt_alternative_tts_mode_v1";
const STORAGE_KEY_ALTERNATIVE_TTS_ENGINE = "yt_alternative_tts_engine_v1";
const STORAGE_KEY_ALTERNATIVE_TTS_LOVABLE_PROVIDER = "yt_alternative_tts_lovable_provider_v1";
const STORAGE_KEY_ALTERNATIVE_TTS_LOVABLE_VOICE = "yt_alternative_tts_lovable_voice_v1";

export type AlternativeTtsMode = "fallback_only" | "always";
export type AlternativeTtsEngine = "lovable" | "google_translate";
export type LovableTtsProvider = "google" | "lovable" | "openrouter";

export const LOVABLE_TTS_PROVIDERS: readonly LovableTtsProvider[] = [
  "google",
  "lovable",
  "openrouter",
];

export const LOVABLE_VOICES = ["Kore", "Puck", "Fenrir", "Aoede"] as const;

export const OPENROUTER_VOICES = ["alloy", "nova", "echo", "fable", "onyx", "shimmer"] as const;

export interface LovableTtsOptions {
  provider?: LovableTtsProvider;
  voice?: string;
  format?: "binary" | "json";
  target_lang?: string;
  apiKey?: string;
}

export interface LovableTtsJsonResponse {
  audio: string;
  mime: string;
  text: string;
  lang: string;
}

/**
 * Normalizes language tag for TTS endpoints.
 */
export function normalizeLanguageCode(lang: string): string {
  let tl = (lang || "en").trim();
  if (tl.toLowerCase().startsWith("zh-cn") || tl.toLowerCase() === "zh_cn") {
    return "zh-CN";
  }
  if (tl.toLowerCase().startsWith("zh-tw") || tl.toLowerCase() === "zh_tw") {
    return "zh-TW";
  }
  tl = tl.split(/[-_]/)[0].toLowerCase();
  if (tl === "iw") return "he";
  if (tl === "in") return "id";
  if (tl === "ji") return "yi";
  return tl;
}

/**
 * Builds the Lovable Speak API URL according to the OpenAPI specification.
 * Endpoint: https://tts2.lovable.app/api/public/tts
 * Query parameters:
 * - text (required, string <= 5000 chars)
 * - lang (required, string e.g. "en")
 * - provider (optional, enum: "google", "lovable", "openrouter")
 * - voice (optional, string)
 * - format (optional, "binary" | "json", defaults to "binary")
 * - target_lang (optional, string)
 * - api_key (optional, string)
 */
export function buildLovableTtsUrl(
  text: string,
  lang: string,
  options?: LovableTtsOptions,
): string {
  if (!text) return "";
  const normalizedText = text.slice(0, 5000);
  const normalizedLang = normalizeLanguageCode(lang);

  const url = new URL(LOVABLE_TTS_ENDPOINT);
  url.searchParams.set("text", normalizedText);
  url.searchParams.set("lang", normalizedLang);

  const provider = options?.provider || getLovableTtsProvider();
  if (provider && provider !== "google") {
    url.searchParams.set("provider", provider);
  }

  const voice = options?.voice || getLovableTtsVoice();
  if (voice && voice.trim()) {
    url.searchParams.set("voice", voice.trim());
  }

  if (options?.target_lang) {
    url.searchParams.set("target_lang", options.target_lang);
  }

  const apiKey =
    options?.apiKey ||
    (provider === "openrouter" && typeof window !== "undefined"
      ? localStorage.getItem("yt_openrouter_api_key_v1") || ""
      : "");
  if (apiKey) {
    url.searchParams.set("api_key", apiKey);
  }

  const format = options?.format || "binary";
  url.searchParams.set("format", format);

  return url.toString();
}

/**
 * Fetches JSON response from Lovable Speak API (contains base64 audio and metadata).
 */
export async function fetchLovableTtsJson(
  text: string,
  lang: string,
  options?: LovableTtsOptions,
): Promise<LovableTtsJsonResponse | null> {
  const url = buildLovableTtsUrl(text, lang, { ...options, format: "json" });
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn("[LovableTTS] Request returned non-200 status:", res.status);
      return null;
    }
    return (await res.json()) as LovableTtsJsonResponse;
  } catch (err) {
    console.warn("[LovableTTS] Network error fetching speech JSON:", err);
    return null;
  }
}

/**
 * Builds the Google Translate TTS audio URL.
 */
export function buildGoogleTranslateTtsUrl(text: string, lang: string): string {
  if (!text) return "";
  const tl = normalizeLanguageCode(lang);
  const encodedText = encodeURIComponent(text);
  const encodedTl = encodeURIComponent(tl);

  return `${GOOGLE_TRANSLATE_TTS_ENDPOINT}?ie=UTF-8&client=gtx&tl=${encodedTl}&q=${encodedText}`;
}

/**
 * Builds the active alternative TTS URL based on the selected engine.
 */
export function buildAlternativeTtsUrl(
  text: string,
  lang: string,
  engine?: AlternativeTtsEngine,
): string {
  const activeEngine = engine || getAlternativeTtsEngine();
  if (activeEngine === "lovable") {
    return buildLovableTtsUrl(text, lang);
  }
  return buildGoogleTranslateTtsUrl(text, lang);
}

/**
 * Retrieves whether the alternative TTS service is enabled (off by default).
 */
export function getUseAlternativeTts(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const stored = localStorage.getItem(STORAGE_KEY_USE_ALTERNATIVE_TTS);
    return stored === "true";
  } catch {
    return false;
  }
}

/**
 * Stores whether the alternative TTS service is enabled.
 */
export function setUseAlternativeTts(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_USE_ALTERNATIVE_TTS, enabled ? "true" : "false");
  } catch (err) {
    console.warn("Failed to persist alternative TTS setting:", err);
  }
}

/**
 * Retrieves the alternative TTS mode: "fallback_only" (default) or "always".
 */
export function getAlternativeTtsMode(): AlternativeTtsMode {
  if (typeof window === "undefined") return "fallback_only";
  try {
    const stored = localStorage.getItem(STORAGE_KEY_ALTERNATIVE_TTS_MODE);
    if (stored === "always" || stored === "fallback_only") {
      return stored;
    }
  } catch {
    // ignore
  }
  return "fallback_only";
}

/**
 * Persists the alternative TTS mode.
 */
export function setAlternativeTtsMode(mode: AlternativeTtsMode): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_ALTERNATIVE_TTS_MODE, mode);
  } catch (err) {
    console.warn("Failed to persist alternative TTS mode:", err);
  }
}

/**
 * Retrieves the configured Alternative TTS Engine: "lovable" (default) or "google_translate".
 */
export function getAlternativeTtsEngine(): AlternativeTtsEngine {
  if (typeof window === "undefined") return "lovable";
  try {
    const stored = localStorage.getItem(STORAGE_KEY_ALTERNATIVE_TTS_ENGINE);
    if (stored === "google_translate" || stored === "lovable") {
      return stored;
    }
  } catch {
    // ignore
  }
  return "lovable";
}

/**
 * Persists the Alternative TTS Engine choice.
 */
export function setAlternativeTtsEngine(engine: AlternativeTtsEngine): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_ALTERNATIVE_TTS_ENGINE, engine);
  } catch (err) {
    console.warn("Failed to persist alternative TTS engine:", err);
  }
}

/**
 * Retrieves the configured Lovable TTS Provider: "google" | "lovable" | "openrouter".
 */
export function getLovableTtsProvider(): LovableTtsProvider {
  if (typeof window === "undefined") return "google";
  try {
    const stored = localStorage.getItem(STORAGE_KEY_ALTERNATIVE_TTS_LOVABLE_PROVIDER);
    if (stored === "google" || stored === "lovable" || stored === "openrouter") {
      return stored;
    }
  } catch {
    // ignore
  }
  return "google";
}

/**
 * Persists the Lovable TTS Provider choice.
 */
export function setLovableTtsProvider(provider: LovableTtsProvider): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_ALTERNATIVE_TTS_LOVABLE_PROVIDER, provider);
  } catch (err) {
    console.warn("Failed to persist Lovable TTS provider:", err);
  }
}

/**
 * Retrieves the configured Lovable voice name.
 */
export function getLovableTtsVoice(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(STORAGE_KEY_ALTERNATIVE_TTS_LOVABLE_VOICE) || "";
  } catch {
    return "";
  }
}

/**
 * Persists the Lovable voice name.
 */
export function setLovableTtsVoice(voice: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_ALTERNATIVE_TTS_LOVABLE_VOICE, voice.trim());
  } catch (err) {
    console.warn("Failed to persist Lovable TTS voice:", err);
  }
}

let activeAlternativeAudio: HTMLAudioElement | null = null;
let activeAudioReject: ((reason?: unknown) => void) | null = null;

/**
 * Cancels any currently playing alternative TTS audio.
 */
export function cancelAlternativeTtsAudio(): void {
  if (activeAlternativeAudio) {
    try {
      activeAlternativeAudio.pause();
      activeAlternativeAudio.currentTime = 0;
      activeAlternativeAudio.src = "";
    } catch {
      // ignore pause errors
    }
    activeAlternativeAudio = null;
  }
  if (activeAudioReject) {
    activeAudioReject(new Error("Alternative TTS cancelled"));
    activeAudioReject = null;
  }
}

/**
 * Plays an audio stream from the configured alternative TTS service (Lovable Speak API or Google Translate).
 */
export function playAlternativeTtsAudio(
  text: string,
  lang: string,
  rate: number = 0.5,
  onProgress?: (percent: number) => void,
  engineOverride?: AlternativeTtsEngine,
): Promise<void> {
  return new Promise((resolve) => {
    cancelAlternativeTtsAudio();

    if (!text || typeof window === "undefined") {
      return resolve();
    }

    const engine = engineOverride || getAlternativeTtsEngine();
    const url = buildAlternativeTtsUrl(text, lang, engine);
    if (!url) return resolve();

    const audio = new Audio();
    activeAlternativeAudio = audio;

    let hasEnded = false;
    const cleanup = () => {
      if (hasEnded) return;
      hasEnded = true;
      if (activeAlternativeAudio === audio) {
        activeAlternativeAudio = null;
        activeAudioReject = null;
      }
      audio.removeEventListener("ended", onEnd);
      audio.removeEventListener("error", onError);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      resolve();
    };

    const onEnd = () => {
      onProgress?.(100);
      cleanup();
    };

    const onError = (e: unknown) => {
      console.warn(`Alternative TTS (${engine}) audio error, attempting fallback:`, e);
      // If Lovable API had an issue and we didn't override, try Google Translate as secondary fallback
      if (engine === "lovable" && !engineOverride) {
        const fallbackUrl = buildGoogleTranslateTtsUrl(text, lang);
        if (fallbackUrl && activeAlternativeAudio === audio) {
          audio.src = fallbackUrl;
          const retryPromise = audio.play();
          if (retryPromise && typeof retryPromise.catch === "function") {
            retryPromise.catch(() => cleanup());
          }
          return;
        }
      }
      cleanup();
    };

    const onTimeUpdate = () => {
      if (audio.duration > 0 && onProgress) {
        const pct = Math.min(100, Math.round((audio.currentTime / audio.duration) * 100));
        onProgress(pct);
      }
    };

    audio.addEventListener("ended", onEnd);
    audio.addEventListener("error", onError);
    audio.addEventListener("timeupdate", onTimeUpdate);

    // Apply speech rate within 0.3 to 1.5 range
    try {
      audio.playbackRate = Math.max(0.3, Math.min(1.5, rate || 0.5));
    } catch {
      // ignore rate setting error
    }

    audio.src = url;
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch((err) => {
        console.warn("Alternative TTS playback rejected:", err);
        // Retry with Google Translate if Lovable failed
        if (engine === "lovable" && !engineOverride) {
          const fallbackUrl = buildGoogleTranslateTtsUrl(text, lang);
          if (fallbackUrl && activeAlternativeAudio === audio) {
            audio.src = fallbackUrl;
            const retryPromise = audio.play();
            if (retryPromise && typeof retryPromise.catch === "function") {
              retryPromise.catch(() => cleanup());
            }
            return;
          }
        }
        cleanup();
      });
    }
  });
}
