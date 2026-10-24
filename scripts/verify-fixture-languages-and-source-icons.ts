import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { LANGS } from "../src/lib/subtitles";
import {
  JSON3_RAW_MAP,
  L2RYRR6TXWA_LANGUAGE_JSON3_TRACKS,
  getRawJson3ForLanguage,
} from "../test/fixtures/L2Ryrr6txwA/jsonStrings";
import { SUPPORTED_TARGET_LANGUAGES } from "../src/config/constants";
import { SUPPORTED_LANGUAGES_CATALOG } from "../src/utils/appSettings";

console.log("====================================================");
console.log("🧪 Starting Fixture Languages & Column Source Icons Verification (Task 222)");
console.log("====================================================");

const rootDir = process.cwd();
const fixturesDir = path.join(rootDir, "public/fixtures/L2Ryrr6txwA");

// 1. Verify all expected languages exist in public/fixtures/L2Ryrr6txwA/*.json
const expectedLangs = ["ar", "en", "es", "he", "it", "pt-BR", "ru"];
console.log(`1. Verifying presence of all ${expectedLangs.length} fixture languages in ${fixturesDir}...`);

for (const lang of expectedLangs) {
  const filePath = path.join(fixturesDir, `${lang}.json`);
  assert(fs.existsSync(filePath), `Fixture file must exist: ${filePath}`);
  const raw = fs.readFileSync(filePath, "utf-8");
  const parsed = JSON.parse(raw);
  assert(
    Array.isArray(parsed.events) && parsed.events.length > 0,
    `Fixture ${lang}.json must contain non-empty events array`,
  );
  console.log(`  ✓ ${lang}.json verified with ${parsed.events.length} events`);
}

// 2. Verify pt-BR is included in LANGS
console.log("2. Verifying pt-BR presentation in LANGS...");
const ptBrInLangs = LANGS.find((l) => l.code === "pt-BR");
assert(ptBrInLangs, "LANGS must include pt-BR");
assert.strictEqual(ptBrInLangs.name, "Portuguese (Brazil)");
console.log("  ✓ pt-BR verified in LANGS");

// 3. Verify pt-BR in JSON3_RAW_MAP and L2RYRR6TXWA_LANGUAGE_JSON3_TRACKS
console.log("3. Verifying pt-BR in JSON3_RAW_MAP and L2RYRR6TXWA_LANGUAGE_JSON3_TRACKS...");
assert(JSON3_RAW_MAP["pt-BR"] && JSON3_RAW_MAP["pt-BR"].length > 0, "JSON3_RAW_MAP must contain pt-BR");
assert(
  L2RYRR6TXWA_LANGUAGE_JSON3_TRACKS["pt-BR"] && L2RYRR6TXWA_LANGUAGE_JSON3_TRACKS["pt-BR"].length > 0,
  "L2RYRR6TXWA_LANGUAGE_JSON3_TRACKS must contain parsed cues for pt-BR",
);
const retrievedRaw = getRawJson3ForLanguage("pt-BR");
assert(retrievedRaw && retrievedRaw.length > 0, "getRawJson3ForLanguage('pt-BR') must return raw json");
console.log("  ✓ pt-BR verified in bundled test fixtures");

// 4. Verify catalogs include pt-BR
console.log("4. Verifying pt-BR in language catalogs...");
assert(
  SUPPORTED_TARGET_LANGUAGES.some((l) => l.code === "pt-BR"),
  "SUPPORTED_TARGET_LANGUAGES must include pt-BR",
);
assert(
  SUPPORTED_LANGUAGES_CATALOG.some((l) => l.code === "pt-BR"),
  "SUPPORTED_LANGUAGES_CATALOG must include pt-BR",
);
console.log("  ✓ pt-BR verified in constants and appSettings catalogs");

// 5. Verify column indicator icons in SubtitlesTablePanel.tsx and SubtitleRow.tsx
console.log("5. Verifying distinct column indicators in SubtitlesTablePanel.tsx & SubtitleRow.tsx...");
const subtitleRowSrc = fs.readFileSync(path.join(rootDir, "src/components/SubtitleRow.tsx"), "utf-8");
assert(
  subtitleRowSrc.includes("isYouTubeOrJson?: boolean"),
  "SubtitleColumn must define isYouTubeOrJson",
);
assert(
  subtitleRowSrc.includes("isOnDemandTranslation?: boolean"),
  "SubtitleColumn must define isOnDemandTranslation",
);

const panelSrc = fs.readFileSync(path.join(rootDir, "src/components/SubtitlesTablePanel.tsx"), "utf-8");
assert(
  panelSrc.includes("column-source-youtube-or-json-"),
  "SubtitlesTablePanel must render data-testid column-source-youtube-or-json-",
);
assert(
  panelSrc.includes("column-source-on-demand-"),
  "SubtitlesTablePanel must render data-testid column-source-on-demand-",
);
assert(
  panelSrc.includes("FileCode"),
  "SubtitlesTablePanel must render FileCode icon for YouTube subtitles / JSON artifact",
);
assert(
  panelSrc.includes("Sparkles"),
  "SubtitlesTablePanel must render Sparkles icon for on-demand translation",
);
console.log("  ✓ SubtitlesTablePanel renders distinct icons for YouTube/JSON artifact vs on-demand translation");

// 6. Verify index.tsx logic for column source differentiation
console.log("6. Verifying index.tsx column source logic...");
const indexSrc = fs.readFileSync(path.join(rootDir, "src/routes/index.tsx"), "utf-8");
assert(
  indexSrc.includes("determineColumnSource"),
  "index.tsx must contain determineColumnSource",
);
assert(
  indexSrc.includes("isYouTubeOrJson: Boolean(hasRealTrack)"),
  "index.tsx must set isYouTubeOrJson based on authentic track cues",
);
assert(
  indexSrc.includes("isOnDemandTranslation: Boolean(!hasRealTrack && hasOnDemand)"),
  "index.tsx must set isOnDemandTranslation when only on-demand cues exist",
);
console.log("  ✓ index.tsx correctly determines distinct source types per column");

console.log("====================================================");
console.log("🎉 All Fixture Languages & Column Source Icons Verification PASSED!");
console.log("====================================================");
