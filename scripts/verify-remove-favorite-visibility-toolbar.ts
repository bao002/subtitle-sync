import fs from "fs";
import path from "path";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${message}`);
}

console.log("====================================================");
console.log("🧪 Verifying Removal of Favorite Visibility Toolbar (Task 260)");
console.log("====================================================");

const indexFile = path.join(process.cwd(), "src/routes/index.tsx");
assert(fs.existsSync(indexFile), "src/routes/index.tsx exists");
const indexContent = fs.readFileSync(indexFile, "utf-8");

assert(
  !indexContent.includes('data-testid="favorite-visibility-toolbar"'),
  "favorite-visibility-toolbar is removed completely from src/routes/index.tsx",
);

assert(
  !indexContent.includes("favorite-visibility-item-"),
  "favorite-visibility-item buttons are removed completely from src/routes/index.tsx",
);

assert(
  !indexContent.includes("Favorite subtitle visibility"),
  "Favorite subtitle visibility heading text is removed completely from src/routes/index.tsx",
);

console.log("====================================================");
console.log("🎉 ALL FAVORITE VISIBILITY TOOLBAR REMOVAL CHECKS PASSED!");
console.log("====================================================");
