import React, { useState } from "react";
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
} from "lucide-react";
import {
  TtsServiceSettingsPanel,
  type TtsServiceSettingsPanelProps,
} from "@/components/TtsServiceSettingsPanel";
import type {
  AlternativeTtsEngine,
  AlternativeTtsMode,
  LovableTtsProvider,
  RemoteTtsValidationResult,
} from "@/lib/alternative-tts";

export const StorybookWorkbench: React.FC = () => {
  const [selectedStory, setSelectedStory] = useState<string>("google_direct");

  // Interactive Story Props
  const [mode, setMode] = useState<AlternativeTtsMode>("always");
  const [engine, setEngine] = useState<AlternativeTtsEngine>("google_translate");
  const [provider, setProvider] = useState<LovableTtsProvider>("auto");
  const [voice, setVoice] = useState<string>("alloy");
  const [speechRate, setSpeechRate] = useState<number>(0.5);
  const [keyInput, setKeyInput] = useState<string>("");
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [isTestingAudio, setIsTestingAudio] = useState<boolean>(false);
  const [validationResult, setValidationResult] =
    useState<RemoteTtsValidationResult | null>(null);

  // Preset Story Switcher
  const handleSelectStory = (storyKey: string) => {
    setSelectedStory(storyKey);
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
      <header className="border-b border-border bg-card px-4 py-3 flex items-center justify-between shadow-2xs">
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

        <div className="flex items-center gap-3">
          <a
            href="/storybook/index.html"
            target="_blank"
            rel="noreferrer"
            data-testid="storybook-static-docs-link"
            className="text-xs font-mono text-muted-foreground hover:text-foreground inline-flex items-center gap-1 px-2.5 py-1 rounded border border-border bg-background"
          >
            <Code2 className="h-3 w-3" />
            Static Storybook Build ↗
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
        {/* Left Sidebar: Stories Index & Mission Specs */}
        <aside className="md:col-span-3 p-4 bg-muted/20 space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Layers className="h-4 w-4 text-primary" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Stories Catalog
              </h2>
            </div>
            <div className="space-y-1" data-testid="storybook-stories-list">
              {[
                {
                  id: "google_direct",
                  title: "1. Google TTS Direct",
                  desc: "Hides provider & voice dropdowns; single validate button",
                },
                {
                  id: "lovable_auto",
                  title: "2. Lovable Auto Public",
                  desc: "Shows provider select; hides custom keys & voices",
                },
                {
                  id: "lovable_openrouter",
                  title: "3. Lovable OpenRouter (Keyed)",
                  desc: "Shows provider voices & Speak API / upstream key input",
                },
                {
                  id: "lovable_openai",
                  title: "4. Lovable OpenAI Provider",
                  desc: "OpenAI neural voices (alloy, nova, etc.)",
                },
                {
                  id: "fallback_only",
                  title: "5. Fallback Only Mode",
                  desc: "Radio set to fallback mode",
                },
                {
                  id: "validation_error",
                  title: "6. Validation Failure State",
                  desc: "Error feedback banner and status",
                },
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
                  <div
                    className={`text-[10px] mt-0.5 line-clamp-1 ${
                      selectedStory === s.id
                        ? "text-primary-foreground/80"
                        : "text-muted-foreground"
                    }`}
                  >
                    {s.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Mission Rules Card */}
          <div className="rounded-lg border border-border/80 bg-card p-3 space-y-2 text-xs">
            <span className="font-semibold flex items-center gap-1.5 text-foreground">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              Storybook Mission 1 Goals
            </span>
            <ul className="space-y-1.5 text-[11px] text-muted-foreground list-disc pl-4">
              <li>
                <strong>Zero Clutter:</strong> Google Direct hides irrelevant
                provider, voice, and token menus.
              </li>
              <li>
                <strong>No Duplications:</strong> Eliminates duplicate validate
                buttons under selector.
              </li>
              <li>
                <strong>Reactive:</strong> Dynamic visibility adapts strictly to
                engine &amp; provider selection.
              </li>
            </ul>
          </div>
        </aside>

        {/* Center Canvas: Live Component Isolation Frame */}
        <main className="md:col-span-9 p-6 bg-background space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border">
            <div>
              <h1 className="text-lg font-bold tracking-tight">
                TtsServiceSettingsPanel
              </h1>
              <p className="text-xs text-muted-foreground">
                Story:{" "}
                <span className="font-mono text-primary font-medium">
                  {selectedStory}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-muted px-2 py-1 rounded">
                <Sliders className="h-3.5 w-3.5" />
                Reactive Preview
              </span>
            </div>
          </div>

          {/* Component Preview Frame */}
          <div className="rounded-xl border border-border/80 bg-card/60 p-6 shadow-sm max-w-3xl mx-auto">
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
          </div>

          {/* Reactive Audit Inspector */}
          <div className="rounded-lg border border-border/60 bg-muted/20 p-4 max-w-3xl mx-auto space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
              Active Reactivity Inspection
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="p-2 rounded bg-card border border-border/50">
                <span className="text-[10px] text-muted-foreground block">
                  Engine
                </span>
                <span className="font-bold text-primary">{engine}</span>
              </div>
              <div className="p-2 rounded bg-card border border-border/50">
                <span className="text-[10px] text-muted-foreground block">
                  Provider Dropdown
                </span>
                <span
                  className={
                    engine === "google_translate"
                      ? "text-amber-500 font-bold"
                      : "text-emerald-500 font-bold"
                  }
                >
                  {engine === "google_translate" ? "HIDDEN (Clean)" : "VISIBLE"}
                </span>
              </div>
              <div className="p-2 rounded bg-card border border-border/50">
                <span className="text-[10px] text-muted-foreground block">
                  Voice Dropdown
                </span>
                <span
                  className={
                    engine === "google_translate" ||
                    provider === "google" ||
                    provider === "auto"
                      ? "text-amber-500 font-bold"
                      : "text-emerald-500 font-bold"
                  }
                >
                  {engine === "google_translate" ||
                  provider === "google" ||
                  provider === "auto"
                    ? "HIDDEN (Clean)"
                    : "VISIBLE"}
                </span>
              </div>
              <div className="p-2 rounded bg-card border border-border/50">
                <span className="text-[10px] text-muted-foreground block">
                  Validate Buttons
                </span>
                <span className="text-emerald-500 font-bold">1 (Single)</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
