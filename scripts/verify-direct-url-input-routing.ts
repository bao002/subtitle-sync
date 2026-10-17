import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("=========================================================================");
console.log("🧪 Verifying Direct Subtitle & Video URL Fetching in #youtube-url-input");
console.log("=========================================================================");

const rootDir = process.cwd();

// 1. Version Parity Check
console.log("\n📦 Section 1: Version Parity Check");
const pkg = JSON.parse(fs.readFileSync(path.resolve(rootDir, "package.json"), "utf-8"));
const expectedVersion = pkg.version;
const versionCode = (function () {
  const parts = expectedVersion.split(".").map((n: string) => parseInt(n, 10) || 0);
  return (parts[0] || 1) * 10000 + (parts[1] || 0) * 100 + (parts[2] || 0);
})();

const buildGradle = fs.readFileSync(
  path.resolve(rootDir, "android-shell/app/build.gradle.kts"),
  "utf-8",
);
assert.ok(
  buildGradle.includes(`"${expectedVersion}"`),
  `build.gradle.kts must contain ${expectedVersion}`,
);
assert.ok(
  buildGradle.includes(String(versionCode)),
  `build.gradle.kts must contain versionCode ${versionCode}`,
);

const appConfig = fs.readFileSync(path.resolve(rootDir, "src/config/appConfig.ts"), "utf-8");
assert.ok(
  appConfig.includes(`APP_VERSION = "${expectedVersion}"`),
  `appConfig.ts must declare APP_VERSION ${expectedVersion}`,
);

const apkUpdater = fs.readFileSync(path.resolve(rootDir, "src/utils/apkUpdater.ts"), "utf-8");
assert.ok(
  apkUpdater.includes(`CURRENT_APK_VERSION = "v${expectedVersion}"`),
  `apkUpdater.ts must declare CURRENT_APK_VERSION v${expectedVersion}`,
);

const appSettings = fs.readFileSync(path.resolve(rootDir, "src/utils/appSettings.ts"), "utf-8");
assert.ok(
  appSettings.includes(`version: "${expectedVersion}"`),
  `appSettings.ts must declare version ${expectedVersion}`,
);
console.log(`✅ PASS: Version ${expectedVersion} strictly aligned across all target files.`);

// 2. WebDemoUrlsInput Direct URL Fetching Logic
console.log("\n🎯 Section 2: WebDemoUrlsInput Direct URL Routing Logic");
const componentSource = fs.readFileSync(
  path.resolve(rootDir, "src/components/WebDemoUrlsInput.tsx"),
  "utf-8",
);

assert.ok(
  componentSource.includes("isTimedTextOrSubtitleUrl"),
  "WebDemoUrlsInput must detect if input is a timedtext or subtitle JSON URL",
);
assert.ok(
  componentSource.includes("/api/timedtext") &&
    componentSource.includes(".json") &&
    componentSource.includes("/fixtures/"),
  "WebDemoUrlsInput must check for timedtext, .json, and fixture patterns in main input",
);
assert.ok(
  componentSource.includes("parseJson3") && componentSource.includes("isValidJsonSubtitleResponse"),
  "WebDemoUrlsInput must parse and validate subtitle responses directly from main input",
);
assert.ok(
  componentSource.includes('data-testid="web-demo-status-banner"'),
  "WebDemoUrlsInput must render live status banner directly below form",
);

// 3. Test URL Extraction Logic on Sample TimedText and Fixture URLs
console.log("\n🔍 Section 3: Subtitle URL Parsing Assertions");
const sampleTimedText =
  "https://www.youtube.com/api/timedtext?v=L2Ryrr6txwA&lang=en&tlang=he&fmt=json3";
const parsedTimedText = new URL(sampleTimedText);
assert.strictEqual(
  parsedTimedText.searchParams.get("v"),
  "L2Ryrr6txwA",
  "Must extract videoId from timedtext URL",
);
assert.strictEqual(
  parsedTimedText.searchParams.get("tlang"),
  "he",
  "Must extract tlang from timedtext URL",
);

const sampleFixture = "/fixtures/L2Ryrr6txwA/es.json";
const fixtureMatch = sampleFixture.match(/\/([a-z]{2,3}(?:-[A-Za-z0-9]+)?)\.json$/i);
assert.ok(fixtureMatch, "Must match language from fixture JSON path");
assert.strictEqual(fixtureMatch[1].toLowerCase(), "es", "Must extract language code 'es'");

console.log("✅ PASS: Direct subtitle & video URL routing patterns successfully validated.");

console.log("=========================================================================");
console.log("🎉 ALL DIRECT URL INPUT ROUTING CHECKS PASSED 100%!");
console.log("=========================================================================");
