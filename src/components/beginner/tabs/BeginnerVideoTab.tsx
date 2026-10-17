import React, { useState } from "react";
import {
  Tv,
  Subtitles,
  Library,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Play,
  ArrowRight,
  Database,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { extractYouTubeId } from "@/utils/youtube";

export interface ObservedSubtitleTrack {
  lang: string;
  name?: string;
  cuesCount: number;
  isCached: boolean;
  isBase: boolean;
}

export interface BeginnerVideoTabProps {
  url: string;
  onUrlChange: (url: string) => void;
  onSubmitUrl: (url: string) => void;
  videoId: string;
  onOpenLibrary: () => void;
  observedUrl: string | null;
  observedTracks: ObservedSubtitleTrack[];
  selectedBaseLang: string;
  onSelectBaseLang: (lang: string) => void;
  onLoadSampleSubtitles?: () => void;
  onContinueToNextTab?: () => void;
  isAndroidNative?: boolean;
  playerSlot?: React.ReactNode;
}

export const BeginnerVideoTab: React.FC<BeginnerVideoTabProps> = ({
  url,
  onUrlChange,
  onSubmitUrl,
  videoId,
  onOpenLibrary,
  observedUrl,
  observedTracks,
  selectedBaseLang,
  onSelectBaseLang,
  onLoadSampleSubtitles,
  onContinueToNextTab,
  isAndroidNative = false,
  playerSlot,
}) => {
  const [inputVal, setInputVal] = useState(url);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputVal.trim()) {
      onSubmitUrl(inputVal.trim());
    }
  };

  const handlePaste = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          setInputVal(text.trim());
          onUrlChange(text.trim());
          onSubmitUrl(text.trim());
        }
      }
    } catch {
      // ignore clipboard permission error
    }
  };

  const hasSelectedBase = Boolean(selectedBaseLang);

  return (
    <div className="space-y-4 max-w-4xl mx-auto p-3" data-testid="beginner-video-tab">
      {/* Step 1 Header & Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-700/60 flex items-center justify-center text-emerald-400">
              <Tv className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
                <span>Step 1: YouTube Video & Subtitle Discovery</span>
                {videoId && (
                  <Badge variant="outline" className="text-[10px] text-slate-400 border-slate-700">
                    ID: {videoId}
                  </Badge>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                Paste or share a YouTube video link to begin subtitle synchronization.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenLibrary}
            className="h-8 px-2.5 text-xs border-slate-700 hover:bg-slate-800 text-slate-200 flex items-center gap-1.5"
            data-testid="btn-open-library"
          >
            <Library className="w-3.5 h-3.5 text-indigo-400" />
            <span>Saved Library</span>
          </Button>
        </div>

        {/* URL Input Form */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Input
              type="text"
              value={inputVal}
              onChange={(e) => {
                setInputVal(e.target.value);
                onUrlChange(e.target.value);
              }}
              placeholder="Paste YouTube link (e.g., https://youtu.be/...)"
              className="h-9 text-xs bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500 pr-16 focus-visible:ring-emerald-500"
              data-testid="beginner-url-input"
            />
            <button
              type="button"
              onClick={handlePaste}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2 py-0.5 text-[10px] font-medium text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 rounded transition-colors"
            >
              Paste
            </button>
          </div>

          <Button
            type="submit"
            size="sm"
            className="h-9 px-3 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium shrink-0"
            data-testid="btn-load-video"
          >
            <Play className="w-3 h-3 mr-1" />
            Load Video
          </Button>
        </form>

        {/* Video Player Display */}
        {playerSlot && (
          <div
            className="w-full rounded-xl overflow-hidden bg-black aspect-video border border-slate-800 shadow-md relative"
            data-testid="beginner-player-slot-container"
          >
            {playerSlot}
          </div>
        )}
      </div>

      {/* Step 2: Captions Interception Prompt */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-sky-950 border border-sky-700/60 flex items-center justify-center text-sky-400 shrink-0 mt-0.5">
            <Subtitles className="w-4 h-4" />
          </div>
          <div className="space-y-1 flex-1">
            <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-2">
              <span>Enable Captions (CC) in Video</span>
              {observedUrl && (
                <Badge className="bg-emerald-950/80 text-emerald-300 border-emerald-700/60 text-[10px] py-0">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  TimedText Intercepted
                </Badge>
              )}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Play the video and turn on <strong className="text-slate-200">CC (Captions)</strong>{" "}
              in the YouTube player. The app intercepts the authentic{" "}
              <code className="text-sky-300 bg-slate-950 px-1 py-0.5 rounded text-[11px]">
                timedtext
              </code>{" "}
              network calls and securely saves the subtitle tracks into offline local storage.
            </p>
            {onLoadSampleSubtitles && observedTracks.length === 0 && (
              <div className="pt-1.5 flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onLoadSampleSubtitles}
                  className="h-7 px-2.5 text-[11px] border-sky-700/60 text-sky-300 hover:bg-sky-950/40"
                  data-testid="btn-load-sample-subs"
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  Load Sample Captions (Instant Test)
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Intercepted URL Info */}
        {observedUrl && (
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-2 text-[11px] text-slate-400 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 truncate">
              <Database className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-slate-300 font-mono text-[10px] truncate">{observedUrl}</span>
            </div>
            <span className="text-[10px] text-emerald-400 shrink-0 font-medium">
              Cached Locally
            </span>
          </div>
        )}
      </div>

      {/* Step 3: Observed Subtitles & Select Base Track */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <span>Observed Subtitle Tracks</span>
              <span className="text-slate-400 font-normal">({observedTracks.length} detected)</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Choose which subtitle track to use as the base language. Selecting a base track
              unlocks the next tabs.
            </p>
          </div>
        </div>

        {observedTracks.length === 0 ? (
          <div className="bg-slate-950 border border-dashed border-slate-800 rounded-lg p-6 text-center text-xs text-slate-500 space-y-1">
            <Subtitles className="w-6 h-6 mx-auto text-slate-600 mb-1" />
            <p>No subtitle tracks detected yet.</p>
            <p className="text-[11px] text-slate-600">
              Start video playback or toggle CC on the player to trigger caption discovery.
            </p>
          </div>
        ) : (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 gap-2"
            data-testid="observed-subtitles-list"
          >
            {observedTracks.map((track) => {
              const isSelected = selectedBaseLang === track.lang;
              return (
                <button
                  key={track.lang}
                  type="button"
                  onClick={() => onSelectBaseLang(track.lang)}
                  className={`flex items-center justify-between p-2.5 rounded-lg border text-left transition-all ${
                    isSelected
                      ? "bg-emerald-950/40 border-emerald-600 text-slate-100 ring-1 ring-emerald-500/40"
                      : "bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300"
                  }`}
                  data-testid={`track-select-${track.lang}`}
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-slate-100">
                        {track.name || track.lang.toUpperCase()}
                      </span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-slate-700">
                        {track.lang}
                      </Badge>
                      {track.isCached && (
                        <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          Cached
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {track.cuesCount} subtitle cues available
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ml-2 ${
                      isSelected
                        ? "bg-emerald-600 border-emerald-500 text-white"
                        : "border-slate-700 bg-slate-900 text-transparent"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Continuation Banner */}
        {hasSelectedBase && onContinueToNextTab && (
          <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-800/80">
            <span className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Base track selected. Next tabs unlocked!
            </span>
            <Button
              type="button"
              size="sm"
              onClick={onContinueToNextTab}
              className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center gap-1.5"
              data-testid="btn-continue-to-prefs"
            >
              <span>Next: Voice & Preferences</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
