import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("=========================================================================");
console.log("🧪 Verifying README Created by GitHub Actions & Git Sync Exclusion Rule");
console.log("=========================================================================");

const rootDir = process.cwd();

// 1. Audit AGENTS.md for the mandatory git sync rule
console.log("--> [Step 1] Auditing AGENTS.md for README git sync exclusion policy...");
const agentsPath = path.resolve(rootDir, "AGENTS.md");
assert(fs.existsSync(agentsPath), "AGENTS.md must exist in repository root");
const agentsContent = fs.readFileSync(agentsPath, "utf8");

assert(
  agentsContent.includes("README.md is to be created by GitHub Actions") ||
    agentsContent.includes("README.md is to be created by github actions"),
  "AGENTS.md must state that README.md is to be created by GitHub Actions",
);
assert(
  agentsContent.includes("do not copy it when syncing git") ||
    agentsContent.includes("dont copy it when syncing git"),
  "AGENTS.md must mandate: do not copy README.md when syncing git",
);
assert(
  agentsContent.includes("update-readme.yml") && agentsContent.includes("update-readme.mjs"),
  "AGENTS.md must reference update-readme.yml and scripts/update-readme.mjs",
);
console.log(
  "✅ PASS: AGENTS.md codifies that README.md is created by GitHub Actions and excluded from git sync.",
);

// 2. Audit docs/operations/ACTIONS.md
console.log("\n--> [Step 2] Auditing docs/operations/ACTIONS.md for Section 4.7...");
const actionsPath = path.resolve(rootDir, "docs/operations/ACTIONS.md");
assert(fs.existsSync(actionsPath), "docs/operations/ACTIONS.md must exist");
const actionsContent = fs.readFileSync(actionsPath, "utf8");

assert(
  actionsContent.includes(
    "### 4.7 README.md Created by GitHub Actions — Do Not Copy When Syncing Git",
  ),
  "docs/operations/ACTIONS.md must include Section 4.7",
);
assert(
  actionsContent.includes("Git Sync Exclusion Mandate") ||
    actionsContent.includes("MUST NOT be copied or overwritten"),
  "docs/operations/ACTIONS.md must define Git Sync Exclusion Mandate",
);
console.log(
  "✅ PASS: docs/operations/ACTIONS.md Section 4.7 details the Git sync exclusion policy and rationale.",
);

// 3. Audit docs/self-verification.md
console.log("\n--> [Step 3] Auditing docs/self-verification.md for Sanity Check 8 & matrix...");
const selfVerifyPath = path.resolve(rootDir, "docs/self-verification.md");
assert(fs.existsSync(selfVerifyPath), "docs/self-verification.md must exist");
const selfVerifyContent = fs.readFileSync(selfVerifyPath, "utf8");

assert(
  selfVerifyContent.includes("Sanity Check 8: README.md Git Sync Exclusion Policy"),
  "docs/self-verification.md must include Sanity Check 8",
);
assert(
  selfVerifyContent.includes("test:readme-git-sync-rule"),
  "docs/self-verification.md must list test:readme-git-sync-rule in verification matrix",
);
console.log(
  "✅ PASS: docs/self-verification.md incorporates Sanity Check 8 and command matrix entry.",
);

// 4. Audit docs/files.md
console.log("\n--> [Step 4] Auditing docs/files.md inventory registration...");
const filesPath = path.resolve(rootDir, "docs/files.md");
assert(fs.existsSync(filesPath), "docs/files.md must exist");
const filesContent = fs.readFileSync(filesPath, "utf8");

assert(
  filesContent.includes("scripts/verify-readme-git-sync-rule.ts"),
  "docs/files.md must inventory scripts/verify-readme-git-sync-rule.ts",
);
console.log("✅ PASS: docs/files.md inventories scripts/verify-readme-git-sync-rule.ts.");

// 5. Audit package.json script registration
console.log("\n--> [Step 5] Auditing package.json test script...");
const packageJsonPath = path.resolve(rootDir, "package.json");
assert(fs.existsSync(packageJsonPath), "package.json must exist");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

assert(
  packageJson.scripts && packageJson.scripts["test:readme-git-sync-rule"],
  "package.json must include 'test:readme-git-sync-rule' script",
);
console.log("✅ PASS: package.json script 'test:readme-git-sync-rule' registered.");

console.log("\n=========================================================================");
console.log("🎉 ALL README CREATION & GIT SYNC EXCLUSION CHECKS PASSED 100%!");
console.log("=========================================================================");
