import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
import {
  computeParserDiff,
  getNextChangeIndex,
  getPrevChangeIndex,
} from "../src/utils/parserDiffHelper";
import { type Row } from "../src/lib/subtitles";

console.log("==================================================================");
console.log("🧪 Running Parser Diff Confirmation & Preview Test Suite");
console.log("==================================================================");

const rootDir = process.cwd();

// 1. Verify computeParserDiff on Identical Rows
console.log("1. Verifying computeParserDiff on identical rows...");
const sampleRowsA: Row[] = [
  {
    start: 0,
    end: 2000,
    texts: { en: "Hello world.", es: "Hola mundo." },
  },
  {
    start: 2500,
    end: 4500,
    texts: { en: "How are you today?", es: "¿Cómo estás hoy?" },
  },
];

const identicalDiff = computeParserDiff(sampleRowsA, sampleRowsA, "en");
assert.strictEqual(identicalDiff.hasChanges, false, "Identical rows must produce hasChanges=false");
assert.strictEqual(identicalDiff.totalChanges, 0, "Identical rows must produce totalChanges=0");
assert.strictEqual(identicalDiff.changedRecords.length, 0, "No changed records on identical rows");
console.log("✅ PASS: computeParserDiff correctly detects identical rows");

// 2. Verify computeParserDiff on Divergent Rows (Splitting & Timing Differences)
console.log("2. Verifying computeParserDiff on divergent subtitle alignments...");
const sampleRowsB: Row[] = [
  {
    start: 0,
    end: 1000,
    texts: { en: "Hello", es: "Hola" },
  },
  {
    start: 1050,
    end: 2000,
    texts: { en: "world.", es: "mundo." },
  },
  {
    start: 2500,
    end: 4500,
    texts: { en: "How are you today?", es: "¿Cómo estás hoy?" },
  },
];

const divergentDiff = computeParserDiff(sampleRowsA, sampleRowsB, "en");
assert.strictEqual(divergentDiff.hasChanges, true, "Divergent rows must produce hasChanges=true");
assert.strictEqual(divergentDiff.totalBefore, 2, "totalBefore must be 2");
assert.strictEqual(divergentDiff.totalAfter, 3, "totalAfter must be 3");
assert.ok(divergentDiff.totalChanges >= 1, "Must detect at least 1 changed section");
const firstChange = divergentDiff.changedRecords[0];
assert.ok(firstChange, "First change record must exist");
assert.ok(firstChange.beforeTextSummary.includes("Hello world"), "Summary must reflect before state");
assert.ok(firstChange.afterTextSummary.includes("Hello"), "Summary must reflect after state");
console.log("✅ PASS: computeParserDiff correctly calculates alignment diffs and summaries");

// 3. Verify getNextChangeIndex and getPrevChangeIndex Stepping
console.log("3. Verifying record stepping navigation ([Next] / [Previous])...");
const totalChanges = 5;
assert.strictEqual(getNextChangeIndex(0, totalChanges), 1, "0 -> next is 1");
assert.strictEqual(getNextChangeIndex(4, totalChanges), 0, "4 -> next wraps to 0");
assert.strictEqual(getPrevChangeIndex(0, totalChanges), 4, "0 -> prev wraps to 4");
assert.strictEqual(getPrevChangeIndex(3, totalChanges), 2, "3 -> prev is 2");
assert.strictEqual(getNextChangeIndex(0, 0), 0, "0 changes handles gracefully");
console.log("✅ PASS: Record stepping navigation loops correctly");

// 4. Verify Component Contracts in ParserDiffConfirmationModal.tsx
console.log("4. Verifying ParserDiffConfirmationModal.tsx component contracts...");
const modalPath = path.join(rootDir, "src/components/ParserDiffConfirmationModal.tsx");
assert.ok(fs.existsSync(modalPath), "ParserDiffConfirmationModal.tsx must exist");
const modalSrc = fs.readFileSync(modalPath, "utf-8");

