import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { FloatingErrorButton, type FloatingErrorButtonProps } from "./FloatingErrorButton";
import { LogEntry } from "@/utils/logBuffer";

const sampleErrors: LogEntry[] = [
  {
    id: "err-1",
    timestamp: Date.now() - 30000,
    formattedTime: "12:00:01",
    category: "TimedtextFetch",
    message: "HTTP 404: Subtitle track not available for lang: fr",
    level: "ERROR",
    details: { url: "https://www.youtube.com/api/timedtext?v=L2Ryrr6txwA&lang=fr", status: 404 },
  },
  {
    id: "err-2",
    timestamp: Date.now() - 10000,
    formattedTime: "12:00:21",
    category: "TtsEngine",
    message: "Speech synthesis canceled due to audio context timeout",
    level: "ERROR",
    details: { lang: "he", timeoutMs: 3000 },
  },
];

const meta: Meta<typeof FloatingErrorButton> = {
  title: "Components/FloatingErrorButton",
  component: FloatingErrorButton,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Draggable floating button that dynamically surfaces application errors rising in real-time with error count badge, Copy Error Only, Copy Around Error, and inspectable modal.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof FloatingErrorButton>;

export const WithActiveErrors: Story = {
  render: () => (
    <div className="relative w-full h-[400px] bg-muted/20 border border-dashed border-border rounded-xl p-4 overflow-hidden">
      <div className="text-xs text-muted-foreground">
        Floating error button appears when errors are rising. Click to inspect, copy, or clear errors.
      </div>
      <FloatingErrorButton initialErrors={sampleErrors} />
    </div>
  ),
};

export const WithoutErrorsHidden: Story = {
  render: () => (
    <div className="relative w-full h-[200px] bg-muted/20 border border-dashed border-border rounded-xl p-4 overflow-hidden flex items-center justify-center">
      <div className="text-xs text-muted-foreground">
        When no errors are present, the button remains completely hidden.
      </div>
      <FloatingErrorButton initialErrors={[]} />
    </div>
  ),
};
