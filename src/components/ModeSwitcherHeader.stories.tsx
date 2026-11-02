import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ModeSwitcherHeader, type ModeSwitcherHeaderProps } from "./ModeSwitcherHeader";

const meta: Meta<typeof ModeSwitcherHeader> = {
  title: "Components/ModeSwitcherHeader",
  component: ModeSwitcherHeader,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Workflow header allowing switching between Guided Beginner Mode and Advanced Studio.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof ModeSwitcherHeader>;

const InteractiveHeaderWrapper: React.FC<Partial<ModeSwitcherHeaderProps>> = (props) => {
  const [mode, setMode] = useState<"beginner" | "expert">(props.currentMode ?? "expert");

  return (
    <div className="max-w-2xl mx-auto border border-border rounded-lg overflow-hidden">
      <ModeSwitcherHeader
        currentMode={mode}
        onModeChange={(m) => setMode(m)}
        className="!flex"
        {...props}
      />
    </div>
  );
};

export const AdvancedStudioMode: Story = {
  render: () => <InteractiveHeaderWrapper currentMode="expert" />,
};

export const BeginnerGuidedMode: Story = {
  render: () => <InteractiveHeaderWrapper currentMode="beginner" />,
};
