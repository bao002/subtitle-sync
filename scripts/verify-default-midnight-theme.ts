import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { DEFAULT_APP_SETTINGS } from "../src/utils/appSettings";

console.log("=========================================================================");
console.log("🧪 Running Dedicated Verification: Default Midnight Theme (Task 262)");
console.log("=========================================================================");

const rootDir = process.cwd();

// Test 1: src/routes/index.tsx default theme state is dark-blue (Midnight)
console.log("\n[Test 1] Verifying default theme state in src/routes/index.tsx...");
const indexPath = path.resolve(rootDir, "src/routes/index.tsx");
assert.ok(fs.existsSync(indexPath), "src/routes/index.tsx must exist");
const indexContent = fs.readFileSync(indexPath, "utf-8");

assert.ok(
  indexContent.includes('const [theme, setTheme] = useState<Theme>("dark-blue");'),
  'src/routes/index.tsx must initialize theme state with "dark-blue"',
);
console.log('✅ PASS: theme state initialized to "dark-blue" (Midnight)');

// Test 2: LocalStorage fallback defaults to dark-blue when unset
console.log("\n[Test 2] Verifying localStorage fallback in src/routes/index.tsx...");
assert.ok(
  indexContent.includes('setTheme("dark-blue");'),
  'src/routes/index.tsx must fallback to "dark-blue" when no saved theme exists',
);
console.log('✅ PASS: fallback theme is "dark-blue" (Midnight)');

// Test 3: index.html has dark and dark-blue classes on the html root
console.log("\n[Test 3] Verifying initial html tag classes in index.html...");
const htmlPath = path.resolve(rootDir, "index.html");
assert.ok(fs.existsSync(htmlPath), "index.html must exist");
const htmlContent = fs.readFileSync(htmlPath, "utf-8");

assert.ok(
  htmlContent.includes('<html lang="en" class="dark dark-blue">'),
  'index.html must have class="dark dark-blue" on <html lang="en"> to prevent flash',
);
console.log('✅ PASS: index.html has class="dark dark-blue" configured by default');

// Test 4: DEFAULT_APP_SETTINGS defaults theme to midnight
console.log("\n[Test 4] Verifying DEFAULT_APP_SETTINGS.theme in src/utils/appSettings.ts...");
assert.strictEqual(
  DEFAULT_APP_SETTINGS.theme,
  "midnight",
  'DEFAULT_APP_SETTINGS.theme must be "midnight"',
);
console.log('✅ PASS: DEFAULT_APP_SETTINGS.theme is "midnight"');

// Test 5: Theme selector in src/routes/index.tsx contains Midnight mapped to dark-blue
console.log("\n[Test 5] Verifying Midnight theme option in theme selector...");
assert.ok(
  indexContent.includes('{ id: "dark-blue", label: "Midnight", icon: Sparkles }'),
  'src/routes/index.tsx theme selector must contain id: "dark-blue" with label: "Midnight"',
);
console.log('✅ PASS: Midnight theme option correctly configured in segmented control');

// Test 6: CSS definition of .dark-blue in src/styles.css
console.log("\n[Test 6] Verifying .dark-blue definitions in src/styles.css...");
const cssPath = path.resolve(rootDir, "src/styles.css");
const cssContent = fs.readFileSync(cssPath, "utf-8");
assert.ok(cssContent.includes(".dark-blue {"), "src/styles.css must contain .dark-blue { rule");
assert.ok(
  cssContent.includes("@custom-variant dark (&:is(.dark *, .dark-blue *, .dark, .dark-blue));"),
  "src/styles.css must include .dark-blue in custom dark variant",
);
console.log("✅ PASS: .dark-blue CSS definitions and variants verified");

console.log("\n=========================================================================");
console.log("🎉 ALL DEFAULT MIDNIGHT THEME CHECKS PASSED 100%!");
console.log("=========================================================================");
