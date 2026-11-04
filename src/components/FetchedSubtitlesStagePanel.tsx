import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Subtitles,
  Sparkles,
  Download,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  HardDrive,
  Copy,
  Terminal,
  Shield,
  ArrowRight,
  ExternalLink,
  Play,
  Check,
  Search,
  Filter,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LANGS, type Json3 } from "@/lib/subtitles";
import {
  analyzeDefaultSubtitlesPunctuation,
  type SubtitlePunctuationStats,
} from "@/utils/subtitlePunctuationStats";
import {
  getCachedTrackDetails,
  cacheJson3Track,
  clearVideoSubtitleCache,
  getCachedRawJson3,
  getAllCachedTargetLanguages,
  type CachedTrackDetails,
} from "@/utils/subtitleCache";
import { parseJson3 } from "@/lib/native-captions";
import {
  subscribeSubtitleFetchLogs,
  emitSubtitleFetchLog,
  getSubtitleFetchLogs,
  clearSubtitleFetchLogs,
  type SubtitleFetchLogEntry,
} from "@/utils/subtitleFetchLogger";

export interface FetchedSubtitlesStagePanelProps {
  videoId: string;
  videoInput: string;
  onVideoInputChange: (val: string) => void;
  onSubmitVideoUrl: (urlOrId: string) => void;
  observedUrl: string;
  onObservedUrlChange?: (url: string) => void;
  tracks: Record<string, Json3> | null;
  onTracksChange: (tracks: Record<string, Json3>) => void;
  baseLanguage: string;
  onSelectBaseLanguage: (langCode: string) => void;
  defaultLanguages: string[];
  isAndroid: boolean;
  onLoadSampleSubtitles?: () => void;
  onProceedToStage?: (stage: number) => void;
  className?: string;
  innerParserQuarantined?: boolean;
  onToggleInnerParserQuarantine?: (quarantined: boolean) => void;
}

const COMMON_FETCH_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "he", name: "Hebrew" },
  { code: "ar", name: "Arabic" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "ru", name: "Russian" },
  { code: "it", name: "Italian" },
  { code: "pt-BR", name: "Portuguese (BR)" },
];

