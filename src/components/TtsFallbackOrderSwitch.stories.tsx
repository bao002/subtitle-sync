import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  TtsFallbackOrderSwitch,
  type TtsFallbackOrderSwitchProps,
} from "./TtsFallbackOrderSwitch";
import type { TtsFallbackOrder } from "@/lib/alternative-tts";

/**
 * Storybook Stories for TtsFallbackOrderSwitch.
 *
 * Implements Task 291: TTS Fallback Order Switch Around Video Player with Deep-Link to TTS3 Setup.
 *
 * Storybook-first policy verified:
 * - Order 1: Google directly -> TTS3 service -> Native
 * - Order 2: TTS3 service -> Google directly -> Native
 * - Order 3: Native voice -> Google directly -> TTS3 service
 * - Deep-link button to navigate into TTS service setup to configure token and provider.
 */
const meta: Meta<typeof TtsFallbackOrderSwitch> = {
  title: "Components/TtsFallbackOrderSwitch",
  component: TtsFallbackOrderSwitch,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Controls the fallback sequence for subtitle speech playback: Google directly, TTS3 service, and native voice, with quick setup navigation.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof TtsFallbackOrderSwitch>;

const InteractiveSwitchWrapper: React.FC<Partial<TtsFallbackOrderSwitchProps>> = (props) => {
  const [order, setOrder] = useState<TtsFallbackOrder>(props.currentOrder || "tts3_native");
  const [navigatedNotice, setNavigatedNotice] = useState<string | null>(null);

  const handleNavigate = () => {
    setNavigatedNotice("Navigated to TTS Service Setup (stage 4 accordion / token configuration)!");
    setTimeout(() => setNavigatedNotice(null), 3000);
    props.onNavigateToSetup?.();
  };

  return (
    <div className="max-w-xl mx-auto p-4 space-y-3 bg-background">
      <TtsFallbackOrderSwitch
        currentOrder={order}
        onOrderChange={setOrder}
        onNavigateToSetup={handleNavigate}
        tts3TokenConfigured={props.tts3TokenConfigured ?? false}
        tts3Provider={props.tts3Provider || "auto"}
        {...props}
      />
      {navigatedNotice && (
        <div
          data-testid="story-navigated-notice"
          className="p-2 rounded bg-primary/10 border border-primary/30 text-primary text-xs font-mono"
        >
          {navigatedNotice}
        </div>
      )}
    </div>
  );
};

/**
 * 1. Default: TTS3 Service First (TTS3 -> Native)
 */
export const Tts3ServiceFirst: Story = {
  render: () => (
    <InteractiveSwitchWrapper
      currentOrder="tts3_native"
      tts3Provider="auto"
      tts3TokenConfigured={false}
    />
  ),
};

/**
 * 2. Native Device Voice First (Native -> TTS3)
 */
export const NativeVoiceFirst: Story = {
  render: () => (
    <InteractiveSwitchWrapper
      currentOrder="native_tts3"
      tts3Provider="auto"
      tts3TokenConfigured={false}
    />
  ),
};

/**
 * 3. Native Only (Offline)
 */
export const NativeOnly: Story = {
  render: () => (
    <InteractiveSwitchWrapper
      currentOrder="native_only"
      tts3Provider="auto"
      tts3TokenConfigured={false}
    />
  ),
};
