export interface PlaybackSectionTiming {
  start: number;
  end: number;
}

export function getPlaybackSectionId(section: PlaybackSectionTiming): string {
  return `${section.start}:${section.end}`;
}
