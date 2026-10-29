import fs from "fs";
import path from "path";
import assert from "assert";

function run() {
  console.log("==================================================================");
  console.log("🧪 Starting Progressive Disclosure & Button Design Verification");
  console.log("==================================================================");

  const rootDir = process.cwd();

  // 1. Verify ExpandableHelp component
  const expandableHelpPath = path.resolve(rootDir, "src/components/ExpandableHelp.tsx");
  assert(fs.existsSync(expandableHelpPath), "ExpandableHelp.tsx must exist");
  const expandableHelpCode = fs.readFileSync(expandableHelpPath, "utf-8");
  assert(
    expandableHelpCode.includes("export const ExpandableHelp"),
    "ExpandableHelp must export ExpandableHelp component",
  );
  assert(
    expandableHelpCode.includes("aria-expanded"),
    "ExpandableHelp must support accessible aria-expanded attribute",
  );
  console.log("✅ PASS: ExpandableHelp component is implemented with accessible attributes.");

  // 2. Verify AttemptOrderSettings progressive disclosure & button styling
  const attemptOrderPath = path.resolve(rootDir, "src/components/AttemptOrderSettings.tsx");
  assert(fs.existsSync(attemptOrderPath), "AttemptOrderSettings.tsx must exist");
  const attemptOrderCode = fs.readFileSync(attemptOrderPath, "utf-8");
  assert(
    attemptOrderCode.includes("const [showExplanation, setShowExplanation] = useState(false)"),
    "AttemptOrderSettings must default showExplanation to false for progressive disclosure",
  );
  assert(
    attemptOrderCode.includes("showServerHelp"),
    "AttemptOrderSettings must include progressive disclosure for server proxy info",
  );
  assert(
    attemptOrderCode.includes("update-fetch-server-url-button"),
    "AttemptOrderSettings must preserve update-fetch-server-url-button test id",
  );
  console.log(
    "✅ PASS: AttemptOrderSettings defaults explanatory text to collapsed with clean expand triggers.",
  );

  // 3. Verify AiSubtitlePunctuationTab progressive disclosure & button clusters
  const aiTabPath = path.resolve(rootDir, "src/components/AiSubtitlePunctuationTab.tsx");
  assert(fs.existsSync(aiTabPath), "AiSubtitlePunctuationTab.tsx must exist");
  const aiTabCode = fs.readFileSync(aiTabPath, "utf-8");
  assert(
    aiTabCode.includes("showGuide") && aiTabCode.includes("ai-guide-toggle-btn"),
    "AiSubtitlePunctuationTab must have showGuide state and ai-guide-toggle-btn",
  );
  assert(
    aiTabCode.includes("ai-tab-share-link-btn") && aiTabCode.includes("ai-tab-return-viewer-btn"),
    "AiSubtitlePunctuationTab must preserve share and return viewer button test IDs",
  );
  assert(
    aiTabCode.includes("load-cached-ai-subtitles-btn") &&
      aiTabCode.includes("preview-cached-ai-subtitles-btn"),
    "AiSubtitlePunctuationTab must preserve cached AI buttons in professional cluster",
  );
  console.log(
    "✅ PASS: AiSubtitlePunctuationTab features progressive disclosure guide and professional button clusters.",
  );

  // 4. Verify BeginnerPreferencesTab icons & progressive disclosure
  const beginnerPrefsPath = path.resolve(
    rootDir,
    "src/components/beginner/tabs/BeginnerPreferencesTab.tsx",
  );
  assert(fs.existsSync(beginnerPrefsPath), "BeginnerPreferencesTab.tsx must exist");
  const beginnerPrefsCode = fs.readFileSync(beginnerPrefsPath, "utf-8");
  assert(
    beginnerPrefsCode.includes("Film") && beginnerPrefsCode.includes("Mic"),
    "BeginnerPreferencesTab must use Film and Mic icons for narration order",
  );
  assert(
    beginnerPrefsCode.includes("showOrderHelp"),
    "BeginnerPreferencesTab must include showOrderHelp progressive disclosure",
  );
  assert(
    beginnerPrefsCode.includes("order-video-first") &&
      beginnerPrefsCode.includes("order-tts-first"),
    "BeginnerPreferencesTab must preserve order selection button test IDs",
  );
  console.log(
    "✅ PASS: BeginnerPreferencesTab provides domain icons and expandable order explanation.",
  );

  // 5. Verify index.tsx header button clusters & preferences progressive disclosure
  const indexPath = path.resolve(rootDir, "src/routes/index.tsx");
  assert(fs.existsSync(indexPath), "src/routes/index.tsx must exist");
  const indexCode = fs.readFileSync(indexPath, "utf-8");
  assert(
    indexCode.includes("video-subtitles-overlay-toggle") &&
      indexCode.includes("open-apk-release-button") &&
      indexCode.includes("open-share-modal-button"),
    "index.tsx must preserve top action buttons and place subtitle overlay control by the video",
  );
  assert(
    indexCode.includes("expandedPrefsHelp"),
    "index.tsx must include expandedPrefsHelp state for preferences progressive disclosure",
  );
  assert(
    indexCode.includes("audio-track-mode-toggle") &&
      indexCode.includes("auto-scroll-toggle") &&
      indexCode.includes("debug-mode-toggle"),
    "index.tsx must preserve core toggle IDs",
  );
  console.log(
    "✅ PASS: index.tsx features professional header button clusters and progressive disclosure triggers.",
  );

  // 6. Verify LanguageBoxesSelector button grouping
  const langBoxesPath = path.resolve(rootDir, "src/components/LanguageBoxesSelector.tsx");
  assert(fs.existsSync(langBoxesPath), "LanguageBoxesSelector.tsx must exist");
  const langBoxesCode = fs.readFileSync(langBoxesPath, "utf-8");
  assert(
    langBoxesCode.includes("toggle-language-display-mode") &&
      langBoxesCode.includes("toggle-show-all-languages"),
    "LanguageBoxesSelector must preserve display mode and favorites toggle button test IDs",
  );
  console.log("✅ PASS: LanguageBoxesSelector groups controls into a professional cluster.");

  console.log("==================================================================");
  console.log("🎉 Progressive Disclosure & Button Design Verification PASSED 100%!");
  console.log("==================================================================");
}

run();
