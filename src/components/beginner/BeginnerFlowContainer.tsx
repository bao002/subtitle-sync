import React, { useState, useMemo, useEffect } from "react";
import { BeginnerTabNav, BeginnerTabId } from "./BeginnerTabNav";
import { BeginnerVideoTab, ObservedSubtitleTrack } from "./tabs/BeginnerVideoTab";
import { BeginnerPreferencesTab } from "./tabs/BeginnerPreferencesTab";
import {
  BeginnerParsingTab,
  cleanSubtitleText,
  splitTextByPunctuation,
} from "./tabs/BeginnerParsingTab";
import { BeginnerPlayerTab, SubtitleCueDisplay } from "./tabs/BeginnerPlayerTab";
import { VideoLibraryPanel } from "@/components/VideoLibraryPanel";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tv } from "lucide-react";
import { type Json3, parseCues, type Cue } from "@/lib/subtitles";
import {
  loadAppSettings,
  saveAppSettings,
  AppSettings,
  ALL_KNOWN_LANGUAGES,
} from "@/utils/appSettings";
import {
  getCachedTargetSubtitles,
  saveCachedRawJson3,
  getAllCachedTargetLanguages,
} from "@/utils/subtitleCache";
import { getBeginnerDefaultBaseLanguage } from "@/utils/beginnerLanguageSelection";

export interface BeginnerFlowContainerProps {
  url: string;
  videoId: string;
  onUrlChange: (newUrl: string) => void;
  onSubmitUrl: (urlToLoad: string) => void;
  observedUrl: string | null;
  rawTracks: Record<string, Json3>;
  currentTime: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSeek: (seconds: number) => void;
  onLoadSampleSubtitles?: () => void;
  playerSlot?: React.ReactNode;
  playbackControlsSlot?: React.ReactNode;
  subtitlesTableSlot?: React.ReactNode;
  webDemoUrlsSlot?: React.ReactNode;
  hasSubtitles?: boolean;
  showVideoSubtitles: boolean;
  onToggleVideoSubtitles: () => void;
  isAndroidNative?: boolean;
  onOrderChange?: (order: "video-first" | "tts-first") => void;
  onTtsSpeedChange?: (speed: number) => void;
  onTtsVoiceChange?: (voiceURI: string) => void;
  onSubtitlesRatioChange?: (ratio: number) => void;
  onFavoriteLanguagesChange?: (langs: string[]) => void;
  onBaseLangChange?: (baseLang: string) => void;
  onSpeakCue?: (text: string, lang: string) => void;
  speakingLang?: string | null;
  onSwitchToAdvanced?: () => void;
}

