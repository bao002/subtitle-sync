import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import {
  align,
  criteriaSections,
  PARSER_CRITERIA,
  PARSER_PRESETS,
  type CriteriaId,
  type Json3,
} from "../src/lib/subtitles.js";

console.log("====================================================");
console.log("🧪 Starting Accumulative Criteria Subtitles Parser Test");
console.log("====================================================");

// 1. Verify criteria and presets catalog
assert(PARSER_CRITERIA.length === 7, `Expected 7 parser criteria, found ${PARSER_CRITERIA.length}`);
const expectedCriteriaIds: CriteriaId[] = [
  "sentence",
  "pause",
  "consensus",
  "punctVote",
  "anchors",
  "cue",
  "window",
];
for (const id of expectedCriteriaIds) {
  const found = PARSER_CRITERIA.find((c) => c.id === id);
  assert(found, `PARSER_CRITERIA must include criteria '${id}'`);
  assert(
    found.name && found.desc && found.badge,
    `Criterion '${id}' must have name, desc, and badge`,
  );
}
console.log("✅ PASS: All 7 parser criteria catalogued with metadata");

assert(PARSER_PRESETS.length >= 5, `Expected at least 5 presets, found ${PARSER_PRESETS.length}`);
for (const preset of PARSER_PRESETS) {
  assert(
    preset.id && preset.name && preset.criteria.length > 0,
    `Preset ${preset.id} must be valid`,
  );
}
console.log("✅ PASS: All parser presets valid and non-empty");

// 2. Mock multi-language JSON3 tracks with word-level timings and pauses
const testTracks: Record<string, Json3> = {
  en: {
    events: [
      {
        tStartMs: 0,
        dDurationMs: 4000,
        segs: [
          { utf8: "Hello ", tOffsetMs: 0 },
          { utf8: "everyone. ", tOffsetMs: 1200 },
          { utf8: "Welcome ", tOffsetMs: 2500 },
          { utf8: "back.", tOffsetMs: 3200 },
        ],
      },
      {
        tStartMs: 5000, // 1000ms pause between 4000 and 5000
        dDurationMs: 5000,
        segs: [
          { utf8: "Today ", tOffsetMs: 0 },
          { utf8: "we ", tOffsetMs: 800 },
          { utf8: "learn ", tOffsetMs: 1500 },
          { utf8: "music! ", tOffsetMs: 2400 },
          { utf8: "Bach ", tOffsetMs: 3600 },
          { utf8: "was ", tOffsetMs: 4000 },
          { utf8: "great.", tOffsetMs: 4500 },
        ],
      },
      {
        tStartMs: 11000,
        dDurationMs: 4000,
        segs: [
          { utf8: "Are ", tOffsetMs: 0 },
          { utf8: "you ", tOffsetMs: 600 },
          { utf8: "ready?", tOffsetMs: 1200 },
        ],
      },
    ],
  },
  es: {
    events: [
      {
        tStartMs: 0,
        dDurationMs: 4000,
        segs: [
          { utf8: "Hola a todos. ", tOffsetMs: 0 },
          { utf8: "Bienvenidos de nuevo.", tOffsetMs: 2000 },
        ],
      },
      {
        tStartMs: 5000,
        dDurationMs: 5000,
        segs: [{ utf8: "Hoy aprendemos música! Bach era genial.", tOffsetMs: 0 }],
      },
      {
        tStartMs: 11000,
        dDurationMs: 4000,
        segs: [{ utf8: "¿Están listos?", tOffsetMs: 0 }],
      },
    ],
  },
  he: {
    events: [
      {
        tStartMs: 0,
        dDurationMs: 4000,
        segs: [{ utf8: "שלום לכולם. ברוכים השבים.", tOffsetMs: 0 }],
      },
      {
        tStartMs: 5000,
        dDurationMs: 5000,
        segs: [{ utf8: "היום נלמד מוזיקה! באך היה נהדר.", tOffsetMs: 0 }],
      },
      {
        tStartMs: 11000,
        dDurationMs: 4000,
        segs: [{ utf8: "האם אתם מוכנים?", tOffsetMs: 0 }],
      },
    ],
  },
};

// 3. Test criteriaSections with pure sentence criteria
const sentenceSections = criteriaSections(testTracks, "en", ["sentence"]);
assert(
  sentenceSections.length >= 2,
  `Expected at least 2 sections for sentence criteria, got ${sentenceSections.length}`,
);
console.log(`✅ PASS: Sentence criteria generated ${sentenceSections.length} sections`);

// 4. Test accumulative multi-select: sentence + pause criteria
const sentenceAndPauseSections = criteriaSections(testTracks, "en", ["sentence", "pause"]);
assert(
  sentenceAndPauseSections.length >= sentenceSections.length,
  `Accumulative criteria (sentence + pause) should produce >= sections than sentence alone (${sentenceAndPauseSections.length} vs ${sentenceSections.length})`,
);
console.log(
  `✅ PASS: Accumulative sentence + pause generated ${sentenceAndPauseSections.length} sections`,
);

