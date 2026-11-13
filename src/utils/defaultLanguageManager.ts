/**
 * Authoritative Single Source of Truth for Default Subtitle Language (src/utils/defaultLanguageManager.ts)
 *
 * Unifies and synchronizes the Default Language parameter across all application surfaces:
 * - Stage 0: Fetched Subtitles Info Stage ("Set as Source")
 * - Stage 1: Learning Goals & Default Language Accordion
 * - Stage 2: Subtitles Table (Leftmost column / Column header "Set as Default" button)
 * - Stage 3: Video Player & Video Playground Switchable Default Subtitles Bar
 * - Stage 4: Settings Stage & Beginner Preferences Tab
 * - Native & Web YouTube Player Captions Track Option
 */

export const DEFAULT_LANGUAGE_STORAGE_KEY = "yt_base_language";
export const DEFAULT_LANGUAGE_EVENT = "yt_default_language_changed";

/**
 * Retrieves the currently persisted default subtitle language from localStorage.
 */
export function getDefaultLanguage(fallback = "en"): string {
  if (typeof window === "undefined" || !window.localStorage) {
    return fallback;
  }
  try {
    const stored = window.localStorage.getItem(DEFAULT_LANGUAGE_STORAGE_KEY);
    return stored && stored.trim() ? stored.trim() : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Persists and broadcasts the new default subtitle language across all application listeners.
 */
export function setDefaultLanguage(lang: string): void {
  if (!lang || typeof lang !== "string") return;
  const normalized = lang.trim();
  if (!normalized) return;

  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.setItem(DEFAULT_LANGUAGE_STORAGE_KEY, normalized);
    } catch {
      // ignore storage quota errors
    }

    try {
      window.dispatchEvent(
        new CustomEvent(DEFAULT_LANGUAGE_EVENT, {
          detail: { lang: normalized },
        }),
      );
    } catch {
      // ignore event dispatch errors
    }
  }
}

/**
 * Subscribes to default language changes across windows/tabs and application components.
 * Returns an unsubscription callback.
 */
export function subscribeDefaultLanguage(listener: (lang: string) => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleCustomEvent = (event: Event) => {
    const customEvent = event as CustomEvent<{ lang?: string }>;
    if (customEvent.detail?.lang) {
      listener(customEvent.detail.lang);
    }
  };

  const handleStorageEvent = (event: StorageEvent) => {
    if (event.key === DEFAULT_LANGUAGE_STORAGE_KEY && event.newValue) {
      listener(event.newValue);
    }
  };

  window.addEventListener(DEFAULT_LANGUAGE_EVENT, handleCustomEvent);
  window.addEventListener("storage", handleStorageEvent);

  return () => {
    window.removeEventListener(DEFAULT_LANGUAGE_EVENT, handleCustomEvent);
    window.removeEventListener("storage", handleStorageEvent);
  };
}

export const MOTHER_TONGUE_LANGUAGE_STORAGE_KEY = "yt_mother_tongue_language";
export const MOTHER_TONGUE_LANGUAGE_EVENT = "yt_mother_tongue_language_changed";

/**
 * Generates `mother-tongue-language` based on `king-of-comma`.
 * `mother-tongue-language` acts as the application's `default-language`.
 */
export function generateMotherTongueFromKingOfComma(
  kingOfCommaLang: string | null | undefined,
  fallbackDefault = "",
): string {
  const raw =
    kingOfCommaLang && typeof kingOfCommaLang === "string" && kingOfCommaLang.trim()
      ? kingOfCommaLang.trim()
      : fallbackDefault && typeof fallbackDefault === "string" && fallbackDefault.trim()
        ? fallbackDefault.trim()
        : "";
  if (!raw) return "";
  return raw === "iw" ? "he" : raw;
}

/**
 * Retrieves the currently active `mother-tongue-language`, falling back to `default-language`.
 */
export function getMotherTongueLanguage(fallback = "en"): string {
  if (typeof window === "undefined" || !window.localStorage) {
    return getDefaultLanguage(fallback);
  }
  try {
    const stored = window.localStorage.getItem(MOTHER_TONGUE_LANGUAGE_STORAGE_KEY);
    if (stored && stored.trim()) {
      return stored.trim();
    }
  } catch {
    // ignore storage errors
  }
  return getDefaultLanguage(fallback);
}

/**
 * Sets `mother-tongue-language` and synchronizes it as `default-language` across the app.
 */
export function setMotherTongueLanguage(lang: string, syncDefaultLanguage = true): void {
  if (!lang || typeof lang !== "string") return;
  const normalized = lang.trim();
  if (!normalized) return;

  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.setItem(MOTHER_TONGUE_LANGUAGE_STORAGE_KEY, normalized);
    } catch {
      // ignore storage quota errors
    }

    try {
      window.dispatchEvent(
        new CustomEvent(MOTHER_TONGUE_LANGUAGE_EVENT, {
          detail: { lang: normalized },
        }),
      );
    } catch {
      // ignore event dispatch errors
    }
  }

  if (syncDefaultLanguage) {
    setDefaultLanguage(normalized);
  }
}

/**
 * Subscribes to `mother-tongue-language` updates across components and tabs.
 */
export function subscribeMotherTongueLanguage(listener: (lang: string) => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleCustomEvent = (event: Event) => {
    const customEvent = event as CustomEvent<{ lang?: string }>;
    if (customEvent.detail?.lang) {
      listener(customEvent.detail.lang);
    }
  };

  const handleStorageEvent = (event: StorageEvent) => {
    if (event.key === MOTHER_TONGUE_LANGUAGE_STORAGE_KEY && event.newValue) {
      listener(event.newValue);
    }
  };

  window.addEventListener(MOTHER_TONGUE_LANGUAGE_EVENT, handleCustomEvent);
  window.addEventListener("storage", handleStorageEvent);

  return () => {
    window.removeEventListener(MOTHER_TONGUE_LANGUAGE_EVENT, handleCustomEvent);
    window.removeEventListener("storage", handleStorageEvent);
  };
}
