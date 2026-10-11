import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("====================================================");
console.log("🧪 Starting Index Route Decomposition & Modularity Test");
console.log("====================================================");

const rootDir = process.cwd();
const indexTsxPath = path.join(rootDir, "src/routes/index.tsx");
assert(fs.existsSync(indexTsxPath), "src/routes/index.tsx must exist");
const indexContent = fs.readFileSync(indexTsxPath, "utf8");

// 1. Verify AccordionSection component extraction
const accordionPath = path.join(rootDir, "src/components/AccordionSection.tsx");
assert(fs.existsSync(accordionPath), "src/components/AccordionSection.tsx must exist");
const accordionContent = fs.readFileSync(accordionPath, "utf8");
assert(
  accordionContent.includes("export function AccordionSection(") &&
    accordionContent.includes("data-accordion-type={id}") &&
    accordionContent.includes("data-testid={`accordion-bar-${id}`}"),
  "AccordionSection must be an exported component with accordion semantics",
);
console.log("✅ PASS: AccordionSection extracted into dedicated modular component");

// 2. Verify HighlightedSubtitle component extraction
const highlightedPath = path.join(rootDir, "src/components/HighlightedSubtitle.tsx");
assert(fs.existsSync(highlightedPath), "src/components/HighlightedSubtitle.tsx must exist");
const highlightedContent = fs.readFileSync(highlightedPath, "utf8");
assert(
  highlightedContent.includes("export function HighlightedSubtitle("),
  "HighlightedSubtitle must be an exported component",
);
console.log("✅ PASS: HighlightedSubtitle extracted into dedicated modular component");

// 3. Verify SubtitleRow component extraction
const subtitleRowPath = path.join(rootDir, "src/components/SubtitleRow.tsx");
assert(fs.existsSync(subtitleRowPath), "src/components/SubtitleRow.tsx must exist");
const subtitleRowContent = fs.readFileSync(subtitleRowPath, "utf8");
assert(
  subtitleRowContent.includes("export const SubtitleRow = memo(") &&
    subtitleRowContent.includes("subtitle-cue-row-"),
  "SubtitleRow must be an exported memoized component",
);
console.log("✅ PASS: SubtitleRow extracted into dedicated modular component");

// 4. Verify SubtitlesTablePanel component extraction
const tablePanelPath = path.join(rootDir, "src/components/SubtitlesTablePanel.tsx");
assert(fs.existsSync(tablePanelPath), "src/components/SubtitlesTablePanel.tsx must exist");
const tablePanelContent = fs.readFileSync(tablePanelPath, "utf8");
assert(
  tablePanelContent.includes("export function SubtitlesTablePanel(") &&
    tablePanelContent.includes('id="subtitles-table-panel"'),
  "SubtitlesTablePanel must be an exported component encapsulating the subtitles table",
);
console.log("✅ PASS: SubtitlesTablePanel extracted into dedicated modular component");

// 5. Verify ApkReleasesFooter component extraction
const footerPath = path.join(rootDir, "src/components/ApkReleasesFooter.tsx");
assert(fs.existsSync(footerPath), "src/components/ApkReleasesFooter.tsx must exist");
const footerContent = fs.readFileSync(footerPath, "utf8");
assert(
  footerContent.includes("export function ApkReleasesFooter(") &&
    footerContent.includes('id="apk-releases-footer"'),
  "ApkReleasesFooter must be an exported component",
);
console.log("✅ PASS: ApkReleasesFooter extracted into dedicated modular component");

// 6. Verify src/routes/index.tsx imports and integrates all modular components
assert(
  indexContent.includes('from "@/components/AccordionSection"') ||
    indexContent.includes('from "./../components/AccordionSection"'),
  "src/routes/index.tsx must import AccordionSection",
);
assert(
  indexContent.includes('from "@/components/SubtitlesTablePanel"') ||
    indexContent.includes('from "./../components/SubtitlesTablePanel"'),
  "src/routes/index.tsx must import SubtitlesTablePanel",
);
assert(
  indexContent.includes('from "@/components/ApkReleasesFooter"') ||
    indexContent.includes('from "./../components/ApkReleasesFooter"'),
  "src/routes/index.tsx must import ApkReleasesFooter",
);
console.log("✅ PASS: src/routes/index.tsx cleanly integrates modular components");

console.log("====================================================");
console.log("🎉 All Index Route Decomposition tests PASSED successfully!");
console.log("====================================================");
