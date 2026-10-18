import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("==================================================================");
console.log("🧪 Starting No Floating Notifications & Dedicated Tab Verification");
console.log("==================================================================");

const rootDir = process.cwd();
const indexRoutePath = path.join(rootDir, "src/routes/index.tsx");
const notificationsTabPath = path.join(rootDir, "src/components/NotificationsStatusTab.tsx");
const toastPath = path.join(rootDir, "src/components/SubtitleFetchToast.tsx");
const retryPath = path.join(rootDir, "src/components/FloatingSubtitleRetryIndicator.tsx");
const pkgPath = path.join(rootDir, "package.json");
const gradlePath = path.join(rootDir, "android-shell/app/build.gradle.kts");
const appConfigPath = path.join(rootDir, "src/config/appConfig.ts");
const apkUpdaterPath = path.join(rootDir, "src/utils/apkUpdater.ts");
const appSettingsPath = path.join(rootDir, "src/utils/appSettings.ts");

// 1. Verify files exist
assert(fs.existsSync(indexRoutePath), "src/routes/index.tsx must exist");
assert(fs.existsSync(notificationsTabPath), "NotificationsStatusTab.tsx must exist");
assert(fs.existsSync(toastPath), "SubtitleFetchToast.tsx must exist");
assert(fs.existsSync(retryPath), "FloatingSubtitleRetryIndicator.tsx must exist");

const indexContent = fs.readFileSync(indexRoutePath, "utf8");
const notificationsTabContent = fs.readFileSync(notificationsTabPath, "utf8");
const toastContent = fs.readFileSync(toastPath, "utf8");
const retryContent = fs.readFileSync(retryPath, "utf8");

// 2. Test 1: Verify removal of fixed floating overlays from root container in index.tsx
console.log("Test 1: Floating notification overlays removed from root overlay in index.tsx...");
// The root layout should not have floating toast or floating retry widget directly anchored to screen corners
assert(
  !/<SubtitleFetchToast\s+onViewSubtitles=/.test(indexContent),
  "index.tsx must not render floating SubtitleFetchToast in root overlay",
);
assert(
  !/<FloatingSubtitleRetryIndicator\s+targetLanguages=/.test(indexContent),
  "index.tsx must not render floating FloatingSubtitleRetryIndicator in root overlay",
);
console.log("✅ PASS: Floating notification elements successfully removed from root viewport overlay.");

// 3. Test 2: Verify dedicated Status & Alerts tab button in top-tabs-nav
console.log("Test 2: Dedicated tab button in top-tabs-nav...");
assert(
  indexContent.includes('id="tab-notifications"') &&
    indexContent.includes('data-testid="tab-notifications"'),
  "index.tsx must contain #tab-notifications with data-testid='tab-notifications'",
);
assert(
  indexContent.includes('activeTopTab === "notifications"'),
  "index.tsx must check activeTopTab === 'notifications'",
);
assert(
  indexContent.includes("<NotificationsStatusTab"),
  "index.tsx must render NotificationsStatusTab when notifications tab is active",
);
console.log("✅ PASS: Dedicated Status & Alerts tab navigation and conditional rendering verified.");

// 4. Test 3: Verify NotificationsStatusTab structure and interactive controls
console.log("Test 3: NotificationsStatusTab structure and elements...");
assert(
  notificationsTabContent.includes('data-testid="notifications-status-tab"'),
  "NotificationsStatusTab must have data-testid='notifications-status-tab'",
);
assert(
  notificationsTabContent.includes('data-testid="tab-retry-countdown"'),
  "NotificationsStatusTab must display retry countdown with data-testid='tab-retry-countdown'",
);
assert(
  notificationsTabContent.includes('data-testid="tab-retry-now-btn"'),
  "NotificationsStatusTab must provide manual retry button with data-testid='tab-retry-now-btn'",
);
assert(
  notificationsTabContent.includes('data-testid="tab-retry-toggle-btn"'),
  "NotificationsStatusTab must provide pause/resume toggle with data-testid='tab-retry-toggle-btn'",
);
assert(
  notificationsTabContent.includes('data-testid="tab-mute-notifications-checkbox"'),
  "NotificationsStatusTab must provide mute checkbox with data-testid='tab-mute-notifications-checkbox'",
);
assert(
  notificationsTabContent.includes('data-testid="tab-view-subtitles-btn"'),
  "NotificationsStatusTab must provide view subtitles button with data-testid='tab-view-subtitles-btn'",
);
console.log("✅ PASS: NotificationsStatusTab contains all required controls, countdowns, and alert views.");

// 5. Test 4: Verify non-floating support in child components
console.log("Test 4: Non-floating support in SubtitleFetchToast and FloatingSubtitleRetryIndicator...");
assert(
  toastContent.includes("floating?: boolean") || toastContent.includes("floating = false"),
  "SubtitleFetchToast must support non-floating mode via floating prop",
);
assert(
  retryContent.includes("floating?: boolean") || retryContent.includes("floating = false"),
  "FloatingSubtitleRetryIndicator must support non-floating mode via floating prop",
);
console.log("✅ PASS: Child indication components support clean relative non-floating embedding.");

// 6. Test 5: Verify version 1.0.48 / 10048 parity
console.log("Test 5: Version parity check for version 1.0.48...");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
assert.strictEqual(pkg.version, "1.0.48", "package.json must be 1.0.48");

const gradleContent = fs.readFileSync(gradlePath, "utf8");
assert(gradleContent.includes("versionCode = 10048"), "build.gradle.kts must have versionCode 10048");
assert(gradleContent.includes('versionName = "1.0.48"'), "build.gradle.kts must have versionName 1.0.48");

const appConfigContent = fs.readFileSync(appConfigPath, "utf8");
assert(appConfigContent.includes('export const APP_VERSION = "1.0.48"'), "appConfig.ts must export 1.0.48");

const apkUpdaterContent = fs.readFileSync(apkUpdaterPath, "utf8");
assert(apkUpdaterContent.includes('export const CURRENT_APK_VERSION = "v1.0.48"'), "apkUpdater.ts must export v1.0.48");

const appSettingsContent = fs.readFileSync(appSettingsPath, "utf8");
assert(appSettingsContent.includes('version: "1.0.48"'), "appSettings.ts snapshot must have 1.0.48");
console.log("✅ PASS: Version 1.0.48 and versionCode 10048 verified across all 5 targets.");

console.log("==================================================================");
console.log("🎉 ALL NO-FLOATING NOTIFICATIONS TAB VERIFICATIONS PASSED (5/5)");
console.log("==================================================================");
