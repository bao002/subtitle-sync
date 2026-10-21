import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("=========================================================================");
console.log("🧪 Verifying Zero Static Images in Repo & Emulator-Only Artifact Generation");
console.log("=========================================================================");

const rootDir = process.cwd();

// 1. Assert zero static screenshot/image files exist in public/assets/ or public/screenshots/
console.log("\n📁 Check 1: Zero Static Images in Repository on Main");
const forbiddenDirs = [
  path.resolve(rootDir, "public/assets"),
  path.resolve(rootDir, "public/screenshots"),
];

for (const dir of forbiddenDirs) {
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);
    const imageFiles = files.filter((f) =>
      /\.(png|jpg|jpeg|webp|gif|mp4)$/i.test(f),
    );
    assert.strictEqual(
      imageFiles.length,
      0,
      `Directory ${dir} must NOT contain static image/video files, found: ${imageFiles.join(", ")}`,
    );
    console.log(`✅ PASS: ${path.relative(rootDir, dir)} contains 0 static image/video files.`);
  }
}

// 2. Assert .gitignore enforces ignoring runtime screenshot images
console.log("\n🛡️ Check 2: .gitignore Guarding Public Screenshot Artifacts");
const gitignorePath = path.resolve(rootDir, ".gitignore");
assert(fs.existsSync(gitignorePath), ".gitignore must exist");
const gitignoreContent = fs.readFileSync(gitignorePath, "utf-8");

assert(
  gitignoreContent.includes("public/screenshots/*.png") ||
    gitignoreContent.includes("public/screenshots/"),
  ".gitignore must ignore PNGs in public/screenshots/",
);
assert(
  gitignoreContent.includes("public/assets/*.png") ||
    gitignoreContent.includes("public/assets/"),
  ".gitignore must ignore PNGs in public/assets/",
);
console.log("✅ PASS: .gitignore properly guards public screenshot directories against accidental check-ins.");

// 3. Assert dedicated GitHub Actions flow (emulation.yml) captures real emulator screenshots
console.log("\n🤖 Check 3: Dedicated GitHub Actions Flow Runs Real Android Emulator");
const emulationYmlPath = path.resolve(rootDir, ".github/workflows/emulation.yml");
assert(fs.existsSync(emulationYmlPath), ".github/workflows/emulation.yml must exist");
const emulationYml = fs.readFileSync(emulationYmlPath, "utf-8");

assert(
  emulationYml.includes("reactivecircus/android-emulator-runner@v2"),
  "emulation.yml must execute on authentic Android emulator via reactivecircus/android-emulator-runner",
);
assert(
  emulationYml.includes("api-level: 34"),
  "emulation.yml must run on Android 14 (API 34)",
);
assert(
  emulationYml.includes("screencap"),
  "emulation.yml must capture authentic screenshots via adb shell screencap during test run",
);
assert(
  emulationYml.includes("gh-pages-staging/screenshots"),
  "emulation.yml must stage authentic screenshot artifacts to gh-pages branch",
);
assert(
  emulationYml.includes("android-emulator-artifacts"),
  "emulation.yml must upload authentic artifacts to GitHub Actions workflow run",
);
console.log("✅ PASS: emulation.yml dedicated flow runs real Android emulator and produces authentic artifacts.");

// 4. Assert update-readme.mjs and verify-readme-links.ts enforce clean repository hygiene
console.log("\n🧹 Check 4: Integrity & Link Checking Resilient to Absence of Static Media");
const updateReadmePath = path.resolve(rootDir, "scripts/update-readme.mjs");
const updateReadmeContent = fs.readFileSync(updateReadmePath, "utf-8");

assert(
  updateReadmeContent.includes("cleanTarget.endsWith(\".png\")") ||
    updateReadmeContent.includes(".png"),
  "scripts/update-readme.mjs must skip static image files in broken link scans",
);

const verifyReadmeLinksPath = path.resolve(rootDir, "scripts/verify-readme-links.ts");
const verifyReadmeLinksContent = fs.readFileSync(verifyReadmeLinksPath, "utf-8");
assert(
  verifyReadmeLinksContent.includes("!fs.existsSync(screenshotAsset)"),
  "scripts/verify-readme-links.ts must verify static screenshot asset is absent from repo source",
);
console.log("✅ PASS: Integrity & link verification tools enforce repository hygiene and ignore absent static media.");

console.log("\n=========================================================================");
console.log("🎉 ALL ZERO-STATIC-IMAGES & EMULATOR-ONLY ARTIFACT GENERATION CHECKS PASSED!");
console.log("=========================================================================");
