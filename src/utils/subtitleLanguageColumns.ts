import type { Json3, Row } from "@/lib/subtitles";
import { removeAngleBrackets } from "@/utils/captionParser";

export function subtitleLanguageIdentity(code: string): string {
  const normalized = code.trim().replace(/_/g, "-").toLowerCase();
  if (normalized === "iw" || normalized === "il") return "he";
  if (normalized === "in") return "id";
  if (normalized === "ji") return "yi";
  if (normalized === "zh-cn" || normalized === "zh-hans") return "zh-cn";
  if (normalized === "zh-tw" || normalized === "zh-hant") return "zh-tw";
  if (normalized === "pt-br") return "pt-br";
  return normalized.split("-")[0] || normalized;
}

function hasTrackCues(track: Json3 | undefined): boolean {
  return Boolean(track && ((track.events?.length ?? 0) > 0 || (track.length ?? 0) > 0));
}

export function findFetchedSubtitleLanguage(
  tracks: Record<string, Json3> | null | undefined,
  languageCode: string,
): string | undefined {
  if (!tracks) return undefined;
  if (hasTrackCues(tracks[languageCode])) return languageCode;
  const identity = subtitleLanguageIdentity(languageCode);
  return Object.keys(tracks).find(
    (code) => subtitleLanguageIdentity(code) === identity && hasTrackCues(tracks[code]),
  );
}

export function addUniqueSubtitleColumn<T extends { code: string; isYouTubeOrJson?: boolean }>(
  columns: T[],
  candidate: T,
): void {
  const identity = subtitleLanguageIdentity(candidate.code);
  const existingIndex = columns.findIndex(
    (column) => subtitleLanguageIdentity(column.code) === identity,
  );
  if (existingIndex < 0) {
    columns.push(candidate);
    return;
  }

  const existing = columns[existingIndex];
  if (existing && !existing.isYouTubeOrJson && candidate.isYouTubeOrJson) {
    columns[existingIndex] = candidate;
  }
}

export function mergeOnDemandSubtitleRows(
  rows: Row[],
  translations: Record<string, Record<number, string>>,
  tracks: Record<string, Json3> | null | undefined,
): Row[] {
  if (rows.length === 0) return rows;
  const fetchedLanguageIdentities = new Set(
    Object.keys(tracks ?? {})
      .filter((code) => hasTrackCues(tracks?.[code]))
      .map(subtitleLanguageIdentity),
  );

  return rows.map((row, index) => {
    let changed = false;
    const texts = { ...row.texts };

    for (const [language, translatedRows] of Object.entries(translations)) {
      if (fetchedLanguageIdentities.has(subtitleLanguageIdentity(language))) continue;
      if ((!texts[language] || texts[language].trim().length === 0) && translatedRows[index]) {
        texts[language] = removeAngleBrackets(translatedRows[index]!);
        changed = true;
      }
    }

    return changed ? { ...row, texts } : row;
  });
}
