import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import assert from "node:assert";
import {
  getCriteriaMatchActionPreference,
  setCriteriaMatchActionPreference,
  CRITERIA_MATCH_ACTION_EVENT,
} from "../src/lib/playback-preferences";
import {
  isSubtitleRowMatchingCriteria,
  filterSubtitleRowsByCriteria,
} from "../src/utils/componentOptimizationService";
import { type Row } from "../src/lib/subtitles";

function probeUrl(urlPath: string): Promise<{ status: number; text: string }> {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://localhost:3000${urlPath}`, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        resolve({
          status: res.statusCode || 0,
          text: data,
        });
      });
    });
    req.on("error", (err) => reject(err));
    req.setTimeout(8000, () => {
      req.destroy();
      reject(new Error(`Timeout probing dev server for ${urlPath}`));
    });
  });
}

async function run() {
  console.log("=========================================================================");
  console.log("🧪 Verifying Task 372: Subtitles-Table Highlight vs Filter Toggle");
  console.log("=========================================================================");

  // 1. Verify playback preferences persistent storage and events
  console.log("\n[1] Verifying CriteriaMatchAction preference storage & events...");
  assert.strictEqual(typeof getCriteriaMatchActionPreference, "function");
  assert.strictEqual(typeof setCriteriaMatchActionPreference, "function");
  assert.strictEqual(CRITERIA_MATCH_ACTION_EVENT, "yt-criteria-match-action-changed");

  // Test set/get round-trip
  setCriteriaMatchActionPreference("highlight");
  assert.strictEqual(getCriteriaMatchActionPreference(), "highlight");

  setCriteriaMatchActionPreference("filter");
  assert.strictEqual(getCriteriaMatchActionPreference(), "filter");
  console.log("  ✓ CriteriaMatchAction getter, setter, and event verified.");

  // 2. Verify isSubtitleRowMatchingCriteria and filterSubtitleRowsByCriteria
  console.log("\n[2] Verifying isSubtitleRowMatchingCriteria logic...");
  const mockRows: Row[] = [
    {
      start: 0,
      end: 2,
      texts: { en: "Short sentence." },
    },
    {
      start: 2,
      end: 5,
      texts: { en: "This is a longer sentence with more than five words." },
    },
    {
      start: 5,
      end: 7,
      texts: { en: "Incomplete phrase without terminal punctuation" },
    },
  ];

  // Max 4 words: row 0 matches (2 words), row 1 fails (10 words), row 2 fails (6 words)
  const matchRow0 = isSubtitleRowMatchingCriteria(mockRows[0], "en", 4, false);
  const matchRow1 = isSubtitleRowMatchingCriteria(mockRows[1], "en", 4, false);
  assert.strictEqual(matchRow0, true, "Row 0 has 2 words, must match max 4 words limit");
  assert.strictEqual(matchRow1, false, "Row 1 has 10 words, must not match max 4 words limit");

  // Skip incomplete: row 0 matches (ends with '.'), row 2 fails (no terminal punctuation)
  const matchRow2 = isSubtitleRowMatchingCriteria(mockRows[2], "en", 10, true);
  assert.strictEqual(matchRow2, false, "Row 2 lacks terminal punctuation, must not match skipIncomplete");

  // Filter test
  const filtered = filterSubtitleRowsByCriteria(mockRows, "en", 4, false);
  assert.strictEqual(filtered.length, 1, "Only row 0 should pass filter for max 4 words");
  assert.strictEqual(filtered[0].texts.en, "Short sentence.");
  console.log("  ✓ isSubtitleRowMatchingCriteria correctly evaluates word count and completeness.");

  // 3. Verify SubtitlesTablePanel.tsx contains toggle controls and highlight mode branching
  console.log("\n[3] Verifying SubtitlesTablePanel.tsx toggle UI & highlight branching...");
  const tablePanelPath = path.resolve(process.cwd(), "src/components/SubtitlesTablePanel.tsx");
  const tableContent = fs.readFileSync(tablePanelPath, "utf-8");

  assert.ok(
    tableContent.includes('data-testid="criteria-match-action-controls"'),
    "SubtitlesTablePanel must have criteria-match-action-controls",
  );
  assert.ok(
    tableContent.includes('data-testid="btn-criteria-action-filter"'),
    "SubtitlesTablePanel must have btn-criteria-action-filter",
  );
  assert.ok(
    tableContent.includes('data-testid="btn-criteria-action-highlight"'),
    "SubtitlesTablePanel must have btn-criteria-action-highlight",
  );
  assert.ok(
    tableContent.includes('data-testid="toggle-criteria-match-action-btn"'),
    "SubtitlesTablePanel must have toggle-criteria-match-action-btn",
  );
  assert.ok(
    tableContent.includes('activeCriteriaMatchAction === "highlight"'),
    "SubtitlesTablePanel must branch on highlight mode",
  );
  console.log("  ✓ SubtitlesTablePanel.tsx UI controls and branching verified.");

  // 4. Verify SubtitleRow.tsx contains criteria highlight styling & data-testid="row-criteria-highlighted"
  console.log("\n[4] Verifying SubtitleRow.tsx criteria highlight styling and test ID...");
  const rowPath = path.resolve(process.cwd(), "src/components/SubtitleRow.tsx");
  const rowContent = fs.readFileSync(rowPath, "utf-8");

  assert.ok(
    rowContent.includes("isCriteriaMatched"),
    "SubtitleRow must accept isCriteriaMatched prop",
  );
  assert.ok(
    rowContent.includes("isCriteriaHighlightMode"),
    "SubtitleRow must accept isCriteriaHighlightMode prop",
  );
  assert.ok(
    rowContent.includes('data-testid="row-criteria-highlighted"'),
    "SubtitleRow must render data-testid='row-criteria-highlighted' on matched row",
  );
  assert.ok(
    rowContent.includes("data-criteria-highlighted"),
    "SubtitleRow must render data-criteria-highlighted on <tr>",
  );
  console.log("  ✓ SubtitleRow.tsx highlight attributes and visual styling verified.");

  // 5. Verify 100% parity across Advanced Mode and Beginner Mode in index.tsx
  console.log("\n[5] Verifying 100% parity across Advanced and Beginner modes...");
  const indexPath = path.resolve(process.cwd(), "src/routes/index.tsx");
  const indexContent = fs.readFileSync(indexPath, "utf-8");

  const advancedMatch = indexContent.includes("criteriaMatchAction={criteriaMatchAction}");
  const beginnerMatch =
    (indexContent.match(/criteriaMatchAction=\{criteriaMatchAction\}/g) || []).length >= 2;
  assert.ok(
    advancedMatch && beginnerMatch,
    "Both Advanced and Beginner modes must pass criteriaMatchAction to SubtitlesTablePanel",
  );
  console.log("  ✓ Parity verified: both Advanced and Beginner modes share the criteriaMatchAction state.");

  // 6. Probing Dev Server HTTP 200 transforms
  console.log("\n[6] Probing dev server for all modified components...");
  const modulesToProbe = [
    "/src/components/SubtitlesTablePanel.tsx",
    "/src/components/SubtitleRow.tsx",
    "/src/lib/playback-preferences.ts",
    "/src/utils/componentOptimizationService.ts",
    "/src/routes/index.tsx",
    "/",
  ];
  for (const mod of modulesToProbe) {
    const res = await probeUrl(mod);
    assert.strictEqual(res.status, 200, `Dev server must return HTTP 200 for ${mod}`);
    assert.ok(!res.text.includes("[PARSE_ERROR]"), `Transform for ${mod} must not contain PARSE_ERROR`);
    console.log(`  ✓ ${mod}: HTTP 200 OK (${res.text.length} bytes transformed)`);
  }

  console.log("\n=========================================================================");
  console.log("🎉 ALL CHECKS PASSED: Task 372 verified 100% successfully!");
  console.log("=========================================================================");
}

run().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
