import React from "react";

export type SpeechProgress = { lang: string; row: number; start: number; end: number } | null;

export interface HighlightedSubtitleProps {
  text: string;
  progress: Exclude<SpeechProgress, null> | null;
  isPronouncedHighlighted?: boolean;
}

export function HighlightedSubtitle({
  text,
  progress,
  isPronouncedHighlighted,
}: HighlightedSubtitleProps) {
  if (!progress) {
    if (isPronouncedHighlighted) {
      return (
        <span
          data-testid="pronounced-sentence-text"
          className="bg-primary/10 dark:bg-primary/20 px-1 py-0.5 rounded-sm"
        >
          {text}
        </span>
      );
    }
    return <>{text}</>;
  }
  return (
    <>
      {text.slice(0, progress.start)}
      <mark className="rounded-sm bg-highlight px-0.5 text-highlight-foreground">
        {text.slice(progress.start, progress.end)}
      </mark>
      {text.slice(progress.end)}
    </>
  );
}