export const FetchedSubtitlesStagePanel: React.FC<FetchedSubtitlesStagePanelProps> = ({
  videoId,
  videoInput,
  onVideoInputChange,
  onSubmitVideoUrl,
  observedUrl,
  onObservedUrlChange,
  tracks,
  onTracksChange,
  baseLanguage,
  onSelectBaseLanguage,
  defaultLanguages,
  isAndroid,
  onLoadSampleSubtitles,
  onProceedToStage,
  className = "",
  innerParserQuarantined = true,
  onToggleInnerParserQuarantine,
}) => {
  const [timedTextDirectUrl, setTimedTextDirectUrl] = useState<string>("");
  const [fetchStrategy, setFetchStrategy] = useState<"tlang" | "lang">("tlang");
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [logFilter, setLogFilter] = useState<"all" | "errors" | "cache" | "stats">("all");
  const [copiedLog, setCopiedLog] = useState<boolean>(false);
  const [selectedQuickLang, setSelectedQuickLang] = useState<string>("en");
  const [viewingCachedTrack, setViewingCachedTrack] = useState<{
    langCode: string;
    langName: string;
    content: string;
    byteSize: number;
    isFixture: boolean;
    cuesCount: number;
    storageKey?: string;
  } | null>(null);
  const [copiedCachedContent, setCopiedCachedContent] = useState<boolean>(false);

  // Activity & Terminal Logs (youtube-subtitles-fetcher style)
  const [logs, setLogs] = useState<SubtitleFetchLogEntry[]>(() => getSubtitleFetchLogs());

  useEffect(() => {
    const unsubscribe = subscribeSubtitleFetchLogs((updatedLogs) => {
      setLogs(updatedLogs);
    });
    return unsubscribe;
  }, []);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  const addLog = (
    level: "info" | "success" | "warn" | "error" | "stats" | "cache",
    message: string,
    details?: string,
  ) => {
    emitSubtitleFetchLog(level, message, details);
  };

  // Auto-scroll terminal to bottom
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  // Deduplicate available languages across tracks and defaultLanguages
  const allTrackLangs = useMemo(() => {
    const set = new Set<string>();
    if (defaultLanguages && Array.isArray(defaultLanguages)) {
      defaultLanguages.forEach((l) => set.add(l));
    }
    if (tracks) {
      Object.keys(tracks).forEach((l) => set.add(l));
    }
    const cached = getAllCachedTargetLanguages(videoId);
    cached.forEach((l) => set.add(l));
    return Array.from(set);
  }, [defaultLanguages, tracks, videoId]);

  // Punctuation and sentence statistics across all fetched tracks
  const { statsMap, recommendedLang, maxCommas } = useMemo(
    () => analyzeDefaultSubtitlesPunctuation(allTrackLangs, tracks, baseLanguage),
    [allTrackLangs, tracks, baseLanguage],
  );

  // Cache stats for each language
  const cacheDetailsMap = useMemo(() => {
    const map: Record<string, CachedTrackDetails> = {};
    for (const lang of allTrackLangs) {
      map[lang] = getCachedTrackDetails(videoId, lang);
    }
    return map;
  }, [allTrackLangs, videoId]);

  // Automatically select the track with highest punctuation if none selected yet
  useEffect(() => {
    if (!baseLanguage && recommendedLang) {
      addLog(
        "stats",
        `Auto-selected translation source: '${recommendedLang}'`,
        `Highest sentence punctuation count: ${statsMap[recommendedLang]?.totalPunctuation || maxCommas}`,
      );
      onSelectBaseLanguage(recommendedLang);
    }
  }, [baseLanguage, recommendedLang, onSelectBaseLanguage, statsMap, maxCommas]);

  // Log incoming observed URL
  useEffect(() => {
    if (observedUrl) {
      addLog("info", "Observed YouTube timedtext query", observedUrl);
    }
  }, [observedUrl]);

  // Cache tracks to localStorage whenever tracks change
  useEffect(() => {
    if (!tracks || Object.keys(tracks).length === 0) return;
    for (const [lang, trackJson] of Object.entries(tracks)) {
      if (trackJson && (trackJson.events?.length || 0) > 0) {
        const cached = cacheJson3Track(videoId, lang, trackJson);
        if (cached) {
          const stats = statsMap[lang];
          addLog(
            "cache",
            `Cached track '${lang}' (${trackJson.events?.length || 0} cues)`,
            `Punctuation: ${stats?.totalPunctuation || 0} marks. Saved to localStorage.`,
          );
        }
      }
    }
  }, [tracks, videoId, statsMap]);

  // Load and apply direct TimedText URL
  const handleFetchTimedTextDirect = async () => {
    const url = timedTextDirectUrl.trim();
    if (!url) return;
    setIsFetching(true);
    addLog("info", `Initiating direct fetch from URL`, url);
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }
      const text = await response.text();
      const json3 = parseJson3(text);
      if (!json3 || !json3.events || json3.events.length === 0) {
        throw new Error("Invalid or empty YouTube JSON3 response format");
      }
      let targetLang = "en";
      try {
        const u = new URL(url);
        targetLang = u.searchParams.get("tlang") || u.searchParams.get("lang") || "en";
      } catch {}

      cacheJson3Track(videoId, targetLang, json3);
      onTracksChange({ ...(tracks || {}), [targetLang]: json3 });
      onSelectBaseLanguage(targetLang);
      addLog(
        "success",
        `Direct fetch succeeded for '${targetLang}' (${json3.events.length} cues, HTTP 200)`,
        `Set as translation source.`,
      );
      setTimedTextDirectUrl("");
    } catch (err: any) {
      addLog("error", `Direct fetch failed: ${err.message || String(err)}`);
    } finally {
      setIsFetching(false);
    }
  };

  // Quick fetch language using tlang / lang
  const handleQuickFetchLang = async (langCode: string) => {
    setSelectedQuickLang(langCode);
    setIsFetching(true);
    addLog("info", `Requesting '${langCode}' track (strategy: ${fetchStrategy})...`);

    // If local fixture video L2Ryrr6txwA, attempt local cache first
    const cached = getCachedRawJson3(videoId, langCode);
    if (cached) {
      const parsed = parseJson3(cached);
      if (parsed) {
        onTracksChange({ ...(tracks || {}), [langCode]: parsed });
        addLog("success", `Loaded cached track '${langCode}' (${parsed.events?.length || 0} cues)`);
        setIsFetching(false);
        return;
      }
    }

    // Compose timedtext URL from base
    const baseTimedText =
      observedUrl || `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=json3`;
    let targetUrl = baseTimedText;
    try {
      const u = new URL(baseTimedText);
      if (fetchStrategy === "tlang") {
        u.searchParams.set("tlang", langCode);
      } else {
        u.searchParams.set("lang", langCode);
        u.searchParams.delete("tlang");
      }
      targetUrl = u.toString();
    } catch {
      targetUrl = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&tlang=${langCode}&fmt=json3`;
    }

    addLog("info", `Fetching from YouTube endpoint`, targetUrl);
    try {
      const res = await fetch(targetUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw = await res.text();
      const parsed = parseJson3(raw);
      if (!parsed || !parsed.events || parsed.events.length === 0) {
        throw new Error("Zero cues or invalid format");
      }
      cacheJson3Track(videoId, langCode, parsed);
      onTracksChange({ ...(tracks || {}), [langCode]: parsed });
      addLog("success", `Successfully fetched '${langCode}' (${parsed.events.length} cues)`);
    } catch (err: any) {
      addLog("warn", `Direct network query for '${langCode}' returned: ${err.message}.`);
    } finally {
      setIsFetching(false);
    }
  };

  // Clear cache for current video
  const handleClearCache = () => {
    clearVideoSubtitleCache(videoId);
    addLog("info", `Cleared subtitle cache for video ${videoId}`);
  };

  // Copy logs to clipboard
  const handleCopyLogs = () => {
    const text = logs
      .map((l) => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message} ${l.details || ""}`)
      .join("\n");
    navigator.clipboard?.writeText(text);
    setCopiedLog(true);
    setTimeout(() => setCopiedLog(false), 2000);
  };

  const filteredLogs = useMemo(() => {
    if (logFilter === "all") return logs;
    if (logFilter === "errors") return logs.filter((l) => l.level === "error" || l.level === "warn");
    if (logFilter === "cache") return logs.filter((l) => l.level === "cache");
    if (logFilter === "stats") return logs.filter((l) => l.level === "stats");
    return logs;
  }, [logs, logFilter]);

  const activeStats = baseLanguage ? statsMap[baseLanguage] : null;

  return (
    <div
      data-testid="fetched-subtitles-stage-panel"
      id="fetched-subtitles-stage-panel"
      className={`space-y-4 p-4 md:p-6 bg-card rounded-2xl border border-border shadow-xs ${className}`}
    >
      {/* 1. Header Overview & Current Translation Source */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/70">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
            <Subtitles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm md:text-base text-foreground flex items-center gap-2">
              <span>Fetched Subtitles &amp; Statistics</span>
              <Badge variant="outline" className="text-xs bg-cyan-500/10 border-cyan-500/30 text-cyan-600 dark:text-cyan-400">
                Stage 0: Acquisition &amp; Source
              </Badge>
            </h3>
            <p className="text-xs text-muted-foreground">
              Examine fetched subtitle streams, review sentence punctuation statistics, cache tracks, and select the translation source.
            </p>
          </div>
        </div>

        {/* Translation Source Status Badge */}
        <div className="flex items-center gap-2">
          <div
            data-testid="active-translation-source-badge"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/10 text-xs font-medium text-primary shadow-2xs"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
            <span>Translation Source:</span>
            <span className="font-bold uppercase tracking-wider underline">
              {baseLanguage || "None"}
            </span>
            {activeStats && (
              <span className="text-[10px] text-primary/80">
                ({activeStats.totalPunctuation} punct marks, {activeStats.cuesCount} cues)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Subtitle Fetching Controls Bar (Moved to this dedicated accordion) */}
      <div
        data-testid="subtitles-fetching-controls-container"
        className="p-3.5 rounded-xl border border-border/80 bg-muted/30 space-y-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Download className="h-3.5 w-3.5 text-primary" />
            <span>Fetch Subtitles &amp; TimedText Streams</span>
          </span>

          {onLoadSampleSubtitles && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onLoadSampleSubtitles}
              data-testid="btn-load-sample-subtitles"
              className="h-7 text-xs gap-1.5"
            >
              <FileCode className="h-3 w-3 text-cyan-500" />
              <span>Load Authentic Sample (L2Ryrr6txwA)</span>
            </Button>
          )}
        </div>

        {/* Video URL or ID Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (videoInput.trim()) {
              onSubmitVideoUrl(videoInput.trim());
              addLog("info", `Submitted video URL/ID: ${videoInput.trim()}`);
            }
          }}
          className="flex flex-wrap items-center gap-2"
        >
          <input
            id="stage-video-url-input"
            data-testid="stage-video-url-input"
            type="text"
            value={videoInput}
            onChange={(e) => onVideoInputChange(e.target.value)}
            placeholder="YouTube Video link or ID (e.g. L2Ryrr6txwA)"
            className="flex-1 min-w-[200px] h-8 rounded-lg border border-input bg-background px-3 text-xs focus:ring-1 focus:ring-primary outline-none"
          />
          <Button
            type="submit"
            size="sm"
            disabled={isFetching}
            data-testid="stage-btn-load-video"
            className="h-8 text-xs gap-1.5"
          >
            <Play className="h-3.5 w-3.5" />
            <span>Load Video</span>
          </Button>
        </form>

        {/* Direct Subtitle URL Input */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            id="stage-timedtext-url-input"
            data-testid="stage-timedtext-url-input"
            type="text"
            value={timedTextDirectUrl}
            onChange={(e) => setTimedTextDirectUrl(e.target.value)}
            placeholder="Paste direct youtube.com/api/timedtext?... URL"
            className="flex-1 min-w-[200px] h-8 rounded-lg border border-input bg-background px-3 text-xs font-mono text-[11px] focus:ring-1 focus:ring-primary outline-none"
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleFetchTimedTextDirect}
            disabled={isFetching || !timedTextDirectUrl.trim()}
            data-testid="stage-btn-fetch-timedtext-direct"
            className="h-8 text-xs gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Fetch TimedText URL</span>
          </Button>
        </div>

        {/* Strategy Selector & Quick Language Fetch Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/50">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-medium text-muted-foreground">Strategy:</span>
            <div className="inline-flex rounded-lg border border-border p-0.5 bg-background text-[11px]">
              <button
                type="button"
                onClick={() => setFetchStrategy("tlang")}
                className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                  fetchStrategy === "tlang"
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="tlang parameterization: requests YouTube's authentic translated captions"
              >
                tlang (Translation)
              </button>
              <button
                type="button"
                onClick={() => setFetchStrategy("lang")}
                className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                  fetchStrategy === "lang"
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="lang replacement: requests native language track directly"
              >
                lang (Direct Track)
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1">
            <span className="text-[11px] text-muted-foreground mr-1">Quick fetch:</span>
            {COMMON_FETCH_LANGUAGES.map((l) => (
              <Button
                key={l.code}
                type="button"
                variant={selectedQuickLang === l.code ? "secondary" : "ghost"}
                size="sm"
                onClick={() => handleQuickFetchLang(l.code)}
                data-testid={`quick-fetch-lang-${l.code}`}
                className="h-6 px-1.5 text-[11px] font-mono"
                title={`Fetch ${l.name} (${l.code})`}
              >
                {l.code}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Subtitles Info & Statistics Grid (Chapter 0) */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <FileCode className="h-3.5 w-3.5 text-cyan-500" />
            <span>Fetched Subtitle Tracks ({allTrackLangs.length}) &amp; Punctuation Statistics</span>
          </span>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClearCache}
              data-testid="stage-clear-cache-btn"
              className="h-7 text-xs gap-1 text-muted-foreground hover:text-destructive"
              title="Clear cached subtitles from local storage"
            >
              <Trash2 className="h-3 w-3" />
              <span>Clear Cache</span>
            </Button>
          </div>
        </div>

        {allTrackLangs.length === 0 ? (
          <div className="p-6 text-center rounded-xl border border-dashed border-border/80 bg-muted/20 space-y-2">
            <Subtitles className="h-8 w-8 mx-auto text-muted-foreground/60" />
            <p className="text-xs font-medium text-foreground">No Subtitles Fetched Yet</p>
            <p className="text-[11px] text-muted-foreground max-w-md mx-auto">
              Play the video above, turn on captions (CC), or click "Load Authentic Sample" to fetch and inspect subtitle streams.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {allTrackLangs.map((langCode) => {
              const meta = LANGS.find((l) => l.code === langCode);
              const langName = meta?.name || langCode.toUpperCase();
              const stats = statsMap[langCode] || {
                commas: 0,
                periods: 0,
                questionMarks: 0,
                exclamationMarks: 0,
                colons: 0,
                semicolons: 0,
                totalPunctuation: 0,
                cuesCount: 0,
                wordsCount: 0,
              };
              const isSelectedBase = baseLanguage === langCode;
              const isRecommended = recommendedLang === langCode && stats.totalPunctuation > 0;
              const cacheDetails = cacheDetailsMap[langCode];

              return (
                <div
                  key={langCode}
                  data-testid={`fetched-track-card-${langCode}`}
                  className={`p-3 rounded-xl border transition-all ${
                    isSelectedBase
                      ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary/40"
                      : isRecommended
                        ? "border-cyan-500/60 bg-cyan-500/5 hover:border-cyan-500"
                        : "border-border hover:border-border/80 bg-card hover:bg-muted/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-bold text-sm text-foreground truncate">
                        {langName}
                      </span>
                      <span className="text-xs font-mono text-muted-foreground px-1.5 py-0.5 rounded bg-muted">
                        {langCode}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isRecommended && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 gap-1 px-1.5 py-0"
                          title="Highest punctuation count - recommended as translation base track"
                        >
                          <Sparkles className="h-2.5 w-2.5 text-amber-500" />
                          <span>Recommended</span>
                        </Badge>
                      )}
                      {isSelectedBase && (
                        <Badge
                          variant="default"
                          className="text-[10px] gap-1 px-1.5 py-0"
                          title="Currently active translation source"
                        >
                          <Check className="h-2.5 w-2.5" />
                          <span>Source</span>
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Statistics Breakdown */}
                  <div className="grid grid-cols-2 gap-1.5 p-2 rounded-lg bg-background/60 border border-border/50 text-[11px] mb-2.5">
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>Cues:</span>
                      <span className="font-semibold text-foreground font-mono">
                        {stats.cuesCount}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>Words:</span>
                      <span className="font-semibold text-foreground font-mono">
                        {stats.wordsCount}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>Periods (.):</span>
                      <span className="font-semibold text-foreground font-mono">
                        {stats.periods}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>Commas (,):</span>
                      <span className="font-semibold text-foreground font-mono">
                        {stats.commas}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-muted-foreground col-span-2 pt-1 border-t border-border/40">
                      <span className="font-medium text-foreground">Total Punctuation:</span>
                      <span className="font-bold text-primary font-mono text-xs">
                        {stats.totalPunctuation}
                      </span>
                    </div>
                  </div>

                  {/* Cache info & Action */}
                  <div className="flex flex-wrap items-center justify-between gap-1.5 text-[10px] text-muted-foreground mb-2">
                    <span className="flex items-center gap-1">
                      <HardDrive className="h-3 w-3 text-cyan-500 shrink-0" />
                      <button
                        type="button"
                        data-testid={`cached-file-link-${langCode}`}
                        onClick={() => {
                          let fileContent = "";
                          const rawStored = getCachedRawJson3(videoId, langCode);
                          if (rawStored) {
                            try {
                              fileContent = JSON.stringify(JSON.parse(rawStored), null, 2);
                            } catch {
                              fileContent = rawStored;
                            }
                          } else if (tracks && tracks[langCode]) {
                            fileContent = JSON.stringify(tracks[langCode], null, 2);
                          } else {
                            fileContent = JSON.stringify({ events: [] }, null, 2);
                          }

                          const cleanLang = langCode.trim().toLowerCase().split("-")[0];
                          const storageKey = `yt_sub_cache_raw_${videoId}_${cleanLang}`;

                          setViewingCachedTrack({
                            langCode,
                            langName,
                            content: fileContent,
                            byteSize: cacheDetails?.byteSize || fileContent.length,
                            isFixture: Boolean(cacheDetails?.isFixture),
                            cuesCount: stats.cuesCount,
                            storageKey,
                          });
                          setCopiedCachedContent(false);
                          addLog(
                            "info",
                            `Opened cached subtitle file for '${langName}' (${langCode})`,
                            `Size: ${Math.round((cacheDetails?.byteSize || fileContent.length) / 1024)} KB, Cues: ${stats.cuesCount}`,
                          );
                        }}
                        className="cursor-pointer text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 underline underline-offset-2 font-medium transition-colors focus:outline-hidden focus:ring-1 focus:ring-cyan-500 rounded px-0.5"
                        title={`Click to view, copy, or download cached subtitles for ${langName} (${langCode})`}
                      >
                        {cacheDetails?.isCached
                          ? `Cached (${Math.round((cacheDetails.byteSize || 1024) / 1024)} KB)`
                          : "In Memory"}
                      </button>
                    </span>
                    {cacheDetails?.isFixture && (
                      <span className="text-amber-600 dark:text-amber-400 font-medium">
                        [Fixture]
                      </span>
                    )}
                  </div>

                  {/* 1-Click Translation Source Selector */}
                  <Button
                    type="button"
                    variant={isSelectedBase ? "default" : "outline"}
                    size="sm"
                    data-testid={`select-translation-source-${langCode}`}
                    onClick={() => {
                      onSelectBaseLanguage(langCode);
                      addLog(
                        "info",
                        `User set '${langCode}' as active translation source`,
                        `Subtitles table view will reactively re-align rows to '${langCode}'.`,
                      );
                    }}
                    className={`w-full h-7 text-xs gap-1.5 ${
                      isSelectedBase
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "hover:bg-primary/10 hover:text-primary hover:border-primary/50"
                    }`}
                  >
                    {isSelectedBase ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Active Translation Source</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5 text-cyan-500" />
                        <span>Use as Translation Source</span>
                      </>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Subtitles Parsing Quarantine Banner (Chapter 2) */}
      <div
        data-testid="parser-quarantine-status-card"
        className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs text-foreground flex flex-wrap items-center justify-between gap-2 shadow-2xs"
      >
        <div className="flex items-center gap-2.5">
          <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-emerald-800 dark:text-emerald-200">
                Inner Subtitles Parser: Quarantined &amp; Disabled by Default
              </span>
              <Badge variant="outline" className="text-[10px] bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 border-emerald-500/40">
                Natural Punctuation Active
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              YouTube translation tracks are natively punctuated at sentence boundaries. The app uses YouTube's authentic punctuation as the translation source directly, eliminating unnecessary inner parsing.
            </p>
          </div>
        </div>

        {onToggleInnerParserQuarantine && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onToggleInnerParserQuarantine(!innerParserQuarantined)}
            data-testid="toggle-parser-quarantine-btn"
            className="h-7 text-xs text-muted-foreground hover:text-foreground"
          >
            {innerParserQuarantined ? "Enable Parser (Experimental)" : "Quarantine Parser"}
          </Button>
        )}
      </div>

      {/* 5. Real-Time Activity & Network Log Element (Chapter 3 - youtube-subtitles-fetcher style) */}
      <div
        data-testid="subtitles-fetcher-terminal-log"
        className="rounded-xl border border-slate-800 bg-slate-950 text-slate-100 shadow-md overflow-hidden font-mono text-xs"
      >
        {/* Terminal Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80 inline-block" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80 inline-block" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80 inline-block" />
            </div>
            <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5 ml-1">
              <Terminal className="h-3 w-3 text-cyan-400" />
              <span>youtube-subtitles-fetcher / live-logs</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="inline-flex rounded-md bg-slate-800/80 p-0.5 text-[10px]">
              {(["all", "errors", "cache", "stats"] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setLogFilter(filter)}
                  data-testid={`terminal-filter-${filter}`}
                  className={`px-1.5 py-0.5 rounded capitalize transition-colors ${
                    logFilter === filter
                      ? "bg-cyan-500/20 text-cyan-300 font-bold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCopyLogs}
              data-testid="terminal-copy-logs-btn"
              className="h-6 px-1.5 text-[10px] text-slate-400 hover:text-slate-100 hover:bg-slate-800 gap-1"
            >
              <Copy className="h-3 w-3" />
              <span>{copiedLog ? "Copied" : "Copy"}</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => clearSubtitleFetchLogs()}
              data-testid="terminal-clear-logs-btn"
              className="h-6 px-1.5 text-[10px] text-slate-400 hover:text-slate-100 hover:bg-slate-800 gap-1"
            >
              <Trash2 className="h-3 w-3" />
              <span>Clear</span>
            </Button>
          </div>
        </div>

        {/* Terminal Body */}
        <div
          data-testid="terminal-logs-body"
          className="p-3 max-h-52 overflow-y-auto space-y-1.5 text-[11px] leading-relaxed selection:bg-cyan-900 selection:text-cyan-100"
        >
          {filteredLogs.length === 0 ? (
            <div className="text-slate-500 italic py-2">No log entries matching filter.</div>
          ) : (
            filteredLogs.map((log) => {
              const levelColor =
                log.level === "success"
                  ? "text-emerald-400 bg-emerald-950/60 border-emerald-800/60"
                  : log.level === "error"
                    ? "text-rose-400 bg-rose-950/60 border-rose-800/60"
                    : log.level === "warn"
                      ? "text-amber-400 bg-amber-950/60 border-amber-800/60"
                      : log.level === "stats"
                        ? "text-cyan-300 bg-cyan-950/60 border-cyan-800/60"
                        : "text-slate-400 bg-slate-900 border-slate-800";

              return (
                <div key={log.id} className="flex items-start gap-2 group hover:bg-slate-900/50 p-0.5 rounded">
                  <span className="text-slate-600 select-none text-[10px] shrink-0 mt-0.5">
                    [{log.timestamp}]
                  </span>
                  <span
                    className={`text-[9px] uppercase font-bold px-1 py-0.2 rounded border shrink-0 ${levelColor}`}
                  >
                    {log.level}
                  </span>
                  <span className="text-slate-200 break-all flex-1">
                    {log.message}
                    {log.details && (
                      <span className="text-slate-400 block text-[10px] mt-0.5 font-normal">
                        └ {log.details}
                      </span>
                    )}
                  </span>
                </div>
              );
            })
          )}
          <div ref={terminalEndRef} />
        </div>
      </div>

      {/* 6. Navigation Actions to Proceed to Next Stages */}
      {onProceedToStage && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border/70">
          <span className="text-xs text-muted-foreground">
            Stage 0 Complete. Ready to configure learning goals or inspect the subtitles table.
          </span>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onProceedToStage(1)}
              data-testid="stage-0-to-stage-1-btn"
              className="text-xs gap-1.5"
            >
              <span>Stage 1: Learning Goals</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => onProceedToStage(2)}
              data-testid="stage-0-to-stage-2-btn"
              className="text-xs gap-1.5"
            >
              <span>Stage 2: Subtitles Table</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* 7. Cached Subtitle File Viewer & Inspector Modal */}
      {viewingCachedTrack && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Cached Subtitle File: ${viewingCachedTrack.langName}`}
          data-testid="cached-file-viewer-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => setViewingCachedTrack(null)}
        >
          <div
            className="w-full max-w-3xl max-h-[85vh] bg-card border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2 min-w-0">
                <FileCode className="h-4 w-4 text-cyan-500 shrink-0" />
                <span className="font-bold text-sm text-foreground truncate">
                  Cached File: {viewingCachedTrack.langName} ({viewingCachedTrack.langCode})
                </span>
                {viewingCachedTrack.isFixture && (
                  <Badge variant="outline" className="text-[10px] text-amber-600 dark:text-amber-400 border-amber-500/30">
                    Fixture
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  data-testid="download-cached-file-btn"
                  onClick={() => {
                    const blob = new Blob([viewingCachedTrack.content], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `subtitles_${videoId || "video"}_${viewingCachedTrack.langCode}.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    addLog(
                      "success",
                      `Downloaded cached subtitles file for '${viewingCachedTrack.langName}'`,
                      `Filename: subtitles_${videoId || "video"}_${viewingCachedTrack.langCode}.json`,
                    );
                  }}
                  className="h-7 text-xs gap-1"
                  title="Download raw JSON3 file"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download JSON</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  data-testid="copy-cached-file-btn"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(viewingCachedTrack.content);
                      setCopiedCachedContent(true);
                      setTimeout(() => setCopiedCachedContent(false), 2000);
                      addLog(
                        "success",
                        `Copied cached subtitles JSON for '${viewingCachedTrack.langName}' to clipboard`,
                      );
                    } catch {}
                  }}
                  className="h-7 text-xs gap-1"
                  title="Copy full JSON3 content to clipboard"
                >
                  {copiedCachedContent ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-emerald-500">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  data-testid="close-cached-file-modal-btn"
                  onClick={() => setViewingCachedTrack(null)}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                  title="Close modal"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Modal Metadata Sub-header */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 bg-muted/10 border-b border-border/60 text-[11px] text-muted-foreground font-mono">
              <div className="flex items-center gap-3">
                <span>Cues: <strong className="text-foreground">{viewingCachedTrack.cuesCount}</strong></span>
                <span>Size: <strong className="text-foreground">{(viewingCachedTrack.byteSize / 1024).toFixed(1)} KB</strong></span>
                {viewingCachedTrack.storageKey && (
                  <span className="truncate max-w-xs" title={`localStorage key: ${viewingCachedTrack.storageKey}`}>
                    Key: <code className="text-cyan-600 dark:text-cyan-400">{viewingCachedTrack.storageKey}</code>
                  </span>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground">Format: YouTube JSON3 timedtext</span>
            </div>

            {/* Modal Body: Code view */}
            <div className="flex-1 overflow-auto p-3 bg-slate-950 font-mono text-[11px] text-slate-200 select-text">
              <pre data-testid="cached-file-content-pre" className="whitespace-pre-wrap break-all leading-relaxed">
                {viewingCachedTrack.content}
              </pre>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-muted/20 text-xs">
              <span className="text-muted-foreground text-[11px]">
                Click outside or press Escape / close button to return to Stage 0.
              </span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setViewingCachedTrack(null)}
                className="h-7 text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
