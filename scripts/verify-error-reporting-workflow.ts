import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert";
import { diagnoseError, buildErrorReport } from "./generate-error-report";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log("=========================================================================");
console.log("🧪 Verifying Error Reporting Workflow & AI Reproduction Fix Engine");
console.log("=========================================================================");

// --- Step 1: Verify Error Diagnostic Heuristics ---
console.log("--> [Step 1] Verifying error diagnosis heuristics and classification...");

// Test lint error classification
const lintDiag = diagnoseError(
  "error prettier/prettier Insert `⏎` in src/routes/index.tsx",
  "",
  "npm run lint",
);
assert.strictEqual(lintDiag.category, "lint", "Should categorize prettier/eslint errors as 'lint'");
assert(
  lintDiag.suggestedFixes.some((f) => f.includes("prettier")),
  "Lint fix should suggest prettier",
);
assert(
  lintDiag.affectedFiles.some((f) => f.includes("src/routes/index.tsx")),
  "Should extract affected file",
);

// Test typecheck error classification
const typeDiag = diagnoseError(
  "error TS2322: Type 'string' is not assignable to type 'number'.",
  "",
  "npx tsc",
);
assert.strictEqual(typeDiag.category, "typecheck", "Should categorize TS errors as 'typecheck'");
assert(
  typeDiag.suggestedFixes.some((f) => f.includes("tsc")),
  "Typecheck fix should suggest tsc check",
);

// Test assertion failure classification
const assertDiag = diagnoseError(
  "AssertionError [ERR_ASSERTION]: Expected true, got false",
  "",
  "npm test",
);
assert.strictEqual(
  assertDiag.category,
  "test_assertion",
  "Should categorize assertion errors as 'test_assertion'",
);

// Test missing module classification
const moduleDiag = diagnoseError(
  "Cannot find module 'lodash' or its corresponding type declarations.",
  "",
  "npm run build",
);
assert.strictEqual(
  moduleDiag.category,
  "missing_module",
  "Should categorize missing module as 'missing_module'",
);
assert(
  moduleDiag.suggestedFixes.some((f) => f.includes("npm install")),
  "Should suggest npm install",
);

// Test port conflict classification
const portDiag = diagnoseError(
  "Error: listen EADDRINUSE: address already in use :::3000",
  "",
  "npm run dev",
);
assert.strictEqual(portDiag.category, "network", "Should categorize EADDRINUSE as 'network'");
assert(
  portDiag.suggestedFixes.some((f) => f.includes("3000")),
  "Should mention port 3000",
);

// Test build failure classification
const buildDiag = diagnoseError(
  "Rollup failed to resolve import 'nonexistent' from 'src/main.tsx'",
  "",
  "npm run build",
);
assert.strictEqual(
  buildDiag.category,
  "build",
  "Should categorize rollup/build failure as 'build'",
);

console.log("✅ PASS: All 6 error categories and diagnostic heuristics validated.");

// --- Step 2: Verify Generated Error Report & AI Prompt Structure ---
console.log("--> [Step 2] Verifying error.log markdown structure and AI prompt formatting...");

const sampleReport = buildErrorReport({
  stepName: "Automated Unit Test Suite",
  command: "npm run test:sample",
  exitCode: 1,
  stderr:
    "AssertionError [ERR_ASSERTION]: expected 200, got 429\n    at verify (src/test.ts:42:10)",
  stdout: "Running test...\nFailed.",
});

// Check mandatory sections
assert(
  sampleReport.includes("# AUTOMATED ERROR REPORT & AI REPRODUCTION FIX PROMPT (error.log)"),
  "Must have main title",
);
assert(sampleReport.includes("## 1. Executive Summary"), "Must have Executive Summary");
assert(sampleReport.includes("## 2. Environment Telemetry"), "Must have Environment Telemetry");
assert(
  sampleReport.includes("## 3. Minimal Reproduction Steps"),
  "Must have Minimal Reproduction Steps",
);
assert(sampleReport.includes("npm run test:sample"), "Must include exact reproduction command");
assert(
  sampleReport.includes("## 4. Suggested Fix & Diagnostic Recommendations"),
  "Must have Suggested Fixes",
);
assert(sampleReport.includes("## 5. Failure Log & Stack Trace"), "Must have Failure Log");
assert(
  sampleReport.includes(
    "# AI PROMPT (Copy everything below directly into your AI Assistant prompt)",
  ),
  "Must include AI Prompt block",
);
assert(sampleReport.includes("### How to Reproduce"), "AI Prompt must have How to Reproduce");
assert(
  sampleReport.includes("### Instructions for AI Assistant:"),
  "AI Prompt must include actionable agent instructions",
);

