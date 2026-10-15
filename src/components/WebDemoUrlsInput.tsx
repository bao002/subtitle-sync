import { useState, useCallback, useId } from "react";
import { Button } from "./ui/button";
import { parseVideoId, parseJson3 } from "../lib/native-captions";
import { isValidJsonSubtitleResponse } from "../utils/subtitleCache";
import { fetchViaServer } from "../lib/subtitle-fetch-plan";
import serverConfig from "../config/server.json";
import { Json3 } from "../types";
import { ExternalLink, RefreshCw, CheckCircle2, AlertCircle, FileText, Globe } from "lucide-react";

export interface WebDemoUrlsInputProps {
  currentVideoId: string;
  observedUrl?: string;
  onLoadVideoAndSubtitles: (payload: {
    videoId: string;
    tracks: Record<string, Json3>;
    observedUrl?: string;
  }) => void;
  className?: string;
}

interface ParsedUrlEntry {
  lang: string;
  url: string;
}

const COMMON_DEMO_LANGS = [
  { code: "en", name: "English" },
  { code: "he", name: "Hebrew (עברית)" },
  { code: "es", name: "Spanish (Español)" },
  { code: "de", name: "German (Deutsch)" },
  { code: "fr", name: "French (Français)" },
  { code: "it", name: "Italian (Italiano)" },
  { code: "ar", name: "Arabic (العربية)" },
  { code: "ru", name: "Russian (Русский)" },
];

