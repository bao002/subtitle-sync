import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("====================================================");
console.log("🧪 Starting Storybook Setup & GitHub Pages Verification");
console.log("====================================================");

const rootDir = process.cwd();

// 1. Verify Storybook configuration files
const storybookMainPath = path.join(rootDir, ".storybook/main.ts");
const storybookPreviewPath = path.join(rootDir, ".storybook/preview.ts");
assert(fs.existsSync(storybookMainPath), ".storybook/main.ts must exist");
assert(fs.existsSync(storybookPreviewPath), ".storybook/preview.ts must exist");

const mainContent = fs.readFileSync(storybookMainPath, "utf8");
assert(
  mainContent.includes("@storybook/react-vite"),
  ".storybook/main.ts must configure @storybook/react-vite framework"
);
assert(
  mainContent.includes("stories"),
  ".storybook/main.ts must configure stories globs"
);
console.log("✅ PASS: Storybook config (.storybook/main.ts, preview.ts) valid");

// 2. Verify package.json scripts and dependencies
const packageJsonPath = path.join(rootDir, "package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
assert(packageJson.scripts["storybook"], "package.json must contain 'storybook' script");
assert(
  packageJson.scripts["build-storybook"] || packageJson.scripts["build:storybook"],
  "package.json must contain storybook build script"
);
assert(
  packageJson.devDependencies?.["@storybook/react-vite"] ||
    packageJson.dependencies?.["@storybook/react-vite"],
  "package.json must contain @storybook/react-vite"
);
assert(
  packageJson.devDependencies?.["storybook"] ||
    packageJson.dependencies?.["storybook"],
  "package.json must contain storybook"
);
console.log("✅ PASS: package.json storybook scripts and dependencies configured");

// 3. Verify GitHub Pages workflow deploys Storybook
const deployWorkflowPath = path.join(rootDir, ".github/workflows/deploy-demo.yml");
assert(fs.existsSync(deployWorkflowPath), ".github/workflows/deploy-demo.yml must exist");
const deployWorkflowContent = fs.readFileSync(deployWorkflowPath, "utf8");
assert(
  deployWorkflowContent.includes("build-storybook") ||
    deployWorkflowContent.includes("build:storybook"),
  "deploy-demo.yml must build Storybook during CI"
);
assert(
  deployWorkflowContent.includes("dist/storybook"),
  "deploy-demo.yml must stage Storybook to dist/storybook for GitHub Pages deployment"
);
console.log("✅ PASS: deploy-demo.yml workflow stages and publishes Storybook to GitHub Pages");

// 4. Verify static storybook distribution
const publicStorybookIndex = path.join(rootDir, "public/storybook/index.html");
assert(fs.existsSync(publicStorybookIndex), "public/storybook/index.html must exist");
const htmlContent = fs.readFileSync(publicStorybookIndex, "utf8");
assert(
  htmlContent.includes("Storybook") || htmlContent.includes("iframe"),
  "public/storybook/index.html must be valid Storybook shell"
);
console.log("✅ PASS: Static Storybook distribution in public/storybook/ verified");

// 5. Verify isolated clean-room Storybook workbench route
const storybookRoutePath = path.join(rootDir, "src/routes/storybook.tsx");
const storybookWorkbenchPath = path.join(rootDir, "src/storybook/StorybookWorkbench.tsx");
const routeTreePath = path.join(rootDir, "src/routeTree.gen.ts");
assert(fs.existsSync(storybookRoutePath), "src/routes/storybook.tsx must exist");
assert(fs.existsSync(storybookWorkbenchPath), "src/storybook/StorybookWorkbench.tsx must exist");
assert(fs.existsSync(routeTreePath), "src/routeTree.gen.ts must exist");

const routeTreeContent = fs.readFileSync(routeTreePath, "utf8");
assert(
  routeTreeContent.includes("/storybook"),
  "src/routeTree.gen.ts must register /storybook route"
);

const workbenchContent = fs.readFileSync(storybookWorkbenchPath, "utf8");
assert(
  workbenchContent.includes("data-testid=\"storybook-workbench\""),
  "StorybookWorkbench must render storybook workbench test id"
);
assert(
  workbenchContent.includes("TtsServiceSettingsPanel"),
  "StorybookWorkbench must import and isolate TtsServiceSettingsPanel"
);
console.log("✅ PASS: Clean-room Storybook workbench route /storybook verified");

// 6. Verify top header links to Storybook
const indexRoutePath = path.join(rootDir, "src/routes/index.tsx");
const indexContent = fs.readFileSync(indexRoutePath, "utf8");
assert(
  indexContent.includes("data-testid=\"header-storybook-button\""),
  "Header must include Storybook link button"
);
assert(
  indexContent.includes("href=\"/storybook\""),
  "Header Storybook button must link to /storybook"
);
console.log("✅ PASS: Header navigation button links directly to Storybook workbench");

console.log("====================================================");
console.log("🎉 Storybook Setup & GitHub Pages Verification PASSED!");
console.log("====================================================");
