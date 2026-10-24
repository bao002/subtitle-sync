export function getBeginnerDefaultBaseLanguage(tracks: ReadonlyArray<{ lang: string }>): string {
  return tracks.find((track) => track.lang === "en")?.lang ?? tracks[0]?.lang ?? "";
}
