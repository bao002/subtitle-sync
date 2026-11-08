import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  Sparkles,
  Volume2,
  RotateCcw,
  SkipBack,
  SkipForward,
  Tv,
  CheckCircle2,
  VolumeX,
  Languages,
  Check,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RTL } from "@/lib/subtitles";

export interface WordBalloonLearningViewProps {
  /** Current base language sentence */
  currentSentence: string;
  /** Base language code (e.g. "en") */
  baseLanguage: string;
  /** Base language human name */
  baseLanguageName: string;
  /** Target translation language code (e.g. "es", "he") */
  targetLanguage: string;
  /** Target translation language human name */
  targetLanguageName: string;
  /** Translated full sentence */
  targetTranslation: string;
  /** Available languages for target translation */
  availableTargetLanguages?: Array<{ code: string; name: string }>;
  /** Callback to change target language */
  onSelectTargetLanguage?: (langCode: string) => void;
  /** Active sentence index (0-based) */
  activeRowIndex: number;
  /** Total number of sentences */
  totalRows: number;
  /** Previous sentence callback */
  onPrevSentence?: () => void;
  /** Next sentence callback */
  onNextSentence?: () => void;
  /** Replay / Restart sentence callback */
  onReplaySentence?: () => void;
  /** TTS speech synthesis callback */
  onSpeakText?: (text: string, langCode: string) => void;
  /** Return to standard video player callback */
  onCloseLearningView?: () => void;
  /** Custom wrapper styles */
  className?: string;
}

export interface WordBalloonItem {
  id: string;
  index: number;
  word: string;
  cleanWord: string;
  translation: string;
  colorScheme: BalloonColorScheme;
}

export interface BalloonColorScheme {
  name: string;
  unpunchedBg: string;
  unpunchedBorder: string;
  unpunchedText: string;
  unpunchedHover: string;
  punchedBg: string;
  punchedBorder: string;
  punchedText: string;
  accent: string;
}

const BALLOON_COLOR_PALETTES: BalloonColorScheme[] = [
  {
    name: "rose",
    unpunchedBg: "bg-rose-500/15 dark:bg-rose-500/25",
    unpunchedBorder: "border-rose-400/60 dark:border-rose-400/40",
    unpunchedText: "text-rose-700 dark:text-rose-200",
    unpunchedHover: "hover:bg-rose-500/25 dark:hover:bg-rose-500/35",
    punchedBg: "bg-rose-600 dark:bg-rose-700 text-white shadow-rose-500/30",
    punchedBorder: "border-rose-500 dark:border-rose-400",
    punchedText: "text-white",
    accent: "text-rose-600 dark:text-rose-400",
  },
  {
    name: "sky",
    unpunchedBg: "bg-sky-500/15 dark:bg-sky-500/25",
    unpunchedBorder: "border-sky-400/60 dark:border-sky-400/40",
    unpunchedText: "text-sky-700 dark:text-sky-200",
    unpunchedHover: "hover:bg-sky-500/25 dark:hover:bg-sky-500/35",
    punchedBg: "bg-sky-600 dark:bg-sky-700 text-white shadow-sky-500/30",
    punchedBorder: "border-sky-500 dark:border-sky-400",
    punchedText: "text-white",
    accent: "text-sky-600 dark:text-sky-400",
  },
  {
    name: "emerald",
    unpunchedBg: "bg-emerald-500/15 dark:bg-emerald-500/25",
    unpunchedBorder: "border-emerald-400/60 dark:border-emerald-400/40",
    unpunchedText: "text-emerald-700 dark:text-emerald-200",
    unpunchedHover: "hover:bg-emerald-500/25 dark:hover:bg-emerald-500/35",
    punchedBg: "bg-emerald-600 dark:bg-emerald-700 text-white shadow-emerald-500/30",
    punchedBorder: "border-emerald-500 dark:border-emerald-400",
    punchedText: "text-white",
    accent: "text-emerald-600 dark:text-emerald-400",
  },
  {
    name: "amber",
    unpunchedBg: "bg-amber-500/15 dark:bg-amber-500/25",
    unpunchedBorder: "border-amber-400/60 dark:border-amber-400/40",
    unpunchedText: "text-amber-800 dark:text-amber-200",
    unpunchedHover: "hover:bg-amber-500/25 dark:hover:bg-amber-500/35",
    punchedBg: "bg-amber-600 dark:bg-amber-700 text-white shadow-amber-500/30",
    punchedBorder: "border-amber-500 dark:border-amber-400",
    punchedText: "text-white",
    accent: "text-amber-600 dark:text-amber-400",
  },
  {
    name: "violet",
    unpunchedBg: "bg-violet-500/15 dark:bg-violet-500/25",
    unpunchedBorder: "border-violet-400/60 dark:border-violet-400/40",
    unpunchedText: "text-violet-700 dark:text-violet-200",
    unpunchedHover: "hover:bg-violet-500/25 dark:hover:bg-violet-500/35",
    punchedBg: "bg-violet-600 dark:bg-violet-700 text-white shadow-violet-500/30",
    punchedBorder: "border-violet-500 dark:border-violet-400",
    punchedText: "text-white",
    accent: "text-violet-600 dark:text-violet-400",
  },
  {
    name: "teal",
    unpunchedBg: "bg-teal-500/15 dark:bg-teal-500/25",
    unpunchedBorder: "border-teal-400/60 dark:border-teal-400/40",
    unpunchedText: "text-teal-700 dark:text-teal-200",
    unpunchedHover: "hover:bg-teal-500/25 dark:hover:bg-teal-500/35",
    punchedBg: "bg-teal-600 dark:bg-teal-700 text-white shadow-teal-500/30",
    punchedBorder: "border-teal-500 dark:border-teal-400",
    punchedText: "text-white",
    accent: "text-teal-600 dark:text-teal-400",
  },
];

