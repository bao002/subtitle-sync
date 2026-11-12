import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { SubtitlesTablePanel, type SubtitlesTablePanelProps } from "./SubtitlesTablePanel";
import { type Row } from "@/lib/subtitles";
import { type SubtitleColumn } from "./SubtitleRow";
import { type TableDisplayMode } from "@/lib/playback-preferences";

const meta: Meta<typeof SubtitlesTablePanel> = {
  title: "Components/SubtitlesTablePanel",
  component: SubtitlesTablePanel,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Parallel subtitles table component supporting switching between 1 unified parallel table or multiple separate synchronized tables per language track.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof SubtitlesTablePanel>;

const sampleCols: SubtitleColumn[] = [
  { code: "en", tts: "en", name: "English", isYouTubeOrJson: true },
  { code: "es", tts: "es", name: "Spanish", isOnDemandTranslation: true },
  { code: "he", tts: "he", name: "Hebrew", isYouTubeTranslated: true },
];

const sampleRows: Row[] = [
  {
    start: 0,
    end: 3.5,
    texts: {
      en: "Hello and welcome to language learning with parallel subtitles.",
      es: "Hola y bienvenidos al aprendizaje de idiomas con subtítulos paralelos.",
      he: "שלום וברוכים הבאים ללימוד שפות עם כתוביות מקבילות.",
    },
  },
  {
    start: 3.5,
    end: 7.2,
    texts: {
      en: "You can toggle between one unified table and multiple dedicated tables.",
      es: "Puedes alternar entre una tabla unificada y múltiples tablas dedicadas.",
      he: "ניתן לעבור בין טבלה מאוחדת אחת לבין מספר טבלאות ייעודיות.",
    },
  },
  {
    start: 7.2,
    end: 11.0,
    texts: {
      en: "Every row remains perfectly synchronized across all language tracks.",
      es: "Cada fila se mantiene perfectamente sincronizada en todas las pistas de idioma.",
      he: "כל שורה נשארת מסונכרנת לחלוטין בכל רצועות השפה.",
    },
  },
];

const InteractiveWrapper: React.FC<Partial<SubtitlesTablePanelProps>> = (props) => {
  const [mode, setMode] = useState<TableDisplayMode>(props.tableDisplayMode ?? "single");
  const [activeIdx, setActiveIdx] = useState<number>(0);

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-4">
      <SubtitlesTablePanel
        isAndroid={false}
        rows={sampleRows}
        displayedRows={sampleRows}
        cols={sampleCols}
        baseLanguage="en"
        subtitlesLimit={0}
        setSubtitlesLimit={() => {}}
        subtitlesPage={1}
        setSubtitlesPage={() => {}}
        active={activeIdx}
        allFavoritesAligned={true}
        targetLanguages={["es", "he"]}
        speechProgress={null}
        tracks={null}
        onSeek={(_r, idx) => setActiveIdx(idx)}
        spokenLangs={["en", "es", "he"]}
        ttsRatios={{}}
        tableDisplayMode={mode}
        onTableDisplayModeChange={setMode}
        {...props}
      />
    </div>
  );
};

export const SingleTableMode: Story = {
  render: () => <InteractiveWrapper tableDisplayMode="single" />,
};

export const MultipleTablesMode: Story = {
  render: () => <InteractiveWrapper tableDisplayMode="multiple" />,
};

export const HighlightCriteriaMode: Story = {
  render: () => <InteractiveWrapper criteriaMatchAction="highlight" />,
};

export const Interactive: Story = {
  render: () => <InteractiveWrapper />,
};

