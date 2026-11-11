import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

console.log("=========================================================================");
console.log("🧪 Verifying Task 385 (Prompt 154 - Chapter 0): Disable Readme Workflow");
console.log("=========================================================================");

const rootDir = process.cwd();
const workflowPath = path.resolve(rootDir, ".github/workflows/update-readme.yml");

assert.ok(fs.existsSync(workflowPath), ".github/workflows/update-readme.yml must exist");
const workflowContent = fs.readFileSync(workflowPath, "utf-8");

console.log("\nTest 1: Verifying update-readme.yml job is disabled...");
assert.ok(
  workflowContent.includes("if: false"),
  "update-readme.yml must include 'if: false' to prevent workflow execution and avoid git conflicts",
);
console.log("✅ PASS: sync-readme job is guarded with 'if: false'.");

console.log("\nTest 2: Verifying commit and push step is disabled...");
const commitPushMatches = workflowContent.match(/name:\s*Commit and Push if README Changed[\s\S]*?if:\s*false/);
assert.ok(
  commitPushMatches,
  "Commit and push step must be disabled with 'if: false' so no automated commits cause git conflicts",
);
console.log("✅ PASS: Automated commit and push step is explicitly disabled with 'if: false'.");

console.log("\nTest 3: Verifying clean minimalist README.md...");
const readmePath = path.resolve(rootDir, "README.md");
assert.ok(fs.existsSync(readmePath), "README.md must exist");
const readmeContent = fs.readFileSync(readmePath, "utf-8");
const readmeLines = readmeContent.trim().split("\n");
assert.ok(readmeLines.length <= 15, `README.md must be concise (<= 15 lines), got ${readmeLines.length}`);
console.log(`✅ PASS: README.md is clean and concise (${readmeLines.length} lines).`);

console.log("=========================================================================");
console.log("🎉 ALL CHECKS FOR TASK 385 PASSED (3/3)!");
console.log("=========================================================================");
