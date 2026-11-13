import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Headphones,
  Languages,
  ListChecks,
  Minus,
  Play,
  Plus,
  Square,
  Type,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { unlockTtsAudioPlayback } from "@/lib/alternative-tts";
import { RTL } from "@/lib/subtitles";
import { normalizeLanguage } from "@/utils/onDemandTranslationManager";
import {
  getCachedWordTranslation,
  getWordTranslation,
  getWordTranslationCacheKey,
} from "@/utils/zeroKnowledgeWordManager";
import {
  extractListeningSentences,
  extractListeningWords,
  type ListeningGameSentenceItem,
  type ListeningGameWordItem,
  type SubtitleRowLike,
} from "@/utils/listeningGame";

export interface ListeningGamePanelProps {
  rows: SubtitleRowLike[];
  currentSentence?: string;
  targetTranslation?: string;
  baseLanguage: string;
  baseLanguageName: string;
  targetLanguage: string;
  targetLanguageName: string;
  onSpeakText?: (text: string, langCode: string) => void | Promise<void>;
  onStopSpeaking?: () => void;
  initialWithTranslations?: boolean;
  onWithTranslationsChange?: (withTranslations: boolean) => void;
  initialMinLetters?: number;
  initialMaxWords?: number;
  className?: string;
}

