/**
 * Alternative Text-to-Speech (TTS) Service
 * Supports:
 * 1. Lovable Speak API (OpenAPI 3.1.0: https://tts3.lovable.app/api/public/openapi.json, Docs: https://tts3.lovable.app/docs)
 *    Endpoint: https://tts3.lovable.app/api/public/tts
 *    CORS enabled (access-control-allow-origin: *)
 *    Provides multi-provider synthesis: "auto", "google", "lovable", "openrouter", "gemini", "openai", "elevenlabs", "deepgram"
 * 2. Google Translate TTS (Legacy fallback)
 *    Endpoint: https://translate.google.com/translate_tts?ie=UTF-8&client=gtx&tl={lang}&q={text}
 */

import { useSyncExternalStore } from "react";
import { trackNetworkRequest } from "@/utils/networkTracker";

export const LOVABLE_TTS_BASE_URL = "https://tts3.lovable.app";
export const LOVABLE_TTS_ENDPOINT = "https://tts3.lovable.app/api/public/tts";
export const LOVABLE_TTS_DOCS_URL = "https://tts3.lovable.app/docs";
export const LOVABLE_TTS_OPENAPI_URL = "https://tts3.lovable.app/api/public/openapi.json";
export const LOVABLE_TTS_INFO_URL = "https://tts3.lovable.app/api/public/info";
export const LOVABLE_TTS_ACCESS_TOKEN_URL = "https://tts3.lovable.app/api/public/access-token";
export const LOVABLE_TTS_USAGE_URL = "https://tts3.lovable.app/api/public/usage";
export const LOVABLE_TTS_REPORT_USAGE_URL = "https://tts3.lovable.app/api/report/usage";
export const LOVABLE_TTS_SHARED_KEYS_URL = "https://tts3.lovable.app/api/public/openrouter-keys";
export const GOOGLE_TRANSLATE_TTS_ENDPOINT = "https://translate.google.com/translate_tts";

export const STORAGE_KEY_USE_ALTERNATIVE_TTS = "yt_use_alternative_tts_v1";
export const STORAGE_KEY_ALTERNATIVE_TTS_MODE = "yt_alternative_tts_mode_v1";
const STORAGE_KEY_ALTERNATIVE_TTS_ENGINE = "yt_alternative_tts_engine_v1";
const STORAGE_KEY_ALTERNATIVE_TTS_LOVABLE_PROVIDER = "yt_alternative_tts_lovable_provider_v1";
const STORAGE_KEY_ALTERNATIVE_TTS_LOVABLE_VOICE = "yt_alternative_tts_lovable_voice_v1";
const STORAGE_KEY_ALTERNATIVE_TTS_LOVABLE_SPEED = "yt_alternative_tts_lovable_speed_v1";
const STORAGE_KEY_ALTERNATIVE_TTS_LOVABLE_OPTIONS = "yt_alternative_tts_lovable_options_v1";
const STORAGE_KEY_ALTERNATIVE_TTS_LOVABLE_METHOD = "yt_alternative_tts_lovable_method_v1";
const STORAGE_KEY_ALTERNATIVE_TTS_LOVABLE_FORMAT = "yt_alternative_tts_lovable_format_v1";
const STORAGE_KEY_ALTERNATIVE_TTS_LOVABLE_TARGET_LANG = "yt_alternative_tts_lovable_target_lang_v1";
const STORAGE_KEY_ALTERNATIVE_TTS_LOVABLE_API_KEY = "yt_alternative_tts_lovable_api_key_v1";
export const STORAGE_KEY_ALTERNATIVE_TTS_SPEAK_API_TOKEN = "yt_speak_api_token_v1";
export const STORAGE_KEY_ALTERNATIVE_TTS_PROVIDER_API_KEY = "yt_provider_api_key_v1";
export const STORAGE_KEY_ALTERNATIVE_TTS_ANONYMOUS_MODE = "yt_tts_anonymous_mode_v1";
export const STORAGE_KEY_TTS_FALLBACK_ORDER = "yt_tts_fallback_order_v1";
const STORAGE_KEY_REMOTE_TTS_VALIDATION_RESULT = "yt_remote_tts_val_res_v1";

export type AlternativeTtsMode = "fallback_only" | "always";
export type AlternativeTtsEngine = "lovable";
export type LovableTtsProvider =
  "auto" | "google" | "lovable" | "openrouter" | "gemini" | "openai" | "elevenlabs" | "deepgram";
export type LovableTtsMethod = "get" | "post";
export type LovableTtsFormat = "binary" | "json";

export type TtsFallbackOrder = "tts3_native" | "native_tts3" | "native_only";

export const DEFAULT_TTS_FALLBACK_ORDER: TtsFallbackOrder = "tts3_native";

const memoryFallbackStore: Record<string, string> = {};

/**
 * Retrieves the configured TTS fallback order (TTS3 service -> Native or Native -> TTS3).
 */
export function getTtsFallbackOrder(): TtsFallbackOrder {
  try {
    const stored =
      typeof localStorage !== "undefined"
        ? (localStorage.getItem(STORAGE_KEY_TTS_FALLBACK_ORDER) as TtsFallbackOrder)
        : (memoryFallbackStore[STORAGE_KEY_TTS_FALLBACK_ORDER] as TtsFallbackOrder);
    if (stored === "tts3_native" || stored === "native_tts3" || stored === "native_only") {
      return stored;
    }
  } catch {
    // fallback
  }
  return DEFAULT_TTS_FALLBACK_ORDER;
}

/**
 * Persists the TTS fallback order.
 */
export function setTtsFallbackOrder(order: TtsFallbackOrder): void {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY_TTS_FALLBACK_ORDER, order);
    }
  } catch (err) {
    console.warn("Failed to persist TTS fallback order:", err);
  }
  memoryFallbackStore[STORAGE_KEY_TTS_FALLBACK_ORDER] = order;
}

/**
 * Checks if a token is a remote Speak API Personal Access / Bearer Token.
 * Tokens starting with 'spk_' (Personal API token) or 'tts_' (Temporary access token)
 * must be transmitted via the 'Authorization: Bearer <token>' HTTP header to https://tts3.lovable.app.
 * They MUST NEVER be passed as an upstream provider 'api_key' in the request body.
 */
export function isSpeakApiPersonalToken(token?: string | null): boolean {
  if (!token) return false;
  let t = token.trim();
  if (t.toLowerCase().startsWith("bearer ")) {
    t = t.slice(7).trim();
  }
  return t.startsWith("spk_") || t.startsWith("tts_");
}

/**
 * Checks if a key is an upstream provider API key (e.g. Lovable AI 'sk_', OpenRouter 'sk-or-', Gemini 'AIza').
 */
export function isUpstreamProviderApiKey(token?: string | null): boolean {
  if (!token) return false;
  const t = token.trim();
  return Boolean(t && !isSpeakApiPersonalToken(t));
}

export const LOVABLE_TTS_PROVIDERS: readonly LovableTtsProvider[] = [
  "auto",
  "google",
  "lovable",
  "openrouter",
  "gemini",
  "openai",
  "elevenlabs",
  "deepgram",
];

export const LOVABLE_VOICES = ["Kore", "Puck", "Charon", "Fenrir", "Aoede"] as const;

export const GEMINI_VOICES = ["Kore", "Puck", "Charon", "Fenrir", "Aoede"] as const;

export const OPENAI_VOICES = [
  "coral",
  "alloy",
  "ash",
  "ballad",
  "echo",
  "fable",
  "nova",
  "onyx",
  "sage",
  "shimmer",
  "verse",
] as const;

export const OPENROUTER_VOICES = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"] as const;

