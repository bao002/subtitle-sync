import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

console.log("====================================================");
console.log("🧪 Starting GitHub Workflows Alignment Test (Subtask 27.1)");
console.log("====================================================");

const rootDir = process.cwd();
const workflowsDir = path.join(rootDir, ".github/workflows");

// 1. Assert ci.yml is NOT present (matches Youtubenet6)
assert(
  !fs.existsSync(path.join(workflowsDir, "ci.yml")),
  "ci.yml must not exist; Youtubenet6 does not include ci.yml and uses integrity.yml & web.yml instead",
);
console.log("✅ PASS: ci.yml is absent, matching Youtubenet6");

// 2. Assert exact set of workflow files
const expectedWorkflows = [
  "deploy-demo.yml",
  "emulation.yml",
  "error-reporting.yml",
  "integrity.yml",
  "release-apk.yml",
  "report-video-flow.yml",
  "update-readme.yml",
  "web.yml",
];
const actualWorkflows = fs.readdirSync(workflowsDir).sort();
assert.deepStrictEqual(
  actualWorkflows,
  expectedWorkflows.sort(),
  `Workflow set must match expected workflows: ${expectedWorkflows.join(", ")}`,
);
console.log(
  `✅ PASS: Workflows directory contains exact Youtubenet6 set: ${actualWorkflows.join(", ")}`,
);

// 3. Assert web.yml deployed URL and synthetic script guard
const webContent = fs.readFileSync(path.join(workflowsDir, "web.yml"), "utf8");
assert(
  webContent.includes(
    'DEPLOYED_APP_URL="https://${{ github.repository_owner }}.github.io/${REPO_NAME}/"',
  ),
  "web.yml must point to repo root on github.io instead of non-existent /app/ subpath",
);
assert(
  !webContent.includes(
    'DEPLOYED_APP_URL="https://${{ github.repository_owner }}.github.io/${REPO_NAME}/app/"',
  ),
  "web.yml must not point to /app/",
);
assert(
  !webContent.includes("run: node scripts/prepare-report.mjs\n"),
  "web.yml must not unconditionally run non-existent scripts/prepare-report.mjs",
);
console.log("✅ PASS: web.yml correctly targets repo root and guards synthetic report scripts");

// 4. Assert emulation.yml continue-on-error
const emulationContent = fs.readFileSync(path.join(workflowsDir, "emulation.yml"), "utf8");
assert(
  emulationContent.includes("continue-on-error: true"),
  "emulation.yml must configure continue-on-error: true on android-emulator-e2e job matching Youtubenet6",
);
console.log("✅ PASS: emulation.yml sets continue-on-error: true on android-emulator-e2e job");

// 5. Assert deploy-demo.yml preserves gh-pages artifacts
const deployDemoContent = fs.readFileSync(path.join(workflowsDir, "deploy-demo.yml"), "utf8");
assert(
  deployDemoContent.includes("keep_files: true"),
  "deploy-demo.yml must specify keep_files: true to preserve emulator screenshot artifacts on gh-pages",
);
assert(
  !deployDemoContent.includes("force_orphan: true"),
  "deploy-demo.yml must not use force_orphan: true which wipes out existing gh-pages history and artifacts",
);
console.log("✅ PASS: deploy-demo.yml preserves existing gh-pages artifacts");

// 6. Assert web demo presents all 6 demo languages for Playwright web E2E tests
const indexRouteContent = fs.readFileSync(path.join(rootDir, "src/routes/index.tsx"), "utf8");
assert(
  indexRouteContent.includes("isAndroid") &&
    (indexRouteContent.includes("LANGS.map((l) => l.code)") ||
      indexRouteContent.includes("list = languageOrder")),
  "src/routes/index.tsx must supply all 6 demo languages on web (!isAndroid) so e2e/web.spec.ts can assert 6 rows",
);
assert(
  indexRouteContent.includes("targetLanguages") && indexRouteContent.includes("favoriteLanguages"),
  "src/routes/index.tsx must scope orderedLangs with favorite and target languages",
);
console.log(
  "✅ PASS: orderedLangs presents 6 demo languages on web demo while preserving favorite scoping on Android",
);

console.log("====================================================");
console.log("📊 WORKFLOW ALIGNMENT TEST: All tests passed!");
console.log("====================================================");