/**
 * Synthesizes a pleasant punch/pop sound effect using Web Audio API
 */
function playWebAudioPopSound(): void {
  if (typeof window === "undefined") return;
  try {
    const AudioCtxClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtxClass) return;
    const ctx = new AudioCtxClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    // Quick energetic pitch pop from 380Hz up to 920Hz
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(380, now);
    osc.frequency.exponentialRampToValueAtTime(920, now + 0.07);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  } catch {
    // Audio context may be restricted before user gesture
  }
}

/**
 * Tokenize a text string into word units.
 */
function extractWords(text: string): string[] {
  if (!text) return [];
  const matches = text.trim().match(/\S+/g);
  return matches ? matches : [];
}

/**
 * Cleans non-alphanumeric punctuation from a word token for dictionary/display.
 */
function sanitizeWord(rawWord: string): string {
  return rawWord.replace(
    /^[^a-zA-Z0-9\u0590-\u05FF\u0600-\u06FF]+|[^a-zA-Z0-9\u0590-\u05FF\u0600-\u06FF]+$/g,
    "",
  );
}

export const WordBalloonLearningView: React.FC<WordBalloonLearningViewProps> = ({
  currentSentence,
  baseLanguage,
  baseLanguageName,
  targetLanguage,
  targetLanguageName,
  targetTranslation,
  availableTargetLanguages = [],
  onSelectTargetLanguage,
  activeRowIndex,
  totalRows,
  onPrevSentence,
  onNextSentence,
  onReplaySentence,
  onSpeakText,
  onCloseLearningView,
  className = "",
}) => {
  // Set of punched balloon indices for the active sentence
  const [punchedIndices, setPunchedIndices] = useState<Set<number>>(new Set());
  // Toggle for audio pop sound effect
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  // Recently punched balloon index for burst highlight animation
  const [justPunchedIndex, setJustPunchedIndex] = useState<number | null>(null);

  // Reset punched indices whenever active sentence changes
  useEffect(() => {
    setPunchedIndices(new Set());
    setJustPunchedIndex(null);
  }, [activeRowIndex, currentSentence]);

  // Tokenize base words and target translation words
  const baseWords = useMemo(() => extractWords(currentSentence), [currentSentence]);
  const translationWords = useMemo(() => extractWords(targetTranslation), [targetTranslation]);

  // Formulate balloon items with aligned word translations
  const balloons = useMemo<WordBalloonItem[]>(() => {
    if (baseWords.length === 0) return [];

    return baseWords.map((word, index) => {
      const cleanWord = sanitizeWord(word);
      const colorScheme = BALLOON_COLOR_PALETTES[index % BALLOON_COLOR_PALETTES.length];

      // Proportional word alignment to target translation words
      let wordTranslation = "";
      if (translationWords.length > 0) {
        if (baseWords.length === translationWords.length) {
          wordTranslation = translationWords[index];
        } else {
          // Map index proportionally across translation words
          const targetIndex = Math.min(
            translationWords.length - 1,
            Math.floor((index / baseWords.length) * translationWords.length),
          );
          wordTranslation = translationWords[targetIndex];
        }
      }

      // If translation text is empty or unavailable, fallback gracefully
      if (!wordTranslation) {
        wordTranslation = `[${cleanWord || word}]`;
      }

      return {
        id: `balloon-${index}-${cleanWord}`,
        index,
        word,
        cleanWord,
        translation: sanitizeWord(wordTranslation) || wordTranslation,
        colorScheme,
      };
    });
  }, [baseWords, translationWords]);

  // Handle punch interaction on a balloon
  const handlePunchBalloon = useCallback(
    (index: number, balloon: WordBalloonItem) => {
      if (soundEnabled) {
        playWebAudioPopSound();
      }

      setPunchedIndices((prev) => {
        const next = new Set(prev);
        if (next.has(index)) {
          // If already punched, tapping again speaks the translated word
          if (onSpeakText && balloon.translation) {
            onSpeakText(balloon.translation, targetLanguage);
          }
        } else {
          next.add(index);
          setJustPunchedIndex(index);
          setTimeout(() => setJustPunchedIndex(null), 600);

          // Pronounce the revealed translation
          if (onSpeakText && balloon.translation) {
            onSpeakText(balloon.translation, targetLanguage);
          }
        }
        return next;
      });
    },
    [soundEnabled, onSpeakText, targetLanguage],
  );

  // Punch all balloons
  const handlePunchAll = useCallback(() => {
    if (soundEnabled) {
      playWebAudioPopSound();
    }
    const allIndices = new Set(balloons.map((_, i) => i));
    setPunchedIndices(allIndices);
  }, [balloons, soundEnabled]);

  // Reset / Re-inflate all balloons
  const handleResetBalloons = useCallback(() => {
    setPunchedIndices(new Set());
    setJustPunchedIndex(null);
  }, []);

  const totalBalloons = balloons.length;
  const punchedCount = punchedIndices.size;
  const progressRatio = totalBalloons > 0 ? punchedCount / totalBalloons : 0;
  const isAllPunched = totalBalloons > 0 && punchedCount === totalBalloons;

  const isBaseRtl = RTL.has(baseLanguage);
  const isTargetRtl = RTL.has(targetLanguage);

  return (
    <div
      data-testid="word-balloon-learning-view"
      id="word-balloon-learning-view"
      className={`relative flex flex-col justify-between overflow-hidden rounded-xl border-2 border-indigo-500/30 bg-gradient-to-br from-indigo-950/20 via-background to-card p-3 sm:p-5 text-foreground shadow-xl transition-all ${className}`}
      style={{ minHeight: "420px" }}
    >
      {/* 1. Header Toolbar: Stage Badge, Target Language Selector, Sound & Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-border/70 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-bold text-white shadow-xs">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Interactive Learning Stage</span>
          </div>

          <span
            data-testid="balloon-sentence-counter"
            className="text-xs font-semibold text-muted-foreground"
          >
            {activeRowIndex >= 0
              ? `Sentence ${activeRowIndex + 1} of ${totalRows}`
              : "No sentence loaded"}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Target Language Selector */}
          {availableTargetLanguages.length > 1 && onSelectTargetLanguage && (
            <div className="flex items-center gap-1 bg-card border border-border/80 px-2 py-1 rounded-md text-xs">
              <Languages className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <select
                data-testid="balloon-target-lang-select"
                aria-label="Select Target Language"
                value={targetLanguage}
                onChange={(e) => onSelectTargetLanguage(e.target.value)}
                className="bg-transparent font-medium text-xs text-foreground focus:outline-hidden cursor-pointer"
                title="Select learning target language"
              >
                {availableTargetLanguages.map((lang) => (
                  <option
                    key={lang.code}
                    value={lang.code}
                    className="bg-popover text-popover-foreground"
                  >
                    {lang.name} ({lang.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Sound Effects Toggle */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="balloon-sound-toggle"
            onClick={() => setSoundEnabled((prev) => !prev)}
            className={`h-7 px-2 text-xs gap-1 border-border ${
              soundEnabled ? "text-indigo-600 dark:text-indigo-400" : "text-muted-foreground"
            }`}
            title={soundEnabled ? "Mute pop sound effects" : "Enable pop sound effects"}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sound ON</span>
              </>
            ) : (
              <>
                <VolumeX className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sound OFF</span>
              </>
            )}
          </Button>

          {/* Switch back to Video Player */}
          {onCloseLearningView && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-testid="balloon-back-to-video-btn"
              onClick={onCloseLearningView}
              className="h-7 px-2.5 text-xs gap-1.5 border-border bg-card hover:bg-muted text-foreground"
              title="Return to video player"
            >
              <Tv className="h-3.5 w-3.5" />
              <span>Back to Video</span>
            </Button>
          )}
        </div>
      </div>

      {/* 2. Interactive Learning Area: Score & Balloon Field */}
      <div className="my-auto py-4 space-y-4">
        {/* Punch Progress & Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <span
              data-testid="balloon-progress-text"
              className="text-xs font-semibold text-foreground flex items-center gap-1.5"
            >
              {isAllPunched ? (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                  <Award className="h-4 w-4" />
                  All balloons punched! Great job!
                </span>
              ) : (
                <span>
                  Punch the balloons to reveal translations:{" "}
                  <strong className="text-indigo-600 dark:text-indigo-400">
                    {punchedCount}/{totalBalloons}
                  </strong>{" "}
                  ({Math.round(progressRatio * 100)}%)
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              size="sm"
              variant="outline"
              data-testid="punch-all-balloons-btn"
              onClick={handlePunchAll}
              disabled={isAllPunched || totalBalloons === 0}
              className="h-6 px-2 text-[11px] gap-1 border-border"
              title="Punch and reveal all balloons in this sentence"
            >
              <Sparkles className="h-3 w-3 text-indigo-500" />
              <span>Punch All</span>
            </Button>

            <Button
              type="button"
              size="sm"
              variant="ghost"
              data-testid="reset-balloons-btn"
              onClick={handleResetBalloons}
              disabled={punchedCount === 0}
              className="h-6 px-2 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
              title="Re-inflate all balloons"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Re-inflate</span>
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
          <div
            data-testid="balloon-progress-bar"
            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-300"
            style={{ width: `${progressRatio * 100}%` }}
          />
        </div>

        {/* Word Balloons Grid / Floating Cluster */}
        <div
          data-testid="word-balloons-container"
          dir={isBaseRtl ? "rtl" : "ltr"}
          className="min-h-[160px] flex flex-wrap items-center justify-center gap-3 sm:gap-4 p-4 rounded-xl border border-indigo-500/20 bg-card/40 backdrop-blur-xs"
        >
          {balloons.length > 0 ? (
            balloons.map((balloon) => {
              const isPunched = punchedIndices.has(balloon.index);
              const isJustPunched = justPunchedIndex === balloon.index;
              const { colorScheme } = balloon;

              return (
                <div
                  key={balloon.id}
                  data-testid={`balloon-card-${balloon.index}`}
                  className="flex flex-col items-center select-none group"
                >
                  <button
                    type="button"
                    data-testid={`balloon-punch-btn-${balloon.index}`}
                    data-balloon-state={isPunched ? "punched" : "unpunched"}
                    onClick={() => handlePunchBalloon(balloon.index, balloon)}
                    aria-label={
                      isPunched
                        ? `Punched balloon ${balloon.cleanWord}: reveals ${balloon.translation}`
                        : `Punch balloon for word ${balloon.cleanWord}`
                    }
                    className={`relative min-w-[80px] sm:min-w-[100px] max-w-[170px] min-h-[85px] sm:min-h-[96px] p-2.5 rounded-[30px] rounded-b-[24px] border-2 flex flex-col items-center justify-center text-center transition-all duration-200 cursor-pointer shadow-md active:scale-95 ${
                      isPunched
                        ? `${colorScheme.punchedBg} ${colorScheme.punchedBorder} scale-102`
                        : `${colorScheme.unpunchedBg} ${colorScheme.unpunchedBorder} ${colorScheme.unpunchedText} ${colorScheme.unpunchedHover} hover:-translate-y-1 hover:shadow-lg`
                    } ${isJustPunched ? "animate-bounce scale-110" : ""}`}
                  >
                    {/* Balloon highlight glare reflection on top right */}
                    <div className="absolute top-2 right-3 w-3 h-1.5 rounded-full bg-white/40 pointer-events-none transform -rotate-45" />

                    {isPunched ? (
                      /* Punched State: Translation Exposed */
                      <div className="flex flex-col items-center justify-center w-full space-y-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider opacity-85 line-through">
                          {balloon.cleanWord}
                        </span>
                        <span
                          data-testid={`balloon-translation-${balloon.index}`}
                          dir={isTargetRtl ? "rtl" : "ltr"}
                          className="text-base sm:text-lg font-extrabold tracking-wide drop-shadow-xs"
                        >
                          {balloon.translation}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] font-semibold opacity-90 mt-0.5">
                          <Check className="h-3 w-3 stroke-[3]" />
                          <span>Punched</span>
                        </div>
                      </div>
                    ) : (
                      /* Unpunched State: Word Visible, Punch Prompt */
                      <div className="flex flex-col items-center justify-center w-full space-y-1">
                        <span
                          data-testid={`balloon-word-${balloon.index}`}
                          className="text-base sm:text-lg font-bold tracking-tight"
                        >
                          {balloon.word}
                        </span>
                        <span className="text-[10px] font-semibold opacity-75 flex items-center gap-0.5">
                          🥊 <span>Punch</span>
                        </span>
                      </div>
                    )}
                  </button>

                  {/* Balloon Knot & String */}
                  <div className="flex flex-col items-center pointer-events-none mt-0.5">
                    <div
                      className={`w-2.5 h-1.5 rounded-full ${
                        isPunched ? "bg-foreground/70" : "bg-muted-foreground/60"
                      }`}
                    />
                    <div className="w-0.5 h-3 bg-muted-foreground/30" />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-6 text-muted-foreground italic text-sm">
              No sentence words available to inflate into balloons. Select a sentence below.
            </div>
          )}
        </div>

        {/* 3. Reference Sentence & Translation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
          {/* Base Sentence Card */}
          <div
            data-testid="balloon-base-sentence-card"
            className="p-3 rounded-lg border border-border/80 bg-card/60 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="font-semibold text-foreground uppercase tracking-wide">
                {baseLanguageName} ({baseLanguage})
              </span>
              {onSpeakText && currentSentence && (
                <button
                  type="button"
                  onClick={() => onSpeakText(currentSentence, baseLanguage)}
                  className="hover:text-foreground flex items-center gap-1 text-[11px]"
                  title="Hear full sentence"
                >
                  <Volume2 className="h-3 w-3" />
                  <span>Pronounce</span>
                </button>
              )}
            </div>
            <p
              dir={isBaseRtl ? "rtl" : "ltr"}
              className="font-medium text-foreground text-sm leading-relaxed"
            >
              {currentSentence || "N/A"}
            </p>
          </div>

          {/* Target Translation Sentence Card */}
          <div
            data-testid="balloon-target-translation-card"
            className="p-3 rounded-lg border border-border/80 bg-card/60 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="font-semibold text-foreground uppercase tracking-wide">
                {targetLanguageName} ({targetLanguage}) · Exposed Target
              </span>
              {onSpeakText && targetTranslation && (
                <button
                  type="button"
                  onClick={() => onSpeakText(targetTranslation, targetLanguage)}
                  className="hover:text-foreground flex items-center gap-1 text-[11px] text-indigo-500"
                  title="Hear target sentence"
                >
                  <Volume2 className="h-3 w-3" />
                  <span>Pronounce</span>
                </button>
              )}
            </div>
            <p
              dir={isTargetRtl ? "rtl" : "ltr"}
              className="font-medium text-foreground text-sm leading-relaxed"
            >
              {targetTranslation || "N/A"}
            </p>
          </div>
        </div>
      </div>

      {/* 4. Footer Controls: Sentence Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-3">
        <div className="flex items-center gap-2">
          {onPrevSentence && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-testid="balloon-prev-sentence-btn"
              onClick={onPrevSentence}
              disabled={activeRowIndex <= 0}
              className="h-8 px-2.5 text-xs gap-1 border-border text-foreground"
              title="Previous sentence"
            >
              <SkipBack className="h-3.5 w-3.5" />
              <span>Prev Sentence</span>
            </Button>
          )}

          {onReplaySentence && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-testid="balloon-replay-sentence-btn"
              onClick={onReplaySentence}
              className="h-8 px-2.5 text-xs gap-1 border-border text-foreground"
              title="Reset current sentence"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Replay</span>
            </Button>
          )}

          {onNextSentence && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-testid="balloon-next-sentence-btn"
              onClick={onNextSentence}
              disabled={activeRowIndex >= totalRows - 1}
              className="h-8 px-2.5 text-xs gap-1 border-border text-foreground"
              title="Next sentence"
            >
              <span>Next Sentence</span>
              <SkipForward className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        <div className="text-[11px] text-muted-foreground flex items-center gap-1">
          <span>Tap any balloon to punch it &amp; reveal the word translation</span>
        </div>
      </div>
    </div>
  );
};
