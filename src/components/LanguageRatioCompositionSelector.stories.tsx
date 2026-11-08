import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { LanguageRatioCompositionSelector } from "./LanguageRatioCompositionSelector";
import {
  type LanguageRatioComposition,
  BUILT_IN_COMPOSITIONS,
} from "@/utils/ratioCompositionsManager";

const meta: Meta<typeof LanguageRatioCompositionSelector> = {
  title: "Components/LanguageRatioCompositionSelector",
  component: LanguageRatioCompositionSelector,
};

export default meta;
type Story = StoryObj<typeof LanguageRatioCompositionSelector>;

const sampleCustomProfiles: LanguageRatioComposition[] = [
  ...BUILT_IN_COMPOSITIONS,
  {
    id: "custom_spanish_focus",
    name: "Spanish Immersion (3:1)",
    ratios: { es: 3, en: 1 },
    isBuiltIn: false,
    rates: { es: 1.25, en: 1.0 },
  },
  {
    id: "custom_hebrew_drill",
    name: "Hebrew Review (2:1)",
    ratios: { he: 2, en: 1 },
    isBuiltIn: false,
    rates: { he: 0.75, en: 1.0 },
  },
];

export const Default: Story = {
  render: () => {
    const [profiles, setProfiles] = useState<LanguageRatioComposition[]>(sampleCustomProfiles);
    const [activeId, setActiveId] = useState<string>("builtin_equal_1_1");

    return (
      <div className="p-4 bg-background max-w-xl">
        <LanguageRatioCompositionSelector
          activeCompositionId={activeId}
          compositions={profiles}
          onSelectComposition={(comp) => setActiveId(comp.id)}
          onSaveProfile={(name) => {
            const newComp: LanguageRatioComposition = {
              id: `custom_${Date.now()}`,
              name,
              ratios: { default: 2 },
              isBuiltIn: false,
            };
            setProfiles((prev) => [...prev, newComp]);
            setActiveId(newComp.id);
          }}
          onUpdateProfile={(id, updates) => {
            setProfiles((prev) =>
              prev.map((c) => (c.id === id ? { ...c, ...updates, name: updates.name || c.name } : c)),
            );
          }}
          onDeleteProfile={(id) => {
            setProfiles((prev) => prev.filter((c) => c.id !== id));
            setActiveId("builtin_equal_1_1");
          }}
        />
      </div>
    );
  },
};
