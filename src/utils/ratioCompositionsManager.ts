/**
 * Language Ratio Compositions Manager
 *
 * Facilitates setting up, storing, naming, and switching between different
 * language ratio compositions (presets) for language learning goals.
 */

export interface LanguageRatioComposition {
  id: string;
  name: string;
  ratios: Record<string, number>;
  isBuiltIn?: boolean;
  createdAt?: number;
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

/**
 * Returns all stored language ratio compositions including built-in presets and user-created presets.
 */
export function getStoredRatioCompositions(): LanguageRatioComposition[] {
  if (typeof window === "undefined") {
    return BUILT_IN_COMPOSITIONS;
  }
  try {
    const raw = window.localStorage.getItem(RATIO_COMPOSITIONS_STORAGE_KEY);
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
 * Saves a new named language ratio composition.
 */
export function saveRatioComposition(
  name: string,
  ratios: Record<string, number>,
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
  };

  if (typeof window !== "undefined") {
    try {
      const current = getStoredRatioCompositions().filter((c) => !c.isBuiltIn);
      const updated = [...current, newComposition];
      window.localStorage.setItem(RATIO_COMPOSITIONS_STORAGE_KEY, JSON.stringify(updated));
      setActiveRatioCompositionId(id);
    } catch {
      // ignore storage error
    }
  }

  return newComposition;
}

/**
 * Deletes a user-saved ratio composition by ID. Built-in compositions cannot be deleted.
 */
export function deleteRatioComposition(id: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const current = getStoredRatioCompositions().filter((c) => !c.isBuiltIn);
    const updated = current.filter((c) => c.id !== id);
    window.localStorage.setItem(RATIO_COMPOSITIONS_STORAGE_KEY, JSON.stringify(updated));
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
  if (typeof window === "undefined") return BUILT_IN_COMPOSITIONS[0].id;
  try {
    return (
      window.localStorage.getItem(ACTIVE_RATIO_COMPOSITION_KEY) ||
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
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ACTIVE_RATIO_COMPOSITION_KEY, id);
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