export const ELEVENLABS_VOICES = [
  "JBFqnCBsd6RMkjVDRZzb", // George (default)
  "21m00Tcm4TlvDq8ikWAM", // Rachel
  "AZnzlk1XvdvUeBnXmlld", // Domi
  "EXAVITQu4vr4xnSDxMaL", // Bella
  "ErXwobaYiN019PkySvjV", // Antoni
  "MF3mGyEYCl7XYWbV9V6O", // Elli
  "TxGEqnHWrfWFTfGW9XjX", // Josh
  "VR6AewLTigWG4xSOukaG", // Arnold
  "pNInz6obpgDQGcFmaJgB", // Adam
  "yoZ06aMxZJJ28mfd3POQ", // Sam
] as const;

export const DEEPGRAM_VOICES = [
  "aura-asteria-en",
  "aura-luna-en",
  "aura-stella-en",
  "aura-athena-en",
  "aura-hera-en",
  "aura-orion-en",
  "aura-arcas-en",
  "aura-perseus-en",
  "aura-angus-en",
  "aura-orpheus-en",
  "aura-helios-en",
  "aura-zeus-en",
] as const;

/**
 * Returns available prebuilt voice names / IDs for the selected provider.
 */
export function getVoicesForProvider(provider: LovableTtsProvider): readonly string[] {
  switch (provider) {
    case "lovable":
      return LOVABLE_VOICES;
    case "gemini":
      return GEMINI_VOICES;
    case "openai":
      return OPENAI_VOICES;
    case "openrouter":
      return OPENROUTER_VOICES;
    case "elevenlabs":
      return ELEVENLABS_VOICES;
    case "deepgram":
      return DEEPGRAM_VOICES;
    case "google":
    case "auto":
    default:
      return [];
  }
}

/**
 * Returns the default voice name / ID for the selected provider.
 */
export function getDefaultVoiceForProvider(provider: LovableTtsProvider): string {
  switch (provider) {
    case "lovable":
    case "gemini":
      return "Kore";
    case "openai":
      return "coral";
    case "openrouter":
      return "alloy";
    case "elevenlabs":
      return "JBFqnCBsd6RMkjVDRZzb";
    case "deepgram":
      return "aura-asteria-en";
    default:
      return "";
  }
}

export interface ExternalTtsAuditRecord {
  id: string;
  timestamp: number;
  method: "GET" | "POST";
  url: string;
  endpoint: string;
  requestHeaders: Record<string, string>;
  requestBody?: unknown;
  queryParams?: Record<string, string>;
  provider?: string;
  voice?: string;
  lang: string;
  text: string;
  targetLang?: string;
  speed?: number;
  status: number;
  statusText: string;
  latencyMs: number;
  responseHeaders: Record<string, string>;
  responseBody?: unknown;
  responseType: "json" | "binary" | "error" | "media";
  audioMime?: string;
  audioSizeBytes?: number;
  audioUrl?: string;
  error?: string;
  diagnosticAdvice?: string;
  source: "test_button" | "validate_service" | "playback" | "api_call";
  isAnonymous?: boolean;
}

const MAX_AUDIT_RECORDS = 30;
let externalTtsAuditRecords: ExternalTtsAuditRecord[] = [];
const auditListeners = new Set<() => void>();

function notifyAuditListeners() {
  for (const listener of auditListeners) {
    try {
      listener();
    } catch {
      // ignore
    }
  }
}

export function subscribeExternalTtsAuditRecords(listener: () => void): () => void {
  auditListeners.add(listener);
  return () => {
    auditListeners.delete(listener);
  };
}

export function getExternalTtsAuditRecords(): ExternalTtsAuditRecord[] {
  return externalTtsAuditRecords;
}

export function getLatestExternalTtsAuditRecord(): ExternalTtsAuditRecord | null {
  return externalTtsAuditRecords[0] || null;
}

export function addExternalTtsAuditRecord(record: ExternalTtsAuditRecord): void {
  externalTtsAuditRecords = [record, ...externalTtsAuditRecords.slice(0, MAX_AUDIT_RECORDS - 1)];
  notifyAuditListeners();
}

export function clearExternalTtsAuditRecords(): void {
  externalTtsAuditRecords = [];
  notifyAuditListeners();
}

export function useExternalTtsAuditRecords(): ExternalTtsAuditRecord[] {
  return useSyncExternalStore(
    subscribeExternalTtsAuditRecords,
    getExternalTtsAuditRecords,
    getExternalTtsAuditRecords,
  );
}

export function useLatestExternalTtsAuditRecord(): ExternalTtsAuditRecord | null {
  return useSyncExternalStore(
    subscribeExternalTtsAuditRecords,
    getLatestExternalTtsAuditRecord,
    getLatestExternalTtsAuditRecord,
  );
}

export function extractResponseHeaders(res: Response): Record<string, string> {
  const headers: Record<string, string> = {};
  try {
    res.headers.forEach((value, key) => {
      headers[key] = value;
    });
  } catch {
    // fallback
  }
  return headers;
}

export interface LovableTtsVoicesMap {
  openrouter?: string;
  lovable?: string;
  gemini?: string;
  openai?: string;
  elevenlabs?: string;
  deepgram?: string;
  [provider: string]: string | undefined;
}

export interface LovableTtsProviderOptions {
  model?: string;
  instructions?: string;
  voice_id?: string;
  encoding?: string;
  container?: string;
  sample_rate?: number;
  bit_rate?: number;
  mip_opt_out?: boolean;
  [key: string]: unknown;
}

export interface PublicServiceInfo {
  status: string;
  app: string;
  storage?: string;
  available_providers?: Array<{
    service: LovableTtsProvider;
    credentials_required: boolean;
    server_keys_configured?: boolean;
  }>;
  api_capabilities?: Record<string, boolean>;
  temporary_tokens?: {
    active: number;
    expires_after_seconds: number;
    lost_on_server_restart: boolean;
  };
  database_required_for?: string[];
}

export interface TemporaryAccessTokenResponse {
  token?: string;
  expires_at?: string;
  expires_in?: number;
  error?: string;
  message?: string;
}

export interface LovableTtsOptions {
  provider?: LovableTtsProvider;
  voice?: string;
  voices?: LovableTtsVoicesMap;
  speed?: number;
  volume?: number;
  options?: LovableTtsProviderOptions | Record<string, unknown> | string;
  format?: LovableTtsFormat;
  target_lang?: string;
  apiKey?: string;
  speakApiToken?: string;
  method?: LovableTtsMethod;
  isAnonymous?: boolean;
  debug?: boolean;
}

