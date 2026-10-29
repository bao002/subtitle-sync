import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

console.log("=== Verifying Language Accordion UX Enhancements ===");

const rootDir = process.cwd();
const routesIndexPath = path.join(rootDir, "src/routes/index.tsx");
const boxesSelectorPath = path.join(rootDir, "src/components/LanguageBoxesSelector.tsx");

assert.ok(fs.existsSync(routesIndexPath), "src/routes/index.tsx must exist");
assert.ok(fs.existsSync(boxesSelectorPath), "LanguageBoxesSelector.tsx must exist");

const routesContent = fs.readFileSync(routesIndexPath, "utf-8");
const boxesContent = fs.readFileSync(boxesSelectorPath, "utf-8");

// 1. Verify star icons are removed from language entries
assert.ok(
  !boxesContent.includes("⭐ Favorites"),
  "LanguageBoxesSelector must not have star icon in Favorites label",
);
assert.ok(
  !boxesContent.includes("⭐ Favorites Only"),
  "LanguageBoxesSelector must not have star icon in Favorites Only toggle",
);
assert.ok(
  !routesContent.includes("★ Save as Favorites"),
  "Language accordion must not use star icon in Save as Favorites button",
);
assert.ok(
  !routesContent.includes("⭐ Global favorites:"),
  "Language accordion must not use star icon in Global favorites label",
);
console.log("✔ Star icons removed from language UI");

// 2. Verify clarification of App-wide Favorite Learning Languages
assert.ok(
  routesContent.includes("Favorite Languages (App-wide)") ||
    routesContent.includes("Favorite Learning Languages"),
  "Language accordion must clarify App-wide favorite languages concept",
);
console.log("✔ Clarification of App-wide favorite languages verified");

// 3. Verify demo limitation disclaimer
assert.ok(
  routesContent.includes('data-testid="demo-languages-disclaimer"'),
  "Language accordion must contain demo-languages-disclaimer",
);
assert.ok(
  routesContent.includes("L2Ryrr6txwA"),
  "Disclaimer must cite the demo fixture video ID L2Ryrr6txwA",
);
console.log("✔ Demo language limitation disclaimer verified");

// 4. Verify easy non-icon Favorite adding and toggling
assert.ok(
  routesContent.includes('data-testid="quick-add-favorite-select"'),
  "Language accordion must have quick-add-favorite-select dropdown",
);
assert.ok(
  routesContent.includes("fav-table-toggle-"),
  "Unified languages table must contain fav-table-toggle buttons",
);
assert.ok(
  routesContent.includes("handleToggleFavoriteLanguage"),
  "src/routes/index.tsx must provide handleToggleFavoriteLanguage helper",
);
console.log("✔ Non-icon favorite add/toggle controls verified");

console.log("🎉 All Language Accordion UX tests passed successfully!");
