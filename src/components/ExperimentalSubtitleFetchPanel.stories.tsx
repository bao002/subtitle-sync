import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  ExperimentalSubtitleFetchPanel,
  type ExperimentalSubtitleFetchPanelProps,
} from "./ExperimentalSubtitleFetchPanel";

const meta: Meta<typeof ExperimentalSubtitleFetchPanel> = {
  title: "Components/ExperimentalSubtitleFetchPanel",
  component: ExperimentalSubtitleFetchPanel,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Debug Mode experimental features panel allowing developers to test fetching subtitles in other languages using with/without tlang and with/without server proxy.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof ExperimentalSubtitleFetchPanel>;

export const Default: Story = {
  args: {
    currentVideoId: "L2Ryrr6txwA",
    observedUrl: "https://www.youtube.com/api/timedtext?v=L2Ryrr6txwA&lang=en&fmt=json3",
    fetchServerUrl: "http://localhost:8080/fetch",
    defaultServerEnabled: false,
  },
};

export const WithServerProxyEnabled: Story = {
  args: {
    currentVideoId: "L2Ryrr6txwA",
    observedUrl: "https://www.youtube.com/api/timedtext?v=L2Ryrr6txwA&lang=en&fmt=json3",
    fetchServerUrl: "http://localhost:8080/fetch",
    defaultServerEnabled: true,
  },
};
