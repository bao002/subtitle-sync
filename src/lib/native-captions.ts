import type { Json3 } from "./subtitles";
import { extractYouTubeId } from "../utils/youtube";

export type NativeShell = {
  isNativeShell(): boolean;
  getLastObservedTimedTextUrl(): string;
  fetchTranslatedCaptionsWithUrl(url: string, language: string, format: string): string;
  fetchTranslatedCaptions?(language: string, format: string): string;
};

export function nativeShell(): NativeShell | null {
  if (typeof window === "undefined") return null;
  const bridge = (window as Window & { AndroidNativeShell?: NativeShell }).AndroidNativeShell;
  try {
    return bridge?.isNativeShell() ? bridge : null;
  } catch {
    return null;
  }
}

export function decodeInterceptedCaption(payload: string): { url: string; rawData: string } | null {
  try {
    const bytes = Uint8Array.from(atob(payload), (char) => char.charCodeAt(0));
    const value = JSON.parse(new TextDecoder().decode(bytes));
    return typeof value.url === "string" && typeof value.rawData === "string" ? value : null;
  } catch {
    return null;
  }
}

export function parseJson3(raw: string): Json3 | null {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();

  // Every non-JSON3 response (HTML, XML, plain text, malformed JSON) is an errored / bad response
  if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) {
    return null;
  }

  try {
    const data = JSON.parse(trimmed) as Json3;
    if (
      Array.isArray(data.events) &&
      data.events.length > 0 &&
      data.events.some((event) => event.segs?.some((s) => s.utf8?.trim()))
    ) {
      data.length = data.events.length;
      return data;
    }
  } catch {
    // Malformed JSON is an errored response
  }

  return null;
}

export function timedTextVideoId(url: string): string | null {
  try {
    return new URL(url).searchParams.get("v");
  } catch {
    return null;
  }
}

export function parseVideoId(value: string): string | null {
  if (!value || typeof value !== "string") return null;
  const text = value.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(text)) return text;
  return extractYouTubeId(text);
}

export function buildTranslatedCaptionUrl(
  baseUrl: string,
  targetLanguage: string,
  format = "json3",
): string {
  try {
    const url = new URL(baseUrl);
    const originalLang = url.searchParams.get("lang");
    if (originalLang && originalLang.toLowerCase() === targetLanguage.toLowerCase()) {
      url.searchParams.delete("tlang");
    } else {
      url.searchParams.set("tlang", targetLanguage);
    }
    if (format) {
      url.searchParams.set("fmt", format);
    }
    return url.toString();
  } catch {
    return baseUrl;
  }
}

/** Request type "lang": replace the lang query with the desired language (no tlang). */
export function buildLangReplacedCaptionUrl(
  baseUrl: string,
  language: string,
  format = "json3",
): string {
  try {
    const url = new URL(baseUrl);
    url.searchParams.set("lang", language);
    url.searchParams.delete("tlang");
    if (format) url.searchParams.set("fmt", format);
    return url.toString();
  } catch {
    return baseUrl;
  }
}
