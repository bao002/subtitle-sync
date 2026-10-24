import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const accordion = fs.readFileSync(path.join(root, "src/components/AccordionSection.tsx"), "utf8");
const route = fs.readFileSync(path.join(root, "src/routes/index.tsx"), "utf8");

assert(
  accordion.includes("onToggleWide?: () => void") &&
    accordion.includes("data-testid={`accordion-width-${id}`}") &&
    accordion.includes("onToggleWide();") &&
    accordion.includes("event.preventDefault();"),
  "Accordion header must expose an accessible width toggle without toggling accordion state",
);
assert(
  accordion.includes("wide ? `Set ${title} to half width` : `Set ${title} to full width`") &&
    accordion.includes('wide ? "Set to half width" : "Set to full width"'),
  "Width toggle must communicate the available half/full-width action",
);
assert(
  route.includes("const [subtitlesPanelWide, setSubtitlesPanelWide] = useState(true)") &&
    route.includes('wide={panelId === "subtitles" && subtitlesPanelWide}') &&
    route.includes(
      'panelId === "subtitles"\n                          ? () => setSubtitlesPanelWide((wide) => !wide)',
    ),
  "Parallel subtitles accordion must default to full width and toggle between full and half width",
);
assert(
  route.includes('<div className="grid items-start gap-4 p-4 md:p-6 lg:grid-cols-2">'),
  "Half-width subtitles layout must use the existing two-column accordion grid",
);

console.log("PASS: parallel subtitles accordion toggles between full and half width.");
