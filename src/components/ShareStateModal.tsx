import React, { useState, useMemo, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createShareableLink } from "@/utils/urlStateManager";
import { LANGS, type Json3 } from "@/lib/subtitles";
import {
  Share2,
  Copy,
  Check,
  Key,
  Languages,
  Subtitles,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";

export interface ShareStateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoId: string;
  targetLanguages: string[];
  baseLanguage: string;
  observedUrl?: string;
  rawJson3Track?: Json3 | null;
  openRouterApiKey?: string;
}

export function ShareStateModal({
  open,
  onOpenChange,
  videoId,
  targetLanguages,
  baseLanguage,
  observedUrl,
  rawJson3Track,
  openRouterApiKey,
}: ShareStateModalProps) {
  const [selectedTargetLang, setSelectedTargetLang] = useState<string>(
    () => targetLanguages[0] || "he",
  );
  const [includeTargetLang, setIncludeTargetLang] = useState<boolean>(true);
  const [includeSubtitles, setIncludeSubtitles] = useState<boolean>(true);
  const [includeApiKey, setIncludeApiKey] = useState<boolean>(Boolean(openRouterApiKey));
  const [copied, setCopied] = useState<boolean>(false);

  // Compute the subtitle URL or serialized data
  const subUrlToShare = useMemo(() => {
    if (!includeSubtitles) return undefined;
    if (observedUrl && observedUrl.trim()) {
      return observedUrl.trim();
    }
    return undefined;
  }, [includeSubtitles, observedUrl]);

  // Compute the shareable URL
  const shareableUrl = useMemo(() => {
    return createShareableLink({
      videoId,
      targetLang: includeTargetLang ? selectedTargetLang : undefined,
      subUrl: subUrlToShare,
      subLang: baseLanguage || "en",
      openRouterApiKey: includeApiKey && openRouterApiKey ? openRouterApiKey.trim() : undefined,
    });
  }, [
    videoId,
    includeTargetLang,
    selectedTargetLang,
    subUrlToShare,
    baseLanguage,
    includeApiKey,
    openRouterApiKey,
  ]);

  const handleCopy = useCallback(async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareableUrl);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = shareableUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.warn("[ShareStateModal] Failed to copy to clipboard:", err);
    }
  }, [shareableUrl]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        id="share-state-dialog"
        data-testid="share-state-dialog"
        className="max-w-lg space-y-4"
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Share2 className="h-4 w-4" />
            </span>
            <DialogTitle className="text-lg font-bold">Share State Link</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Generate a link containing the current video, default subtitles stream, target language,
            and OpenRouter API key for quick 1-click loading.
          </DialogDescription>
        </DialogHeader>

        {/* Options / Inclusion Toggles */}
        <div className="space-y-3 rounded-lg border border-border bg-card p-3 text-xs">
          {/* Target Language Toggle */}
          <div className="flex flex-col gap-2 pb-2.5 border-b border-border/60">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  data-testid="share-include-target-lang-toggle"
                  checked={includeTargetLang}
                  onChange={(e) => setIncludeTargetLang(e.target.checked)}
                  className="rounded border-input text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
                />
                <span className="flex items-center gap-1.5 text-foreground">
                  <Languages className="h-3.5 w-3.5 text-primary" />
                  Target Translation Language
                </span>
              </label>
              {includeTargetLang && (
                <select
                  data-testid="share-target-lang-select"
                  value={selectedTargetLang}
                  onChange={(e) => setSelectedTargetLang(e.target.value)}
                  className="rounded border border-input bg-background px-2 py-0.5 text-xs font-medium"
                >
                  {LANGS.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.name} ({l.code})
                    </option>
                  ))}
                </select>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground pl-5.5">
              The recipient will automatically have this language configured and displayed.
            </p>
          </div>

          {/* Subtitles Stream Toggle */}
          <div className="flex flex-col gap-1.5 pb-2.5 border-b border-border/60">
            <label className="flex items-center gap-2 font-medium cursor-pointer">
              <input
                type="checkbox"
                data-testid="share-include-subtitles-toggle"
                checked={includeSubtitles}
                onChange={(e) => setIncludeSubtitles(e.target.checked)}
                className="rounded border-input text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
              />
              <span className="flex items-center gap-1.5 text-foreground">
                <Subtitles className="h-3.5 w-3.5 text-primary" />
                Default Subtitles Stream / URL
              </span>
            </label>
            <p className="text-[11px] text-muted-foreground pl-5.5">
              {observedUrl
                ? "Includes the authentic timedtext captions URL for instant stream hydration."
                : "Includes default subtitles parameter for the active video."}
            </p>
          </div>

          {/* OpenRouter API Key Toggle */}
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-2 font-medium cursor-pointer">
              <input
                type="checkbox"
                data-testid="share-include-api-key-toggle"
                checked={includeApiKey}
                onChange={(e) => setIncludeApiKey(e.target.checked)}
                className="rounded border-input text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
              />
              <span className="flex items-center gap-1.5 text-foreground">
                <Key className="h-3.5 w-3.5 text-amber-500" />
                OpenRouter AI API Key
              </span>
              {openRouterApiKey ? (
                <Badge variant="secondary" className="text-[10px] font-mono">
                  {openRouterApiKey.slice(0, 7)}…{openRouterApiKey.slice(-4)}
                </Badge>
              ) : (
                <span className="text-[10px] text-muted-foreground italic">(Not configured)</span>
              )}
            </label>
            {includeApiKey && openRouterApiKey && (
              <div className="flex items-start gap-1.5 rounded bg-amber-500/10 p-2 text-[11px] text-amber-700 dark:text-amber-300">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>
                  The recipient will receive your API key in the link to instantly run AI
                  punctuation without setting up an account.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Generated Shareable Link Output */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">Generated Shareable Link</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              data-testid="share-link-input"
              value={shareableUrl}
              onFocus={(e) => e.target.select()}
              className="flex-1 rounded-md border border-input bg-muted/40 px-3 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <Button
              type="button"
              size="sm"
              data-testid="copy-share-link-btn"
              onClick={handleCopy}
              className="gap-1.5 shrink-0 font-medium"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Link</span>
                </>
              )}
            </Button>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            data-testid="close-share-modal-btn"
            className="text-xs"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
