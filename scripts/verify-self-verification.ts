import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("=========================================================================");
console.log("🧪 Verifying self-verification.md Protocol Specification & Integrity");
console.log("=========================================================================");

const rootDir = process.cwd();

// 1. Verify existence of docs/self-verification.md and no duplicate in root
const rootSpecPath = path.resolve(rootDir, "self-verification.md");
const docsSpecPath = path.resolve(rootDir, "docs/self-verification.md");

assert(
  !fs.existsSync(rootSpecPath),
  "self-verification.md must not exist in root repository (canonical is docs/self-verification.md)",
);
assert(fs.existsSync(docsSpecPath), "docs/self-verification.md must exist in docs/");

const docsSpecContent = fs.readFileSync(docsSpecPath, "utf8");

assert(
  docsSpecContent.length > 1000,
  "docs/self-verification.md must provide comprehensive protocol instructions",
);
console.log("✓ Verified docs/self-verification.md exists and no root duplicate.");

// 2. Verify Core Pillars in self-verification.md
const requiredSections = [
  "Quick Verification Command Matrix",
  "Pillar 1: Ensuring All Tests Are Passing",
  "Pillar 2: Screencast Video Capture, Packaging & README Linkage",
  "Pillar 3: Sanity Checks & Self-Verifications",
  "Pillar 4: Task Tracking & Prompt Completion Audit",
];

for (const section of requiredSections) {
  assert(
    docsSpecContent.includes(section),
    `docs/self-verification.md must include section: "${section}"`,
  );
  console.log(`✓ Section verified: ${section}`);
}

// 3. Verify All 6 Sanity Checks are Defined
const sanityChecks = [
  "Sanity Check 1: Repository Hygiene",
  "Sanity Check 2: Strict JSON3 Caption Validation & Anti-Bot Architecture",
  "Sanity Check 3: Zero Synthetic Fixtures on Android",
  "Sanity Check 4: Documentation & Markdown Link Resolution",
  "Sanity Check 5: Code Modularity & Decomposed Components",
  "Sanity Check 6: Build & Lint Zero-Defect Gate",
];

for (const check of sanityChecks) {
  assert(docsSpecContent.includes(check), `docs/self-verification.md must define "${check}"`);
  console.log(`✓ Sanity check verified: ${check}`);
}

// 4. Verify Screencast Capture Lifecycle & README Linkage Rules
assert(
  docsSpecContent.includes("screenrecord") &&
    docsSpecContent.includes("/sdcard/android-emulator-video.mp4"),
  "docs/self-verification.md must specify adb screenrecord command and output path",
);
assert(
  docsSpecContent.includes("SIGINT") &&
    (docsSpecContent.includes("kill -2") || docsSpecContent.includes("pkill -2")),
  "docs/self-verification.md must specify graceful SIGINT container finalization",
);
assert(
  docsSpecContent.includes("Finalize Screencast Recording and Pull Video") ||
    docsSpecContent.includes("set +e"),
  "docs/self-verification.md must document set +e resilient pull step",
);
assert(
  docsSpecContent.includes("Android Emulator Screencast Video"),
  "docs/self-verification.md must document README table row requirement",
);
console.log("✓ Screencast capture lifecycle & README linkage requirements verified.");

// 5. Verify Script Dependencies Referenced in self-verification.md Actually Exist
const referencedScripts = [
  "scripts/verify-screencast-availability.ts",
  "scripts/verify-readme-links.ts",
  "scripts/verify-repo-hygiene.ts",
  "scripts/verify-strict-json3-only-validation.ts",
  "scripts/verify-valid-json-cache-guard.ts",
  "scripts/verify-doc-contracts.ts",
  "scripts/verify-android-e2e-spec.ts",
  "scripts/verify-code-modularity-standards.ts",
  "scripts/verify-tokens-economy.ts",
  "scripts/verify-hotfix-and-done-workflow.ts",
];

for (const scriptRel of referencedScripts) {
  const scriptAbs = path.resolve(rootDir, scriptRel);
  assert(
    fs.existsSync(scriptAbs),
    `Referenced script in self-verification.md must exist: ${scriptRel}`,
  );
  console.log(`✓ Referenced verification script exists: ${scriptRel}`);
}

// 6. Verify README.md Contains Screencast Video Row and Link
const readmePath = path.resolve(rootDir, "README.md");
const readmeContent = fs.readFileSync(readmePath, "utf8");
assert(
  readmeContent.includes("Android Emulator Screencast Video"),
  "README.md must link to Android Emulator Screencast Video",
);
assert(
  readmeContent.includes("android-emulator-video.mp4"),
  "README.md must source android-emulator-video.mp4",
);
assert(
  readmeContent.includes("android-emulator-report.html"),
  "README.md must link to Android Emulator Report",
);
console.log("✓ README.md verified with active screencast video and report links.");

console.log("=========================================================================");
console.log("🎉 ALL SELF-VERIFICATION PROTOCOL CHECKS PASSED SUCCESSFULLY!");
console.log("=========================================================================");
