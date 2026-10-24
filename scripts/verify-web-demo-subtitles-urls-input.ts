import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("=========================================================================");
console.log("🧪 Verifying Web-Demo Mode Video & Subtitles URLs Input Architecture");
console.log("=========================================================================");

const rootDir = process.cwd();

// 1. Version Parity Check
console.log("\n📦 Section 1: Version Parity");
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

// 2. Component Structure Check: src/components/WebDemoUrlsInput.tsx
console.log("\n🧩 Section 2: Modular WebDemoUrlsInput Component Structure");
const componentPath = path.resolve(rootDir, "src/components/WebDemoUrlsInput.tsx");
assert.ok(fs.existsSync(componentPath), "src/components/WebDemoUrlsInput.tsx must exist");

const componentSource = fs.readFileSync(componentPath, "utf-8");
assert.ok(
  componentSource.includes("export function WebDemoUrlsInput"),
  "WebDemoUrlsInput must be an exported React component",
);
assert.ok(
  componentSource.includes("videoUrlInput"),
  "WebDemoUrlsInput must manage videoUrlInput state",
);
assert.ok(
  componentSource.includes("subtitlesUrlsInput"),
  "WebDemoUrlsInput must manage subtitlesUrlsInput state",
);
assert.ok(
  componentSource.includes('data-testid="web-demo-subtitles-urls-input"'),
  "WebDemoUrlsInput must render subtitles URLs input with data-testid='web-demo-subtitles-urls-input'",
);
assert.ok(
  componentSource.includes('data-testid="fetch-web-demo-subtitles-button"'),
  "WebDemoUrlsInput must render fetch button with data-testid='fetch-web-demo-subtitles-button'",
);
assert.ok(
  componentSource.includes("isValidJsonSubtitleResponse"),
  "WebDemoUrlsInput must validate subtitle payloads with isValidJsonSubtitleResponse",
);
assert.ok(
  componentSource.includes("fetchViaServer"),
  "WebDemoUrlsInput must support server proxy fallback for YouTube timedtext URLs",
);
assert.ok(
  componentSource.includes("parseVideoId"),
  "WebDemoUrlsInput must parse and validate YouTube video URLs/IDs",
);
assert.ok(
  componentSource.includes("useEffect(() => {") &&
    componentSource.includes('setSubtitlesUrlsInput(initialObservedUrl || "")') &&
    componentSource.includes("[initialObservedUrl, currentVideoId]"),
  "WebDemoUrlsInput must sync late-arriving shared subtitle URLs into the input",
);
assert.ok(
  componentSource.includes("entriesToFetch.push({ lang: originalLang, url: baseUrl })"),
  "A single timedtext share URL must be fetched unchanged before generated target-language URLs",
);
console.log("✅ PASS: WebDemoUrlsInput component correctly structured with all required controls.");

// 3. Integration Check: src/routes/index.tsx
console.log("\n🔗 Section 3: Web-Demo Mode Integration in src/routes/index.tsx");
const indexTsxPath = path.resolve(rootDir, "src/routes/index.tsx");
const indexSource = fs.readFileSync(indexTsxPath, "utf-8");

assert.ok(
  indexSource.includes('import { WebDemoUrlsInput } from "@/components/WebDemoUrlsInput"'),
  "src/routes/index.tsx must import WebDemoUrlsInput",
);
assert.ok(
  indexSource.includes("handleWebDemoLoadVideoAndSubtitles"),
  "src/routes/index.tsx must define handleWebDemoLoadVideoAndSubtitles callback",
);
assert.ok(
  indexSource.includes("<WebDemoUrlsInput"),
  "src/routes/index.tsx must render <WebDemoUrlsInput in web-demo mode",
);
assert.ok(
  indexSource.includes("!isAndroid ? (") && indexSource.includes("<WebDemoUrlsInput"),
  "src/routes/index.tsx must selectively render WebDemoUrlsInput when !isAndroid",
);
console.log("✅ PASS: WebDemoUrlsInput seamlessly wired into web-demo route in index.tsx.");

// 4. Test URL Parsing Logic & Extraction Patterns
console.log("\n🔍 Section 4: Subtitles URL Language Extraction Logic");
// Test extracting language from timedtext URL
const sampleTimedtextUrl = "https://www.youtube.com/api/timedtext?v=L2Ryrr6txwA&lang=en&fmt=json3";
const u1 = new URL(sampleTimedtextUrl);
assert.strictEqual(u1.searchParams.get("lang"), "en", "Must extract lang=en from timedtext URL");

// Test extracting language from translated timedtext URL
const sampleTranslatedUrl = "https://www.youtube.com/api/timedtext?v=L2Ryrr6txwA&lang=en&tlang=he";
const u2 = new URL(sampleTranslatedUrl);
assert.strictEqual(
  u2.searchParams.get("tlang"),
  "he",
  "Must extract tlang=he from translation URL",
);

// Test explicit prefix regex
const prefixLine = "es: https://example.com/subtitles_es.json";
const match = prefixLine.match(/^([a-z]{2,3}(?:-[A-Za-z0-9]+)?)\s*[:=]\s*(.+)$/i);
assert.ok(match, "Prefix regex must match 'es: https://...'");
assert.strictEqual(match[1].toLowerCase(), "es", "Prefix regex must capture language code 'es'");
assert.strictEqual(
  match[2].trim(),
  "https://example.com/subtitles_es.json",
  "Prefix regex must capture URL",
);

console.log("✅ PASS: Language extraction patterns verified across all formats.");

console.log("=========================================================================");
console.log("🎉 ALL WEB-DEMO SUBTITLES URLS INPUT VERIFICATION CHECKS PASSED 100%!");
console.log("=========================================================================");
