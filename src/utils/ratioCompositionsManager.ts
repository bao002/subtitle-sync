/**
 * Language Ratio Compositions Manager
 *
 * Facilitates setting up, storing, naming, and switching between different
 * language ratio compositions (presets) for language learning goals.
 */

export interface LearningProfileConfig {
  maxWordsPerSentence?: number;
  skipIncompleteSentences?: boolean;
  sectionOrder?: "video-first" | "tts-first" | "in-between";
  rates?: Record<string, number>;
  ttsLanguageOrders?: Record<string, number>;
}

export interface LanguageRatioComposition {
  id: string;
  name: string;
  ratios: Record<string, number>;
  isBuiltIn?: boolean;
  createdAt?: number;
  // Learning Profile extensions
  maxWordsPerSentence?: number;
  skipIncompleteSentences?: boolean;
  sectionOrder?: "video-first" | "tts-first" | "in-between";
  rates?: Record<string, number>;
  ttsLanguageOrders?: Record<string, number>;
}

export const RATIO_COMPOSITIONS_STORAGE_KEY = "yt_language_ratio_compositions_v1";
export const ACTIVE_RATIO_COMPOSITION_KEY = "yt_active_ratio_composition_id_v1";

export const BUILT_IN_COMPOSITIONS: LanguageRatioComposition[] = [
  {
    id: "builtin_equal_1_1",
    name: "Equal Practice (1:1)",
    ratios: { default: 1 },
    isBuiltIn: true,
  },
  {
    id: "builtin_alternating_1_2",
    name: "Alternating Target (1:2)",
    ratios: { default: 2 },
    isBuiltIn: true,
  },
  {
    id: "builtin_target_immersion_1_3",
    name: "Target Immersion (1:3)",
    ratios: { default: 3 },
    isBuiltIn: true,
  },
  {
    id: "builtin_light_review_1_5",
    name: "Light Review (1:5)",
    ratios: { default: 5 },
    isBuiltIn: true,
  },
];

function getCompositionsStorage(): Storage | null {
  if (typeof window !== "undefined" && window.localStorage) return window.localStorage;
  if (
    typeof globalThis !== "undefined" &&
    (globalThis as unknown as { localStorage?: Storage }).localStorage
  ) {
    return (globalThis as unknown as { localStorage: Storage }).localStorage;
  }
  return null;
}

/**
 * Returns all stored language ratio compositions including built-in presets and user-created presets.
 */
export function getStoredRatioCompositions(): LanguageRatioComposition[] {
  const s = getCompositionsStorage();
  if (!s) {
    return BUILT_IN_COMPOSITIONS;
  }
  try {
    const raw = s.getItem(RATIO_COMPOSITIONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Merge built-in presets with user stored presets
        const userSaved = parsed.filter((c) => !c.isBuiltIn);
        return [...BUILT_IN_COMPOSITIONS, ...userSaved];
      }
    }
  } catch {
    // ignore parse errors
  }
  return BUILT_IN_COMPOSITIONS;
}

/**
 * Saves a new named language learning profile composition.
 */
export function saveRatioComposition(
  name: string,
  ratios: Record<string, number>,
  profileConfig?: LearningProfileConfig,
): LanguageRatioComposition {
  const cleanName = name.trim();
  if (!cleanName) {
    throw new Error("Composition name cannot be empty");
  }

  const id = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const cleanRatios: Record<string, number> = {};
  for (const [k, v] of Object.entries(ratios)) {
    if (typeof v === "number" && v > 0) {
      cleanRatios[k] = Math.max(1, Math.round(v));
    }
  }

  const newComposition: LanguageRatioComposition = {
    id,
    name: cleanName,
    ratios: cleanRatios,
    isBuiltIn: false,
    createdAt: Date.now(),
    maxWordsPerSentence: profileConfig?.maxWordsPerSentence,
    skipIncompleteSentences: profileConfig?.skipIncompleteSentences,
    sectionOrder: profileConfig?.sectionOrder,
    rates: profileConfig?.rates ? { ...profileConfig.rates } : undefined,
    ttsLanguageOrders: profileConfig?.ttsLanguageOrders
      ? { ...profileConfig.ttsLanguageOrders }
      : undefined,
  };

  const s = getCompositionsStorage();
  if (s) {
    try {
      const current = getStoredRatioCompositions().filter((c) => !c.isBuiltIn);
      const updated = [...current, newComposition];
      s.setItem(RATIO_COMPOSITIONS_STORAGE_KEY, JSON.stringify(updated));
      setActiveRatioCompositionId(id);
    } catch {
      // ignore storage error
    }
  }

  return newComposition;
}

