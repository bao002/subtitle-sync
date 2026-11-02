import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("====================================================");
console.log("🧪 Starting Storybook Components Catalog Verification");
console.log("====================================================");

const rootDir = process.cwd();

// 1. Verify all application component story files exist in src/components/
const expectedStories = [
  "TtsServiceSettingsPanel.stories.tsx",
  "VideoPlaybackControls.stories.tsx",
  "FloatingDraggablePauseButton.stories.tsx",
  "ModeSwitcherHeader.stories.tsx",
  "LanguageBoxesSelector.stories.tsx",
  "SpecialCharactersRemovalPanel.stories.tsx",
  "VideoLanguageSequenceControl.stories.tsx",
  "ExternalTtsDebuggerPanel.stories.tsx",
];

for (const storyFile of expectedStories) {
  const storyPath = path.join(rootDir, "src/components", storyFile);
  assert(fs.existsSync(storyPath), `Story file src/components/${storyFile} must exist`);
  const content = fs.readFileSync(storyPath, "utf8");
  assert(
    content.includes("export default meta;"),
    `${storyFile} must export default meta`
  );
  assert(
    content.includes("export const "),
    `${storyFile} must export at least one story`
  );
  console.log(`✅ PASS: src/components/${storyFile} valid`);
}

// 2. Verify Storybook configuration in .storybook/main.ts covers all component stories
const mainPath = path.join(rootDir, ".storybook/main.ts");
assert(fs.existsSync(mainPath), ".storybook/main.ts must exist");
const mainContent = fs.readFileSync(mainPath, "utf8");
assert(
  mainContent.includes("../src/**/*.stories"),
  ".storybook/main.ts must match all ../src/**/*.stories glob"
);
console.log("✅ PASS: .storybook/main.ts captures all application component stories");

// 3. Verify StorybookWorkbench multi-component interactive catalog
const workbenchPath = path.join(rootDir, "src/storybook/StorybookWorkbench.tsx");
assert(fs.existsSync(workbenchPath), "src/storybook/StorybookWorkbench.tsx must exist");
const workbenchContent = fs.readFileSync(workbenchPath, "utf8");

const expectedComponentTabs = [
  "tts_service",
  "playback_controls",
  "floating_pause",
  "language_boxes",
  "chars_removal",
  "sequence_control",
  "tts_debugger",
  "mode_switcher",
];

for (const tabId of expectedComponentTabs) {
  assert(
    workbenchContent.includes(`id: "${tabId}"`) || workbenchContent.includes(`tab-component-${tabId}`),
    `StorybookWorkbench must include tab for component: ${tabId}`
  );
}
assert(
  workbenchContent.includes("tab-component-"),
  "StorybookWorkbench must render tab-component- data-testids"
);
console.log("✅ PASS: StorybookWorkbench contains interactive catalog for all application components");

// 4. Verify Version 2.0.73 synchronization across 5 files
const expectedVersion = "2.0.73";
const expectedVersionCode = 20073;

const pkgJson = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf8"));
assert.strictEqual(
  pkgJson.version,
  expectedVersion,
  `package.json must be ${expectedVersion}`
);

const gradleContent = fs.readFileSync(
  path.join(rootDir, "android-shell/app/build.gradle.kts"),
  "utf8"
);
const gradleCodeMatch = gradleContent.match(/versionCode\s*=\s*(\d+)/);
assert(gradleCodeMatch && parseInt(gradleCodeMatch[1], 10) === expectedVersionCode);
const gradleNameMatch = gradleContent.match(/versionName\s*=\s*"([^"]+)"/);
assert(gradleNameMatch && gradleNameMatch[1] === expectedVersion);

const appConfigContent = fs.readFileSync(path.join(rootDir, "src/config/appConfig.ts"), "utf8");
assert(appConfigContent.includes(`export const APP_VERSION = "${expectedVersion}";`));

const apkUpdaterContent = fs.readFileSync(path.join(rootDir, "src/utils/apkUpdater.ts"), "utf8");
assert(apkUpdaterContent.includes(`export const CURRENT_APK_VERSION = "v${expectedVersion}";`));

const appSettingsContent = fs.readFileSync(path.join(rootDir, "src/utils/appSettings.ts"), "utf8");
const appSettingsVersionMatch = appSettingsContent.match(/version:\s*"([^"]+)"/);
assert(appSettingsVersionMatch && appSettingsVersionMatch[1] === expectedVersion);

console.log(`✅ PASS: Version ${expectedVersion} (${expectedVersionCode}) synchronized across all 5 files`);

console.log("====================================================");
console.log("🎉 Storybook Components Catalog Verification PASSED!");
console.log("====================================================");
