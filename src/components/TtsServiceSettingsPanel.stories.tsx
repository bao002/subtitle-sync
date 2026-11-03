import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  TtsServiceSettingsPanel,
  type TtsServiceSettingsPanelProps,
} from "./TtsServiceSettingsPanel";
import type {
  AlternativeTtsEngine,
  AlternativeTtsMode,
  LovableTtsProvider,
  RemoteTtsValidationResult,
} from "@/lib/alternative-tts";

/**
 * Storybook Stories for TtsServiceSettingsPanel.
 *
 * Mission 1: TTS Service Reactive Controls Planning.
 * Controls dynamically adapt to eliminate clutter:
 * - Direct Google TTS: Hides provider, voice, and token menus. Shows public badge.
 * - Lovable Auto/Google: Shows provider dropdown, hides token input, shows default voice.
 * - Lovable Keyed (OpenRouter/OpenAI/Gemini/ElevenLabs): Dynamically reveals voice dropdown and token input.
 * - Single validate button and single test audio button (zero button duplications).
 */
const meta: Meta<typeof TtsServiceSettingsPanel> = {
  title: "Components/TtsServiceSettingsPanel",
  component: TtsServiceSettingsPanel,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Reactive TTS Service Settings Panel ensuring zero clutter and no duplicate validation buttons.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof TtsServiceSettingsPanel>;

// Interactive Wrapper to allow live testing in Storybook
const InteractivePanelWrapper: React.FC<Partial<TtsServiceSettingsPanelProps>> = (props) => {
  const [mode, setMode] = useState<AlternativeTtsMode>(props.mode || "always");
  const [engine, setEngine] = useState<AlternativeTtsEngine>(props.engine || "google_translate");
  const [provider, setProvider] = useState<LovableTtsProvider>(props.provider || "auto");
  const [voice, setVoice] = useState<string>(props.voice || "");
  const [speechRate, setSpeechRate] = useState<number>(props.speechRate ?? 0.5);
  const [key, setKey] = useState<string>(props.currentKeyInput || "");
  const [isAnonymous, setIsAnonymous] = useState<boolean>(props.isAnonymous ?? false);
  const [isValidating, setIsValidating] = useState(false);
  const [isTestingAudio, setIsTestingAudio] = useState(false);
  const [validationResult, setValidationResult] = useState<RemoteTtsValidationResult | null>(
    props.validationResult || null
  );

  const handleValidate = async () => {
    setIsValidating(true);
    await new Promise((r) => setTimeout(r, 600));
    setIsValidating(false);
    setValidationResult({
      ok: true,
      service: engine,
      serviceName: engine === "google_translate" ? "Google TTS Directly" : `Lovable Speak API (${provider})`,
      latencyMs: 142,
      timestamp: Date.now(),
      details: "Audio stream operational and responsive",
    });
  };

  const handleTestAudio = async () => {
    setIsTestingAudio(true);
    await new Promise((r) => setTimeout(r, 900));
    setIsTestingAudio(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 bg-background">
      <TtsServiceSettingsPanel
        mode={mode}
        onModeChange={setMode}
        engine={engine}
        onEngineChange={setEngine}
        provider={provider}
        onProviderChange={setProvider}
        voice={voice}
        onVoiceChange={setVoice}
        speechRate={speechRate}
        onSpeechRateChange={setSpeechRate}
        currentKeyInput={key}
        hasCustomKey={key.startsWith("sk-")}
        hasCustomSpeakToken={key.startsWith("spk_")}
        hasServerKey={false}
        onSaveKey={setKey}
        onClearKey={() => setKey("")}
        onValidateService={handleValidate}
        onTestAudio={handleTestAudio}
        isValidating={isValidating}
        isTestingAudio={isTestingAudio}
        validationResult={validationResult}
        isAnonymous={isAnonymous}
        onAnonymousChange={setIsAnonymous}
        showDebugger={props.showDebugger ?? false}
        {...props}
      />
    </div>
  );
};

/**
 * 1. Google Direct Mode (Initial Unvalidated State: Shows Validate button, hides Play button)
 */
export const GoogleDirect: Story = {
  render: () => <InteractivePanelWrapper engine="google_translate" mode="always" />,
};

/**
 * 2. Validated State with Play Button (After validation is OK: Shows Play button & Re-validate)
 */
export const ValidatedWithPlayButton: Story = {
  render: () => (
    <InteractivePanelWrapper
      engine="google_translate"
      mode="always"
      validationResult={{
        ok: true,
        service: "google_translate",
        serviceName: "Google TTS Directly (translate_tts)",
        latencyMs: 88,
        audioVerified: true,
        details: "Audio stream loaded and decoded successfully",
        timestamp: Date.now(),
      }}
    />
  ),
};

/**
 * 3. Anonymous Mode (Choose between regular and anonymous mode)
 */
export const AnonymousModeGoogleDirect: Story = {
  render: () => (
    <InteractivePanelWrapper
      engine="google_translate"
      mode="always"
      isAnonymous={true}
      validationResult={{
        ok: true,
        service: "google_translate",
        serviceName: "Google TTS Directly (translate_tts)",
        latencyMs: 92,
        audioVerified: true,
        details: "Anonymous stream verified",
        timestamp: Date.now(),
      }}
    />
  ),
};

/**
 * 4. Lovable Auto Public Tier (Shows provider selector; hides voice & token input since auto uses public tier)
 */
export const LovableAutoPublic: Story = {
  render: () => <InteractivePanelWrapper engine="lovable" provider="auto" mode="always" />,
};

/**
 * 5. Lovable OpenRouter Keyed (Reveals voice dropdown and token input for Speak API personal token or upstream key)
 */
export const LovableOpenRouterKeyed: Story = {
  render: () => (
    <InteractivePanelWrapper
      engine="lovable"
      provider="openrouter"
      voice="alloy"
      currentKeyInput="spk_preview_test_token"
      mode="always"
    />
  ),
};

/**
 * 6. Live Visual Debugger Monitoring on Same View
 */
export const LiveVisualMonitor: Story = {
  render: () => (
    <InteractivePanelWrapper
      engine="google_translate"
      mode="always"
      showDebugger={true}
      validationResult={{
        ok: true,
        service: "google_translate",
        serviceName: "Google TTS Directly",
        latencyMs: 104,
        timestamp: Date.now(),
      }}
    />
  ),
};

/**
 * 7. Validation Error State
 */
export const ValidationFailedState: Story = {
  render: () => (
    <InteractivePanelWrapper
      engine="lovable"
      provider="openrouter"
      mode="always"
      validationResult={{
        ok: false,
        service: "lovable",
        serviceName: "Lovable Speak API (openrouter)",
        latencyMs: 812,
        timestamp: Date.now(),
        error: "401 Unauthorized: Invalid Speak API token or provider credentials",
      }}
    />
  ),
};
