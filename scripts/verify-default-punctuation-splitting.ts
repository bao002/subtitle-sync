import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
import {
  isAbbreviation,
  isSentenceEnding,
  criteriaSections,
  align,
  Json3,
  PARSER_PRESETS,
} from "../src/lib/subtitles";

console.log("====================================================");
console.log("🧪 Starting Default Punctuation Splitting Verification Test");
console.log("====================================================");

// 1. Verify abbreviation guard
console.log("1. Testing abbreviation detection...");
const testAbbrevs = [
  "dr.",
  "Dr.",
  "mr.",
  "Mr.",
  "mrs.",
  "Mrs.",
  "ms.",
  "Ms.",
  "prof.",
  "vs.",
  "e.g.",
  "i.e.",
  "u.s.",
  "U.S.",
  "u.k.",
  "etc.",
  "A.",
  "B.",
];
for (const abbr of testAbbrevs) {
  assert(isAbbreviation(abbr), `Expected '${abbr}' to be identified as an abbreviation`);
}

const nonAbbrevs = ["world.", "end.", "sentence.", "now.", "stop.", "cat."];
for (const word of nonAbbrevs) {
  assert(!isAbbreviation(word), `Expected '${word}' NOT to be identified as an abbreviation`);
}
console.log(
  "✅ PASS: Abbreviation guard correctly identifies abbreviations and excludes regular words",
);

// 2. Verify isSentenceEnding with punctuation and abbreviation guards
console.log("2. Testing sentence ending validation with edge cases...");
assert(isSentenceEnding("This is a complete sentence."), "Should identify period ending");
assert(isSentenceEnding("Is this a question?"), "Should identify question mark");
assert(isSentenceEnding("What an announcement!"), "Should identify exclamation mark");
assert(isSentenceEnding("מה שלומך?"), "Should identify Hebrew question mark");
assert(isSentenceEnding("كيف حالك؟"), "Should identify Arabic question mark");
assert(isSentenceEnding("こんにちは。"), "Should identify CJK full stop");
assert(isSentenceEnding("Wait for it…"), "Should identify ellipsis");
assert(isSentenceEnding('"Quoted sentence!"'), "Should identify quote after punctuation");

// Should NOT trigger sentence ending on abbreviations
assert(!isSentenceEnding("I visited Dr."), "Should NOT treat trailing 'Dr.' as sentence end");
assert(
  !isSentenceEnding("Products made in the U.S."),
  "Should NOT treat trailing 'U.S.' as sentence end",
);
assert(!isSentenceEnding("Such as e.g."), "Should NOT treat trailing 'e.g.' as sentence end");
assert(!isSentenceEnding("PI equals 3.14"), "Should NOT treat decimal number as sentence end");
console.log(
  "✅ PASS: isSentenceEnding correctly detects multilingual punctuation and respects abbreviation guards",
);

// 3. Test Intra-Cue segment punctuation splitting
console.log("3. Testing intra-cue segment punctuation splitting with word offsets...");
const trackWithIntraCueSentences: Record<string, Json3> = {
  en: {
    events: [
      {
        tStartMs: 1000,
        dDurationMs: 6000,
        segs: [
          { utf8: "Hello ", tOffsetMs: 0 },
          { utf8: "world. ", tOffsetMs: 800 },
          { utf8: "How ", tOffsetMs: 2500 },
          { utf8: "are ", tOffsetMs: 3100 },
          { utf8: "you today?", tOffsetMs: 3800 },
        ],
      },
      {
        tStartMs: 7500,
        dDurationMs: 4000,
        segs: [
          { utf8: "I am fine. ", tOffsetMs: 0 },
          { utf8: "Thank you!", tOffsetMs: 2000 },
        ],
      },
    ],
  },
};

// Sentence splitting can be disabled for intra-cue text while retaining cue-boundary cuts.
const cueBoundarySections = criteriaSections(trackWithIntraCueSentences, "en", ["sentence"], {
  sentence: { splitIntraCue: false },
});
assert(
  cueBoundarySections.length === 2,
  `Expected default sentence splitting at cue boundary (2 cues), got ${cueBoundarySections.length}`,
);
assert(
  cueBoundarySections[0]!.end === 7500,
  `Expected cue cut at 7500ms, got ${cueBoundarySections[0]!.end}`,
);

// Enhanced intra-cue segment punctuation cutting:
const intraCueSections = criteriaSections(trackWithIntraCueSentences, "en", ["sentence"], {
  sentence: { splitIntraCue: true, minWords: 1, includeCommas: false },
});
assert(
  intraCueSections.length >= 3,
  `Expected intra-cue splitting with splitIntraCue: true to generate >= 3 sections, got ${intraCueSections.length}`,
);
// Verify that a cut occurred at the intra-cue word boundary (1000 + 2500 = 3500ms)
const hasIntraCueCut = intraCueSections.some((s) => s.start === 3500 || s.end === 3500);
assert(
  hasIntraCueCut,
  `Expected cut at intra-cue timestamp 3500ms (1000ms base + 2500ms 'How'), got sections: ${JSON.stringify(intraCueSections)}`,
);
console.log(
  "✅ PASS: Intra-cue segment punctuation splitting correctly cuts at word token boundary (3500ms)",
);