export const ListeningGamePanel: React.FC<ListeningGamePanelProps> = ({
  rows,
  currentSentence = "",
  targetTranslation = "",
  baseLanguage,
  baseLanguageName,
  targetLanguage,
  targetLanguageName,
  onSpeakText,
  onStopSpeaking,
  initialWithTranslations = true,
  onWithTranslationsChange,
  initialMinLetters = 4,
  initialMaxWords = 8,
  className = "",
}) => {
  const [withTranslations, setWithTranslations] = useState<boolean>(initialWithTranslations);
  const [minLetters, setMinLetters] = useState<number>(Math.max(1, initialMinLetters));
  const [maxWords, setMaxWords] = useState<number>(Math.max(1, initialMaxWords));
  const [activeListFilter, setActiveListFilter] = useState<"both" | "words" | "sentences">("both");
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [isPlayingAll, setIsPlayingAll] = useState<"words" | "sentences" | null>(null);
  const [playingProgress, setPlayingProgress] = useState<{
    list: "words" | "sentences";
    current: number;
    total: number;
  } | null>(null);
  const [wordTranslations, setWordTranslations] = useState<Record<string, string>>({});
  const [loadingWordKeys, setLoadingWordKeys] = useState<Record<string, boolean>>({});
  const playbackRunIdRef = useRef<number>(0);
  const autoAdjustedRef = useRef<boolean>(false);
  const onStopSpeakingRef = useRef(onStopSpeaking);
  onStopSpeakingRef.current = onStopSpeaking;
  const wordsListRef = useRef<HTMLDivElement | null>(null);
  const wordTranslationsRef = useRef<Record<string, string>>(wordTranslations);
  wordTranslationsRef.current = wordTranslations;
  const queuedKeysRef = useRef<Set<string>>(new Set());
  const translationQueueRef = useRef<
    Array<{ key: string; word: string; fromLang: string; toLang: string }>
  >([]);
  const activeWorkersRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);

  const isBaseRtl = RTL.has(baseLanguage);
  const isTargetRtl = RTL.has(targetLanguage);
  const hasDifferentTargetLang = Boolean(
    baseLanguage &&
    targetLanguage &&
    normalizeLanguage(baseLanguage) !== normalizeLanguage(targetLanguage),
  );

  const handleToggleWithTranslations = useCallback(
    (next: boolean) => {
      setWithTranslations(next);
      onWithTranslationsChange?.(next);
    },
    [onWithTranslationsChange],
  );

  const allAvailableWords = useMemo(
    () =>
      extractListeningWords(rows, {
        baseLanguage,
        targetLanguage,
        minLetters: 1,
        fallbackSentence: currentSentence,
        fallbackTranslation: targetTranslation,
      }),
    [rows, baseLanguage, targetLanguage, currentSentence, targetTranslation],
  );

  const allAvailableSentences = useMemo(
    () =>
      extractListeningSentences(rows, {
        baseLanguage,
        targetLanguage,
        maxWords: 100,
        fallbackSentence: currentSentence,
        fallbackTranslation: targetTranslation,
      }),
    [rows, baseLanguage, targetLanguage, currentSentence, targetTranslation],
  );

  const filteredWords = useMemo(
    () =>
      extractListeningWords(rows, {
        baseLanguage,
        targetLanguage,
        minLetters,
        fallbackSentence: currentSentence,
        fallbackTranslation: targetTranslation,
      }),
    [rows, baseLanguage, targetLanguage, minLetters, currentSentence, targetTranslation],
  );

  const filteredSentences = useMemo(
    () =>
      extractListeningSentences(rows, {
        baseLanguage,
        targetLanguage,
        maxWords,
        fallbackSentence: currentSentence,
        fallbackTranslation: targetTranslation,
      }),
    [rows, baseLanguage, targetLanguage, maxWords, currentSentence, targetTranslation],
  );

  // Prevent landing on an empty list when subtitles contain shorter words or longer sentences
  useEffect(() => {
    if (allAvailableWords.length === 0 && allAvailableSentences.length === 0) {
      autoAdjustedRef.current = false;
      return;
    }
    if (autoAdjustedRef.current) return;

    autoAdjustedRef.current = true;
    if (filteredWords.length === 0 && allAvailableWords.length > 0) {
      const bestThreshold = Math.max(
        1,
        Math.min(minLetters, Math.max(...allAvailableWords.map((w) => w.letterCount))),
      );
      if (bestThreshold !== minLetters) {
        setMinLetters(bestThreshold);
      }
    }
    if (filteredSentences.length === 0 && allAvailableSentences.length > 0) {
      const shortestSentenceWords = Math.min(...allAvailableSentences.map((s) => s.wordCount));
      const nextMaxWords = Math.max(maxWords, Math.min(40, shortestSentenceWords + 2));
      if (nextMaxWords !== maxWords) {
        setMaxWords(nextMaxWords);
      }
    }
  }, [
    allAvailableWords,
    allAvailableSentences,
    filteredWords.length,
    filteredSentences.length,
    minLetters,
    maxWords,
  ]);

  const stopSequentialPlayback = useCallback((notifyHost: boolean = true) => {
    playbackRunIdRef.current += 1;
    setIsPlayingAll(null);
    setPlayingProgress(null);
    setActiveItemId(null);
    if (notifyHost) {
      onStopSpeakingRef.current?.();
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    const queuedKeys = queuedKeysRef.current;
    return () => {
      isMountedRef.current = false;
      playbackRunIdRef.current += 1;
      translationQueueRef.current = [];
      queuedKeys.clear();
      onStopSpeakingRef.current?.();
    };
  }, []);

  const pumpTranslationQueue = useCallback(() => {
    const MAX_CONCURRENT = 2;
    while (activeWorkersRef.current < MAX_CONCURRENT && translationQueueRef.current.length > 0) {
      const next = translationQueueRef.current.shift();
      if (!next) break;
      const { key, word, fromLang, toLang } = next;
      const cached =
        wordTranslationsRef.current[key] || getCachedWordTranslation(word, fromLang, toLang);
      if (cached) {
        queuedKeysRef.current.delete(key);
        if (!wordTranslationsRef.current[key] && isMountedRef.current) {
          setWordTranslations((prev) => (prev[key] ? prev : { ...prev, [key]: cached }));
        }
        continue;
      }

      activeWorkersRef.current += 1;
      if (isMountedRef.current) {
        setLoadingWordKeys((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
      }
      void getWordTranslation(word, fromLang, toLang)
        .then((translated) => {
          if (translated && isMountedRef.current) {
            setWordTranslations((prev) =>
              prev[key] === translated ? prev : { ...prev, [key]: translated },
            );
          }
        })
        .finally(() => {
          queuedKeysRef.current.delete(key);
          activeWorkersRef.current = Math.max(0, activeWorkersRef.current - 1);
          if (isMountedRef.current) {
            setLoadingWordKeys((prev) => {
              if (!prev[key]) return prev;
              const nextMap = { ...prev };
              delete nextMap[key];
              return nextMap;
            });
            pumpTranslationQueue();
          }
        });
    }
  }, []);

  const enqueueWordTranslation = useCallback(
    (word: string) => {
      if (!hasDifferentTargetLang || !word.trim()) return;
      const key = getWordTranslationCacheKey(word, baseLanguage, targetLanguage);
      if (!key) return;
      const cached =
        wordTranslationsRef.current[key] ||
        getCachedWordTranslation(word, baseLanguage, targetLanguage);
      if (cached) {
        if (!wordTranslationsRef.current[key] && isMountedRef.current) {
          setWordTranslations((prev) => (prev[key] ? prev : { ...prev, [key]: cached }));
        }
        return;
      }
      if (queuedKeysRef.current.has(key)) return;
      queuedKeysRef.current.add(key);
      translationQueueRef.current.push({
        key,
        word,
        fromLang: baseLanguage,
        toLang: targetLanguage,
      });
      pumpTranslationQueue();
    },
    [baseLanguage, targetLanguage, hasDifferentTargetLang, pumpTranslationQueue],
  );

  const resolveWordTranslationNow = useCallback(
    async (word: string): Promise<string> => {
      if (!hasDifferentTargetLang || !word.trim()) return "";
      const key = getWordTranslationCacheKey(word, baseLanguage, targetLanguage);
      if (!key) return "";
      const existing =
        wordTranslationsRef.current[key] ||
        getCachedWordTranslation(word, baseLanguage, targetLanguage);
      if (existing) {
        if (!wordTranslationsRef.current[key] && isMountedRef.current) {
          setWordTranslations((prev) => (prev[key] ? prev : { ...prev, [key]: existing }));
        }
        return existing;
      }
      if (isMountedRef.current) {
        setLoadingWordKeys((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
      }
      try {
        const translated = await getWordTranslation(word, baseLanguage, targetLanguage);
        if (translated && isMountedRef.current) {
          setWordTranslations((prev) =>
            prev[key] === translated ? prev : { ...prev, [key]: translated },
          );
        }
        return translated;
      } finally {
        if (isMountedRef.current) {
          setLoadingWordKeys((prev) => {
            if (!prev[key]) return prev;
            const nextMap = { ...prev };
            delete nextMap[key];
            return nextMap;
          });
        }
      }
    },
    [baseLanguage, targetLanguage, hasDifferentTargetLang],
  );

  // Hydrate cached word translations synchronously and enqueue initial visible batch
  useEffect(() => {
    translationQueueRef.current = [];
    queuedKeysRef.current.clear();
    if (!hasDifferentTargetLang || filteredWords.length === 0) return;

    const hydrated: Record<string, string> = {};
    for (const item of filteredWords) {
      const key = getWordTranslationCacheKey(item.word, baseLanguage, targetLanguage);
      if (!key) continue;
      const cached = getCachedWordTranslation(item.word, baseLanguage, targetLanguage);
      if (cached) {
        hydrated[key] = cached;
      }
    }
    if (Object.keys(hydrated).length > 0) {
      setWordTranslations((prev) => ({ ...hydrated, ...prev }));
    }

    if (withTranslations) {
      for (const item of filteredWords.slice(0, 14)) {
        enqueueWordTranslation(item.word);
      }
    }
  }, [
    filteredWords,
    baseLanguage,
    targetLanguage,
    hasDifferentTargetLang,
    withTranslations,
    enqueueWordTranslation,
  ]);

  // Observe visible word cards as the user scrolls inside listening-words-list (e.g. down to item #73)
  useEffect(() => {
    const container = wordsListRef.current;
    if (
      !container ||
      !withTranslations ||
      !hasDifferentTargetLang ||
      filteredWords.length === 0 ||
      typeof IntersectionObserver === "undefined"
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const wordText = entry.target.getAttribute("data-word-item");
          if (wordText) {
            enqueueWordTranslation(wordText);
          }
          observer.unobserve(entry.target);
        }
      },
      {
        root: container,
        rootMargin: "160px 0px",
        threshold: 0.01,
      },
    );

    const children = container.querySelectorAll("[data-word-item]");
    children.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, [
    filteredWords,
    withTranslations,
    hasDifferentTargetLang,
    activeListFilter,
    enqueueWordTranslation,
  ]);

  const speakSingleEntry = useCallback(
    async (baseText: string, translationText: string, itemId: string, runId?: number) => {
      setActiveItemId(itemId);
      if (!onSpeakText) return;

      const trimmedBase = baseText.trim();
      const trimmedTrans = translationText.trim();

      if (trimmedBase) {
        try {
          await Promise.resolve(onSpeakText(trimmedBase, baseLanguage));
        } catch (err) {
          console.warn("ListeningGamePanel base speech error:", err);
        }
      }

      if (runId !== undefined && playbackRunIdRef.current !== runId) {
        return;
      }

      if (
        withTranslations &&
        trimmedTrans &&
        trimmedTrans.toLowerCase() !== trimmedBase.toLowerCase()
      ) {
        try {
          await Promise.resolve(onSpeakText(trimmedTrans, targetLanguage));
        } catch (err) {
          console.warn("ListeningGamePanel translation speech error:", err);
        }
      }
    },
    [onSpeakText, baseLanguage, targetLanguage, withTranslations],
  );

  const speakWordEntry = useCallback(
    async (item: ListeningGameWordItem, runId?: number) => {
      setActiveItemId(item.id);
      if (!onSpeakText) return;

      const trimmedBase = item.word.trim();
      const translationPromise =
        withTranslations && hasDifferentTargetLang
          ? resolveWordTranslationNow(trimmedBase)
          : Promise.resolve("");

      if (trimmedBase) {
        try {
          await Promise.resolve(onSpeakText(trimmedBase, baseLanguage));
        } catch (err) {
          console.warn("ListeningGamePanel word base speech error:", err);
        }
      }

      if (runId !== undefined && playbackRunIdRef.current !== runId) {
        return;
      }

      if (withTranslations) {
        const onDemandWordTrans = (await translationPromise).trim();
        if (runId !== undefined && playbackRunIdRef.current !== runId) {
          return;
        }
        const spokenTranslation = onDemandWordTrans || item.sourceTranslation.trim();
        if (spokenTranslation && spokenTranslation.toLowerCase() !== trimmedBase.toLowerCase()) {
          try {
            await Promise.resolve(onSpeakText(spokenTranslation, targetLanguage));
          } catch (err) {
            console.warn("ListeningGamePanel word translation speech error:", err);
          }
        }
      }
    },
    [
      onSpeakText,
      baseLanguage,
      targetLanguage,
      withTranslations,
      hasDifferentTargetLang,
      resolveWordTranslationNow,
    ],
  );

  const handlePlayWord = useCallback(
    async (item: ListeningGameWordItem) => {
      unlockTtsAudioPlayback();
      const wasAlreadySpeaking = isPlayingAll !== null || activeItemId !== null;
      stopSequentialPlayback(wasAlreadySpeaking);
      const runId = playbackRunIdRef.current;
      if (wasAlreadySpeaking) {
        await new Promise((resolve) => setTimeout(resolve, 80));
        if (playbackRunIdRef.current !== runId) return;
      }
      await speakWordEntry(item, runId);
      if (isMountedRef.current && playbackRunIdRef.current === runId) {
        setActiveItemId((prev) => (prev === item.id ? null : prev));
      }
    },
    [isPlayingAll, activeItemId, speakWordEntry, stopSequentialPlayback],
  );

  const handlePlaySentence = useCallback(
    async (item: ListeningGameSentenceItem) => {
      unlockTtsAudioPlayback();
      const wasAlreadySpeaking = isPlayingAll !== null || activeItemId !== null;
      stopSequentialPlayback(wasAlreadySpeaking);
      const runId = playbackRunIdRef.current;
      if (wasAlreadySpeaking) {
        await new Promise((resolve) => setTimeout(resolve, 80));
        if (playbackRunIdRef.current !== runId) return;
      }
      await speakSingleEntry(item.sentence, item.translation, item.id, runId);
      if (isMountedRef.current && playbackRunIdRef.current === runId) {
        setActiveItemId((prev) => (prev === item.id ? null : prev));
      }
    },
    [isPlayingAll, activeItemId, speakSingleEntry, stopSequentialPlayback],
  );

  const handlePlayAllWords = useCallback(async () => {
    if (isPlayingAll === "words") {
      stopSequentialPlayback(true);
      return;
    }
    if (filteredWords.length === 0) return;

    unlockTtsAudioPlayback();

    const wasAlreadySpeaking = isPlayingAll !== null || activeItemId !== null;
    if (wasAlreadySpeaking) {
      onStopSpeaking?.();
    }

    const runId = playbackRunIdRef.current + 1;
    playbackRunIdRef.current = runId;
    setIsPlayingAll("words");
    setPlayingProgress({ list: "words", current: 1, total: filteredWords.length });

    if (wasAlreadySpeaking) {
      await new Promise((resolve) => setTimeout(resolve, 60));
      if (playbackRunIdRef.current !== runId) return;
    }

    for (let idx = 0; idx < filteredWords.length; idx++) {
      if (playbackRunIdRef.current !== runId) break;
      const item = filteredWords[idx];
      if (withTranslations && filteredWords[idx + 1]) {
        enqueueWordTranslation(filteredWords[idx + 1].word);
      }
      setPlayingProgress({ list: "words", current: idx + 1, total: filteredWords.length });
      await speakWordEntry(item, runId);
      if (playbackRunIdRef.current !== runId) break;
      await new Promise((resolve) => setTimeout(resolve, withTranslations ? 550 : 350));
    }

    if (playbackRunIdRef.current === runId) {
      setIsPlayingAll(null);
      setPlayingProgress(null);
      setActiveItemId(null);
    }
  }, [
    filteredWords,
    isPlayingAll,
    activeItemId,
    onStopSpeaking,
    speakWordEntry,
    enqueueWordTranslation,
    stopSequentialPlayback,
    withTranslations,
  ]);

  const handlePlayAllSentences = useCallback(async () => {
    if (isPlayingAll === "sentences") {
      stopSequentialPlayback(true);
      return;
    }
    if (filteredSentences.length === 0) return;

    unlockTtsAudioPlayback();

    const wasAlreadySpeaking = isPlayingAll !== null || activeItemId !== null;
    if (wasAlreadySpeaking) {
      onStopSpeaking?.();
    }

    const runId = playbackRunIdRef.current + 1;
    playbackRunIdRef.current = runId;
    setIsPlayingAll("sentences");
    setPlayingProgress({ list: "sentences", current: 1, total: filteredSentences.length });

    if (wasAlreadySpeaking) {
      await new Promise((resolve) => setTimeout(resolve, 60));
      if (playbackRunIdRef.current !== runId) return;
    }

    for (let idx = 0; idx < filteredSentences.length; idx++) {
      if (playbackRunIdRef.current !== runId) break;
      const item = filteredSentences[idx];
      setPlayingProgress({ list: "sentences", current: idx + 1, total: filteredSentences.length });
      await speakSingleEntry(item.sentence, item.translation, item.id, runId);
      if (playbackRunIdRef.current !== runId) break;
      await new Promise((resolve) => setTimeout(resolve, withTranslations ? 650 : 400));
    }

    if (playbackRunIdRef.current === runId) {
      setIsPlayingAll(null);
      setPlayingProgress(null);
      setActiveItemId(null);
    }
  }, [
    filteredSentences,
    isPlayingAll,
    activeItemId,
    onStopSpeaking,
    speakSingleEntry,
    stopSequentialPlayback,
    withTranslations,
  ]);

  return (
    <div data-testid="listening-game-panel" className={`space-y-4 ${className}`}>
      {/* Top Controls: Translations Mode Toggle & List View Switch */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-xl border border-border/80 bg-muted/20">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <Headphones className="h-4 w-4 text-indigo-500" />
            <span>Listening Mode:</span>
          </span>

          <div
            data-testid="listening-game-translations-toggle"
            className="inline-flex items-center rounded-lg border border-border bg-card p-0.5 text-xs"
            role="group"
            aria-label="Listening translation mode"
          >
            <button
              type="button"
              data-testid="listening-with-translations-btn"
              aria-pressed={withTranslations}
              onClick={() => handleToggleWithTranslations(true)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                withTranslations
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Languages className="h-3.5 w-3.5" />
              <span>With Translations</span>
            </button>
            <button
              type="button"
              data-testid="listening-without-translations-btn"
              aria-pressed={!withTranslations}
              onClick={() => handleToggleWithTranslations(false)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                !withTranslations
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <VolumeX className="h-3.5 w-3.5" />
              <span>Without Translations</span>
            </button>
          </div>
        </div>

        <div className="inline-flex items-center rounded-lg border border-border bg-card p-0.5 text-[11px]">
          <button
            type="button"
            data-testid="listening-list-both-tab"
            onClick={() => setActiveListFilter("both")}
            className={`px-2 py-1 rounded font-semibold cursor-pointer ${
              activeListFilter === "both"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Both Lists
          </button>
          <button
            type="button"
            data-testid="listening-list-words-tab"
            onClick={() => setActiveListFilter("words")}
            className={`px-2 py-1 rounded font-semibold cursor-pointer ${
              activeListFilter === "words"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            1. Words ({filteredWords.length})
          </button>
          <button
            type="button"
            data-testid="listening-list-sentences-tab"
            onClick={() => setActiveListFilter("sentences")}
            className={`px-2 py-1 rounded font-semibold cursor-pointer ${
              activeListFilter === "sentences"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            2. Sentences ({filteredSentences.length})
          </button>
        </div>
      </div>

      {/* Mode Banner */}
      <div className="text-[11px] text-muted-foreground px-1 flex flex-wrap items-center justify-between gap-2">
        <span>
          {withTranslations
            ? `Playing ${baseLanguageName} followed by ${targetLanguageName} translations.`
            : `Audio-only immersion in ${baseLanguageName} (translations hidden and skipped).`}
        </span>
        {isPlayingAll && (
          <Button
            type="button"
            size="sm"
            variant="destructive"
            data-testid="listening-stop-all-btn"
            onClick={() => stopSequentialPlayback(true)}
            className="h-6 px-2 text-[11px] gap-1"
          >
            <Square className="h-3 w-3" />
            <span>
              Stop
              {playingProgress ? ` (${playingProgress.current}/${playingProgress.total})` : ""}
            </span>
          </Button>
        )}
      </div>

      {/* Dual / Single List Workspace */}
      <div
        className={`grid gap-4 ${
          activeListFilter === "both" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
        }`}
      >
        {/* 1. List of Subtitles' Words (Min Letters Filter) */}
        {(activeListFilter === "both" || activeListFilter === "words") && (
          <section
            data-testid="listening-words-section"
            className="rounded-xl border border-border bg-card/60 p-3.5 space-y-3 flex flex-col"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2.5">
              <div className="flex items-center gap-1.5">
                <Type className="h-4 w-4 text-sky-500" />
                <h3 className="text-xs font-bold uppercase tracking-wide text-foreground">
                  1. Subtitles&apos; Words
                </h3>
                <span
                  data-testid="listening-words-count"
                  className="rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-300 px-2 py-0.5 text-[10px] font-mono font-bold"
                >
                  {filteredWords.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <label
                  htmlFor="listening-min-letters-input"
                  className="text-[11px] font-medium text-muted-foreground"
                >
                  Min letters:
                </label>
                <div className="inline-flex items-center border border-border rounded-md bg-background">
                  <button
                    type="button"
                    data-testid="listening-min-letters-dec"
                    aria-label="Decrease minimum letters"
                    onClick={() => setMinLetters((n) => Math.max(1, n - 1))}
                    className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <input
                    id="listening-min-letters-input"
                    data-testid="listening-min-letters-input"
                    type="number"
                    min={1}
                    max={20}
                    value={minLetters}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!Number.isNaN(val)) {
                        setMinLetters(Math.max(1, Math.min(20, val)));
                      }
                    }}
                    className="w-10 text-center text-xs font-mono font-bold bg-transparent text-foreground focus:outline-hidden"
                  />
                  <button
                    type="button"
                    data-testid="listening-min-letters-inc"
                    aria-label="Increase minimum letters"
                    onClick={() => setMinLetters((n) => Math.min(20, n + 1))}
                    className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant={isPlayingAll === "words" ? "destructive" : "outline"}
                  data-testid="listening-play-all-words-btn"
                  disabled={filteredWords.length === 0}
                  onClick={() => void handlePlayAllWords()}
                  className="h-7 px-2 text-[11px] gap-1"
                >
                  {isPlayingAll === "words" ? (
                    <>
                      <Square className="h-3 w-3" />
                      <span>
                        Stop
                        {playingProgress?.list === "words"
                          ? ` (${playingProgress.current}/${playingProgress.total})`
                          : ""}
                      </span>
                    </>
                  ) : (
                    <>
                      <Play className="h-3 w-3" />
                      <span>Listen All</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div
              ref={wordsListRef}
              data-testid="listening-words-list"
              className="max-h-72 overflow-y-auto space-y-1.5 pr-1"
            >
              {filteredWords.length === 0 ? (
                <div
                  data-testid="listening-words-empty"
                  className="text-xs text-muted-foreground py-6 text-center space-y-2"
                >
                  <p className="italic">
                    No subtitle words found with at least {minLetters} letter
                    {minLetters === 1 ? "" : "s"}.
                  </p>
                  {allAvailableWords.length > 0 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      data-testid="listening-autofit-words-btn"
                      onClick={() => setMinLetters(1)}
                      className="h-7 text-[11px]"
                    >
                      Show all {allAvailableWords.length} available words (min 1 letter)
                    </Button>
                  )}
                </div>
              ) : (
                filteredWords.map((item, idx) => {
                  const isActive = activeItemId === item.id;
                  const cacheKey = getWordTranslationCacheKey(
                    item.word,
                    baseLanguage,
                    targetLanguage,
                  );
                  const onDemandWordTrans = cacheKey
                    ? wordTranslations[cacheKey] ||
                      getCachedWordTranslation(item.word, baseLanguage, targetLanguage) ||
                      ""
                    : "";
                  const isTranslatingWord = Boolean(
                    cacheKey && loadingWordKeys[cacheKey] && !onDemandWordTrans,
                  );
                  return (
                    <div
                      key={item.id}
                      data-testid={`listening-word-item-${idx}`}
                      data-word-item={item.word}
                      className={`flex items-center justify-between gap-2 rounded-lg border p-2 text-xs transition-colors ${
                        isActive
                          ? "border-indigo-500 bg-indigo-500/10"
                          : "border-border/60 bg-background/70 hover:bg-muted/40"
                      }`}
                    >
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            dir={isBaseRtl ? "rtl" : "ltr"}
                            className="font-bold text-sm text-foreground"
                          >
                            {item.word}
                          </span>
                          {withTranslations && onDemandWordTrans && (
                            <span
                              dir={isTargetRtl ? "rtl" : "ltr"}
                              data-testid={`listening-word-ondemand-translation-${idx}`}
                              className="text-xs font-semibold text-indigo-600 dark:text-indigo-300"
                              title={`On-demand word translation (${targetLanguageName})`}
                            >
                              → {onDemandWordTrans}
                            </span>
                          )}
                          {withTranslations && isTranslatingWord && (
                            <span
                              data-testid={`listening-word-translating-${idx}`}
                              className="text-[10px] italic text-indigo-500/80"
                            >
                              translating…
                            </span>
                          )}
                        </div>
                        {withTranslations && item.sourceTranslation && (
                          <p
                            dir={isTargetRtl ? "rtl" : "ltr"}
                            data-testid={`listening-word-translation-${idx}`}
                            className="text-[11px] text-muted-foreground truncate"
                            title={item.sourceTranslation}
                          >
                            {item.sourceTranslation}
                          </p>
                        )}
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        data-testid={`listening-play-word-${idx}`}
                        onClick={() => handlePlayWord(item)}
                        className="h-7 px-2 text-[11px] gap-1 shrink-0"
                        title={
                          withTranslations
                            ? "Listen to word + on-demand translation"
                            : "Listen to word only"
                        }
                      >
                        <Volume2 className="h-3.5 w-3.5 text-indigo-500" />
                        <span>Listen</span>
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        )}

        {/* 2. List of Subtitles' Punctuation Sentences (Max X Words Filter) */}
        {(activeListFilter === "both" || activeListFilter === "sentences") && (
          <section
            data-testid="listening-sentences-section"
            className="rounded-xl border border-border bg-card/60 p-3.5 space-y-3 flex flex-col"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2.5">
              <div className="flex items-center gap-1.5">
                <ListChecks className="h-4 w-4 text-emerald-500" />
                <h3 className="text-xs font-bold uppercase tracking-wide text-foreground">
                  2. Subtitles&apos; Sentences
                </h3>
                <span
                  data-testid="listening-sentences-count"
                  className="rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 px-2 py-0.5 text-[10px] font-mono font-bold"
                >
                  {filteredSentences.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <label
                  htmlFor="listening-max-words-input"
                  className="text-[11px] font-medium text-muted-foreground"
                >
                  Max words (X):
                </label>
                <div className="inline-flex items-center border border-border rounded-md bg-background">
                  <button
                    type="button"
                    data-testid="listening-max-words-dec"
                    aria-label="Decrease max words per sentence"
                    onClick={() => setMaxWords((n) => Math.max(1, n - 1))}
                    className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <input
                    id="listening-max-words-input"
                    data-testid="listening-max-words-input"
                    type="number"
                    min={1}
                    max={40}
                    value={maxWords}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!Number.isNaN(val)) {
                        setMaxWords(Math.max(1, Math.min(40, val)));
                      }
                    }}
                    className="w-10 text-center text-xs font-mono font-bold bg-transparent text-foreground focus:outline-hidden"
                  />
                  <button
                    type="button"
                    data-testid="listening-max-words-inc"
                    aria-label="Increase max words per sentence"
                    onClick={() => setMaxWords((n) => Math.min(40, n + 1))}
                    className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant={isPlayingAll === "sentences" ? "destructive" : "outline"}
                  data-testid="listening-play-all-sentences-btn"
                  disabled={filteredSentences.length === 0}
                  onClick={() => void handlePlayAllSentences()}
                  className="h-7 px-2 text-[11px] gap-1"
                >
                  {isPlayingAll === "sentences" ? (
                    <>
                      <Square className="h-3 w-3" />
                      <span>
                        Stop
                        {playingProgress?.list === "sentences"
                          ? ` (${playingProgress.current}/${playingProgress.total})`
                          : ""}
                      </span>
                    </>
                  ) : (
                    <>
                      <Play className="h-3 w-3" />
                      <span>Listen All</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div
              data-testid="listening-sentences-list"
              className="max-h-72 overflow-y-auto space-y-1.5 pr-1"
            >
              {filteredSentences.length === 0 ? (
                <div
                  data-testid="listening-sentences-empty"
                  className="text-xs text-muted-foreground py-6 text-center space-y-2"
                >
                  <p className="italic">
                    No punctuation sentences with up to {maxWords} word
                    {maxWords === 1 ? "" : "s"}.
                  </p>
                  {allAvailableSentences.length > 0 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      data-testid="listening-autofit-sentences-btn"
                      onClick={() =>
                        setMaxWords(
                          Math.min(40, Math.max(...allAvailableSentences.map((s) => s.wordCount))),
                        )
                      }
                      className="h-7 text-[11px]"
                    >
                      Expand limit to show all {allAvailableSentences.length} sentences
                    </Button>
                  )}
                </div>
              ) : (
                filteredSentences.map((item, idx) => {
                  const isActive = activeItemId === item.id;
                  return (
                    <div
                      key={item.id}
                      data-testid={`listening-sentence-item-${idx}`}
                      className={`flex items-start justify-between gap-2 rounded-lg border p-2.5 text-xs transition-colors ${
                        isActive
                          ? "border-indigo-500 bg-indigo-500/10"
                          : "border-border/60 bg-background/70 hover:bg-muted/40"
                      }`}
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-start gap-2">
                          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground shrink-0">
                            {item.wordCount}w
                          </span>
                          <p
                            dir={isBaseRtl ? "rtl" : "ltr"}
                            className="font-semibold text-foreground leading-snug"
                          >
                            {item.sentence}
                          </p>
                        </div>
                        {withTranslations && item.translation && (
                          <p
                            dir={isTargetRtl ? "rtl" : "ltr"}
                            data-testid={`listening-sentence-translation-${idx}`}
                            className="text-[11px] text-indigo-600 dark:text-indigo-300 pl-7"
                          >
                            {item.translation}
                          </p>
                        )}
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        data-testid={`listening-play-sentence-${idx}`}
                        onClick={() => handlePlaySentence(item)}
                        className="h-7 px-2 text-[11px] gap-1 shrink-0"
                        title={
                          withTranslations
                            ? "Listen to sentence + translation"
                            : "Listen to sentence only"
                        }
                      >
                        <Volume2 className="h-3.5 w-3.5 text-emerald-500" />
                        <span>Listen</span>
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