assert.ok(modalSrc.includes('role="dialog"'), "Modal must have dialog accessibility role");
assert.ok(modalSrc.includes("btn-parser-diff-prev"), "Modal must contain [Previous] record step button");
assert.ok(modalSrc.includes("btn-parser-diff-next"), "Modal must contain [Next] record step button");
assert.ok(modalSrc.includes("btn-parser-diff-apply"), "Modal must contain [Confirm & Apply] button");
assert.ok(modalSrc.includes("btn-parser-diff-cancel"), "Modal must contain [Cancel] button");
assert.ok(modalSrc.includes("parser-diff-stepper-label"), "Modal must show changed records stepper label");
assert.ok(modalSrc.includes("parser-diff-before-card"), "Modal must show before changes card");
assert.ok(modalSrc.includes("parser-diff-after-card"), "Modal must show after changes card");
assert.ok(modalSrc.includes("ParserDiffConfirmationModalProps"), "Modal must export props interface");
console.log("✅ PASS: ParserDiffConfirmationModal component contracts verified");

// 5. Verify Integration in src/routes/index.tsx
console.log("5. Verifying ParserDiffConfirmationModal integration in index.tsx...");
const indexRoutePath = path.join(rootDir, "src/routes/index.tsx");
const indexSrc = fs.readFileSync(indexRoutePath, "utf-8");

assert.ok(indexSrc.includes("toggle-confirm-parser-diff"), "index.tsx must contain toggle-confirm-parser-diff checkbox");
assert.ok(indexSrc.includes("confirm-parser-diff-toggle"), "index.tsx must contain confirm-parser-diff-toggle switch");
assert.ok(indexSrc.includes("<ParserDiffConfirmationModal"), "index.tsx must render ParserDiffConfirmationModal");
assert.ok(indexSrc.includes("checkAndApplyCriteria"), "index.tsx must contain checkAndApplyCriteria");
assert.ok(indexSrc.includes("computeParserDiff"), "index.tsx must call computeParserDiff");
console.log("✅ PASS: index.tsx diff preview flow integrated successfully");

// 6. Verify Version Parity Across All Targets
console.log("6. Verifying version parity across all targets...");
const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf-8"));
const currentVersion = pkg.version;
assert.ok(currentVersion, "package.json version must exist");

const gradleSrc = fs.readFileSync(path.join(rootDir, "android-shell/app/build.gradle.kts"), "utf-8");
assert.ok(gradleSrc.includes(`versionName = "${currentVersion}"`), `build.gradle.kts versionName must be ${currentVersion}`);

const updaterSrc = fs.readFileSync(path.join(rootDir, "src/utils/apkUpdater.ts"), "utf-8");
assert.ok(updaterSrc.includes(`CURRENT_APK_VERSION = "v${currentVersion}"`), `apkUpdater.ts version must be v${currentVersion}`);

const appConfigSrc = fs.readFileSync(path.join(rootDir, "src/config/appConfig.ts"), "utf-8");
assert.ok(appConfigSrc.includes(`APP_VERSION = "${currentVersion}"`), `appConfig.ts version must be ${currentVersion}`);

const settingsSrc = fs.readFileSync(path.join(rootDir, "src/utils/appSettings.ts"), "utf-8");
assert.ok(settingsSrc.includes(`version: "${currentVersion}"`), `appSettings.ts version must be ${currentVersion}`);
console.log(`✅ PASS: Version ${currentVersion} verified across all targets`);

// 7. Verify docs/files.md inventory
console.log("7. Auditing docs/files.md inventory...");
const filesMdPath = path.resolve(rootDir, "docs/files.md");
const filesMdContent = fs.readFileSync(filesMdPath, "utf8");
assert.ok(filesMdContent.includes("ParserDiffConfirmationModal.tsx"), "docs/files.md must inventory ParserDiffConfirmationModal.tsx");
assert.ok(filesMdContent.includes("parserDiffHelper.ts"), "docs/files.md must inventory parserDiffHelper.ts");
assert.ok(filesMdContent.includes("verify-parser-diff-confirmation.ts"), "docs/files.md must inventory verify-parser-diff-confirmation.ts");
console.log("✅ PASS: docs/files.md accurately inventories all parser diff files");

console.log("==================================================================");
console.log("🎉 PARSER DIFF CONFIRMATION & PREVIEW TEST SUITE PASSED 100%!");
console.log("==================================================================");