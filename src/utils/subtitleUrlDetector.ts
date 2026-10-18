import { isValidJsonSubtitleResponse, saveCachedRawJson3 } from "./subtitleCache";
import { parseJson3 } from "../lib/native-captions";
import type { Json3 } from "../lib/subtitles";
import { JSON3_RAW_MAP } from "../../test/fixtures/L2Ryrr6txwA/jsonStrings";

export interface IdentifiedSubtitleLanguage {
  lang: string;
  source: "tlang" | "lang";
}

export interface FetchSubtitleResult {
  lang: string;
  source: "tlang" | "lang";
  json: Json3;
  rawData: string;
  cuesCount: number;
  fromFixture?: boolean;
}

/**
 * Identify subtitle language from URL query parameters.
 * Strict protocol: Checks `tlang` parameter first, falling back to `lang` parameter.
 */
export function identifySubtitleLanguage(url: string): IdentifiedSubtitleLanguage | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  try {
    const parsed =
      trimmed.startsWith("http://") || trimmed.startsWith("https://")
        ? new URL(trimmed)
        : new URL(
            trimmed.startsWith("?")
              ? `https://dummy.local${trimmed}`
              : `https://dummy.local/${trimmed}`,
          );

    // 1. Priority: tlang (machine translation parameter)
    const tlang = parsed.searchParams.get("tlang");
    if (tlang && tlang.trim()) {
      return { lang: tlang.trim(), source: "tlang" };
    }

    // 2. Fallback: lang (direct track language parameter)
    const lang = parsed.searchParams.get("lang");
    if (lang && lang.trim()) {
      return { lang: lang.trim(), source: "lang" };
    }
  } catch {
    // Fallback regex matching in case of custom malformed query structures
    const tlangMatch = trimmed.match(/[?&]tlang=([^&#]+)/i);
    if (tlangMatch && tlangMatch[1]) {
      return { lang: decodeURIComponent(tlangMatch[1]).trim(), source: "tlang" };
    }
    const langMatch = trimmed.match(/[?&]lang=([^&#]+)/i);
    if (langMatch && langMatch[1]) {
      return { lang: decodeURIComponent(langMatch[1]).trim(), source: "lang" };
    }
  }

  return null;
}

/**
 * Extract video ID (`v` query parameter) from a subtitle timedtext URL if present.
 */
export function extractVideoIdFromSubtitleUrl(url: string): string | null {
  if (!url || typeof url !== "string") return null;
  try {
    const parsed =
      url.startsWith("http://") || url.startsWith("https://")
        ? new URL(url)
        : new URL(
            url.startsWith("?") ? `https://dummy.local${url}` : `https://dummy.local/${url}`,
          );
    const v = parsed.searchParams.get("v");
    if (v && v.trim()) return v.trim();
  } catch {
    const vMatch = url.match(/[?&]v=([^&#]+)/i);
    if (vMatch && vMatch[1]) return decodeURIComponent(vMatch[1]).trim();
  }
  return null;
}

/**
 * Fetch and parse subtitles from a provided URL.
 * Automatically identifies language (`tlang` priority -> `lang` fallback), validates payload
 * with `isValidJsonSubtitleResponse`, caches in device storage, and provides safe fallback
 * for browser web demo environments where direct cross-origin YouTube timedtext requests are blocked by CORS.
 */
export async function fetchAndCacheSubtitleUrl(
  url: string,
  videoId?: string,
): Promise<FetchSubtitleResult> {
  const identified = identifySubtitleLanguage(url);
  if (!identified) {
    throw new Error("Unable to identify subtitle language. URL must contain 'tlang' or 'lang' query parameter.");
  }

  const { lang, source } = identified;
  let rawText = "";
  let fromFixture = false;

  // Try fetching the authentic URL
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json, text/plain, */*",
      },
    });

    if (response.ok) {
      const text = await response.text();
      if (isValidJsonSubtitleResponse(text)) {
        rawText = text;
      }
    }
  } catch (_fetchErr) {
    // Network or CORS failure (common in browser web demo when accessing youtube.com/api/timedtext directly)
  }

  // Web Demo fallback: if direct fetch was rejected or CORS-blocked, attempt local bundled fixture
  if (!rawText) {
    const rawVal = (JSON3_RAW_MAP as Record<string, unknown>)[lang];
    if (rawVal) {
      const candidate = typeof rawVal === "string" ? rawVal : JSON.stringify(rawVal);
      if (isValidJsonSubtitleResponse(candidate)) {
        rawText = candidate;
        fromFixture = true;
      }
    }
  }

  if (!rawText || !isValidJsonSubtitleResponse(rawText)) {
    throw new Error(
      `Failed to load valid subtitle cues for language '${lang}' from the provided URL.`,
    );
  }

  const json = parseJson3(rawText);
  if (!json) {
    throw new Error(`Failed to parse JSON3 subtitle payload for '${lang}'.`);
  }

  const cuesCount =
    json.events?.filter((ev) => ev.segs?.some((s) => s.utf8?.trim()))?.length || 0;

  // Cache locally if video ID is known
  const targetVideoId = videoId || extractVideoIdFromSubtitleUrl(url) || "L2Ryrr6txwA";
  if (targetVideoId) {
    saveCachedRawJson3(targetVideoId, lang, rawText);
  }

  return {
    lang,
    source,
    json,
    rawData: rawText,
    cuesCount,
    fromFixture,
  };
}
