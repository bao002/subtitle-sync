import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { FetchedSubtitlesStagePanel } from "./FetchedSubtitlesStagePanel";

const meta: Meta<typeof FetchedSubtitlesStagePanel> = {
  title: "Components/FetchedSubtitlesStagePanel",
  component: FetchedSubtitlesStagePanel,
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof FetchedSubtitlesStagePanel>;

export const Default: Story = {
  render: () => {
    const [videoInput, setVideoInput] = useState("L2Ryrr6txwA");
    const [baseLanguage, setBaseLanguage] = useState("en");
    const [tracks, setTracks] = useState<any>({
      en: {
        events: [
          { tStartMs: 0, dDurationMs: 2000, segs: [{ utf8: "Hello world. How are you?" }] },
        ],
      },
      es: {
        events: [
          { tStartMs: 0, dDurationMs: 2000, segs: [{ utf8: "Hola, ¿cómo estás? Bien." }] },
          { tStartMs: 2100, dDurationMs: 2500, segs: [{ utf8: "Esto es una prueba. ¡Excelente!" }] },
        ],
      },
    });

    return (
      <div className="max-w-4xl mx-auto p-4 bg-background">
        <FetchedSubtitlesStagePanel
          videoId="L2Ryrr6txwA"
          videoInput={videoInput}
          onVideoInputChange={setVideoInput}
          onSubmitVideoUrl={(url) => setVideoInput(url)}
          observedUrl="https://www.youtube.com/api/timedtext?v=L2Ryrr6txwA&lang=en&fmt=json3"
          tracks={tracks}
          onTracksChange={setTracks}
          baseLanguage={baseLanguage}
          onSelectBaseLanguage={setBaseLanguage}
          defaultLanguages={["en", "es"]}
          isAndroid={false}
          onLoadSampleSubtitles={() => console.log("Load sample")}
          onProceedToStage={(s) => console.log("Proceed to stage", s)}
        />
      </div>
    );
  },
};
