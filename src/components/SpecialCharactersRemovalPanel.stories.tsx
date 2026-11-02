import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  SpecialCharactersRemovalPanel,
  type SpecialCharactersRemovalPanelProps,
} from "./SpecialCharactersRemovalPanel";

const meta: Meta<typeof SpecialCharactersRemovalPanel> = {
  title: "Components/SpecialCharactersRemovalPanel",
  component: SpecialCharactersRemovalPanel,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Stage 3 Special Characters Removal panel for stripping speaker tags, brackets, and sound cues before sentence parsing and translation.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof SpecialCharactersRemovalPanel>;

const InteractiveCharsRemovalWrapper: React.FC<Partial<SpecialCharactersRemovalPanelProps>> = (props) => {
  const [stripSpeakerBrackets, setStripSpeakerBrackets] = useState(props.stripSpeakerBrackets ?? true);
  const [removeChars, setRemoveChars] = useState<string[]>(props.removeChars ?? [">", ">>", "♪", "[Music]"]);

  return (
    <div className="max-w-2xl mx-auto p-4 bg-background border border-border rounded-xl">
      <SpecialCharactersRemovalPanel
        stripSpeakerBrackets={stripSpeakerBrackets}
        onStripSpeakerBracketsChange={(enabled) => setStripSpeakerBrackets(enabled)}
        removeChars={removeChars}
        onRemoveCharsChange={(chars) => setRemoveChars(chars)}
        sampleCues={[
          { text: "[Speaker 1]: >> Welcome to the video! ♪", start: 0, duration: 2500 },
          { text: "[Music playing] Hello everyone > today we learn Hebrew.", start: 2500, duration: 3000 },
        ]}
        onResetDefaults={() => {
          setStripSpeakerBrackets(true);
          setRemoveChars([">", ">>"]);
        }}
        {...props}
      />
    </div>
  );
};

export const DefaultRemovalSettings: Story = {
  render: () => <InteractiveCharsRemovalWrapper stripSpeakerBrackets={true} removeChars={[">", ">>"]} />,
};

export const CustomCharactersConfigured: Story = {
  render: () => (
    <InteractiveCharsRemovalWrapper
      stripSpeakerBrackets={true}
      removeChars={[">", ">>", "♪", "[Music]", "[Applause]"]}
    />
  ),
};
