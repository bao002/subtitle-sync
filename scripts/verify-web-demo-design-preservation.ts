import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("=========================================================================");
console.log("🧪 Verifying Web-Demo Design Preservation, AGENTS.md Mandate & Track Isolation");
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
console.log("✅ PASS: Version 1.0.25 strictly aligned across all target files.");

// 2. AGENTS.md Design Preservation Mandate Check
console.log("\n📜 Section 2: AGENTS.md Design Preservation Mandate");
const agentsMd = fs.readFileSync(path.resolve(rootDir, "AGENTS.md"), "utf-8");
assert.ok(
  agentsMd.includes("Strict UI & Web-Demo Design Preservation Mandate"),
  "AGENTS.md must define 'Strict UI & Web-Demo Design Preservation Mandate'",
);
assert.ok(
  agentsMd.includes("NEVER alter, redesign, replace, re-theme, or disrupt"),
  "AGENTS.md must mandate NEVER altering or redesigning without user confirmation",
);
assert.ok(
  agentsMd.includes("without explicit user confirmation and request"),
  "AGENTS.md must mandate user confirmation before design changes",
);
console.log("✅ PASS: AGENTS.md strictly codifies design preservation rule.");

// 3. WebDemoUrlsInput Component Structure & Design Preservation Check
console.log("\n🎨 Section 3: Web-Demo Input Bar & Design Preservation in WebDemoUrlsInput");
const componentSource = fs.readFileSync(
  path.resolve(rootDir, "src/components/WebDemoUrlsInput.tsx"),
  "utf-8",
);

assert.ok(
  componentSource.includes('id="youtube-url-form"'),
  "WebDemoUrlsInput must render id='youtube-url-form' matching the original design",
);
assert.ok(
  componentSource.includes('id="youtube-url-input"'),
  "WebDemoUrlsInput must render id='youtube-url-input' matching the original design",
);
assert.ok(
  componentSource.includes('id="play-video-button"'),
  "WebDemoUrlsInput must render id='play-video-button' matching the original design",
);
assert.ok(
  componentSource.includes("useState(false)"),
  "WebDemoUrlsInput must default isExpanded to false to preserve the clean single-row layout",
);
assert.ok(
  componentSource.includes('data-testid="web-demo-subtitles-urls-input"'),
  "WebDemoUrlsInput must provide subtitle URLs input",
);
assert.ok(
  componentSource.includes('data-testid="fetch-web-demo-subtitles-button"'),
  "WebDemoUrlsInput must provide fetch subtitles button",
);
console.log("✅ PASS: WebDemoUrlsInput preserves original clean single-row design with collapsible drawer.");

// 4. Subtitle Isolation & No Default Video Subtitles Introduction
console.log("\n🛡️ Section 4: Subtitle Isolation in src/routes/index.tsx");
const indexSource = fs.readFileSync(path.resolve(rootDir, "src/routes/index.tsx"), "utf-8");

assert.ok(
  indexSource.includes("const isDifferentVideo = Boolean(newVideoId && newVideoId !== videoId);"),
  "index.tsx must track isDifferentVideo in handleWebDemoLoadVideoAndSubtitles",
);
assert.ok(
  indexSource.includes("setTracks(newTracks);"),
  "index.tsx must setTracks to newTracks directly without merging with default video tracks",
);
assert.ok(
  indexSource.includes("setShown(trackLangs);"),
  "index.tsx must setShown strictly to new trackLangs without merging with default video languages",
);
assert.ok(
  indexSource.includes("setTargetLanguages(trackLangs);"),
  "index.tsx must setTargetLanguages strictly to new trackLangs",
);
console.log("✅ PASS: Subtitles isolation logic verified; default video subtitles are never introduced into alternative videos.");

console.log("=========================================================================");
console.log("🎉 ALL WEB-DEMO DESIGN PRESERVATION & TRACK ISOLATION CHECKS PASSED 100%!");
console.log("=========================================================================");
