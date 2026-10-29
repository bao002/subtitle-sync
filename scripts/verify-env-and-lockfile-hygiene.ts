import fs from "fs";
import path from "path";
import assert from "assert";

const rootDir = process.cwd();

console.log("=== Verifying Task 179: Environment, Lockfile Hygiene & Version 1.0.72 ===");

// 1. Verify .env.example exists and contains required environment variables
const envExamplePath = path.resolve(rootDir, ".env.example");
assert(fs.existsSync(envExamplePath), ".env.example must exist in repository root");
const envExampleContent = fs.readFileSync(envExamplePath, "utf-8");

const requiredEnvVars = [
  "GITHUB_REPOSITORY",
  "GITHUB_REPOSITORY_OWNER",
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
  "VITE_OPENROUTER_API_KEY",
  "VITE_COMMIT_SHA",
];

for (const envVar of requiredEnvVars) {
  assert(
    envExampleContent.includes(envVar),
    `.env.example must declare environment variable ${envVar}`,
  );
}
console.log("✓ .env.example exists and declares all required variables");

// 2. Verify lockfile cleanliness
const forbiddenLockfiles = ["bun.lock", "yarn.lock", "pnpm-lock.yaml", "bun.lockb"];
for (const lockfile of forbiddenLockfiles) {
  const lockfilePath = path.resolve(rootDir, lockfile);
  assert(
    !fs.existsSync(lockfilePath),
    `Forbidden lockfile ${lockfile} must not exist in repository root`,
  );
}
console.log("✓ Workspace root is clean of forbidden lockfiles");

// 3. Verify Alternative TTS playback rate handling in fallback paths
const altTtsPath = path.resolve(rootDir, "src/lib/alternative-tts.ts");
const altTtsContent = fs.readFileSync(altTtsPath, "utf-8");

assert(
  altTtsContent.includes("audio.playbackRate = Math.max(0.3, Math.min(1.5, rate || 0.5))"),
  "playAlternativeTtsAudio must set audio.playbackRate using caller's rate",
);
console.log("✓ playAlternativeTtsAudio correctly synchronizes playbackRate on fallback");

// 4. Verify version >= 1.0.72 across all 5 targets
const pkgJson = JSON.parse(fs.readFileSync(path.resolve(rootDir, "package.json"), "utf-8"));
assert(pkgJson.version >= "1.0.72", "package.json version must be >= 1.0.72");

const gradleContent = fs.readFileSync(
  path.resolve(rootDir, "android-shell/app/build.gradle.kts"),
  "utf-8",
);
assert(
  /versionCode = 1007[2-9]/.test(gradleContent),
  "build.gradle.kts versionCode must be >= 10072",
);
assert(
  /versionName = "1\.0\.7[2-9]"/.test(gradleContent),
  'build.gradle.kts versionName must be >= "1.0.72"',
);

const appConfigContent = fs.readFileSync(path.resolve(rootDir, "src/config/appConfig.ts"), "utf-8");
assert(
  /export const APP_VERSION = "1\.0\.7[2-9]";/.test(appConfigContent),
  'appConfig.ts APP_VERSION must be >= "1.0.72"',
);

const apkUpdaterContent = fs.readFileSync(
  path.resolve(rootDir, "src/utils/apkUpdater.ts"),
  "utf-8",
);
assert(
  /export const CURRENT_APK_VERSION = "v1\.0\.7[2-9]";/.test(apkUpdaterContent),
  'apkUpdater.ts CURRENT_APK_VERSION must be >= "v1.0.72"',
);

const appSettingsContent = fs.readFileSync(
  path.resolve(rootDir, "src/utils/appSettings.ts"),
  "utf-8",
);
assert(
  /version: "1\.0\.7[2-9]"/.test(appSettingsContent),
  'appSettings.ts version must be >= "1.0.72"',
);

console.log("✓ Version >= 1.0.72 synchronized across all 5 files");
console.log("=== ALL TASK 179 ASSERTIONS PASSED ===");
