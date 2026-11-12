import React, { useMemo, useState } from "react";
import {
  Tv,
  Subtitles,
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Copy,
  Check,
  Languages,
  Sparkles,
  ArrowRight,
  Maximize2,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RTL } from "@/lib/subtitles";
import type { SpeechProgress } from "@/components/HighlightedSubtitle";

interface WordToken {
  word: string;
  start: number;
  end: number;
  index: number;
}

function tokenizeSentenceToWordTokens(text: string): WordToken[] {
  if (!text) return [];
  const tokens: WordToken[] = [];
  const regex = /\S+/g;
  let match: RegExpExecArray | null;
  let index = 0;
  while ((match = regex.exec(text)) !== null) {
    tokens.push({
      word: match[0],
      start: match.index,
      end: match.index + match[0].length,
      index,
    });
    index++;
  }
  return tokens;
}

export interface AlternativeVideoPlayerViewProps {
  /** Active base language sentence text */
  currentSentence: string;
  /** Base language code (e.g. "en") */
  baseLanguage: string;
  /** Human-readable base language name */
  baseLanguageName: string;
  /** Target TTS playback language code (e.g. "es", "he") */
  targetTtsLang: string;
  /** Human-readable target TTS language name */
  targetTtsLangName: string;
  /** Translation text in the target TTS language */
  targetTranslation: string;
  /** Available target TTS languages to toggle between */
  availableTtsLanguages?: Array<{ code: string; name: string }>;
  /** Callback to change selected target TTS translation language */
  onSelectTtsLang?: (langCode: string) => void;
  /** Speech synthesis progress with character start/end */
  speechProgress?: SpeechProgress;
  /** Whether TTS speech synthesis is actively playing */
  isSpeaking?: boolean;
  /** Currently spoken language code */
  speakingLang?: string | null;
  /** Currently spoken row index */
  speakingRow?: number;
  /** Active row/sentence index (0-based) */
  activeRowIndex: number;
  /** Total number of subtitle sentences */
  totalRows: number;
  /** Video playback current time in seconds */
  currentTimeSec: number;
  /** Total video duration in seconds */
  durationSec: number;
  /** Start time of current sentence in milliseconds */
  rowStartMs?: number;
  /** End time of current sentence in milliseconds */
  rowEndMs?: number;
  /** Whether video is actively playing */
  isVideoPlaying: boolean;
  /** Toggle video / playback play or pause */
  onTogglePlay: () => void;
  /** Jump to previous sentence */
  onPrevSentence?: () => void;
  /** Jump to next sentence */
  onNextSentence?: () => void;
  /** Replay current sentence */
  onReplaySentence?: () => void;
  /** Switch view mode back to standard video player */
  onCloseAlternativeView: () => void;
  /** Pronounce specific word or sentence via TTS callback */
  onSpeakText?: (text: string, langCode: string) => void;
  /** Container custom classes */
  className?: string;
}

/**
 * Format numeric seconds into MM:SS format.
 */
function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
  const floored = Math.floor(seconds);
  const m = Math.floor(floored / 60);
  const s = floored % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * Tokenize sentence into word items with character start and end offsets.
 */
function tokenizeWords(text: string): Array<{ word: string; start: number; end: number; index: number }> {
  if (!text) return [];
  const words: Array<{ word: string; start: number; end: number; index: number }> = [];
  const regex = /\S+/g;
  let match: RegExpExecArray | null;
  let idx = 0;
  while ((match = regex.exec(text)) !== null) {
    words.push({
      word: match[0],
      start: match.index,
      end: match.index + match[0].length,
      index: idx++,
    });
  }
  return words;
}

/**
 * AlternativeVideoPlayerView
 * High-clarity subtitle & translation display that replaces the video player viewport
 * while keeping audio and timecode synchronized in the background.
 * Allows inspecting the current sentence, active part-sentence / part-word, and translation
 * to the current TTS-play language with word-level highlighting.
 */
