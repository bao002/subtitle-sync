import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import {
  splitCuesIntoSentences,
  simpleAlign,
  DEFAULT_SIMPLE_PARSER_CONFIG,
  SimpleParserConfig,
} from "../src/utils/newSubtitlesParser";
import { Cue, Json3 } from "../src/lib/subtitles";

console.log("====================================================");
console.log("🧪 Starting Quarantine & New Subtitles Parser Verification (Task 223)");
console.log("====================================================");

const rootDir = process.cwd();

// 1. Verify old subtitles parser is quarantined
console.log("1. Verifying quarantined old subtitles parser...");
const quarantinedPath = path.join(rootDir, "quarentined/oldSubtitlesParser.ts");
assert(fs.existsSync(quarantinedPath), "quarentined/oldSubtitlesParser.ts must exist");
const quarantinedContent = fs.readFileSync(quarantinedPath, "utf-8");
assert(
  quarantinedContent.includes("export function align") ||
    quarantinedContent.includes("cluster(") ||
    quarantinedContent.includes("fromCuts("),
  "quarentined/oldSubtitlesParser.ts must contain the quarantined parser implementation",
);
console.log("  ✓ Quarantined old parser verified at quarentined/oldSubtitlesParser.ts");

// 2. Verify splitting based on the location of a dot '.' character
console.log("2. Verifying reliable splitting based on the dot '.' character...");

// Case A: Intra-cue multiple sentences with dot
const testCuesSingle: Cue[] = [
  {
    start: 1000,
    end: 7000,
    text: "Hello world. How are you? Everything is fine.",
  },
];

const splitWithDot = splitCuesIntoSentences(testCuesSingle, {
  ...DEFAULT_SIMPLE_PARSER_CONFIG,
  splitOnDot: true,
  splitOnQuestion: true,
});

assert.strictEqual(splitWithDot.length, 3, `Expected 3 sentences, got ${splitWithDot.length}`);
assert.strictEqual(splitWithDot[0]?.text, "Hello world.");
assert.strictEqual(splitWithDot[1]?.text, "How are you?");
assert.strictEqual(splitWithDot[2]?.text, "Everything is fine.");

// Verify interpolated timestamps
assert.ok(
  splitWithDot[0]!.start === 1000 && splitWithDot[0]!.end > 1000,
  "First sentence should start at 1000ms and end at interpolated time",
);
assert.ok(
  splitWithDot[1]!.start === splitWithDot[0]!.end,
  "Second sentence start must match first sentence end",
);
assert.ok(
  splitWithDot[2]!.end === 7000,
  "Final sentence must end at cue end 7000ms",
);
console.log("  ✓ Dot '.' splitting within single cue verified with correct interpolated timings");

// Case B: Toggling dot splitting OFF
const splitWithoutDot = splitCuesIntoSentences(testCuesSingle, {
  ...DEFAULT_SIMPLE_PARSER_CONFIG,
  splitOnDot: false,
  splitOnQuestion: true,
});
// Without dot, "Hello world." won't split, only "?" will split
assert.strictEqual(
  splitWithoutDot.length,
  2,
  `Expected 2 sentences when splitOnDot is false, got ${splitWithoutDot.length}`,
);
assert.strictEqual(splitWithoutDot[0]?.text, "Hello world. How are you?");
assert.strictEqual(splitWithoutDot[1]?.text, "Everything is fine.");
console.log("  ✓ Toggling splitOnDot OFF correctly suppresses dot splitting");

// Case C: Multi-cue sentence accumulation until dot '.'
const multiCues: Cue[] = [
  { start: 0, end: 2000, text: "I went to the store" },
  { start: 2000, end: 4000, text: "and bought bread. It was warm." },
];
const multiSplit = splitCuesIntoSentences(multiCues, DEFAULT_SIMPLE_PARSER_CONFIG);
assert.strictEqual(multiSplit.length, 2, `Expected 2 sentences, got ${multiSplit.length}`);
assert.strictEqual(multiSplit[0]?.text, "I went to the store and bought bread.");
assert.strictEqual(multiSplit[1]?.text, "It was warm.");
assert.strictEqual(multiSplit[0]?.start, 0);
assert.strictEqual(multiSplit[1]?.end, 4000);
console.log("  ✓ Cross-cue sentence accumulation ending at dot '.' verified");

// Case D: Custom delimiters (e.g. semicolon ';')
const customCues: Cue[] = [
  { start: 0, end: 3000, text: "First part; second part" },
];
const customSplit = splitCuesIntoSentences(customCues, {
  ...DEFAULT_SIMPLE_PARSER_CONFIG,
  customDelimiters: ";",
});
assert.strictEqual(customSplit.length, 2, `Expected 2 parts with semicolon, got ${customSplit.length}`);
assert.strictEqual(customSplit[0]?.text, "First part;");
assert.strictEqual(customSplit[1]?.text, "second part");
console.log("  ✓ Custom delimiters verified");

