import { createFileRoute } from "@tanstack/react-router";
import { memo, useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  Activity,
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2,
  Moon,
  RefreshCw,
  RotateCcw,
  SlidersHorizontal,
  Smartphone,
  Subtitles,
  Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  align,
  fmt,
  LANGS,
  RTL,
  STRATEGIES,
  PARSER_CRITERIA,
  PARSER_PRESETS,
  DEFAULT_CRITERIA_SETTINGS,
  type CriteriaGroupSettings,
  type CriteriaId,
  type Json3,
  type Row,
  type Strategy,
} from "@/lib/subtitles";
import {
  buildLangReplacedCaptionUrl,
  buildTranslatedCaptionUrl,
  decodeInterceptedCaption,
  nativeShell,
  parseJson3,
  parseVideoId,
  timedTextVideoId,
} from "@/lib/native-captions";
import {
  SUPPORTED_LANGUAGES_CATALOG,
  getUserLearningLanguages,
  setUserLearningLanguages,
  getAutoScrollSetting,
  setAutoScrollSetting,
  getDebugModeSetting,
  setDebugModeSetting,
  loadVideoSettings,
  saveVideoSettings,
  getAutoSpeakOnFetchSetting,
  setAutoSpeakOnFetchSetting,
} from "@/utils/appSettings";
import { LanguageBoxesSelector } from "@/components/LanguageBoxesSelector";
import {
  getAudioTrackMode,
  setAudioTrackMode,
  repeatSegmentWithAudioTrack,
} from "@/utils/audioTrackManager";
import { deduplicateVoices, getLanguageVoices, getUniqueVoiceKey } from "@/utils/speechVoiceUtils";
import {
  computeVideoInstances,
  multiVideoPlayerRegistry,
  executeMultiVideoSegmentSync,
  removeVideoInstanceConfig,
  type VideoInstanceConfig,
  type YTPlayerLike,
} from "@/utils/multiVideoPlayerManager";
import { VideoInstancesSwiper } from "@/components/VideoInstancesSwiper";
import { FloatingDraggablePauseButton } from "@/components/FloatingDraggablePauseButton";
import { trackNetworkRequest, useNetworkRequests } from "@/utils/networkTracker";
import { NetworkRequestsInspector } from "@/components/NetworkRequestsInspector";
import { AccordionSection } from "@/components/AccordionSection";
import { SubtitlesTablePanel } from "@/components/SubtitlesTablePanel";
import { HighlightedSubtitle } from "@/components/HighlightedSubtitle";
import { ApkReleasesFooter } from "@/components/ApkReleasesFooter";
import { ParserTimingLab } from "@/components/ParserTimingLab";
import { FloatingSubtitleRetryIndicator } from "@/components/FloatingSubtitleRetryIndicator";
import { subtitleRequestQueue } from "@/utils/subtitleRequestQueue";
import {
  getSectionOrder,
  getSubtitleRequestMode,
  getTtsRatiosPreference,
  isSubtitleInstanceEligibleForTTS,
  shouldHighlightSentenceForTTS,
  setSectionOrder as saveSectionOrder,
  setSubtitleRequestMode as saveSubtitleRequestMode,
  setTtsRatioPreference as saveTtsRatioPreference,
  subtitleRequestModeOrder,
  getAutoRetrySubtitles,
  setAutoRetrySubtitles as saveAutoRetrySubtitles,
  getRetryPacingMinSec,
  setRetryPacingMinSec as saveRetryPacingMinSec,
  getRetryPacingMaxSec,
  setRetryPacingMaxSec as saveRetryPacingMaxSec,
  getBackgroundAudioEnabled,
  setBackgroundAudioEnabled as saveBackgroundAudioEnabled,
  type SectionOrder,
  type SubtitleRequestMode,
} from "@/lib/playback-preferences";
import {
  initBackgroundMediaManager,
  syncMediaMetadata,
  setNativeBackgroundAudio,
} from "@/utils/backgroundMediaManager";
import { ApkReleaseModal } from "@/components/ApkReleaseModal";
import { SubtitleFetchToast } from "@/components/SubtitleFetchToast";
import { VideoLibraryPanel } from "@/components/VideoLibraryPanel";
import { AttemptOrderSettings } from "@/components/AttemptOrderSettings";
import {
  type FetchAttempt,
  type SendMode,
  type ExactFetchResult,
  getAttemptOrder,
  setAttemptOrder,
  getPromoteSuccessfulAttempt,
  setPromoteSuccessfulAttempt,
  getUseFetchServer,
  setUseFetchServer,
  getFetchServerUrl,
  setFetchServerUrl,
  fetchViaServer,
  promoteAttempt,
  runFetchAttempts,
  nativeExactFetch,
} from "@/lib/subtitle-fetch-plan";
import { recordVideoWatch } from "@/utils/videoLibraryManager";
import { notifySubtitleFetch } from "@/utils/subtitleNotificationManager";
import { getApkReleaseLinks } from "@/utils/apkUpdater";
import {
  isValidJsonSubtitleResponse,
  saveCachedRawJson3,
  getCachedRawJson3,
  removeCachedTargetSubtitles,
  clearVideoSubtitleCache,
} from "@/utils/subtitleCache";
import { recordWinnerPromotion } from "@/utils/winnerPromotionTracker";
import { STORAGE_KEYS, APP_VERSION, ALL_RELEASES_URL, DEFAULT_VIDEO_ID } from "@/config/appConfig";
import { JSON3_RAW_MAP } from "../../test/fixtures/L2Ryrr6txwA/jsonStrings";

const DEMO_VIDEO = "L2Ryrr6txwA";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Parallel Subtitles" },
      {
        name: "description",
        content:
          "Align json3 subtitles into parallel sentences and hear each language spoken between video sections.",
      },
      { property: "og:title", content: "Parallel Subtitles" },
      {
        property: "og:description",
        content:
          "Align json3 subtitles into parallel sentences and hear each language spoken between video sections.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

type YTPlayer = {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(s: number, a: boolean): void;
  getCurrentTime(): number;
  getPlayerState(): number;
  destroy?(): void;
  getAvailableAudioTracks?(): unknown[];
  setAudioTrack?(trackId: string): void;
  getAudioTrack?(): unknown;
};
declare global {
  interface Window {
    YT?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    onYouTubeIframeAPIReady?: () => void;
    onNativeCaptionsInterceptedBase64?: (payload: string) => void;
    onNativeSharedLinkReceived?: (url: string) => void;
    __pendingSharedLink?: string;
  }
}

type SpeechProgress = { lang: string; row: number; start: number; end: number } | null;
type Theme = "light" | "dark" | "dark-blue";
import { type PanelId, PANELS, ACCORDION_THEMES } from "@/config/accordionThemes";

function cancelSpeech() {
  if (typeof window !== "undefined") {
    (window as Window & { _activeUtterance?: SpeechSynthesisUtterance | null })._activeUtterance =
      null;
  }
  if (typeof window !== "undefined" && window.AndroidNativeShell?.stopSpeaking) {
    try {
      window.AndroidNativeShell.stopSpeaking();
    } catch (_e) {
      // Ignore Android TTS cancellation error
    }
  }
  if (
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    window.speechSynthesis?.cancel
  ) {
    try {
      window.speechSynthesis.cancel();
    } catch (_e) {
      // Ignore speech cancellation error
    }
  }
  try {
    multiVideoPlayerRegistry.pauseAllExcept("primary");
    multiVideoPlayerRegistry.unmuteOnly("primary");
  } catch {
    // Ignore multi-player cleanup error
  }
}

const getFixturesUrl = (video: string, lang: string) => {
  if (typeof window !== "undefined") {
    try {
      const base = document.baseURI || window.location.href;
      return new URL(`fixtures/${video}/${lang}.json`, base).href;
    } catch {
      // fallback
    }
  }
  return `./fixtures/${video}/${lang}.json`;
};

function speak(
  text: string,
  lang: string,
  rate: number,
  voiceURI: string,
  row: number,
  onProgress: (value: SpeechProgress) => void,
) {
  return new Promise<void>((res) => {
    if (!text) return res();

    const voices =
      typeof window !== "undefined" && "speechSynthesis" in window
        ? window.speechSynthesis.getVoices?.() || []
        : [];
    const chosenVoice =
      voiceURI && voices.length > 0
        ? voices.find((x) => x.voiceURI === voiceURI || x.name === voiceURI)
        : undefined;
    if (!chosenVoice && typeof window !== "undefined" && window.AndroidNativeShell?.speak) {
      try {
        const handled = window.AndroidNativeShell.speak(text, lang, rate, `row-${row}-${lang}`);
        if (handled) {
          onProgress({
            lang: lang.slice(0, 2),
            row,
            start: 0,
            end: text.length,
          });
          const estDurationMs = Math.max(800, (text.length / 10) * (1000 / (rate || 1)));
          setTimeout(() => {
            onProgress(null);
            res();
          }, estDurationMs);
          return;
        }
      } catch (e) {
        console.warn("Android native TTS bridge failed, falling back to Web Speech", e);
      }
    }

    if (
      typeof window === "undefined" ||
      !("speechSynthesis" in window) ||
      !window.speechSynthesis
    ) {
      return res();
    }

    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      u.rate = rate;
      const v =
        chosenVoice ??
        voices.find((x) => x.voiceURI === voiceURI || x.name === voiceURI) ??
        voices.find((x) => x.lang?.replace("_", "-").startsWith(lang.slice(0, 2)));
      if (v) u.voice = v;
      u.onboundary = (event) => {
        if (event.name !== "word") return;
        const remainder = text.slice(event.charIndex);
        const wordLength = event.charLength || remainder.match(/^\S+/)?.[0].length || 1;
        onProgress({
          lang: lang.slice(0, 2),
          row,
          start: event.charIndex,
          end: event.charIndex + wordLength,
        });
      };
      let resolved = false;
      const done = () => {
        if (resolved) return;
        resolved = true;
        if (typeof window !== "undefined") {
          (
            window as Window & { _activeUtterance?: SpeechSynthesisUtterance | null }
          )._activeUtterance = null;
        }
        onProgress(null);
        res();
      };
      u.onend = u.onerror = done;
      if (typeof window !== "undefined") {
        (
          window as Window & { _activeUtterance?: SpeechSynthesisUtterance | null }
        )._activeUtterance = u;
      }
      window.speechSynthesis.speak(u);
    } catch (e) {
      console.warn("Speech synthesis error:", e);
      onProgress(null);
      res();
    }
  });
}

function getLanguageMeta(code: string): { code: string; name: string; tts: string } {
  const fromLangs = LANGS.find((l) => l.code === code);
  if (fromLangs) return fromLangs;
  const fromCatalog = SUPPORTED_LANGUAGES_CATALOG.find((l) => l.code === code);
  if (fromCatalog) {
    const tts = code.includes("-") ? code : `${code}-${code.toUpperCase()}`;
    return { code, name: fromCatalog.name, tts };
  }
  return { code, name: code.toUpperCase(), tts: code };
}

