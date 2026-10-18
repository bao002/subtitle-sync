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
import { fetchAndCacheSubtitleUrl } from "@/utils/subtitleUrlDetector";

export interface BeginnerFlowContainerProps {
  url: string;
  videoId: string;
  onUrlChange: (newUrl: string) => void;
  onSubmitUrl: (urlToLoad: string) => void;
  subtitlesUrl?: string;
  onSubtitlesUrlChange?: (newUrl: string) => void;
  onSubmitSubtitlesUrl?: (subtitlesUrl: string) => Promise<void> | void;
  observedUrl: string | null;
  rawTracks: Record<string, Json3>;
  currentTime: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSeek: (seconds: number) => void;
  onLoadSampleSubtitles?: () => void;
  isAndroidNative?: boolean;
  playerSlot?: React.ReactNode;
}

export const BeginnerFlowContainer: React.FC<BeginnerFlowContainerProps> = ({
  url,
  videoId,
  onUrlChange,
  onSubmitUrl,
  subtitlesUrl,
  onSubtitlesUrlChange,
  onSubmitSubtitlesUrl,
  observedUrl,
  rawTracks,
  currentTime,
  isPlaying,
  onTogglePlay,
  onSeek,
  onLoadSampleSubtitles,
  isAndroidNative = false,
  playerSlot,
}) => {
  // Load initial settings
  const [settings, setSettings] = useState<AppSettings>(() => loadAppSettings());

  const [activeTab, setActiveTab] = useState<BeginnerTabId>(settings.beginnerActiveTab || "video");
  const [selectedBaseLang, setSelectedBaseLang] = useState<string>(
    settings.beginnerSelectedBaseLang || "",
  );
  const [order, setOrder] = useState<"video-first" | "tts-first">(
    settings.playOrder === "tts_then_video" ? "tts-first" : "video-first",
  );
  const [ttsSpeed, setTtsSpeed] = useState<number>(settings.beginnerTtsSpeed ?? 1.0);
  const [ttsVoice, setTtsVoice] = useState<string>(settings.beginnerTtsVoice ?? "");
  const [subtitlesRatio, setSubtitlesRatio] = useState<number>(
    settings.beginnerSubtitlesRatio ?? 1.0,
  );
  const [favoriteLanguages, setFavoriteLanguages] = useState<string[]>(() => {
    const rawFavs =
      settings.beginnerFavoriteLangs && settings.beginnerFavoriteLangs.length > 0
        ? settings.beginnerFavoriteLangs
        : ["he", "en", "es", "fr", "ru", "ar"];
    const base = settings.beginnerSelectedBaseLang || "";
    const exclude = settings.excludeDefaultSubtitlesFromTTS ?? true;
    if (exclude && base) {
      return rawFavs.filter((l) => l !== base);
    }
    return rawFavs;
  });
  const [splitByPunctuation, setSplitByPunctuation] = useState<boolean>(
    settings.beginnerSplitByPunctuation ?? true,
  );
  const [punctuationChars, setPunctuationChars] = useState<string[]>(
    settings.beginnerPunctuationChars && settings.beginnerPunctuationChars.length > 0
      ? settings.beginnerPunctuationChars
      : [".", "!", "?", ",", ";", ":"],
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

  // Auto-select base language if at least 1 track is detected and none is selected
  useEffect(() => {
    if (!selectedBaseLang && observedTracks.length >= 1) {
      const first = observedTracks[0].lang;
      setSelectedBaseLang(first);
      updateSettings({ beginnerSelectedBaseLang: first });
    }
  }, [observedTracks, selectedBaseLang]);

  // Determine if downstream tabs are unlocked
  const isUnlocked = Boolean(selectedBaseLang);

  const handleInternalSubmitSubtitlesUrl = async (subUrl: string) => {
    if (onSubmitSubtitlesUrl) {
      await onSubmitSubtitlesUrl(subUrl);
    } else {
      const result = await fetchAndCacheSubtitleUrl(subUrl, videoId);
      if (!selectedBaseLang) {
        setSelectedBaseLang(result.lang);
        updateSettings({ beginnerSelectedBaseLang: result.lang });
      }
    }
  };

  const handleSelectBaseLang = (lang: string) => {
    setSelectedBaseLang(lang);
    const exclude = settings.excludeDefaultSubtitlesFromTTS ?? true;
    if (exclude) {
      const nextFavs = favoriteLanguages.filter((l) => l !== lang);
      setFavoriteLanguages(nextFavs);
      updateSettings({
        beginnerSelectedBaseLang: lang,
        beginnerFavoriteLangs: nextFavs,
      });
    } else {
      updateSettings({ beginnerSelectedBaseLang: lang });
    }
  };

  const handleTabChange = (newTab: BeginnerTabId) => {
    // If user clicks a locked tab, do nothing
    if (newTab !== "video" && !isUnlocked) return;
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
        duration: baseCue.duration,
        baseText: cleanedBase,
        targetText: cleanedTarget,
      };
    });
  }, [activeBaseCues, activeTargetCues, stripSpeakerBrackets, removeChars]);

  const baseLangObj = ALL_KNOWN_LANGUAGES.find((l) => l.code === selectedBaseLang);

  return (
    <div
      className="w-full min-h-screen bg-slate-950 text-slate-100 flex flex-col"
      data-testid="beginner-flow-container"
    >
      {/* Beginner Step-by-Step Tabs Navigation */}
      <BeginnerTabNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isUnlocked={isUnlocked}
        hasBaseSubtitle={Boolean(selectedBaseLang)}
        baseLanguageName={baseLangObj?.name || selectedBaseLang.toUpperCase()}
      />

      {/* Main Tab View Container */}
      <main className="flex-1 py-3 px-2">
        {activeTab === "video" && (
          <BeginnerVideoTab
            url={url}
            onUrlChange={onUrlChange}
            onSubmitUrl={onSubmitUrl}
            subtitlesUrl={subtitlesUrl}
            onSubtitlesUrlChange={onSubtitlesUrlChange}
            onSubmitSubtitlesUrl={handleInternalSubmitSubtitlesUrl}
            videoId={videoId}
            onOpenLibrary={() => setIsLibraryOpen(true)}
            observedUrl={observedUrl}
            observedTracks={observedTracks}
            selectedBaseLang={selectedBaseLang}
            onSelectBaseLang={handleSelectBaseLang}
            onLoadSampleSubtitles={onLoadSampleSubtitles}
            onContinueToNextTab={() => handleTabChange("preferences")}
            isAndroidNative={isAndroidNative}
            playerSlot={playerSlot}
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
            }}
            ttsSpeed={ttsSpeed}
            onTtsSpeedChange={(s) => {
              setTtsSpeed(s);
              updateSettings({ beginnerTtsSpeed: s });
            }}
            ttsVoice={ttsVoice}
            onTtsVoiceChange={(v) => {
              setTtsVoice(v);
              updateSettings({ beginnerTtsVoice: v });
            }}
            subtitlesRatio={subtitlesRatio}
            onSubtitlesRatioChange={(r) => {
              setSubtitlesRatio(r);
              updateSettings({ beginnerSubtitlesRatio: r });
            }}
            favoriteLanguages={favoriteLanguages}
            onFavoriteLanguagesChange={(langs) => {
              setFavoriteLanguages(langs);
              updateSettings({ beginnerFavoriteLangs: langs });
            }}
            baseLanguage={selectedBaseLang}
            onContinueToNextTab={() => handleTabChange("parsing")}
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
              duration: c.duration,
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
          />
        )}
      </main>

      {/* Video Library Modal */}
      <Dialog open={isLibraryOpen} onOpenChange={setIsLibraryOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto bg-slate-900 border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold text-slate-100">
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
