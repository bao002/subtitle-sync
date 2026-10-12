import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("====================================================");
console.log("🧪 Starting Task Management Backlog & Done Migration Verification");
console.log("====================================================");

const rootDir = process.cwd();

// 1. Verify AGENTS.md mandates moving completed tasks from tasks.md to done.md
console.log("1. Verifying AGENTS.md task migration protocol...");
const agentsPath = path.join(rootDir, "AGENTS.md");
assert(fs.existsSync(agentsPath), "AGENTS.md must exist in root");
const agentsContent = fs.readFileSync(agentsPath, "utf8");

assert(
  agentsContent.includes("Mandatory migration to `docs/done.md`"),
  "AGENTS.md must mandate moving completed tasks to docs/done.md",
);
assert(
  agentsContent.includes("Move completed tasks and sub-tasks completely out of `current-sub-task.md`, `docs/todo.md`, and `docs/tasks.md` directly into `docs/done.md`"),
  "AGENTS.md must mandate moving completed tasks completely out of tasks.md into done.md",
);
assert(
  agentsContent.includes("`docs/tasks.md` is strictly an active backlog containing ONLY pending, active, and upcoming tasks"),
  "AGENTS.md must specify that docs/tasks.md is strictly the active backlog of pending/upcoming tasks",
);
console.log("✅ PASS: AGENTS.md correctly establishes backlog migration protocol");

// 2. Verify docs/tokens.md specifies tasks.md active backlog role and done.md migration
console.log("2. Verifying docs/tokens.md specifications...");
const docsTokensPath = path.join(rootDir, "docs/tokens.md");
assert(fs.existsSync(docsTokensPath), "docs/tokens.md must exist");
const tokensContent = fs.readFileSync(docsTokensPath, "utf8");

assert(
  tokensContent.includes("Master backlog of active, pending, and upcoming numbered tasks"),
  "docs/tokens.md table must define tasks.md as master backlog of active/pending/upcoming tasks",
);
assert(
  tokensContent.includes("Move the completed subtask/task completely out of `current-sub-task.md`, `docs/todo.md`, and `docs/tasks.md` into `docs/done.md`"),
  "docs/tokens.md must mandate moving completed items completely out of tasks.md into done.md",
);
assert(
  tokensContent.includes("keep `docs/tasks.md` strictly as the active backlog of pending and upcoming items"),
  "docs/tokens.md must specify keeping tasks.md clean as active backlog",
);
console.log("✅ PASS: docs/tokens.md correctly codifies lean backlog and archive architecture");

// 3. Verify docs/tasks.md and docs/done.md file presence and hygiene
console.log("3. Verifying docs/tasks.md and docs/done.md presence...");
const tasksPath = path.join(rootDir, "docs/tasks.md");
const donePath = path.join(rootDir, "docs/done.md");
assert(fs.existsSync(tasksPath), "docs/tasks.md must exist");
assert(fs.existsSync(donePath), "docs/done.md must exist");

const doneContent = fs.readFileSync(donePath, "utf8");
assert(doneContent.startsWith("# Done tasks"), "docs/done.md must begin with '# Done tasks'");

console.log("✅ PASS: docs/tasks.md and docs/done.md files are valid");

// 4. Verify that historical completed tasks are archived in done.md and removed from tasks.md
console.log("4. Verifying tasks.md does not retain archived historical tasks...");
const tasksContent = fs.readFileSync(tasksPath, "utf8");
const sampleCompletedTasks = ["Task 53:", "Task 60:", "Task 70:", "Task 86:", "Task 87:", "Task 88:"];

for (const task of sampleCompletedTasks) {
  assert(
    doneContent.includes(task),
    `docs/done.md must contain archived ${task}`,
  );
  assert(
    !tasksContent.includes(`## ${task}`),
    `docs/tasks.md must NOT retain completed ${task} (must be migrated to done.md)`,
  );
}
console.log("✅ PASS: Historical completed tasks are cleanly archived in docs/done.md and omitted from active backlog docs/tasks.md");

console.log("====================================================");
console.log("🎉 All Task Management Migration Tests PASSED Successfully!");
console.log("====================================================");
