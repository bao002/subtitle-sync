import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
import { createShareableLink } from "../src/utils/urlStateManager";

console.log("=========================================================================");
console.log("🧪 Verifying Sharable State Link, Hydration & Version 1.0.43 Parity");
console.log("=========================================================================");

const rootDir = process.cwd();

// 1. Verify URL State Manager Serialization
console.log("\n🔗 Section 1: URL State Manager Serialization");
const link = createShareableLink({
  baseUrl: "https://example.com/app",
  videoId: "vBURridJXZ0",
  targetLang: "he",
  subUrl: "https://example.com/fixtures/en.json",
  openRouterApiKey: "sk-or-v1-testkey12345",
  time: 42,
});

assert(link.includes("v=vBURridJXZ0"), "Shareable link must contain video ID parameter");
assert(link.includes("target_lang=he"), "Shareable link must contain target_lang parameter");
assert(link.includes("sub_url="), "Shareable link must contain sub_url parameter");
assert(link.includes("openrouter_key=sk-or-v1-testkey12345"), "Shareable link must contain openrouter_key");
assert(link.includes("t=42"), "Shareable link must contain playback time");
console.log(`✅ PASS: Generated shareable link: ${link}`);

// 2. Verify ShareStateModal Component Structure
console.log("\n📦 Section 2: ShareStateModal Component Verification");
const modalPath = path.resolve(rootDir, "src/components/ShareStateModal.tsx");
assert(fs.existsSync(modalPath), "src/components/ShareStateModal.tsx must exist");
const modalContent = fs.readFileSync(modalPath, "utf-8");

assert(modalContent.includes("export function ShareStateModal"), "ShareStateModal must export ShareStateModal component");
assert(modalContent.includes("createShareableLink"), "ShareStateModal must use createShareableLink");
assert(modalContent.includes("data-testid=\"share-state-dialog\""), "ShareStateModal must render dialog testid");
assert(modalContent.includes("data-testid=\"copy-share-link-btn\""), "ShareStateModal must render copy button");
assert(modalContent.includes("data-testid=\"share-include-api-key-toggle\""), "ShareStateModal must allow toggling OpenRouter key inclusion");
assert(modalContent.includes("data-testid=\"share-include-subtitles-toggle\""), "ShareStateModal must allow toggling default subtitles inclusion");
console.log("✅ PASS: ShareStateModal component exports and UI attributes verified.");

// 3. Verify src/routes/index.tsx Integration & Hydration
console.log("\n🌐 Section 3: Index Route Integration & URL Hydration");
const indexPath = path.resolve(rootDir, "src/routes/index.tsx");
assert(fs.existsSync(indexPath), "src/routes/index.tsx must exist");
const indexContent = fs.readFileSync(indexPath, "utf-8");

assert(indexContent.includes("import { ShareStateModal }"), "index.tsx must import ShareStateModal");
assert(indexContent.includes("getAppStateFromUrl"), "index.tsx must import getAppStateFromUrl");
assert(indexContent.includes("getOpenRouterApiKeySetting"), "index.tsx must import getOpenRouterApiKeySetting");
assert(indexContent.includes("setOpenRouterApiKeySetting"), "index.tsx must import setOpenRouterApiKeySetting");

assert(indexContent.includes("data-testid=\"open-share-modal-button\""), "index.tsx must include open-share-modal-button in header");
assert(indexContent.includes("<ShareStateModal"), "index.tsx must render ShareStateModal component");
assert(indexContent.includes("appState.openRouterApiKey"), "index.tsx must hydrate openRouterApiKey from URL");
assert(indexContent.includes("appState.targetLang"), "index.tsx must hydrate targetLang from URL");
assert(indexContent.includes("appState.subUrl"), "index.tsx must hydrate subUrl from URL");
assert(indexContent.includes("shareModalOpen"), "index.tsx must handle shareModalOpen state");

console.log("✅ PASS: Index route mounts ShareStateModal and hydrates shareable state parameters on load.");

// 4. Verify Version 1.0.43 Parity Across All 5 Targets
console.log("\n🔢 Section 4: Version 1.0.43 Parity Across All 5 Targets");
const pkg = JSON.parse(fs.readFileSync(path.resolve(rootDir, "package.json"), "utf-8"));
assert.strictEqual(pkg.version, "1.0.43", "package.json version must be 1.0.43");

const gradleContent = fs.readFileSync(path.resolve(rootDir, "android-shell/app/build.gradle.kts"), "utf-8");
assert(gradleContent.includes("versionName = \"1.0.43\""), "build.gradle.kts versionName must be 1.0.43");
assert(gradleContent.includes("versionCode = 10043"), "build.gradle.kts versionCode must be 10043");

const appConfigContent = fs.readFileSync(path.resolve(rootDir, "src/config/appConfig.ts"), "utf-8");
assert(appConfigContent.includes("APP_VERSION = \"1.0.43\""), "appConfig.ts APP_VERSION must be 1.0.43");

const apkUpdaterContent = fs.readFileSync(path.resolve(rootDir, "src/utils/apkUpdater.ts"), "utf-8");
assert(apkUpdaterContent.includes("CURRENT_APK_VERSION = \"v1.0.43\""), "apkUpdater.ts CURRENT_APK_VERSION must be v1.0.43");

const appSettingsContent = fs.readFileSync(path.resolve(rootDir, "src/utils/appSettings.ts"), "utf-8");
assert(appSettingsContent.includes("version: \"1.0.43\""), "appSettings.ts snapshot version must be 1.0.43");

console.log("✅ PASS: All 5 version targets synchronized at 1.0.43 / 10043.");

console.log("=========================================================================");
console.log("🎉 ALL SHARABLE STATE LINK & VERSION 1.0.43 CHECKS PASSED 100%!");
console.log("=========================================================================");
