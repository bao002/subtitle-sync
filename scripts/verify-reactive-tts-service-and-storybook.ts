import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("====================================================");
console.log("🧪 Starting Reactive TTS Service & Storybook Verification");
console.log("====================================================");

const rootDir = process.cwd();

// 1. Verify TtsServiceSettingsPanel component exists and enforces reactivity
const componentPath = path.join(rootDir, "src/components/TtsServiceSettingsPanel.tsx");
assert(fs.existsSync(componentPath), "src/components/TtsServiceSettingsPanel.tsx must exist");
const componentContent = fs.readFileSync(componentPath, "utf8");

// Reactivity rule 1: Direct Google TTS hides provider and voice dropdowns
assert(
  componentContent.includes("isGoogleDirect"),
  "Component must classify direct Google TTS via isGoogleDirect"
);
assert(
  componentContent.includes("isGoogleDirect ? (") ||
    componentContent.includes("!isGoogleDirect && ("),
  "Provider selection must be hidden when Direct Google TTS is selected"
);

// Reactivity rule 2: No duplicate validate buttons
const validateButtonCount = (
  componentContent.match(/data-testid=["']btn-validate-remote-tts["']/g) || []
).length;
assert.strictEqual(
  validateButtonCount,
  1,
  `There must be exactly 1 validate button in TtsServiceSettingsPanel, got ${validateButtonCount}`
);

const testAudioButtonCount = (
  componentContent.match(/data-testid=["']test-alternative-tts-btn["']/g) || []
).length;
assert.strictEqual(
  testAudioButtonCount,
  1,
  `There must be exactly 1 test audio button in TtsServiceSettingsPanel, got ${testAudioButtonCount}`
);

// Reactivity rule 3: Keyed providers conditionally reveal token inputs
assert(
  componentContent.includes("isKeyedProvider"),
  "Component must conditionally show key input based on isKeyedProvider"
);
assert(
  componentContent.includes("availableVoices.length === 0 ? ("),
  "Component must conditionally show voice dropdown based on available voices"
);
console.log("✅ PASS: TtsServiceSettingsPanel enforces strict reactive visibility and zero button duplications");

// 2. Verify Storybook stories file exists and defines all required stories
const storiesPath = path.join(rootDir, "src/components/TtsServiceSettingsPanel.stories.tsx");
assert(fs.existsSync(storiesPath), "src/components/TtsServiceSettingsPanel.stories.tsx must exist");
const storiesContent = fs.readFileSync(storiesPath, "utf8");

const requiredStories = [
  "GoogleDirect",
  "LovableAutoPublic",
  "LovableOpenRouterKeyed",
  "LovableOpenAi",
  "FallbackOnlyMode",
  "ValidationFailedState",
];
for (const story of requiredStories) {
  assert(
    storiesContent.includes(story),
    `Stories file must define story: ${story}`
  );
}
console.log("✅ PASS: Storybook stories define all reactive states and test scenarios");

// 3. Verify clean room Storybook workbench in src/storybook/StorybookWorkbench.tsx
const workbenchPath = path.join(rootDir, "src/storybook/StorybookWorkbench.tsx");
assert(fs.existsSync(workbenchPath), "src/storybook/StorybookWorkbench.tsx must exist");
const workbenchContent = fs.readFileSync(workbenchPath, "utf8");

assert(
  workbenchContent.includes("TtsServiceSettingsPanel"),
  "StorybookWorkbench must render TtsServiceSettingsPanel"
);
assert(
  workbenchContent.includes("data-testid=\"storybook-workbench\""),
  "StorybookWorkbench must render test ID"
);
console.log("✅ PASS: StorybookWorkbench provides clean room isolation for rapid component iteration");

// 4. Verify src/routes/index.tsx uses TtsServiceSettingsPanel
const indexRoutePath = path.join(rootDir, "src/routes/index.tsx");
const indexContent = fs.readFileSync(indexRoutePath, "utf8");
assert(
  indexContent.includes("<TtsServiceSettingsPanel"),
  "src/routes/index.tsx must use decomposed TtsServiceSettingsPanel"
);
console.log("✅ PASS: src/routes/index.tsx mounts modular TtsServiceSettingsPanel");

// 5. Verify App Version Synchronization across all 5 files (Version 2.0.72)
const packageJsonPath = path.join(rootDir, "package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
const gradlePath = path.join(rootDir, "android-shell/app/build.gradle.kts");
const gradleContent = fs.readFileSync(gradlePath, "utf8");
const appConfigPath = path.join(rootDir, "src/config/appConfig.ts");
const appConfigContent = fs.readFileSync(appConfigPath, "utf8");
const apkUpdaterPath = path.join(rootDir, "src/utils/apkUpdater.ts");
const apkUpdaterContent = fs.readFileSync(apkUpdaterPath, "utf8");
const appSettingsPath = path.join(rootDir, "src/utils/appSettings.ts");
const appSettingsContent = fs.readFileSync(appSettingsPath, "utf8");

const expectedVersion = packageJson.version;
assert(
  packageJson.version >= "2.0.72",
  `package.json version must be >= "2.0.72", got "${packageJson.version}"`
);

const gradleVersionCodeMatch = gradleContent.match(/versionCode\s*=\s*(\d+)/);
assert(gradleVersionCodeMatch, "build.gradle.kts must contain versionCode");
const currentVersionCode = parseInt(gradleVersionCodeMatch[1], 10);
assert(
  currentVersionCode >= 20072,
  `build.gradle.kts versionCode must be >= 20072, got ${currentVersionCode}`
);

const gradleVersionNameMatch = gradleContent.match(/versionName\s*=\s*"([^"]+)"/);
assert(gradleVersionNameMatch, "build.gradle.kts must contain versionName");
assert.strictEqual(
  gradleVersionNameMatch[1],
  expectedVersion,
  `build.gradle.kts versionName must be "${expectedVersion}"`
);

assert(
  appConfigContent.includes(`export const APP_VERSION = "${expectedVersion}";`),
  `src/config/appConfig.ts must export APP_VERSION = "${expectedVersion}"`
);

assert(
  apkUpdaterContent.includes(`export const CURRENT_APK_VERSION = "v${expectedVersion}";`),
  `src/utils/apkUpdater.ts must export CURRENT_APK_VERSION = "v${expectedVersion}"`
);

const appSettingsVersionMatch = appSettingsContent.match(/version:\s*"([^"]+)"/);
assert(appSettingsVersionMatch, "appSettings.ts AppStateSnapshot must contain version");
assert.strictEqual(
  appSettingsVersionMatch[1],
  expectedVersion,
  `appSettings.ts snapshot version must be "${expectedVersion}"`
);

console.log(`✅ PASS: All 5 version targets synchronized at version ${expectedVersion} (code: ${currentVersionCode})`);

console.log("====================================================");
console.log("🎉 Reactive TTS Service & Storybook Verification PASSED!");
console.log("====================================================");
