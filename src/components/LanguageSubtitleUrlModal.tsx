import React, { useState, useEffect } from "react";
import { X, RefreshCw, CheckCircle2, AlertCircle, Link2, FileText } from "lucide-react";
import { Button } from "./ui/button";
import { parseJson3 } from "../lib/native-captions";
import { isValidJsonSubtitleResponse } from "../utils/subtitleCache";
import { fetchViaServer } from "../lib/subtitle-fetch-plan";
import serverConfig from "../config/server.json";
import { Json3 } from "../types";

export interface LanguageSubtitleUrlModalProps {
  isOpen: boolean;
  onClose: () => void;
  langCode: string | null;
  langName: string;
  currentVideoId: string;
  onSaveTrack: (lang: string, track: Json3, url?: string) => void;
  existingTrack?: Json3 | null;
}

export const LanguageSubtitleUrlModal: React.FC<LanguageSubtitleUrlModalProps> = ({
  isOpen,
  onClose,
  langCode,
  langName,
  currentVideoId,
  onSaveTrack,
  existingTrack,
}) => {
  const [urlInput, setUrlInput] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<"info" | "success" | "error">("info");

  useEffect(() => {
    if (isOpen && langCode) {
      setUrlInput("");
      setStatusMessage(null);
    }
  }, [isOpen, langCode]);

  if (!isOpen || !langCode) return null;

  const handleFetch = async () => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setStatusType("error");
      setStatusMessage("Please enter a valid subtitle URL or local fixture path.");
      return;
    }

    setIsFetching(true);
    setStatusType("info");
    setStatusMessage(`Fetching subtitles for ${langName} (${langCode})...`);

    try {
      let parsed: Json3 | null = null;

      // 1. Attempt direct fetch
      try {
        const resp = await fetch(trimmed);
        if (resp.ok) {
          const text = await resp.text();
          parsed = parseJson3(text);
        }
      } catch {
        // Direct fetch failed (e.g. CORS)
      }

      // 2. Fallback to server proxy if needed
      if (!parsed || !isValidJsonSubtitleResponse(parsed)) {
        if (trimmed.startsWith("http")) {
          const proxyResp = await fetchViaServer(
            trimmed,
            serverConfig.fetchServerUrl || "http://localhost:3000/api/proxy",
          );
          if (proxyResp && proxyResp.status === 200 && proxyResp.body) {
            parsed = parseJson3(proxyResp.body);
          }
        }
      }

      setIsFetching(false);

      if (parsed && isValidJsonSubtitleResponse(parsed)) {
        setStatusType("success");
        const cueCount = parsed.events?.length || 0;
        setStatusMessage(`Successfully loaded ${cueCount} subtitle cues! Applying track...`);
        onSaveTrack(langCode, parsed, trimmed);
        setTimeout(() => {
          onClose();
        }, 600);
      } else {
        setStatusType("error");
        setStatusMessage(
          "Fetched payload was not valid YouTube json3 subtitles. Ensure the URL returns { events: [...] }.",
        );
      }
    } catch (err) {
      setIsFetching(false);
      setStatusType("error");
      setStatusMessage(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleUseSample = () => {
    const samplePath = `/fixtures/${currentVideoId}/${langCode}.json`;
    setUrlInput(samplePath);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="language-subtitle-url-modal-title"
      data-testid="language-subtitle-url-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
    >
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-5 shadow-xl text-card-foreground space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            <h3
              id="language-subtitle-url-modal-title"
              className="text-base font-semibold text-foreground"
            >
              Input Subtitle URL for {langName} ({langCode})
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <p className="text-muted-foreground leading-relaxed">
            Specify a direct timedtext URL, external JSON endpoint, or local fixture path for{" "}
            <span className="font-semibold text-foreground">{langName}</span> subtitles.
          </p>

          <div className="space-y-1.5">
            <label htmlFor="lang-subtitle-url-input" className="font-medium text-foreground block">
              Subtitle URL or Path:
            </label>
            <textarea
              id="lang-subtitle-url-input"
              data-testid="web-demo-subtitles-urls-input"
              rows={3}
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder={`e.g. /fixtures/${currentVideoId || "L2Ryrr6txwA"}/${langCode}.json\nor https://www.youtube.com/api/timedtext?...`}
              className="w-full font-mono text-xs rounded-md border border-input bg-background p-2.5 focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleUseSample}
              className="text-primary hover:underline flex items-center gap-1 font-medium text-[11px]"
            >
              <FileText className="w-3.5 h-3.5" /> Use default fixture path
            </button>
            {existingTrack?.events?.length ? (
              <span className="text-[11px] text-muted-foreground font-mono">
                Currently loaded: {existingTrack.events.length} cues
              </span>
            ) : null}
          </div>

          {statusMessage && (
            <div
              data-testid="modal-status-banner"
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
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isFetching}>
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            data-testid="fetch-web-demo-subtitles-button"
            onClick={handleFetch}
            disabled={isFetching || !urlInput.trim()}
          >
            {isFetching ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Fetching...
              </>
            ) : (
              "Fetch & Load Subtitles"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
