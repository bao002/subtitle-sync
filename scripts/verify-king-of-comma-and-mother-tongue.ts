import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
import {
  resolveKingOfComma,
  analyzeDefaultSubtitlesPunctuation,
} from "../src/utils/subtitlePunctuationStats";
import {
  generateMotherTongueFromKingOfComma,
  getMotherTongueLanguage,
  setMotherTongueLanguage,
  getDefaultLanguage,
  MOTHER_TONGUE_LANGUAGE_STORAGE_KEY,
  MOTHER_TONGUE_LANGUAGE_EVENT,
  DEFAULT_LANGUAGE_STORAGE_KEY,
  DEFAULT_LANGUAGE_EVENT,
} from "../src/utils/defaultLanguageManager";

console.log("=== Running verify-king-of-comma-and-mother-tongue.ts ===");

// Minimal browser storage/event polyfill for Node functional tests
const memoryStorage = new Map<string, string>();
const dispatchedEvents: string[] = [];

(globalThis as Record<string, unknown>).window = {
  localStorage: {
    getItem: (k: string) => memoryStorage.get(k) ?? null,
    setItem: (k: string, v: string) => {
      memoryStorage.set(k, v);
    },
    removeItem: (k: string) => {
      memoryStorage.delete(k);
    },
  },
  dispatchEvent: (ev: { type?: string }) => {
    if (ev?.type) dispatchedEvents.push(ev.type);
    return true;
  },
  addEventListener: () => {},
  removeEventListener: () => {},
};
(globalThis as Record<string, unknown>).CustomEvent = class {
  type: string;
  detail: unknown;
  constructor(type: string, init?: { detail?: unknown }) {
    this.type = type;
    this.detail = init?.detail;
  }
};

// 1. Verify resolveKingOfComma selects the language with the most "," commas regardless of track order
const tracks = {
  en: {
    events: [{ tStartMs: 0, dDurationMs: 2000, segs: [{ utf8: "Hello world, friend." }] }], // 1 comma
  },
  es: {
    events: [
      {
        tStartMs: 0,
        dDurationMs: 4000,
        segs: [{ utf8: "Hola, amigos, hoy, vamos, a, practicar, mucho." }], // 6 commas
      },
    ],
  },
  fr: {
    events: [
      { tStartMs: 0, dDurationMs: 2000, segs: [{ utf8: "Bonjour, tout le monde, oui." }] }, // 2 commas
    ],
  },
  empty: { events: [] },
};

const result = resolveKingOfComma(tracks, ["en", "fr", "es", "empty"], "en");
assert.strictEqual(
  result.kingOfCommaLang,
  "es",
  "king-of-comma must select 'es' (6 commas) over 'en' (1) even when 'en' is active",
);
assert.strictEqual(result.maxCommas, 6, "maxCommas must equal 6");
assert.strictEqual(result.statsMap.empty, undefined, "empty tracks must not compete");

const analysis = analyzeDefaultSubtitlesPunctuation(["en", "es"], tracks, "en");
assert.strictEqual(
  analysis.kingOfCommaLang,
  analysis.recommendedLang,
  "analyzeDefaultSubtitlesPunctuation must expose kingOfCommaLang matching recommendedLang",
);
console.log("✓ resolveKingOfComma accurately picks highest-',' track even over active fallback");

// 2. Verify zero-comma and null tracks handling
assert.deepStrictEqual(
  resolveKingOfComma(null),
  { kingOfCommaLang: null, maxCommas: 0, statsMap: {} },
  "null tracks must cleanly return null kingOfCommaLang",
);
const zeroComma = resolveKingOfComma({
  en: { events: [{ segs: [{ utf8: "No commas here." }] }] },
});
assert.strictEqual(
  zeroComma.kingOfCommaLang,
  null,
  "Zero comma tracks return null kingOfCommaLang",
);
console.log("✓ Zero-comma & empty track edge cases verified");