export interface LovableTtsRequestBody {
  text: string;
  lang: string;
  target_lang?: string;
  provider?: LovableTtsProvider;
  api_key?: string;
  voice?: string;
  voices?: LovableTtsVoicesMap;
  speed?: number;
  options?: LovableTtsProviderOptions | Record<string, unknown>;
  format?: LovableTtsFormat;
  debug?: boolean;
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
 * Retrieves the configured Speak API Personal Token (spk_... or tts_...).
 */
export function getSpeakApiToken(): string {
  try {
    const directToken =
      typeof localStorage !== "undefined"
        ? localStorage.getItem(STORAGE_KEY_ALTERNATIVE_TTS_SPEAK_API_TOKEN)
        : memoryFallbackStore[STORAGE_KEY_ALTERNATIVE_TTS_SPEAK_API_TOKEN];
    if (directToken && directToken.trim()) {
      let t = directToken.trim();
      if (t.toLowerCase().startsWith("bearer ")) {
        t = t.slice(7).trim();
      }
      return t;
    }
    const legacyKey =
      typeof localStorage !== "undefined"
        ? localStorage.getItem(STORAGE_KEY_ALTERNATIVE_TTS_LOVABLE_API_KEY)
        : memoryFallbackStore[STORAGE_KEY_ALTERNATIVE_TTS_LOVABLE_API_KEY];
    if (legacyKey && isSpeakApiPersonalToken(legacyKey)) {
      let t = legacyKey.trim();
      if (t.toLowerCase().startsWith("bearer ")) {
        t = t.slice(7).trim();
      }
      return t;
    }
    return memoryFallbackStore[STORAGE_KEY_ALTERNATIVE_TTS_SPEAK_API_TOKEN] || "";
  } catch {
    return memoryFallbackStore[STORAGE_KEY_ALTERNATIVE_TTS_SPEAK_API_TOKEN] || "";
  }
}

/**
 * Persists the Speak API Personal Token to localStorage.
 */
export function setSpeakApiToken(token: string): void {
  let clean = token.trim();
  if (clean.toLowerCase().startsWith("bearer ")) {
    clean = clean.slice(7).trim();
  }
  memoryFallbackStore[STORAGE_KEY_ALTERNATIVE_TTS_SPEAK_API_TOKEN] = clean;
  try {
    if (typeof localStorage !== "undefined") {
      if (clean) {
        localStorage.setItem(STORAGE_KEY_ALTERNATIVE_TTS_SPEAK_API_TOKEN, clean);
      } else {
        localStorage.removeItem(STORAGE_KEY_ALTERNATIVE_TTS_SPEAK_API_TOKEN);
      }
    }
  } catch (err) {
    console.warn("Failed to persist Speak API token:", err);
  }
}

/**
 * Checks if the user has explicitly configured a custom Speak API personal token.
 */
export function hasCustomSpeakApiToken(): boolean {
  return Boolean(getSpeakApiToken());
}

/**
 * Retrieves the upstream Provider API key (sk_..., sk-or-..., AIza...).
 */
export function getProviderApiKey(): string {
  try {
    const directKey =
      typeof localStorage !== "undefined"
        ? localStorage.getItem(STORAGE_KEY_ALTERNATIVE_TTS_PROVIDER_API_KEY)
        : memoryFallbackStore[STORAGE_KEY_ALTERNATIVE_TTS_PROVIDER_API_KEY];
    if (directKey && directKey.trim()) {
      return directKey.trim();
    }
    const legacyKey =
      typeof localStorage !== "undefined"
        ? localStorage.getItem(STORAGE_KEY_ALTERNATIVE_TTS_LOVABLE_API_KEY) ||
          localStorage.getItem("yt_openrouter_api_key_v1") ||
          localStorage.getItem("yt_openrouter_api_key")
        : memoryFallbackStore[STORAGE_KEY_ALTERNATIVE_TTS_LOVABLE_API_KEY];
    if (legacyKey && isUpstreamProviderApiKey(legacyKey)) {
      return legacyKey.trim();
    }
    return getServerOpenRouterApiKey();
  } catch {
    return "";
  }
}

/**
 * Persists the upstream Provider API key to localStorage.
 */
export function setProviderApiKey(apiKey: string): void {
  const clean = apiKey.trim();
  memoryFallbackStore[STORAGE_KEY_ALTERNATIVE_TTS_PROVIDER_API_KEY] = clean;
  try {
    if (typeof localStorage !== "undefined") {
      if (clean) {
        localStorage.setItem(STORAGE_KEY_ALTERNATIVE_TTS_PROVIDER_API_KEY, clean);
        localStorage.setItem("yt_openrouter_api_key_v1", clean);
        localStorage.setItem("yt_openrouter_api_key", clean);
      } else {
        localStorage.removeItem(STORAGE_KEY_ALTERNATIVE_TTS_PROVIDER_API_KEY);
        localStorage.removeItem("yt_openrouter_api_key_v1");
        localStorage.removeItem("yt_openrouter_api_key");
      }
    }
  } catch (err) {
    console.warn("Failed to persist Provider API key:", err);
  }
}

/**
 * Checks if the user has explicitly configured a custom upstream provider API key.
 */
export function hasCustomProviderApiKey(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const directKey = localStorage.getItem(STORAGE_KEY_ALTERNATIVE_TTS_PROVIDER_API_KEY);
    if (directKey && directKey.trim()) return true;
    const legacyKey =
      localStorage.getItem(STORAGE_KEY_ALTERNATIVE_TTS_LOVABLE_API_KEY) ||
      localStorage.getItem("yt_openrouter_api_key_v1") ||
      localStorage.getItem("yt_openrouter_api_key");
    return Boolean(legacyKey && isUpstreamProviderApiKey(legacyKey));
  } catch {
    return false;
  }
}

/**
 * Resolves effective credentials into Speak API Personal Token (spk_...) and Upstream Provider Key.
 * If a token is provided in apiKey but starts with 'spk_', it is automatically promoted to speakApiToken
 * and prevented from being passed as an upstream provider key.
 */
export function resolveTtsCredentials(options?: LovableTtsOptions): {
  speakApiToken: string;
  providerApiKey: string;
} {
  const isAnon = options?.isAnonymous ?? getAlternativeTtsAnonymousMode();
  if (isAnon) {
    return { speakApiToken: "", providerApiKey: "" };
  }

  let speakApiToken = (options?.speakApiToken || "").trim();
  let providerApiKey = (options?.apiKey || "").trim();

  // If apiKey looks like an spk_ token, promote it to speakApiToken and never leak as provider key
  if (providerApiKey && isSpeakApiPersonalToken(providerApiKey)) {
    if (!speakApiToken) {
      speakApiToken = providerApiKey;
    }
    providerApiKey = "";
  }

  if (!speakApiToken) {
    speakApiToken = getSpeakApiToken();
  }

  if (!providerApiKey) {
    providerApiKey = getProviderApiKey();
    if (isSpeakApiPersonalToken(providerApiKey)) {
      if (!speakApiToken) speakApiToken = providerApiKey;
      providerApiKey = "";
    }
  }

  return { speakApiToken, providerApiKey };
}

/**
 * Generates clear diagnostic advice explaining TTS error responses and how to resolve them.
 */
export function generateTtsDiagnosticAdvice(
  statusCode: number,
  errorText: string,
  provider: string,
  hasSpeakToken: boolean,
  hasProviderKey: boolean,
): string | undefined {
  const norm = errorText.toLowerCase();
  if (norm.includes("invalid api key format") && norm.includes("sk_")) {
    return "An 'spk_' personal token was mistakenly sent as an upstream provider key. 'spk_' tokens authenticate the Speak API service and must be sent in the 'Authorization: Bearer' header, not in body.api_key.";
  }
  if (norm.includes("lovable ai requires an api key")) {
    return "Your Speak API Personal Token (spk_...) authenticated successfully! However, Lovable AI voice synthesis requires an upstream key saved in your account on tts3.lovable.app or an 'sk_' provider key. Tip: Switch to Google TTS which is free and works immediately with your token!";
  }
  if (norm.includes("auto and google do not accept api_key")) {
    return "Google and Auto providers are public and reject the 'api_key' payload field. Speak API personal tokens (spk_...) should be sent in the 'Authorization: Bearer' header.";
  }
  if (norm.includes("invalid personal api token")) {
    return "The personal API token was rejected by tts3.lovable.app. Ensure the token is copied completely, starts with 'spk_', and is not expired.";
  }
  if (statusCode === 401) {
    return "Authentication failed (HTTP 401). If using Speak API, verify your token starts with 'spk_' and is valid on https://tts3.lovable.app. If using a custom provider, check the provider key.";
  }
  return undefined;
}

