import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  AlternativeVideoPlayerView,
  type AlternativeVideoPlayerViewProps,
} from "./AlternativeVideoPlayerView";

const meta: Meta<typeof AlternativeVideoPlayerView> = {
  title: "Components/AlternativeVideoPlayerView",
  component: AlternativeVideoPlayerView,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Alternative high-clarity view to the video-player displaying current subtitles, real-time part sentence / part word progress, and translation to the current TTS-play language.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof AlternativeVideoPlayerView>;

const InteractiveWrapper: React.FC<Partial<AlternativeVideoPlayerViewProps>> = (props) => {
  const [isVideoPlaying, setIsVideoPlaying] = useState(props.isVideoPlaying ?? false);
  const [activeRowIndex, setActiveRowIndex] = useState(props.activeRowIndex ?? 2);
  const [targetTtsLang, setTargetTtsLang] = useState(props.targetTtsLang ?? "es");
  const [currentTimeSec, setCurrentTimeSec] = useState(props.currentTimeSec ?? 14.5);

  const sentences = [
    {
      base: "Welcome back to the channel, today we are building something incredible.",
      es: "Bienvenidos de nuevo al canal, hoy estamos construyendo algo increíble.",
      he: "ברוכים השבים לערוץ, היום אנחנו בונים משהו מדהים.",
      start: 0,
      end: 5500,
    },
    {
      base: "Let's first take a look at the architectural diagram.",
      es: "Primero echemos un vistazo al diagrama arquitectónico.",
      he: "בואו נסתכל תחילה על התרשים הארכיטקטוני.",
      start: 5500,
      end: 11000,
    },
    {
      base: "Here we have the parallel subtitles pipeline processing the timed text.",
      es: "Aquí tenemos el pipeline de subtítulos paralelos procesando el texto temporizado.",
      he: "כאן יש לנו את צינור הכתוביות המקבילות שמעבד את הטקסט המתוזמן.",
      start: 11000,
      end: 18000,
    },
    {
      base: "Notice how the active words are highlighted in real time.",
      es: "Observa cómo las palabras activas se resaltan en tiempo real.",
      he: "שימו לב כיצד המילים הפעילות מודגשות בזמן אמת.",
      start: 18000,
      end: 24500,
    },
  ];

  const current = sentences[activeRowIndex] || sentences[0];
  const targetName = targetTtsLang === "he" ? "Hebrew" : "Spanish";

  return (
    <div className="max-w-3xl mx-auto p-4 bg-background">
      <AlternativeVideoPlayerView
        currentSentence={current.base}
        baseLanguage="en"
        baseLanguageName="English"
        targetTtsLang={targetTtsLang}
        targetTtsLangName={targetName}
        targetTranslation={targetTtsLang === "he" ? current.he : current.es}
        availableTtsLanguages={[
          { code: "es", name: "Spanish" },
          { code: "he", name: "Hebrew" },
        ]}
        onSelectTtsLang={(code) => setTargetTtsLang(code)}
        speechProgress={
          props.speechProgress ?? {
            lang: targetTtsLang,
            row: activeRowIndex,
            start: 0,
            end: 10,
          }
        }
        isSpeaking={props.isSpeaking ?? false}
        speakingLang={props.speakingLang ?? null}
        speakingRow={activeRowIndex}
        activeRowIndex={activeRowIndex}
        totalRows={sentences.length}
        currentTimeSec={currentTimeSec}
        durationSec={120}
        rowStartMs={current.start}
        rowEndMs={current.end}
        isVideoPlaying={isVideoPlaying}
        onTogglePlay={() => setIsVideoPlaying((p) => !p)}
        onPrevSentence={() => setActiveRowIndex((i) => Math.max(0, i - 1))}
        onNextSentence={() => setActiveRowIndex((i) => Math.min(sentences.length - 1, i + 1))}
        onReplaySentence={() => setCurrentTimeSec(current.start / 1000)}
        onCloseAlternativeView={() => alert("Switching back to standard video view")}
        onSpeakText={(text, lang) => console.log(`Pronouncing "${text}" in ${lang}`)}
        {...props}
      />
    </div>
  );
};

export const VideoPlayingState: Story = {
  render: () => (
    <InteractiveWrapper
      isVideoPlaying={true}
      currentTimeSec={14.2}
      activeRowIndex={2}
      isSpeaking={false}
    />
  ),
};

export const TtsSpeakingState: Story = {
  render: () => (
    <InteractiveWrapper
      isVideoPlaying={false}
      currentTimeSec={18.0}
      activeRowIndex={2}
      isSpeaking={true}
      speakingLang="es"
      speechProgress={{
        lang: "es",
        row: 2,
        start: 0,
        end: 12,
      }}
    />
  ),
};

export const HebrewRtlTranslation: Story = {
  render: () => (
    <InteractiveWrapper
      isVideoPlaying={true}
      currentTimeSec={7.5}
      activeRowIndex={1}
      targetTtsLang="he"
      isSpeaking={false}
    />
  ),
};
