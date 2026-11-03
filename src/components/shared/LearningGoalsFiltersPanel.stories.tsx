import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { LearningGoalsFiltersPanel } from "./LearningGoalsFiltersPanel";

const meta: Meta<typeof LearningGoalsFiltersPanel> = {
  title: "Components/LearningGoalsFiltersPanel",
  component: LearningGoalsFiltersPanel,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof LearningGoalsFiltersPanel>;

export const Default: Story = {
  render: () => {
    const [maxWords, setMaxWords] = useState<number>(10);
    const [skipIncomplete, setSkipIncomplete] = useState<boolean>(false);

    return (
      <div className="w-[450px]">
        <LearningGoalsFiltersPanel
          maxWords={maxWords}
          onMaxWordsChange={setMaxWords}
          skipIncompleteSentences={skipIncomplete}
          onSkipIncompleteSentencesChange={setSkipIncomplete}
        />
      </div>
    );
  },
};

export const ActiveFilters: Story = {
  render: () => {
    const [maxWords, setMaxWords] = useState<number>(6);
    const [skipIncomplete, setSkipIncomplete] = useState<boolean>(true);

    return (
      <div className="w-[450px]">
        <LearningGoalsFiltersPanel
          maxWords={maxWords}
          onMaxWordsChange={setMaxWords}
          skipIncompleteSentences={skipIncomplete}
          onSkipIncompleteSentencesChange={setSkipIncomplete}
        />
      </div>
    );
  },
};
