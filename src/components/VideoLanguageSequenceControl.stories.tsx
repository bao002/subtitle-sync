import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  VideoLanguageSequenceControl,
  type VideoLanguageSequenceControlProps,
} from "./VideoLanguageSequenceControl";
import type { SectionOrder, TtsLanguageOrders } from "@/lib/playback-preferences";

const meta: Meta<typeof VideoLanguageSequenceControl> = {
  title: "Components/VideoLanguageSequenceControl",
  component: VideoLanguageSequenceControl,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Video and TTS playback sequence control: video-first, tts-first, or video-middle with per-language partitioning.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof VideoLanguageSequenceControl>;

const InteractiveSequenceWrapper: React.FC<Partial<VideoLanguageSequenceControlProps>> = (props) => {
  const [order, setOrder] = useState<SectionOrder>(props.sectionOrder ?? "video-middle");
  const [langOrders, setLangOrders] = useState<TtsLanguageOrders>(props.languageOrders ?? {
    he: "tts-first",
    es: "video-first",
  });

  return (
    <div className="max-w-2xl mx-auto p-4 bg-background border border-border rounded-xl">
      <VideoLanguageSequenceControl
        spokenLanguages={[
          { code: "en", name: "English" },
          { code: "he", name: "Hebrew" },
          { code: "es", name: "Spanish" },
          { code: "ar", name: "Arabic" },
        ]}
        sectionOrder={order}
        languageOrders={langOrders}
        onSectionOrderChange={(newOrder) => setOrder(newOrder)}
        onLanguageOrderChange={(code, newOrder) =>
          setLangOrders((prev) => ({ ...prev, [code]: newOrder }))
        }
        {...props}
      />
    </div>
  );
};

export const VideoMiddleSequence: Story = {
  render: () => <InteractiveSequenceWrapper sectionOrder="video-middle" />,
};

export const VideoFirstSequence: Story = {
  render: () => <InteractiveSequenceWrapper sectionOrder="video-first" />,
};

export const TtsFirstSequence: Story = {
  render: () => <InteractiveSequenceWrapper sectionOrder="tts-first" />,
};
