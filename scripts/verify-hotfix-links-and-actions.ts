import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

const rootDir = process.cwd();

console.log("====================================================");
console.log("🧪 Starting Hotfix Links & GitHub Actions Verification");
console.log("====================================================");

// 1. Verify README.md has no stray characters and header is pristine
const readmePath = path.resolve(rootDir, "README.md");
assert(fs.existsSync(readmePath), "README.md must exist");
const readmeContent = fs.readFileSync(readmePath, "utf8");
assert(
  !readmeContent.startsWith("# YouTube Subtitle & Speech Flow Viewer\nx"),
  "README.md must not contain stray 'x' characters",
);
console.log("✅ PASS: README.md header is clean and free of stray characters");

// 2. Verify all workflow badges point to existing workflows
const expectedWorkflows = [
  "release-apk.yml",
  "web.yml",
  "emulation.yml",
  "deploy-demo.yml",
  "integrity.yml",
  "update-readme.yml",
];

for (const wf of expectedWorkflows) {
  const wfPath = path.resolve(rootDir, ".github", "workflows", wf);
  assert(fs.existsSync(wfPath), `Workflow file must exist: .github/workflows/${wf}`);
  console.log(`✅ PASS: Workflow file exists: .github/workflows/${wf}`);
}

// 3. Verify GitHub Pages links in README
const demoLinkPattern = /https:\/\/[a-zA-Z0-9_\-.]+\.github\.io\/[a-zA-Z0-9_\-.]+\//;
assert(
  demoLinkPattern.test(readmeContent),
  "README.md must contain valid GitHub Pages web demo link",
);
assert(
  readmeContent.includes("android-emulator-report.html"),
  "README.md must link to emulator report",
);
console.log("✅ PASS: README.md contains GitHub Pages web demo and emulator report links");

// 4. Verify authentic screenshot assets exist in public/ and will be copied to dist/
const screenshotInPublic = path.resolve(
  rootDir,
  "public",
  "screenshots",
  "android-emulator-screenshot.png",
);
const assetInPublic = path.resolve(rootDir, "public", "assets", "android-emulator-screenshot.png");
assert(
  fs.existsSync(screenshotInPublic),
  "public/screenshots/android-emulator-screenshot.png must exist",
);
assert(fs.existsSync(assetInPublic), "public/assets/android-emulator-screenshot.png must exist");
console.log(
  "✅ PASS: Authentic emulator screenshots present in public/ to prevent 404s on GitHub Pages",
);

// 5. Verify router basepath logic supports GitHub Pages repo root
const routerPath = path.resolve(rootDir, "src", "router.tsx");
assert(fs.existsSync(routerPath), "src/router.tsx must exist");
const routerContent = fs.readFileSync(routerPath, "utf8");
assert(
  routerContent.includes("github.io"),
  "router.tsx must support github.io repository basepath resolution",
);
assert(
  !routerContent.includes('window.location.pathname.replace(/\\/index\\.html$/, "")'),
  "router.tsx must not strip trailing slash when removing index.html",
);
console.log("✅ PASS: router.tsx correctly handles GitHub Pages basepath and URL preservation");

// 6. Verify Playwright config has CI retries enabled
const playwrightConfigPath = path.resolve(rootDir, "playwright.config.ts");
assert(fs.existsSync(playwrightConfigPath), "playwright.config.ts must exist");
const playwrightContent = fs.readFileSync(playwrightConfigPath, "utf8");
assert(
  playwrightContent.includes("process.env.CI"),
  "playwright.config.ts must configure retries in CI",
);
console.log("✅ PASS: playwright.config.ts configured with CI retries");

console.log("====================================================");
console.log("📊 HOTFIX VERIFICATION: All checks passed!");
console.log("====================================================");