/**
 * Builds the Lovable Speak API URL according to the OpenAPI specification.
 * Endpoint: https://tts3.lovable.app/api/public/tts
 * Query parameters:
 * - text (required, string <= 5000 chars)
 * - lang (required, string e.g. "en")
 * - provider (optional, enum: "google", "lovable", "openrouter")
 * - voice (optional, string)
 * - format (optional, "binary" | "json", defaults to "binary")
 * - target_lang (optional, string)
 * - api_key (optional, string, only for keyed providers like openrouter/lovable)
 * - token (optional, string, Speak API personal token for authenticated GET requests)
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
  if (provider) {
    url.searchParams.set("provider", provider);
  }

  // Voice parameter is explicitly suppressed from being passed to the remote TTS service
  url.searchParams.delete("voice");

  if (options?.voices && Object.keys(options.voices).length > 0) {
    url.searchParams.set("voices", JSON.stringify(options.voices));
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

  const { speakApiToken, providerApiKey } = resolveTtsCredentials(options);

  // Keyed providers only accept api_key query param (never Google or Auto)
  if (providerApiKey && provider !== "google" && provider !== "auto") {
    url.searchParams.set("api_key", providerApiKey);
  }

  // If speakApiToken is present, provide token query param for direct GET requests
  if (speakApiToken) {
    url.searchParams.set("token", speakApiToken);
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
  const speed = options?.speed ?? getLovableTtsSpeed();
  const rawOptions = options?.options ?? getLovableTtsOptions();
  const targetLang = options?.target_lang ?? getLovableTtsTargetLang();
  const { providerApiKey } = resolveTtsCredentials(options);
  const format = options?.format || getLovableTtsFormat();

  const body: LovableTtsRequestBody = {
    text: normalizedText,
    lang: normalizedLang,
    format,
  };
  if (provider) {
    body.provider = provider;
  }

  // Voice parameter is explicitly suppressed from being passed to the remote TTS service

  if (options?.voices && Object.keys(options.voices).length > 0) {
    body.voices = options.voices;
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
  // CRITICAL: Only set body.api_key for keyed providers and NEVER with spk_ tokens
  if (providerApiKey && provider !== "google" && provider !== "auto") {
    body.api_key = providerApiKey;
  }
  return body;
}

/**
 * Synthesizes speech using the Lovable Speak API POST endpoint (application/json).
 * Supports both binary audio streams (creates blob URL) and JSON base64 payloads.
 */
/**
 * Synthesizes speech using the Lovable Speak API POST endpoint (application/json).
 * Supports both binary audio streams (creates blob URL) and JSON base64 payloads.
 */
export async function synthesizeLovableTtsPost(
  text: string,
  lang: string,
  options?: LovableTtsOptions,
  source: ExternalTtsAuditRecord["source"] = "playback",
): Promise<{ url: string; revokeOnDone?: boolean } | null> {
  if (!text) return null;
  const startTime = Date.now();
  const body = buildLovableTtsRequestBody(text, lang, options);
  const { speakApiToken, providerApiKey } = resolveTtsCredentials(options);
  const provider = body.provider || "google";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (speakApiToken) {
    headers["Authorization"] = `Bearer ${speakApiToken}`;
  }
  if (providerApiKey && provider !== "google" && provider !== "auto") {
    headers["X-Provider-API-Key"] = providerApiKey;
  }

  const auditId = `tts-post-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const tracker = trackNetworkRequest(LOVABLE_TTS_ENDPOINT, "POST", "fetch");

  try {
    const res = await fetch(LOVABLE_TTS_ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const latencyMs = Date.now() - startTime;
    const resHeaders = extractResponseHeaders(res);
    const contentType = res.headers.get("content-type") || "";

    if (!res.ok) {
      let errorBody = "";
      try {
        errorBody = await res.text();
      } catch {
        // ignore
      }
      const diagnosticAdvice = generateTtsDiagnosticAdvice(
        res.status,
        errorBody,
        provider,
        Boolean(speakApiToken),
        Boolean(providerApiKey),
      );
      const record: ExternalTtsAuditRecord = {
        id: auditId,
        timestamp: Date.now(),
        method: "POST",
        url: LOVABLE_TTS_ENDPOINT,
        endpoint: LOVABLE_TTS_ENDPOINT,
        requestHeaders: headers,
        requestBody: body,
        provider,
        voice: body.voice,
        lang: body.lang,
        text: body.text,
        targetLang: body.target_lang,
        speed: body.speed,
        status: res.status,
        statusText:
          res.statusText ||
          (res.status === 400
            ? "Bad Request"
            : res.status === 401
              ? "Unauthorized"
              : res.status === 502
                ? "Bad Gateway"
                : res.status === 503
                  ? "Service Unavailable"
                  : "Error"),
        latencyMs,
        responseHeaders: resHeaders,
        responseBody: errorBody,
        responseType: "error",
        error: `HTTP ${res.status}: ${errorBody || res.statusText || "POST synthesis failed"}`,
        diagnosticAdvice,
        source,
      };
      addExternalTtsAuditRecord(record);
      tracker.fail(record.error || "POST synthesis failed", res.status, errorBody);
      console.warn("[LovableTTS] POST synthesis failed with status:", res.status, errorBody);
      return null;
    }

    const format = body.format || "binary";
    if (format === "json") {
      const data = (await res.json()) as LovableTtsJsonResponse;
      const mime = data?.mime || "audio/mpeg";
      const audioBytes = data?.audio ? Math.round((data.audio.length * 3) / 4) : 0;
      const record: ExternalTtsAuditRecord = {
        id: auditId,
        timestamp: Date.now(),
        method: "POST",
        url: LOVABLE_TTS_ENDPOINT,
        endpoint: LOVABLE_TTS_ENDPOINT,
        requestHeaders: headers,
        requestBody: body,
        provider: body.provider || "google",
        voice: body.voice,
        lang: body.lang,
        text: body.text,
        targetLang: body.target_lang,
        speed: body.speed,
        status: res.status,
        statusText: res.statusText || "OK",
        latencyMs,
        responseHeaders: resHeaders,
        responseBody: data,
        responseType: "json",
        audioMime: mime,
        audioSizeBytes: audioBytes,
        source,
      };
      addExternalTtsAuditRecord(record);
      tracker.complete(res.status, data);

      if (!data?.audio) return null;
      return { url: `data:${mime};base64,${data.audio}`, revokeOnDone: false };
    } else {
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const record: ExternalTtsAuditRecord = {
        id: auditId,
        timestamp: Date.now(),
        method: "POST",
        url: LOVABLE_TTS_ENDPOINT,
        endpoint: LOVABLE_TTS_ENDPOINT,
        requestHeaders: headers,
        requestBody: body,
        provider: body.provider || "google",
        voice: body.voice,
        lang: body.lang,
        text: body.text,
        targetLang: body.target_lang,
        speed: body.speed,
        status: res.status,
        statusText: res.statusText || "OK",
        latencyMs,
        responseHeaders: resHeaders,
        responseBody: `[Binary audio blob, ${blob.size} bytes, type: ${blob.type || contentType}]`,
        responseType: "binary",
        audioMime: blob.type || contentType || "audio/mpeg",
        audioSizeBytes: blob.size,
        audioUrl: objectUrl,
        source,
      };
      addExternalTtsAuditRecord(record);
      tracker.complete(res.status, `Binary audio stream (${blob.size} bytes)`);
      return { url: objectUrl, revokeOnDone: true };
    }
  } catch (err) {
    const errorMsg = (err as Error)?.message || String(err);
    const latencyMs = Date.now() - startTime;
    const record: ExternalTtsAuditRecord = {
      id: auditId,
      timestamp: Date.now(),
      method: "POST",
      url: LOVABLE_TTS_ENDPOINT,
      endpoint: LOVABLE_TTS_ENDPOINT,
      requestHeaders: headers,
      requestBody: body,
      provider: body.provider || "google",
      voice: body.voice,
      lang: body.lang,
      text: body.text,
      targetLang: body.target_lang,
      speed: body.speed,
      status: 0,
      statusText: "Network Error",
      latencyMs,
      responseHeaders: {},
      responseBody: null,
      responseType: "error",
      error: errorMsg,
      source,
    };
    addExternalTtsAuditRecord(record);
    tracker.fail(errorMsg, 0);
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
  source: ExternalTtsAuditRecord["source"] = "api_call",
): Promise<LovableTtsJsonResponse | null> {
  const url = buildLovableTtsUrl(text, lang, { ...options, format: "json" });
  if (!url) return null;
  const startTime = Date.now();
  const auditId = `tts-get-json-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const tracker = trackNetworkRequest(url, "GET", "fetch");
  const { speakApiToken, providerApiKey } = resolveTtsCredentials(options);
  const provider = options?.provider || getLovableTtsProvider();
  const headers: Record<string, string> = {};
  if (speakApiToken) {
    headers["Authorization"] = `Bearer ${speakApiToken}`;
  }
  if (providerApiKey && provider !== "google" && provider !== "auto") {
    headers["X-Provider-API-Key"] = providerApiKey;
  }
  const parsedUrl = new URL(url);
  const queryParams = Object.fromEntries(parsedUrl.searchParams.entries());

  try {
    const res = await fetch(url, { headers });
    const latencyMs = Date.now() - startTime;
    const resHeaders = extractResponseHeaders(res);

    if (!res.ok) {
      let errorBody = "";
      try {
        errorBody = await res.text();
      } catch {
        // ignore
      }
      const diagnosticAdvice = generateTtsDiagnosticAdvice(
        res.status,
        errorBody,
        provider,
        Boolean(speakApiToken),
        Boolean(providerApiKey),
      );
      const record: ExternalTtsAuditRecord = {
        id: auditId,
        timestamp: Date.now(),
        method: "GET",
        url,
        endpoint: LOVABLE_TTS_ENDPOINT,
        requestHeaders: headers,
        queryParams,
        provider,
        voice: undefined,
        lang,
        text,
        status: res.status,
        statusText: res.statusText || (res.status === 401 ? "Unauthorized" : "Error"),
        latencyMs,
        responseHeaders: resHeaders,
        responseBody: errorBody,
        responseType: "error",
        error: `HTTP ${res.status}: ${errorBody || res.statusText || "Request failed"}`,
        diagnosticAdvice,
        source,
      };
      addExternalTtsAuditRecord(record);
      tracker.fail(record.error || "GET json failed", res.status, errorBody);
      console.warn("[LovableTTS] Request returned non-200 status:", res.status);
      return null;
    }
    const data = (await res.json()) as LovableTtsJsonResponse;
    const audioBytes = data?.audio ? Math.round((data.audio.length * 3) / 4) : 0;
    const record: ExternalTtsAuditRecord = {
      id: auditId,
      timestamp: Date.now(),
      method: "GET",
      url,
      endpoint: LOVABLE_TTS_ENDPOINT,
      requestHeaders: headers,
      queryParams,
      provider,
      voice: undefined,
      lang,
      text,
      status: res.status,
      statusText: "OK",
      latencyMs,
      responseHeaders: resHeaders,
      responseBody: data,
      responseType: "json",
      audioMime: data?.mime || "audio/mpeg",
      audioSizeBytes: audioBytes,
      source,
    };
    addExternalTtsAuditRecord(record);
    tracker.complete(res.status, data);
    return data;
  } catch (err) {
    const errorMsg = (err as Error)?.message || String(err);
    const latencyMs = Date.now() - startTime;
    const record: ExternalTtsAuditRecord = {
      id: auditId,
      timestamp: Date.now(),
      method: "GET",
      url,
      endpoint: LOVABLE_TTS_ENDPOINT,
      requestHeaders: headers,
      queryParams,
      provider,
      voice: options?.voice,
      lang,
      text,
      status: 0,
      statusText: "Network Error",
      latencyMs,
      responseHeaders: {},
      responseBody: null,
      responseType: "error",
      error: errorMsg,
      source,
    };
    addExternalTtsAuditRecord(record);
    tracker.fail(errorMsg, 0);
    console.warn("[LovableTTS] Network error fetching speech JSON:", err);
    return null;
  }
}

