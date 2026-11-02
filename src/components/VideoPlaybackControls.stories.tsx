import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  VideoPlaybackControls,
  type VideoPlaybackControlsProps,
} from "./VideoPlaybackControls";

const meta: Meta<typeof VideoPlaybackControls> = {
  title: "Components/VideoPlaybackControls",
  component: VideoPlaybackControls,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Video transport bar featuring responsive time scrubbing, playback rate switcher, section jumping, and pause diagnostic explanations.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof VideoPlaybackControls>;

const InteractiveControlsWrapper: React.FC<Partial<VideoPlaybackControlsProps>> = (props) => {
  const [isPlaying, setIsPlaying] = useState(props.isPlaying ?? false);
  const [currentTimeSec, setCurrentTimeSec] = useState(props.currentTimeSec ?? 42);
  const [playbackRate, setPlaybackRate] = useState(props.playbackRate ?? 1.0);
  const [activeSectionIndex, setActiveSectionIndex] = useState(props.activeSectionIndex ?? 3);

  return (
    <div className="max-w-2xl mx-auto p-4 bg-background border border-border rounded-xl">
      <VideoPlaybackControls
        isPlaying={isPlaying}
        currentTimeSec={currentTimeSec}
        durationSec={props.durationSec ?? 184}
        playbackRate={playbackRate}
        activeSectionIndex={activeSectionIndex}
        totalSections={props.totalSections ?? 15}
        isPausedForSpeech={props.isPausedForSpeech ?? false}
        speakingLangName={props.speakingLangName}
        pauseReason={props.pauseReason}
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
        {...props}
      />
    </div>
  );
};

export const PlayingState: Story = {
  render: () => <InteractiveControlsWrapper isPlaying={true} currentTimeSec={65} />,
};

export const PausedState: Story = {
  render: () => (
    <InteractiveControlsWrapper
      isPlaying={false}
      currentTimeSec={42}
      pauseReason="Section boundary reached: synthesizing Hebrew TTS"
    />
  ),
};

export const SpeakingNarrationState: Story = {
  render: () => (
    <InteractiveControlsWrapper
      isPlaying={false}
      currentTimeSec={120}
      isPausedForSpeech={true}
      speakingLangName="Hebrew (עברית)"
      pauseReason="Waiting for foreign TTS voice speech completion"
    />
  ),
};

export const SlowMotionPlayback: Story = {
  render: () => <InteractiveControlsWrapper isPlaying={true} playbackRate={0.75} />,
};
