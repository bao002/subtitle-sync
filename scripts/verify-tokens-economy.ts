import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("====================================================");
console.log("🧪 Starting Token Economy & Prompt Workflow Verification");
console.log("====================================================");

const rootDir = process.cwd();

// 1. Verify docs/tokens.md exists and no duplicate root tokens.md exists
console.log("1. Verifying docs/tokens.md existence and no duplicate in root...");
const tokensPath = path.join(rootDir, "tokens.md");
const docsTokensPath = path.join(rootDir, "docs/tokens.md");
assert(!fs.existsSync(tokensPath), "tokens.md must not be duplicated in root directory (canonical is docs/tokens.md)");
assert(fs.existsSync(docsTokensPath), "docs/tokens.md must exist in docs directory");

const tokensContent = fs.readFileSync(docsTokensPath, "utf8");

// 2. Verify core token economy principles in tokens.md
console.log("2. Verifying token economy principles and terminology...");
assert(
  tokensContent.includes("Token Economy") &&
    tokensContent.includes("token usage") &&
    tokensContent.includes("current-sub-task.md") &&
    tokensContent.includes("temp.md") &&
    tokensContent.includes("sub-tasks"),
  "tokens.md must document token economy, subtask splitting, current-sub-task.md, and temp.md",
);
assert(
  tokensContent.includes("Context Bloat") || tokensContent.includes("Token Exhaustion"),
  "tokens.md must detail reasons why big tasks fail due to token waste",
);
assert(
  tokensContent.includes("Golden Rule") || tokensContent.includes("every single prompt"),
  "tokens.md must mandate activating the rule on every prompt",
);
console.log("✅ PASS: tokens.md correctly specifies token maximization principles");

// 3. Verify current-sub-task.md and temp.md presence
console.log("3. Verifying active staging files (current-sub-task.md & temp.md)...");
const currentSubTaskPath = path.join(rootDir, "current-sub-task.md");
const tempPath = path.join(rootDir, "temp.md");
assert(fs.existsSync(currentSubTaskPath), "current-sub-task.md must exist");
assert(fs.existsSync(tempPath), "temp.md must exist");
console.log("✅ PASS: current-sub-task.md and temp.md are active in workspace");

// 4. Verify AGENTS.md references tokens.md and current-sub-task.md
console.log("4. Verifying AGENTS.md mandates tokens.md workflow...");
const agentsPath = path.join(rootDir, "AGENTS.md");
assert(fs.existsSync(agentsPath), "AGENTS.md must exist");
const agentsContent = fs.readFileSync(agentsPath, "utf8");

assert(
  agentsContent.includes("tokens.md") &&
    agentsContent.includes("current-sub-task.md"),
  "AGENTS.md must reference tokens.md and current-sub-task.md under work tracking",
);
console.log("✅ PASS: AGENTS.md incorporates tokens.md token economy flow");

console.log("====================================================");
console.log("🎉 All Token Economy Verification Tests PASSED Successfully!");
console.log("====================================================");
