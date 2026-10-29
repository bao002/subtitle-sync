import fs from "fs";
import path from "path";
import {
  isLanguageEligibleForTtsWithRole,
  shouldHighlightSentenceForTtsWithRole,
} from "../src/lib/playback-preferences";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${message}`);
}

console.log("====================================================");
console.log("🧪 Verifying Primary/Secondary Relative TTS Ratio (Task 261)");
console.log("====================================================");

// 1. Math Verification: Italian Primary (1:1), Spanish Secondary (1:4)
console.log("Test 1: Italian Primary (1:1), Spanish Secondary (1:4 relative to Italian)");
const recordsCount = 10;
for (let row = 0; row < recordsCount; row++) {
  const italianEligible = isLanguageEligibleForTtsWithRole({
    rowIdx: row,
    langCode: "it",
    ratio: 1,
    primaryLang: "it",
    primaryRatio: 1,
  });
  const spanishEligible = isLanguageEligibleForTtsWithRole({
    rowIdx: row,
    langCode: "es",
    ratio: 4,
    primaryLang: "it",
    primaryRatio: 1,
  });

  assert(italianEligible, `Row ${row}: Italian (primary 1:1) is active`);
  if (row === 0 || row === 4 || row === 8) {
    assert(spanishEligible, `Row ${row}: Spanish (secondary 1:4) is active on activation ${row}`);
  } else {
    assert(
      !spanishEligible,
      `Row ${row}: Spanish (secondary 1:4) is inactive on activation ${row}`,
    );
  }
}

// 2. Math Verification: Italian Primary (1:2), Spanish Secondary (1:4 relative to Italian)
console.log("Test 2: Italian Primary (1:2), Spanish Secondary (1:4 relative to Italian)");
for (let row = 0; row < 12; row++) {
  const italianEligible = isLanguageEligibleForTtsWithRole({
    rowIdx: row,
    langCode: "it",
    ratio: 2,
    primaryLang: "it",
    primaryRatio: 2,
  });
  const spanishEligible = isLanguageEligibleForTtsWithRole({
    rowIdx: row,
    langCode: "es",
    ratio: 4,
    primaryLang: "it",
    primaryRatio: 2,
  });

  const isItalianRow = row % 2 === 0;
  assert(italianEligible === isItalianRow, `Row ${row}: Italian eligibility matches 1:2 pattern`);

  if (row === 0 || row === 8) {
    // 0 is Italian activation #0 (0 % 4 === 0)
    // 8 is Italian activation #4 (4 % 4 === 0)
    assert(
      spanishEligible,
      `Row ${row}: Spanish (secondary 1:4) is active on Italian activation #${row / 2}`,
    );
  } else {
    assert(!spanishEligible, `Row ${row}: Spanish is inactive on non-4th Italian activation`);
  }
}

// 3. Math Verification: Switching Roles (Spanish Primary 1:1, Italian Secondary 1:2 relative to Spanish)
console.log(
  "Test 3: Switched Roles (Spanish Primary 1:1, Italian Secondary 1:2 relative to Spanish)",
);
for (let row = 0; row < 6; row++) {
  const spanishEligible = isLanguageEligibleForTtsWithRole({
    rowIdx: row,
    langCode: "es",
    ratio: 1,
    primaryLang: "es",
    primaryRatio: 1,
  });
  const italianEligible = isLanguageEligibleForTtsWithRole({
    rowIdx: row,
    langCode: "it",
    ratio: 2,
    primaryLang: "es",
    primaryRatio: 1,
  });

  assert(spanishEligible, `Row ${row}: Spanish (now primary) is active`);
  if (row % 2 === 0) {
    assert(italianEligible, `Row ${row}: Italian (now secondary 1:2 rel to Spanish) is active`);
  } else {
    assert(!italianEligible, `Row ${row}: Italian (now secondary 1:2 rel to Spanish) is inactive`);
  }
}

// 4. Highlight Verification
console.log("Test 4: Highlighting logic reflects relative secondary role");
assert(
  shouldHighlightSentenceForTtsWithRole({
    rowIdx: 0,
    langCode: "es",
    ratio: 4,
    primaryLang: "it",
    primaryRatio: 1,
    isSpoken: true,
  }),
  "Spanish (secondary) is highlighted on row 0",
);
assert(
  !shouldHighlightSentenceForTtsWithRole({
    rowIdx: 1,
    langCode: "es",
    ratio: 4,
    primaryLang: "it",
    primaryRatio: 1,
    isSpoken: true,
  }),
  "Spanish (secondary) is NOT highlighted on row 1",
);

// 5. Source-level UI Verification
console.log("Test 5: Verifying UI components for primary/secondary switching");
const perLangFile = path.join(
  process.cwd(),
  "src/components/beginner/PerLanguageTtsPreferences.tsx",
);
assert(fs.existsSync(perLangFile), "PerLanguageTtsPreferences.tsx exists");
const perLangContent = fs.readFileSync(perLangFile, "utf-8");

assert(
  perLangContent.includes("data-testid={`tts-role-badge-${language.code}`}"),
  "PerLanguageTtsPreferences renders Primary badge for primary language",
);
assert(
  perLangContent.includes("data-testid={`tts-switch-primary-${language.code}`}"),
  "PerLanguageTtsPreferences renders Make Primary button for secondary languages",
);
assert(
  perLangContent.includes('data-testid="tts-switch-roles-button"'),
  "PerLanguageTtsPreferences provides ⇄ Switch Primary/Secondary button",
);

const rowFile = path.join(process.cwd(), "src/components/SubtitleRow.tsx");
assert(fs.existsSync(rowFile), "SubtitleRow.tsx exists");
const rowContent = fs.readFileSync(rowFile, "utf-8");

assert(
  rowContent.includes(
    'data-tts-role={isPrimary ? "primary" : primaryTtsLang ? "secondary" : undefined}',
  ),
  "SubtitleRow applies data-tts-role attribute to subtitle cells",
);

const indexFile = path.join(process.cwd(), "src/routes/index.tsx");
assert(fs.existsSync(indexFile), "src/routes/index.tsx exists");
const indexContent = fs.readFileSync(indexFile, "utf-8");

assert(
  indexContent.includes("data-testid={`tts-role-badge-${lang.code}`}"),
  "Advanced mode renders Primary role badge",
);
assert(
  indexContent.includes("data-testid={`tts-switch-primary-${lang.code}`}"),
  "Advanced mode renders Make Primary switch button",
);
assert(
  indexContent.includes('data-testid="tts-switch-roles-button-advanced"'),
  "Advanced mode renders ⇄ Switch Primary/Secondary button",
);
assert(
  indexContent.includes("isLanguageEligibleForTtsWithRole"),
  "Playback coordinator uses isLanguageEligibleForTtsWithRole for section selection",
);

console.log("====================================================");
console.log("🎉 ALL PRIMARY/SECONDARY TTS RATIO CHECKS PASSED!");
console.log("====================================================");
