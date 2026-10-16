import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("====================================================");
console.log("🧪 Starting Web Demo Subtitles Drawer Hidden-by-Default Verification");
console.log("====================================================");

const webDemoUrlsInputPath = path.resolve("src/components/WebDemoUrlsInput.tsx");
assert(fs.existsSync(webDemoUrlsInputPath), "WebDemoUrlsInput.tsx must exist");
const webDemoContent = fs.readFileSync(webDemoUrlsInputPath, "utf-8");

// 1. isExpanded is initialized to false (hidden by default)
const isExpandedDefaultMatch = webDemoContent.match(/const\s+\[isExpanded,\s*setIsExpanded\]\s*=\s*useState\((false)\)/);
assert(
  isExpandedDefaultMatch && isExpandedDefaultMatch[1] === "false",
  "WebDemoUrlsInput must initialize isExpanded state to false so the drawer is hidden by default",
);
console.log("✅ PASS: isExpanded initialized to false (drawer hidden by default)");

// 2. Drawer is conditionally rendered only when isExpanded is true
assert(
  webDemoContent.includes("isExpanded && (") &&
  webDemoContent.includes('data-testid="web-demo-subtitles-drawer"'),
  "WebDemoUrlsInput must conditionally render the subtitles drawer with data-testid='web-demo-subtitles-drawer'",
);
console.log("✅ PASS: Subtitles drawer rendered conditionally when isExpanded is true");

// 3. Toggle button exists with aria-expanded bound to isExpanded
assert(
  webDemoContent.includes('data-testid="toggle-web-demo-subtitles-drawer"') &&
  webDemoContent.includes("aria-expanded={isExpanded}"),
  "Toggle button must have data-testid='toggle-web-demo-subtitles-drawer' and aria-expanded={isExpanded}",
);
console.log("✅ PASS: Toggle button present with correct accessibility aria-expanded attribute");

// 4. Clean single-row YouTube input form is preserved
assert(
  webDemoContent.includes('id="youtube-url-form"') &&
  webDemoContent.includes('id="youtube-url-input"') &&
  webDemoContent.includes('id="play-video-button"'),
  "Clean single-row form elements (youtube-url-form, youtube-url-input, play-video-button) must be present",
);
console.log("✅ PASS: Clean single-row form layout preserved");

// 5. Drawer includes guidance note pointing to Languages table
assert(
  webDemoContent.includes("or configure per language directly in the Languages table below"),
  "Subtitles drawer must include guidance referencing configuring per language in the Languages table",
);
console.log("✅ PASS: Subtitles drawer includes guidance referencing Languages table below");

// 6. Verify alternative ways to input subtitle URLs per language exist:
// a. In LanguageBoxesSelector
const languageBoxesSelectorPath = path.resolve("src/components/LanguageBoxesSelector.tsx");
assert(fs.existsSync(languageBoxesSelectorPath), "LanguageBoxesSelector.tsx must exist");
const languageBoxesContent = fs.readFileSync(languageBoxesSelectorPath, "utf-8");
assert(
  languageBoxesContent.includes("data-testid={`expand-subtitles-url-${lang.code}`}") &&
  languageBoxesContent.includes("data-testid={`lang-box-url-input-${lang.code}`}") &&
  languageBoxesContent.includes("data-testid={`inline-subtitle-url-panel-${lang.code}`}"),
  "LanguageBoxesSelector must have expandable subtitle URL input on language buttons",
);
console.log("✅ PASS: LanguageBoxesSelector has expandable subtitle URL input on each language button");

// b. In Languages table (src/routes/index.tsx)
const indexRoutePath = path.resolve("src/routes/index.tsx");
assert(fs.existsSync(indexRoutePath), "src/routes/index.tsx must exist");
const indexContent = fs.readFileSync(indexRoutePath, "utf-8");
assert(
  indexContent.includes('data-testid={`table-btn-subtitle-url-${l.code}`}') &&
  indexContent.includes('data-testid={`table-url-input-${l.code}`}'),
  "Languages table must have subtitle URL button and input per language row",
);
console.log("✅ PASS: Languages table has dedicated subtitle URL button and input per language row");

console.log("====================================================");
console.log("🎉 All Web Demo Subtitles Drawer Hidden-by-Default checks PASSED!");
console.log("====================================================");
