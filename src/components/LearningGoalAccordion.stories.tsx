import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { LearningGoalAccordion } from "./LearningGoalAccordion";
import { Globe, BookOpen, Sliders } from "lucide-react";

const meta: Meta<typeof LearningGoalAccordion> = {
  title: "Components/LearningGoalAccordion",
  component: LearningGoalAccordion,
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof LearningGoalAccordion>;

export const DefaultFolded: Story = {
  args: {
    id: "demo-folded",
    title: "1. Default Source Language",
    icon: <Globe className="h-3.5 w-3.5" />,
    defaultOpen: false,
    autoTimeout: true,
    children: (
      <div className="p-2 bg-muted/40 rounded text-xs">
        Select source subtitle track for translation.
      </div>
    ),
  },
};

export const OpenWithAutoFoldCountdown: Story = {
  args: {
    id: "demo-open",
    title: "2. Approved Learning Languages",
    icon: <BookOpen className="h-3.5 w-3.5" />,
    defaultOpen: true,
    autoTimeout: true,
    badge: (
      <span className="text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded">
        3 selected
      </span>
    ),
    children: (
      <div className="p-2 bg-muted/40 rounded text-xs space-y-1">
        <p className="font-semibold text-foreground">Learning Target Languages</p>
        <p className="text-muted-foreground">This accordion auto-folds in 10s unless pinned.</p>
      </div>
    ),
  },
};

export const PinnedStaysOpen: Story = {
  args: {
    id: "demo-pinned",
    title: "3. Narration & Ratios",
    icon: <Sliders className="h-3.5 w-3.5" />,
    defaultOpen: true,
    autoTimeout: false,
    children: (
      <div className="p-2 bg-muted/40 rounded text-xs">
        Pinned open: will not auto-fold.
      </div>
    ),
  },
};
