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
const STORAGE_KEY_ALTERNATIVE_TTS_LOVABLE_SPEED = "yt_alternative_tts_lovable_speed_v1";
const STORAGE_KEY_ALTERNATIVE_TTS_LOVABLE_OPTIONS = "yt_alternative_tts_lovable_options_v1";
const STORAGE_KEY_ALTERNATIVE_TTS_LOVABLE_METHOD = "yt_alternative_tts_lovable_method_v1";
const STORAGE_KEY_ALTERNATIVE_TTS_LOVABLE_FORMAT = "yt_alternative_tts_lovable_format_v1";
const STORAGE_KEY_ALTERNATIVE_TTS_LOVABLE_TARGET_LANG = "yt_alternative_tts_lovable_target_lang_v1";
const STORAGE_KEY_ALTERNATIVE_TTS_LOVABLE_API_KEY = "yt_alternative_tts_lovable_api_key_v1";

export type AlternativeTtsMode = "fallback_only" | "always";
export type AlternativeTtsEngine = "lovable" | "google_translate";
export type LovableTtsProvider = "google" | "lovable" | "openrouter";
export type LovableTtsMethod = "get" | "post";
export type LovableTtsFormat = "binary" | "json";

export const LOVABLE_TTS_PROVIDERS: readonly LovableTtsProvider[] = [
  "google",
  "lovable",
  "openrouter",
];

export const LOVABLE_VOICES = ["Kore", "Puck", "Charon", "Fenrir", "Aoede"] as const;

export const OPENROUTER_VOICES = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"] as const;

export interface LovableTtsOptions {
  provider?: LovableTtsProvider;
  voice?: string;
  speed?: number;
  options?: Record<string, unknown> | string;
  format?: LovableTtsFormat;
  target_lang?: string;
  apiKey?: string;
  method?: LovableTtsMethod;
}

export interface LovableTtsRequestBody {
  text: string;
  lang: string;
  target_lang?: string;
  provider?: LovableTtsProvider;
  api_key?: string;
  voice?: string;
  speed?: number;
  options?: Record<string, unknown>;
  format?: LovableTtsFormat;
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

  const voice = options?.voice ?? getLovableTtsVoice();
  if (voice && voice.trim()) {
    url.searchParams.set("voice", voice.trim());
  }

  const speed = options?.speed ?? getLovableTtsSpeed();
  if (typeof speed === "number" && !isNaN(speed) && speed !== 1) {
    const clampedSpeed = Math.max(0.25, Math.min(4, Math.round(speed * 100) / 100));
    url.searchParams.set("speed", String(clampedSpeed));
  }

  const rawOptions = options?.options ?? getLovableTtsOptions();
  if (rawOptions) {
    if (typeof rawOptions === "string" && rawOptions.trim()) {
      url.searchParams.set("options", rawOptions.trim());
    } else if (typeof rawOptions === "object" && Object.keys(rawOptions).length > 0) {
      url.searchParams.set("options", JSON.stringify(rawOptions));
    }
  }

  const targetLang = options?.target_lang ?? getLovableTtsTargetLang();
  if (targetLang && targetLang.trim()) {
    url.searchParams.set("target_lang", targetLang.trim());
  }

  const apiKey =
    options?.apiKey ??
    getLovableTtsApiKey() ??
    (provider === "openrouter" && typeof window !== "undefined"
      ? localStorage.getItem("yt_openrouter_api_key_v1") || ""
      : "");
  if (apiKey && apiKey.trim()) {
    url.searchParams.set("api_key", apiKey.trim());
  }

  const format = options?.format || getLovableTtsFormat();
  url.searchParams.set("format", format);

  return url.toString();
}

/**
 * Builds the request body for Lovable Speak API POST requests (application/json).
 */