export const AlternativeVideoPlayerView: React.FC<AlternativeVideoPlayerViewProps> = React.memo(({
  currentSentence,
  baseLanguage,
  baseLanguageName,
  targetTtsLang,
  targetTtsLangName,
  targetTranslation,
  availableTtsLanguages = [],
  onSelectTtsLang,
  speechProgress,
  isSpeaking = false,
  speakingLang = null,
  speakingRow = -1,
  activeRowIndex,
  totalRows,
  currentTimeSec,
  durationSec,
  rowStartMs = 0,
  rowEndMs = 0,
  isVideoPlaying,
  onTogglePlay,
  onPrevSentence,
  onNextSentence,
  onReplaySentence,
  onCloseAlternativeView,
  onSpeakText,
  className = "",
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);

  const baseWords = useMemo(() => tokenizeSentenceToWordTokens(currentSentence), [currentSentence]);
  const translationWords = useMemo(() => tokenizeSentenceToWordTokens(targetTranslation), [targetTranslation]);

  const isBaseRtl = RTL.has(baseLanguage);
  const isTargetRtl = RTL.has(targetTtsLang);

  // Compute active word index during video playback based on linear time position in the sentence
  const currentMs = currentTimeSec * 1000;
  const sentenceDurationMs = Math.max(1, rowEndMs - rowStartMs);
  const sentenceProgressRatio = Math.max(
    0,
    Math.min(1, (currentMs - rowStartMs) / sentenceDurationMs),
  );

  const activeBaseWordIndex = useMemo(() => {
    if (baseWords.length === 0) return -1;
    // When TTS is speaking base language:
    if (isSpeaking && speakingLang === baseLanguage && speechProgress) {
      return baseWords.findIndex(
        (w) => speechProgress.start >= w.start && speechProgress.start < w.end,
      );
    }
    // When video is playing:
    if (isVideoPlaying && currentMs >= rowStartMs && currentMs <= rowEndMs) {
      const targetIdx = Math.min(
        baseWords.length - 1,
        Math.floor(sentenceProgressRatio * baseWords.length),
      );
      return targetIdx;
    }
    return -1;
  }, [baseWords, isSpeaking, speakingLang, baseLanguage, speechProgress, isVideoPlaying, currentMs, rowStartMs, rowEndMs, sentenceProgressRatio]);

  // Compute active word index for target translation when TTS is speaking
  const activeTranslationWordIndex = useMemo(() => {
    if (translationWords.length === 0) return -1;
    if (isSpeaking && speakingLang === targetTtsLang && speechProgress) {
      return translationWords.findIndex(
        (w) => speechProgress.start >= w.start && speechProgress.start < w.end,
      );
    }
    return -1;
  }, [translationWords, isSpeaking, speakingLang, targetTtsLang, speechProgress]);

  const handleCopy = async () => {
    try {
      const payload = [
        `[Sentence ${activeRowIndex + 1}/${totalRows}] ${formatTime(rowStartMs / 1000)} - ${formatTime(rowEndMs / 1000)}`,
        `${baseLanguageName} (${baseLanguage}): ${currentSentence || "N/A"}`,
        `${targetTtsLangName} (${targetTtsLang}): ${targetTranslation || "N/A"}`,
      ].join("\n");
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard error
    }
  };

  return (
    <div
      data-testid="alternative-video-player-view"
      id="alternative-video-player-view"
      className={`relative flex flex-col justify-between overflow-hidden rounded-lg border border-border bg-gradient-to-b from-card to-background p-3 sm:p-5 text-foreground shadow-lg transition-all ${className}`}
      style={{ minHeight: "360px" }}
    >
      {/* Top Bar: Alternative View Badge, Status & Mode Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-md bg-indigo-500/15 px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            <Subtitles className="h-3.5 w-3.5" />
            <span>Alternative Subtitle View</span>
          </span>

          <span
            data-testid="alternative-view-sentence-counter"
            className="text-xs font-medium text-muted-foreground"
          >
            {activeRowIndex >= 0
              ? `Sentence ${activeRowIndex + 1} of ${totalRows}`
              : "No sentence selected"}
          </span>

          {rowStartMs > 0 && rowEndMs > 0 && (
            <span className="text-[11px] font-mono text-muted-foreground/80">
              ({formatTime(rowStartMs / 1000)} - {formatTime(rowEndMs / 1000)})
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Status Indicator */}
          {isSpeaking ? (
            <span
              data-testid="alternative-view-speaking-indicator"
              className="flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md"
            >
              <Volume2 className="h-3 w-3 animate-pulse" />
              <span>Speaking: {speakingLang?.toUpperCase()}</span>
            </span>
          ) : isVideoPlaying ? (
            <span
              data-testid="alternative-view-playing-indicator"
              className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md"
            >
              <Play className="h-3 w-3 fill-current" />
              <span>Video Playing</span>
            </span>
          ) : (
            <span
              data-testid="alternative-view-paused-indicator"
              className="text-xs text-muted-foreground"
            >
              Paused
            </span>
          )}

          {/* Copy Button */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            data-testid="copy-alternative-subtitles-btn"
            onClick={handleCopy}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            title="Copy current sentence and translation to clipboard"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-500 mr-1" />
                <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 mr-1" />
                <span>Copy</span>
              </>
            )}
          </Button>

          {/* Switch back to Standard Video Player Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="switch-to-standard-video-btn"
            onClick={onCloseAlternativeView}
            className="h-7 px-2.5 text-xs gap-1.5 border-indigo-500/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10"
            title="Switch back to standard video player view"
          >
            <Tv className="h-3.5 w-3.5" />
            <span>Show Video</span>
          </Button>
        </div>
      </div>

      {/* Main Content Area: Subtitles & Translation Side-by-Side or Stacked */}
      <div className="my-auto py-4 space-y-4">
        {/* 1. Base Language Subtitle + Part Word / Part Sentence Progress */}
        <div
          data-testid="alternative-view-base-subtitle-card"
          className="rounded-lg border border-border/80 bg-card/60 p-3.5 sm:p-4 transition-all"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
              <span className="uppercase tracking-wider font-semibold text-foreground">
                {baseLanguageName}
              </span>
              <span className="font-mono text-[11px] text-muted-foreground">({baseLanguage})</span>
              <span>· Base Subtitle</span>
            </div>

            {onSpeakText && currentSentence && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onSpeakText(currentSentence, baseLanguage)}
                className="h-6 px-1.5 text-[11px] text-muted-foreground hover:text-foreground"
                title={`Hear in ${baseLanguageName}`}
              >
                <Volume2 className="h-3 w-3 mr-1" />
                <span>Pronounce</span>
              </Button>
            )}
          </div>

          {/* Sentence Words with Part Word Highlighting */}
          <div
            data-testid="alternative-view-base-words"
            dir={isBaseRtl ? "rtl" : "ltr"}
            className="text-base sm:text-lg font-medium leading-relaxed tracking-normal flex flex-wrap gap-1.5 select-text"
          >
            {baseWords.length > 0 ? (
              baseWords.map((item) => {
                const isWordActive = item.index === activeBaseWordIndex;
                const isSelected = selectedWord === item.word;

                return (
                  <button
                    key={`${item.index}-${item.word}`}
                    type="button"
                    data-testid={isWordActive ? "active-base-word" : `base-word-${item.index}`}
                    onClick={() => {
                      setSelectedWord(item.word);
                      onSpeakText?.(item.word, baseLanguage);
                    }}
                    className={`rounded px-1.5 py-0.5 text-left transition-colors duration-150 cursor-pointer ${
                      isWordActive
                        ? "bg-indigo-600 text-white font-bold shadow-xs scale-105"
                        : isSelected
                          ? "bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-semibold"
                          : "text-foreground hover:bg-muted/70"
                    }`}
                    title={`Click to pronounce: "${item.word}"`}
                  >
                    {item.word}
                  </button>
                );
              })
            ) : (
              <p className="text-muted-foreground italic text-sm">
                No subtitle text active at current playback position.
              </p>
            )}
          </div>

          {/* Sentence Time-Elapsed Progress Bar */}
          {rowEndMs > rowStartMs && (
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                <span>Part: {Math.round(sentenceProgressRatio * 100)}%</span>
                <span>
                  {formatTime(currentMs / 1000)} / {formatTime(rowEndMs / 1000)}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  data-testid="alternative-sentence-progress-bar"
                  className="h-full bg-indigo-500 transition-all duration-150"
                  style={{ width: `${sentenceProgressRatio * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* 2. Translation to Current TTS-Play Language */}
        <div
          data-testid="alternative-view-tts-translation-card"
          className="rounded-lg border border-border/80 bg-card/60 p-3.5 sm:p-4 transition-all"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
              <span className="uppercase tracking-wider font-semibold text-foreground">
                {targetTtsLangName}
              </span>
              <span className="font-mono text-[11px] text-muted-foreground">({targetTtsLang})</span>
              <span>· Translation to Current TTS-Play Lang</span>
            </div>

            <div className="flex items-center gap-1.5">
              {availableTtsLanguages.length > 1 && onSelectTtsLang && (
                <div className="flex items-center gap-1">
                  <Languages className="h-3 w-3 text-muted-foreground" />
                  <select
                    data-testid="alternative-view-tts-lang-select"
                    value={targetTtsLang}
                    onChange={(e) => onSelectTtsLang(e.target.value)}
                    className="rounded border border-input bg-background px-1.5 py-0.5 text-xs font-semibold text-foreground"
                    title="Switch target TTS translation language"
                  >
                    {Array.from(
                      new Map(availableTtsLanguages.map((l) => [l.code, l])).values(),
                    ).map((l, idx) => (
                      <option key={`${l.code}-${idx}`} value={l.code}>
                        {l.name} ({l.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {onSpeakText && targetTranslation && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  data-testid="tts-speak-translation-btn"
                  onClick={() => onSpeakText(targetTranslation, targetTtsLang)}
                  className="h-6 px-1.5 text-[11px] text-muted-foreground hover:text-foreground"
                  title={`Speak translation in ${targetTtsLangName}`}
                >
                  <Volume2 className="h-3 w-3 mr-1 text-indigo-500" />
                  <span>Speak</span>
                </Button>
              )}
            </div>
          </div>

          {/* Target Translation Words with Part-Word / Speech Highlight */}
          <div
            data-testid="alternative-view-translation-words"
            dir={isTargetRtl ? "rtl" : "ltr"}
            className="text-base sm:text-lg font-medium leading-relaxed tracking-normal flex flex-wrap gap-1.5 select-text"
          >
            {translationWords.length > 0 ? (
              translationWords.map((item) => {
                const isWordSpoken = item.index === activeTranslationWordIndex;
                const isSelected = selectedWord === item.word;

                return (
                  <button
                    key={`${item.index}-${item.word}`}
                    type="button"
                    data-testid={isWordSpoken ? "tts-spoken-word-highlight" : `trans-word-${item.index}`}
                    onClick={() => {
                      setSelectedWord(item.word);
                      onSpeakText?.(item.word, targetTtsLang);
                    }}
                    className={`rounded px-1.5 py-0.5 text-left transition-colors duration-150 cursor-pointer ${
                      isWordSpoken
                        ? "bg-amber-500 text-black font-bold shadow-xs scale-105"
                        : isSelected
                          ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 font-semibold"
                          : "text-foreground hover:bg-muted/70"
                    }`}
                    title={`Click to pronounce translation word: "${item.word}"`}
                  >
                    {item.word}
                  </button>
                );
              })
            ) : (
              <p className="text-muted-foreground italic text-sm">
                No translation available for {targetTtsLangName} in this sentence.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Transport Bar: Navigation, Play/Pause & Time Scrubbing */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-3">
        {/* Navigation Controls */}
        <div className="flex items-center gap-1.5">
          {onPrevSentence && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-testid="alternative-prev-sentence-btn"
              onClick={onPrevSentence}
              disabled={activeRowIndex <= 0}
              className="h-8 px-2 text-xs gap-1"
              title="Previous sentence"
            >
              <SkipBack className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Prev</span>
            </Button>
          )}

          <Button
            type="button"
            variant="default"
            size="sm"
            data-testid="alternative-play-pause-btn"
            onClick={onTogglePlay}
            className="h-8 px-3 text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isVideoPlaying || isSpeaking ? (
              <>
                <Pause className="h-3.5 w-3.5 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Play</span>
              </>
            )}
          </Button>

          {onReplaySentence && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-testid="alternative-replay-sentence-btn"
              onClick={onReplaySentence}
              className="h-8 px-2 text-xs gap-1"
              title="Replay this sentence"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Replay</span>
            </Button>
          )}

          {onNextSentence && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-testid="alternative-next-sentence-btn"
              onClick={onNextSentence}
              disabled={activeRowIndex >= totalRows - 1}
              className="h-8 px-2 text-xs gap-1"
              title="Next sentence"
            >
              <span className="hidden sm:inline">Next</span>
              <SkipForward className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {/* Timeline & Word Inspector Note */}
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <span>{formatTime(currentTimeSec)}</span>
          <span>/</span>
          <span>{formatTime(durationSec)}</span>
        </div>
      </div>
    </div>
  );
});