/**
 * Fetches binary audio stream via GET and returns a Blob URL with full request/response auditing.
 */
export async function fetchLovableTtsBinaryBlob(
  text: string,
  lang: string,
  options?: LovableTtsOptions,
  source: ExternalTtsAuditRecord["source"] = "playback",
): Promise<{ url: string; revokeOnDone: boolean } | null> {
  const url = buildLovableTtsUrl(text, lang, { ...options, format: "binary" });
  if (!url) return null;
  const startTime = Date.now();
  const auditId = `tts-get-bin-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const tracker = trackNetworkRequest(url, "GET", "fetch");
  const { speakApiToken, providerApiKey } = resolveTtsCredentials(options);
  const provider = options?.provider || getLovableTtsProvider();
  const headers: Record<string, string> = {
    Accept: "audio/mpeg, audio/wav, audio/*",
  };
  if (speakApiToken) {
    headers["Authorization"] = `Bearer ${speakApiToken}`;
  }
  if (providerApiKey && provider !== "google" && provider !== "auto") {
    headers["X-Provider-API-Key"] = providerApiKey;
  }
  const parsedUrl = new URL(url);
  const queryParams = Object.fromEntries(parsedUrl.searchParams.entries());

  try {
    const res = await fetch(url, { headers });
    const latencyMs = Date.now() - startTime;
    const resHeaders = extractResponseHeaders(res);
    const contentType = res.headers.get("content-type") || "audio/mpeg";

    if (!res.ok) {
      let errorBody = "";
      try {
        errorBody = await res.text();
      } catch {
        // ignore
      }
      const diagnosticAdvice = generateTtsDiagnosticAdvice(
        res.status,
        errorBody,
        provider,
        Boolean(speakApiToken),
        Boolean(providerApiKey),
      );
      const record: ExternalTtsAuditRecord = {
        id: auditId,
        timestamp: Date.now(),
        method: "GET",
        url,
        endpoint: LOVABLE_TTS_ENDPOINT,
        requestHeaders: headers,
        queryParams,
        provider,
        voice: options?.voice,
        lang,
        text,
        status: res.status,
        statusText: res.statusText || (res.status === 401 ? "Unauthorized" : "Error"),
        latencyMs,
        responseHeaders: resHeaders,
        responseBody: errorBody,
        responseType: "error",
        error: `HTTP ${res.status}: ${errorBody || res.statusText || "Binary synthesis failed"}`,
        diagnosticAdvice,
        source,
      };
      addExternalTtsAuditRecord(record);
      tracker.fail(record.error || "GET binary audio failed", res.status, errorBody);
      console.warn("[LovableTTS] GET binary synthesis failed with status:", res.status);
      return null;
    }

    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const record: ExternalTtsAuditRecord = {
      id: auditId,
      timestamp: Date.now(),
      method: "GET",
      url,
      endpoint: LOVABLE_TTS_ENDPOINT,
      requestHeaders: headers,
      queryParams,
      provider: options?.provider || getLovableTtsProvider(),
      voice: options?.voice,
      lang,
      text,
      status: res.status,
      statusText: "OK",
      latencyMs,
      responseHeaders: resHeaders,
      responseBody: `[Binary audio stream, ${blob.size} bytes, type: ${blob.type || contentType}]`,
      responseType: "binary",
      audioMime: blob.type || contentType,
      audioSizeBytes: blob.size,
      audioUrl: objectUrl,
      source,
    };
    addExternalTtsAuditRecord(record);
    tracker.complete(res.status, `Binary audio stream (${blob.size} bytes)`);
    return { url: objectUrl, revokeOnDone: true };
  } catch (err) {
    const errorMsg = (err as Error)?.message || String(err);
    const latencyMs = Date.now() - startTime;
    const record: ExternalTtsAuditRecord = {
      id: auditId,
      timestamp: Date.now(),
      method: "GET",
      url,
      endpoint: LOVABLE_TTS_ENDPOINT,
      requestHeaders: headers,
      queryParams,
      provider: options?.provider || getLovableTtsProvider(),
      voice: options?.voice,
      lang,
      text,
      status: 0,
      statusText: "Network Error",
      latencyMs,
      responseHeaders: {},
      responseBody: null,
      responseType: "error",
      error: errorMsg,
      source,
    };
    addExternalTtsAuditRecord(record);
    tracker.fail(errorMsg, 0);
    console.warn("[LovableTTS] Network error during GET speech synthesis:", err);
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
  source: ExternalTtsAuditRecord["source"] = "playback",
): Promise<{ url: string; revokeOnDone?: boolean } | null> {
  const method = options?.method || getLovableTtsMethod();
  const format = options?.format || getLovableTtsFormat();

  if (method === "post") {
    return synthesizeLovableTtsPost(text, lang, { ...options, format }, source);
  }

  // GET method
  if (format === "json") {
    const jsonRes = await fetchLovableTtsJson(text, lang, options, source);
    if (!jsonRes?.audio) return null;
    const mime = jsonRes.mime || "audio/mpeg";
    return { url: `data:${mime};base64,${jsonRes.audio}`, revokeOnDone: false };
  }

  // GET binary
  return fetchLovableTtsBinaryBlob(text, lang, options, source);
}

/**
 * Builds the Google Translate TTS audio URL.
/**
 * @deprecated Direct requests to Google TTS from the client are not supported.
 */
export function buildGoogleTranslateTtsUrl(_text: string, _lang: string): string {
  return "";
}

/**
 * Builds the active alternative TTS URL based on the selected engine (Lovable Speak API).
 */
export function buildAlternativeTtsUrl(
  text: string,
  lang: string,
  _engine?: AlternativeTtsEngine,
): string {
  return buildLovableTtsUrl(text, lang);
}

export type RemoteTtsServiceType = "lovable" | "tts3" | "tts3-service";

export interface RemoteTtsValidationResult {
  ok: boolean;
  service: "lovable";
  serviceName: string;
  endpoint: string;
  statusCode?: number;
  latencyMs: number;
  audioVerified: boolean;
  format?: string;
  error?: string;
  details?: string;
  timestamp: number;
}

export interface RemoteTtsValidationOptions {
  lang?: string;
  text?: string;
  provider?: LovableTtsProvider;
  timeoutMs?: number;
  isAnonymous?: boolean;
}

const lastValidationResults: Partial<Record<"lovable", RemoteTtsValidationResult>> = {};

export function getLastValidationResult(_service?: string): RemoteTtsValidationResult | null {
  if (lastValidationResults["lovable"]) {
    return lastValidationResults["lovable"]!;
  }
  try {
    if (typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(`${STORAGE_KEY_REMOTE_TTS_VALIDATION_RESULT}_lovable`);
      if (raw) {
        const parsed = JSON.parse(raw);
        lastValidationResults["lovable"] = parsed;
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

export function setLastValidationResult(_service: string, result: RemoteTtsValidationResult): void {
  lastValidationResults["lovable"] = result;
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(
        `${STORAGE_KEY_REMOTE_TTS_VALIDATION_RESULT}_lovable`,
        JSON.stringify(result),
      );
    }
  } catch {
    // ignore
  }
}

/**
 * Validates availability, response time, and audio streams for the remote TTS service:
 * Lovable Speak API (https://tts3.lovable.app/api/public/tts & openapi.json)
 */
export async function validateRemoteTtsService(
  _serviceInput?: RemoteTtsServiceType | AlternativeTtsEngine | string,
  options?: RemoteTtsValidationOptions,
): Promise<RemoteTtsValidationResult> {
  const timeoutMs = options?.timeoutMs ?? 7000;
  const testText = options?.text || "Test";
  const testLang = options?.lang || "en";
  const startTime = Date.now();

  // Lovable TTS3 Service (tts3.lovable.app)
  const serviceName = "Lovable TTS3 Service (tts3.lovable.app)";
  const provider = options?.provider || getLovableTtsProvider();
  const endpoint = LOVABLE_TTS_ENDPOINT;
  const { speakApiToken, providerApiKey } = resolveTtsCredentials();

  try {
    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

    try {
      const body = buildLovableTtsRequestBody(testText, testLang, { provider, format: "json" });
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (speakApiToken) {
        headers["Authorization"] = `Bearer ${speakApiToken}`;
      }
      if (providerApiKey && provider !== "google" && provider !== "auto") {
        headers["X-Provider-API-Key"] = providerApiKey;
      }
      const res = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: controller?.signal,
      });

      if (timeoutId) clearTimeout(timeoutId);
      const latency = Date.now() - startTime;

      if (res.ok) {
        const contentType = res.headers.get("content-type") || "";
        let audioVerified = false;
        let details = `TTS3 synthesis responded (HTTP ${res.status})`;

        if (contentType.includes("json")) {
          try {
            const json = await res.json();
            if (json?.audio) {
              audioVerified = true;
              details = `TTS3 returned audio payload (${json.mime || "audio/mpeg"}, length: ${json.audio.length})`;
            }
          } catch {
            audioVerified = true;
          }
        } else {
          audioVerified = true;
        }

        const resHeaders = extractResponseHeaders(res);
        let responseBodyData: unknown = null;
        if (contentType.includes("json")) {
          try {
            responseBodyData = await res.clone().json();
          } catch {
            // ignore
          }
        }
        const valRecord: ExternalTtsAuditRecord = {
          id: `val-tts3-${Date.now()}`,
          timestamp: Date.now(),
          method: "POST",
          url: endpoint,
          endpoint,
          requestHeaders: headers,
          requestBody: body,
          provider: body.provider || "google",
          voice: body.voice,
          lang: body.lang,
          text: body.text,
          status: res.status,
          statusText: res.statusText || (res.ok ? "OK" : "Error"),
          latencyMs: latency,
          responseHeaders: resHeaders,
          responseBody: responseBodyData,
          responseType: "json",
          source: "validate_service",
        };
        addExternalTtsAuditRecord(valRecord);

        const result: RemoteTtsValidationResult = {
          ok: true,
          service: "lovable",
          serviceName,
          endpoint,
          statusCode: res.status,
          latencyMs: latency,
          audioVerified,
          format: contentType || "application/json",
          details,
          timestamp: Date.now(),
        };
        setLastValidationResult("lovable", result);
        setUseAlternativeTts(true);
        setAlternativeTtsMode("always");
        return result;
      }

      let errorBody = "";
      try {
        errorBody = await res.text();
      } catch {
        // ignore
      }
      const resHeaders = extractResponseHeaders(res);
      const diagnosticAdvice = generateTtsDiagnosticAdvice(
        res.status,
        errorBody,
        provider,
        Boolean(speakApiToken),
        Boolean(providerApiKey),
      );
      const errRecord: ExternalTtsAuditRecord = {
        id: `val-tts3-${Date.now()}`,
        timestamp: Date.now(),
        method: "POST",
        url: endpoint,
        endpoint,
        requestHeaders: headers,
        requestBody: body,
        provider: body.provider || "google",
        voice: body.voice,
        lang: body.lang,
        text: body.text,
        status: res.status,
        statusText: res.statusText || (res.status === 401 ? "Unauthorized" : "Error"),
        latencyMs: latency,
        responseHeaders: resHeaders,
        responseBody: errorBody,
        responseType: "error",
        error: `HTTP ${res.status}: ${errorBody || res.statusText || "Validation failed"}`,
        diagnosticAdvice,
        source: "validate_service",
      };
      addExternalTtsAuditRecord(errRecord);

      let openApiReachable = false;
      try {
        const specRes = await fetch(LOVABLE_TTS_OPENAPI_URL, { method: "GET" });
        if (specRes.ok) openApiReachable = true;
      } catch {
        // spec check failed
      }

      const result: RemoteTtsValidationResult = {
        ok: false,
        service: "lovable",
        serviceName,
        endpoint,
        statusCode: res.status,
        latencyMs: latency,
        audioVerified: false,
        error:
          `HTTP ${res.status}: ${errorBody || res.statusText || "Service error"}` +
          (openApiReachable ? " (OpenAPI spec is reachable)" : ""),
        details: diagnosticAdvice || `TTS3 endpoint returned status ${res.status}`,
        timestamp: Date.now(),
      };
      setLastValidationResult("lovable", result);
      return result;
    } catch (fetchErr: unknown) {
      if (timeoutId) clearTimeout(timeoutId);
      const isAbort = (fetchErr as Error)?.name === "AbortError";
      const latency = Date.now() - startTime;

      let openApiReachable = false;
      try {
        const specRes = await fetch(LOVABLE_TTS_OPENAPI_URL, { method: "GET" });
        if (specRes.ok) openApiReachable = true;
      } catch {
        // spec check failed
      }

      const result: RemoteTtsValidationResult = {
        ok: false,
        service: "lovable",
        serviceName,
        endpoint,
        latencyMs: latency,
        audioVerified: false,
        error: isAbort
          ? `Request timed out after ${timeoutMs}ms`
          : (fetchErr as Error)?.message || "Network request failed",
        details: openApiReachable
          ? "OpenAPI spec is online, but TTS endpoint call failed"
          : "Service could not be reached",
        timestamp: Date.now(),
      };
      setLastValidationResult("lovable", result);
      return result;
    }
  } catch (err: unknown) {
    const result: RemoteTtsValidationResult = {
      ok: false,
      service: "lovable",
      serviceName,
      endpoint,
      latencyMs: Date.now() - startTime,
      audioVerified: false,
      error: (err as Error)?.message || String(err),
      timestamp: Date.now(),
    };
    setLastValidationResult("lovable", result);
    return result;
  }
}

/**
 * Fetches non-secret public service capabilities and provider availability from /api/public/info
 * according to the OpenAPI 3.1.0 specification.
 */
export async function fetchSpeakApiInfo(
  timeoutMs: number = 5000,
): Promise<PublicServiceInfo | null> {
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    const res = await fetch(LOVABLE_TTS_INFO_URL, {
      method: "GET",
      signal: controller?.signal,
    });
    if (timeoutId) clearTimeout(timeoutId);
    if (res.ok) {
      return (await res.json()) as PublicServiceInfo;
    }
    return null;
  } catch {
    if (timeoutId) clearTimeout(timeoutId);
    return null;
  }
}

/**
 * Creates a temporary access token without an account at /api/public/access-token
 * according to the OpenAPI 3.1.0 specification.
 */
export async function createTemporaryAccessToken(
  providerKeys: Record<string, string[]>,
  timeoutMs: number = 5000,
): Promise<TemporaryAccessTokenResponse | null> {
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    const res = await fetch(LOVABLE_TTS_ACCESS_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider_keys: providerKeys }),
      signal: controller?.signal,
    });
    if (timeoutId) clearTimeout(timeoutId);
    if (res.ok) {
      return (await res.json()) as TemporaryAccessTokenResponse;
    }
    return null;
  } catch {
    if (timeoutId) clearTimeout(timeoutId);
    return null;
  }
}

/**
 * Revokes the current temporary access token at /api/public/access-token
 * according to the OpenAPI 3.1.0 specification.
 */
export async function revokeTemporaryAccessToken(
  token: string,
  timeoutMs: number = 5000,
): Promise<boolean> {
  if (!token) return false;
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    const res = await fetch(LOVABLE_TTS_ACCESS_TOKEN_URL, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
      signal: controller?.signal,
    });
    if (timeoutId) clearTimeout(timeoutId);
    return res.ok;
  } catch {
    if (timeoutId) clearTimeout(timeoutId);
    return false;
  }
}

/**
 * Retrieves whether the alternative TTS service is enabled (off by default).
 */
export function getUseAlternativeTts(): boolean {
  try {
    const stored =
      typeof localStorage !== "undefined"
        ? localStorage.getItem(STORAGE_KEY_USE_ALTERNATIVE_TTS)
        : memoryFallbackStore[STORAGE_KEY_USE_ALTERNATIVE_TTS];
    if (stored !== null && stored !== undefined) {
      return stored === "true";
    }
  } catch {
    // ignore
  }
  // By default use external TTS service if it is already set and validated
  const hasToken = Boolean(getSpeakApiToken() || getProviderApiKey());
  const lastVal = getLastValidationResult("lovable");
  if (hasToken && lastVal?.ok) {
    return true;
  }
  return false;
}

/**
 * Stores whether the alternative TTS service is enabled.
 */
export function setUseAlternativeTts(enabled: boolean): void {
  const val = enabled ? "true" : "false";
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY_USE_ALTERNATIVE_TTS, val);
    }
  } catch (err) {
    console.warn("Failed to persist alternative TTS setting:", err);
  }
  memoryFallbackStore[STORAGE_KEY_USE_ALTERNATIVE_TTS] = val;
}

/**
 * Retrieves the alternative TTS mode: "fallback_only" (default) or "always".
 */
export function getAlternativeTtsMode(): AlternativeTtsMode {
  try {
    const stored =
      typeof localStorage !== "undefined"
        ? localStorage.getItem(STORAGE_KEY_ALTERNATIVE_TTS_MODE)
        : memoryFallbackStore[STORAGE_KEY_ALTERNATIVE_TTS_MODE];
    if (stored === "always" || stored === "fallback_only") {
      return stored;
    }
  } catch {
    // ignore
  }
  // By default use external TTS service if it is already set and validated
  const hasToken = Boolean(getSpeakApiToken() || getProviderApiKey());
  const lastVal = getLastValidationResult("lovable");
  if (hasToken && lastVal?.ok) {
    return "always";
  }
  return "fallback_only";
}

/**
 * Persists the alternative TTS mode.
 */
export function setAlternativeTtsMode(mode: AlternativeTtsMode): void {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY_ALTERNATIVE_TTS_MODE, mode);
    }
  } catch (err) {
    console.warn("Failed to persist alternative TTS mode:", err);
  }
  memoryFallbackStore[STORAGE_KEY_ALTERNATIVE_TTS_MODE] = mode;
}

/**
 * Retrieves whether Alternative TTS runs in Anonymous Mode (no cookies/tokens/identifiers).
 */
export function getAlternativeTtsAnonymousMode(): boolean {
  try {
    const stored =
      typeof localStorage !== "undefined"
        ? localStorage.getItem(STORAGE_KEY_ALTERNATIVE_TTS_ANONYMOUS_MODE)
        : memoryFallbackStore[STORAGE_KEY_ALTERNATIVE_TTS_ANONYMOUS_MODE];
    return stored === "true";
  } catch {
    return false;
  }
}

/**
 * Persists whether Alternative TTS runs in Anonymous Mode.
 */
export function setAlternativeTtsAnonymousMode(enabled: boolean): void {
  const val = enabled ? "true" : "false";
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY_ALTERNATIVE_TTS_ANONYMOUS_MODE, val);
    }
  } catch (err) {
    console.warn("Failed to persist anonymous TTS mode:", err);
  }
  memoryFallbackStore[STORAGE_KEY_ALTERNATIVE_TTS_ANONYMOUS_MODE] = val;
}

/**
 * Retrieves the configured Alternative TTS Engine: "lovable" (TTS3 service).
 */
export function getAlternativeTtsEngine(): AlternativeTtsEngine {
  return "lovable";
}

/**
 * Persists the Alternative TTS Engine choice.
 */
export function setAlternativeTtsEngine(_engine?: AlternativeTtsEngine): void {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY_ALTERNATIVE_TTS_ENGINE, "lovable");
    }
  } catch (err) {
    console.warn("Failed to persist alternative TTS engine:", err);
  }
  memoryFallbackStore[STORAGE_KEY_ALTERNATIVE_TTS_ENGINE] = "lovable";
}

/**
 * Retrieves the configured Lovable TTS Provider (defaults to "auto").
 */
export function getLovableTtsProvider(): LovableTtsProvider {
  try {
    const stored =
      typeof localStorage !== "undefined"
        ? (localStorage.getItem(
            STORAGE_KEY_ALTERNATIVE_TTS_LOVABLE_PROVIDER,
          ) as LovableTtsProvider | null)
        : (memoryFallbackStore[STORAGE_KEY_ALTERNATIVE_TTS_LOVABLE_PROVIDER] as
            LovableTtsProvider | undefined);
    if (stored && (LOVABLE_TTS_PROVIDERS as readonly string[]).includes(stored)) {
      return stored;
    }
  } catch {
    // ignore
  }
  return "auto";
}

/**
 * Persists the Lovable TTS Provider choice.
 */
export function setLovableTtsProvider(provider: LovableTtsProvider): void {
  const p = (LOVABLE_TTS_PROVIDERS as readonly string[]).includes(provider) ? provider : "auto";
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
 * Retrieves the effective Speak API token or provider API key (custom user key, or server .env key fallback).
 */
export function getLovableTtsApiKey(): string {
  if (typeof window === "undefined") return "";
  try {
    const speakToken = getSpeakApiToken();
    if (speakToken) return speakToken;
    const providerKey = getProviderApiKey();
    if (providerKey) return providerKey;
    const legacyKey =
      localStorage.getItem(STORAGE_KEY_ALTERNATIVE_TTS_LOVABLE_API_KEY) ||
      localStorage.getItem("yt_openrouter_api_key_v1") ||
      localStorage.getItem("yt_openrouter_api_key") ||
      "";
    if (legacyKey && legacyKey.trim()) {
      return legacyKey.trim();
    }
    return getServerOpenRouterApiKey();
  } catch {
    return "";
  }
}

/**
 * Persists the Speak API token or upstream Provider API key to appropriate localStorage slots.
 * Tokens starting with 'spk_' or 'tts_' are safely routed to Speak API Bearer token storage.
 */
export function setLovableTtsApiKey(apiKey: string): void {
  if (typeof window === "undefined") return;
  let clean = apiKey.trim();
  if (clean.toLowerCase().startsWith("bearer ")) {
    clean = clean.slice(7).trim();
  }
  try {
    if (clean) {
      if (isSpeakApiPersonalToken(clean)) {
        setSpeakApiToken(clean);
        // Clean out provider key slots so spk_ token is never mistakenly sent as provider key
        localStorage.removeItem(STORAGE_KEY_ALTERNATIVE_TTS_PROVIDER_API_KEY);
        localStorage.removeItem(STORAGE_KEY_ALTERNATIVE_TTS_LOVABLE_API_KEY);
        localStorage.removeItem("yt_openrouter_api_key_v1");
        localStorage.removeItem("yt_openrouter_api_key");
      } else {
        setProviderApiKey(clean);
        localStorage.setItem(STORAGE_KEY_ALTERNATIVE_TTS_LOVABLE_API_KEY, clean);
        localStorage.setItem("yt_openrouter_api_key_v1", clean);
        localStorage.setItem("yt_openrouter_api_key", clean);
      }
    } else {
      setSpeakApiToken("");
      setProviderApiKey("");
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
  const provider = optionsOverride?.provider || getLovableTtsProvider();

  let audioUrl = "";
  let shouldRevoke = false;

  try {
    const requestedSpeed =
      optionsOverride?.speed ?? (typeof rate === "number" && rate > 0 ? rate : 1.0);
    const mergedOptions: LovableTtsOptions = {
      speed: requestedSpeed,
      ...optionsOverride,
    };
    const synthesized = await synthesizeLovableTtsAudio(
      text,
      lang,
      mergedOptions,
      optionsOverride ? "test_button" : "playback",
    );
    if (synthesized?.url) {
      audioUrl = synthesized.url;
      shouldRevoke = Boolean(synthesized.revokeOnDone);
    }
  } catch (err) {
    console.warn("[LovableTTS] Synthesis error, will attempt fallback:", err);
  }

  if (!audioUrl) return;

  const isAnonymous = optionsOverride?.isAnonymous ?? getAlternativeTtsAnonymousMode();

  return new Promise((resolve) => {
    const audio = new Audio();
    if (isAnonymous) {
      audio.crossOrigin = "anonymous";
    }
    const effectiveVolume =
      typeof optionsOverride?.volume === "number" && Number.isFinite(optionsOverride.volume)
        ? Math.max(0, Math.min(1, optionsOverride.volume))
        : 1.0;
    try {
      audio.volume = effectiveVolume;
    } catch {
      // ignore volume set error
    }
    activeAlternativeAudio = audio;

    let hasEnded = false;
    let watchdogTimer: ReturnType<typeof setTimeout> | null = null;
    const cleanup = () => {
      if (hasEnded) return;
      hasEnded = true;
      if (watchdogTimer) {
        clearTimeout(watchdogTimer);
        watchdogTimer = null;
      }
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

    const maxTimeoutMs = Math.max(8000, (text.length / 5) * 1000 + 4000);
    watchdogTimer = setTimeout(() => {
      console.warn(
        `[AlternativeTTS] Audio playback watchdog timer expired after ${maxTimeoutMs}ms`,
      );
      cleanup();
    }, maxTimeoutMs);

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
          u.rate = Math.max(0.3, Math.min(1.5, rate || 0.5));
          u.volume = effectiveVolume;
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

    // Determine effective playback rate based on tts rate settings (clamped between 0.25 and 4.0)
    const effectivePlaybackRate = Math.max(
      0.25,
      Math.min(4.0, typeof rate === "number" && rate > 0 ? rate : 1.0),
    );

    const applyPlaybackRate = () => {
      try {
        audio.playbackRate = effectivePlaybackRate;
      } catch {
        // ignore
      }
    };

    const onError = (e: unknown) => {
      console.warn(
        `Alternative TTS (${engine}) audio error, attempting fallback to device speech:`,
        e,
      );
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
    audio.addEventListener("loadedmetadata", applyPlaybackRate);
    audio.addEventListener("canplay", applyPlaybackRate);

    applyPlaybackRate();

    audio.src = audioUrl;
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch((err) => {
        console.warn(
          "Alternative TTS playback rejected, attempting fallback to device speech:",
          err,
        );
        fallbackToWebSpeech();
      });
    }
  });
}

/**
 * Executes subtitle speech synthesis following the configured fallback order:
 * e.g., google_tts3_native:
 *  1. Google Translate TTS directly
 *  2. Lovable TTS3 Speak API (tts3.lovable.app, defaults to provider: "auto")
 *  3. Local device voice (Web Speech API or Android Native Shell)
 */
export async function executeTtsFallbackSequence(
  text: string,
  lang: string,
  rate = 1.0,
  orderOverride?: TtsFallbackOrder,
  onProgress?: (progressPercent: number) => void,
  options?: {
    tts3Provider?: LovableTtsProvider;
    tts3Voice?: string;
    isAnonymous?: boolean;
    onNativeSpeak?: () => Promise<boolean>;
  },
): Promise<"tts3" | "native" | "none"> {
  const order = orderOverride || getTtsFallbackOrder();
  const isAnonymous = options?.isAnonymous ?? getAlternativeTtsAnonymousMode();
  const provider = options?.tts3Provider || "auto";
  const voice = options?.tts3Voice;

  // Derive steps array from order
  const steps: Array<"tts3" | "native"> = [];
  if (order === "native_tts3") {
    steps.push("native", "tts3");
  } else if (order === "native_only") {
    steps.push("native");
  } else {
    // default tts3_native
    steps.push("tts3", "native");
  }

  for (const step of steps) {
    if (step === "tts3") {
      try {
        await playAlternativeTtsAudio(text, lang, rate, onProgress, "lovable", {
          provider,
          voice,
          speed: rate,
          isAnonymous,
        });
        return "tts3";
      } catch (err) {
        console.warn("[TtsFallbackSequence] TTS3 Speak API step failed, continuing:", err);
      }
    } else if (step === "native") {
      if (options?.onNativeSpeak) {
        try {
          const ok = await options.onNativeSpeak();
          if (ok) return "native";
        } catch (err) {
          console.warn("[TtsFallbackSequence] Native speak step failed:", err);
        }
      } else if (typeof window !== "undefined" && "speechSynthesis" in window) {
        try {
          await new Promise<void>((resolve) => {
            window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(text);
            u.lang = normalizeLanguageCode(lang);
            u.rate = Math.max(0.3, Math.min(1.5, rate || 0.5));
            u.onend = () => resolve();
            u.onerror = () => resolve();
            window.speechSynthesis.speak(u);
          });
          return "native";
        } catch {
          // ignore
        }
      }
    }
  }

  return "none";
}
