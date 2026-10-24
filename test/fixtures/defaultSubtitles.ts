import { CaptionCue } from "../../src/types";
import { parseRawCaptionData } from "../../src/utils/captionParser";
import { L2RYRR6TXWA_LANGUAGE_JSON3_TRACKS } from "./L2Ryrr6txwA/jsonStrings";

/**
 * Subtitle fixtures registry.
 * Strictly restricted to video L2Ryrr6txwA located at public/fixtures/L2Ryrr6txwA per AGENTS.md.
 */
export const DEFAULT_MOCKED_SUBTITLES: Record<string, CaptionCue[]> = {
  L2Ryrr6txwA: L2RYRR6TXWA_LANGUAGE_JSON3_TRACKS.en,
};

export { L2RYRR6TXWA_LANGUAGE_JSON3_TRACKS };

export function getMockedSubtitlesForVideo(videoId: string): CaptionCue[] {
  if (videoId === "L2Ryrr6txwA") {
    return L2RYRR6TXWA_LANGUAGE_JSON3_TRACKS.en;
  }
  return [];
}

export function getCachedJson3ForVideoAndLanguage(
  videoId: string,
  langCode: string,
): CaptionCue[] | null {
  if (videoId === "L2Ryrr6txwA") {
    let clean = (langCode || "").toLowerCase().split(/[-_]/)[0];
    if (clean === "iw" || clean === "il") clean = "he";
    return L2RYRR6TXWA_LANGUAGE_JSON3_TRACKS[clean] || null;
  }
  return null;
}

export function hasCachedJson3ForVideoAndLanguage(videoId: string, langCode: string): boolean {
  if (videoId === "L2Ryrr6txwA") {
    let clean = (langCode || "").toLowerCase().split(/[-_]/)[0];
    if (clean === "iw" || clean === "il") clean = "he";
    return !!L2RYRR6TXWA_LANGUAGE_JSON3_TRACKS[clean];
  }
  return false;
}

export function getAllCachedLanguageCodesForVideo(videoId: string): string[] {
  if (!videoId) return [];
  if (videoId === "L2Ryrr6txwA") {
    return ["en", "ru", "he", "it", "ar", "es", "pt-BR"];
  }
  return [];
}
