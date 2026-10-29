import fs from "fs";
import path from "path";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  }
}

console.log("====================================================");
console.log("🧪 Starting Task 188: Focus Mode - Beginner Nav Responsive Styling Verification");
console.log("====================================================");

// 1. Verify BeginnerTabNav responsive classes
console.log("📱 Test 1: BeginnerTabNav responsive containment and viewport restraint...");
const navPath = path.resolve(process.cwd(), "src/components/beginner/BeginnerTabNav.tsx");
assert(fs.existsSync(navPath), "BeginnerTabNav.tsx exists");
const navContent = fs.readFileSync(navPath, "utf-8");

assert(
  navContent.includes("max-w-full") && navContent.includes("overflow-hidden"),
  "BeginnerTabNav <nav> element contains max-w-full and overflow-hidden to prevent extending beyond viewport",
);

assert(
  navContent.includes('data-testid="beginner-tab-nav"'),
  "BeginnerTabNav maintains data-testid='beginner-tab-nav'",
);

assert(
  navContent.includes("min-w-0") && navContent.includes("max-w-[200px]"),
  "Tab buttons use min-w-0 and max-w-[200px] for fluid responsive shrinking on narrow screens",
);

assert(
  navContent.includes("hidden sm:block"),
  "Subtitles use 'hidden sm:block' to prevent expanding button height/width on small mobile screens",
);

assert(
  navContent.includes("overflow-x-auto") && navContent.includes("scrollbar-none"),
  "Inner container provides smooth horizontal scroll without ugly scrollbars",
);
console.log("✅ PASS: BeginnerTabNav correctly contains elements within viewport bounds");

// 2. Verify Version Synchronization across all 5 targets
console.log("🔢 Test 2: Version 1.0.102 Synchronization across all 5 targets...");

const pkgJson = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "package.json"), "utf-8"));
assert(pkgJson.version === "1.0.102", `package.json version is 1.0.102 (found ${pkgJson.version})`);

const gradle = fs.readFileSync(
  path.resolve(process.cwd(), "android-shell/app/build.gradle.kts"),
  "utf-8",
);
assert(gradle.includes("versionCode = 10102"), "build.gradle.kts versionCode is 10102");
assert(gradle.includes('versionName = "1.0.102"'), "build.gradle.kts versionName is '1.0.102'");

const apkUpdater = fs.readFileSync(path.resolve(process.cwd(), "src/utils/apkUpdater.ts"), "utf-8");
assert(
  apkUpdater.includes('CURRENT_APK_VERSION = "v1.0.102"'),
  "apkUpdater.ts CURRENT_APK_VERSION is 'v1.0.102'",
);

const appSettings = fs.readFileSync(
  path.resolve(process.cwd(), "src/utils/appSettings.ts"),
  "utf-8",
);
assert(
  appSettings.includes('version: "1.0.102"'),
  "appSettings.ts default snapshot version is '1.0.102'",
);

const appConfig = fs.readFileSync(path.resolve(process.cwd(), "src/config/appConfig.ts"), "utf-8");
assert(appConfig.includes('APP_VERSION = "1.0.102"'), "appConfig.ts APP_VERSION is '1.0.102'");
console.log("✅ PASS: Version 1.0.102 synchronized across all 5 codebase targets");

console.log("====================================================");
console.log("🎉 Task 188 Verification Suite PASSED successfully!");
console.log("====================================================");