export function buildLovableTtsRequestBody(
  text: string,
  lang: string,
  options?: LovableTtsOptions,
): LovableTtsRequestBody {
  const normalizedText = (text || "").slice(0, 5000);
  const normalizedLang = normalizeLanguageCode(lang);
  const provider = options?.provider || getLovableTtsProvider();
  const voice = options?.voice ?? getLovableTtsVoice();
  const speed = options?.speed ?? getLovableTtsSpeed();
  const rawOptions = options?.options ?? getLovableTtsOptions();
  const targetLang = options?.target_lang ?? getLovableTtsTargetLang();
  const apiKey =
    options?.apiKey ??
    getLovableTtsApiKey() ??
    (provider === "openrouter" && typeof window !== "undefined"
      ? localStorage.getItem("yt_openrouter_api_key_v1") || ""
      : "");
  const format = options?.format || getLovableTtsFormat();

  const body: LovableTtsRequestBody = {
    text: normalizedText,
    lang: normalizedLang,
    format,
  };
  if (provider && provider !== "google") {
    body.provider = provider;
  }
  if (voice && voice.trim()) {
    body.voice = voice.trim();
  }
  if (typeof speed === "number" && !isNaN(speed) && speed !== 1) {
    body.speed = Math.max(0.25, Math.min(4, Math.round(speed * 100) / 100));
  }
  if (rawOptions) {
    if (typeof rawOptions === "string" && rawOptions.trim()) {
      try {
        body.options = JSON.parse(rawOptions.trim());
      } catch {
        // ignore malformed options json in request body
      }
    } else if (typeof rawOptions === "object" && Object.keys(rawOptions).length > 0) {
      body.options = rawOptions as Record<string, unknown>;
    }
  }
  if (targetLang && targetLang.trim()) {
    body.target_lang = targetLang.trim();
  }
  if (apiKey && apiKey.trim()) {
    body.api_key = apiKey.trim();
  }
  return body;
}

/**
 * Synthesizes speech using the Lovable Speak API POST endpoint (application/json).
 * Supports both binary audio streams (creates blob URL) and JSON base64 payloads.
 */
export async function synthesizeLovableTtsPost(
  text: string,
  lang: string,
  options?: LovableTtsOptions,
): Promise<{ url: string; revokeOnDone?: boolean } | null> {
  if (!text) return null;
  const body = buildLovableTtsRequestBody(text, lang, options);
  try {
    const res = await fetch(LOVABLE_TTS_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.warn("[LovableTTS] POST synthesis failed with status:", res.status);
      return null;
    }
    const format = body.format || "binary";
    if (format === "json") {
      const data = (await res.json()) as LovableTtsJsonResponse;
      if (!data?.audio) return null;
      const mime = data.mime || "audio/mpeg";
      return { url: `data:${mime};base64,${data.audio}`, revokeOnDone: false };
    } else {
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      return { url: objectUrl, revokeOnDone: true };
    }
  } catch (err) {
    console.warn("[LovableTTS] Network error during POST speech synthesis:", err);
    return null;
  }
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
 * Synthesizes audio using Lovable Speak API according to configured method (GET or POST)
 * and response format (binary audio stream or base64 JSON payload).
 */
export async function synthesizeLovableTtsAudio(
  text: string,
  lang: string,
  options?: LovableTtsOptions,
): Promise<{ url: string; revokeOnDone?: boolean } | null> {
  const method = options?.method || getLovableTtsMethod();
  const format = options?.format || getLovableTtsFormat();

  if (method === "post") {
    return synthesizeLovableTtsPost(text, lang, { ...options, format });
  }

  // GET method
  if (format === "json") {
    const jsonRes = await fetchLovableTtsJson(text, lang, options);
    if (!jsonRes?.audio) return null;
    const mime = jsonRes.mime || "audio/mpeg";
    return { url: `data:${mime};base64,${jsonRes.audio}`, revokeOnDone: false };
  }

  // GET binary
  const getUrl = buildLovableTtsUrl(text, lang, options);
  if (!getUrl) return null;
  return { url: getUrl, revokeOnDone: false };
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
 * Retrieves the configured Lovable TTS Provider: "lovable", "google", or "openrouter" (defaults to "lovable").
 */
export function getLovableTtsProvider(): LovableTtsProvider {
  try {
    const stored =
      typeof localStorage !== "undefined"
        ? localStorage.getItem(STORAGE_KEY_ALTERNATIVE_TTS_LOVABLE_PROVIDER)
        : memoryFallbackStore[STORAGE_KEY_ALTERNATIVE_TTS_LOVABLE_PROVIDER];
    if (stored === "google" || stored === "lovable" || stored === "openrouter") {
      return stored;
    }
  } catch {
    // ignore
  }
  return "lovable";
}

/**
 * Persists the Lovable TTS Provider choice.
 */
export function setLovableTtsProvider(provider: LovableTtsProvider): void {
  const p = provider === "google" || provider === "openrouter" ? provider : "lovable";
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY_ALTERNATIVE_TTS_LOVABLE_PROVIDER, p);
    }
  } catch (err) {
    console.warn("Failed to persist Lovable TTS provider:", err);
  }
  memoryFallbackStore[STORAGE_KEY_ALTERNATIVE_TTS_LOVABLE_PROVIDER] = p;
}

