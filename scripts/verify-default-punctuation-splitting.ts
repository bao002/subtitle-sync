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
  assert(
    isAbbreviation(abbr),
    `Expected '${abbr}' to be identified as an abbreviation`,
  );
}

const nonAbbrevs = ["world.", "end.", "sentence.", "now.", "stop.", "cat."];
for (const word of nonAbbrevs) {
  assert(
    !isAbbreviation(word),
    `Expected '${word}' NOT to be identified as an abbreviation`,
  );
}
console.log("✅ PASS: Abbreviation guard correctly identifies abbreviations and excludes regular words");

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
assert(!isSentenceEnding("Products made in the U.S."), "Should NOT treat trailing 'U.S.' as sentence end");
assert(!isSentenceEnding("Such as e.g."), "Should NOT treat trailing 'e.g.' as sentence end");
assert(!isSentenceEnding("PI equals 3.14"), "Should NOT treat decimal number as sentence end");
console.log("✅ PASS: isSentenceEnding correctly detects multilingual punctuation and respects abbreviation guards");

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

// Default sentence splitting without intra-cue cutting:
const cueBoundarySections = criteriaSections(trackWithIntraCueSentences, "en", ["sentence"]);
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
console.log("✅ PASS: Intra-cue segment punctuation splitting correctly cuts at word token boundary (3500ms)");

// 4. Test default criteria when no criteria specified (pure sentence)
console.log("4. Testing default criteria in align and criteriaSections...");
const defaultSections = criteriaSections(trackWithIntraCueSentences, "en", []);
assert(
  defaultSections.length === cueBoundarySections.length,
  "Default criteriaSections should match ['sentence'] criteria",
);

const defaultAlign = align(trackWithIntraCueSentences, "en");
assert(defaultAlign.length > 0, "align() without arguments should default to pure sentence splitting");
assert(
  defaultAlign.length === cueBoundarySections.length,
  `align() default should produce same row count as ['sentence'] (${defaultAlign.length} vs ${cueBoundarySections.length})`,
);
console.log("✅ PASS: Default criteria is pure sentence punctuation");

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
console.log("✅ PASS: PARSER_PRESETS lists 'sentencesOnly' as default primary preset");

// 6. Verify index.tsx initializes selectedCriteria to ["sentence"]
console.log("6. Verifying src/routes/index.tsx default state...");
const indexPath = path.resolve(process.cwd(), "src/routes/index.tsx");
const indexContent = fs.readFileSync(indexPath, "utf8");

assert(
  indexContent.includes('return ["sentence"];'),
  "src/routes/index.tsx must default selectedCriteria state to ['sentence']",
);
console.log("✅ PASS: src/routes/index.tsx initializes selectedCriteria to ['sentence']");

console.log("====================================================");
console.log("🎉 All Default Punctuation Splitting Tests PASSED Successfully!");
console.log("====================================================");
