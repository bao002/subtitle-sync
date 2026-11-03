import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { getAutoScrollSetting } from "../src/utils/appSettings";

async function main() {
  console.log("--> Validating Disablement of Auto-Focus and Auto-Scroll Triggers...");

  const root = path.resolve(".");

  // 1. docs/auto-focus.md exists and contains triggers table
  const docPath = path.join(root, "docs/auto-focus.md");
  assert.ok(fs.existsSync(docPath), "docs/auto-focus.md must exist");
  const docContent = fs.readFileSync(docPath, "utf8");
  assert.ok(
    docContent.includes("| ID | Category | Location | Event / Trigger Mechanism | Former Behavior | Disablement Resolution |"),
    "docs/auto-focus.md must contain markdown table of auto-focus / auto-scroll triggers",
  );
  assert.ok(docContent.includes("DISABLED"), "docs/auto-focus.md must state disablement resolution");
  console.log("✓ docs/auto-focus.md exists with comprehensive triggers table");

  // 2. getAutoScrollSetting defaults to false
  const defaultSetting = getAutoScrollSetting();
  assert.strictEqual(defaultSetting, false, "getAutoScrollSetting must return false");
  console.log("✓ getAutoScrollSetting returns false");

  // 3. LanguageBoxesSelector has no programmatic .focus() calls
  const langBoxesPath = path.join(root, "src/components/LanguageBoxesSelector.tsx");
  const langBoxesContent = fs.readFileSync(langBoxesPath, "utf8");
  assert.ok(
    !langBoxesContent.includes(".focus("),
    "src/components/LanguageBoxesSelector.tsx must not contain programmatic .focus() calls",
  );
  console.log("✓ LanguageBoxesSelector has zero programmatic .focus() calls");

  // 4. index.tsx scrollIntoView calls removed from seek, toast, and tts navigation
  const indexTsxPath = path.join(root, "src/routes/index.tsx");
  const indexTsx = fs.readFileSync(indexTsxPath, "utf8");
  assert.ok(
    !indexTsx.includes('document.getElementById("tts-service-settings-panel")?.scrollIntoView') &&
      !indexTsx.includes('el.scrollIntoView({ behavior: "smooth", block: "center" })'),
    "TTS navigation must not call scrollIntoView",
  );
  assert.ok(
    !indexTsx.includes('rowEl.scrollIntoView({ behavior: "smooth", block: "center" })'),
    "Seek handler must not call scrollIntoView",
  );
  assert.ok(
    !indexTsx.includes('el.scrollIntoView({ behavior: "smooth", block: "start" })'),
    "SubtitleFetchToast must not call scrollIntoView",
  );
  console.log("✓ index.tsx programmatic scrollIntoView triggers removed");

  console.log("All Auto-Focus / Auto-Scroll Disablement checks passed successfully!");
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
