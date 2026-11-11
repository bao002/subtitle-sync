import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { CanvasBalloonGame, type CanvasBalloonGameProps } from "./CanvasBalloonGame";

const meta: Meta<typeof CanvasBalloonGame> = {
  title: "Components/CanvasBalloonGame",
  component: CanvasBalloonGame,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Full screen HTML5 Canvas Balloon Game without video player. Players pop floating balloons labeled with sentence words to reveal and hear word translations.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof CanvasBalloonGame>;

const InteractiveStoryWrapper: React.FC<Partial<CanvasBalloonGameProps>> = (props) => {
  const [activeSentenceIndex, setActiveSentenceIndex] = useState(0);
  const [targetLang, setTargetLang] = useState("he");

  const sampleSentences = [
    {
      base: "Pop the floating balloons to learn vocabulary.",
      translation: "פוצץ את הבלונים הצפים כדי ללמוד אוצר מילים.",
    },
    {
      base: "Every word has a hidden translation behind it.",
      translation: "לכל מילה יש תרגום נסתר מאחוריה.",
    },
    {
      base: "Enjoy the game on full screen without any video.",
      translation: "תהנה מהמשחק במסך מלא ללא שום סרטון.",
    },
  ];

  const current = sampleSentences[activeSentenceIndex];

  return (
    <div className="w-full h-screen bg-slate-950 p-4">
      <CanvasBalloonGame
        currentSentence={current.base}
        baseLanguage="en"
        baseLanguageName="English"
        targetLanguage={targetLang}
        targetLanguageName="Hebrew"
        targetTranslation={current.translation}
        availableTargetLanguages={[
          { code: "he", name: "Hebrew" },
          { code: "es", name: "Spanish" },
          { code: "fr", name: "French" },
        ]}
        onSelectTargetLanguage={setTargetLang}
        activeRowIndex={activeSentenceIndex}
        totalRows={sampleSentences.length}
        onPrevSentence={() => setActiveSentenceIndex((i) => Math.max(0, i - 1))}
        onNextSentence={() =>
          setActiveSentenceIndex((i) => Math.min(sampleSentences.length - 1, i + 1))
        }
        onReplaySentence={() => setActiveSentenceIndex(0)}
        onSpeakText={(text, lang) => {
          console.log(`[TTS Speak] ${lang}: "${text}"`);
        }}
        onCloseGame={() => alert("Close game triggered")}
        {...props}
      />
    </div>
  );
};

export const Default: Story = {
  render: () => <InteractiveStoryWrapper />,
};

export const FullScreenMode: Story = {
  render: () => <InteractiveStoryWrapper initialFullScreen={true} />,
};