/**
 * Updates an existing custom ratio composition / learning profile by ID.
 * Supports updating name, ratios, speech rates, and other profile config options.
 */
export function updateRatioComposition(
  id: string,
  updates: Partial<Omit<LanguageRatioComposition, "id" | "isBuiltIn" | "createdAt">>,
): LanguageRatioComposition | null {
  const s = getCompositionsStorage();
  if (!s) return null;
  try {
    const raw = s.getItem(RATIO_COMPOSITIONS_STORAGE_KEY);
    if (!raw) return null;
    const list: LanguageRatioComposition[] = JSON.parse(raw);
    const index = list.findIndex((c) => c.id === id);
    if (index === -1) return null;

    const existing = list[index];
    const updated: LanguageRatioComposition = {
      ...existing,
      name:
        updates.name !== undefined && updates.name.trim()
          ? updates.name.trim()
          : existing.name,
      ratios: updates.ratios !== undefined ? { ...updates.ratios } : existing.ratios,
      rates: updates.rates !== undefined ? { ...updates.rates } : existing.rates,
      maxWordsPerSentence:
        updates.maxWordsPerSentence !== undefined
          ? updates.maxWordsPerSentence
          : existing.maxWordsPerSentence,
      skipIncompleteSentences:
        updates.skipIncompleteSentences !== undefined
          ? updates.skipIncompleteSentences
          : existing.skipIncompleteSentences,
      sectionOrder:
        updates.sectionOrder !== undefined ? updates.sectionOrder : existing.sectionOrder,
      ttsLanguageOrders:
        updates.ttsLanguageOrders !== undefined
          ? { ...updates.ttsLanguageOrders }
          : existing.ttsLanguageOrders,
    };

    list[index] = updated;
    s.setItem(RATIO_COMPOSITIONS_STORAGE_KEY, JSON.stringify(list));
    return updated;
  } catch {
    return null;
  }
}

/**
 * Deletes a user-saved ratio composition by ID. Built-in compositions cannot be deleted.
 */
export function deleteRatioComposition(id: string): boolean {
  const s = getCompositionsStorage();
  if (!s) return false;
  try {
    const current = getStoredRatioCompositions().filter((c) => !c.isBuiltIn);
    const updated = current.filter((c) => c.id !== id);
    s.setItem(RATIO_COMPOSITIONS_STORAGE_KEY, JSON.stringify(updated));
    if (getActiveRatioCompositionId() === id) {
      setActiveRatioCompositionId(BUILT_IN_COMPOSITIONS[0].id);
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Gets the active ratio composition ID.
 */
export function getActiveRatioCompositionId(): string {
  const s = getCompositionsStorage();
  if (!s) return BUILT_IN_COMPOSITIONS[0].id;
  try {
    return (
      s.getItem(ACTIVE_RATIO_COMPOSITION_KEY) ||
      BUILT_IN_COMPOSITIONS[0].id
    );
  } catch {
    return BUILT_IN_COMPOSITIONS[0].id;
  }
}

/**
 * Sets the active ratio composition ID.
 */
export function setActiveRatioCompositionId(id: string): void {
  const s = getCompositionsStorage();
  if (!s) return;
  try {
    s.setItem(ACTIVE_RATIO_COMPOSITION_KEY, id);
  } catch {
    // ignore
  }
}

/**
 * Computes resolved language ratios for a given composition against active languages.
 */
export function resolveCompositionRatios(
  composition: LanguageRatioComposition,
  languages: string[],
  primaryLang?: string,
): Record<string, number> {
  const result: Record<string, number> = {};
  const defaultVal = composition.ratios.default || 1;

  for (const lang of languages) {
    if (primaryLang && lang === primaryLang) {
      result[lang] = 1;
    } else if (typeof composition.ratios[lang] === "number") {
      result[lang] = composition.ratios[lang];
    } else {
      result[lang] = defaultVal;
    }
  }

  return result;
}
