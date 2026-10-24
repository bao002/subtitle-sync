import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BeginnerParsingTab } from "../src/components/beginner/tabs/BeginnerParsingTab";

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), "utf8");

const route = read("src/routes/index.tsx");
const panel = read("src/components/SubtitlesTablePanel.tsx");
const beginner = read("src/components/beginner/tabs/BeginnerParsingTab.tsx");
const parserBar = read("src/components/NewSubtitlesParserBar.tsx");

for (const obsoleteToken of [
  "ParserDiffConfirmationModal",
  "ParserRealtimeSimulation",
  "pendingParserChange",
  "checkAndApplyCriteria",
  "confirm-parser-diff",
]) {
  assert(!route.includes(obsoleteToken), `route must not retain ${obsoleteToken}`);
}

assert(
  route.includes("const applyCriteriaNow = useCallback"),
  "criteria must have a direct apply path",
);
assert(
  route.includes("setSelectedCriteria(nextCriteria)") &&
    route.includes("setCriteriaSettings(nextSettings)"),
  "applying parser criteria must update state immediately",
);
assert(
  route.includes("applyCriteriaNow(updated, criteriaSettings)") &&
    route.includes("applyCriteriaNow(presetCriteria, nextSettings)"),
  "criterion and preset changes must bypass review and apply directly",
);
assert(
  route.includes("simpleAlign(tracks, baseLanguage, simpleParserConfig)"),
  "table rows must be derived from current parser configuration",
);
assert(
  route.includes("onParserConfigChange={setSimpleParserConfig}"),
  "table parser edits must update the configuration used to derive rows",
);

const parserBarIndex = panel.indexOf("<NewSubtitlesParserBar");
const tableIndex = panel.indexOf("<table");
assert(
  parserBarIndex >= 0 && parserBarIndex < tableIndex,
  "parser controls must precede the live table",
);
assert(
  parserBar.includes('data-testid="parser-split-dot-toggle"') &&
    parserBar.includes("onChange={() => handleToggle"),
  "parser controls must expose interactive settings",
);

assert(
  beginner.includes("const processedPreview = useMemo") &&
    beginner.includes("processedPreview.flatMap") &&
    beginner.includes('data-testid="parser-live-output-sentence"'),
  "beginner mode must render processed subtitles directly as parser settings change",
);
assert(
  beginner.includes("Load subtitles to see the parser output update here."),
  "beginner preview must explain that authentic subtitles are required",
);
assert(
  !beginner.includes("ParserRealtimeSimulation"),
  "beginner mode must not show a diff simulation",
);
assert(
  !beginner.includes("Hello and welcome to this video"),
  "beginner preview must not use hardcoded subtitle samples",
);

const renderBeginnerPreview = (splitByPunctuation: boolean) =>
  renderToStaticMarkup(
    React.createElement(BeginnerParsingTab, {
      splitByPunctuation,
      onSplitByPunctuationChange: () => {},
      punctuationChars: [".", "!"],
      onPunctuationCharsChange: () => {},
      stripSpeakerBrackets: false,
      onStripSpeakerBracketsChange: () => {},
      removeChars: [],
      onRemoveCharsChange: () => {},
      sampleCues: [{ text: "Initial line. Later line!", start: 0, duration: 2 }],
    }),
  );

const unsplitPreview = renderBeginnerPreview(false);
const splitPreview = renderBeginnerPreview(true);
assert(
  (unsplitPreview.match(/data-testid="parser-live-output-sentence"/g) || []).length === 1,
  "a single cue must render as one output line while punctuation splitting is disabled",
);
assert(
  (splitPreview.match(/data-testid="parser-live-output-sentence"/g) || []).length === 2,
  "the same cue must render as two output lines immediately when punctuation splitting is enabled",
);

console.log("Parser settings apply immediately, and live output stays beside the subtitles table.");
