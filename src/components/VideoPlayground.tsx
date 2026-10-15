import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Eye,
  Gauge,
  Info,
  Play,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Subtitles,
  Tv,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LANGS, type Json3 } from "@/lib/subtitles";
import { parseVideoId } from "@/lib/native-captions";

export interface DetectedSubtitleTrack {
  lang: string;
  langName: string;
  json: Json3;
  rawData: string;
  url: string;
  timestamp: number;
  cuesCount: number;
}

export interface VideoPlaygroundProps {
  videoId: string;
  onVideoIdChange: (newVideoId: string) => void;
  detectedTracks: Record<string, DetectedSubtitleTrack>;
  onImportTrack: (lang: string, json: Json3, rawData: string, setAsTarget?: boolean) => void;
  existingTrackLanguages: string[];
  onSwitchToViewerTab?: () => void;
  onSwitchToViewerAtTime?: (timeSec: number) => void;
  isAndroid?: boolean;
  observedUrl?: string;
}

export const PLAYGROUND_PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

export function VideoPlayground({
  videoId,
  onVideoIdChange,
  detectedTracks,
  onImportTrack,
  existingTrackLanguages,
  onSwitchToViewerTab,
  onSwitchToViewerAtTime,
  isAndroid = false,
  observedUrl = "",
}: VideoPlaygroundProps) {
  const [videoInput, setVideoInput] = useState(videoId);
  const [playerIframeKey, setPlayerIframeKey] = useState(0);
  const [previewTrackLang, setPreviewTrackLang] = useState<string | null>(null);
  const [justImportedLang, setJustImportedLang] = useState<string | null>(null);
  const [copiedTrackLang, setCopiedTrackLang] = useState<string | null>(null);
  const [currentPlaybackRate, setCurrentPlaybackRate] = useState<number>(1);
  const [handoffTimeInput, setHandoffTimeInput] = useState<string>("0");
  const [activePlayerStatus, setActivePlayerStatus] = useState<string>("Ready");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Sync video input if prop changes
  useEffect(() => {
    setVideoInput(videoId);
  }, [videoId]);

  const sortedDetectedTracks = useMemo(() => {
    return Object.values(detectedTracks).sort((a, b) => b.timestamp - a.timestamp);
  }, [detectedTracks]);

  const handleLoadVideo = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseVideoId(videoInput);
    if (parsed) {
      onVideoIdChange(parsed);
      setPlayerIframeKey((prev) => prev + 1);
      setActivePlayerStatus(`Loaded video ${parsed}`);
    }
  };

  const handleReloadPlayer = () => {
    setPlayerIframeKey((prev) => prev + 1);
    setActivePlayerStatus("Player reloaded");
  };

  const handleSetPlaybackRate = (rate: number) => {
    setCurrentPlaybackRate(rate);
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({
          event: "command",
          func: "setPlaybackRate",
          args: [rate],
        }),
        "*",
      );
    }
    setActivePlayerStatus(`Speed: ${rate}x`);
  };

  const handleImport = (lang: string, json: Json3, rawData: string) => {
    onImportTrack(lang, json, rawData, true);
    setJustImportedLang(lang);
    setTimeout(() => {
      setJustImportedLang(null);
    }, 3000);
  };

  const handleCopyJson = (track: DetectedSubtitleTrack) => {
    const payload = track.rawData || JSON.stringify(track.json, null, 2);
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(payload);
      setCopiedTrackLang(track.lang);
      setTimeout(() => setCopiedTrackLang(null), 2500);
    }
  };

  const handleDownloadJson = (track: DetectedSubtitleTrack) => {
    const payload = track.rawData || JSON.stringify(track.json, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `youtube-${videoId}-${track.lang}-timedtext.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleHandoffToViewer = (timeSec?: number) => {
    const sec = timeSec !== undefined ? timeSec : parseFloat(handoffTimeInput) || 0;
    if (onSwitchToViewerAtTime) {
      onSwitchToViewerAtTime(sec);
    } else if (onSwitchToViewerTab) {
      onSwitchToViewerTab();
    }
  };

  // Preview track cues
  const previewCues = useMemo(() => {
    if (!previewTrackLang || !detectedTracks[previewTrackLang]) return null;
    const track = detectedTracks[previewTrackLang];
    return track.json.events
      ?.filter((ev) => ev.segs && ev.segs.some((s) => s.utf8 && s.utf8.trim().length > 0))
      .slice(0, 6)
      .map((ev, idx) => ({
        id: idx,
        startMs: ev.tStartMs || 0,
        text:
          ev.segs
            ?.map((s) => s.utf8)
            .join("")
            .trim() || "",
      }));
  }, [previewTrackLang, detectedTracks]);

  const embedUrl = useMemo(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    // Embed params: enablejsapi=1, cc_load_policy=1 to show CC button prominently, playsinline=1
    return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&playsinline=1&rel=0&origin=${encodeURIComponent(
      origin,
    )}&widget_referrer=${encodeURIComponent(origin)}`;
  }, [videoId]);

  return (
    <div
      id="video-playground-container"
      data-testid="video-playground-container"
      className="space-y-6 p-4 md:p-6 max-w-6xl mx-auto"
    >
      {/* Overview & Instructions Card */}
      <div className="rounded-xl border border-border bg-card p-4 md:p-5 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Tv className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Independent Video Playground</h2>
              <p className="text-xs text-muted-foreground">
                Completely decoupled from automated section pauses, seeking, and TTS speech
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400"
              title="Caption Interceptor Active"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Interceptor Listening
            </span>
            <Button
              id="playground-reload-player-btn"
              data-testid="playground-reload-player-btn"
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReloadPlayer}
              className="gap-1.5 text-xs h-8"
              title="Reload the YouTube player iframe cleanly"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reload Player
            </Button>
          </div>
        </div>

        {/* Informative Guidance */}
        <div className="rounded-lg border border-border/80 bg-muted/40 p-3.5 text-xs text-muted-foreground space-y-2">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1 leading-relaxed">
              <p className="font-medium text-foreground">
                Why use Playground to discover and switch subtitles?
              </p>
              <p>
                In the regular Parallel Viewer, the player is actively controlled by interval
                timers, auto-pause loops, and audio speech coordination. This can make it tricky to
                open the player menu and switch subtitle tracks.
              </p>
              <p className="pt-1">
                <span className="font-semibold text-foreground">Quick Instructions:</span> 1. Start
                the video below &nbsp;·&nbsp; 2. Click the{" "}
                <span className="font-semibold text-foreground">CC</span> button or{" "}
                <span className="font-semibold text-foreground">
                  Settings ⚙️ &rarr; Subtitles/CC
                </span>{" "}
                in the YouTube player &nbsp;·&nbsp; 3. Choose any language &nbsp;·&nbsp; 4. The app
                intercepts YouTube&apos;s subtitle request and displays it in the{" "}
                <span className="font-semibold text-foreground">Detected Subtitles</span> panel
                below with 1-click import and timestamp synchronization!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Video URL Input & Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <form
          id="playground-url-form"
          data-testid="playground-url-form"
          onSubmit={handleLoadVideo}
          className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-card p-1.5 shadow-sm min-w-[280px]"
        >
          <input
            id="playground-video-input"
            data-testid="playground-video-input"
            aria-label="Playground YouTube video URL or ID"
            value={videoInput}
            onChange={(e) => setVideoInput(e.target.value)}
            placeholder="Paste YouTube link or video ID..."
            className="min-w-0 flex-1 rounded border-0 bg-transparent px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <Button
            id="playground-load-video-btn"
            data-testid="playground-load-video-btn"
            type="submit"
            size="sm"
            className="h-8 text-xs"
          >
            Load in Playground
          </Button>
        </form>

        {/* Timestamp Handoff to Viewer */}
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-1.5 shadow-sm">
          <Clock className="h-4 w-4 text-muted-foreground ml-1 shrink-0" />
          <input
            id="playground-handoff-time-input"
            data-testid="playground-handoff-time-input"
            aria-label="Target timestamp in seconds to hand off to viewer"
            type="number"
            min="0"
            step="1"
            value={handoffTimeInput}
            onChange={(e) => setHandoffTimeInput(e.target.value)}
            className="w-16 rounded border border-border/80 bg-background px-2 py-0.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-primary font-mono"
            placeholder="sec"
            title="Timestamp in seconds to open in Parallel Viewer"
          />
          <span className="text-[11px] text-muted-foreground">sec</span>
          <Button
            id="jump-to-viewer-btn"
            data-testid="jump-to-viewer-btn"
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => handleHandoffToViewer()}
            className="gap-1.5 h-8 text-xs shrink-0"
            title="Open Parallel Viewer positioned at this timestamp"
          >
            <span>Open in Viewer</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Video Player & Interception Grid */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Independent Player Column */}
        <div className="lg:col-span-7 space-y-3">
          <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-black shadow-md">
            <iframe
              key={playerIframeKey}
              ref={iframeRef}
              id="playground-youtube-iframe"
              data-testid="playground-youtube-iframe"
              src={embedUrl}
              title={`YouTube Video Playground - ${videoId}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="h-full w-full border-0"
            />
          </div>

          {/* Player Toolbar: Playback Speed Selector & Status */}
          <div className="rounded-xl border border-border bg-card p-3 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Gauge className="h-3.5 w-3.5 text-primary" />
                Speed:
              </span>
              <div
                id="playground-playback-speed-group"
                data-testid="playground-playback-speed-group"
                className="flex items-center gap-1"
              >
                {PLAYGROUND_PLAYBACK_RATES.map((rate) => {
                  const isActive = currentPlaybackRate === rate;
                  return (
                    <Button
                      key={rate}
                      id={`playback-speed-btn-${rate}`}
                      data-testid={`playback-speed-btn-${rate}`}
                      type="button"
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleSetPlaybackRate(rate)}
                      className={`h-7 px-2 text-xs font-mono ${
                        isActive ? "font-bold shadow-sm" : "text-muted-foreground hover:text-foreground"
                      }`}
                      title={`Set video playback speed to ${rate}x`}
                    >
                      {rate}x
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <span>Status:</span>
              <span
                id="playground-player-status"
                data-testid="playground-player-status"
                className="font-mono font-medium text-foreground"
              >
                {activePlayerStatus}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
            <span>
              Video ID: <strong className="font-mono text-foreground">{videoId}</strong>
            </span>
            <span>
              {isAndroid ? "Android Native Bridge Interceptor" : "Web Captions Interceptor"}
            </span>
          </div>
        </div>

        {/* Detected Subtitles Panel Column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Subtitles className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">Detected Subtitle Tracks</h3>
              </div>
              <span
                id="detected-tracks-count-badge"
                data-testid="detected-tracks-count-badge"
                className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-mono font-semibold text-primary"
              >
                {sortedDetectedTracks.length} detected
              </span>
            </div>

            {sortedDetectedTracks.length === 0 ? (
              <div
                id="no-detected-tracks-message"
                data-testid="no-detected-tracks-message"
                className="rounded-lg border border-dashed border-border/80 p-6 text-center text-xs text-muted-foreground space-y-2"
              >
                <Subtitles className="h-8 w-8 mx-auto opacity-40" />
                <p className="font-medium text-foreground">No subtitle switch captured yet</p>
                <p>
                  Click the <strong>CC</strong> icon or <strong>Settings &rarr; Subtitles</strong>{" "}
                  on the video player to activate or switch caption tracks.
                </p>
                {observedUrl && (
                  <p className="pt-2 text-[11px] text-muted-foreground/80 font-mono truncate max-w-xs mx-auto">
                    Active base URL: {observedUrl}
                  </p>
                )}
              </div>
            ) : (
              <div
                id="detected-subtitles-list"
                data-testid="detected-subtitles-list"
                className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1"
              >
                {sortedDetectedTracks.map((track) => {
                  const isAlreadyInViewer = existingTrackLanguages.includes(track.lang);
                  const isJustImported = justImportedLang === track.lang;
                  const isCopied = copiedTrackLang === track.lang;
                  const langMeta = LANGS.find((l) => l.code === track.lang);
                  const displayName = langMeta
                    ? `${langMeta.name} (${track.lang})`
                    : track.langName || track.lang;

                  return (
                    <div
                      key={track.lang}
                      id={`detected-subtitle-row-${track.lang}`}
                      data-testid={`detected-subtitle-row-${track.lang}`}
                      className="rounded-lg border border-border bg-background p-3 text-xs space-y-2.5 transition-colors hover:border-primary/40"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground text-sm">{displayName}</span>
                          <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                            {track.cuesCount} cues
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {new Date(track.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <Button
                          id={`import-subtitle-btn-${track.lang}`}
                          data-testid={`import-subtitle-btn-${track.lang}`}
                          type="button"
                          size="sm"
                          variant={isAlreadyInViewer ? "outline" : "default"}
                          onClick={() => handleImport(track.lang, track.json, track.rawData)}
                          className="h-7 text-xs gap-1.5 flex-1 min-w-[120px]"
                          title="Import this subtitle track into the Parallel Subtitles Table"
                        >
                          {isJustImported ? (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                              <span>Imported!</span>
                            </>
                          ) : isAlreadyInViewer ? (
                            <>
                              <Check className="h-3.5 w-3.5 opacity-70" />
                              <span>In Viewer</span>
                            </>
                          ) : (
                            <>
                              <Download className="h-3.5 w-3.5" />
                              <span>Import to Table</span>
                            </>
                          )}
                        </Button>

                        <Button
                          id={`copy-json-btn-${track.lang}`}
                          data-testid={`copy-json-btn-${track.lang}`}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyJson(track)}
                          className="h-7 text-xs px-2 gap-1 text-muted-foreground hover:text-foreground"
                          title="Copy raw JSON3 caption data to clipboard"
                        >
                          {isCopied ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              <span>JSON</span>
                            </>
                          )}
                        </Button>

                        <Button
                          id={`download-json-btn-${track.lang}`}
                          data-testid={`download-json-btn-${track.lang}`}
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadJson(track)}
                          className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground"
                          title="Download JSON3 subtitle file"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                          id={`preview-subtitle-btn-${track.lang}`}
                          data-testid={`preview-subtitle-btn-${track.lang}`}
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setPreviewTrackLang((curr) => (curr === track.lang ? null : track.lang))
                          }
                          className="h-7 text-xs px-2 gap-1 text-muted-foreground hover:text-foreground"
                          title="Preview intercepted cues for this track"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>{previewTrackLang === track.lang ? "Hide" : "Preview"}</span>
                        </Button>
                      </div>

                      {/* Cue Preview Expandable Box */}
                      {previewTrackLang === track.lang && previewCues && (
                        <div
                          id={`preview-box-${track.lang}`}
                          data-testid={`preview-box-${track.lang}`}
                          className="mt-2 rounded border border-border/80 bg-muted/50 p-2.5 text-[11px] space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-muted-foreground text-[10px] uppercase tracking-wider">
                              First Sample Cues:
                            </span>
                            {previewCues.length > 0 && (
                              <button
                                type="button"
                                onClick={() => handleHandoffToViewer(previewCues[0].startMs / 1000)}
                                className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
                                title="Open Viewer positioned at this cue"
                              >
                                <span>Seek in Viewer</span>
                                <ArrowUpRight className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                          {previewCues.length === 0 ? (
                            <p className="text-muted-foreground italic">
                              No text cues found in payload.
                            </p>
                          ) : (
                            previewCues.map((c) => (
                              <div key={c.id} className="flex items-baseline justify-between gap-2">
                                <div className="flex items-baseline gap-2 min-w-0">
                                  <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                                    {(c.startMs / 1000).toFixed(1)}s:
                                  </span>
                                  <span className="text-foreground line-clamp-2">{c.text}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleHandoffToViewer(c.startMs / 1000)}
                                  className="text-[10px] font-mono text-muted-foreground hover:text-primary shrink-0 opacity-70 hover:opacity-100"
                                  title="Jump to this cue in Viewer"
                                >
                                  &rarr;
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
