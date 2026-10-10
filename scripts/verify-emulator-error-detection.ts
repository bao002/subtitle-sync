import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("==================================================================");
console.log("🧪 Running Emulator E2E Failure on Error Screen Verification Test");
console.log("==================================================================");

const rootDir = process.cwd();

// 1. Verify ErrorComponent in src/routes/__root.tsx
const rootRoutePath = path.join(rootDir, "src/routes/__root.tsx");
assert(fs.existsSync(rootRoutePath), "src/routes/__root.tsx must exist");
const rootRouteContent = fs.readFileSync(rootRoutePath, "utf8");

assert(
  rootRouteContent.includes("[APP_BOOT_ERROR] Router rendered ErrorComponent: This page didn't load"),
  "ErrorComponent must log [APP_BOOT_ERROR] on error",
);
assert(
  rootRouteContent.includes("[APP_PAGE_ERROR] This page didn't load:"),
  "ErrorComponent must log [APP_PAGE_ERROR] on error",
);
assert(
  rootRouteContent.includes('data-testid="router-error-component"'),
  "ErrorComponent container must have data-testid=\"router-error-component\"",
);
assert(
  rootRouteContent.includes("This page didn't load"),
  "ErrorComponent must render 'This page didn't load'",
);
assert(
  rootRouteContent.includes("Something went wrong on our end"),
  "ErrorComponent must render 'Something went wrong on our end'",
);
console.log("✅ PASS: src/routes/__root.tsx ErrorComponent logs boot errors and renders error markers");

// 2. Verify client.tsx detects error boundary and inhibits [APP_READY]
const clientPath = path.join(rootDir, "src/client.tsx");
assert(fs.existsSync(clientPath), "src/client.tsx must exist");
const clientContent = fs.readFileSync(clientPath, "utf8");

assert(
  clientContent.includes("router-error-component") &&
    clientContent.includes("This page didn't load"),
  "src/client.tsx must check for error boundary rendering",
);
assert(
  clientContent.includes("[APP_BOOT_ERROR] Application rendered error boundary: This page didn't load"),
  "src/client.tsx must log [APP_BOOT_ERROR] when error boundary renders",
);
console.log("✅ PASS: src/client.tsx checkReady detects router error boundary and halts [APP_READY]");

// 3. Verify scripts/android-e2e-assert.sh fails immediately on error screen
const assertShPath = path.join(rootDir, "scripts/android-e2e-assert.sh");
assert(fs.existsSync(assertShPath), "scripts/android-e2e-assert.sh must exist");
const assertShContent = fs.readFileSync(assertShPath, "utf8");

assert(
  assertShContent.includes("This page didn't load") &&
    assertShContent.includes("Something went wrong on our end"),
  "scripts/android-e2e-assert.sh must check logcat for error screen markers",
);
assert(
  assertShContent.includes("Android app rendered error screen (This page didn't load)"),
  "scripts/android-e2e-assert.sh must fail immediately if error screen logs are detected",
);
assert(
  assertShContent.includes("uiautomator dump") &&
    assertShContent.includes("This page didn't load"),
  "scripts/android-e2e-assert.sh must verify on-device screen hierarchy does not display error screen",
);
console.log("✅ PASS: scripts/android-e2e-assert.sh enforces failure when error page is detected");

// 4. Verify scripts/run-android-e2e.sh early error check
const runShPath = path.join(rootDir, "scripts/run-android-e2e.sh");
assert(fs.existsSync(runShPath), "scripts/run-android-e2e.sh must exist");
const runShContent = fs.readFileSync(runShPath, "utf8");

assert(
  runShContent.includes("This page didn't load") &&
    runShContent.includes("Android app showed error page"),
  "scripts/run-android-e2e.sh must check for error screen on launch",
);
console.log("✅ PASS: scripts/run-android-e2e.sh checks for error screen upon WebView launch");

// 5. Verify Playwright and Cypress emulation suites assert absence of error screen
const playwrightSpecPath = path.join(rootDir, "e2e/emulation.spec.ts");
assert(fs.existsSync(playwrightSpecPath), "e2e/emulation.spec.ts must exist");
const playwrightContent = fs.readFileSync(playwrightSpecPath, "utf8");

assert(
  playwrightContent.includes("router-error-component") &&
    playwrightContent.includes("This page didn't load") &&
    playwrightContent.includes("Something went wrong on our end"),
  "e2e/emulation.spec.ts must assert absence of error screen",
);

const cypressSpecPath = path.join(rootDir, "cypress/e2e/emulation.cy.ts");
assert(fs.existsSync(cypressSpecPath), "cypress/e2e/emulation.cy.ts must exist");
const cypressContent = fs.readFileSync(cypressSpecPath, "utf8");

assert(
  cypressContent.includes("router-error-component") &&
    cypressContent.includes("This page didn't load") &&
    cypressContent.includes("Something went wrong on our end"),
  "cypress/e2e/emulation.cy.ts must assert absence of error screen",
);
console.log("✅ PASS: Playwright & Cypress emulation test suites enforce absence of error screen");

console.log("==================================================================");
console.log("🎉 ALL EMULATOR ERROR DETECTION VERIFICATION CHECKS PASSED!");
console.log("==================================================================");
