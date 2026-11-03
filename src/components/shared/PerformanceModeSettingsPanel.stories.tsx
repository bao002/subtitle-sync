import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  PerformanceModeSettingsPanel,
  type PerformanceModeSettingsPanelProps,
} from "./PerformanceModeSettingsPanel";

const meta: Meta<typeof PerformanceModeSettingsPanel> = {
  title: "Components/PerformanceModeSettingsPanel",
  component: PerformanceModeSettingsPanel,
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof PerformanceModeSettingsPanel>;

export const DefaultFastMode: Story = {
  render: () => (
    <div className="max-w-3xl mx-auto p-4 bg-background">
      <PerformanceModeSettingsPanel />
    </div>
  ),
};

export const CompactContainer: Story = {
  render: () => (
    <div className="max-w-md mx-auto p-2 bg-background">
      <PerformanceModeSettingsPanel className="border-primary/30" />
    </div>
  ),
};