// Case E: Abbreviation exceptions should not split on dots inside names like "Dr." or "Mrs."
const abbreviationCues: Cue[] = [
  { start: 0, end: 3000, text: "Dr. Smith arrived today. We met him at noon." },
  { start: 3000, end: 6000, text: "Mrs. Johnson stayed late." },
];
const abbreviationSplit = splitCuesIntoSentences(abbreviationCues, {
  ...DEFAULT_SIMPLE_PARSER_CONFIG,
  dotAbbreviationExceptions: "dr., mrs.",
});
assert.strictEqual(
  abbreviationSplit.length,
  3,
  `Expected 3 sentences with abbreviation exceptions, got ${abbreviationSplit.length}`,
);
assert.strictEqual(abbreviationSplit[0]?.text, "Dr. Smith arrived today.");
assert.strictEqual(abbreviationSplit[1]?.text, "We met him at noon.");
assert.strictEqual(abbreviationSplit[2]?.text, "Mrs. Johnson stayed late.");
console.log("  ✓ Abbreviation exceptions keep names like Dr. and Mrs. intact while still splitting real sentence ends");

// 3. Verify simpleAlign generates aligned parallel Rows
console.log("3. Verifying simpleAlign with multi-track alignment...");
const testTracks: Record<string, Json3> = {
  en: {
    events: [
      {
        tStartMs: 0,
        dDurationMs: 4000,
        segs: [{ utf8: "Hello everyone. Welcome back." }],
      },
    ],
  },
  es: {
    events: [
      {
        tStartMs: 0,
        dDurationMs: 4000,
        segs: [{ utf8: "Hola a todos. Bienvenidos de nuevo." }],
      },
    ],
  },
};

const rows = simpleAlign(testTracks, "en", DEFAULT_SIMPLE_PARSER_CONFIG);
assert.strictEqual(rows.length, 2, `Expected 2 aligned rows, got ${rows.length}`);
assert.strictEqual(rows[0]?.texts["en"], "Hello everyone.");
assert.strictEqual(rows[1]?.texts["en"], "Welcome back.");
assert.ok(rows[0]?.texts["es"] && rows[0]!.texts["es"]!.length > 0, "Target language should align");
console.log("  ✓ simpleAlign creates aligned rows across parallel language tracks");

// 4. Verify UI component NewSubtitlesParserBar exists and placed just above table
console.log("4. Verifying NewSubtitlesParserBar component and placement in SubtitlesTablePanel...");
const parserBarPath = path.join(rootDir, "src/components/NewSubtitlesParserBar.tsx");
assert(fs.existsSync(parserBarPath), "src/components/NewSubtitlesParserBar.tsx must exist");
const parserBarContent = fs.readFileSync(parserBarPath, "utf-8");
assert(parserBarContent.includes("data-testid=\"new-subtitles-parser-bar\""), "Must have data-testid new-subtitles-parser-bar");
assert(parserBarContent.includes("data-testid=\"parser-split-dot-toggle\""), "Must have dot toggle");
assert(parserBarContent.includes("data-testid=\"parser-sentence-count-badge\""), "Must have sentence count badge");
assert(parserBarContent.includes("data-testid=\"parser-reset-defaults-btn\""), "Must have reset button");

const tablePanelPath = path.join(rootDir, "src/components/SubtitlesTablePanel.tsx");
const tablePanelContent = fs.readFileSync(tablePanelPath, "utf-8");
assert(tablePanelContent.includes("<NewSubtitlesParserBar"), "SubtitlesTablePanel must render NewSubtitlesParserBar");
const parserBarIndex = tablePanelContent.indexOf("<NewSubtitlesParserBar");
const tableIndex = tablePanelContent.indexOf("<table");
assert(parserBarIndex < tableIndex, "NewSubtitlesParserBar MUST appear just above the subtitles table");
console.log("  ✓ NewSubtitlesParserBar is placed just above the subtitles-table in SubtitlesTablePanel");

// 5. Verify dynamic update binding in index.tsx
console.log("5. Verifying dynamic update binding in index.tsx...");
const indexContent = fs.readFileSync(path.join(rootDir, "src/routes/index.tsx"), "utf-8");
assert(indexContent.includes("simpleParserConfig"), "index.tsx must manage simpleParserConfig state");
assert(indexContent.includes("simpleAlign(tracks, baseLanguage, simpleParserConfig)"), "rawRows must use simpleAlign with simpleParserConfig");
assert(indexContent.includes("parserConfig={simpleParserConfig}"), "SubtitlesTablePanel must receive parserConfig");
assert(indexContent.includes("onParserConfigChange={setSimpleParserConfig}"), "SubtitlesTablePanel must receive onParserConfigChange");
console.log("  ✓ Dynamic updating of presented subtitles upon configuration changes verified");

// 6. Verify documentation in later.md
console.log("6. Verifying later.md documentation...");
const laterPath = path.join(rootDir, "docs/later.md");
const laterContent = fs.readFileSync(laterPath, "utf-8");
assert(
  laterContent
    .toLowerCase()
    .includes("the user should be able to tell the parser not to split when the dot is next to other words such as") &&
    laterContent.includes("dr.") &&
    laterContent.includes("mrs.") &&
    laterContent.includes("per languages customizations"),
  "docs/later.md must contain the user requirement regarding abbreviation exception rules",
);

console.log("  ✓ docs/later.md successfully updated with abbreviation customizations requirement");

console.log("====================================================");
console.log("🎉 All Quarantine & New Subtitles Parser Verification Checks PASSED!");
console.log("====================================================");