function Index() {
  const [isAndroid, setIsAndroid] = useState(() => {
    if (typeof window === "undefined") return false;
    return (
      Boolean(nativeShell()) ||
      new URLSearchParams(window.location.search).get("android") === "true"
    );
  });
  const [videoId, setVideoId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const target =
        params.get("v") ||
        params.get("url") ||
        (window as Window & { __pendingSharedLink?: string }).__pendingSharedLink;
      if (target) {
        const id = parseVideoId(target);
        if (id) return id;
      }
      const isAndroidEnv = Boolean(nativeShell()) || params.get("android") === "true";
      if (isAndroidEnv) {
        return DEFAULT_VIDEO_ID;
      }
    }
    return DEMO_VIDEO;
  });
  const [videoInput, setVideoInput] = useState("");
  const [captionStatus, setCaptionStatus] = useState("");
  const [observedUrl, setObservedUrl] = useState("");
  const [defaultCaptionsLoaded, setDefaultCaptionsLoaded] = useState(false);
  const [tracks, setTracks] = useState<Record<string, Json3> | null>(null);
  const [isSubtitlesPending, startSubtitlesTransition] = useTransition();
  const [strategy, setStrategy] = useState<Strategy>("sentence");
  const [selectedCriteria, setSelectedCriteria] = useState<CriteriaId[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.PARSER_CRITERIA_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {
        // ignore storage error
      }
    }
    return ["sentence"];
  });

  const handleToggleCriterion = (id: CriteriaId) => {
    setSelectedCriteria((prev) => {
      let updated: CriteriaId[];
      if (prev.includes(id)) {
        if (prev.length <= 1) return prev;
        updated = prev.filter((c) => c !== id);
      } else {
        updated = [...prev, id];
      }
      try {
        localStorage.setItem(STORAGE_KEYS.PARSER_CRITERIA_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore storage error
      }
      return updated;
    });
  };

  const handleApplyPreset = (presetCriteria: CriteriaId[]) => {
    setSelectedCriteria(presetCriteria);
    try {
      localStorage.setItem(
        STORAGE_KEYS.PARSER_CRITERIA_STORAGE_KEY,
        JSON.stringify(presetCriteria),
      );
    } catch {
      // ignore storage error
    }
  };

  const [criteriaSettings, setCriteriaSettings] = useState<CriteriaGroupSettings>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.PARSER_SETTINGS_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === "object") {
            return {
              sentence: { ...DEFAULT_CRITERIA_SETTINGS.sentence, ...(parsed.sentence || {}) },
              pause: { ...DEFAULT_CRITERIA_SETTINGS.pause, ...(parsed.pause || {}) },
              punctVote: { ...DEFAULT_CRITERIA_SETTINGS.punctVote, ...(parsed.punctVote || {}) },
              consensus: { ...DEFAULT_CRITERIA_SETTINGS.consensus, ...(parsed.consensus || {}) },
              cue: { ...DEFAULT_CRITERIA_SETTINGS.cue, ...(parsed.cue || {}) },
              anchors: { ...DEFAULT_CRITERIA_SETTINGS.anchors, ...(parsed.anchors || {}) },
              window: { ...DEFAULT_CRITERIA_SETTINGS.window, ...(parsed.window || {}) },
            };
          }
        }
      } catch {
        // ignore storage error
      }
    }
    return DEFAULT_CRITERIA_SETTINGS;
  });

  const [expandedSettingsGroup, setExpandedSettingsGroup] = useState<CriteriaId | null>(null);

  const handleUpdateGroupSettings = <K extends keyof CriteriaGroupSettings>(
    group: K,
    patch: Partial<CriteriaGroupSettings[K]>,
  ) => {
    setCriteriaSettings((prev) => {
      const updated = {
        ...prev,
        [group]: {
          ...prev[group],
          ...patch,
        },
      };
      try {
        localStorage.setItem(STORAGE_KEYS.PARSER_SETTINGS_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore storage error
      }
      return updated;
    });
  };

  const handleResetGroupSettings = () => {
    setCriteriaSettings(DEFAULT_CRITERIA_SETTINGS);
    try {
      localStorage.setItem(
        STORAGE_KEYS.PARSER_SETTINGS_STORAGE_KEY,
        JSON.stringify(DEFAULT_CRITERIA_SETTINGS),
      );
    } catch {
      // ignore storage error
    }
  };
  const [shown, setShown] = useState<string[]>([]);
  const [spoken, setSpoken] = useState<string[]>([]);
  const [targetLanguages, setTargetLanguages] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const saved = getUserLearningLanguages();
      if (saved && saved.length > 0) return saved;
      const isAndroidEnv =
        Boolean(nativeShell()) ||
        new URLSearchParams(window.location.search).get("android") === "true";
      if (isAndroidEnv) return ["he", "it"];
    }
    return [];
  });
  const [autoSpeakOnFetch, setAutoSpeakOnFetch] = useState<boolean>(() =>
    getAutoSpeakOnFetchSetting(),
  );
  const [rates, setRates] = useState<Record<string, number>>(() =>
    Object.fromEntries(LANGS.map((lang) => [lang.code, 1])),
  );
  const [voiceSelections, setVoiceSelections] = useState<Record<string, string>>({});
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("yt_tts_voice_selections_v1") || "{}");
      if (saved && typeof saved === "object") setVoiceSelections(saved);
    } catch {
      // ignore storage errors
    }
  }, []);

  const baseLanguage = useMemo(() => {
    if (observedUrl) {
      try {
        const l = new URL(observedUrl).searchParams.get("lang");
        if (l) return l;
      } catch {
        // ignore malformed URL
      }
    }
    if (tracks && Object.keys(tracks).length > 0) {
      return Object.keys(tracks)[0];
    }
    return "";
  }, [observedUrl, tracks]);

  const tracksRef = useRef<Record<string, Json3> | null>(tracks);
  tracksRef.current = tracks;
  const observedUrlRef = useRef(observedUrl);
  observedUrlRef.current = observedUrl;
  // Single attempt per language per observed URL (no automatic retries, like Youtubenet6)
  const attemptedRef = useRef<Set<string>>(new Set());
  const [failedLangs, setFailedLangs] = useState<string[]>([]);
  const [requestMode, setRequestModeState] = useState<SubtitleRequestMode>("tlang");
  const [attemptOrder, setAttemptOrderState] = useState<FetchAttempt[]>(() => getAttemptOrder());
  const [promoteSuccess, setPromoteSuccessState] = useState<boolean>(() =>
    getPromoteSuccessfulAttempt(),
  );
  const [useFetchServer, setUseFetchServerState] = useState<boolean>(() => getUseFetchServer());
  const [fetchServerUrl, setFetchServerUrlState] = useState<string>(() => getFetchServerUrl());
  const [autoRetrySubtitles, setAutoRetrySubtitlesState] = useState<boolean>(() =>
    getAutoRetrySubtitles(),
  );
  const [retryPacingMinSec, setRetryPacingMinSecState] = useState<number>(() =>
    getRetryPacingMinSec(),
  );
  const [retryPacingMaxSec, setRetryPacingMaxSecState] = useState<number>(() =>
    getRetryPacingMaxSec(),
  );
  const [backgroundAudioEnabled, setBackgroundAudioEnabledState] = useState<boolean>(() =>
    getBackgroundAudioEnabled(),
  );

  useEffect(() => {
    // Load device-saved preferences after hydration
    setRequestModeState(getSubtitleRequestMode());
    setSectionOrderState(getSectionOrder());
    setAttemptOrderState(getAttemptOrder());
    setPromoteSuccessState(getPromoteSuccessfulAttempt());
    setUseFetchServerState(getUseFetchServer());
    setFetchServerUrlState(getFetchServerUrl());
    setAutoRetrySubtitlesState(getAutoRetrySubtitles());
    setRetryPacingMinSecState(getRetryPacingMinSec());
    setRetryPacingMaxSecState(getRetryPacingMaxSec());
    setBackgroundAudioEnabledState(getBackgroundAudioEnabled());
  }, []);
  const requestModeRef = useRef(requestMode);
  requestModeRef.current = requestMode;
  const attemptOrderRef = useRef(attemptOrder);
  attemptOrderRef.current = attemptOrder;
  const promoteSuccessRef = useRef(promoteSuccess);
  promoteSuccessRef.current = promoteSuccess;
  const useFetchServerRef = useRef(useFetchServer);
  useFetchServerRef.current = useFetchServer;
  const fetchServerUrlRef = useRef(fetchServerUrl);
  fetchServerUrlRef.current = fetchServerUrl;
  const targetLanguagesRef = useRef(targetLanguages);
  targetLanguagesRef.current = targetLanguages;

  const handleUpdateAttemptOrder = useCallback((next: FetchAttempt[]) => {
    setAttemptOrder(next);
    setAttemptOrderState(next);
  }, []);

  const handleTogglePromoteSuccess = useCallback((next: boolean) => {
    setPromoteSuccessfulAttempt(next);
    setPromoteSuccessState(next);
  }, []);

  const handleToggleUseFetchServer = useCallback((next: boolean) => {
    setUseFetchServer(next);
    setUseFetchServerState(next);
  }, []);

  const handleUpdateFetchServerUrl = useCallback((next: string) => {
    setFetchServerUrl(next);
    setFetchServerUrlState(next);
  }, []);

  const handleToggleAutoRetry = useCallback((next: boolean) => {
    saveAutoRetrySubtitles(next);
    setAutoRetrySubtitlesState(next);
    subtitleRequestQueue.setPaused(!next);
  }, []);

  const handleUpdatePacingMin = useCallback((next: number) => {
    const val = Math.max(1, next);
    saveRetryPacingMinSec(val);
    setRetryPacingMinSecState(val);
  }, []);

  const handleUpdatePacingMax = useCallback((next: number) => {
    const val = Math.max(1, next);
    saveRetryPacingMaxSec(val);
    setRetryPacingMaxSecState(val);
  }, []);

  const handleToggleBackgroundAudio = useCallback((enabled: boolean) => {
    setBackgroundAudioEnabledState(enabled);
    saveBackgroundAudioEnabled(enabled);
    setNativeBackgroundAudio(enabled);
  }, []);

  const [networkInspectorOpen, setNetworkInspectorOpen] = useState(false);
  const [apkModalOpen, setApkModalOpen] = useState(false);
  const networkRequests = useNetworkRequests();
  const apkReleaseLinks = useMemo(() => getApkReleaseLinks(), []);

  const fetchFavoriteLanguageSubtitles = useCallback(
    async (langsToFetch: string[], baseUrl?: string) => {
      const activeUrl = baseUrl || observedUrlRef.current;
      if (!isAndroid || !activeUrl) return;
      const shell = nativeShell();
      if (!shell) return;
      let defaultLang = "";
      try {
        defaultLang = new URL(activeUrl).searchParams.get("lang") || "";
      } catch (_e) {
        // ignore malformed URL
      }
      const needed = langsToFetch.filter(
        (code) =>
          code &&
          (!defaultLang || code !== defaultLang) &&
          !tracksRef.current?.[code] &&
          !attemptedRef.current.has(`${activeUrl}|${code}`),
      );
      if (needed.length === 0) return;

      // Sort needed strictly according to targetLanguages order
      const currentTargetOrder = targetLanguagesRef.current;
      needed.sort((a, b) => {
        const idxA = currentTargetOrder.indexOf(a);
        const idxB = currentTargetOrder.indexOf(b);
        return (idxA >= 0 ? idxA : 999) - (idxB >= 0 ? idxB : 999);
      });

      needed.forEach((code) => attemptedRef.current.add(`${activeUrl}|${code}`));
      setFailedLangs((prev) => prev.filter((c) => !needed.includes(c)));
      const failed: string[] = [];
      notifySubtitleFetch(
        "fetching",
        `Fetching live subtitles for added favorite language: ${needed.join(", ")}…`,
        needed[0],
      );
      const next: Record<string, Json3> = {};
      for (const code of needed) {
        let json: Json3 | null = null;
        if (videoId) {
          const cachedRaw = getCachedRawJson3(videoId, code);
          if (cachedRaw) {
            const parsed = parseJson3(cachedRaw);
            if (parsed) {
              json = parsed;
              next[code] = json;
              startSubtitlesTransition(() => {
                setTracks((prev) => ({ ...prev, [code]: json! }));
                setShown((prev) => (prev.includes(code) ? prev : [...prev, code]));
              });
              subtitleRequestQueue.markSucceeded(videoId, code);
              continue;
            }
          }
        }
        await subtitleRequestQueue.enqueue({
          videoId: videoId || "current",
          lang: code,
          execute: async () => {
            try {
              const currentOrder = attemptOrderRef.current;
              const promote = promoteSuccessRef.current;

              // Reference primary mode order for backward compatibility & preference alignment
              const _modeOrder = subtitleRequestModeOrder(requestModeRef.current);

              const result = runFetchAttempts({
                observedUrl: activeUrl,
                lang: code,
                order: currentOrder,
                send: (url, withSession): ExactFetchResult => {
                  const mode = url.includes("tlang=") ? "tlang" : "lang";
                  const sendMode: SendMode = withSession ? "session" : "anon";
                  const tracker = trackNetworkRequest(url, "GET", "native_bridge", {
                    attemptMode: mode,
                    attemptSend: sendMode,
                  });
                  const r: ExactFetchResult = shell.fetchTimedTextExact
                    ? nativeExactFetch(shell, url, withSession)
                    : {
                        status: 200,
                        body: shell.fetchTranslatedCaptionsWithUrl(url, code, "json3"),
                        sentUrl: url,
                        send: sendMode,
                      };
                  const isGood = r.status === 200 && isValidJsonSubtitleResponse(r.body);
                  if (isGood) {
                    tracker.complete(r.status, r.body);
                  } else {
                    tracker.fail(
                      r.error || (r.status ? `HTTP ${r.status}` : "Fetch failed"),
                      r.status,
                      r.body,
                    );
                  }
                  return r;
                },
                isGood: (body) => isValidJsonSubtitleResponse(body),
              });

              if (result) {
                if (promote) {
                  const promoted = promoteAttempt(currentOrder, result.winner);
                  setAttemptOrder(promoted);
                  setAttemptOrderState(promoted);
                }
                json = parseJson3(result.body);
                if (json) {
                  if (videoId) {
                    saveCachedRawJson3(videoId, code, result.body);
                  }
                  recordWinnerPromotion({
                    videoId: videoId || "unknown",
                    lang: code,
                    mode: result.winner.mode,
                    send: result.winner.send,
                    cuesCount: json?.events?.length,
                  });
                  next[code] = json;
                  startSubtitlesTransition(() => {
                    setTracks((prev) => ({ ...prev, [code]: json! }));
                    setShown((prev) => (prev.includes(code) ? prev : [...prev, code]));
                  });
                  return true;
                }
              } else if (useFetchServerRef.current && fetchServerUrlRef.current) {
                // Server proxy fallback repetition if enabled
                const fallbackUrl = buildTranslatedCaptionUrl(activeUrl, code, "json3");
                const serverTracker = trackNetworkRequest(fallbackUrl, "GET", "server_proxy", {
                  attemptMode: "tlang",
                  attemptSend: "anon",
                });
                const serverRes = await fetchViaServer(fetchServerUrlRef.current, fallbackUrl);
                if (serverRes.status === 200 && isValidJsonSubtitleResponse(serverRes.body)) {
                  serverTracker.complete(serverRes.status, serverRes.body);
                  json = parseJson3(serverRes.body);
                  if (json) {
                    if (videoId) {
                      saveCachedRawJson3(videoId, code, serverRes.body);
                    }
                    recordWinnerPromotion({
                      videoId: videoId || "unknown",
                      lang: code,
                      mode: "tlang",
                      send: "anon",
                      cuesCount: json?.events?.length,
                    });
                    next[code] = json;
                    startSubtitlesTransition(() => {
                      setTracks((prev) => ({ ...prev, [code]: json! }));
                      setShown((prev) => (prev.includes(code) ? prev : [...prev, code]));
                    });
                    return true;
                  }
                } else {
                  serverTracker.fail(
                    serverRes.error || `HTTP ${serverRes.status}`,
                    serverRes.status,
                    serverRes.body,
                  );
                }
              }
              return false;
            } catch (_err) {
              return false;
            }
          },
        });
        if (!json) {
          failed.push(code);
        }
      }
      if (failed.length > 0) {
        setFailedLangs((prev) => Array.from(new Set([...prev, ...failed])));
        notifySubtitleFetch(
          "error",
          `Subtitles fetch failed for ${failed.join(", ")}. Tap "Fetch again".`,
          failed[0],
        );
      }
      if (Object.keys(next).length > 0) {
        startSubtitlesTransition(() => {
          setCaptionStatus(`${Object.keys(next).length} live language tracks loaded.`);
        });
        notifySubtitleFetch(
          "completed",
          `Subtitles successfully loaded for ${Object.keys(next).join(", ")}!`,
          Object.keys(next)[0],
        );
        if (autoSpeakOnFetch) {
          // Auto-enable "Speak" checkbox for the fetched languages
          setSpoken((prev) => Array.from(new Set([...prev, ...Object.keys(next)])));
        }
      }
    },
    [isAndroid, autoSpeakOnFetch, videoId],
  );

  const handleFloatingFetchSingleLanguage = useCallback(
    async (code: string) => {
      const activeUrl = observedUrlRef.current;
      if (activeUrl) {
        attemptedRef.current.delete(`${activeUrl}|${code}`);
      }
      setFailedLangs((prev) => prev.filter((c) => c !== code));
      await fetchFavoriteLanguageSubtitles([code]);
    },
    [fetchFavoriteLanguageSubtitles],
  );

  const manualFetchFailed = () => {
    const url = observedUrlRef.current;
    const currentTargetOrder = targetLanguagesRef.current;
    // Determine the exact list of languages to be fetched next, strictly in the order of targetLanguages
    const toFetch = currentTargetOrder.filter(
      (code) =>
        (!tracksRef.current?.[code] || failedLangs.includes(code)) &&
        (!baseLanguage || code !== baseLanguage),
    );
    const finalLangs = toFetch.length > 0 ? toFetch : failedLangs;
    finalLangs.forEach((code) => attemptedRef.current.delete(`${url}|${code}`));
    void fetchFavoriteLanguageSubtitles(finalLangs, url);
  };

  const handleFetchAgain = useCallback(
    async (url: string, withSession: boolean, viaServer: boolean = false) => {
      const shell = nativeShell();
      const shouldUseServer = viaServer || useFetchServerRef.current;
      if (!shell && !shouldUseServer) return;
      let targetLang = "";
      try {
        const u = new URL(url, "https://www.youtube.com");
        targetLang = u.searchParams.get("tlang") || u.searchParams.get("lang") || "";
      } catch {
        const m = /[?&](?:tlang|lang)=([^&#]+)/.exec(url);
        if (m) targetLang = decodeURIComponent(m[1]);
      }
      const mode = url.includes("tlang=") ? "tlang" : "lang";

      let r: ExactFetchResult;
      if (shouldUseServer && fetchServerUrlRef.current) {
        const tracker = trackNetworkRequest(url, "GET", "server_proxy", {
          attemptMode: mode,
          attemptSend: "anon",
        });
        r = await fetchViaServer(fetchServerUrlRef.current, url);
        if (r.status === 200 && isValidJsonSubtitleResponse(r.body)) {
          tracker.complete(r.status, r.body);
        } else {
          tracker.fail(
            r.error || (r.status ? `HTTP ${r.status}` : "Server fetch failed"),
            r.status,
            r.body,
          );
        }
      } else {
        const send: SendMode = withSession ? "session" : "anon";
        const tracker = trackNetworkRequest(url, "GET", "native_bridge", {
          attemptMode: mode,
          attemptSend: send,
        });
        r = shell?.fetchTimedTextExact
          ? nativeExactFetch(shell, url, withSession)
          : {
              status: 200,
              body: shell ? shell.fetchTranslatedCaptionsWithUrl(url, targetLang, "json3") : "",
              sentUrl: url,
              send,
            };
        if (r.status === 200 && isValidJsonSubtitleResponse(r.body)) {
          tracker.complete(r.status, r.body);
        } else {
          tracker.fail(
            r.error || (r.status ? `HTTP ${r.status}` : "Fetch failed"),
            r.status,
            r.body,
          );
        }
      }

      if (r.status === 200 && isValidJsonSubtitleResponse(r.body)) {
        if (targetLang) {
          const parsed = parseJson3(r.body);
          if (parsed) {
            if (videoId) saveCachedRawJson3(videoId, targetLang, r.body);
            setTracks((prev) => ({ ...prev, [targetLang]: parsed }));
            setShown((prev) => (prev.includes(targetLang) ? prev : [...prev, targetLang]));
            notifySubtitleFetch(
              "completed",
              `Fetched live subtitles for ${targetLang}`,
              targetLang,
            );
          }
        }
      } else {
        notifySubtitleFetch("error", `Fetch failed (${r.status || "network error"})`, targetLang);
      }
    },
    [videoId],
  );

  const handleFetchAgainViaServer = useCallback(
    (url: string) => {
      void handleFetchAgain(url, false, true);
    },
    [handleFetchAgain],
  );

  const handleUseTheseSubtitles = useCallback(
    (url: string, rawBody: string) => {
      if (!isValidJsonSubtitleResponse(rawBody)) return;
      let target = "";
      try {
        const u = new URL(url, "https://www.youtube.com");
        target = u.searchParams.get("tlang") || u.searchParams.get("lang") || "";
      } catch {
        const m = /[?&](?:tlang|lang)=([^&#]+)/.exec(url);
        if (m) target = decodeURIComponent(m[1]);
      }
      if (!target) return;
      const json = parseJson3(rawBody);
      if (json) {
        if (videoId) saveCachedRawJson3(videoId, target, rawBody);
        setTracks((prev) => ({ ...prev, [target]: json }));
        setShown((prev) => (prev.includes(target) ? prev : [...prev, target]));
        notifySubtitleFetch("completed", `Applied and cached subtitles for ${target}`, target);
      }
    },
    [videoId],
  );

  const handleTargetLanguagesChange = (newTargetLangs: string[]) => {
    const removedLangs = targetLanguages.filter((l) => !newTargetLangs.includes(l));
    const newlyAdded = newTargetLangs.filter((lang) => !targetLanguages.includes(lang));

    // 1. Immediately prune failedLangs to only those still present in newTargetLangs
    setFailedLangs((prev) => prev.filter((lang) => newTargetLangs.includes(lang)));

    // 2. When favorite languages are removed, remove all related instances:
    // - columns shown
    // - speech synthesis spoken list
    // - parsed subtitle tracks
    // - queue & attempted cache
    // - player instance configs & active player registry
    // - cached subtitle state
    if (removedLangs.length > 0) {
      setShown((prev) => prev.filter((code) => !removedLangs.includes(code)));
      setSpoken((prev) => prev.filter((code) => !removedLangs.includes(code)));
      setTracks((prev) => {
        if (!prev) return prev;
        const next = { ...prev };
        removedLangs.forEach((code) => {
          delete next[code];
        });
        return next;
      });

      const currentUrl = observedUrlRef.current;
      removedLangs.forEach((prevLang) => {
        subtitleRequestQueue.removeLanguage(prevLang);
        if (currentUrl) {
          attemptedRef.current.delete(`${currentUrl}|${prevLang}`);
        }
        if (videoId) {
          removeCachedTargetSubtitles(videoId, prevLang);
          removeVideoInstanceConfig(videoId, `lang_${prevLang}`);
        }
        multiVideoPlayerRegistry.unregister(`lang_${prevLang}`);
      });
    }

    setTargetLanguages(newTargetLangs);
    setUserLearningLanguages(newTargetLangs);
    if (newlyAdded.length > 0) {
      setShown((prev) => Array.from(new Set([...prev, ...newlyAdded])));
      if (isAndroid) {
        setCaptionStatus(
          `Fetching live subtitles for added favorite language: ${newlyAdded.join(", ")}…`,
        );
        void fetchFavoriteLanguageSubtitles(newlyAdded);
      } else {
        // Web demo: auto enable "Speak" checkbox upon selection if autoSpeakOnFetch is true
        if (autoSpeakOnFetch) {
          setSpoken((prev) => Array.from(new Set([...prev, ...newlyAdded])));
        }
      }
    }
  };
  const [languageOrder, setLanguageOrder] = useState(() => LANGS.map((lang) => lang.code));
  const [ttsRatios, setTtsRatios] = useState<Record<string, number>>(() => {
    const saved = getTtsRatiosPreference();
    const defaults = Object.fromEntries(LANGS.map((lang) => [lang.code, 1]));
    return { ...defaults, ...saved };
  });

  useEffect(() => {
    if (!videoId) return;
    const settings = loadVideoSettings(videoId);
    if (settings?.ttsRatios) {
      setTtsRatios((curr) => ({
        ...curr,
        ...settings.ttsRatios,
      }));
    }
  }, [videoId]);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [theme, setTheme] = useState<Theme>("light");
  const themeWasSelectedRef = useRef(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [pauseMode, setPauseMode] = useState(true);
  const [sectionOrder, setSectionOrderState] = useState<SectionOrder>("video-first");
  const [audioTrackMode, setAudioTrackModeState] = useState(() =>
    typeof window !== "undefined" ? getAudioTrackMode() : false,
  );
  const [activeSwiperIndex, setActiveSwiperIndex] = useState(0);
  const secondaryPlayerHosts = useRef<Map<string, HTMLDivElement>>(new Map());
  const secondaryPlayers = useRef<Map<string, YTPlayerLike>>(new Map());

  const videoInstances = useMemo(() => {
    if (!audioTrackMode) {
      return computeVideoInstances([], LANGS, videoId);
    }
    return computeVideoInstances(spoken, LANGS, videoId);
  }, [audioTrackMode, spoken, videoId]);

  const onAudioTrackModeChange = (enabled: boolean) => {
    setAudioTrackModeState(enabled);
    setAudioTrackMode(enabled);
  };
  const [autoFocus, setAutoFocusState] = useState(() =>
    typeof window !== "undefined" ? getAutoScrollSetting() : false,
  );
  const onAutoFocusChange = (enabled: boolean) => {
    setAutoFocusState(enabled);
    setAutoScrollSetting(enabled);
  };
  const [debugMode, setDebugModeState] = useState(() =>
    typeof window !== "undefined" ? getDebugModeSetting() : false,
  );
  const onDebugModeChange = (enabled: boolean) => {
    setDebugModeState(enabled);
    setDebugModeSetting(enabled);
    if (!enabled) {
      setNetworkInspectorOpen(false);
    }
  };
  const [isSetupPaused, setIsSetupPaused] = useState(false);
  const toggleSetupPause = useCallback(() => {
    setIsSetupPaused((prev) => {
      const next = !prev;
      if (next) {
        try {
          multiVideoPlayerRegistry.pauseAllExcept();
          player.current?.pauseVideo?.();
        } catch {
          // ignore
        }
        cancelSpeech();
        busy.current = false;
      }
      return next;
    });
  }, []);
  const [showVideoSubtitles, setShowVideoSubtitles] = useState(true);
  const [panelOrder, setPanelOrder] = useState<PanelId[]>(() => PANELS.map((panel) => panel.id));
  const [openPanels, setOpenPanels] = useState<Record<PanelId, boolean>>({
    player: true,
    playback: false,
    parser: false,
    languages: false,
    subtitles: true,
    library: false,
  });

  const handleSelectLibraryVideo = (newId: string, customUrl?: string) => {
    if (!newId || newId === videoId) return;
    cancelSpeech();
    setTracks(null);
    setObservedUrl("");
    setDefaultCaptionsLoaded(false);
    setActive(-1);
    setSpeakingLang(null);
    setSpeakingRow(-1);
    setSpeechProgress(null);
    setPlayedRecordsCount(0);
    playedTtsRecords.current.clear();
    setVideoId(newId);
    setVideoInput(newId);
    if (typeof window !== "undefined") {
      const currentSearch = new URLSearchParams(window.location.search);
      if (currentSearch.get("v") !== newId) {
        currentSearch.set("v", newId);
        window.history.pushState(
          { videoId: newId },
          "",
          `${window.location.pathname}?${currentSearch.toString()}${window.location.hash}`,
        );
      }
    }
  };

  useEffect(() => {
    if (videoId) {
      subtitleRequestQueue.setVideoContext(videoId);
      recordVideoWatch({
        id: videoId,
        originalUrl: `https://www.youtube.com/watch?v=${videoId}`,
      });

      // Cache hydration: Load any previously cached raw JSON3 subtitle tracks for targetLanguages
      const activeLangs = targetLanguagesRef.current;
      const hydratedTracks: Record<string, Json3> = {};
      activeLangs.forEach((lang) => {
        const cachedRaw = getCachedRawJson3(videoId, lang);
        if (cachedRaw) {
          const parsed = parseJson3(cachedRaw);
          if (parsed) {
            hydratedTracks[lang] = parsed;
            subtitleRequestQueue.markSucceeded(videoId, lang);
          }
        }
      });
      if (Object.keys(hydratedTracks).length > 0) {
        startSubtitlesTransition(() => {
          setTracks((prev) => ({ ...(prev || {}), ...hydratedTracks }));
          setShown((prev) => Array.from(new Set([...prev, ...Object.keys(hydratedTracks)])));
        });
      }
    }
  }, [videoId]);

  useEffect(() => {
    if (tracks && videoId) {
      Object.entries(tracks).forEach(([code, track]) => {
        if (track?.events && track.events.length > 0) {
          subtitleRequestQueue.markSucceeded(videoId, code);
        }
      });
    }
  }, [tracks, videoId]);
  const [active, setActive] = useState(-1);
  const [speakingLang, setSpeakingLang] = useState<string | null>(null);
  const [speakingRow, setSpeakingRow] = useState(-1);
  const [speechProgress, setSpeechProgress] = useState<SpeechProgress>(null);
  const [subtitlesLimit, setSubtitlesLimit] = useState<number>(() => (isAndroid ? 10 : 0));
  const [subtitlesPage, setSubtitlesPage] = useState<number>(1);

  useEffect(() => {
    const openLink = (link: string) => {
      const id = parseVideoId(link);
      if (id) {
        console.log("[SHARED_LINK_DISPATCH]", id, link);
        // Persist immediately to video library so shared video is remembered
        recordVideoWatch({
          id,
          originalUrl: link.startsWith("http") ? link : `https://www.youtube.com/watch?v=${id}`,
        });
        setVideoId((prevId) => {
          if (id !== prevId) {
            setTracks(null);
            setObservedUrl("");
            setDefaultCaptionsLoaded(false);
            setActive(-1);
            setSpeakingLang(null);
            setSpeakingRow(-1);
            setSpeechProgress(null);
            cancelSpeech();
            setSubtitlesPage(1);
            if (typeof window !== "undefined") {
              const currentSearch = new URLSearchParams(window.location.search);
              if (currentSearch.get("v") !== id) {
                currentSearch.set("v", id);
                window.history.pushState(
                  { videoId: id },
                  "",
                  `${window.location.pathname}?${currentSearch.toString()}${window.location.hash}`,
                );
              }
            }
          }
          return id;
        });
        setVideoInput(link);
      }
    };
    window.onNativeSharedLinkReceived = openLink;
    if (window.__pendingSharedLink) {
      openLink(window.__pendingSharedLink);
      delete window.__pendingSharedLink;
    }
    const params = new URLSearchParams(window.location.search);
    const query = params.get("v") || params.get("url");
    if (query) openLink(query);

    const shell = nativeShell();
    if (shell) {
      setIsAndroid(true);
      setSubtitlesLimit(10);
      setSubtitlesPage(1);
    }

    return () => {
      delete window.onNativeSharedLinkReceived;
    };
  }, []);

  // Handle Android Native Shell and browser history back navigation
  useEffect(() => {
    // 1. Android hardware back button / gesture handler exposed on window
    (window as Window & { __handleAndroidBack?: () => boolean }).__handleAndroidBack = () => {
      if (networkInspectorOpen) {
        setNetworkInspectorOpen(false);
        return true;
      }
      if (apkModalOpen) {
        setApkModalOpen(false);
        return true;
      }
      return false;
    };

    // 2. Browser history popstate handler (back/forward navigation)
    const handlePopState = (event: PopStateEvent) => {
      if (networkInspectorOpen) {
        setNetworkInspectorOpen(false);
        return;
      }
      if (apkModalOpen) {
        setApkModalOpen(false);
        return;
      }

      const currentParams = new URLSearchParams(window.location.search);
      const urlVideo = currentParams.get("v") || currentParams.get("url");
      const targetId =
        (urlVideo && parseVideoId(urlVideo)) || (event.state?.videoId as string | undefined);
      if (targetId) {
        setVideoId((prevId) => {
          if (targetId !== prevId) {
            setTracks(null);
            setObservedUrl("");
            setDefaultCaptionsLoaded(false);
            setActive(-1);
            setSpeakingLang(null);
            setSpeakingRow(-1);
            setSpeechProgress(null);
            cancelSpeech();
            setSubtitlesPage(1);
            return targetId;
          }
          return prevId;
        });
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      delete (window as Window & { __handleAndroidBack?: () => boolean }).__handleAndroidBack;
      window.removeEventListener("popstate", handlePopState);
    };
  }, [networkInspectorOpen, apkModalOpen]);

  useEffect(() => {
    if (!isAndroid) return;
    setTracks(null);
    setObservedUrl("");
    setDefaultCaptionsLoaded(false);
    setActive(-1);
    setSpeakingLang(null);
    setSpeakingRow(-1);
    setSpeechProgress(null);
    cancelSpeech();
    setSubtitlesPage(1);
    setCaptionStatus(
      "Waiting for YouTube captions. Play the video and enable captions if necessary.",
    );
    const shell = nativeShell();
    const captured = shell?.getLastObservedTimedTextUrl();
    if (captured && (!videoId || timedTextVideoId(captured) === videoId)) {
      setObservedUrl(captured);
      setDefaultCaptionsLoaded(true);
      const defaultLang = new URL(captured).searchParams.get("lang") || "";
      if (defaultLang) {
        try {
          const raw = shell!.fetchTranslatedCaptionsWithUrl(captured, defaultLang, "json3");
          if (raw && isValidJsonSubtitleResponse(raw)) {
            const json = parseJson3(raw);
            if (json) {
              if (videoId) {
                saveCachedRawJson3(videoId, defaultLang, raw);
              }
              setTracks((prev) => ({ ...prev, [defaultLang]: json }));
              setShown((prev) => (prev.includes(defaultLang) ? prev : [defaultLang, ...prev]));
            }
          }
        } catch (_e) {
          // ignore native bridge fetch error
        }
      }
    }
    window.onNativeCaptionsInterceptedBase64 = (encoded) => {
      const payload = decodeInterceptedCaption(encoded);
      if (!payload) return;
      const urlVideoId = timedTextVideoId(payload.url);
      if (urlVideoId && urlVideoId !== videoId) return;

      // Discard invalid, non-JSON3, error pages, or empty subtitle payloads
      if (!isValidJsonSubtitleResponse(payload.rawData)) {
        console.warn("[Interception] Discarded non-JSON3 / bad response payload:", payload.url);
        return;
      }

      const tracker = trackNetworkRequest(payload.url, "GET", "timedtext_interception");
      tracker.complete(200, payload.rawData);
      let requestUrl: URL | null = null;
      try {
        requestUrl = new URL(payload.url);
      } catch (_e) {
        // ignore malformed URL
      }
      const targetLanguage = requestUrl?.searchParams.get("tlang") || null;
      const lang = targetLanguage ?? requestUrl?.searchParams.get("lang") ?? null;
      const json = parseJson3(payload.rawData);
      if (!json) return;
      if (!targetLanguage) {
        setObservedUrl(payload.url);
        setDefaultCaptionsLoaded(true);
      }
      if (lang) {
        if (videoId) {
          saveCachedRawJson3(videoId, lang, payload.rawData);
        }
        startSubtitlesTransition(() => {
          setTracks((prev) => ({ ...prev, [lang]: json }));
          setShown((prev) => (prev.includes(lang) ? prev : [...prev, lang]));
        });
        if (autoSpeakOnFetch) {
          // Auto-enable "Speak" checkbox for the fetched language
          setSpoken((prev) => (prev.includes(lang) ? prev : [...prev, lang]));
        }
      }
    };
    return () => {
      delete window.onNativeCaptionsInterceptedBase64;
    };
  }, [isAndroid, videoId, autoSpeakOnFetch]);

  useEffect(() => {
    if (!isAndroid || !observedUrl || !defaultCaptionsLoaded) return;
    let defaultLang = "";
    try {
      defaultLang = new URL(observedUrl).searchParams.get("lang") || "";
    } catch (_e) {
      // ignore malformed URL
    }
    const selected = [...new Set(targetLanguages.filter((code) => Boolean(code)))];
    if (selected.length > 0) {
      setCaptionStatus("Fetching live subtitles for favorite languages…");
      void fetchFavoriteLanguageSubtitles(selected, observedUrl);
    }
  }, [
    isAndroid,
    observedUrl,
    defaultCaptionsLoaded,
    targetLanguages,
    fetchFavoriteLanguageSubtitles,
  ]);

  // Keep shown columns synchronized with favorite languages (no fetching here)
  useEffect(() => {
    const missingInShown = targetLanguages.filter((l) => !shown.includes(l));
    if (missingInShown.length > 0) {
      setShown((prev) => Array.from(new Set([...prev, ...missingInShown])));
    }
  }, [targetLanguages, shown]);

  useEffect(() => {
    if (themeWasSelectedRef.current) return;
    const saved = window.localStorage.getItem("parallel-subtitles-theme");
    if (saved === "light" || saved === "dark" || saved === "dark-blue") setTheme(saved);
  }, []);

  useEffect(() => {
    document.documentElement.classList.remove("dark", "dark-blue");
    if (theme !== "light") document.documentElement.classList.add(theme);
    window.localStorage.setItem("parallel-subtitles-theme", theme);
  }, [theme]);

  useEffect(() => {
    setIsHydrated(true);
    // Sync client-persisted preferences post-hydration to eliminate SSR mismatches
    const isAndroidEnvironment =
      Boolean(nativeShell()) ||
      new URLSearchParams(window.location.search).get("android") === "true";
    if (isAndroidEnvironment) {
      setIsAndroid(true);
      setSubtitlesLimit(10);
      setSubtitlesPage(1);
    }
    const savedLangs = getUserLearningLanguages();
    if (savedLangs && savedLangs.length > 0) {
      setTargetLanguages(savedLangs);
      setShown((prev) => Array.from(new Set([...prev, ...savedLangs])));
    }
    setAudioTrackModeState(getAudioTrackMode());
    setAutoFocusState(getAutoScrollSetting());
    setDebugModeState(getDebugModeSetting());

    // Prevent background pause on visibility changes
    try {
      if (typeof document !== "undefined") {
        Object.defineProperty(document, "hidden", {
          get: () => false,
          configurable: true,
        });
        Object.defineProperty(document, "visibilityState", {
          get: () => "visible",
          configurable: true,
        });
        window.addEventListener("visibilitychange", (e) => e.stopImmediatePropagation(), true);
      }
    } catch (_e) {
      // Ignore in restricted environments
    }
  }, []);

  useEffect(() => {
    const cleanupMedia = initBackgroundMediaManager({
      onPlay: () => {
        try {
          player.current?.playVideo?.();
        } catch (_err) {
          // ignore playback error
        }
      },
      onPause: () => {
        try {
          player.current?.pauseVideo?.();
        } catch (_err) {
          // ignore pause error
        }
      },
      onSeek: (seconds: number) => {
        try {
          player.current?.seekTo?.(seconds, true);
        } catch (_err) {
          // ignore seek error
        }
      },
      onStop: () => {
        try {
          player.current?.stopVideo?.();
        } catch (_err) {
          // ignore stop error
        }
      },
      onNextSection: () => {
        try {
          const p = player.current;
          if (!p?.getCurrentTime) return;
          const currentMs = p.getCurrentTime() * 1000;
          const currentRows = st.current.rows;
          const nextCue = currentRows.find((r) => r.start > currentMs + 500);
          if (nextCue) {
            p.seekTo?.(nextCue.start / 1000, true);
          }
        } catch (_err) {
          // ignore section jump error
        }
      },
      onPrevSection: () => {
        try {
          const p = player.current;
          if (!p?.getCurrentTime) return;
          const currentMs = p.getCurrentTime() * 1000;
          const currentRows = st.current.rows;
          const prevCues = currentRows.filter((r) => r.start < currentMs - 1500);
          const prevCue = prevCues[prevCues.length - 1];
          if (prevCue) {
            p.seekTo?.(prevCue.start / 1000, true);
          } else {
            p.seekTo?.(0, true);
          }
        } catch (_err) {
          // ignore section jump error
        }
      },
    });
    return cleanupMedia;
  }, []);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("speechSynthesis" in window) ||
      !window.speechSynthesis
    ) {
      return;
    }
    const refreshVoices = () => {
      try {
        setVoices(deduplicateVoices(window.speechSynthesis.getVoices() || []));
      } catch (_e) {
        // Ignore getVoices errors
      }
    };
    refreshVoices();
    try {
      window.speechSynthesis.addEventListener("voiceschanged", refreshVoices);
      return () => {
        try {
          window.speechSynthesis.removeEventListener("voiceschanged", refreshVoices);
        } catch (_e) {
          // Ignore removeEventListener errors
        }
      };
    } catch (_e) {
      // Ignore addEventListener errors
    }
  }, []);

  useEffect(() => {
    // Fixtures exist only for the demo video and only in the web demo. Never load them
    // on Android (the bridge may be detected after first render) or for any other video.
    if (isAndroid || nativeShell() || videoId !== DEMO_VIDEO) return;
    let cancelled = false;
    Promise.all(
      LANGS.map(async (l) => {
        const fixtureUrl = getFixturesUrl(DEMO_VIDEO, l.code);
        const tracker = trackNetworkRequest(fixtureUrl, "GET", "fetch");
        try {
          const response = await fetch(fixtureUrl);
          let text = "";
          let valid = response.ok;
          if (valid) {
            text = await response.text();
            if (text.trim().startsWith("<")) {
              valid = false;
            }
          }
          let j = valid ? parseJson3(text) : null;
          if (!j) {
            // Resilient fallback to authentic bundled fixture
            const bundled = JSON3_RAW_MAP[l.code] || "";
            if (bundled) {
              j = parseJson3(bundled);
              text = bundled;
            }
          }
          tracker.complete(200, text);
          return j ? ([l.code, j] as const) : null;
        } catch {
          const bundled = JSON3_RAW_MAP[l.code] || "";
          const j = bundled ? parseJson3(bundled) : null;
          tracker.complete(200, bundled);
          return j ? ([l.code, j] as const) : null;
        }
      }),
    ).then((entries) => {
      if (cancelled || nativeShell()) return;
      const validEntries = entries.filter(
        (entry): entry is readonly [string, Json3] => entry !== null,
      );
      const newTracks = Object.fromEntries(validEntries);
      startSubtitlesTransition(() => {
        setTracks(newTracks);
        // Automatically show loaded demo tracks
        setShown((prev) => (prev.length === 0 ? Object.keys(newTracks) : prev));
      });
    });
    return () => {
      cancelled = true;
    };
  }, [isAndroid, videoId]);

  const rows = useMemo<Row[]>(
    () =>
      tracks && baseLanguage ? align(tracks, baseLanguage, selectedCriteria, criteriaSettings) : [],
    [tracks, baseLanguage, selectedCriteria, criteriaSettings],
  );

  const activeCatalog = useMemo(() => {
    if (!isAndroid) return LANGS;
    const activeCodes = new Set([
      ...targetLanguages,
      ...shown,
      ...spoken,
      baseLanguage,
      ...(tracks ? Object.keys(tracks) : []),
    ]);
    return Array.from(activeCodes).map(getLanguageMeta);
  }, [isAndroid, targetLanguages, shown, spoken, baseLanguage, tracks]);

  useEffect(() => {
    setLanguageOrder((prev) => {
      const targetSet = new Set(targetLanguages);
      const remaining = prev.filter((c) => !targetSet.has(c));
      return [...targetLanguages, ...remaining];
    });
  }, [targetLanguages]);

  // Main screen presents favorite languages and intercepted tracks for show/hide, speech toggles, ordering, and per-language TTS controls
  const orderedLangs = useMemo(() => {
    let list: Array<{ code: string; name: string; tts: string }>;
    if (!isAndroid) {
      list = languageOrder
        .filter((code) => LANGS.some((l) => l.code === code))
        .map((code) => getLanguageMeta(code));
    } else {
      const favoriteSet = new Set(targetLanguages);
      const combinedSet = new Set([
        ...favoriteSet,
        ...(baseLanguage ? [baseLanguage] : []),
        ...(tracks ? Object.keys(tracks) : []),
      ]);
      list = languageOrder
        .filter((code) => combinedSet.has(code))
        .map((code) => getLanguageMeta(code));
    }
    // Keep clicked / selected favorite languages strictly on top
    const selected = list.filter((l) => targetLanguages.includes(l.code));
    const unselected = list.filter((l) => !targetLanguages.includes(l.code));
    return [...selected, ...unselected];
  }, [isAndroid, languageOrder, targetLanguages, baseLanguage, tracks]);
  const st = useRef({
    rows,
    spoken,
    rates,
    ttsRatios,
    voiceSelections,
    pauseMode,
    orderedLangs,
    audioTrackMode,
    sectionOrder,
    isSetupPaused,
    baseLanguage,
  });
  st.current = {
    rows,
    spoken,
    rates,
    ttsRatios,
    voiceSelections,
    pauseMode,
    orderedLangs,
    audioTrackMode,
    sectionOrder,
    isSetupPaused,
    baseLanguage,
  };

  const playerEl = useRef<HTMLDivElement>(null);
  const player = useRef<YTPlayer | null>(null);
  const busy = useRef(false);
  const lastRow = useRef(-1);
  const handledRow = useRef(-1);
  const lastMs = useRef(0);
  const playedTtsRecords = useRef<Set<number>>(new Set());
  const [playedRecordsCount, setPlayedRecordsCount] = useState(0);

  useEffect(() => {
    playedTtsRecords.current.clear();
    handledRow.current = -1;
    setPlayedRecordsCount(0);
  }, [videoId, rows]);

  useEffect(() => {
    const init = () => {
      if (!playerEl.current) return;
      // Fresh host node per init so the YouTube API (which replaces its node) never touches the ref
      playerEl.current.innerHTML = "";
      const host = document.createElement("div");
      host.className = "h-full w-full";
      playerEl.current.appendChild(host);
      if (!window.YT) return;
      player.current = new window.YT.Player(host, {
        videoId,
        playerVars: {
          rel: 0,
          autoplay: isAndroid ? 1 : 0,
          cc_load_policy: isAndroid ? 1 : 0,
          playsinline: 1,
        },
        events: {
          onReady: () => {
            if (player.current) {
              multiVideoPlayerRegistry.register("primary", player.current);
            }
          },
        },
      });
      if (player.current) {
        multiVideoPlayerRegistry.register("primary", player.current);
      }
    };
    if (window.YT?.Player) init();
    else {
      window.onYouTubeIframeAPIReady = init;
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(s);
    }
    const iv = setInterval(async () => {
      const p = player.current;
      if (!p?.getCurrentTime || busy.current || st.current.isSetupPaused) return;
      const ms = p.getCurrentTime() * 1000;
      // Detect user manually seeking or scrubbing across playback timeline
      if (Math.abs(ms - lastMs.current) > 2500 || ms < lastMs.current - 1000) {
        handledRow.current = -1;
      }
      lastMs.current = ms;

      // Sync background media metadata & playback progress
      try {
        const title =
          (p.getVideoData && p.getVideoData()?.title) ||
          (videoId ? `YouTube (${videoId})` : "YouTube Video");
        const isPlaying = p.getPlayerState ? p.getPlayerState() === 1 : true;
        const curSec = ms / 1000;
        const durSec = p.getDuration ? p.getDuration() : 0;
        syncMediaMetadata({
          title,
          artist:
            targetLanguagesRef.current && targetLanguagesRef.current.length > 0
              ? `Subtitles: ${targetLanguagesRef.current.join(", ")}`
              : "Parallel Subtitles",
          isPlaying,
          positionSec: curSec,
          durationSec: durSec,
        });
      } catch (_err) {
        // ignore media sync error
      }

      const {
        rows,
        spoken,
        rates,
        ttsRatios: currentTtsRatios,
        voiceSelections,
        pauseMode,
        orderedLangs,
        audioTrackMode: isAudioTrackMode,
        baseLanguage: currentBaseLanguage,
      } = st.current;
      const idx = rows.findIndex((r) => ms >= r.start && ms < r.end);
      setActive(idx);
      const prev = lastRow.current;
      lastRow.current = idx;

      const getEligibleLangs = (rowIdx: number) => {
        if (rowIdx < 0 || playedTtsRecords.current.has(rowIdx)) return [];
        const matched = orderedLangs.filter(
          (l) =>
            spoken.includes(l.code) &&
            isSubtitleInstanceEligibleForTTS(
              rowIdx,
              currentTtsRatios?.[l.code] ?? 1,
              playedTtsRecords.current,
            ),
        );
        // When audioTrackMode is enabled with no spoken languages selected,
        // fallback to base / primary language so the original video repeats the section with native audio
        if (matched.length === 0 && isAudioTrackMode && spoken.length === 0) {
          const fallbackLang = orderedLangs.find((l) => l.code === currentBaseLanguage) ||
            orderedLangs[0] || { code: "primary", tts: "en-US", name: "Primary" };
          return [fallbackLang];
        }
        return matched;
      };

      const speakRow = async (rowIdx: number) => {
        if (rowIdx < 0 || playedTtsRecords.current.has(rowIdx)) return;
        const langs = getEligibleLangs(rowIdx);
        if (langs.length === 0) return;
        // Strictly skip this subtitles record from being TTS-played more than once
        playedTtsRecords.current.add(rowIdx);
        setPlayedRecordsCount(playedTtsRecords.current.size);
        for (const l of langs) {
          if (!busy.current) break;
          setSpeakingLang(l.code);
          setSpeakingRow(rowIdx);
          if (isAudioTrackMode) {
            await executeMultiVideoSegmentSync({
              registry: multiVideoPlayerRegistry,
              primaryPlayer: p,
              languageCode: l.code,
              startMs: rows[rowIdx]?.start ?? 0,
              endMs: rows[rowIdx]?.end ?? 0,
              checkCancelled: () => !busy.current,
              onProgress: (prog) => {
                setSpeechProgress({
                  row: rowIdx,
                  lang: l.code,
                  start: 0,
                  end: Math.round(prog.percent ?? 0),
                });
              },
            });
          } else {
            await speak(
              rows[rowIdx]?.texts[l.code] ?? "",
              l.tts,
              rates[l.code] ?? 1,
              voiceSelections[l.code] ?? "",
              rowIdx,
              setSpeechProgress,
            );
          }
        }
        if (isAudioTrackMode) {
          multiVideoPlayerRegistry.pauseAllExcept("primary");
          multiVideoPlayerRegistry.unmuteOnly("primary");
        }
        setSpeakingLang(null);
        setSpeakingRow(-1);
        setSpeechProgress(null);
      };
      const isPlaying = p.getPlayerState() === 1;
      if (pauseMode && st.current.sectionOrder === "tts-first") {
        // Speech first: on entering a section, pause, speak it, then play that section's video.
        if (
          idx >= 0 &&
          isPlaying &&
          !playedTtsRecords.current.has(idx) &&
          handledRow.current !== idx
        ) {
          handledRow.current = idx;
          const eligibleLangs = getEligibleLangs(idx);
          if (eligibleLangs.length > 0) {
            busy.current = true;
            p.pauseVideo();
            await speakRow(idx);
            const wasCancelled = !busy.current;
            busy.current = false;
            handledRow.current = idx;
            if (wasCancelled) return;
            const targetSec = (rows[idx]?.start ?? 0) / 1000;
            lastMs.current = targetSec * 1000;
            multiVideoPlayerRegistry.unmuteOnly("primary");
            p.seekTo(targetSec, true);
            p.playVideo();
          }
        }
        return;
      }
      // Video first: crossed the end of a section while playing → pause and speak it.
      if (pauseMode && isPlaying) {
        const candidateRow =
          prev >= 0 && (idx !== prev || ms >= (rows[prev]?.end ?? Infinity) - 80) ? prev : -1;
        if (
          candidateRow >= 0 &&
          !playedTtsRecords.current.has(candidateRow) &&
          handledRow.current !== candidateRow
        ) {
          handledRow.current = candidateRow;
          const eligibleLangs = getEligibleLangs(candidateRow);
          if (eligibleLangs.length > 0) {
            busy.current = true;
            p.pauseVideo();
            await speakRow(candidateRow);
            busy.current = false;
            handledRow.current = candidateRow;
            const nextRowIdx = candidateRow + 1;
            if (nextRowIdx < rows.length && rows[nextRowIdx]) {
              const nextRow = rows[nextRowIdx];
              const resumeTarget = nextRow.start / 1000;
              lastMs.current = resumeTarget * 1000;
              lastRow.current = nextRowIdx;
              multiVideoPlayerRegistry.unmuteOnly("primary");
              p.seekTo(resumeTarget, true);
              p.playVideo();
            } else {
              multiVideoPlayerRegistry.unmuteOnly("primary");
              p.pauseVideo();
            }
          }
        }
      }
    }, 150);
    return () => {
      clearInterval(iv);
      cancelSpeech();
      multiVideoPlayerRegistry.unregister("primary");
      player.current?.destroy?.();
      player.current = null;
    };
  }, [videoId, isAndroid]);

  // Mount and manage dedicated video player instances for each language with speak/audio enabled
  useEffect(() => {
    if (!audioTrackMode) return;
    for (const inst of videoInstances) {
      if (inst.isPrimary) continue;
      const host = secondaryPlayerHosts.current.get(inst.id);
      if (host && !secondaryPlayers.current.has(inst.id)) {
        host.innerHTML = "";
        const child = document.createElement("div");
        child.className = "h-full w-full";
        host.appendChild(child);
        let secPlayer: YTPlayerLike | null = null;
        if (window.YT?.Player) {
          secPlayer = new window.YT.Player(child, {
            videoId,
            playerVars: {
              rel: 0,
              autoplay: 0,
              cc_load_policy: 0,
              playsinline: 1,
            },
            events: {
              onReady: () => {
                try {
                  secPlayer?.mute?.();
                } catch {
                  // ignore
                }
              },
            },
          });
        }
        if (secPlayer) {
          secondaryPlayers.current.set(inst.id, secPlayer);
          multiVideoPlayerRegistry.register(inst.id, secPlayer);
        }
      }
    }
  }, [audioTrackMode, videoInstances, videoId]);

  // Keep swiper active index synced to active speaking language when repeating with audio track
  useEffect(() => {
    if (!audioTrackMode) return;
    if (speakingLang) {
      const idx = videoInstances.findIndex((inst) => inst.languageCode === speakingLang);
      if (idx >= 0) setActiveSwiperIndex(idx);
    } else {
      setActiveSwiperIndex(0);
    }
  }, [speakingLang, audioTrackMode, videoInstances]);

  useEffect(() => {
    if (!autoFocus || isSetupPaused) return;
    document
      .querySelector(`[data-row="${active}"]`)
      ?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [active, autoFocus, isSetupPaused]);

  const seek = (r: Row, i: number) => {
    cancelSpeech();
    busy.current = false;
    lastRow.current = i;
    handledRow.current = -1;
    playedTtsRecords.current.delete(i);
    lastMs.current = r.start;
    player.current?.seekTo(r.start / 1000, true);
    player.current?.playVideo();
  };

  const toggle = (list: string[], set: (v: string[]) => void, c: string) =>
    set(list.includes(c) ? list.filter((x) => x !== c) : [...list, c]);

  const moveLanguage = (code: string, direction: -1 | 1) => {
    setLanguageOrder((current) => {
      const index = current.indexOf(code);
      const next = index + direction;
      if (index < 0 || next < 0 || next >= current.length) return current;
      const copy = [...current];
      [copy[index], copy[next]] = [copy[next]!, copy[index]!];
      return copy;
    });

    setTargetLanguages((current) => {
      if (!current.includes(code)) return current;
      const index = current.indexOf(code);
      const next = index + direction;
      if (index < 0 || next < 0 || next >= current.length) return current;
      const copy = [...current];
      [copy[index], copy[next]] = [copy[next]!, copy[index]!];
      setUserLearningLanguages(copy);
      return copy;
    });
  };

  const movePanel = (id: PanelId, direction: -1 | 1) => {
    setPanelOrder((current) => {
      const index = current.indexOf(id);
      const next = index + direction;
      if (index < 0 || next < 0 || next >= current.length) return current;
      const copy = [...current];
      const adjacent = copy[next];
      if (!adjacent) return current;
      copy[index] = adjacent;
      copy[next] = id;
      return copy;
    });
  };

  const cols = useMemo(() => {
    if (!tracks || Object.keys(tracks).length === 0) {
      return [];
    }
    const list: { code: string; name: string; tts: string }[] = [];
    const addedCodes = new Set<string>();

    const hasTrackCues = (t: Json3 | undefined): boolean => {
      if (!t) return false;
      if (typeof t.length === "number" && t.length > 0) return true;
      if (Array.isArray(t.events) && t.events.length > 0) return true;
      if (Array.isArray(t) && (t as unknown[]).length > 0) return true;
      return false;
    };

    // 1. If baseLanguage from video captions exists in tracks and is shown, display it first
    // Spec: verify base track cues (tracks[baseLanguage].length > 0 || hasTrackCues)
    if (
      baseLanguage &&
      tracks?.[baseLanguage] &&
      hasTrackCues(tracks[baseLanguage]) &&
      shown.includes(baseLanguage)
    ) {
      list.push(getLanguageMeta(baseLanguage));
      addedCodes.add(baseLanguage);
    }

    // 2. Add all ordered languages that have valid tracks, and are shown
    // Spec: verify ordered track cues (tracks[l.code].length > 0 || hasTrackCues)
    for (const l of orderedLangs) {
      if (
        !addedCodes.has(l.code) &&
        shown.includes(l.code) &&
        (targetLanguages.includes(l.code) || (tracks ? Boolean(tracks[l.code]) : true)) &&
        Boolean(tracks?.[l.code] && hasTrackCues(tracks[l.code]))
      ) {
        list.push(l);
        addedCodes.add(l.code);
      }
    }

    // 3. Fallback: add any remaining tracks present in shown
    // Spec: verify fallback track cues (tracks[code]?.length > 0 || hasTrackCues)
    if (tracks) {
      for (const code of Object.keys(tracks)) {
        if (!addedCodes.has(code) && shown.includes(code) && hasTrackCues(tracks[code])) {
          list.push(getLanguageMeta(code));
          addedCodes.add(code);
        }
      }
    }

    // 4. Ultimate fallback: if no columns matched shown filter yet tracks exist with cues, include them
    if (list.length === 0 && tracks) {
      for (const code of Object.keys(tracks)) {
        if (!addedCodes.has(code) && hasTrackCues(tracks[code])) {
          list.push(getLanguageMeta(code));
          addedCodes.add(code);
        }
      }
    }

    return list;
  }, [tracks, baseLanguage, orderedLangs, shown, targetLanguages]);

  const hasLegitimateSubtitles = useMemo(() => {
    if (!tracks) return false;
    const hasValidTrack = Object.values(tracks).some((track) => {
      const cues = Array.isArray(track) ? track : track?.events || [];
      const isValid =
        (Array.isArray(cues) && cues.length > 0) ||
        (Array.isArray(track?.events) && track.events.length > 0);
      return isValid;
    });
    return Boolean(hasValidTrack && rows.length > 0 && cols.length > 0);
  }, [tracks, rows.length, cols.length]);

  useEffect(() => {
    if (hasLegitimateSubtitles) {
      setOpenPanels((current) => (current.subtitles ? current : { ...current, subtitles: true }));
    }
  }, [hasLegitimateSubtitles]);

  const missingFavoriteLanguages = useMemo(() => {
    return targetLanguages.filter((code) => !tracks?.[code]);
  }, [targetLanguages, tracks]);

  const allFavoritesAligned = useMemo(() => {
    return targetLanguages.length > 0 && missingFavoriteLanguages.length === 0;
  }, [targetLanguages, missingFavoriteLanguages]);

  const languagesToFetchNext = useMemo(() => {
    return targetLanguages.filter(
      (code) =>
        (!tracks?.[code] || failedLangs.includes(code)) && (!baseLanguage || code !== baseLanguage),
    );
  }, [targetLanguages, tracks, failedLangs, baseLanguage]);

  const activeFailedToFetch = useMemo(() => {
    return targetLanguages.filter((code) => failedLangs.includes(code));
  }, [targetLanguages, failedLangs]);

  const displayedRows = useMemo(() => {
    if (isAndroid && subtitlesLimit > 0) {
      const start = (subtitlesPage - 1) * subtitlesLimit;
      return rows.slice(start, start + subtitlesLimit);
    }
    return rows;
  }, [rows, isAndroid, subtitlesLimit, subtitlesPage]);

  useEffect(() => {
    if (isAndroid && autoFocus && !isSetupPaused && active >= 0 && subtitlesLimit > 0) {
      const targetPage = Math.floor(active / subtitlesLimit) + 1;
      if (targetPage !== subtitlesPage) {
        setSubtitlesPage(targetPage);
      }
    }
  }, [active, autoFocus, isSetupPaused, isAndroid, subtitlesLimit, subtitlesPage]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header
        className="flex flex-wrap items-center gap-4 border-b border-border px-6 py-4"
        data-app-hydrated={isHydrated ? "true" : undefined}
      >
        <div className="mr-auto flex items-baseline gap-3 flex-wrap">
          <h1 className="font-display text-2xl">Parallel Subtitles</h1>
          <a
            href={ALL_RELEASES_URL}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="header-app-version-badge"
            className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-mono font-medium text-primary hover:bg-primary/20 transition-colors"
            title="Browse All GitHub Releases & Versions"
          >
            v{APP_VERSION}
            <ExternalLink className="h-2.5 w-2.5 opacity-70" />
          </a>
          <span className="text-sm text-muted-foreground">
            video {videoId} · {rows.length} sections ·{" "}
            {isAndroid ? "live Android captions" : "fixture demo"}
          </span>
        </div>
        <div
          className="flex items-center gap-1 rounded-md border border-border bg-card p-1"
          aria-label="Color theme"
        >
          {(["light", "dark", "dark-blue"] as const).map((option) => (
            <Button
              key={option}
              type="button"
              size="sm"
              variant={theme === option ? "default" : "ghost"}
              onClick={() => {
                themeWasSelectedRef.current = true;
                setTheme(option);
              }}
              aria-pressed={theme === option}
              title={`${option === "dark-blue" ? "Dark blue" : option === "light" ? "Light" : "Dark"} theme`}
              className="gap-1.5 capitalize"
            >
              {option === "light" ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
              {option === "dark-blue" ? "Blue" : option}
            </Button>
          ))}
        </div>
        {debugMode && (
          <Button
            id="open-network-inspector-button"
            data-testid="open-network-inspector-button"
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setNetworkInspectorOpen(true)}
            className="gap-1.5"
            title="Inspect live network requests and response body preview"
          >
            <Activity className="h-4 w-4 text-blue-500" />
            <span className="hidden sm:inline">Network</span>
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-mono font-bold">
              {networkRequests.length}
            </span>
          </Button>
        )}
        <Button
          id="caption-toggle-button"
          data-testid="caption-toggle-button"
          type="button"
          size="sm"
          variant={showVideoSubtitles ? "default" : "outline"}
          aria-pressed={showVideoSubtitles}
          onClick={() => setShowVideoSubtitles((prev) => !prev)}
          className="gap-1.5"
          title="Toggle video subtitles"
        >
          <Subtitles className="h-4 w-4" />
          <span className="hidden sm:inline">Captions</span>
        </Button>
        <Button
          id="open-apk-release-button"
          data-testid="open-apk-release-button"
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setApkModalOpen(true)}
          className="gap-1.5 border-emerald-500/50 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          title="Download latest APK release (mostuf2556 & mostuf25561)"
        >
          <Smartphone className="h-4 w-4 text-emerald-500" />
          <span className="hidden sm:inline">Latest APK</span>
        </Button>
      </header>

      <div className="px-4 pt-4 md:px-6 md:pt-6">
        <form
          id="youtube-url-form"
          className="flex items-center gap-2 max-w-2xl mx-auto rounded-xl border border-border bg-card p-2 shadow-sm"
          onSubmit={(event) => {
            event.preventDefault();
            const id = parseVideoId(videoInput);
            if (id) {
              if (id !== videoId) {
                setTracks(null);
                setObservedUrl("");
                setDefaultCaptionsLoaded(false);
                setActive(-1);
                setSpeakingLang(null);
                setSpeakingRow(-1);
                setSpeechProgress(null);
                cancelSpeech();
                if (typeof window !== "undefined") {
                  const currentSearch = new URLSearchParams(window.location.search);
                  if (currentSearch.get("v") !== id) {
                    currentSearch.set("v", id);
                    window.history.pushState(
                      { videoId: id },
                      "",
                      `${window.location.pathname}?${currentSearch.toString()}${window.location.hash}`,
                    );
                  }
                }
              }
              setVideoId(id);
            } else {
              setCaptionStatus("Enter a valid YouTube link or video ID.");
            }
          }}
        >
          <input
            id="youtube-url-input"
            data-testid="youtube-url-input"
            aria-label="YouTube video URL or ID"
            value={videoInput}
            onChange={(event) => setVideoInput(event.target.value)}
            placeholder="Paste YouTube video link (e.g. https://www.youtube.com/watch?v=vBURridJXZ0)"
            className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm"
          />
          <Button id="play-video-button" data-testid="play-video-button" type="submit" size="sm">
            Load video
          </Button>
        </form>
      </div>

      <div className="grid items-start gap-4 p-4 md:p-6 lg:grid-cols-2">
        {panelOrder.map((panelId, panelIndex) => {
          const panel = PANELS.find((candidate) => candidate.id === panelId);
          if (!panel) return null;
          if (panelId === "subtitles" && !hasLegitimateSubtitles) return null;
          return (
            <AccordionSection
              key={panelId}
              id={panelId}
              title={panel.title}
              videoId={videoId}
              open={openPanels[panelId]}
              onOpenChange={(open) => setOpenPanels((current) => ({ ...current, [panelId]: open }))}
              onMoveUp={() => movePanel(panelId, -1)}
              onMoveDown={() => movePanel(panelId, 1)}
              canMoveUp={panelIndex > 0}
              canMoveDown={panelIndex < panelOrder.length - 1}
              wide={panelId === "subtitles"}
            >
              {panelId === "player" && (
                <div>
                  {isAndroid && (
                    <form
                      className="flex gap-2 p-3"
                      onSubmit={(event) => {
                        event.preventDefault();
                        const id = parseVideoId(videoInput);
                        if (id) {
                          if (id !== videoId) {
                            setTracks(null);
                            setObservedUrl("");
                            setDefaultCaptionsLoaded(false);
                            setActive(-1);
                            setSpeakingLang(null);
                            setSpeakingRow(-1);
                            setSpeechProgress(null);
                            cancelSpeech();
                            if (typeof window !== "undefined") {
                              const currentSearch = new URLSearchParams(window.location.search);
                              if (currentSearch.get("v") !== id) {
                                currentSearch.set("v", id);
                                window.history.pushState(
                                  { videoId: id },
                                  "",
                                  `${window.location.pathname}?${currentSearch.toString()}${window.location.hash}`,
                                );
                              }
                            }
                          }
                          setVideoId(id);
                        } else {
                          setCaptionStatus("Enter a valid YouTube link or video ID.");
                        }
                      }}
                    >
                      <input
                        aria-label="YouTube video URL or ID"
                        value={videoInput}
                        onChange={(event) => setVideoInput(event.target.value)}
                        placeholder="YouTube link or video ID"
                        className="min-w-0 flex-1 rounded-md border border-input bg-background px-2 py-1"
                      />
                      <Button type="submit">Load video</Button>
                    </form>
                  )}
                  <VideoInstancesSwiper
                    instances={videoInstances}
                    activeIndex={activeSwiperIndex}
                    onActiveIndexChange={setActiveSwiperIndex}
                    activePlayingId={
                      speakingLang && audioTrackMode ? `lang_${speakingLang}` : "primary"
                    }
                    videoId={videoId}
                    renderPlayerContainer={(instance) => {
                      if (instance.isPrimary) {
                        return (
                          <div className="relative h-full w-full">
                            <div ref={playerEl} className="h-full w-full" />
                            {showVideoSubtitles && (
                              <div
                                className="pointer-events-none absolute inset-x-3 top-3 text-center"
                                aria-live="polite"
                              >
                                <p
                                  id="active-subtitle-cue-text"
                                  data-testid="active-subtitle-cue-text"
                                  dir={speakingLang && RTL.has(speakingLang) ? "rtl" : "ltr"}
                                  className="inline-block max-w-[92%] rounded-md bg-foreground/90 px-3 py-2 text-base font-medium text-background shadow-lg md:text-lg"
                                >
                                  {speakingLang && speakingRow >= 0 ? (
                                    <HighlightedSubtitle
                                      text={rows[speakingRow]?.texts[speakingLang] ?? ""}
                                      progress={
                                        speechProgress?.row === speakingRow &&
                                        speechProgress.lang === speakingLang
                                          ? speechProgress
                                          : null
                                      }
                                    />
                                  ) : active >= 0 && rows[active] ? (
                                    <span>
                                      {baseLanguage && rows[active]?.texts[baseLanguage]
                                        ? rows[active]?.texts[baseLanguage]
                                        : Object.values(rows[active]?.texts || {})[0] || ""}
                                    </span>
                                  ) : (
                                    <span className="text-xs opacity-75">Subtitles active</span>
                                  )}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      }
                      return (
                        <div
                          ref={(el) => {
                            if (el) {
                              secondaryPlayerHosts.current.set(instance.id, el);
                            } else {
                              secondaryPlayerHosts.current.delete(instance.id);
                            }
                          }}
                          className="h-full w-full"
                        />
                      );
                    }}
                  />
                  {isAndroid && (
                    <p role="status" className="px-3 py-2 text-sm text-muted-foreground">
                      {captionStatus}
                    </p>
                  )}
                </div>
              )}

              {panelId === "playback" && (
                <div className="space-y-3">
                  {speakingLang ? (
                    <p>
                      {audioTrackMode ? "Repeating" : "Speaking"}{" "}
                      <b>{LANGS.find((l) => l.code === speakingLang)?.name ?? speakingLang}</b>…
                    </p>
                  ) : (
                    <p className="text-muted-foreground">
                      Press play.{" "}
                      {pauseMode
                        ? audioTrackMode
                          ? "The video pauses after each section and repeats it using native audio."
                          : "The video pauses after each section and speaks it."
                        : "Continuous playback."}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={pauseMode}
                        onChange={(e) => setPauseMode(e.target.checked)}
                      />{" "}
                      Pause &amp; speak after each section
                    </label>
                    {playedRecordsCount > 0 && (
                      <button
                        type="button"
                        data-testid="reset-played-subtitles-btn"
                        onClick={() => {
                          playedTtsRecords.current.clear();
                          handledRow.current = -1;
                          setPlayedRecordsCount(0);
                        }}
                        className="text-xs text-primary hover:underline font-medium"
                        title="Reset history of spoken subtitle records so they can be spoken again"
                      >
                        Reset spoken history ({playedRecordsCount} spoken)
                      </button>
                    )}
                  </div>
                  <label className="flex flex-wrap items-center gap-2">
                    <span>For each section, play first:</span>
                    <select
                      data-testid="section-order-select"
                      value={sectionOrder}
                      onChange={(e) => {
                        const v = e.target.value as SectionOrder;
                        setSectionOrderState(v);
                        saveSectionOrder(v);
                      }}
                      className="rounded-md border border-input bg-background px-2 py-1"
                    >
                      <option value="video-first">Video, then speech</option>
                      <option value="tts-first">Speech, then video</option>
                    </select>
                  </label>
                  {isAndroid && (
                    <>
                      <label className="flex flex-wrap items-center gap-2">
                        <span>Subtitle request (first try, other is fallback):</span>
                        <select
                          data-testid="subtitle-request-mode-select"
                          value={requestMode}
                          onChange={(e) => {
                            const v = e.target.value as SubtitleRequestMode;
                            setRequestModeState(v);
                            saveSubtitleRequestMode(v);
                          }}
                          className="rounded-md border border-input bg-background px-2 py-1"
                        >
                          <option value="tlang">Add tlang=&lt;language&gt;</option>
                          <option value="lang">Replace lang=&lt;language&gt;</option>
                        </select>
                      </label>
                      <AttemptOrderSettings
                        order={attemptOrder}
                        onChangeOrder={handleUpdateAttemptOrder}
                        promoteSuccess={promoteSuccess}
                        onTogglePromoteSuccess={handleTogglePromoteSuccess}
                        useFetchServer={useFetchServer}
                        onToggleUseFetchServer={handleToggleUseFetchServer}
                        fetchServerUrl={fetchServerUrl}
                        onUpdateFetchServerUrl={handleUpdateFetchServerUrl}
                        onSelectVideo={handleSelectLibraryVideo}
                      />
                      <div className="pt-2 border-t border-border/60 space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            data-testid="auto-retry-subtitles-toggle"
                            type="checkbox"
                            checked={autoRetrySubtitles}
                            onChange={(e) => handleToggleAutoRetry(e.target.checked)}
                            className="rounded border-input text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                          />
                          <span className="font-medium text-xs text-foreground">
                            Auto-retry unfetched favorite languages (safe paced jitter)
                          </span>
                        </label>
                        <p className="text-[11px] text-muted-foreground ml-6">
                          Automatically retries pending favorite subtitles with random spacing
                          between X and Y seconds to prevent YouTube HTTP 429 rate limit blocks.
                        </p>
                        <div className="ml-6 grid grid-cols-2 gap-3 max-w-sm pt-1">
                          <div>
                            <label
                              htmlFor="retry-pacing-min-input"
                              className="text-[11px] font-medium text-muted-foreground block mb-1"
                            >
                              Min interval (X seconds):
                            </label>
                            <input
                              id="retry-pacing-min-input"
                              data-testid="retry-pacing-min-input"
                              type="number"
                              min={1}
                              max={retryPacingMaxSec}
                              value={retryPacingMinSec}
                              onChange={(e) =>
                                handleUpdatePacingMin(parseInt(e.target.value, 10) || 1)
                              }
                              className="w-full rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="retry-pacing-max-input"
                              className="text-[11px] font-medium text-muted-foreground block mb-1"
                            >
                              Max interval (Y seconds):
                            </label>
                            <input
                              id="retry-pacing-max-input"
                              data-testid="retry-pacing-max-input"
                              type="number"
                              min={retryPacingMinSec}
                              max={60}
                              value={retryPacingMaxSec}
                              onChange={(e) =>
                                handleUpdatePacingMax(
                                  parseInt(e.target.value, 10) || retryPacingMinSec,
                                )
                              }
                              className="w-full rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  <label className="flex items-center gap-2">
                    <input
                      id="audio-track-mode-toggle"
                      type="checkbox"
                      checked={audioTrackMode}
                      onChange={(e) => onAudioTrackModeChange(e.target.checked)}
                    />{" "}
                    Audio-track mode (repeat segment with native video audio instead of synthesized
                    TTS)
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      id="auto-scroll-toggle"
                      type="checkbox"
                      checked={autoFocus}
                      onChange={(e) => onAutoFocusChange(e.target.checked)}
                    />{" "}
                    Auto-focus and scroll to current subtitle
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      id="debug-mode-toggle"
                      data-testid="debug-mode-toggle"
                      type="checkbox"
                      checked={debugMode}
                      onChange={(e) => onDebugModeChange(e.target.checked)}
                    />{" "}
                    Debug mode (show network traffic inspector and diagnostics)
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={showVideoSubtitles}
                      onChange={(e) => setShowVideoSubtitles(e.target.checked)}
                    />{" "}
                    Show spoken subtitle over video
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      id="background-audio-toggle"
                      data-testid="background-audio-toggle"
                      type="checkbox"
                      checked={backgroundAudioEnabled}
                      onChange={(e) => handleToggleBackgroundAudio(e.target.checked)}
                    />{" "}
                    Background audio &amp; lockscreen playback controls
                  </label>
                </div>
              )}

              {panelId === "library" && (
                <VideoLibraryPanel
                  currentVideoId={videoId}
                  onSelectVideo={handleSelectLibraryVideo}
                  onClearVideoCache={(clearedId) => {
                    if (clearedId === videoId) {
                      setTracks(null);
                      setObservedUrl("");
                      subtitleRequestQueue.resetVideo(clearedId);
                    }
                  }}
                  onFetchFromScratch={(scratchId, scratchUrl) => {
                    clearVideoSubtitleCache(scratchId);
                    subtitleRequestQueue.resetVideo(scratchId);
                    if (scratchId === videoId) {
                      setTracks(null);
                      setObservedUrl("");
                      if (isAndroid) {
                        void fetchFavoriteLanguageSubtitles(targetLanguages);
                      }
                    } else {
                      handleSelectLibraryVideo(scratchId, scratchUrl);
                    }
                  }}
                />
              )}

              {panelId === "parser" && (
                <div className="space-y-4">
                  {/* Interactive Timing & Punctuation Splitting Lab */}
                  <ParserTimingLab
                    tracks={tracks}
                    baseLanguage={baseLanguage}
                    selectedCriteria={selectedCriteria}
                    criteriaSettings={criteriaSettings}
                    onApplyCriteria={handleApplyPreset}
                    onUpdateGroupSettings={handleUpdateGroupSettings}
                  />

                  {/* Presets Header */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                        Alignment Presets
                      </span>
                      <span className="text-xs text-muted-foreground">Quick combinations</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {PARSER_PRESETS.map((preset) => {
                        const isPresetActive =
                          preset.criteria.length === selectedCriteria.length &&
                          preset.criteria.every((c) => selectedCriteria.includes(c));
                        return (
                          <Button
                            key={preset.id}
                            type="button"
                            size="sm"
                            variant={isPresetActive ? "default" : "outline"}
                            className="h-7 text-xs px-2.5"
                            onClick={() => handleApplyPreset(preset.criteria)}
                            title={preset.desc}
                          >
                            {preset.name}
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Accumulative Criteria Section */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                        Accumulative Division Criteria (Multi-Select)
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-primary">
                          {selectedCriteria.length} criteria active
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[11px] px-2 text-muted-foreground hover:text-foreground"
                          onClick={handleResetGroupSettings}
                          title="Reset all criteria inner settings to default"
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Reset settings
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      Select multiple criteria accumulatively to divide subtitles into separated,
                      translatable sections of related sentences and cohesive context. Click
                      settings to tune inner parameters for each group.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {PARSER_CRITERIA.map((crit) => {
                        const isChecked = selectedCriteria.includes(crit.id);
                        const isExpanded = expandedSettingsGroup === crit.id;
                        return (
                          <div
                            key={crit.id}
                            className={`rounded-lg border transition-all ${
                              isChecked
                                ? "border-primary/60 bg-primary/5 text-foreground shadow-xs"
                                : "border-border/70 hover:border-border hover:bg-muted/40 text-muted-foreground"
                            }`}
                          >
                            <div
                              onClick={() => handleToggleCriterion(crit.id)}
                              className="p-2.5 cursor-pointer flex items-start gap-2.5"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleCriterion(crit.id)}
                                onClick={(e) => e.stopPropagation()}
                                className="mt-0.5 rounded border-muted-foreground/40 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1 flex-wrap">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span
                                      className={`text-xs font-semibold ${isChecked ? "text-foreground" : "text-foreground/80"}`}
                                    >
                                      {crit.name}
                                    </span>
                                    <Badge
                                      variant={isChecked ? "default" : "outline"}
                                      className="text-[10px] h-4 px-1.5 py-0 font-normal"
                                    >
                                      {crit.badge}
                                    </Badge>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedSettingsGroup(isExpanded ? null : crit.id);
                                    }}
                                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] transition-colors ${
                                      isExpanded
                                        ? "bg-primary text-primary-foreground font-medium"
                                        : "bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground"
                                    }`}
                                    title="Toggle inner settings for this criteria group"
                                  >
                                    <SlidersHorizontal className="h-3 w-3" />
                                    <span>Settings</span>
                                    {isExpanded ? (
                                      <ChevronUp className="h-3 w-3" />
                                    ) : (
                                      <ChevronDown className="h-3 w-3" />
                                    )}
                                  </button>
                                </div>
                                <p className="text-[11px] leading-tight text-muted-foreground mt-1">
                                  {crit.desc}
                                </p>
                              </div>
                            </div>

                            {/* Inner Settings Panel for this Group */}
                            {isExpanded && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="px-3 pb-3 pt-2 border-t border-border/60 bg-background/90 rounded-b-lg space-y-2.5 text-xs text-foreground"
                              >
                                <div className="flex items-center justify-between border-b border-border/40 pb-1.5">
                                  <span className="font-semibold text-[11px] text-muted-foreground uppercase tracking-wider">
                                    {crit.name} Inner Settings
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateGroupSettings(
                                        crit.id,
                                        DEFAULT_CRITERIA_SETTINGS[crit.id] as never,
                                      )
                                    }
                                    className="text-[10px] text-muted-foreground hover:text-foreground underline"
                                  >
                                    Reset this group
                                  </button>
                                </div>

                                {crit.id === "sentence" && (
                                  <div className="space-y-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={criteriaSettings.sentence.includeCommas}
                                        onChange={(e) =>
                                          handleUpdateGroupSettings("sentence", {
                                            includeCommas: e.target.checked,
                                          })
                                        }
                                        className="rounded border-border text-primary h-3.5 w-3.5"
                                      />
                                      <span className="text-[11px]">
                                        Split on secondary clauses (commas, semicolons, colons)
                                      </span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={criteriaSettings.sentence.splitIntraCue}
                                        onChange={(e) =>
                                          handleUpdateGroupSettings("sentence", {
                                            splitIntraCue: e.target.checked,
                                          })
                                        }
                                        className="rounded border-border text-primary h-3.5 w-3.5"
                                      />
                                      <span className="text-[11px]">
                                        Split inside word-timed cues (intra-cue segments)
                                      </span>
                                    </label>
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-[11px] text-muted-foreground">
                                        Minimum words per sentence:
                                      </span>
                                      <input
                                        type="number"
                                        min={1}
                                        max={10}
                                        value={criteriaSettings.sentence.minWords}
                                        onChange={(e) =>
                                          handleUpdateGroupSettings("sentence", {
                                            minWords: Math.max(1, parseInt(e.target.value) || 1),
                                          })
                                        }
                                        className="h-6 w-14 rounded border border-input bg-background px-1.5 text-xs text-right"
                                      />
                                    </div>
                                  </div>
                                )}

                                {crit.id === "pause" && (
                                  <div className="space-y-2">
                                    <div>
                                      <div className="flex justify-between text-[11px] mb-1">
                                        <span className="text-muted-foreground">
                                          Silence gap threshold:
                                        </span>
                                        <span className="font-semibold text-primary">
                                          {criteriaSettings.pause.minPauseMs} ms
                                        </span>
                                      </div>
                                      <input
                                        type="range"
                                        min={200}
                                        max={1500}
                                        step={50}
                                        value={criteriaSettings.pause.minPauseMs}
                                        onChange={(e) =>
                                          handleUpdateGroupSettings("pause", {
                                            minPauseMs: parseInt(e.target.value),
                                          })
                                        }
                                        className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                                      />
                                    </div>
                                    <div>
                                      <div className="flex justify-between text-[11px] mb-1">
                                        <span className="text-muted-foreground">
                                          Cue snap proximity:
                                        </span>
                                        <span className="font-semibold text-primary">
                                          {criteriaSettings.pause.snapToleranceMs} ms
                                        </span>
                                      </div>
                                      <input
                                        type="range"
                                        min={400}
                                        max={2000}
                                        step={100}
                                        value={criteriaSettings.pause.snapToleranceMs}
                                        onChange={(e) =>
                                          handleUpdateGroupSettings("pause", {
                                            snapToleranceMs: parseInt(e.target.value),
                                          })
                                        }
                                        className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                                      />
                                    </div>
                                  </div>
                                )}

                                {crit.id === "punctVote" && (
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-[11px] text-muted-foreground">
                                        Minimum agreeing tracks:
                                      </span>
                                      <select
                                        value={criteriaSettings.punctVote.minTrackVotes}
                                        onChange={(e) =>
                                          handleUpdateGroupSettings("punctVote", {
                                            minTrackVotes: parseInt(e.target.value),
                                          })
                                        }
                                        className="h-6 rounded border border-input bg-background px-1.5 text-xs"
                                      >
                                        <option value={1}>1 track (any mark)</option>
                                        <option value={2}>2 tracks (agreement)</option>
                                        <option value={3}>3 tracks (consensus)</option>
                                      </select>
                                    </div>
                                    <div>
                                      <div className="flex justify-between text-[11px] mb-1">
                                        <span className="text-muted-foreground">
                                          Cluster proximity window:
                                        </span>
                                        <span className="font-semibold text-primary">
                                          {criteriaSettings.punctVote.clusterToleranceMs} ms
                                        </span>
                                      </div>
                                      <input
                                        type="range"
                                        min={200}
                                        max={1200}
                                        step={50}
                                        value={criteriaSettings.punctVote.clusterToleranceMs}
                                        onChange={(e) =>
                                          handleUpdateGroupSettings("punctVote", {
                                            clusterToleranceMs: parseInt(e.target.value),
                                          })
                                        }
                                        className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                                      />
                                    </div>
                                  </div>
                                )}

                                {crit.id === "consensus" && (
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-[11px] text-muted-foreground">
                                        Required track alignment:
                                      </span>
                                      <select
                                        value={criteriaSettings.consensus.majorityRatio}
                                        onChange={(e) =>
                                          handleUpdateGroupSettings("consensus", {
                                            majorityRatio: parseFloat(e.target.value),
                                          })
                                        }
                                        className="h-6 rounded border border-input bg-background px-1.5 text-xs"
                                      >
                                        <option value={0.33}>33% (any 2+ tracks)</option>
                                        <option value={0.5}>50% (majority)</option>
                                        <option value={0.66}>66% (supermajority)</option>
                                      </select>
                                    </div>
                                    <div>
                                      <div className="flex justify-between text-[11px] mb-1">
                                        <span className="text-muted-foreground">
                                          Proximity window:
                                        </span>
                                        <span className="font-semibold text-primary">
                                          {criteriaSettings.consensus.clusterToleranceMs} ms
                                        </span>
                                      </div>
                                      <input
                                        type="range"
                                        min={200}
                                        max={800}
                                        step={50}
                                        value={criteriaSettings.consensus.clusterToleranceMs}
                                        onChange={(e) =>
                                          handleUpdateGroupSettings("consensus", {
                                            clusterToleranceMs: parseInt(e.target.value),
                                          })
                                        }
                                        className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                                      />
                                    </div>
                                  </div>
                                )}

                                {crit.id === "cue" && (
                                  <div className="space-y-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={criteriaSettings.cue.splitAllTracks}
                                        onChange={(e) =>
                                          handleUpdateGroupSettings("cue", {
                                            splitAllTracks: e.target.checked,
                                          })
                                        }
                                        className="rounded border-border text-primary h-3.5 w-3.5"
                                      />
                                      <span className="text-[11px]">
                                        Split on cue starts from all parallel tracks
                                      </span>
                                    </label>
                                  </div>
                                )}

                                {crit.id === "anchors" && (
                                  <div className="space-y-1.5">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={criteriaSettings.anchors.matchNumbers}
                                        onChange={(e) =>
                                          handleUpdateGroupSettings("anchors", {
                                            matchNumbers: e.target.checked,
                                          })
                                        }
                                        className="rounded border-border text-primary h-3.5 w-3.5"
                                      />
                                      <span className="text-[11px]">Match numbers and digits</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={criteriaSettings.anchors.matchProperNouns}
                                        onChange={(e) =>
                                          handleUpdateGroupSettings("anchors", {
                                            matchProperNouns: e.target.checked,
                                          })
                                        }
                                        className="rounded border-border text-primary h-3.5 w-3.5"
                                      />
                                      <span className="text-[11px]">
                                        Match capitalized proper nouns
                                      </span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={criteriaSettings.anchors.requireStrictMultiTrack}
                                        onChange={(e) =>
                                          handleUpdateGroupSettings("anchors", {
                                            requireStrictMultiTrack: e.target.checked,
                                          })
                                        }
                                        className="rounded border-border text-primary h-3.5 w-3.5"
                                      />
                                      <span className="text-[11px]">
                                        Strict: require anchor in all tracks
                                      </span>
                                    </label>
                                  </div>
                                )}

                                {crit.id === "window" && (
                                  <div className="space-y-2">
                                    <div>
                                      <div className="flex justify-between text-[11px] mb-1">
                                        <span className="text-muted-foreground">
                                          Minimum section length:
                                        </span>
                                        <span className="font-semibold text-primary">
                                          {(criteriaSettings.window.minSectionMs / 1000).toFixed(1)}
                                          s
                                        </span>
                                      </div>
                                      <input
                                        type="range"
                                        min={800}
                                        max={4000}
                                        step={200}
                                        value={criteriaSettings.window.minSectionMs}
                                        onChange={(e) =>
                                          handleUpdateGroupSettings("window", {
                                            minSectionMs: parseInt(e.target.value),
                                          })
                                        }
                                        className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                                      />
                                    </div>
                                    <div>
                                      <div className="flex justify-between text-[11px] mb-1">
                                        <span className="text-muted-foreground">
                                          Maximum section length:
                                        </span>
                                        <span className="font-semibold text-primary">
                                          {(criteriaSettings.window.maxSectionMs / 1000).toFixed(0)}
                                          s
                                        </span>
                                      </div>
                                      <input
                                        type="range"
                                        min={6000}
                                        max={24000}
                                        step={1000}
                                        value={criteriaSettings.window.maxSectionMs}
                                        onChange={(e) =>
                                          handleUpdateGroupSettings("window", {
                                            maxSectionMs: parseInt(e.target.value),
                                          })
                                        }
                                        className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Status & Summary */}
                  <div className="pt-2 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-muted-foreground">
                    <div>
                      Sections:{" "}
                      <span className="font-semibold text-foreground">
                        {rows.length} translatable sections
                      </span>{" "}
                      · Timing base:{" "}
                      <span className="font-semibold text-foreground">
                        {baseLanguage
                          ? getLanguageMeta(baseLanguage).name
                          : "None (waiting for captions)"}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground/80">
                      Cuts accumulate at sentence marks, breath pauses & alignment consensus
                    </div>
                  </div>
                </div>
              )}

              {panelId === "languages" && (
                <>
                  <div className="mb-4 space-y-3 border-b border-border pb-4">
                    <LanguageBoxesSelector
                      catalog={isAndroid ? SUPPORTED_LANGUAGES_CATALOG : LANGS}
                      selectedLanguages={targetLanguages}
                      onSelectionChange={handleTargetLanguagesChange}
                      isAndroid={isAndroid}
                    />
                    {(() => {
                      const pendingFetchAgainLangs =
                        activeFailedToFetch.length > 0
                          ? activeFailedToFetch
                          : failedLangs.length > 0
                            ? languagesToFetchNext
                            : [];
                      if (pendingFetchAgainLangs.length === 0) return null;
                      return (
                        <div className="flex items-center justify-between p-2.5 rounded-lg border border-destructive/30 bg-destructive/10 text-xs">
                          <span className="text-destructive font-medium">
                            Failed to fetch subtitles: {pendingFetchAgainLangs.join(", ")}
                          </span>
                          <button
                            type="button"
                            data-testid="subtitles-manual-fetch"
                            onClick={manualFetchFailed}
                            className="inline-flex items-center gap-1 rounded bg-destructive/20 px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/30"
                          >
                            <RefreshCw className="h-3 w-3" />
                            Fetch again ({pendingFetchAgainLangs.join(", ")})
                          </button>
                        </div>
                      );
                    })()}
                    <div className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/20">
                      <div className="space-y-0.5">
                        <label
                          htmlFor="auto-speak-on-fetch-toggle"
                          className="text-xs font-medium text-foreground cursor-pointer"
                        >
                          Auto speak language upon fetching
                        </label>
                        <div className="text-[11px] text-muted-foreground">
                          Automatically enable the "Speak" checkbox for languages when their
                          subtitles are loaded
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        id="auto-speak-on-fetch-toggle"
                        data-testid="auto-speak-on-fetch-toggle"
                        checked={autoSpeakOnFetch}
                        onChange={(e) => {
                          setAutoSpeakOnFetch(e.target.checked);
                          setAutoSpeakOnFetchSetting(e.target.checked);
                        }}
                        className="h-4 w-4 rounded border-input text-primary focus:ring-primary cursor-pointer"
                      />
                    </div>
                  </div>
                  <table className="w-full">
                    <thead>
                      <tr className="text-xs text-muted-foreground">
                        <th className="text-left font-normal">Language</th>
                        <th className="font-normal text-center">Show</th>
                        <th className="font-normal text-center">Speak</th>
                        <th
                          className="font-normal text-center"
                          title="Foreign subtitle TTS play frequency ratio"
                        >
                          TTS Ratio
                        </th>
                        <th className="font-normal text-center">Order</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderedLangs.map((l, index) => {
                        const isSpoken = spoken.includes(l.code);
                        const ratio = ttsRatios[l.code] ?? 1;
                        return (
                          <tr key={l.code}>
                            <td className="py-1">{l.name}</td>
                            <td className="text-center">
                              <input
                                type="checkbox"
                                checked={shown.includes(l.code)}
                                onChange={() => toggle(shown, setShown, l.code)}
                              />
                            </td>
                            <td className="text-center">
                              <input
                                type="checkbox"
                                checked={isSpoken}
                                onChange={() => toggle(spoken, setSpoken, l.code)}
                              />
                            </td>
                            <td className="text-center">
                              {isSpoken ? (
                                <span
                                  data-testid={`tts-ratio-badge-${l.code}`}
                                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono font-medium bg-primary/10 text-primary border border-primary/20"
                                  title={`1:${ratio} ratio (${ratio === 1 ? "All sentences" : `${Math.round(100 / ratio)}% of sentences`})`}
                                >
                                  1:{ratio}
                                </span>
                              ) : (
                                <span className="text-[11px] text-muted-foreground">—</span>
                              )}
                            </td>
                            <td>
                              <div className="flex justify-center gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  disabled={index === 0}
                                  onClick={() => moveLanguage(l.code, -1)}
                                  title={`Move ${l.name} earlier`}
                                  aria-label={`Move ${l.name} earlier`}
                                >
                                  <ChevronUp aria-hidden="true" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  disabled={index === orderedLangs.length - 1}
                                  onClick={() => moveLanguage(l.code, 1)}
                                  title={`Move ${l.name} later`}
                                  aria-label={`Move ${l.name} later`}
                                >
                                  <ChevronDown aria-hidden="true" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="mt-2 space-y-1 border-t border-border pt-2">
                    {orderedLangs
                      .filter((lang) => spoken.includes(lang.code))
                      .map((lang) => {
                        const languageVoices = getLanguageVoices(voices, lang.tts);
                        const ratio = ttsRatios[lang.code] ?? 1;
                        return (
                          <div
                            key={lang.code}
                            data-testid={`tts-settings-card-${lang.code}`}
                            className="flex flex-wrap sm:flex-nowrap items-center gap-2 rounded-md border border-border/60 bg-muted/20 px-2 py-1 text-xs"
                          >
                            <span
                              className="w-16 shrink-0 truncate font-semibold text-foreground"
                              title={lang.name}
                            >
                              {lang.name}
                            </span>
                            {/* Speech ratio: speak 1 of every N sections */}
                            <label
                              className="flex items-center gap-1 shrink-0"
                              title="Speak 1 of every N sections (comprehension level)"
                            >
                              <span className="text-muted-foreground">Speak</span>
                              <select
                                aria-label={`${lang.name} TTS sentence ratio`}
                                data-testid={`tts-ratio-slider-${lang.code}`}
                                value={ratio}
                                onChange={(e) => {
                                  const val = Math.max(1, Math.min(10, Number(e.target.value)));
                                  setTtsRatios((curr) => ({ ...curr, [lang.code]: val }));
                                  saveTtsRatioPreference(lang.code, val);
                                  if (videoId)
                                    saveVideoSettings(videoId, { ttsRatios: { [lang.code]: val } });
                                }}
                                className="rounded border border-input bg-background px-1 py-0.5 text-xs"
                              >
                                {[1, 2, 3, 4, 5, 7, 10].map((n) => (
                                  <option
                                    key={n}
                                    value={n}
                                    data-testid={`tts-ratio-preset-${lang.code}-${n}`}
                                  >
                                    1:{n}
                                  </option>
                                ))}
                              </select>
                              <span
                                data-testid={`tts-ratio-label-${lang.code}`}
                                className="sr-only"
                              >
                                1:{ratio} ({Math.round(100 / ratio)}% of sentences)
                              </span>
                            </label>
                            {/* Rate slider */}
                            <label className="flex items-center gap-1.5 flex-1 min-w-[7rem]">
                              <span className="text-muted-foreground shrink-0">Rate</span>
                              <input
                                aria-label={`${lang.name} speech rate`}
                                type="range"
                                min={0.6}
                                max={1.4}
                                step={0.1}
                                value={rates[lang.code] ?? 1}
                                onChange={(e) =>
                                  setRates((current) => ({
                                    ...current,
                                    [lang.code]: Number(e.target.value),
                                  }))
                                }
                                className="h-1.5 min-w-0 flex-1 cursor-pointer accent-primary"
                              />
                              <span className="w-7 text-right font-mono tabular-nums text-muted-foreground shrink-0">
                                {(rates[lang.code] ?? 1).toFixed(1)}×
                              </span>
                            </label>
                            {/* Voice selector */}
                            <select
                              aria-label={`${lang.name} voice`}
                              value={voiceSelections[lang.code] ?? ""}
                              onChange={(e) => {
                                const value = e.target.value;
                                setVoiceSelections((current) => {
                                  const next = { ...current, [lang.code]: value };
                                  try {
                                    localStorage.setItem(
                                      "yt_tts_voice_selections_v1",
                                      JSON.stringify(next),
                                    );
                                  } catch {
                                    // ignore storage errors
                                  }
                                  return next;
                                });
                              }}
                              disabled={languageVoices.length === 0}
                              title={
                                languageVoices.length === 0
                                  ? "No selectable voices on this device; the device default voice is used"
                                  : "Voice"
                              }
                              className="w-full sm:w-44 shrink-0 truncate rounded border border-input bg-background px-1.5 py-0.5 text-xs disabled:opacity-60"
                            >
                              <option value="">
                                {languageVoices.length === 0 ? "Device voice" : "Default voice"}
                              </option>
                              {languageVoices.map((voice, voiceIndex) => (
                                <option
                                  key={getUniqueVoiceKey(voice, voiceIndex)}
                                  value={voice.voiceURI || voice.name}
                                >
                                  {voice.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        );
                      })}
                  </div>
                </>
              )}

              {panelId === "subtitles" &&
                (!hasLegitimateSubtitles ? null : (
                  <SubtitlesTablePanel
                    isAndroid={isAndroid}
                    rows={rows}
                    displayedRows={displayedRows}
                    cols={cols}
                    subtitlesLimit={subtitlesLimit}
                    setSubtitlesLimit={setSubtitlesLimit}
                    subtitlesPage={subtitlesPage}
                    setSubtitlesPage={setSubtitlesPage}
                    active={active}
                    allFavoritesAligned={allFavoritesAligned}
                    targetLanguages={targetLanguages}
                    speechProgress={speechProgress}
                    tracks={tracks}
                    onSeek={seek}
                    spokenLangs={spoken}
                    ttsRatios={ttsRatios}
                  />
                ))}
            </AccordionSection>
          );
        })}
      </div>

      <ApkReleasesFooter
        apkReleaseLinks={apkReleaseLinks}
        onOpenApkModal={() => setApkModalOpen(true)}
      />

      {debugMode && (
        <NetworkRequestsInspector
          isOpen={networkInspectorOpen}
          onClose={() => setNetworkInspectorOpen(false)}
          onFetchAgainWithSession={(url) => handleFetchAgain(url, true)}
          onFetchAgainAnon={(url) => handleFetchAgain(url, false)}
          onFetchAgainViaServer={handleFetchAgainViaServer}
          onUseTheseSubtitles={handleUseTheseSubtitles}
          isAndroid={isAndroid}
          useFetchServer={useFetchServer}
          onToggleUseFetchServer={handleToggleUseFetchServer}
          fetchServerUrl={fetchServerUrl}
          onUpdateFetchServerUrl={handleUpdateFetchServerUrl}
        />
      )}
      <ApkReleaseModal isOpen={apkModalOpen} onClose={() => setApkModalOpen(false)} />
      <SubtitleFetchToast
        onViewSubtitles={() => {
          setOpenPanels((prev) => ({ ...prev, subtitles: true }));
          const el =
            document.getElementById("subtitles-table-panel") ||
            document.getElementById("accordion-section-subtitles");
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }}
      />
      <FloatingDraggablePauseButton
        isSetupPaused={isSetupPaused}
        onToggleSetupPause={toggleSetupPause}
      />
      <FloatingSubtitleRetryIndicator
        targetLanguages={targetLanguages}
        tracks={tracks}
        onFetchLanguage={handleFloatingFetchSingleLanguage}
        isFetching={isSubtitlesPending}
        autoRetryEnabled={autoRetrySubtitles}
        minPacingSec={retryPacingMinSec}
        maxPacingSec={retryPacingMaxSec}
        onToggleAutoRetry={handleToggleAutoRetry}
      />
    </div>
  );
}

export { AccordionSection } from "@/components/AccordionSection";
export { SubtitleRow } from "@/components/SubtitleRow";
export { HighlightedSubtitle } from "@/components/HighlightedSubtitle";
export { SubtitlesTablePanel } from "@/components/SubtitlesTablePanel";
export { ApkReleasesFooter } from "@/components/ApkReleasesFooter";
