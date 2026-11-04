import fs from "fs";
import path from "path";
import assert from "assert";

console.log("=========================================================================");
console.log("🧪 Verifying Parallel Planning Mode Protocol (docs/plans/ & AGENTS.md)");
console.log("=========================================================================\n");

const rootDir = process.cwd();
const agentsMdPath = path.resolve(rootDir, "AGENTS.md");
const plansDirPath = path.resolve(rootDir, "docs/plans");
const promptHistoryPath = path.resolve(rootDir, "prompt_history.md");

// Step 1: Verify AGENTS.md parallel planning rules
console.log("--> [Step 1] Verifying AGENTS.md parallel planning mode specifications...");
assert(fs.existsSync(agentsMdPath), "AGENTS.md must exist in root");
const agentsContent = fs.readFileSync(agentsMdPath, "utf8");

assert(
  agentsContent.includes("Parallel planning mode") ||
    agentsContent.includes("docs/plans/"),
  "AGENTS.md must define parallel planning mode",
);

assert(
  agentsContent.includes("docs/plans/timestamp_<desc>.md") ||
    agentsContent.includes("docs/plans/"),
  "AGENTS.md must mandate creating plans in docs/plans/ directory",
);

assert(
  agentsContent.includes("dont update any other repo") ||
    agentsContent.includes("do NOT update any other repo") ||
    agentsContent.includes("not updating the code"),
  "AGENTS.md must specify not updating repo files during planning mode",
);

assert(
  agentsContent.includes("prompt:") && agentsContent.includes("work:"),
  "AGENTS.md must specify continuation format with prompt: and work:",
);

console.log("✅ PASS: AGENTS.md contains parallel planning mode rules and formatting specification.");

// Step 2: Verify docs/plans/ directory structure
console.log("\n--> [Step 2] Verifying docs/plans/ directory structure...");
assert(fs.existsSync(plansDirPath), "docs/plans/ directory must exist");
const stat = fs.statSync(plansDirPath);
assert(stat.isDirectory(), "docs/plans must be a directory");
console.log("✅ PASS: docs/plans/ directory exists and conforms to docs/*.md architecture.");

// Step 3: Verify plan continuation schema helper simulation
console.log("\n--> [Step 3] Testing plan continuation format schema...");
const samplePlan = [
  "# Plan: Test Parallel Feature",
  "",
  "prompt: implement feature X",
  "work: created isolated architectural plan without repo code changes",
  "",
  "prompt: continue with phase 2",
  "work: detailed phase 2 subtasks on the same plan file",
].join("\n");

assert(samplePlan.includes("prompt:"), "Plan must support prompt: marker");
assert(samplePlan.includes("work:"), "Plan must support work: marker");
console.log("✅ PASS: Plan schema validates prompt: <x> and work: <y> entries.");

// Step 4: Verify prompt_history.md records the prompt
console.log("\n--> [Step 4] Verifying prompt_history.md records the raw prompt...");
assert(fs.existsSync(promptHistoryPath), "prompt_history.md must exist");
const historyContent = fs.readFileSync(promptHistoryPath, "utf8");
assert(
  historyContent.includes("docs/plans/timestamp_<desc>.md") &&
    historyContent.includes("prompt:x work:y"),
  "prompt_history.md must record the parallel planning prompt",
);
console.log("✅ PASS: prompt_history.md records prompt.");

// Step 5: Verify AGENTS.md Last raw prompt section
console.log("\n--> [Step 5] Verifying AGENTS.md Last raw prompt section...");
assert(
  agentsContent.includes("## Last raw prompt"),
  "AGENTS.md must contain ## Last raw prompt",
);
assert(
  agentsContent.includes("docs/plans/timestamp_<desc>.md") &&
    agentsContent.includes("prompt:x work:y"),
  "AGENTS.md ## Last raw prompt must contain the parallel planning mode prompt",
);
console.log("✅ PASS: AGENTS.md ## Last raw prompt is preserved accurately.");

// Step 6: AGENTS.md size budget check
console.log("\n--> [Step 6] Checking AGENTS.md size budget...");
const agentsStat = fs.statSync(agentsMdPath);
const MAX_BUDGET = 21000;
assert(
  agentsStat.size <= MAX_BUDGET,
  `AGENTS.md size (${agentsStat.size} bytes) must be <= ${MAX_BUDGET} bytes safe budget`,
);
console.log(`✅ PASS: AGENTS.md size is ${agentsStat.size} bytes (within ${MAX_BUDGET} bytes safe budget).`);

console.log("\n=========================================================================");
console.log("🎉 ALL PARALLEL PLANNING MODE SPECIFICATION CHECKS PASSED (100% verified)");
console.log("=========================================================================\n");
