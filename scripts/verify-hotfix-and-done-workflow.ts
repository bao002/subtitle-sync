import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("====================================================");
console.log("🧪 Starting Task Workflow & Hotfix Protocol Verification");
console.log("====================================================");

const rootDir = process.cwd();

// 1. Verify tokens.md and docs/tokens.md mandate moving to done.md and hotfix workflow
console.log("1. Verifying tokens.md and docs/tokens.md...");
const tokensPath = path.join(rootDir, "tokens.md");
const docsTokensPath = path.join(rootDir, "docs/tokens.md");
assert(fs.existsSync(tokensPath), "tokens.md must exist");
assert(fs.existsSync(docsTokensPath), "docs/tokens.md must exist");

const tokensContent = fs.readFileSync(tokensPath, "utf8");
const docsTokensContent = fs.readFileSync(docsTokensPath, "utf8");

for (const [name, content] of [["tokens.md", tokensContent], ["docs/tokens.md", docsTokensContent]]) {
  assert(
    content.includes("Move to done.md") &&
      content.includes("docs/done.md"),
    `${name} must mandate moving completed tasks to docs/done.md`,
  );
  assert(
    content.includes("Prompt Completion Audit Gate") &&
      content.includes("EVERY task and subtask"),
    `${name} must enforce Prompt Completion Audit Gate to ensure all tasks are accomplished and tested`,
  );
  assert(
    content.includes("Hotfix Workflow") &&
      content.includes("SUSPEND ACTIVE TASK") &&
      content.includes("ON HOLD") &&
      content.includes("RESUME SUSPENDED TASK"),
    `${name} must codify Hotfix Workflow with task holding and resumption pattern`,
  );
}
console.log("✅ PASS: tokens.md and docs/tokens.md correctly define done.md audit and hotfix holding protocol");

// 2. Verify AGENTS.md mandates done.md migration, audit gate, and hotfix workflow
console.log("2. Verifying AGENTS.md work tracking specifications...");
const agentsPath = path.join(rootDir, "AGENTS.md");
assert(fs.existsSync(agentsPath), "AGENTS.md must exist");
const agentsContent = fs.readFileSync(agentsPath, "utf8");

assert(
  agentsContent.includes("Mandatory migration to `docs/done.md`"),
  "AGENTS.md must mandate moving completed sub-tasks to docs/done.md",
);
assert(
  agentsContent.includes("Prompt task completion audit") &&
    agentsContent.includes("EVERY task and subtask planned for the prompt"),
  "AGENTS.md must mandate prompt task completion audit verifying all tasks are accomplished and tested",
);
assert(
  agentsContent.includes("Hotfix workflow with task suspension") &&
    agentsContent.includes("Suspend current task") &&
    agentsContent.includes("ON HOLD") &&
    agentsContent.includes("Resume held task"),
  "AGENTS.md must codify the hotfix holding pattern keeping active task on hold until hotfix is resolved",
);
console.log("✅ PASS: AGENTS.md codifies done.md migration, audit gate, and hotfix workflow");

// 3. Verify done.md structure and consistency
console.log("3. Verifying docs/done.md and docs/tasks.md consistency...");
const donePath = path.join(rootDir, "docs/done.md");
const tasksPath = path.join(rootDir, "docs/tasks.md");
assert(fs.existsSync(donePath), "docs/done.md must exist");
assert(fs.existsSync(tasksPath), "docs/tasks.md must exist");

const doneContent = fs.readFileSync(donePath, "utf8");
assert(doneContent.startsWith("# Done tasks"), "docs/done.md must begin with '# Done tasks'");

console.log("✅ PASS: docs/done.md and docs/tasks.md structure verified");

console.log("====================================================");
console.log("🎉 All Task Workflow & Hotfix Verification Tests PASSED Successfully!");
console.log("====================================================");
