import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

console.log("=========================================================================");
console.log("🧪 Verifying Hotfix: Maximum Update Depth Exceeded Prevention (Prompt 154)");
console.log("=========================================================================");

const rootDir = process.cwd();

// --- Test 1: FloatingSubtitleRetryIndicator.tsx Memoization & Dependency Stabilization ---
console.log("\nTest 1: Auditing FloatingSubtitleRetryIndicator.tsx...");
const floatingRetrySource = fs.readFileSync(
  path.resolve(rootDir, "src/components/FloatingSubtitleRetryIndicator.tsx"),
  "utf8",
);
assert.ok(
  floatingRetrySource.includes("const pendingLanguages = useMemo("),
  "FloatingSubtitleRetryIndicator must memoize pendingLanguages with useMemo",
);
assert.ok(
  floatingRetrySource.includes("pendingLanguages.join(\",\")"),
  "FloatingSubtitleRetryIndicator must create primitive pendingKey string for effect dependency",
);
assert.ok(
  floatingRetrySource.includes("const onFetchLanguageRef = useRef(onFetchLanguage);"),
  "FloatingSubtitleRetryIndicator must use ref for onFetchLanguage callback",
);
assert.ok(
  floatingRetrySource.includes("pendingKey"),
  "FloatingSubtitleRetryIndicator effect must depend on primitive pendingKey and stable triggerNextFetch",
);
console.log("✅ PASS: FloatingSubtitleRetryIndicator.tsx memoizes pending collections and stabilizes timers.");

// --- Test 2: NotificationsStatusTab.tsx Memoization & Stabilization ---
console.log("\nTest 2: Auditing NotificationsStatusTab.tsx...");
const notificationsTabSource = fs.readFileSync(
  path.resolve(rootDir, "src/components/NotificationsStatusTab.tsx"),
  "utf8",
);
assert.ok(
  notificationsTabSource.includes("const pendingLanguages = useMemo("),
  "NotificationsStatusTab must memoize pendingLanguages with useMemo",
);
assert.ok(
  notificationsTabSource.includes("const loadedLanguages = useMemo("),
  "NotificationsStatusTab must memoize loadedLanguages with useMemo",
);
assert.ok(
  notificationsTabSource.includes("pendingLanguages.join(\",\")"),
  "NotificationsStatusTab must create primitive pendingKey string for effect dependency",
);
assert.ok(
  notificationsTabSource.includes("const onFetchLanguageRef = useRef(onFetchLanguage);"),
  "NotificationsStatusTab must capture onFetchLanguage in a ref",
);
console.log("✅ PASS: NotificationsStatusTab.tsx memoizes pending languages and prevents cyclic timer re-renders.");

// --- Test 3: FetchedSubtitlesStagePanel.tsx Logging & Auto-selection Guards ---
console.log("\nTest 3: Auditing FetchedSubtitlesStagePanel.tsx...");
const stagePanelSource = fs.readFileSync(
  path.resolve(rootDir, "src/components/FetchedSubtitlesStagePanel.tsx"),
  "utf8",
);
assert.ok(
  stagePanelSource.includes("autoSelectedBaseLangRef = useRef"),
  "FetchedSubtitlesStagePanel must guard onSelectBaseLanguage auto-selection with ref",
);
assert.ok(
  stagePanelSource.includes("lastObservedUrlLoggedRef = useRef"),
  "FetchedSubtitlesStagePanel must guard observedUrl logging with ref",
);
assert.ok(
  stagePanelSource.includes("cachedTracksLoggedRef = useRef"),
  "FetchedSubtitlesStagePanel must guard track caching and log addition with ref set",
);
console.log("✅ PASS: FetchedSubtitlesStagePanel.tsx prevents recursive logging and auto-selection.");

// --- Test 4: BeginnerFlowContainer.tsx Base Language Auto-selection Guard ---
console.log("\nTest 4: Auditing BeginnerFlowContainer.tsx...");
const beginnerFlowSource = fs.readFileSync(
  path.resolve(rootDir, "src/components/beginner/BeginnerFlowContainer.tsx"),
  "utf8",
);
assert.ok(
  beginnerFlowSource.includes("lastAutoSelectedBaseLangRef = useRef<string>(\"\")"),
  "BeginnerFlowContainer must declare lastAutoSelectedBaseLangRef",
);
assert.ok(
  beginnerFlowSource.includes("lastAutoSelectedBaseLangRef.current === defaultLang"),
  "BeginnerFlowContainer must check lastAutoSelectedBaseLangRef before calling onBaseLangChange",
);
console.log("✅ PASS: BeginnerFlowContainer.tsx guards base language selection against infinite cycles.");

// --- Test 5: src/routes/index.tsx Leftmost Column & Captions Stabilization ---
console.log("\nTest 5: Auditing src/routes/index.tsx...");
const indexSource = fs.readFileSync(path.resolve(rootDir, "src/routes/index.tsx"), "utf8");
assert.ok(
  indexSource.includes("const leftmostColCode = cols[0]?.code || baseLanguage;"),
  "index.tsx must extract primitive leftmostColCode",
);
assert.ok(
  indexSource.includes("}, [leftmostColCode, favoriteLanguages]);"),
  "leftmost column effect must depend on primitive leftmostColCode instead of dynamic cols array",
);
assert.ok(
  indexSource.includes("const triggerProgrammaticCaptionsRef = useRef(triggerProgrammaticCaptions);"),
  "index.tsx must capture triggerProgrammaticCaptions in a ref",
);
assert.ok(
  indexSource.includes("}, [videoId, currentAccordionStage]);"),
  "captions grace effect must only depend on videoId and currentAccordionStage",
);
assert.ok(
  indexSource.includes("const handleBeginnerBaseLangChange = useCallback("),
  "index.tsx must memoize handleBeginnerBaseLangChange callback with useCallback",
);
assert.ok(
  indexSource.includes("onBaseLangChange={handleBeginnerBaseLangChange}"),
  "BeginnerFlowContainer must receive memoized handleBeginnerBaseLangChange prop",
);
console.log("✅ PASS: index.tsx stabilizes callbacks, refs, and dependency arrays.");

console.log("=========================================================================");
console.log("🎉 ALL PROMPT 154 MAXIMUM UPDATE DEPTH HOTFIX CHECKS PASSED (5/5)!");
console.log("=========================================================================");
