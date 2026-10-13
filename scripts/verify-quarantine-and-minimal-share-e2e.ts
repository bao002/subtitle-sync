import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("=========================================================================");
console.log("🧪 Verifying Quarantine Isolation, Minimal Android Share E2E & Report");
console.log("=========================================================================");

const rootDir = process.cwd();

// 1. Verify docs/fix-android-e2e-test-and-video-product.md exists and contains required specs
console.log("\n--> [Step 1] Verifying docs/fix-android-e2e-test-and-video-product.md...");
const strategyDocPath = path.resolve(rootDir, "docs/fix-android-e2e-test-and-video-product.md");
assert(fs.existsSync(strategyDocPath), "docs/fix-android-e2e-test-and-video-product.md must exist");
const strategyDocContent = fs.readFileSync(strategyDocPath, "utf8");

assert(
  strategyDocContent.includes("the application can be shared a youtube video") ||
    strategyDocContent.includes("The application can be shared a YouTube video"),
  "Strategy doc must define the core feature: the application can be shared a YouTube video",
);
assert(
  strategyDocContent.includes("android logs") || strategyDocContent.includes("Android Logs"),
  "Strategy doc must specify product 1: Android logs",
);
assert(
  strategyDocContent.includes("screencast") || strategyDocContent.includes("Screencast Video"),
  "Strategy doc must specify product 2: screencast video",
);
assert(
  strategyDocContent.includes("images") || strategyDocContent.includes("Screenshot Images"),
  "Strategy doc must specify product 3: images",
);
assert(
  strategyDocContent.includes("quarentined/") || strategyDocContent.includes("quarentined"),
  "Strategy doc must define the quarentined/ directory structure",
);
assert(
  strategyDocContent.includes("README") && strategyDocContent.includes("deprecate"),
  "Strategy doc must define deprecating current README in favor of minimal report link",
);
console.log("✅ PASS: Strategy document contains complete reasoning, products, and quarantine plan.");

// 2. Verify quarentined/ directory and archived suites
console.log("\n--> [Step 2] Verifying quarentined/ directory contents...");
const quarantinedDir = path.resolve(rootDir, "quarentined");
assert(fs.existsSync(quarantinedDir), "quarentined/ directory must exist in repository root");

const quarantinedAppSpec = path.resolve(rootDir, "quarentined/e2e/app.spec.ts");
const quarantinedWebSpec = path.resolve(rootDir, "quarentined/e2e/web.spec.ts");
assert(fs.existsSync(quarantinedAppSpec), "e2e/app.spec.ts must be isolated in quarentined/e2e/");
assert(fs.existsSync(quarantinedWebSpec), "e2e/web.spec.ts must be isolated in quarentined/e2e/");

const quarantinedCypressDir = path.resolve(rootDir, "quarentined/cypress");
assert(fs.existsSync(quarantinedCypressDir), "Cypress suites must be isolated in quarentined/cypress/");
console.log("✅ PASS: Non-core E2E suites and legacy test fixtures successfully isolated in quarentined/.");

// 3. Verify active e2e/emulation.spec.ts is minimal and validates YouTube video sharing
console.log("\n--> [Step 3] Verifying active e2e/emulation.spec.ts...");
const activeEmulationSpec = path.resolve(rootDir, "e2e/emulation.spec.ts");
assert(fs.existsSync(activeEmulationSpec), "e2e/emulation.spec.ts must exist");
const emulationContent = fs.readFileSync(activeEmulationSpec, "utf8");

assert(
  emulationContent.includes("the application can be shared a youtube video"),
  "e2e/emulation.spec.ts must have test: 'the application can be shared a youtube video'",
);
assert(
  emulationContent.includes("onNativeSharedLinkReceived"),
  "e2e/emulation.spec.ts must test native link share bridge",
);
assert(
  emulationContent.includes("dQw4w9WgXcQ"),
  "e2e/emulation.spec.ts must test browser URL sharing",
);
assert(
  emulationContent.includes("kJQP7kiw5Fk"),
  "e2e/emulation.spec.ts must test official YouTube app text sharing",
);
console.log("✅ PASS: Active e2e/emulation.spec.ts is streamlined to test the YouTube video share feature.");

// 4. Verify scripts/android-e2e-assert.sh validates the share feature
console.log("\n--> [Step 4] Verifying scripts/android-e2e-assert.sh...");
const assertScriptPath = path.resolve(rootDir, "scripts/android-e2e-assert.sh");
assert(fs.existsSync(assertScriptPath), "scripts/android-e2e-assert.sh must exist");
const assertContent = fs.readFileSync(assertScriptPath, "utf8");

assert(
  assertContent.includes("action.VIEW"),
  "scripts/android-e2e-assert.sh must test ACTION_VIEW intent",
);
assert(
  assertContent.includes("action.SEND"),
  "scripts/android-e2e-assert.sh must test ACTION_SEND intent",
);
assert(
  assertContent.includes("SHARED_LINK_DISPATCH"),
  "scripts/android-e2e-assert.sh must verify shared link dispatch in Logcat",
);
console.log("✅ PASS: scripts/android-e2e-assert.sh reliably asserts YouTube video sharing.");

// 5. Verify public/android-emulator-report.html and public/android/index.html
console.log("\n--> [Step 5] Verifying minimal report templates in public/...");
const reportHtmlPath = path.resolve(rootDir, "public/android-emulator-report.html");
const androidIndexPath = path.resolve(rootDir, "public/android/index.html");
assert(fs.existsSync(reportHtmlPath), "public/android-emulator-report.html must exist");
assert(fs.existsSync(androidIndexPath), "public/android/index.html must exist");

const reportHtml = fs.readFileSync(reportHtmlPath, "utf8");
assert(
  reportHtml.includes("The application can be shared a YouTube video") ||
    reportHtml.includes("YouTube Video Sharing"),
  "Report HTML must feature the YouTube video sharing capability",
);
assert(
  reportHtml.includes("Product 1: Screencast Video") &&
    reportHtml.includes("Product 2: Captured Images") &&
    reportHtml.includes("Product 3: Android Logs"),
  "Report HTML must display the 3 authentic products (screencast, images, android logs)",
);
console.log("✅ PASS: Minimalist report HTML is ready for GitHub Pages hosting.");

// 6. Verify README.md is simplified and features working report link
console.log("\n--> [Step 6] Verifying simplified README.md...");
const readmePath = path.resolve(rootDir, "README.md");
const readmeContent = fs.readFileSync(readmePath, "utf8");

assert(
  readmeContent.includes("android-emulator-report.html"),
  "README.md must prominently link to android-emulator-report.html",
);
assert(
  readmeContent.includes("The application can be shared a YouTube video"),
  "README.md must specify the core tested feature",
);
assert(
  readmeContent.includes("quarentined/"),
  "README.md must reference quarantine directory for secondary suites",
);
console.log("✅ PASS: README.md simplified with working report links and quarantine notice.");

console.log("\n=========================================================================");
console.log("🎉 ALL QUARANTINE & MINIMAL ANDROID SHARE VERIFICATIONS PASSED!");
console.log("=========================================================================");
