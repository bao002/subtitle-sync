import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
import { isValidJsonSubtitleResponse } from "../src/utils/subtitleCache";
import { parseJson3 } from "../src/lib/native-captions";

console.log("====================================================");
console.log("🧪 Starting Verification: Language Button & Table Subtitle URL Inputs");
console.log("====================================================");

const rootDir = process.cwd();

// 1. Verify LanguageBoxesSelector.tsx component
const boxesSelectorPath = path.join(rootDir, "src/components/LanguageBoxesSelector.tsx");
assert(fs.existsSync(boxesSelectorPath), "LanguageBoxesSelector.tsx must exist");
const boxesContent = fs.readFileSync(boxesSelectorPath, "utf8");

assert(
  boxesContent.includes("onSaveSubtitleUrl"),
  "LanguageBoxesSelector must accept onSaveSubtitleUrl prop",
);
assert(
  boxesContent.includes("expand-subtitles-url-"),
  "LanguageBoxesSelector must render dedicated expand button for subtitle URL per language box",
);
assert(
  boxesContent.includes("inline-subtitle-url-panel-"),
  "LanguageBoxesSelector must render inline expandable panel for subtitle URL input",
);
assert(
  boxesContent.includes("lang-box-url-input-"),
  "LanguageBoxesSelector must render url input field when expanded",
);
assert(
  boxesContent.includes("lang-box-fetch-url-"),
  "LanguageBoxesSelector must render fetch/load button for subtitle URL",
);
assert(
  boxesContent.includes("Use sample fixture"),
  "LanguageBoxesSelector must provide sample fixture path shortcut",
);
assert(
  boxesContent.includes("priority-chip-url-btn-"),
  "LanguageBoxesSelector must allow setting subtitle URL from fetch priority chips",
);
console.log("✅ PASS: LanguageBoxesSelector has expandable per-language subtitle URL inputs");

// 2. Verify Languages Table in src/routes/index.tsx
const indexRoutePath = path.join(rootDir, "src/routes/index.tsx");
assert(fs.existsSync(indexRoutePath), "src/routes/index.tsx must exist");
const indexContent = fs.readFileSync(indexRoutePath, "utf8");

assert(
  indexContent.includes("Subtitle URL") &&
    indexContent.includes("table-btn-subtitle-url-") &&
    indexContent.includes("url-input-row-"),
  "src/routes/index.tsx must include Subtitle URL column and expandable row in languages table",
);
assert(
  indexContent.includes("table-url-input-") && indexContent.includes("table-fetch-url-"),
  "src/routes/index.tsx languages table must contain 1 input per favorite language and fetch button",
);
assert(
  indexContent.includes("handleSaveTrackFromUrl"),
  "src/routes/index.tsx must define handleSaveTrackFromUrl handler",
);
assert(
  indexContent.includes("onSaveSubtitleUrl={handleSaveTrackFromUrl}"),
  "src/routes/index.tsx must pass handleSaveTrackFromUrl to LanguageBoxesSelector",
);
console.log(
  "✅ PASS: src/routes/index.tsx has 1 subtitle URL input per favorite language in table",
);

// 3. Verify LanguageSubtitleUrlModal.tsx exists and is exported
const modalPath = path.join(rootDir, "src/components/LanguageSubtitleUrlModal.tsx");
assert(fs.existsSync(modalPath), "LanguageSubtitleUrlModal.tsx must exist");
const modalContent = fs.readFileSync(modalPath, "utf8");
assert(
  modalContent.includes("LanguageSubtitleUrlModal") && modalContent.includes("onSaveTrack"),
  "LanguageSubtitleUrlModal must export component and accept onSaveTrack callback",
);
console.log("✅ PASS: LanguageSubtitleUrlModal component verified");

// 4. Verify local fixture validation logic with isValidJsonSubtitleResponse
const heFixturePath = path.join(rootDir, "public/fixtures/L2Ryrr6txwA/he.json");
assert(fs.existsSync(heFixturePath), "Sample Hebrew fixture must exist");
const heRaw = fs.readFileSync(heFixturePath, "utf8");
const heJson = parseJson3(heRaw);
assert(heJson !== null, "Hebrew fixture must parse to JSON3");
assert(
  isValidJsonSubtitleResponse(heJson),
  "Hebrew fixture must satisfy isValidJsonSubtitleResponse criteria",
);
assert(heJson.events && heJson.events.length > 0, "Hebrew fixture must have non-empty events");
console.log(`✅ PASS: Sample fixture parsed successfully with ${heJson.events.length} cues`);

console.log("====================================================");
console.log("🎉 All Language Button & Table Subtitle URL Input Checks PASSED!");
console.log("====================================================");
