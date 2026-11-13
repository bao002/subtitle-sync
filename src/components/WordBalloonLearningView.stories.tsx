import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  WordBalloonLearningView,
  type WordBalloonLearningViewProps,
} from "./WordBalloonLearningView";

const meta: Meta<typeof WordBalloonLearningView> = {
  title: "Components/WordBalloonLearningView",
  component: WordBalloonLearningView,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Dedicated interactive learning game where instead of showing the video player, users play a rich subtitle-driven game with Sentence Builder, Word Match, Missing Word, and Word Balloon discovery modes.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof WordBalloonLearningView>;

const InteractiveStoryWrapper: React.FC<Partial<WordBalloonLearningViewProps>> = (props) => {
  const [activeRowIndex, setActiveRowIndex] = useState<number>(props.activeRowIndex ?? 0);
  const [targetLang, setTargetLang] = useState<string>(props.targetLanguage ?? "es");

  const sampleSentences = [
    {
      base: "Welcome to the language learning adventure.",
      es: "Bienvenidos a la aventura de aprender idiomas.",
      he: "ברוכים הבאים להרפתקת לימוד השפה.",
      it: "Benvenuti nell'avventura di apprendimento linguistico.",
    },
    {
      base: "Punch each balloon to expose its translation.",
      es: "Golpea cada globo para descubrir su traducción.",
      he: "נקב כל בלון כדי לחשוף את התרגום שלו.",
      it: "Colpisci ogni palloncino per svelare la sua traduzione.",
    },
    {
      base: "Practice vocabulary interactively with instant feedback.",
      es: "Practica vocabulario interactivamente con retroalimentación instantánea.",
      he: "תרגל אוצר מילים באופן אינטראקטיבי עם משוב מיידי.",
      it: "Esercitati con il vocabolario in modo interattivo con feedback istantaneo.",
    },
  ];

  const current = sampleSentences[activeRowIndex] || sampleSentences[0];
  const targetMap: Record<string, string> = {
    es: "Spanish",
    he: "Hebrew",
    it: "Italian",
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <WordBalloonLearningView
        currentSentence={current.base}
        baseLanguage="en"
        baseLanguageName="English"
        targetLanguage={targetLang}
        targetLanguageName={targetMap[targetLang] || "Spanish"}
        targetTranslation={(current as Record<string, string>)[targetLang] || current.es}
        availableTargetLanguages={[
          { code: "es", name: "Spanish" },
          { code: "he", name: "Hebrew" },
          { code: "it", name: "Italian" },
        ]}
        onSelectTargetLanguage={setTargetLang}
        activeRowIndex={activeRowIndex}
        totalRows={sampleSentences.length}
        onPrevSentence={() => setActiveRowIndex((i) => Math.max(0, i - 1))}
        onNextSentence={() =>
          setActiveRowIndex((i) => Math.min(sampleSentences.length - 1, i + 1))
        }
        onReplaySentence={() => setActiveRowIndex(0)}
        onSpeakText={() => new Promise((resolve) => setTimeout(resolve, 250))}
        onStopSpeaking={() => {}}
        onCloseLearningView={() => {}}
        {...props}
      />
    </div>
  );
};

export const Default: Story = {
  render: () => <InteractiveStoryWrapper />,
};

export const Interactive: Story = {
  render: () => <InteractiveStoryWrapper initialGameMode="sentence_builder" />,
};

export const GuidedWizardMenu: Story = {
  render: () => <InteractiveStoryWrapper />,
};

export const EmptyContentWizard: Story = {
  render: () => {
    const EmptyWrapper: React.FC = () => {
      const [loaded, setLoaded] = useState(false);
      return (
        <div className="max-w-3xl mx-auto p-4">
          <WordBalloonLearningView
            currentSentence={loaded ? "Welcome to the language learning adventure." : ""}
            baseLanguage="en"
            baseLanguageName="English"
            targetLanguage="es"
            targetLanguageName="Spanish"
            targetTranslation={loaded ? "Bienvenidos a la aventura de aprender idiomas." : ""}
            activeRowIndex={loaded ? 0 : -1}
            totalRows={loaded ? 1 : 0}
            onLoadSampleSubtitles={() => setLoaded(true)}
            onCloseLearningView={() => {}}
          />
        </div>
      );
    };
    return <EmptyWrapper />;
  },
};

export const HebrewTargetRTL: Story = {
  render: () => <InteractiveStoryWrapper targetLanguage="he" initialGameMode="word_balloons" />,
};

export const ListeningGame: Story = {
  render: () => (
    <InteractiveStoryWrapper
      initialGameMode="listening_game"
      subtitleRows={[
        {
          texts: {
            en: "Welcome to the language learning adventure. Short phrase!",
            es: "Bienvenidos a la aventura de aprender idiomas. ¡Frase corta!",
            he: "ברוכים הבאים להרפתקת לימוד השפה. משפט קצר!",
          },
        },
        {
          texts: {
            en: "Practice vocabulary interactively with instant feedback every day.",
            es: "Practica vocabulario interactivamente con retroalimentación instantánea cada día.",
            he: "תרגל אוצר מילים באופן אינטראקטיבי עם משוב מיידי כל יום.",
          },
        },
      ]}
    />
  ),
};