// 3. Verify mother-tongue-language is generated from king-of-comma and acts as default-language
const mtFromKing = generateMotherTongueFromKingOfComma(result.kingOfCommaLang, "en");
assert.strictEqual(
  mtFromKing,
  "es",
  "mother-tongue-language must be generated directly from king-of-comma ('es')",
);
assert.strictEqual(
  generateMotherTongueFromKingOfComma("iw", "en"),
  "he",
  "Legacy 'iw' code must normalize to 'he' when generating mother-tongue-language",
);
assert.strictEqual(
  generateMotherTongueFromKingOfComma(null, "fr"),
  "fr",
  "Fallback applies when king-of-comma is not yet available",
);

setMotherTongueLanguage(mtFromKing, true);
assert.strictEqual(
  memoryStorage.get(MOTHER_TONGUE_LANGUAGE_STORAGE_KEY),
  "es",
  "setMotherTongueLanguage must persist MOTHER_TONGUE_LANGUAGE_STORAGE_KEY",
);
assert.strictEqual(
  memoryStorage.get(DEFAULT_LANGUAGE_STORAGE_KEY),
  "es",
  "mother-tongue-language must act as default-language and sync DEFAULT_LANGUAGE_STORAGE_KEY",
);
assert.strictEqual(getMotherTongueLanguage(), "es");
assert.strictEqual(getDefaultLanguage(), "es");
assert(
  dispatchedEvents.includes(MOTHER_TONGUE_LANGUAGE_EVENT),
  "Must dispatch mother-tongue event",
);
assert(dispatchedEvents.includes(DEFAULT_LANGUAGE_EVENT), "Must dispatch default-language event");
console.log("✓ mother-tongue-language generated from king-of-comma and synced as default-language");

// 4. Verify UI exposure in SwitchableDefaultSubtitlesBar.tsx (#switchable-default-subtitles-bar)
const root = process.cwd();
const barContent = fs.readFileSync(
  path.join(root, "src/components/SwitchableDefaultSubtitlesBar.tsx"),
  "utf8",
);
assert(barContent.includes('id="switchable-default-subtitles-bar"'));
assert(barContent.includes("data-king-of-comma="), "Must expose data-king-of-comma attribute");
assert(
  barContent.includes("data-mother-tongue-language="),
  "Must expose data-mother-tongue-language attribute",
);
assert(
  barContent.includes('data-testid="king-of-comma-summary"'),
  "Must render king-of-comma-summary badge",
);
assert(
  barContent.includes('data-testid="mother-tongue-language-badge"'),
  "Must render mother-tongue-language-badge",
);
assert(
  barContent.includes("king-of-comma-badge-"),
  "Must render king-of-comma-badge-{langCode} on winning track button",
);
assert(
  barContent.includes('data-testid="reset-to-king-of-comma-btn"'),
  "Must render reset-to-king-of-comma-btn when overridden",
);
console.log("✓ SwitchableDefaultSubtitlesBar UI contracts verified");

// 5. Verify auto-selection wiring & Beginner/Advanced parity in src/routes/index.tsx
const indexContent = fs.readFileSync(path.join(root, "src/routes/index.tsx"), "utf8");
assert(
  indexContent.includes("resolveKingOfComma") &&
    indexContent.includes("generateMotherTongueFromKingOfComma") &&
    indexContent.includes("setMotherTongueLanguage"),
  "src/routes/index.tsx must wire resolveKingOfComma + generateMotherTongueFromKingOfComma + setMotherTongueLanguage",
);
const mtPropsCount = (indexContent.match(/motherTongueLanguage=/g) || []).length;
assert(
  mtPropsCount >= 2,
  `Both Beginner and Advanced SwitchableDefaultSubtitlesBar instances must receive motherTongueLanguage (found ${mtPropsCount})`,
);
const resetPropsCount = (indexContent.match(/onResetToKingOfComma=/g) || []).length;
assert(
  resetPropsCount >= 2,
  `Both Beginner and Advanced SwitchableDefaultSubtitlesBar instances must receive onResetToKingOfComma (found ${resetPropsCount})`,
);
console.log(
  `✓ Automatic base-language selection & Beginner/Advanced parity verified (${mtPropsCount} instances)`,
);

console.log("=== All verify-king-of-comma-and-mother-tongue assertions passed! ===");
