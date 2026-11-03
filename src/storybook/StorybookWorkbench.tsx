import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Sliders,
  Layers,
  Code2,
  ShieldCheck,
  Zap,
  Play,
  Volume2,
  Languages,
  Scissors,
  Move,
  Activity,
  Maximize2,
  Subtitles,
} from "lucide-react";
import {
  TtsServiceSettingsPanel,
  type TtsServiceSettingsPanelProps,
} from "@/components/TtsServiceSettingsPanel";
import { VideoPlaybackControls } from "@/components/VideoPlaybackControls";
import { FloatingDraggablePauseButton } from "@/components/FloatingDraggablePauseButton";
import { LanguageBoxesSelector } from "@/components/LanguageBoxesSelector";
import { SpecialCharactersRemovalPanel } from "@/components/SpecialCharactersRemovalPanel";
import { VideoLanguageSequenceControl } from "@/components/VideoLanguageSequenceControl";
import { ExternalTtsDebuggerPanel } from "@/components/ExternalTtsDebuggerPanel";
import { ModeSwitcherHeader } from "@/components/ModeSwitcherHeader";
import { SwitchableDefaultSubtitlesBar } from "@/components/SwitchableDefaultSubtitlesBar";
import {
  addExternalTtsAuditRecord,
  type AlternativeTtsEngine,
  type AlternativeTtsMode,
  type LovableTtsProvider,
  type RemoteTtsValidationResult,
} from "@/lib/alternative-tts";
import type { SectionOrder, TtsLanguageOrders } from "@/lib/playback-preferences";

type ComponentKey =
  | "tts_service"
  | "playback_controls"
  | "floating_pause"
  | "language_boxes"
  | "chars_removal"
  | "sequence_control"
  | "tts_debugger"
  | "mode_switcher"
  | "default_subtitles";

