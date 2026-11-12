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

export const PerLanguageRowCriteria: Story = {
  render: () => {
    const [maxWords, setMaxWords] = useState<number>(10);
    const [skipIncomplete, setSkipIncomplete] = useState<boolean>(false);
    const [langMaxWords, setLangMaxWords] = useState<Record<string, number>>({
      es: 6,
      he: 8,
    });
    const [langSkipIncomplete, setLangSkipIncomplete] = useState<Record<string, boolean>>({
      es: true,
    });

    const sampleLanguages = [
      { code: "es", name: "Spanish" },
      { code: "he", name: "Hebrew" },
      { code: "ar", name: "Arabic" },
    ];

    const sampleRows = [
      { start: 0, end: 2000, texts: { es: "Hola mundo.", he: "שלום עולם.", ar: "مرحبا بالعالم." }, criteria: [] },
      { start: 2000, end: 5000, texts: { es: "Esta es una oración mucho más larga de prueba.", he: "משפט ארוך יותר לבדיקה.", ar: "جملة طويلة للاختبار." }, criteria: [] },
      { start: 5000, end: 7000, texts: { es: "Frase incompleta sin punto", he: "קצר.", ar: "قصير." }, criteria: [] },
    ];

    return (
      <div className="w-[480px]">
        <LearningGoalsFiltersPanel
          maxWords={maxWords}
          onMaxWordsChange={setMaxWords}
          skipIncompleteSentences={skipIncomplete}
          onSkipIncompleteSentencesChange={setSkipIncomplete}
          learningLanguages={sampleLanguages}
          rows={sampleRows}
          baseLanguage="es"
          languageMaxWords={langMaxWords}
          onLanguageMaxWordsChange={(code, val) => {
            setLangMaxWords((prev) => {
              const next = { ...prev };
              if (val !== undefined) next[code] = val;
              else delete next[code];
              return next;
            });
          }}
          languageSkipIncomplete={langSkipIncomplete}
          onLanguageSkipIncompleteChange={(code, val) => {
            setLangSkipIncomplete((prev) => {
              const next = { ...prev };
              if (val !== undefined) next[code] = val;
              else delete next[code];
              return next;
            });
          }}
          onResetAllLanguageCriteria={() => {
            setLangMaxWords({});
            setLangSkipIncomplete({});
          }}
        />
      </div>
    );
  },
};