/**
 * Retrieves the configured Lovable voice name (defaults to "Kore").
 */
export function getLovableTtsVoice(): string {
  try {
    const stored =
      typeof localStorage !== "undefined"
        ? localStorage.getItem(STORAGE_KEY_ALTERNATIVE_TTS_LOVABLE_VOICE)
        : memoryFallbackStore[STORAGE_KEY_ALTERNATIVE_TTS_LOVABLE_VOICE];
    if (stored && stored.trim()) {
      return stored.trim();
    }
  } catch {
    // ignore
  }
  return "Kore";
}

/**
 * Persists the Lovable voice name.
 */
export function setLovableTtsVoice(voice: string): void {
  const v = (voice || "Kore").trim();
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY_ALTERNATIVE_TTS_LOVABLE_VOICE, v);
    }
  } catch (err) {
    console.warn("Failed to persist Lovable TTS voice:", err);
  }
  memoryFallbackStore[STORAGE_KEY_ALTERNATIVE_TTS_LOVABLE_VOICE] = v;
}

/**
 * Retrieves the configured Lovable TTS speed multiplier (0.25 to 4.0, defaults to 1.0).
 */
const memoryFallbackStore: Record<string, string> = {};

/**
 * Retrieves the configured Lovable TTS speed multiplier (0.25 to 4.0, defaults to 1.0).
 */
export function getLovableTtsSpeed(): number {
  try {
    const stored =
      typeof localStorage !== "undefined"
        ? localStorage.getItem(STORAGE_KEY_ALTERNATIVE_TTS_LOVABLE_SPEED)
        : memoryFallbackStore[STORAGE_KEY_ALTERNATIVE_TTS_LOVABLE_SPEED];
    if (stored !== null && stored !== undefined) {
      const parsed = parseFloat(stored);
      if (!isNaN(parsed) && parsed >= 0.25 && parsed <= 4.0) {
        return Math.round(parsed * 100) / 100;
      }
    }
  } catch {
    // ignore
  }
  return 1.0;
}

/**
 * Persists the Lovable TTS speed multiplier (clamped to 0.25 - 4.0).
 */
export function setLovableTtsSpeed(speed: number): void {
  const clamped = Math.max(0.25, Math.min(4.0, Math.round(speed * 100) / 100));
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY_ALTERNATIVE_TTS_LOVABLE_SPEED, String(clamped));
    }
  } catch (err) {
    console.warn("Failed to persist Lovable TTS speed:", err);
  }
  memoryFallbackStore[STORAGE_KEY_ALTERNATIVE_TTS_LOVABLE_SPEED] = String(clamped);
}

/**
 * Retrieves the configured Lovable TTS options JSON string (e.g. '{"temperature": 0.7}' or "").
 */
export function getLovableTtsOptions(): string {
  try {
    if (typeof localStorage !== "undefined") {
      return localStorage.getItem(STORAGE_KEY_ALTERNATIVE_TTS_LOVABLE_OPTIONS) || "";
    }
  } catch {
    // ignore
  }
  return memoryFallbackStore[STORAGE_KEY_ALTERNATIVE_TTS_LOVABLE_OPTIONS] || "";
}

/**
 * Persists the Lovable TTS options JSON string.
 */
export function setLovableTtsOptions(options: string): void {
  const val = (options || "").trim();
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY_ALTERNATIVE_TTS_LOVABLE_OPTIONS, val);
    }
  } catch (err) {
    console.warn("Failed to persist Lovable TTS options:", err);
  }
  memoryFallbackStore[STORAGE_KEY_ALTERNATIVE_TTS_LOVABLE_OPTIONS] = val;
}

