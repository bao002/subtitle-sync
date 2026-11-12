import { readFileSync } from "fs";
import { resolve } from "path";
import {
  computeLanguageCriteriaStats,
  computeOverallCriteriaStats,
  filterSubtitleRowsByCriteria,
} from "../src/utils/newSubtitlesParser";
import type { Row } from "../src/lib/subtitles";

/**
 * Dedicated automated verification test for Task 394 (Prompt 178):
 * Verifies per-language and overall record eligibility statistics calculation
 * and UI wiring across SubtitlesTablePanel and LearningGoals (Advanced & Beginner modes).
 */
function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
}

function runVerifyCriteriaStatistics() {
  console.log("=== Verifying Task 394 (Prompt 178): Row Criteria Eligibility Statistics ===");

  const sampleRows: Row[] = [
    {
      start: 0,
      end: 1000,
      texts: {
        en: "Hello world.",
        es: "Hola mundo.",
        he: "שלום עולם.",
      },
      criteria: [],
    },
    {
      start: 1000,
      end: 3000,
      texts: {
        en: "This is a much longer sentence with many words.",
        es: "Esta es una oración mucho más larga.",
        he: "קצר.",
      },
      criteria: [],
    },
    {
      start: 3000,
      end: 5000,
      texts: {
        en: "Incomplete phrase without period",
        es: "Hola amigo",
        he: "זה משפט ארוך מאוד עם יותר מדי מילים כאן.",
      },
      criteria: [],
    },
    {
      start: 5000,
      end: 7000,
      texts: {
        en: "Short question?",
        es: "¿Pregunta corta?",
        he: "שאלה קצרה?",
      },
      criteria: [],
    },
  ];

  // 1. Per-language max words only (maxWords = 4, skipIncomplete = false)
  const enWordOnly = computeLanguageCriteriaStats(sampleRows, "en", "en", 4, false);
  assert(
    enWordOnly.eligible === 3 && enWordOnly.total === 4 && enWordOnly.percentage === 75,
    `Expected en (max 4w, all) => 3/4 (75%), got ${JSON.stringify(enWordOnly)}`,
  );

  // 2. Per-language max words + complete sentence punctuation check
  const enStrict = computeLanguageCriteriaStats(sampleRows, "en", "en", 4, true);
  assert(
    enStrict.eligible === 2 && enStrict.total === 4 && enStrict.percentage === 50,
    `Expected en (max 4w, punct) => 2/4 (50%), got ${JSON.stringify(enStrict)}`,
  );

  // 3. Language falling back to base text when its own column text is missing
  const fallbackRows: Row[] = [
    { start: 0, end: 1000, texts: { en: "One two." }, criteria: [] },
    { start: 1000, end: 2000, texts: { en: "One two three four five six." }, criteria: [] },
  ];
  const frFallback = computeLanguageCriteriaStats(fallbackRows, "fr", "en", 3, true);
  assert(
    frFallback.eligible === 1 && frFallback.total === 2 && frFallback.percentage === 50,
    `Expected fr fallback to en => 1/2 (50%), got ${JSON.stringify(frFallback)}`,
  );

  // 4. Empty rows returns safe zeros
  const emptyStats = computeLanguageCriteriaStats([], "en", "en", 10, false);
  assert(
    emptyStats.eligible === 0 && emptyStats.total === 0 && emptyStats.percentage === 0,
    `Expected empty stats zeros, got ${JSON.stringify(emptyStats)}`,
  );

  // 5. Overall stats & languageSkipIncomplete integration
  const overall = computeOverallCriteriaStats(
    sampleRows,
    "en",
    10,
    false,
    { he: 3 },
    { es: true },
  );
  // Row 0: en 2w, he 2w (<=3), es ends '.' => VALID
  // Row 1: en 9w, he 1w (<=3), es ends '.' => VALID
  // Row 2: he 8w (>3) & es incomplete => INVALID
  // Row 3: en 2w, he 2w (<=3), es ends '?' => VALID
  assert(
    overall.eligible === 3 && overall.total === 4 && overall.percentage === 75,
    `Expected overall 3/4 (75%), got ${JSON.stringify(overall)}`,
  );

  const filtered = filterSubtitleRowsByCriteria(sampleRows, "en", 10, false, { he: 3 }, { es: true });
  assert(filtered.length === overall.eligible, "Filtered count must match overall eligible count");

  // 6. UI & parity checks
  const panelCode = readFileSync(
    resolve(process.cwd(), "src/components/shared/LearningGoalsFiltersPanel.tsx"),
    "utf8",
  );
  assert(
    panelCode.includes("learning-goals-lang-stats-${lang.code}") &&
      panelCode.includes("learning-goals-overall-stats") &&
      panelCode.includes("computeLanguageCriteriaStats") &&
      panelCode.includes("computeOverallCriteriaStats"),
    "LearningGoalsFiltersPanel must render per-language and overall eligibility statistics",
  );

  const tablePanelCode = readFileSync(
    resolve(process.cwd(), "src/components/SubtitlesTablePanel.tsx"),
    "utf8",
  );
  assert(
    tablePanelCode.includes("rows={rows}") && tablePanelCode.includes("baseLanguage={defaultLang}"),
    "SubtitlesTablePanel must pass rows and baseLanguage to LearningGoalsFiltersPanel",
  );

  const indexCode = readFileSync(resolve(process.cwd(), "src/routes/index.tsx"), "utf8");
  const rowsPropMatches = indexCode.match(/<LearningGoalsFiltersPanel[\s\S]*?rows=\{rows\}/g) || [];
  assert(
    rowsPropMatches.length >= 2,
    `Expected both Beginner and Advanced LearningGoalsFiltersPanel instances in index.tsx to receive rows={rows}, found ${rowsPropMatches.length}`,
  );

  console.log("PASS: Unit math & edge cases verified.");
  console.log("PASS: LearningGoalsFiltersPanel renders per-language & overall valid counts.");
  console.log("PASS: SubtitlesTablePanel + Advanced + Beginner parity verified.");
  console.log("SUCCESS: Task 394 (Prompt 178) verification passed 100%!");
}

try {
  runVerifyCriteriaStatistics();
} catch (err: unknown) {
  console.error((err as Error).message);
  process.exit(1);
}
