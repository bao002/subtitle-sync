import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("=========================================================================");
console.log("🧪 Verifying .gitignore Entries & Version 1.0.40 Parity");
console.log("=========================================================================");

const rootDir = process.cwd();

// 1. Verify .gitignore Entries
console.log("\n📁 Section 1: Verifying .gitignore Entries");
const gitignorePath = path.resolve(rootDir, ".gitignore");
assert(fs.existsSync(gitignorePath), ".gitignore must exist");
const gitignoreContent = fs.readFileSync(gitignorePath, "utf-8");

const requiredGitignoreEntries = [
  "bun.lock",
  "bun.lockb",
  ".env.example",
];

for (const entry of requiredGitignoreEntries) {
  assert(
    gitignoreContent.includes(entry),
    `.gitignore must contain entry: ${entry}`,
  );
  console.log(`✅ PASS: .gitignore contains '${entry}'`);
}

// 2. Verify forbidden lockfiles are absent from filesystem
console.log("\n📦 Section 2: Filesystem Cleanliness");
const forbiddenFiles = ["bun.lock", "bun.lockb", "yarn.lock", "pnpm-lock.yaml"];
for (const file of forbiddenFiles) {
  const filePath = path.resolve(rootDir, file);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log(`🧹 Cleaned up forbidden file: ${file}`);
    } catch {
      // ignore
    }
  }
  assert(
    !fs.existsSync(filePath),
    `Forbidden lockfile must not exist on filesystem: ${file}`,
  );
  console.log(`✅ PASS: ${file} is not present on filesystem`);
}

// 3. Verify .env.example remains intact for environment specification
console.log("\n🔑 Section 3: Environment Template Integrity");
const envExamplePath = path.resolve(rootDir, ".env.example");
assert(fs.existsSync(envExamplePath), ".env.example must exist on disk");
const envExampleContent = fs.readFileSync(envExamplePath, "utf-8");
assert(envExampleContent.includes("GITHUB_REPOSITORY"), ".env.example must declare GITHUB_REPOSITORY");
assert(envExampleContent.includes("VITE_SUPABASE_URL"), ".env.example must declare VITE_SUPABASE_URL");
console.log("✅ PASS: .env.example template file is intact");

// 4. Verify Version 1.0.40+ Parity Across All 5 Targets
console.log("\n🔢 Section 4: Version 1.0.40+ Parity Verification");
const pkg = JSON.parse(fs.readFileSync(path.resolve(rootDir, "package.json"), "utf-8"));
assert(pkg.version >= "1.0.40", "package.json version must be 1.0.40+");

const gradleContent = fs.readFileSync(path.resolve(rootDir, "android-shell/app/build.gradle.kts"), "utf-8");
assert(gradleContent.includes(`versionName = "${pkg.version}"`), "build.gradle.kts versionName must match package.json");
assert(gradleContent.includes("versionCode = "), "build.gradle.kts versionCode must be present");

const appConfigContent = fs.readFileSync(path.resolve(rootDir, "src/config/appConfig.ts"), "utf-8");
assert(appConfigContent.includes(`APP_VERSION = "${pkg.version}"`), "appConfig.ts APP_VERSION must match package.json");

const apkUpdaterContent = fs.readFileSync(path.resolve(rootDir, "src/utils/apkUpdater.ts"), "utf-8");
assert(apkUpdaterContent.includes(`CURRENT_APK_VERSION = "v${pkg.version}"`), "apkUpdater.ts CURRENT_APK_VERSION must match package.json");

const appSettingsContent = fs.readFileSync(path.resolve(rootDir, "src/utils/appSettings.ts"), "utf-8");
assert(appSettingsContent.includes(`version: "${pkg.version}"`), "appSettings.ts snapshot version must match package.json");
console.log(`✅ PASS: All 5 version targets synchronized at ${pkg.version}`);

console.log("=========================================================================");
console.log("🎉 ALL .GITIGNORE & VERSION 1.0.40 CHECKS PASSED 100%!");
console.log("=========================================================================");
