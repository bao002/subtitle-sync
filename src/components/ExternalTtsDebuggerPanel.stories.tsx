import React, { useEffect } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ExternalTtsDebuggerPanel } from "./ExternalTtsDebuggerPanel";
import { addExternalTtsAuditRecord } from "@/lib/alternative-tts";

const meta: Meta<typeof ExternalTtsDebuggerPanel> = {
  title: "Components/ExternalTtsDebuggerPanel",
  component: ExternalTtsDebuggerPanel,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Real-time external TTS service debugger displaying live HTTP requests, headers, cURL exports, response statuses, and audio playback previews.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof ExternalTtsDebuggerPanel>;

const DebuggerWrapper: React.FC = () => {
  useEffect(() => {
    // Populate sample audit records for story preview
    addExternalTtsAuditRecord({
      id: "sample-lovable-1",
      timestamp: Date.now() - 3000,
      method: "POST",
      url: "https://tts3.lovable.app/api/v1/tts",
      endpoint: "https://tts3.lovable.app/api/v1/tts",
      lang: "he",
      text: "Shalom, how are you today?",
      requestHeaders: {
        "content-type": "application/json",
        authorization: "Bearer spk_sample_personal_token_1234",
        "x-provider": "openrouter",
      },
      requestBody: {
        text: "Shalom, how are you today?",
        lang: "he",
        voice: "alloy",
        provider: "openrouter",
      },
      status: 200,
      statusText: "OK",
      latencyMs: 142,
      responseHeaders: { "content-type": "audio/mp3" },
      responseType: "binary",
      audioSizeBytes: 18450,
      audioMime: "audio/mp3",
      source: "test_button",
    });

    addExternalTtsAuditRecord({
      id: "sample-google-2",
      timestamp: Date.now() - 1000,
      method: "GET",
      url: "https://translate.google.com/translate_tts?ie=UTF-8&tl=he&q=%D7%A9%D7%9C%D7%95%D7%9D&client=tw-ob",
      endpoint: "https://translate.google.com/translate_tts",
      lang: "he",
      text: "שלום",
      requestHeaders: {
        referer: "https://www.youtube.com/",
        "user-agent": "Mozilla/5.0",
      },
      status: 200,
      statusText: "OK",
      latencyMs: 88,
      responseHeaders: { "content-type": "audio/mpeg" },
      responseType: "media",
      audioSizeBytes: 9400,
      audioMime: "audio/mpeg",
      source: "test_button",
    });
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-4 bg-background border border-border rounded-xl">
      <ExternalTtsDebuggerPanel defaultExpanded={true} />
    </div>
  );
};

export const LiveDebuggerWithRecords: Story = {
  render: () => <DebuggerWrapper />,
};