/**
 * Retrieves the configured Lovable TTS HTTP Method: "get" (default) or "post".
 */
export function getLovableTtsMethod(): LovableTtsMethod {
  if (typeof window === "undefined") return "get";
  try {
    const stored = localStorage.getItem(STORAGE_KEY_ALTERNATIVE_TTS_LOVABLE_METHOD);
    if (stored === "get" || stored === "post") {
      return stored;
    }
  } catch {
    // ignore
  }
  return "get";
}

/**
 * Persists the Lovable TTS HTTP Method choice.
 */
export function setLovableTtsMethod(method: LovableTtsMethod): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_ALTERNATIVE_TTS_LOVABLE_METHOD, method);
  } catch (err) {
    console.warn("Failed to persist Lovable TTS method:", err);
  }
}

/**
 * Retrieves the configured Lovable TTS response format: "binary" (default) or "json".
 */
export function getLovableTtsFormat(): LovableTtsFormat {
  if (typeof window === "undefined") return "binary";
  try {
    const stored = localStorage.getItem(STORAGE_KEY_ALTERNATIVE_TTS_LOVABLE_FORMAT);
    if (stored === "binary" || stored === "json") {
      return stored;
    }
  } catch {
    // ignore
  }
  return "binary";
}

/**
 * Persists the Lovable TTS response format choice.
 */
export function setLovableTtsFormat(format: LovableTtsFormat): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_ALTERNATIVE_TTS_LOVABLE_FORMAT, format);
  } catch (err) {
    console.warn("Failed to persist Lovable TTS format:", err);
  }
}

/**
 * Retrieves the configured Lovable TTS target language code (e.g. "es", "he", or "" if none).
 */
export function getLovableTtsTargetLang(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(STORAGE_KEY_ALTERNATIVE_TTS_LOVABLE_TARGET_LANG) || "";
  } catch {
    return "";
  }
}

/**
 * Persists the Lovable TTS target language code.
 */
export function setLovableTtsTargetLang(targetLang: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_ALTERNATIVE_TTS_LOVABLE_TARGET_LANG, targetLang.trim());
  } catch (err) {
    console.warn("Failed to persist Lovable TTS target language:", err);
  }
}

/**
 * Retrieves the server-configured OpenRouter API key from .env.
 */
export function getServerOpenRouterApiKey(): string {
  try {
    return typeof import.meta !== "undefined" && import.meta.env
      ? (import.meta.env.VITE_OPENROUTER_API_KEY as string) || ""
      : "";
  } catch {
    return "";
  }
}

/**
 * Checks if the user has explicitly configured a custom OpenRouter API key in localStorage.
 */
export function hasCustomOpenRouterApiKey(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const userKey =
      localStorage.getItem(STORAGE_KEY_ALTERNATIVE_TTS_LOVABLE_API_KEY) ||
      localStorage.getItem("yt_openrouter_api_key_v1") ||
      localStorage.getItem("yt_openrouter_api_key") ||
      "";
    return Boolean(userKey && userKey.trim());
  } catch {
    return false;
  }
}

/**
 * Retrieves the effective Lovable/OpenRouter API key (custom user key, or server .env key fallback).
 */
export function getLovableTtsApiKey(): string {
  if (typeof window === "undefined") return "";
  try {
    const userKey =
      localStorage.getItem(STORAGE_KEY_ALTERNATIVE_TTS_LOVABLE_API_KEY) ||
      localStorage.getItem("yt_openrouter_api_key_v1") ||
      localStorage.getItem("yt_openrouter_api_key") ||
      "";
    if (userKey && userKey.trim()) {
      return userKey.trim();
    }
    return getServerOpenRouterApiKey();
  } catch {
    return "";
  }
}

/**
 * Persists the Lovable/OpenRouter API key to localStorage.
 */