export const StorybookWorkbench: React.FC = () => {
  const [selectedComponent, setSelectedComponent] = useState<ComponentKey>("tts_service");
  const [selectedStory, setSelectedStory] = useState<string>("google_direct");
  const [activeDefaultSubtitle, setActiveDefaultSubtitle] = useState<string>("en");

  // 1. TtsServiceSettingsPanel State
  const [mode, setMode] = useState<AlternativeTtsMode>("always");
  const [engine, setEngine] = useState<AlternativeTtsEngine>("google_translate");
  const [provider, setProvider] = useState<LovableTtsProvider>("auto");
  const [voice, setVoice] = useState<string>("alloy");
  const [speechRate, setSpeechRate] = useState<number>(0.5);
  const [keyInput, setKeyInput] = useState<string>("");
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [isTestingAudio, setIsTestingAudio] = useState<boolean>(false);
  const [validationResult, setValidationResult] = useState<RemoteTtsValidationResult | null>(null);

  // 2. VideoPlaybackControls State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTimeSec, setCurrentTimeSec] = useState<number>(42);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [activeSectionIndex, setActiveSectionIndex] = useState<number>(2);
  const [isPausedForSpeech, setIsPausedForSpeech] = useState<boolean>(false);
  const [pauseReason, setPauseReason] = useState<string | null>(null);

  // 3. FloatingDraggablePauseButton State
  const [isSetupPaused, setIsSetupPaused] = useState<boolean>(false);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState<boolean>(true);

  // 4. LanguageBoxesSelector State
  const [selectedLangs, setSelectedLangs] = useState<string[]>(["en", "he"]);
  const [isAndroidBoxes, setIsAndroidBoxes] = useState<boolean>(false);

  // 5. SpecialCharactersRemovalPanel State
  const [stripSpeakerBrackets, setStripSpeakerBrackets] = useState<boolean>(true);
  const [removeChars, setRemoveChars] = useState<string[]>([">", ">>", "♪", "[Music]"]);

  // 6. VideoLanguageSequenceControl State
  const [sectionOrder, setSectionOrder] = useState<SectionOrder>("video-middle");
  const [languageOrders, setLanguageOrders] = useState<TtsLanguageOrders>({
    he: "tts-first",
    es: "video-first",
  });

  // 7. ModeSwitcherHeader State
  const [workflowMode, setWorkflowMode] = useState<"beginner" | "expert">("expert");

  // Prepopulate sample audit records for Debugger story
  useEffect(() => {
    addExternalTtsAuditRecord({
      method: "POST",
      url: "https://tts3.lovable.app/api/v1/tts",
      requestHeaders: {
        "content-type": "application/json",
        authorization: "Bearer spk_sample_token_9876",
        "x-provider": "openrouter",
      },
      requestBody: { text: "Hello from Storybook", lang: "en", voice: "alloy", provider: "openrouter" },
      status: 200,
      statusText: "OK",
      durationMs: 125,
      responseHeaders: { "content-type": "audio/mp3" },
      audioLengthBytes: 15400,
      audioMime: "audio/mp3",
    });
  }, []);

  const handleSelectStory = (storyKey: string) => {
    setSelectedStory(storyKey);
    if (selectedComponent === "tts_service") {
      switch (storyKey) {
        case "google_direct":
          setEngine("google_translate");
          setMode("always");
          setKeyInput("");
          setValidationResult(null);
          break;
        case "lovable_auto":
          setEngine("lovable");
          setProvider("auto");
          setMode("always");
          setKeyInput("");
          setValidationResult(null);
          break;
        case "lovable_openrouter":
          setEngine("lovable");
          setProvider("openrouter");
          setVoice("alloy");
          setKeyInput("spk_test_auth_token_9876");
          setMode("always");
          setValidationResult(null);
          break;
        case "lovable_openai":
          setEngine("lovable");
          setProvider("openai");
          setVoice("nova");
          setKeyInput("sk-proj-test-key");
          setMode("always");
          setValidationResult(null);
          break;
        case "fallback_only":
          setEngine("google_translate");
          setMode("fallback_only");
          setKeyInput("");
          setValidationResult(null);
          break;
        case "validation_error":
          setEngine("lovable");
          setProvider("openrouter");
          setMode("always");
          setValidationResult({
            ok: false,
            serviceName: "Lovable Speak API (openrouter)",
            latencyMs: 742,
            timestamp: Date.now(),
            error: "401 Unauthorized: Invalid API key credentials",
          });
          break;
      }
    } else if (selectedComponent === "playback_controls") {
      switch (storyKey) {
        case "playing":
          setIsPlaying(true);
          setIsPausedForSpeech(false);
          setPauseReason(null);
          break;
        case "paused":
          setIsPlaying(false);
          setIsPausedForSpeech(false);
          setPauseReason("Section boundary reached: synthesizing Hebrew TTS");
          break;
        case "narration":
          setIsPlaying(false);
          setIsPausedForSpeech(true);
          setPauseReason("Waiting for foreign TTS voice speech completion");
          break;
      }
    }
  };

  const handleValidate = async () => {
    setIsValidating(true);
    await new Promise((r) => setTimeout(r, 600));
    setIsValidating(false);
    setValidationResult({
      ok: true,
      serviceName:
        engine === "google_translate"
          ? "Google TTS (Direct)"
          : `Lovable Speak API (${provider})`,
      latencyMs: 138,
      timestamp: Date.now(),
      details: "Audio stream verified successfully",
    });
  };

  const handleTestAudio = async () => {
    setIsTestingAudio(true);
    await new Promise((r) => setTimeout(r, 900));
    setIsTestingAudio(false);
  };

  return (
    <div
      data-testid="storybook-workbench"
      className="min-h-screen bg-background text-foreground flex flex-col font-sans"
    >
      {/* Storybook Top Navigation Bar */}
      <header className="border-b border-border bg-card px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-gradient-to-tr from-pink-500 to-rose-400 flex items-center justify-center text-white shadow-2xs">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight flex items-center gap-1.5">
                Storybook Component Workbench
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                  Clean Room
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Global Component Selector Tabs */}
        <div
          data-testid="storybook-component-tabs"
          className="flex flex-wrap items-center gap-1 bg-muted/50 p-1 rounded-lg border border-border/60"
        >
          {[
            { id: "tts_service", label: "TTS Service", icon: Volume2 },
            { id: "playback_controls", label: "Playback Bar", icon: Play },
            { id: "floating_pause", label: "Floating Pause", icon: Move },
            { id: "language_boxes", label: "Language Boxes", icon: Languages },
            { id: "chars_removal", label: "Chars Removal", icon: Scissors },
            { id: "sequence_control", label: "Sequence Order", icon: Sliders },
            { id: "tts_debugger", label: "TTS Debugger", icon: Activity },
            { id: "mode_switcher", label: "Mode Switcher", icon: Sparkles },
            { id: "default_subtitles", label: "Default Subtitles", icon: Subtitles },
          ].map((c) => {
            const Icon = c.icon;
            const isSelected = selectedComponent === c.id;
            return (
              <button
                key={c.id}
                type="button"
                data-testid={`tab-component-${c.id}`}
                onClick={() => {
                  setSelectedComponent(c.id as ComponentKey);
                  setSelectedStory("default");
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  isSelected
                    ? "bg-card text-foreground font-semibold shadow-2xs border border-border/80"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="h-3 w-3" />
                <span>{c.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/storybook/index.html"
            target="_blank"
            rel="noreferrer"
            data-testid="storybook-static-docs-link"
            className="text-xs font-mono text-muted-foreground hover:text-foreground inline-flex items-center gap-1 px-2.5 py-1 rounded border border-border bg-background"
          >
            <Code2 className="h-3 w-3" />
            Static Build ↗
          </a>
          <Link
            to="/"
            data-testid="storybook-back-to-app-btn"
            className="text-xs font-medium inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-2xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to App
          </Link>
        </div>
      </header>

      {/* Main Two-Column Layout */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-border">
        {/* Left Sidebar: Stories Catalog & Component Info */}
        <aside className="md:col-span-3 p-4 bg-muted/20 space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Layers className="h-4 w-4 text-primary" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Stories for {selectedComponent}
              </h2>
            </div>
            <div className="space-y-1" data-testid="storybook-stories-list">
              {selectedComponent === "tts_service" && [
                { id: "google_direct", title: "1. Google TTS Direct", desc: "Hides provider & voice dropdowns; single validate button" },
                { id: "lovable_auto", title: "2. Lovable Auto Public", desc: "Shows provider select; hides custom keys & voices" },
                { id: "lovable_openrouter", title: "3. Lovable OpenRouter (Keyed)", desc: "Shows provider voices & Speak API / upstream key input" },
                { id: "lovable_openai", title: "4. Lovable OpenAI Provider", desc: "OpenAI neural voices (alloy, nova, etc.)" },
                { id: "fallback_only", title: "5. Fallback Only Mode", desc: "Radio set to fallback mode" },
                { id: "validation_error", title: "6. Validation Failure State", desc: "Error feedback banner and status" },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  data-testid={`story-item-${s.id}`}
                  onClick={() => handleSelectStory(s.id)}
                  className={`w-full text-left p-2.5 rounded-md text-xs transition-all cursor-pointer ${
                    selectedStory === s.id
                      ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                      : "hover:bg-muted text-foreground"
                  }`}
                >
                  <div className="font-medium">{s.title}</div>
                  <div className={`text-[10px] mt-0.5 line-clamp-1 ${selectedStory === s.id ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                    {s.desc}
                  </div>
                </button>
              ))}

              {selectedComponent === "playback_controls" && [
                { id: "playing", title: "1. Playing State", desc: "Active playback with moving scrubber" },
                { id: "paused", title: "2. Paused with Reason", desc: "Pause explanation banner visible" },
                { id: "narration", title: "3. Speaking Narration", desc: "TTS speech narration active" },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  data-testid={`story-item-${s.id}`}
                  onClick={() => handleSelectStory(s.id)}
                  className={`w-full text-left p-2.5 rounded-md text-xs transition-all cursor-pointer ${
                    selectedStory === s.id
                      ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                      : "hover:bg-muted text-foreground"
                  }`}
                >
                  <div className="font-medium">{s.title}</div>
                  <div className={`text-[10px] mt-0.5 line-clamp-1 ${selectedStory === s.id ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                    {s.desc}
                  </div>
                </button>
              ))}

              {selectedComponent !== "tts_service" && selectedComponent !== "playback_controls" && (
                <div className="p-3 rounded-lg border border-border bg-card/60 text-xs space-y-1">
                  <div className="font-semibold text-foreground">Interactive Clean-Room Story</div>
                  <div className="text-[11px] text-muted-foreground">
                    Direct interactive component preview with live property updates and responsive state rendering.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Component Quality Rules Card */}
          <div className="rounded-lg border border-border/80 bg-card p-3 space-y-2 text-xs">
            <span className="font-semibold flex items-center gap-1.5 text-foreground">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              Isolated Quality Standard
            </span>
            <ul className="space-y-1.5 text-[11px] text-muted-foreground list-disc pl-4">
              <li>
                <strong>Clean Room:</strong> Rendered in isolation without host application dependencies.
              </li>
              <li>
                <strong>Absolute Parity:</strong> Supports identical behaviors for Beginner &amp; Advanced modes.
              </li>
              <li>
                <strong>Zero Duplications:</strong> Single contextual action triggers.
              </li>
            </ul>
          </div>
        </aside>

        {/* Center Canvas: Live Component Isolation Frame */}
        <main className="md:col-span-9 p-6 bg-background space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border">
            <div>
              <h1 className="text-lg font-bold tracking-tight">
                {selectedComponent === "tts_service" && "TtsServiceSettingsPanel"}
                {selectedComponent === "playback_controls" && "VideoPlaybackControls"}
                {selectedComponent === "floating_pause" && "FloatingDraggablePauseButton"}
                {selectedComponent === "language_boxes" && "LanguageBoxesSelector"}
                {selectedComponent === "chars_removal" && "SpecialCharactersRemovalPanel"}
                {selectedComponent === "sequence_control" && "VideoLanguageSequenceControl"}
                {selectedComponent === "tts_debugger" && "ExternalTtsDebuggerPanel"}
                {selectedComponent === "mode_switcher" && "ModeSwitcherHeader"}
                {selectedComponent === "default_subtitles" && "SwitchableDefaultSubtitlesBar"}
              </h1>
              <p className="text-xs text-muted-foreground">
                Active Component Catalog:{" "}
                <span className="font-mono text-primary font-medium">{selectedComponent}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-muted px-2 py-1 rounded">
                <Sliders className="h-3.5 w-3.5" />
                Live Preview
              </span>
            </div>
          </div>

          {/* Component Preview Frame */}
          <div className="rounded-xl border border-border/80 bg-card/60 p-6 shadow-sm max-w-3xl mx-auto">
            {selectedComponent === "tts_service" && (
              <TtsServiceSettingsPanel
                mode={mode}
                onModeChange={setMode}
                engine={engine}
                onEngineChange={(eng) => {
                  setEngine(eng);
                  if (eng === "google_translate") {
                    setSelectedStory("google_direct");
                  }
                }}
                provider={provider}
                onProviderChange={setProvider}
                voice={voice}
                onVoiceChange={setVoice}
                speechRate={speechRate}
                onSpeechRateChange={setSpeechRate}
                currentKeyInput={keyInput}
                hasCustomKey={keyInput.startsWith("sk-")}
                hasCustomSpeakToken={keyInput.startsWith("spk_")}
                hasServerKey={false}
                onSaveKey={setKeyInput}
                onClearKey={() => setKeyInput("")}
                onValidateService={handleValidate}
                onTestAudio={handleTestAudio}
                isValidating={isValidating}
                isTestingAudio={isTestingAudio}
                validationResult={validationResult}
                showDebugger={false}
              />
            )}

            {selectedComponent === "playback_controls" && (
              <VideoPlaybackControls
                isPlaying={isPlaying}
                currentTimeSec={currentTimeSec}
                durationSec={184}
                playbackRate={playbackRate}
                activeSectionIndex={activeSectionIndex}
                totalSections={15}
                isPausedForSpeech={isPausedForSpeech}
                speakingLangName={isPausedForSpeech ? "Hebrew (עברית)" : undefined}
                pauseReason={pauseReason}
                onTogglePlay={() => setIsPlaying((p) => !p)}
                onSeek={(sec) => setCurrentTimeSec(sec)}
                onRewind={(sec = 5) => setCurrentTimeSec((c) => Math.max(0, c - sec))}
                onFastForward={(sec = 5) => setCurrentTimeSec((c) => Math.min(184, c + sec))}
                onPrevSection={() => setActiveSectionIndex((i) => Math.max(0, i - 1))}
                onNextSection={() => setActiveSectionIndex((i) => Math.min(14, i + 1))}
                onReplaySection={() => setCurrentTimeSec(35)}
                onStop={() => {
                  setIsPlaying(false);
                  setCurrentTimeSec(0);
                }}
                onRateChange={(r) => setPlaybackRate(r)}
              />
            )}

            {selectedComponent === "floating_pause" && (
              <div className="relative h-[280px] w-full border border-dashed border-border/80 rounded-lg p-4 flex flex-col justify-between overflow-hidden bg-muted/10">
                <span className="text-xs text-muted-foreground">
                  Interactive Drag Surface: Drag button or click to open the floating menu dock.
                </span>
                <FloatingDraggablePauseButton
                  isSetupPaused={isSetupPaused}
                  onToggleSetupPause={() => setIsSetupPaused((p) => !p)}
                  isAutoScrollEnabled={isAutoScrollEnabled}
                  onToggleAutoScroll={() => setIsAutoScrollEnabled((s) => !s)}
                />
              </div>
            )}

            {selectedComponent === "language_boxes" && (
              <LanguageBoxesSelector
                catalog={[
                  { code: "en", name: "English" },
                  { code: "he", name: "Hebrew (עברית)" },
                  { code: "ar", name: "Arabic (العربية)" },
                  { code: "es", name: "Spanish (Español)" },
                  { code: "fr", name: "French (Français)" },
                  { code: "de", name: "German (Deutsch)" },
                  { code: "it", name: "Italian (Italiano)" },
                  { code: "ru", name: "Russian (Русский)" },
                ]}
                selectedLanguages={selectedLangs}
                onSelectionChange={setSelectedLangs}
                favoriteLanguages={["en", "he", "ar"]}
                currentVideoId="L2Ryrr6txwA"
                isAndroid={isAndroidBoxes}
              />
            )}

            {selectedComponent === "chars_removal" && (
              <SpecialCharactersRemovalPanel
                stripSpeakerBrackets={stripSpeakerBrackets}
                onStripSpeakerBracketsChange={setStripSpeakerBrackets}
                removeChars={removeChars}
                onRemoveCharsChange={setRemoveChars}
                sampleCues={[
                  { text: "[Speaker 1]: >> Welcome to the video! ♪", start: 0, duration: 2500 },
                  { text: "[Music] Hello everyone > today we learn Hebrew.", start: 2500, duration: 3000 },
                ]}
                onResetDefaults={() => {
                  setStripSpeakerBrackets(true);
                  setRemoveChars([">", ">>"]);
                }}
              />
            )}

            {selectedComponent === "sequence_control" && (
              <VideoLanguageSequenceControl
                spokenLanguages={[
                  { code: "en", name: "English" },
                  { code: "he", name: "Hebrew" },
                  { code: "es", name: "Spanish" },
                  { code: "ar", name: "Arabic" },
                ]}
                sectionOrder={sectionOrder}
                languageOrders={languageOrders}
                onSectionOrderChange={setSectionOrder}
                onLanguageOrderChange={(code, ord) =>
                  setLanguageOrders((prev) => ({ ...prev, [code]: ord }))
                }
              />
            )}

            {selectedComponent === "tts_debugger" && (
              <ExternalTtsDebuggerPanel defaultExpanded={true} />
            )}

            {selectedComponent === "mode_switcher" && (
              <ModeSwitcherHeader
                currentMode={workflowMode}
                onModeChange={setWorkflowMode}
                className="!flex"
              />
            )}

            {selectedComponent === "default_subtitles" && (
              <SwitchableDefaultSubtitlesBar
                videoId="L2Ryrr6txwA"
                defaultLanguages={["en", "es", "he"]}
                activeLanguage={activeDefaultSubtitle}
                onSelectLanguage={setActiveDefaultSubtitle}
                tracks={{
                  en: {
                    wireMagic: "pb3",
                    pens: [],
                    wsWinStyles: [],
                    wpWinPositions: [],
                    events: [
                      {
                        tStartMs: 0,
                        dDurationMs: 4000,
                        segs: [{ utf8: "Hello, welcome back, my dear friends, to this tutorial." }],
                      },
                      {
                        tStartMs: 4100,
                        dDurationMs: 5000,
                        segs: [
                          {
                            utf8: "In this lesson, we will learn, practice, and master, step by step, all concepts.",
                          },
                        ],
                      },
                      {
                        tStartMs: 9200,
                        dDurationMs: 4500,
                        segs: [
                          {
                            utf8: "First, check the sound, then, watch the video, and finally, repeat aloud!",
                          },
                        ],
                      },
                    ],
                  },
                  es: {
                    wireMagic: "pb3",
                    pens: [],
                    wsWinStyles: [],
                    wpWinPositions: [],
                    events: [
                      {
                        tStartMs: 0,
                        dDurationMs: 4000,
                        segs: [{ utf8: "Hola, bienvenidos a este tutorial paso a paso." }],
                      },
                    ],
                  },
                  he: {
                    wireMagic: "pb3",
                    pens: [],
                    wsWinStyles: [],
                    wpWinPositions: [],
                    events: [
                      {
                        tStartMs: 0,
                        dDurationMs: 4000,
                        segs: [{ utf8: "שלום וברוכים הבאים למדריך זה." }],
                      },
                    ],
                  },
                }}
                defaultExpandedStats={true}
              />
            )}
          </div>

          {/* Active Reactivity Inspector Card */}
          <div className="rounded-lg border border-border/60 bg-muted/20 p-4 max-w-3xl mx-auto space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
              Active Reactivity Inspection
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="p-2 rounded bg-card border border-border/50">
                <span className="text-[10px] text-muted-foreground block">Active Component</span>
                <span className="font-bold text-primary truncate block">{selectedComponent}</span>
              </div>
              <div className="p-2 rounded bg-card border border-border/50">
                <span className="text-[10px] text-muted-foreground block">Isolation Quality</span>
                <span className="text-emerald-500 font-bold">Clean-Room Ready</span>
              </div>
              <div className="p-2 rounded bg-card border border-border/50">
                <span className="text-[10px] text-muted-foreground block">Parity Status</span>
                <span className="text-emerald-500 font-bold">100% Parity</span>
              </div>
              <div className="p-2 rounded bg-card border border-border/50">
                <span className="text-[10px] text-muted-foreground block">Action Duplications</span>
                <span className="text-emerald-500 font-bold">0 (Zero Clutter)</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