export function WebDemoUrlsInput({
  currentVideoId,
  observedUrl: initialObservedUrl,
  onLoadVideoAndSubtitles,
  className = "",
}: WebDemoUrlsInputProps) {
  const formId = useId();
  const [videoUrlInput, setVideoUrlInput] = useState(
    currentVideoId ? `https://www.youtube.com/watch?v=${currentVideoId}` : "",
  );
  const [subtitlesUrlsInput, setSubtitlesUrlsInput] = useState(
    initialObservedUrl ||
      `/fixtures/${currentVideoId || "L2Ryrr6txwA"}/en.json\n/fixtures/${currentVideoId || "L2Ryrr6txwA"}/he.json`,
  );
  const [selectedLangs, setSelectedLangs] = useState<string[]>(["en", "he"]);
  const [isFetching, setIsFetching] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<"info" | "success" | "error">("info");
  const [isExpanded, setIsExpanded] = useState(true);

  // Helper to extract language code from a line or URL
  const extractLangFromLine = useCallback((line: string, index: number): ParsedUrlEntry | null => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return null;

    // 1. Explicit prefix format: "lang: url" or "lang=url"
    const prefixMatch = trimmed.match(/^([a-z]{2,3}(?:-[A-Za-z0-9]+)?)\s*[:=]\s*(https?:\/\/.+|\/.+)$/i);
    if (prefixMatch) {
      return { lang: prefixMatch[1].toLowerCase(), url: prefixMatch[2].trim() };
    }

    // 2. Timedtext URL format: extract `lang=` or `tlang=` parameter
    try {
      const parsedUrl = new URL(trimmed, window.location.origin);
      const tlang = parsedUrl.searchParams.get("tlang");
      const lang = parsedUrl.searchParams.get("lang");
      if (tlang) return { lang: tlang.toLowerCase(), url: trimmed };
      if (lang) return { lang: lang.toLowerCase(), url: trimmed };

      // 3. File path format: e.g. /fixtures/VIDEO_ID/he.json or https://.../he.json
      const pathMatch = parsedUrl.pathname.match(/\/([a-z]{2,3}(?:-[A-Za-z0-9]+)?)\.json$/i);
      if (pathMatch) return { lang: pathMatch[1].toLowerCase(), url: trimmed };
    } catch {
      // not a standard URL, continue
    }

    // Fallback: assign from selectedLangs order if available
    const fallbackLang = COMMON_DEMO_LANGS[index % COMMON_DEMO_LANGS.length].code;
    return { lang: fallbackLang, url: trimmed };
  }, []);

  const handleFetchSubtitles = useCallback(async () => {
    const extractedVideoId = parseVideoId(videoUrlInput);
    if (!extractedVideoId) {
      setStatusType("error");
      setStatusMessage("Please enter a valid YouTube video URL or ID.");
      return;
    }

    const trimmedSubtitlesInput = subtitlesUrlsInput.trim();
    if (!trimmedSubtitlesInput) {
      onLoadVideoAndSubtitles({
        videoId: extractedVideoId,
        tracks: {},
      });
      setStatusType("info");
      setStatusMessage(`Video ${extractedVideoId} loaded. Enter subtitle URLs below to fetch captions.`);
      return;
    }

    setIsFetching(true);
    setStatusType("info");
    setStatusMessage("Fetching and validating subtitle streams per language…");

    const lines = trimmedSubtitlesInput.split("\n").map((l) => l.trim()).filter(Boolean);
    const entriesToFetch: ParsedUrlEntry[] = [];

    // Check if input is a single timedtext URL template
    const isSingleTimedtextBase =
      lines.length === 1 && lines[0].includes("youtube.com/api/timedtext");

    if (isSingleTimedtextBase) {
      const baseUrl = lines[0];
      try {
        const u = new URL(baseUrl);
        const originalLang = u.searchParams.get("lang") || "en";

        for (const targetCode of selectedLangs) {
          const derived = new URL(baseUrl);
          if (targetCode === originalLang) {
            derived.searchParams.set("lang", targetCode);
            derived.searchParams.delete("tlang");
          } else {
            // translation mode
            derived.searchParams.set("lang", originalLang);
            derived.searchParams.set("tlang", targetCode);
          }
          entriesToFetch.push({ lang: targetCode, url: derived.toString() });
        }
      } catch {
        entriesToFetch.push({ lang: "en", url: baseUrl });
      }
    } else {
      for (let i = 0; i < lines.length; i++) {
        const parsed = extractLangFromLine(lines[i], i);
        if (parsed) entriesToFetch.push(parsed);
      }
    }

    if (entriesToFetch.length === 0) {
      setIsFetching(false);
      setStatusType("error");
      setStatusMessage("Could not parse any valid subtitle URLs from input.");
      return;
    }

    const loadedTracks: Record<string, Json3> = {};
    const successLangs: string[] = [];
    const failedLangs: string[] = [];
    const serverUrl = serverConfig.server_address || "";

    for (const entry of entriesToFetch) {
      try {
        let text = "";
        let parsed: Json3 | null = null;

        // 1. Try direct fetch first
        try {
          const res = await fetch(entry.url);
          if (res.ok) {
            text = await res.text();
            parsed = parseJson3(text);
          }
        } catch {
          // Direct fetch failed (e.g. CORS on browser)
        }

        // 2. If direct fetch failed and URL is a YouTube timedtext URL, use the server proxy
        if (!parsed && entry.url.includes("youtube.com/api/timedtext") && serverUrl) {
          const proxyRes = await fetchViaServer(serverUrl, entry.url);
          if (proxyRes.status === 200 && proxyRes.body) {
            text = proxyRes.body;
            parsed = parseJson3(text);
          }
        }

        if (parsed && isValidJsonSubtitleResponse(parsed)) {
          loadedTracks[entry.lang] = parsed;
          successLangs.push(entry.lang);
        } else {
          failedLangs.push(entry.lang);
        }
      } catch {
        failedLangs.push(entry.lang);
      }
    }

    setIsFetching(false);

    if (successLangs.length > 0) {
      setStatusType("success");
      const summary = successLangs
        .map((l) => `${l.toUpperCase()} (${loadedTracks[l]?.events?.length || 0} cues)`)
        .join(", ");
      setStatusMessage(
        `Successfully loaded ${successLangs.length} subtitle track${successLangs.length > 1 ? "s" : ""}: ${summary}${
          failedLangs.length > 0 ? ` (Failed: ${failedLangs.join(", ")})` : ""
        }`,
      );

      onLoadVideoAndSubtitles({
        videoId: extractedVideoId,
        tracks: loadedTracks,
        observedUrl: lines[0]?.startsWith("http") ? lines[0] : undefined,
      });
    } else {
      setStatusType("error");
      setStatusMessage(
        `Failed to fetch valid JSON3 subtitles from provided URLs. Ensure URLs return valid YouTube json3 timedtext or local fixtures.`,
      );
    }
  }, [
    videoUrlInput,
    subtitlesUrlsInput,
    selectedLangs,
    extractLangFromLine,
    onLoadVideoAndSubtitles,
  ]);

  const handleUseSampleFixtures = useCallback(() => {
    const sampleId = "L2Ryrr6txwA";
    setVideoUrlInput(`https://www.youtube.com/watch?v=${sampleId}`);
    setSubtitlesUrlsInput(
      `/fixtures/${sampleId}/en.json\n/fixtures/${sampleId}/he.json\n/fixtures/${sampleId}/es.json\n/fixtures/${sampleId}/de.json`,
    );
    setSelectedLangs(["en", "he", "es", "de"]);
    setStatusType("info");
    setStatusMessage("Populated sample local fixtures (English, Hebrew, Spanish, German). Click 'Fetch Subtitles per Language' to load.");
  }, []);

  const handleToggleLang = (code: string) => {
    setSelectedLangs((prev) =>
      prev.includes(code)
        ? prev.length > 1
          ? prev.filter((c) => c !== code)
          : prev
        : [...prev, code],
    );
  };

  return (
    <div
      className={`rounded-xl border border-border bg-card p-4 shadow-sm text-card-foreground ${className}`}
      data-testid="web-demo-urls-input-container"
    >
      <div className="flex items-center justify-between pb-2 border-b border-border/60 mb-3">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">
            Web Demo: Provide Video & Subtitle URLs per Language
          </h3>
          <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">
            Web Mode
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="text-xs text-muted-foreground hover:text-foreground underline"
          aria-expanded={isExpanded}
        >
          {isExpanded ? "Collapse" : "Expand"}
        </button>
      </div>

      {isExpanded && (
        <form
          id={formId}
          onSubmit={(e) => {
            e.preventDefault();
            handleFetchSubtitles();
          }}
          className="space-y-3"
        >
          {/* Video URL Input */}
          <div>
            <label
              htmlFor="youtube-url-input"
              className="block text-xs font-medium text-muted-foreground mb-1"
            >
              1. YouTube Video URL or Video ID:
            </label>
            <div className="flex gap-2">
              <input
                id="youtube-url-input"
                data-testid="youtube-url-input"
                type="text"
                value={videoUrlInput}
                onChange={(e) => setVideoUrlInput(e.target.value)}
                placeholder="e.g. https://www.youtube.com/watch?v=L2Ryrr6txwA or video ID"
                className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <Button
                id="play-video-button"
                data-testid="play-video-button"
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const extractedVideoId = parseVideoId(videoUrlInput);
                  if (extractedVideoId) {
                    onLoadVideoAndSubtitles({
                      videoId: extractedVideoId,
                      tracks: {},
                    });
                    setStatusType("info");
                    setStatusMessage(`Loaded video ${extractedVideoId}.`);
                  } else {
                    setStatusType("error");
                    setStatusMessage("Please enter a valid YouTube video URL or ID.");
                  }
                }}
              >
                Load video only
              </Button>
            </div>
          </div>

          {/* Subtitles URLs Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="web-demo-subtitles-urls-input"
                className="block text-xs font-medium text-muted-foreground"
              >
                2. Subtitle URLs Input (one per line, timedtext base URL or per-language URLs):
              </label>
              <button
                type="button"
                onClick={handleUseSampleFixtures}
                className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
              >
                <FileText className="w-3 h-3" /> Load Sample Fixtures
              </button>
            </div>
            <textarea
              id="web-demo-subtitles-urls-input"
              data-testid="web-demo-subtitles-urls-input"
              rows={3}
              value={subtitlesUrlsInput}
              onChange={(e) => setSubtitlesUrlsInput(e.target.value)}
              placeholder="Paste one or more URLs (e.g. /fixtures/L2Ryrr6txwA/en.json, https://www.youtube.com/api/timedtext?..., or lang: url)"
              className="w-full font-mono text-xs rounded-md border border-input bg-background p-2.5 focus:outline-none focus:ring-1 focus:ring-ring resize-y"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Supports relative fixture paths, signed timedtext URLs (proxy supported), or per-language format (<code>en: https://...</code>).
            </p>
          </div>

          {/* Target Languages Chips for Base URL mode */}
          <div>
            <span className="block text-xs font-medium text-muted-foreground mb-1.5">
              Target Languages to Fetch:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_DEMO_LANGS.map((lang) => {
                const isSelected = selectedLangs.includes(lang.code);
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleToggleLang(lang.code)}
                    className={`text-xs px-2 py-1 rounded-md border transition-colors ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary font-medium"
                        : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"
                    }`}
                  >
                    {lang.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Button & Status Feedback */}
          <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Button
              id="fetch-web-demo-subtitles-button"
              data-testid="fetch-web-demo-subtitles-button"
              type="submit"
              disabled={isFetching}
              className="flex-1 sm:flex-initial"
            >
              {isFetching ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Fetching Subtitles…
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Fetch Subtitles per Language
                </>
              )}
            </Button>
          </div>

          {/* Live Feedback Banner */}
          {statusMessage && (
            <div
              data-testid="web-demo-status-banner"
              className={`p-2.5 rounded-lg text-xs flex items-start gap-2 border ${
                statusType === "success"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800"
                  : statusType === "error"
                    ? "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-800"
                    : "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-200 dark:border-blue-800"
              }`}
            >
              {statusType === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              ) : statusType === "error" ? (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              ) : (
                <RefreshCw className="w-4 h-4 shrink-0 text-blue-600 animate-spin mt-0.5" />
              )}
              <div className="flex-1 leading-relaxed">{statusMessage}</div>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