console.log("✅ PASS: Error report format and AI reproduction fix prompt validated.");

// --- Step 3: Verify GitHub Actions Workflow (.github/workflows/error-reporting.yml) ---
console.log("--> [Step 3] Verifying .github/workflows/error-reporting.yml schema and steps...");

const workflowPath = path.resolve(__dirname, "../.github/workflows/error-reporting.yml");
assert(fs.existsSync(workflowPath), ".github/workflows/error-reporting.yml must exist");
const workflowContent = fs.readFileSync(workflowPath, "utf-8");

// Triggers
assert(workflowContent.includes("workflow_run:"), "Workflow must trigger on workflow_run");
assert(workflowContent.includes("workflow_dispatch:"), "Workflow must allow manual dispatch");
assert(workflowContent.includes("push:"), "Workflow must trigger on push");
assert(workflowContent.includes("pull_request:"), "Workflow must trigger on pull_request");

// Key steps
assert(
  workflowContent.includes("scripts/generate-error-report.ts"),
  "Workflow must invoke generate-error-report.ts",
);
assert(
  workflowContent.includes("GITHUB_STEP_SUMMARY"),
  "Workflow must write to GITHUB_STEP_SUMMARY",
);
assert(
  workflowContent.includes("upload-artifact@v4"),
  "Workflow must upload error.log via upload-artifact@v4",
);
assert(workflowContent.includes("name: error-log"), "Artifact name must be error-log");
assert(workflowContent.includes("path: error.log"), "Artifact path must point to error.log");

console.log("✅ PASS: GitHub Actions error reporting workflow configuration validated.");

// --- Step 4: Verify package.json Scripts & Documentation Registry ---
console.log("--> [Step 4] Verifying package.json scripts and documentation...");

const pkgPath = path.resolve(__dirname, "../package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
assert(pkg.scripts["report:error"], "package.json must contain 'report:error'");
assert(pkg.scripts["test:error-reporting"], "package.json must contain 'test:error-reporting'");

// Check documentation in ACTIONS.md and DEBUG.md
const actionsDoc = fs.readFileSync(
  path.resolve(__dirname, "../docs/operations/ACTIONS.md"),
  "utf-8",
);
assert(
  actionsDoc.includes("error-reporting.yml"),
  "docs/operations/ACTIONS.md must document error-reporting.yml",
);
assert(actionsDoc.includes("error.log"), "docs/operations/ACTIONS.md must document error.log");

const debugDoc = fs.readFileSync(path.resolve(__dirname, "../docs/operations/DEBUG.md"), "utf-8");
assert(
  debugDoc.includes("error-reporting.yml") || debugDoc.includes("generate-error-report.ts"),
  "docs/operations/DEBUG.md must document error reporting",
);
assert(debugDoc.includes("error.log"), "docs/operations/DEBUG.md must document error.log");

const filesDoc = fs.readFileSync(path.resolve(__dirname, "../docs/files.md"), "utf-8");
assert(
  filesDoc.includes("generate-error-report.ts"),
  "docs/files.md must list generate-error-report.ts",
);
assert(
  filesDoc.includes("verify-error-reporting-workflow.ts"),
  "docs/files.md must list verify-error-reporting-workflow.ts",
);

console.log("✅ PASS: npm scripts, documentation, and file registry validated.");

console.log("=========================================================================");
console.log("🎉 ALL ERROR REPORTING WORKFLOW & AI FIX ENGINE CHECKS PASSED 100%!");
console.log("=========================================================================");
