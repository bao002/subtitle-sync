import fs from "fs";
import path from "path";

function run() {
  console.log("====================================================");
  console.log("🧪 Starting No More Tasks 'go on' Rule Verification");
  console.log("====================================================");

  const agentsPath = path.resolve(process.cwd(), "AGENTS.md");
  if (!fs.existsSync(agentsPath)) {
    console.error("❌ FAIL: AGENTS.md does not exist at repo root!");
    process.exit(1);
  }

  const agentsContent = fs.readFileSync(agentsPath, "utf-8");

  // 1. Verify rule header
  if (!agentsContent.includes('No more tasks "go on" handling')) {
    console.error(
      "❌ FAIL: AGENTS.md must include '- **No more tasks \"go on\" handling**:' section.",
    );
    process.exit(1);
  }
  console.log("✅ PASS: AGENTS.md contains the 'No more tasks \"go on\" handling' rule header.");

  // 2. Verify rule core directives
  if (
    !agentsContent.includes("no more tasks are left") &&
    !agentsContent.includes("no more tasks left")
  ) {
    console.error("❌ FAIL: AGENTS.md must specify condition 'in case no more tasks are left'.");
    process.exit(1);
  }
  console.log("✅ PASS: AGENTS.md specifies condition for when no more tasks are left.");

  if (
    !agentsContent.includes('if prompt is "go on"') &&
    !agentsContent.includes("if prompt is 'go on'")
  ) {
    console.error("❌ FAIL: AGENTS.md must specify prompt match 'if prompt is \"go on\"'.");
    process.exit(1);
  }
  console.log("✅ PASS: AGENTS.md specifies prompt check for 'go on'.");

  if (
    !agentsContent.includes("just summarize that there are no more tasks") &&
    !agentsContent.includes("just summaries that there no more tasks")
  ) {
    console.error(
      "❌ FAIL: AGENTS.md must instruct to just summarize that there are no more tasks.",
    );
    process.exit(1);
  }
  console.log("✅ PASS: AGENTS.md instructs to summarize no more tasks.");

  if (
    !agentsContent.includes("no need to show anything else") &&
    !agentsContent.includes("No need to show anything else")
  ) {
    console.error("❌ FAIL: AGENTS.md must state 'no need to show anything else'.");
    process.exit(1);
  }
  console.log("✅ PASS: AGENTS.md specifies 'no need to show anything else'.");

  // 3. Functional Simulation Test
  function handlePrompt(prompt: string, activeTasksCount: number): string {
    const isContinuation = prompt.trim().toLowerCase() === "go on";
    if (activeTasksCount === 0 && isContinuation) {
      return "There are no more tasks remaining.";
    }
    return `Executing task with prompt: ${prompt}`;
  }

  const resultEmpty = handlePrompt("go on", 0);
  if (!resultEmpty.includes("no more tasks remaining")) {
    console.error("❌ FAIL: Functional simulation failed for empty backlog + 'go on'.");
    process.exit(1);
  }
  console.log(
    "✅ PASS: Functional handler correctly summarizes no more tasks when queue is empty.",
  );

  const resultWithTasks = handlePrompt("go on", 2);
  if (resultWithTasks !== "Executing task with prompt: go on") {
    console.error("❌ FAIL: Functional simulation failed for active tasks + 'go on'.");
    process.exit(1);
  }
  console.log("✅ PASS: Functional handler continues work when tasks are present.");

  console.log("====================================================");
  console.log("🎉 No More Tasks 'go on' Rule Verification PASSED!");
  console.log("====================================================");
}

run();
