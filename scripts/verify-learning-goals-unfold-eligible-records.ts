import { readFileSync } from "fs";
import { resolve } from "path";
import {
  computeLanguageCriteriaStats,
  getEligibleLanguageRecords,
} from "../src/utils/newSubtitlesParser";
import type { Row } from "../src/lib/subtitles";

/**
 * Dedicated automated verification test for Task 395 (Prompt 179):
 * Verifies per-language unfolding reveals the list of eligible records alongside
 * the matching default language text in a 2-column table.
 */
function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
}

function runVerifyUnfoldEligibleRecords() {
  console.log(
    "=== Verifying Task 395 (Prompt 179): Unfoldable Eligible Records & Default Language 2-Column List ===",
  );

  const sampleRows: Row[] = [
    {
      start: 0,
      end: 1500,
      texts: {
        en: "Welcome back.",
        es: "Bienvenido de nuevo.",
        he: "ברוכים הבאים חזרה.",
      },
      criteria: [],
    },
    {
      start: 1500,
      end: 4000,
      texts: {
        en: "This subtitle sentence is definitely much longer than three words.",
        es: "Esta oración es demasiado larga para pasar el filtro.",
        he: "שלום.",
      },
      criteria: [],
    },
    {
      start: 4000,
      end: 6000,
      texts: {
        en: "Incomplete phrase",
        es: "Frase incompleta",
        he: "משפט לא שלם",
      },
      criteria: [],
    },
  ];

  // 1. Verify eligible records extraction and matching default language text
  const heEligible = getEligibleLanguageRecords(sampleRows, "he", "en", 3, true);
  assert(heEligible.length === 2, `Expected 2 eligible Hebrew records, got ${heEligible.length}`);
  assert(
    heEligible[0]!.languageText === "ברוכים הבאים חזרה." &&
      heEligible[0]!.defaultLanguageText === "Welcome back.",
    `Unexpected row 0 mapping: ${JSON.stringify(heEligible[0])}`,
  );
  assert(
    heEligible[1]!.languageText === "שלום." &&
      heEligible[1]!.defaultLanguageText ===
        "This subtitle sentence is definitely much longer than three words.",
    `Unexpected row 1 mapping: ${JSON.stringify(heEligible[1])}`,
  );

  // 2. Verify single-source parity with computeLanguageCriteriaStats
  const heStats = computeLanguageCriteriaStats(sampleRows, "he", "en", 3, true);
  assert(
    heStats.eligible === heEligible.length,
    `Stats count (${heStats.eligible}) must match getEligibleLanguageRecords length (${heEligible.length})`,
  );

  // 3. Verify language with missing track falls back cleanly while retaining default text
  const frEligible = getEligibleLanguageRecords(sampleRows, "fr", "en", 3, true);
  assert(frEligible.length === 1, `Expected 1 fallback French record, got ${frEligible.length}`);
  assert(
    frEligible[0]!.languageText === "" &&
      frEligible[0]!.evaluatedText === "Welcome back." &&
      frEligible[0]!.defaultLanguageText === "Welcome back.",
    `Unexpected fallback record: ${JSON.stringify(frEligible[0])}`,
  );

  // 4. Verify UI unfold button + 2-column table in LearningGoalsFiltersPanel.tsx
  const panelCode = readFileSync(
    resolve(process.cwd(), "src/components/shared/LearningGoalsFiltersPanel.tsx"),
    "utf8",
  );
  assert(
    panelCode.includes("learning-goals-lang-toggle-records-${lang.code}") &&
      panelCode.includes("learning-goals-lang-eligible-records-${lang.code}") &&
      panelCode.includes("learning-goals-lang-eligible-table-${lang.code}") &&
      panelCode.includes("learning-goals-lang-eligible-row-${lang.code}-${rec.index}") &&
      panelCode.includes("rec.defaultLanguageText"),
    "LearningGoalsFiltersPanel must render unfold toggle and 2-column eligible records table",
  );

  console.log("PASS: getEligibleLanguageRecords & computeLanguageCriteriaStats parity verified.");
  console.log("PASS: 2-column unfoldable eligible records UI verified.");
  console.log("SUCCESS: Task 395 (Prompt 179) verification passed 100%!");
}

try {
  runVerifyUnfoldEligibleRecords();
} catch (err: unknown) {
  console.error((err as Error).message);
  process.exit(1);
}