export const BeginnerFlowContainer: React.FC<BeginnerFlowContainerProps> = ({
  url,
  videoId,
  onUrlChange,
  onSubmitUrl,
  observedUrl,
  rawTracks,
  currentTime,
  isPlaying,
  onTogglePlay,
  onSeek,
  onLoadSampleSubtitles,
  isAndroidNative = false,
  playerSlot,
  playbackControlsSlot,
  subtitlesTableSlot,
  webDemoUrlsSlot,
  hasSubtitles = false,
  showVideoSubtitles,
  onToggleVideoSubtitles,
  onOrderChange,
  onTtsSpeedChange,
  onTtsVoiceChange,
  onSubtitlesRatioChange,
  onFavoriteLanguagesChange,
  onBaseLangChange,
  onSpeakCue,
  speakingLang,
  onSwitchToAdvanced,
}) => {
  // Load initial settings
  const [settings, setSettings] = useState<AppSettings>(() => loadAppSettings());

  const [activeTab, setActiveTab] = useState<BeginnerTabId>(
    settings.beginnerActiveTab || "preferences",
  );
  const [selectedBaseLang, setSelectedBaseLang] = useState("");
  const [order, setOrder] = useState<"video-first" | "tts-first">(
    settings.playOrder === "tts_then_video" ? "tts-first" : "video-first",
  );
  const [ttsSpeed, setTtsSpeed] = useState<number>(settings.beginnerTtsSpeed ?? 1.0);
  const [ttsVoice, setTtsVoice] = useState<string>(settings.beginnerTtsVoice ?? "");
  const [subtitlesRatio, setSubtitlesRatio] = useState<number>(
    settings.beginnerSubtitlesRatio ?? 1.0,
  );
  const [favoriteLanguages, setFavoriteLanguages] = useState<string[]>(
    settings.beginnerFavoriteLangs && settings.beginnerFavoriteLangs.length > 0
      ? settings.beginnerFavoriteLangs
      : ["he", "en", "es", "fr", "ru", "ar"],
  );
  const [splitByPunctuation, setSplitByPunctuation] = useState<boolean>(
    settings.beginnerSplitByPunctuation ?? true,
  );
  const [punctuationChars, setPunctuationChars] = useState<string[]>(
    settings.beginnerPunctuationChars && settings.beginnerPunctuationChars.length > 0
      ? settings.beginnerPunctuationChars
      : [".", "!", "?", "…", "؟"],
  );
  const [removeChars, setRemoveChars] = useState<string[]>(
    settings.beginnerRemoveChars && settings.beginnerRemoveChars.length > 0
      ? settings.beginnerRemoveChars
      : [">", ">>"],
  );
  const [stripSpeakerBrackets, setStripSpeakerBrackets] = useState<boolean>(
    settings.beginnerStripSpeakerBrackets ?? true,
  );

  // Video Library Modal
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  // Accordion open/folded state for Beginner video player
  const [accordionValue, setAccordionValue] = useState<string>("");

  useEffect(() => {
    if (isPlaying) {
      setAccordionValue("video-player");
    }
  }, [isPlaying]);

  const handleSubmitUrl = (urlToLoad: string) => {
    setAccordionValue("video-player");
    onSubmitUrl(urlToLoad);
  };

  // Sync state changes to localStorage
  const updateSettings = (partial: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      saveAppSettings(next);
      return next;
    });
  };

  // Convert rawTracks into observed tracks list
  const observedTracks = useMemo<ObservedSubtitleTrack[]>(() => {
    const list: ObservedSubtitleTrack[] = [];
    const keys = Object.keys(rawTracks);
    for (const lang of keys) {
      const json = rawTracks[lang];
      if (json && Array.isArray(json.events)) {
        const langObj = ALL_KNOWN_LANGUAGES.find((l) => l.code === lang);
        list.push({
          lang,
          name: langObj ? langObj.name : lang.toUpperCase(),
          cuesCount: json.events.length,
          isCached: true,
          isBase: selectedBaseLang === lang,
        });
      }
    }
    return list;
  }, [rawTracks, selectedBaseLang]);

  const hasObservedBaseLanguage = observedTracks.some((track) => track.lang === selectedBaseLang);

  // Prefer English when available; otherwise use the first detected track.
  useEffect(() => {
    if (observedTracks.length > 0 && !hasObservedBaseLanguage) {
      const defaultLang = getBeginnerDefaultBaseLanguage(observedTracks);
      if (!defaultLang) return;
      setSelectedBaseLang(defaultLang);
      onBaseLangChange?.(defaultLang);
    }
  }, [observedTracks, hasObservedBaseLanguage, onBaseLangChange]);

  // Determine if downstream tabs are unlocked
  const isUnlocked = hasObservedBaseLanguage;

  useEffect(() => {
    if (!isUnlocked && activeTab !== "video" && activeTab !== "preferences") {
      setActiveTab("video");
      updateSettings({ beginnerActiveTab: "video" });
    }
  }, [isUnlocked, activeTab]);

  const handleTabChange = (newTab: BeginnerTabId) => {
    // If user clicks a locked tab, do nothing
    if (newTab !== "video" && newTab !== "preferences" && !isUnlocked) return;
    setActiveTab(newTab);
    updateSettings({ beginnerActiveTab: newTab });
  };

  // Prepare subtitle cues for display in parsing and player
  const activeBaseCues = useMemo<Cue[]>(() => {
    if (!selectedBaseLang || !rawTracks[selectedBaseLang]) return [];
    return parseCues(rawTracks[selectedBaseLang]);
  }, [selectedBaseLang, rawTracks]);

  // Active target language (first favorite that is not base, or "en")
  const activeTargetLang = useMemo(() => {
    const found = favoriteLanguages.find((l) => l !== selectedBaseLang);
    return found || (selectedBaseLang === "en" ? "he" : "en");
  }, [favoriteLanguages, selectedBaseLang]);

  const activeTargetCues = useMemo<Cue[]>(() => {
    if (!activeTargetLang || !rawTracks[activeTargetLang]) return [];
    return parseCues(rawTracks[activeTargetLang]);
  }, [activeTargetLang, rawTracks]);

  // Merge cues with parsing/cleaning rules for the Player
  const displayCues = useMemo<SubtitleCueDisplay[]>(() => {
    return activeBaseCues.map((baseCue, idx) => {
      const targetCue = activeTargetCues[idx];
      const cleanedBase = cleanSubtitleText(baseCue.text, {
        stripSpeakerBrackets,
        removeChars,
      });
      const cleanedTarget = targetCue
        ? cleanSubtitleText(targetCue.text, {
            stripSpeakerBrackets,
            removeChars,
          })
        : undefined;

      return {
        id: `cue-${idx}-${baseCue.start}`,
        start: baseCue.start,
        duration: Math.max(0, baseCue.end - baseCue.start),
        baseText: cleanedBase,
        targetText: cleanedTarget,
      };
    });
  }, [activeBaseCues, activeTargetCues, stripSpeakerBrackets, removeChars]);

  const baseLangObj = ALL_KNOWN_LANGUAGES.find((l) => l.code === selectedBaseLang);

  return (
    <div
      className="w-full min-h-screen bg-background text-foreground flex flex-col"
      data-testid="beginner-flow-container"
    >
      {/* Beginner Step-by-Step Tabs Navigation */}
      <BeginnerTabNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isUnlocked={isUnlocked}
        hasBaseSubtitle={Boolean(selectedBaseLang)}
        baseLanguageName={baseLangObj?.name || selectedBaseLang.toUpperCase()}
        onSwitchToAdvanced={onSwitchToAdvanced}
      />

      {/* Video Player in Folded Accordion (First Tab Only) */}
      {activeTab === "video" && playerSlot && (
        <div
          className="w-full max-w-4xl mx-auto px-2 pt-2"
          data-testid="beginner-video-accordion-container"
        >
          <Accordion
            type="single"
            collapsible
            defaultValue=""
            value={accordionValue}
            onValueChange={setAccordionValue}
            className="w-full border border-border rounded-xl bg-card shadow-sm overflow-hidden"
          >
            <AccordionItem value="video-player" className="border-b-0">
              <AccordionTrigger
                className="px-4 py-2.5 text-xs font-semibold text-foreground hover:no-underline hover:bg-muted/30 flex items-center justify-between"
                data-testid="beginner-video-accordion-trigger"
              >
                <div className="flex items-center gap-2">
                  <Tv className="h-4 w-4 text-primary" />
                  <span>Video Player</span>
                  <span className="text-[11px] font-normal text-muted-foreground">
                    (
                    {isPlaying
                      ? "Playing"
                      : accordionValue === "video-player"
                        ? "Open"
                        : "Folded / Click to open"}
                    )
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent
                forceMount={true}
                className="p-2 pt-0"
                data-testid="beginner-video-accordion-content"
              >
                <div
                  className="w-full rounded-lg overflow-hidden bg-black aspect-video border border-border shadow-sm relative"
                  data-testid="beginner-player-slot-container"
                >
                  {playerSlot}
                </div>
                {playbackControlsSlot && <div className="pt-2">{playbackControlsSlot}</div>}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )}

      {/* Main Tab View Container */}
      <main className="flex-1 py-3 px-2">
        {activeTab === "video" && (
          <BeginnerVideoTab
            url={url}
            onUrlChange={onUrlChange}
            onSubmitUrl={handleSubmitUrl}
            videoId={videoId}
            onOpenLibrary={() => setIsLibraryOpen(true)}
            observedUrl={observedUrl}
            observedTracks={observedTracks}
            onLoadSampleSubtitles={onLoadSampleSubtitles}
            onContinueToNextTab={() => handleTabChange("parsing")}
            isAndroidNative={isAndroidNative}
            webDemoUrlsSlot={webDemoUrlsSlot}
            hasSubtitles={hasSubtitles}
            subtitlesTableSlot={subtitlesTableSlot}
            subtitlesRatio={subtitlesRatio}
            onSubtitlesRatioChange={(ratio) => {
              setSubtitlesRatio(ratio);
              updateSettings({ beginnerSubtitlesRatio: ratio });
              onSubtitlesRatioChange?.(ratio);
            }}
            showVideoSubtitles={showVideoSubtitles}
            onToggleVideoSubtitles={onToggleVideoSubtitles}
          />
        )}

        {activeTab === "preferences" && (
          <BeginnerPreferencesTab
            order={order}
            onOrderChange={(o) => {
              setOrder(o);
              updateSettings({
                playOrder: o === "tts-first" ? "tts_then_video" : "video_then_tts",
              });
              onOrderChange?.(o);
            }}
            ttsSpeed={ttsSpeed}
            onTtsSpeedChange={(s) => {
              setTtsSpeed(s);
              updateSettings({ beginnerTtsSpeed: s });
              onTtsSpeedChange?.(s);
            }}
            ttsVoice={ttsVoice}
            onTtsVoiceChange={(v) => {
              setTtsVoice(v);
              updateSettings({ beginnerTtsVoice: v });
              onTtsVoiceChange?.(v);
            }}
            favoriteLanguages={favoriteLanguages}
            onFavoriteLanguagesChange={(langs) => {
              setFavoriteLanguages(langs);
              updateSettings({ beginnerFavoriteLangs: langs });
              onFavoriteLanguagesChange?.(langs);
            }}
            showVideoSubtitles={showVideoSubtitles}
            onToggleVideoSubtitles={onToggleVideoSubtitles}
            baseLanguage={selectedBaseLang}
            onContinueToNextTab={() => handleTabChange("video")}
          />
        )}

        {activeTab === "parsing" && (
          <BeginnerParsingTab
            splitByPunctuation={splitByPunctuation}
            onSplitByPunctuationChange={(enabled) => {
              setSplitByPunctuation(enabled);
              updateSettings({ beginnerSplitByPunctuation: enabled });
            }}
            punctuationChars={punctuationChars}
            onPunctuationCharsChange={(chars) => {
              setPunctuationChars(chars);
              updateSettings({ beginnerPunctuationChars: chars });
            }}
            stripSpeakerBrackets={stripSpeakerBrackets}
            onStripSpeakerBracketsChange={(enabled) => {
              setStripSpeakerBrackets(enabled);
              updateSettings({ beginnerStripSpeakerBrackets: enabled });
            }}
            removeChars={removeChars}
            onRemoveCharsChange={(chars) => {
              setRemoveChars(chars);
              updateSettings({ beginnerRemoveChars: chars });
            }}
            sampleCues={activeBaseCues.map((c) => ({
              text: c.text,
              start: c.start,
              duration: Math.max(0, c.end - c.start),
            }))}
            onContinueToNextTab={() => handleTabChange("player")}
          />
        )}

        {activeTab === "player" && (
          <BeginnerPlayerTab
            cues={displayCues}
            currentTime={currentTime}
            isPlaying={isPlaying}
            onTogglePlay={onTogglePlay}
            onSeek={onSeek}
            baseLanguage={selectedBaseLang}
            targetLanguage={activeTargetLang}
            subtitlesRatio={subtitlesRatio}
            onBackToPreferences={() => handleTabChange("preferences")}
            onBackToParsing={() => handleTabChange("parsing")}
            subtitlesTableSlot={subtitlesTableSlot}
            onSpeakCue={onSpeakCue}
            speakingLang={speakingLang}
          />
        )}
      </main>

      {/* Video Library Modal */}
      <Dialog open={isLibraryOpen} onOpenChange={setIsLibraryOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold text-foreground">
              Saved Video Library
            </DialogTitle>
          </DialogHeader>
          <VideoLibraryPanel
            currentVideoId={videoId}
            onSelectVideo={(newId, newUrl) => {
              if (newUrl) {
                onSubmitUrl(newUrl);
              } else if (newId) {
                onSubmitUrl(`https://www.youtube.com/watch?v=${newId}`);
              }
              setIsLibraryOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
