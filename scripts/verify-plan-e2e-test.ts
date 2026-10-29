import fs from "fs";
import path from "path";

console.log("=========================================================================");
console.log("🧪 Verifying docs/plan_e2e_test.md & E2E Testing Plan for TTS Ratio");
console.log("=========================================================================");

let failureCount = 0;

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    failureCount++;
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

// 1. Verify docs/plan_e2e_test.md exists
const planPath = path.resolve(process.cwd(), "docs/plan_e2e_test.md");
assert(fs.existsSync(planPath), "docs/plan_e2e_test.md must exist under docs/");

const planContent = fs.existsSync(planPath) ? fs.readFileSync(planPath, "utf-8") : "";

// 2. Verify key plan components and invariants
const requiredPhrases = [
  "Multi-Language Independence",
  "Alias & Dialect Normalization",
  "UI Cell Badge Parity",
  "Video Transport Coordination",
  "Reset Cadence Counter",
  "speechSynthesis",
  "L2Ryrr6txwA",
  "pt-BR",
  "iw",
  "1:2",
  "1:3",
  "reset-played-subtitles-btn",
  "Subtitle Table Highlighting Cessation",
  "data-tts-pronounced-highlight",
  "Highlighting MUST be stopped/omitted",
];

for (const phrase of requiredPhrases) {
  assert(planContent.includes(phrase), `docs/plan_e2e_test.md must include "${phrase}"`);
}

// 3. Verify docs/files.md registers docs/plan_e2e_test.md
const filesMdPath = path.resolve(process.cwd(), "docs/files.md");
const filesMdContent = fs.readFileSync(filesMdPath, "utf-8");
assert(
  filesMdContent.includes("docs/plan_e2e_test.md"),
  "docs/files.md must catalog docs/plan_e2e_test.md",
);

// 4. Verify no duplicate plan_e2e_test.md in root
assert(
  !fs.existsSync(path.resolve(process.cwd(), "plan_e2e_test.md")),
  "No duplicate plan_e2e_test.md in root directory",
);

if (failureCount > 0) {
  console.error(`\n❌ Total failures: ${failureCount}`);
  process.exit(1);
}

console.log("\n🎉 ALL PLAN E2E TEST CHECKS PASSED!");
