/**
 * Automated Verification Script: Task 352
 *
 * Verifies:
 * 1. Automatic GitHub Action creation of README.md from scratch via scripts/update-readme.mjs.
 * 2. Generated README satisfies basic minimalist criteria (<= 15 lines, < 1000 bytes, link to docs, demo, report).
 * 3. Fork and custom owner/repo parameters are correctly embedded when creating README from scratch.
 * 4. .github/workflows/update-readme.yml ensures README exists prior to test scans, stages README via git add,
 *    and detects changes via git diff --cached so newly created files are reliably committed and pushed.
 */

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const rootDir = process.cwd();
const readmePath = path.resolve(rootDir, "README.md");
const updateReadmeScript = path.resolve(rootDir, "scripts/update-readme.mjs");
const workflowPath = path.resolve(rootDir, ".github/workflows/update-readme.yml");

async function runVerification() {
  console.log("==================================================================");
  console.log("🧪 Verifying Task 352: Ensure GitHub Action Creation of README");
  console.log("==================================================================");

  // 1. Audit .github/workflows/update-readme.yml
  console.log("--> [Step 1] Auditing .github/workflows/update-readme.yml...");
  assert.ok(fs.existsSync(workflowPath), ".github/workflows/update-readme.yml must exist");
  const workflowContent = fs.readFileSync(workflowPath, "utf-8");

  assert.ok(
    workflowContent.includes("if [ ! -f README.md ]; then") ||
      workflowContent.includes("node scripts/update-readme.mjs"),
    "Workflow must ensure README.md is created before test scans",
  );

  assert.ok(
    workflowContent.includes("git add README.md"),
    "Workflow must stage README.md with 'git add README.md' before diff check",
  );

  assert.ok(
    workflowContent.includes("git diff --cached --quiet") ||
      workflowContent.includes("git diff --cached"),
    "Workflow must check git diff --cached to detect newly created untracked README files",
  );

  assert.ok(
    workflowContent.includes("git commit -m") && workflowContent.includes("git push origin"),
    "Workflow must commit and push when README is created or updated",
  );
  console.log("✅ Step 1: update-readme.yml properly handles creation, staging, and committing of README.md");

  // 2. Test README creation from scratch
  console.log("--> [Step 2] Testing README creation from scratch via update-readme.mjs...");
  const backupReadme = fs.existsSync(readmePath) ? fs.readFileSync(readmePath, "utf-8") : null;

  try {
    // Delete README.md if it exists
    if (fs.existsSync(readmePath)) {
      fs.unlinkSync(readmePath);
    }
    assert.strictEqual(fs.existsSync(readmePath), false, "README.md should be absent before creation test");

    // Execute scripts/update-readme.mjs
    execSync(`node "${updateReadmeScript}" mostuf2556 subtitle-sync`, {
      cwd: rootDir,
      stdio: "pipe",
    });

    assert.ok(fs.existsSync(readmePath), "update-readme.mjs must create README.md if absent");
    const createdContent = fs.readFileSync(readmePath, "utf-8");
    const lines = createdContent.split("\n");

    // Must be basic minimalist README
    assert.ok(lines.length <= 15, `Created README must be <= 15 lines, got ${lines.length}`);
    assert.ok(createdContent.length < 1000, `Created README must be < 1000 bytes, got ${createdContent.length}`);
    assert.ok(createdContent.includes("[Docs](./docs/)"), "Created README must link to docs");
    assert.ok(
      createdContent.includes("https://mostuf2556.github.io/subtitle-sync/"),
      "Created README must link to demo website on GitHub Pages",
    );
    assert.ok(
      createdContent.includes("https://mostuf2556.github.io/subtitle-sync/android-emulator-report.html"),
      "Created README must link to Android emulator report",
    );
    console.log("✅ Step 2: update-readme.mjs creates compliant basic minimalist README.md from scratch");

    // 3. Test Fork-specific creation
    console.log("--> [Step 3] Testing creation with custom fork repository identity...");
    fs.unlinkSync(readmePath);
    execSync(`node "${updateReadmeScript}" test-fork-user forked-subtitle-app`, {
      cwd: rootDir,
      stdio: "pipe",
      env: {
        ...process.env,
        GITHUB_REPOSITORY: "test-fork-user/forked-subtitle-app",
        GITHUB_REPOSITORY_OWNER: "test-fork-user",
      },
    });

    assert.ok(fs.existsSync(readmePath), "Must create README for fork");
    const forkReadmeContent = fs.readFileSync(readmePath, "utf-8");
    assert.ok(
      forkReadmeContent.includes("https://test-fork-user.github.io/forked-subtitle-app/"),
      "Fork README must contain fork user's demo website link",
    );
    assert.ok(
      forkReadmeContent.includes("https://test-fork-user.github.io/forked-subtitle-app/android-emulator-report.html"),
      "Fork README must contain fork user's report link",
    );
    console.log("✅ Step 3: Fork identity correctly embedded in newly generated README.md");

  } finally {
    // Restore original or recreate standard README
    if (backupReadme !== null) {
      fs.writeFileSync(readmePath, backupReadme, "utf-8");
    } else {
      execSync(`node "${updateReadmeScript}" mostuf2556 subtitle-sync`, {
        cwd: rootDir,
        stdio: "pipe",
      });
    }
  }

  console.log("==================================================================");
  console.log("🎉 All checks for Task 352 passed successfully!");
  console.log("==================================================================");
}

runVerification().catch((err) => {
  console.error("❌ Verification failed:", err);
  process.exit(1);
});