export function setLovableTtsApiKey(apiKey: string): void {
  if (typeof window === "undefined") return;
  const clean = apiKey.trim();
  try {
    if (clean) {
      localStorage.setItem(STORAGE_KEY_ALTERNATIVE_TTS_LOVABLE_API_KEY, clean);
      localStorage.setItem("yt_openrouter_api_key_v1", clean);
      localStorage.setItem("yt_openrouter_api_key", clean);
    } else {
      localStorage.removeItem(STORAGE_KEY_ALTERNATIVE_TTS_LOVABLE_API_KEY);
      localStorage.removeItem("yt_openrouter_api_key_v1");
      localStorage.removeItem("yt_openrouter_api_key");
    }
  } catch (err) {
    console.warn("Failed to persist Lovable TTS API key:", err);
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
export async function playAlternativeTtsAudio(
  text: string,
  lang: string,
  rate: number = 0.5,
  onProgress?: (percent: number) => void,
  engineOverride?: AlternativeTtsEngine,
  optionsOverride?: LovableTtsOptions,
): Promise<void> {
  cancelAlternativeTtsAudio();

  if (!text || typeof window === "undefined") {
    return;
  }

  const engine = engineOverride || getAlternativeTtsEngine();

  let audioUrl = "";
  let shouldRevoke = false;

  if (engine === "lovable") {
    try {
      const requestedSpeed =
        optionsOverride?.speed ?? (typeof rate === "number" && rate > 0 ? rate : 1.0);
      const mergedOptions: LovableTtsOptions = {
        speed: requestedSpeed,
        ...optionsOverride,
      };
      const synthesized = await synthesizeLovableTtsAudio(text, lang, mergedOptions);
      if (synthesized?.url) {
        audioUrl = synthesized.url;
        shouldRevoke = Boolean(synthesized.revokeOnDone);
      }
    } catch (err) {
      console.warn("[LovableTTS] Synthesis error, will attempt fallback:", err);
    }
  }

  if (!audioUrl) {
    audioUrl = buildGoogleTranslateTtsUrl(text, lang);
  }
  if (!audioUrl) return;

  return new Promise((resolve) => {
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
      if (shouldRevoke && audioUrl.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(audioUrl);
        } catch {
          // ignore revoke error
        }
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

    function fallbackToWebSpeech() {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        try {
          window.speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(text);
          u.lang = normalizeLanguageCode(lang);
          u.rate = Math.max(0.5, Math.min(2.0, rate || 1.0));
          u.onend = () => cleanup();
          u.onerror = () => cleanup();
          window.speechSynthesis.speak(u);
          return;
        } catch {
          // ignore
        }
      }
      cleanup();
    }

    const onError = (e: unknown) => {
      console.warn(`Alternative TTS (${engine}) audio error, attempting fallback:`, e);
      const fallbackUrl = buildGoogleTranslateTtsUrl(text, lang);
      if (fallbackUrl && activeAlternativeAudio === audio && audio.src !== fallbackUrl) {
        try {
          audio.playbackRate = Math.max(0.3, Math.min(1.5, rate || 0.5));
        } catch {
          // ignore
        }
        audio.src = fallbackUrl;
        const retryPromise = audio.play();
        if (retryPromise && typeof retryPromise.catch === "function") {
          retryPromise.catch(() => fallbackToWebSpeech());
        }
        return;
      }
      fallbackToWebSpeech();
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

    try {
      if (audioUrl.includes("tts2.lovable.app") || shouldRevoke) {
        audio.playbackRate = 1.0;
      } else {
        audio.playbackRate = Math.max(0.3, Math.min(1.5, rate || 0.5));
      }
    } catch {
      // ignore
    }

    audio.src = audioUrl;
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch((err) => {
        console.warn("Alternative TTS playback rejected:", err);
        const fallbackUrl = buildGoogleTranslateTtsUrl(text, lang);
        if (fallbackUrl && activeAlternativeAudio === audio && audio.src !== fallbackUrl) {
          try {
            audio.playbackRate = Math.max(0.3, Math.min(1.5, rate || 0.5));
          } catch {
            // ignore
          }
          audio.src = fallbackUrl;
          const retryPromise = audio.play();
          if (retryPromise && typeof retryPromise.catch === "function") {
            retryPromise.catch(() => fallbackToWebSpeech());
          }
          return;
        }
        fallbackToWebSpeech();
      });
    }
  });
}
