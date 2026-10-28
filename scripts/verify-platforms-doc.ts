import fs from "fs";
import path from "path";

console.log("=========================================================================");
console.log("🧪 Verifying docs/platforms.md & AI Studio Platform Strategy Specification");
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

// 1. Verify docs/platforms.md exists
const platformsPath = path.resolve(process.cwd(), "docs/platforms.md");
assert(fs.existsSync(platformsPath), "docs/platforms.md must exist under docs/");

const content = fs.existsSync(platformsPath) ? fs.readFileSync(platformsPath, "utf-8") : "";

// 2. Verify key platform strategy requirements
const requiredPhrases = [
  "Docker Support Analysis",
  "Docker daemon is NOT supported",
  "no docker binary",
  "Config Once, Run with Minimal Setup",
  "Persistent vs. Ephemeral Environment Model",
  "Two-Step Minimal Effort Execution Protocol",
  "Step 1: Rapid Script-Level Verification",
  "Step 2: Headless Playwright Execution",
  "Platform Capabilities & Trade-Off Matrix",
  "AI Studio Build Sandbox",
  "GitHub Actions CI",
  "Troubleshooting Common Platform Issues",
  "npx playwright install chromium",
  "npx playwright test e2e/web.spec.ts",
];

for (const phrase of requiredPhrases) {
  assert(
    content.includes(phrase),
    `docs/platforms.md must include "${phrase}"`,
  );
}

// 3. Verify docs/files.md registers docs/platforms.md
const filesMdPath = path.resolve(process.cwd(), "docs/files.md");
const filesMdContent = fs.readFileSync(filesMdPath, "utf-8");
assert(
  filesMdContent.includes("docs/platforms.md"),
  "docs/files.md must catalog docs/platforms.md",
);

// 4. Verify no duplicate platforms.md in root
assert(
  !fs.existsSync(path.resolve(process.cwd(), "platforms.md")),
  "No duplicate platforms.md allowed in root",
);

console.log("=========================================================================");
if (failureCount === 0) {
  console.log("🎉 ALL PLATFORMS SPECIFICATION VERIFICATIONS PASSED!");
  process.exit(0);
} else {
  console.error(`❌ ${failureCount} VERIFICATION(S) FAILED.`);
  process.exit(1);
}
