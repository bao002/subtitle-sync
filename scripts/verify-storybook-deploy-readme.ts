import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
import { execSync } from "node:child_process";

console.log("=========================================================================");
console.log("🧪 Verifying Storybook GitHub Actions Deployment & README Link (Task 274)");
console.log("=========================================================================");

const rootDir = process.cwd();

// 1. Verify Storybook deployment configuration in deploy-demo.yml
console.log("\n📦 Check 1: Storybook Deployment in deploy-demo.yml");
const deployWorkflowPath = path.resolve(rootDir, ".github/workflows/deploy-demo.yml");
assert(fs.existsSync(deployWorkflowPath), ".github/workflows/deploy-demo.yml must exist");
const deployWorkflow = fs.readFileSync(deployWorkflowPath, "utf-8");

assert(
  deployWorkflow.includes("build-storybook"),
  "deploy-demo.yml must execute npm run build-storybook",
);
assert(
  deployWorkflow.includes("dist/storybook"),
  "deploy-demo.yml must stage Storybook build into dist/storybook",
);
assert(
  deployWorkflow.includes("peaceiris/actions-gh-pages@v4") || deployWorkflow.includes("actions/deploy-pages@v4"),
  "deploy-demo.yml must deploy dist directory containing Storybook to GitHub Pages",
);
console.log("✅ PASS: deploy-demo.yml compiles, stages, and deploys Storybook to GitHub Pages.");

// 2. Verify Storybook link exists in README.md
console.log("\n📖 Check 2: Storybook Link in README.md");
const readmePath = path.resolve(rootDir, "README.md");
assert(fs.existsSync(readmePath), "README.md must exist in root");
const readmeContent = fs.readFileSync(readmePath, "utf-8");

const storybookLinkRegex = /\[([^\]]*Storybook[^\]]*)\]\((https:\/\/[a-zA-Z0-9_\-.]+\.github\.io\/[a-zA-Z0-9_\-.]+\/storybook\/?)\)/i;
const match = readmeContent.match(storybookLinkRegex);
assert(match, "README.md must contain a link to Storybook hosted on GitHub Pages");
console.log(`✅ PASS: Storybook link verified in README.md: "${match[0]}"`);

// 3. Verify Storybook synchronization in scripts/update-readme.mjs
console.log("\n🔄 Check 3: scripts/update-readme.mjs Storybook Synchronization");
const updateScriptPath = path.resolve(rootDir, "scripts/update-readme.mjs");
assert(fs.existsSync(updateScriptPath), "scripts/update-readme.mjs must exist");
const updateScript = fs.readFileSync(updateScriptPath, "utf-8");

assert(
  updateScript.includes("storybook"),
  "scripts/update-readme.mjs must contain logic to maintain and update Storybook link",
);

// Test fork update with custom owner and repo
const originalReadme = fs.readFileSync(readmePath, "utf-8");
try {
  execSync("node scripts/update-readme.mjs acme-user my-repo", {
    cwd: rootDir,
    stdio: "pipe",
  });
  const updatedForkReadme = fs.readFileSync(readmePath, "utf-8");
  assert(
    updatedForkReadme.includes("https://acme-user.github.io/my-repo/storybook/"),
    "scripts/update-readme.mjs must update the Storybook URL to match fork owner and repo",
  );
  console.log("✅ PASS: scripts/update-readme.mjs correctly updates Storybook link for forks.");
} finally {
  // Restore original README content
  fs.writeFileSync(readmePath, originalReadme, "utf-8");
}

// 4. Verify Storybook build artifacts exist in public/storybook/
console.log("\n📚 Check 4: Storybook Build Artifacts");
const storybookIndexPath = path.resolve(rootDir, "public/storybook/index.html");
assert(fs.existsSync(storybookIndexPath), "public/storybook/index.html must exist");
const storybookIndexContent = fs.readFileSync(storybookIndexPath, "utf-8");
assert(
  storybookIndexContent.includes("Storybook") || storybookIndexContent.includes("storybook"),
  "public/storybook/index.html must be a valid Storybook application build",
);
console.log("✅ PASS: Storybook production build is generated and valid in public/storybook/.");

// 5. Verify App Version consistency (2.0.74)
console.log("\n🏷️ Check 5: App Version Consistency (2.0.74)");
const pkg = JSON.parse(fs.readFileSync(path.resolve(rootDir, "package.json"), "utf-8"));
assert.strictEqual(pkg.version, "2.0.74", "package.json must be version 2.0.74");
console.log("✅ PASS: App version 2.0.74 verified.");

console.log("\n=========================================================================");
console.log("🎉 ALL STORYBOOK GITHUB ACTIONS DEPLOYMENT & README LINK CHECKS PASSED!");
console.log("=========================================================================");
