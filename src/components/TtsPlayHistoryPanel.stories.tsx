import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { TtsPlayHistoryPanel } from "./TtsPlayHistoryPanel";
import type { TtsPlayHistoryEntry } from "@/utils/ttsPlayHistory";

const SAMPLE_HISTORY: TtsPlayHistoryEntry[] = [
  {
    id: "hist-1",
    timestamp: Date.now() - 45_000,
    formattedTime: new Date(Date.now() - 45_000).toISOString(),
    videoId: "L2Ryrr6txwA",
    videoTitle: "Interactive Subtitle Sync Demo",
    videoTimeSec: 18.4,
    rowIndex: 2,
    sentence: "Welcome to the language learning adventure.",
    playedText: "ברוכים הבאים להרפתקת לימוד השפה.",
    spokenLang: "he",
    baseLang: "en",
    translationText: "ברוכים הבאים להרפתקת לימוד השפה.",
    translationLang: "he",
    ttsProvider: "lovable:google",
    source: "auto_playback",
  },
  {
    id: "hist-2",
    timestamp: Date.now() - 125_000,
    formattedTime: new Date(Date.now() - 125_000).toISOString(),
    videoId: "L2Ryrr6txwA",
    videoTitle: "Interactive Subtitle Sync Demo",
    videoTimeSec: 9.1,
    rowIndex: 0,
    sentence: "Short phrases help you focus.",
    playedText: "Las frases cortas te ayudan a concentrarte.",
    spokenLang: "es",
    baseLang: "en",
    translationText: "Las frases cortas te ayudan a concentrarte.",
    translationLang: "es",
    ttsProvider: "native",
    source: "subtitle_table_cue",
  },
];

const meta: Meta<typeof TtsPlayHistoryPanel> = {
  title: "Components/TtsPlayHistoryPanel",
  component: TtsPlayHistoryPanel,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "History Stage panel displaying every TTS-play event (sentence played, translation used, timestamp, videoId/title, and playback position) for debugging and reproducing behavior.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof TtsPlayHistoryPanel>;

export const PopulatedHistory: Story = {
  render: () => {
    const [entries, setEntries] = useState(SAMPLE_HISTORY);
    const [lastAction, setLastAction] = useState("");
    return (
      <div className="max-w-4xl mx-auto p-4 space-y-3">
        <TtsPlayHistoryPanel
          currentVideoId="L2Ryrr6txwA"
          entriesOverride={entries}
          onReplayEntry={(e) => setLastAction(`Replay ${e.translationLang}: ${e.playedText}`)}
          onNavigateToVideo={(vid, sec) => setLastAction(`Jump to ${vid} @ ${sec}s`)}
          onClearHistory={() => setEntries([])}
        />
        {lastAction && (
          <div className="text-xs font-mono text-muted-foreground border border-border rounded px-3 py-1.5 bg-muted/30">
            Action: {lastAction}
          </div>
        )}
      </div>
    );
  },
};

export const EmptyState: Story = {
  render: () => (
    <div className="max-w-4xl mx-auto p-4">
      <TtsPlayHistoryPanel entriesOverride={[]} />
    </div>
  ),
};