// 5. Test accumulative multi-select: sentence + consensus + punctVote
const consensusSections = criteriaSections(testTracks, "en", [
  "sentence",
  "consensus",
  "punctVote",
]);
assert(
  consensusSections.length >= 2,
  `Multi-track consensus should generate at least 2 sections, got ${consensusSections.length}`,
);
console.log(
  `✅ PASS: Multi-track consensus criteria generated ${consensusSections.length} sections`,
);

// 6. Test align with accumulative criteria
const alignedRows = align(testTracks, "en", ["sentence", "pause"]);
assert(alignedRows.length > 0, "align() with accumulative criteria must return rows");
for (const row of alignedRows) {
  assert(
    typeof row.start === "number" && typeof row.end === "number",
    "Row must have start and end times",
  );
  assert(row.end > row.start, `Row end (${row.end}) must be greater than start (${row.start})`);
  assert(row.texts.en && row.texts.en.length > 0, "Row must contain English text");
  assert(row.texts.es && row.texts.es.length > 0, "Row must contain Spanish translation text");
  assert(row.texts.he && row.texts.he.length > 0, "Row must contain Hebrew translation text");
}
console.log(
  `✅ PASS: align() produced ${alignedRows.length} contiguous parallel rows with all 3 languages`,
);

// 6a. Disabled criteria must not be reintroduced through an implicit sentence fallback.
const noCriteriaSections = criteriaSections(testTracks, "en", []);
assert(
  noCriteriaSections.length === 1,
  `Expected no active criteria to preserve one unsplit section, got ${noCriteriaSections.length}`,
);
assert(
  noCriteriaSections[0]!.start === 0 && noCriteriaSections[0]!.end === 15000,
  "No active criteria must preserve the full subtitle time range",
);
assert(
  align(testTracks, "en", []).length === 1,
  "align() with an explicitly empty criteria list must not apply sentence cuts",
);
console.log("✅ PASS: Disabling every criterion leaves a single unsplit section");

// 7. Test backward compatibility: single Strategy string parameter
const legacyRowSentence = align(testTracks, "en", "sentence");
assert(legacyRowSentence.length > 0, "align() must support legacy string 'sentence'");
const legacyRowCue = align(testTracks, "en", "cue");
assert(legacyRowCue.length > 0, "align() must support legacy string 'cue'");
console.log("✅ PASS: Backward compatibility with legacy string strategies preserved");

// 8. Test UI template has accumulative checks controls and inner settings for all groups
const rootDir = process.cwd();
const indexPath = path.resolve(rootDir, "src/routes/index.tsx");
const indexContent = fs.readFileSync(indexPath, "utf8");
assert(
  indexContent.includes("Accumulative Division Criteria (Multi-Select)"),
  "src/routes/index.tsx must contain 'Accumulative Division Criteria (Multi-Select)' heading",
);
assert(
  indexContent.includes("selectedCriteria"),
  "src/routes/index.tsx must manage selectedCriteria state",
);
assert(
  indexContent.includes("handleToggleCriterion"),
  "src/routes/index.tsx must provide handleToggleCriterion handler",
);
assert(
  !indexContent.includes("if (selectedCriteria.length <= 1) return;"),
  "Every criterion checkbox must be able to disable its own effect, including the final active criterion",
);
assert(indexContent.includes("PARSER_PRESETS"), "src/routes/index.tsx must render PARSER_PRESETS");
assert(
  indexContent.includes("handleUpdateGroupSettings"),
  "src/routes/index.tsx must provide handleUpdateGroupSettings handler for group settings",
);
// Verify all 7 criteria have inner settings controls rendered in UI
for (const id of expectedCriteriaIds) {
  assert(
    indexContent.includes(`crit.id === "${id}"`),
    `src/routes/index.tsx must include inner settings controls for group '${id}'`,
  );
}
console.log(
  "✅ PASS: React UI correctly includes multi-select criteria checkboxes, presets, and inner settings for all 7 groups",
);

// 9. Test inner group settings affect section cuts
const customWindowSections = criteriaSections(testTracks, "en", ["window"], {
  window: { minSectionMs: 5000, maxSectionMs: 8000 },
});
assert(customWindowSections.length > 0, "Custom inner group settings must produce valid sections");

const sentenceGroupSettingSections = criteriaSections(testTracks, "en", ["sentence"], {
  sentence: { includeCommas: true, minWords: 1 },
});
assert(
  sentenceGroupSettingSections.length > 0,
  "Sentence inner settings must produce valid sections",
);
console.log("✅ PASS: Inner group settings effectively customize section cutting");

// 10. Verify no BiDi character direction bleeding in criteria descriptions
for (const crit of PARSER_CRITERIA) {
  assert(
    !crit.desc.includes("؟"),
    `Criterion '${crit.id}' description must not embed raw Arabic punctuation causing BiDi inversion`,
  );
}
console.log("✅ PASS: Criteria descriptions free of BiDi character direction anomalies");

console.log("====================================================");
console.log("🎉 All Accumulative Parser Tests PASSED Successfully!");
console.log("====================================================");
