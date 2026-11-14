import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { OpenRouterSettingsPanel } from "./OpenRouterSettingsPanel";

const meta: Meta<typeof OpenRouterSettingsPanel> = {
  title: "Components/OpenRouterSettingsPanel",
  component: OpenRouterSettingsPanel,
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof OpenRouterSettingsPanel>;

export const EmptyKeyDefault: Story = {
  render: () => (
    <div className="max-w-2xl mx-auto p-4 bg-background">
      <OpenRouterSettingsPanel apiKey="" selectedModel="openrouter/auto:free" />
    </div>
  ),
};

export const ConfiguredCustomKey: Story = {
  render: () => (
    <div className="max-w-2xl mx-auto p-4 bg-background">
      <OpenRouterSettingsPanel
        apiKey="sk-or-v1-example-storybook-key-123456"
        selectedModel="openrouter/auto:free"
      />
    </div>
  ),
};
