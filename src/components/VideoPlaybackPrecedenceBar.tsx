import React from "react";
import {
  Film,
  ArrowUp,
  ArrowDown,
  ChevronUp,
  ChevronDown,
  Play,
  FastForward,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SectionOrder, TtsLanguageOrders } from "@/lib/playback-preferences";

export interface VideoPlaybackPrecedenceBarProps {
  currentPosition: number; // 0 to totalRecords
  totalRecords: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onPlaceAtTop: () => void;
  onPlaceAtBottom: () => void;
  asTableRow?: boolean;
  colSpan?: number;
  languagesBeforeCount?: number;
  languagesAfterCount?: number;
  className?: string;
}

/**
 * Calculates updated sectionOrder and languageOrders when the video bar
 * is placed at a specific index among the ordered languages.
 */
export function updatePrecedenceFromVideoBarIndex(
  orderedLangCodes: string[],
  videoBarIndex: number,
): { sectionOrder: SectionOrder; languageOrders: TtsLanguageOrders } {
  const newOrders: TtsLanguageOrders = {};
  const clampedIndex = Math.max(0, Math.min(orderedLangCodes.length, videoBarIndex));

  orderedLangCodes.forEach((code, idx) => {
    if (idx < clampedIndex) {
      newOrders[code] = "tts-first"; // plays before video
    } else {
      newOrders[code] = "video-first"; // plays after video
    }
  });

  let newSectionOrder: SectionOrder = "video-middle";
  if (clampedIndex === 0) {
    newSectionOrder = "video-first";
  } else if (clampedIndex >= orderedLangCodes.length) {
    newSectionOrder = "tts-first";
  }

  return { sectionOrder: newSectionOrder, languageOrders: newOrders };
}

/**
 * Resolves the current video bar index (0 to orderedLangCodes.length)
 * based on sectionOrder and per-language orders.
 */
export function getVideoBarIndex(
  orderedLangCodes: string[],
  languageOrders: TtsLanguageOrders,
  sectionOrder: SectionOrder,
): number {
  if (orderedLangCodes.length === 0) return 0;
  if (sectionOrder === "video-first") {
    const firstVideoFirst = orderedLangCodes.findIndex(
      (code) => (languageOrders[code] ?? sectionOrder) === "video-first",
    );
    return firstVideoFirst >= 0 ? firstVideoFirst : 0;
  }
  if (sectionOrder === "tts-first") {
    const firstVideoFirst = orderedLangCodes.findIndex(
      (code) => languageOrders[code] === "video-first",
    );
    return firstVideoFirst >= 0 ? firstVideoFirst : orderedLangCodes.length;
  }
  const firstVideoFirst = orderedLangCodes.findIndex(
    (code) => (languageOrders[code] ?? "video-first") === "video-first",
  );
  if (firstVideoFirst >= 0) return firstVideoFirst;
  return Math.ceil(orderedLangCodes.length / 2);
}

/**
 * VideoPlaybackPrecedenceBar
 * A movable and placeable bar to position video playing precedence among pointed table records.
 */
export const VideoPlaybackPrecedenceBar: React.FC<VideoPlaybackPrecedenceBarProps> = ({
  currentPosition,
  totalRecords,
  onMoveUp,
  onMoveDown,
  onPlaceAtTop,
  onPlaceAtBottom,
  asTableRow = false,
  colSpan = 10,
  languagesBeforeCount,
  languagesAfterCount,
  className = "",
}) => {
  const beforeCount = languagesBeforeCount ?? currentPosition;
  const afterCount = languagesAfterCount ?? Math.max(0, totalRecords - currentPosition);

  const isAtTop = currentPosition <= 0;
  const isAtBottom = currentPosition >= totalRecords;

  const content = (
    <div
      data-testid="video-playing-precedence-bar-content"
      className={`flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 rounded-md border-2 border-primary/60 bg-gradient-to-r from-blue-600/15 via-primary/20 to-indigo-600/15 shadow-xs transition-all ${className}`}
    >
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-primary text-primary-foreground font-bold text-[11px] shadow-xs">
          <Film className="h-3.5 w-3.5 fill-current" />
          <span>▶ Video Playing Precedence Bar</span>
        </div>
        <span className="text-[11px] font-medium text-foreground">
          {isAtTop && (
            <span className="text-blue-600 dark:text-blue-400 font-semibold">
              Video Plays First (0 languages before · {afterCount} after)
            </span>
          )}
          {isAtBottom && (
            <span className="text-amber-600 dark:text-amber-400 font-semibold">
              Video Plays Last ({beforeCount} languages before · 0 after)
            </span>
          )}
          {!isAtTop && !isAtBottom && (
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
              Video Plays In-Between ({beforeCount} before video · {afterCount} after video)
            </span>
          )}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isAtTop}
          onClick={onPlaceAtTop}
          data-testid="btn-video-bar-top"
          className="h-6 text-[10px] px-1.5 gap-1"
          title="Place video before all languages (Video First)"
        >
          <Play className="h-2.5 w-2.5" />
          <span>Top</span>
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={isAtTop}
          onClick={onMoveUp}
          data-testid="btn-move-video-bar-up"
          className="h-6 text-[10px] px-2 gap-1 font-medium"
          title="Move video precedence earlier (up by one record)"
        >
          <ChevronUp className="h-3 w-3" />
          <span>Move Up</span>
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={isAtBottom}
          onClick={onMoveDown}
          data-testid="btn-move-video-bar-down"
          className="h-6 text-[10px] px-2 gap-1 font-medium"
          title="Move video precedence later (down by one record)"
        >
          <span>Move Down</span>
          <ChevronDown className="h-3 w-3" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isAtBottom}
          onClick={onPlaceAtBottom}
          data-testid="btn-video-bar-bottom"
          className="h-6 text-[10px] px-1.5 gap-1"
          title="Place video after all languages (Video Last / TTS First)"
        >
          <Volume2 className="h-2.5 w-2.5" />
          <span>Bottom</span>
        </Button>
      </div>
    </div>
  );

  if (asTableRow) {
    return (
      <tr
        data-testid="video-playing-precedence-bar"
        data-bar-position={currentPosition}
        className="bg-primary/5 hover:bg-primary/10 transition-colors"
      >
        <td colSpan={colSpan} className="p-1">
          {content}
        </td>
      </tr>
    );
  }

  return (
    <div
      data-testid="video-playing-precedence-bar"
      data-bar-position={currentPosition}
      className="my-1.5"
    >
      {content}
    </div>
  );
};
