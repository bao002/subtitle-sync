import React from "react";
import { Film, Volume2, ArrowRight, Play, FastForward, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SectionOrder, TtsLanguageOrders } from "@/lib/playback-preferences";

export interface VideoLanguageSequenceControlProps {
  spokenLanguages: Array<{ code: string; name: string }>;
  sectionOrder: SectionOrder;
  languageOrders: TtsLanguageOrders;
  onSectionOrderChange: (order: SectionOrder) => void;
  onLanguageOrderChange: (languageCode: string, order: SectionOrder) => void;
  className?: string;
}

export const VideoLanguageSequenceControl: React.FC<VideoLanguageSequenceControlProps> = ({
  spokenLanguages,
  sectionOrder,
  languageOrders,
  onSectionOrderChange,
  onLanguageOrderChange,
  className = "",
}) => {
  // Categorize languages into Before Video (tts-first) and After Video (video-first)
  const beforeVideoLangs: Array<{ code: string; name: string }> = [];
  const afterVideoLangs: Array<{ code: string; name: string }> = [];

  if (sectionOrder === "video-middle") {
    const unconfigured: Array<{ code: string; name: string }> = [];
    for (const lang of spokenLanguages) {
      const explicit = languageOrders[lang.code];
      if (explicit === "tts-first") {
        beforeVideoLangs.push(lang);
      } else if (explicit === "video-first") {
        afterVideoLangs.push(lang);
      } else {
        unconfigured.push(lang);
      }
    }
    const half = Math.ceil(unconfigured.length / 2);
    beforeVideoLangs.push(...unconfigured.slice(0, half));
    afterVideoLangs.push(...unconfigured.slice(half));
  } else {
    for (const lang of spokenLanguages) {
      const explicit = languageOrders[lang.code] ?? sectionOrder;
      if (explicit === "tts-first") {
        beforeVideoLangs.push(lang);
      } else {
        afterVideoLangs.push(lang);
      }
    }
  }

  const handleSetVideoFirst = () => {
    onSectionOrderChange("video-first");
    for (const lang of spokenLanguages) {
      onLanguageOrderChange(lang.code, "video-first");
    }
  };

  const handleSetVideoMiddle = () => {
    onSectionOrderChange("video-middle");
    // Half before, half after
    const half = Math.ceil(spokenLanguages.length / 2);
    spokenLanguages.forEach((lang, idx) => {
      onLanguageOrderChange(lang.code, idx < half ? "tts-first" : "video-first");
    });
  };

  const handleSetVideoLast = () => {
    onSectionOrderChange("tts-first");
    for (const lang of spokenLanguages) {
      onLanguageOrderChange(lang.code, "tts-first");
    }
  };

  // Move video earlier: shifts one language from beforeVideo to afterVideo
  const handleMoveVideoEarlier = () => {
    if (beforeVideoLangs.length === 0) return;
    const moved = beforeVideoLangs[beforeVideoLangs.length - 1];
    if (moved) {
      onLanguageOrderChange(moved.code, "video-first");
      if (beforeVideoLangs.length === 1) {
        onSectionOrderChange("video-first");
      } else {
        onSectionOrderChange("video-middle");
      }
    }
  };

  // Move video later: shifts one language from afterVideo to beforeVideo
  const handleMoveVideoLater = () => {
    if (afterVideoLangs.length === 0) return;
    const moved = afterVideoLangs[0];
    if (moved) {
      onLanguageOrderChange(moved.code, "tts-first");
      if (afterVideoLangs.length === 1) {
        onSectionOrderChange("tts-first");
      } else {
        onSectionOrderChange("video-middle");
      }
    }
  };

  return (
    <div
      data-testid="video-language-sequence-control"
      className={`rounded-xl border border-border/80 bg-card p-3 sm:p-4 shadow-sm space-y-3 ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
            <Film className="h-4 w-4 text-primary" />
            <span>Placement of Video in Playback Sequence</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Easily set when the video plays relative to the subtitle languages.
          </p>
        </div>

        {/* 1-Click Preset Buttons */}
        <div className="flex flex-wrap items-center gap-1.5" data-testid="sequence-preset-buttons">
          <Button
            type="button"
            size="sm"
            variant={sectionOrder === "video-first" && beforeVideoLangs.length === 0 ? "default" : "outline"}
            onClick={handleSetVideoFirst}
            className="h-7 text-xs px-2.5 gap-1 font-medium"
            data-testid="btn-place-video-first"
            title="Video plays before speech synthesis"
          >
            <Play className="h-3 w-3" />
            <span>Video First</span>
          </Button>
          <Button
            type="button"
            size="sm"
            variant={sectionOrder === "video-middle" ? "default" : "outline"}
            onClick={handleSetVideoMiddle}
            className="h-7 text-xs px-2.5 gap-1 font-medium"
            data-testid="btn-place-video-in-between"
            title="Video plays in between speech synthesis groups"
          >
            <FastForward className="h-3 w-3" />
            <span>Video In-Between</span>
          </Button>
          <Button
            type="button"
            size="sm"
            variant={sectionOrder === "tts-first" && afterVideoLangs.length === 0 ? "default" : "outline"}
            onClick={handleSetVideoLast}
            className="h-7 text-xs px-2.5 gap-1 font-medium"
            data-testid="btn-place-video-last"
            title="Video plays after all speech synthesis"
          >
            <Volume2 className="h-3 w-3" />
            <span>Video After (TTS First)</span>
          </Button>
        </div>
      </div>

      {/* Visual Sequence Timeline Flow */}
      <div
        data-testid="visual-sequence-flow-timeline"
        className="flex items-center gap-1.5 overflow-x-auto py-2 px-2.5 rounded-lg border border-primary/20 bg-primary/5"
      >
        {/* Languages playing BEFORE the video */}
        {beforeVideoLangs.map((lang, idx) => (
          <React.Fragment key={`before-${lang.code}-${idx}`}>
            <button
              type="button"
              onClick={() => onLanguageOrderChange(lang.code, "video-first")}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-secondary hover:bg-secondary/80 border border-secondary text-[11px] font-medium text-foreground transition-all hover:scale-105 shrink-0"
              title={`Click to move ${lang.name} after the video`}
              data-testid={`sequence-tag-${lang.code}`}
            >
              <Volume2 className="h-3 w-3 text-sky-500" />
              <span>{lang.name}</span>
              <span className="text-[9px] opacity-75 font-mono ml-0.5">(TTS)</span>
            </button>
            <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
          </React.Fragment>
        ))}

        {/* Video Card in the exact playback position */}
        <div
          data-testid="sequence-video-card"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs shadow-md shrink-0 border-2 border-primary ring-2 ring-primary/20"
        >
          <Film className="h-3.5 w-3.5 fill-current" />
          <span>▶ Video Section Playback</span>
        </div>

        {/* Languages playing AFTER the video */}
        {afterVideoLangs.map((lang, idx) => (
          <React.Fragment key={`after-${lang.code}-${idx}`}>
            <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
            <button
              type="button"
              onClick={() => onLanguageOrderChange(lang.code, "tts-first")}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-secondary hover:bg-secondary/80 border border-secondary text-[11px] font-medium text-foreground transition-all hover:scale-105 shrink-0"
              title={`Click to move ${lang.name} before the video`}
              data-testid={`sequence-tag-${lang.code}`}
            >
              <Volume2 className="h-3 w-3 text-emerald-500" />
              <span>{lang.name}</span>
              <span className="text-[9px] opacity-75 font-mono ml-0.5">(TTS)</span>
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Stepper Fine-Tuning Controls */}
      <div className="flex items-center justify-between gap-2 pt-1 text-xs text-muted-foreground">
        <span className="text-[11px]">
          {beforeVideoLangs.length} {beforeVideoLangs.length === 1 ? "language" : "languages"} before video ·{" "}
          {afterVideoLangs.length} {afterVideoLangs.length === 1 ? "language" : "languages"} after video
        </span>
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={beforeVideoLangs.length === 0}
            onClick={handleMoveVideoEarlier}
            className="h-6 text-[11px] px-2"
            title="Move video position earlier (fewer languages before video)"
            data-testid="btn-move-video-earlier"
          >
            ◀ Move Video Earlier
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={afterVideoLangs.length === 0}
            onClick={handleMoveVideoLater}
            className="h-6 text-[11px] px-2"
            title="Move video position later (more languages before video)"
            data-testid="btn-move-video-later"
          >
            Move Video Later ▶
          </Button>
        </div>
      </div>
    </div>
  );
};