// Unsegmented JSON3 events are split on punctuation using linear time interpolation.
const unsegmentedTrack: Record<string, Json3> = {
  en: {
    events: [
      {
        tStartMs: 1000,
        dDurationMs: 6000,
        segs: [{ utf8: "First sentence. Second sentence." }],
      },
    ],
  },
};
const unsegmentedSections = criteriaSections(unsegmentedTrack, "en", ["sentence"], {
  sentence: { splitIntraCue: true },
});
assert(
  unsegmentedSections.length === 2,
  `Expected an unsegmented two-sentence cue to split into two sections, got ${unsegmentedSections.length}`,
);
const interpolatedCut = unsegmentedSections[0]!.end;
assert(
  interpolatedCut > 1000 && interpolatedCut < 7000,
  `Expected an interpolated cut within the cue duration, got ${interpolatedCut}`,
);

const abbreviationTrack: Record<string, Json3> = {
  en: {
    events: [
      {
        tStartMs: 0,
        dDurationMs: 6000,
        segs: [{ utf8: "We met Dr. Smith. Then left." }],
      },
    ],
  },
};
const abbreviationSections = criteriaSections(abbreviationTrack, "en", ["sentence"], {
  sentence: { splitIntraCue: true },
});
assert(
  abbreviationSections.length === 2,
  `Expected abbreviation protection to keep 'Dr.' within the first sentence, got ${abbreviationSections.length} sections`,
);
const disabledIntraCueSections = criteriaSections(unsegmentedTrack, "en", ["sentence"], {
  sentence: { splitIntraCue: false },
});
assert(
  disabledIntraCueSections.length === 1,
  "The intra-cue checkbox must disable punctuation cuts within one event",
);

const shortSentenceTrack: Record<string, Json3> = {
  en: {
    events: [
      {
        tStartMs: 0,
        dDurationMs: 1200,
        segs: [{ utf8: "Go. Go. Go." }],
      },
    ],
  },
};
assert(
  criteriaSections(shortSentenceTrack, "en", ["sentence"], {
    sentence: { splitIntraCue: true },
  }).length === 3,
  "Pure punctuation mode must not suppress short sentence boundaries with a minimum-duration clamp",
);
const unpunctuatedLongTrack: Record<string, Json3> = {
  en: {
    events: [
      {
        tStartMs: 0,
        dDurationMs: 90000,
        segs: [{ utf8: "A long subtitle without any terminal punctuation" }],
      },
    ],
  },
};
assert(
  criteriaSections(unpunctuatedLongTrack, "en", ["sentence"], {
    sentence: { splitIntraCue: true },
  }).length === 1,
  "Pure punctuation mode must not introduce time-window cuts without punctuation",
);
console.log(
  "✅ PASS: Single-segment punctuation splits, abbreviation protection, and checkbox control",
);

// 4. An explicitly empty criterion list disables criteria; omitted options retain the default.
console.log("4. Testing empty and omitted criteria behavior...");
const defaultSections = criteriaSections(trackWithIntraCueSentences, "en", []);
assert(
  defaultSections.length === 1,
  "An explicitly empty criteria list must not apply implicit sentence cuts",
);

const defaultAlign = align(trackWithIntraCueSentences, "en");
assert(
  defaultAlign.length > 0,
  "align() without arguments should default to pure sentence splitting",
);
assert(
  defaultAlign.length === cueBoundarySections.length,
  `align() default should preserve default sentence-only cue behavior (${defaultAlign.length} vs ${cueBoundarySections.length})`,
);
console.log(
  "✅ PASS: Explicitly empty criteria disable splitting; omitted criteria default to sentence punctuation",
);

// 5. Test PARSER_PRESETS default order
assert(
  PARSER_PRESETS[0]!.id === "sentencesOnly",
  `Expected first preset to be 'sentencesOnly', got '${PARSER_PRESETS[0]!.id}'`,
);
assert.deepStrictEqual(
  PARSER_PRESETS[0]!.criteria,
  ["sentence"],
  "First preset should configure ['sentence']",
);
assert(
  PARSER_PRESETS[0]!.desc.includes("inside cues"),
  "Pure Sentences preset should identify intra-cue punctuation splitting",
);
console.log("✅ PASS: PARSER_PRESETS lists 'sentencesOnly' as default primary preset");

// 6. Verify index.tsx initializes selectedCriteria to ["sentence"]
console.log("6. Verifying src/routes/index.tsx default state...");
const indexPath = path.resolve(process.cwd(), "src/routes/index.tsx");
const indexContent = fs.readFileSync(indexPath, "utf8");

assert(
  indexContent.includes("return DEFAULT_PARSER_CRITERIA;") ||
    indexContent.includes('return ["sentence"];'),
  "src/routes/index.tsx must default selectedCriteria state to DEFAULT_PARSER_CRITERIA or ['sentence']",
);
assert(
  indexContent.includes('presetId === "sentencesOnly"') &&
    indexContent.includes("splitIntraCue: true"),
  "Pure Sentences preset must enable intra-cue punctuation parsing",
);
assert(
  indexContent.includes("toggle-parser-criterion-"),
  "Each parser criterion checkbox must have a stable test identifier",
);
console.log("✅ PASS: src/routes/index.tsx initializes selectedCriteria properly");

console.log("====================================================");
console.log("🎉 All Default Punctuation Splitting Tests PASSED Successfully!");
console.log("====================================================");
