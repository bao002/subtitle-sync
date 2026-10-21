import React, { useState } from "react";
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
import { VideoMetadata } from "@/types";
import {
  Info,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Clock,
  User,
  Image as ImageIcon,
  Code,
  Subtitles,
  Tv,
} from "lucide-react";

export interface VideoMetadataModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metadata: VideoMetadata | null;
  videoId: string;
  onRefreshMetadata?: () => Promise<void> | void;
}

export function VideoMetadataModal({
  open,
  onOpenChange,
  metadata,
  videoId,
  onRefreshMetadata,
}: VideoMetadataModalProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleCopy = (key: string, text?: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  const handleRefresh = async () => {
    if (!onRefreshMetadata) return;
    setIsRefreshing(true);
    try {
      await onRefreshMetadata();
    } finally {
      setIsRefreshing(false);
    }
  };

  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="video-metadata-modal"
        className="max-w-2xl max-h-[85vh] overflow-y-auto"
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />
            <DialogTitle data-testid="video-metadata-modal-title">
              Video Information & Metadata
            </DialogTitle>
          </div>
          <DialogDescription>
            Client-side extracted metadata, thumbnail assets, and detected caption tracks without
            backend dependencies.
          </DialogDescription>
        </DialogHeader>

        {metadata ? (
          <div className="space-y-4 text-sm">
            {/* Title & Channel Header Card */}
            <div className="p-3 rounded-lg border border-border bg-card/60 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <h3
                    data-testid="modal-video-title"
                    className="font-semibold text-base leading-snug text-foreground"
                  >
                    {metadata.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Tv className="w-3.5 h-3.5 text-muted-foreground" />
                      ID:{" "}
                      <code className="bg-muted px-1 py-0.5 rounded font-mono text-[11px]">
                        {videoId}
                      </code>
                    </span>
                    {metadata.durationFormatted && (
                      <span className="flex items-center gap-1 font-medium text-foreground">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        {metadata.durationFormatted}
                        {metadata.durationSeconds && (
                          <span className="text-muted-foreground font-normal">
                            ({Math.round(metadata.durationSeconds)}s)
                          </span>
                        )}
                      </span>
                    )}
                    {metadata.extractedVia && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {metadata.extractedVia}
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 text-xs shrink-0"
                  asChild
                >
                  <a href={watchUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-3.5 h-3.5" />
                    YouTube
                  </a>
                </Button>
              </div>

              {metadata.authorName && (
                <div className="flex items-center gap-2 pt-1 border-t border-border/40 text-xs">
                  <User className="w-3.5 h-3.5 text-primary" />
                  <span className="text-muted-foreground">Creator:</span>
                  {metadata.authorUrl ? (
                    <a
                      href={metadata.authorUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline flex items-center gap-1"
                    >
                      {metadata.authorName}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="font-medium text-foreground">{metadata.authorName}</span>
                  )}
                  {metadata.channelId && (
                    <span className="text-muted-foreground">({metadata.channelId})</span>
                  )}
                </div>
              )}
            </div>

            {/* Description Section */}
            <div className="p-3 rounded-lg border border-border bg-card/40 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Description
                </span>
                {metadata.description && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-[11px] gap-1"
                    onClick={() => handleCopy("desc", metadata.description)}
                  >
                    {copiedKey === "desc" ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> Copy
                      </>
                    )}
                  </Button>
                )}
              </div>
              <p
                data-testid="modal-video-description"
                className="text-xs text-foreground/90 whitespace-pre-line leading-relaxed"
              >
                {metadata.description || "No description provided for this video."}
              </p>
            </div>

            {/* Detected Subtitle / Caption Tracks Section */}
            <div className="p-3 rounded-lg border border-border bg-card/40 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Subtitles className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Available Caption Tracks
                  </span>
                </div>
                {metadata.defaultSubtitleLang && (
                  <Badge variant="secondary" className="text-[10px]">
                    Default: {metadata.defaultSubtitleLang}
                  </Badge>
                )}
              </div>

              {metadata.availableCaptionTracks && metadata.availableCaptionTracks.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {metadata.availableCaptionTracks.map((track) => (
                    <div
                      key={`${track.langCode}-${track.name || ""}`}
                      data-testid={`caption-track-${track.langCode}`}
                      className="flex items-center justify-between p-2 rounded bg-muted/30 border border-border/50 text-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-medium truncate">{track.name || track.langCode}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {track.langCode}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {track.isDefault && (
                          <Badge variant="default" className="text-[9px] px-1 py-0 h-4 bg-primary">
                            Default
                          </Badge>
                        )}
                        {track.isAsr && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                            Auto (ASR)
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  Captions are detected authentic on play or via timedtext interception. Toggle the
                  video CC button or play to discover all active tracks.
                </p>
              )}
            </div>

            {/* Thumbnails Gallery Section */}
            <div className="p-3 rounded-lg border border-border bg-card/40 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Thumbnails & Assets
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {[
                  { label: "MaxRes (1080p)", url: metadata.maxResThumbnailUrl },
                  { label: "HQ (480p)", url: metadata.hqThumbnailUrl },
                  { label: "SD (640p)", url: metadata.sdThumbnailUrl },
                  { label: "MQ (360p)", url: metadata.mqThumbnailUrl },
                ].map(
                  (thumb) =>
                    thumb.url && (
                      <div
                        key={thumb.label}
                        className="p-1.5 rounded border border-border/60 bg-muted/20 space-y-1.5"
                      >
                        <img
                          src={thumb.url}
                          alt={thumb.label}
                          className="w-full aspect-video object-cover rounded border border-border/40"
                          loading="lazy"
                        />
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-medium truncate text-muted-foreground">
                            {thumb.label}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleCopy(thumb.label, thumb.url)}
                              className="text-primary hover:underline p-0.5"
                              title="Copy URL"
                            >
                              {copiedKey === thumb.label ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                            <a
                              href={thumb.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline p-0.5"
                              title="Open in new tab"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      </div>
                    ),
                )}
              </div>
            </div>

            {/* Embed HTML snippet */}
            {metadata.html && (
              <div className="p-3 rounded-lg border border-border bg-card/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Code className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Embed Code (iframe)
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-[11px] gap-1"
                    onClick={() => handleCopy("embed", metadata.html)}
                  >
                    {copiedKey === "embed" ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> Copy Code
                      </>
                    )}
                  </Button>
                </div>
                <pre className="p-2 rounded bg-muted/50 border border-border text-[11px] font-mono overflow-x-auto text-muted-foreground whitespace-pre-wrap">
                  {metadata.html}
                </pre>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground text-sm">
            No metadata currently loaded for video {videoId}.
          </div>
        )}

        <DialogFooter className="flex flex-row items-center justify-between sm:justify-between w-full pt-2">
          {onRefreshMetadata ? (
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="gap-1.5 text-xs"
              data-testid="refresh-metadata-button"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Refreshing..." : "Refresh Info"}
            </Button>
          ) : (
            <div />
          )}
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onOpenChange(false)}
            data-testid="close-metadata-modal-button"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
