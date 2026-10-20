import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
import {
  computeParserDiff,
  getNextChangeIndex,
  getPrevChangeIndex,
} from "../src/utils/parserDiffHelper";
import type { Row } from "../src/lib/subtitles";

console.log("=========================================================================");
console.log("🧪 Verifying Parser Option Difference Confirmation & Preview (Task 149)");
console.log("=========================================================================");

const rootDir = process.cwd();

// Test 1: Verify computeParserDiff with identical rows (no changes)
console.log("--> [Test 1] Testing computeParserDiff with identical rows...");
const identicalRows: Row[] = [
  { start: 0, end: 1500, texts: { en: "Hello world" } },
  { start: 1600, end: 3200, texts: { en: "How are you doing today?" } },
];

const noDiff = computeParserDiff(identicalRows, identicalRows, "en");
assert.strictEqual(noDiff.hasChanges, false, "Identical rows should yield hasChanges = false");
assert.strictEqual(noDiff.totalChanges, 0, "Identical rows should have 0 changes");
console.log("✅ PASS: Identical rows correctly yield 0 changes.");

// Test 2: Verify computeParserDiff with split/merged rows
console.log("--> [Test 2] Testing computeParserDiff with split rows...");
const splitRows: Row[] = [
  { start: 0, end: 700, texts: { en: "Hello" } },
  { start: 700, end: 1500, texts: { en: "world" } },
  { start: 1600, end: 3200, texts: { en: "How are you doing today?" } },
];

const splitDiff = computeParserDiff(identicalRows, splitRows, "en");
assert.strictEqual(splitDiff.hasChanges, true, "Split rows should yield hasChanges = true");
assert(splitDiff.totalChanges > 0, "Split rows should have at least 1 change record");
assert(splitDiff.changedRecords.length > 0, "Changed records array should not be empty");
console.log(`✅ PASS: Detected ${splitDiff.totalChanges} changes (${splitDiff.changedRecords[0]?.changeType})`);

// Test 3: Test stepping navigation indices
console.log("--> [Test 3] Testing getNextChangeIndex and getPrevChangeIndex...");
assert.strictEqual(getNextChangeIndex(0, 3), 1, "Next index from 0 with total 3 should be 1");
assert.strictEqual(getNextChangeIndex(2, 3), 0, "Next index from 2 with total 3 should wrap to 0");
assert.strictEqual(getPrevChangeIndex(0, 3), 2, "Prev index from 0 with total 3 should wrap to 2");
assert.strictEqual(getPrevChangeIndex(2, 3), 1, "Prev index from 2 with total 3 should be 1");
console.log("✅ PASS: Next and Previous indices navigate and wrap correctly.");

// Test 4: Verify ParserDiffConfirmationModal component
console.log("--> [Test 4] Auditing ParserDiffConfirmationModal component...");
const modalPath = path.resolve(rootDir, "src/components/ParserDiffConfirmationModal.tsx");
assert(fs.existsSync(modalPath), "ParserDiffConfirmationModal.tsx must exist");
const modalContent = fs.readFileSync(modalPath, "utf8");
assert(modalContent.includes("ParserDiffConfirmationModalProps"), "Modal must export props interface");
assert(modalContent.includes("onConfirm"), "Modal must support onConfirm callback");
assert(modalContent.includes("onClose"), "Modal must support onClose callback");
assert(modalContent.includes("handleNext"), "Modal must support stepping to next record");
assert(modalContent.includes("handlePrev"), "Modal must support stepping to previous record");
assert(
  modalContent.includes("Confirm &amp; Apply") || modalContent.includes("Confirm & Apply"),
  "Modal must render Confirm & Apply button",
);
assert(modalContent.includes("Cancel"), "Modal must render Cancel button");
console.log("✅ PASS: ParserDiffConfirmationModal contains all required controls and callbacks.");

// Test 5: Verify index.tsx integration
console.log("--> [Test 5] Auditing index.tsx integration for confirmation toggle and modal...");
const indexPath = path.resolve(rootDir, "src/routes/index.tsx");
const indexContent = fs.readFileSync(indexPath, "utf8");
assert(indexContent.includes("ParserDiffConfirmationModal"), "index.tsx must import ParserDiffConfirmationModal");
assert(indexContent.includes("confirm-parser-diff-toggle"), "index.tsx must contain confirm-parser-diff-toggle");
assert(indexContent.includes("confirmParserDiffEnabled"), "index.tsx must manage confirmParserDiffEnabled state");
assert(indexContent.includes("computeParserDiff"), "index.tsx must call computeParserDiff");
console.log("✅ PASS: index.tsx integrates confirmation toggle and preview modal flow.");

// Test 6: Verify docs/files.md inventory
console.log("--> [Test 6] Auditing docs/files.md inventory...");
const filesMdPath = path.resolve(rootDir, "docs/files.md");
const filesMdContent = fs.readFileSync(filesMdPath, "utf8");
assert(filesMdContent.includes("ParserDiffConfirmationModal.tsx"), "docs/files.md must inventory ParserDiffConfirmationModal.tsx");
assert(filesMdContent.includes("parserDiffHelper.ts"), "docs/files.md must inventory parserDiffHelper.ts");
assert(filesMdContent.includes("verify-parser-diff-confirmation.ts"), "docs/files.md must inventory verify-parser-diff-confirmation.ts");
console.log("✅ PASS: docs/files.md accurately inventories all Task 149 files.");

console.log("=========================================================================");
console.log("🎉 ALL PARSER DIFF CONFIRMATION AUDIT CHECKS PASSED (100%)!");
console.log("=========================================================================");
