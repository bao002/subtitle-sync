import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  LanguageBoxesSelector,
  type LanguageBoxesSelectorProps,
} from "./LanguageBoxesSelector";

const SAMPLE_CATALOG = [
  { code: "en", name: "English" },
  { code: "he", name: "Hebrew (עברית)" },
  { code: "ar", name: "Arabic (العربية)" },
  { code: "es", name: "Spanish (Español)" },
  { code: "fr", name: "French (Français)" },
  { code: "de", name: "German (Deutsch)" },
  { code: "it", name: "Italian (Italiano)" },
  { code: "ru", name: "Russian (Русский)" },
  { code: "pt", name: "Portuguese (Português)" },
];

const meta: Meta<typeof LanguageBoxesSelector> = {
  title: "Components/LanguageBoxesSelector",
  component: LanguageBoxesSelector,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Touch-friendly selectable language pills/boxes with list/grid toggle, favorite tagging, and per-language subtitle URL inputs.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof LanguageBoxesSelector>;

const InteractiveLanguageBoxesWrapper: React.FC<Partial<LanguageBoxesSelectorProps>> = (props) => {
  const [selected, setSelected] = useState<string[]>(props.selectedLanguages ?? ["en", "he"]);

  return (
    <div className="max-w-2xl mx-auto p-4 bg-background border border-border rounded-xl">
      <LanguageBoxesSelector
        catalog={props.catalog ?? SAMPLE_CATALOG}
        selectedLanguages={selected}
        onSelectionChange={(next) => setSelected(next)}
        favoriteLanguages={props.favoriteLanguages ?? ["en", "he", "ar"]}
        currentVideoId="L2Ryrr6txwA"
        isAndroid={props.isAndroid ?? false}
        {...props}
      />
    </div>
  );
};

export const MultiLanguageSelection: Story = {
  render: () => (
    <InteractiveLanguageBoxesWrapper
      selectedLanguages={["en", "he", "es"]}
      favoriteLanguages={["en", "he", "es", "ar"]}
    />
  ),
};

export const SingleTargetLanguageMode: Story = {
  render: () => (
    <InteractiveLanguageBoxesWrapper
      selectedLanguages={["he"]}
      favoriteLanguages={["he"]}
    />
  ),
};

export const AndroidLargeTouchTargets: Story = {
  render: () => (
    <InteractiveLanguageBoxesWrapper
      isAndroid={true}
      selectedLanguages={["en", "he"]}
    />
  ),
};
