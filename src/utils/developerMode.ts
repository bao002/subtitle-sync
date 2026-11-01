export const DEBUG_MODE_STORAGE_KEY = "yt_debug_mode_enabled";

/**
 * Checks whether developer/debug mode is currently enabled.
 * Returns true if the URL search string has ?debug=true OR if debug mode has been enabled in localStorage.
 */
export function isDeveloperModeEnabled(search?: string): boolean {
  if (typeof search === "string" && search.length > 0) {
    try {
      const urlParam = new URLSearchParams(search).get("debug");
      if (urlParam === "true") return true;
      if (urlParam === "false") return false;
    } catch {
      // ignore
    }
  }

  if (typeof window !== "undefined") {
    try {
      const queryParam = new URLSearchParams(window.location.search).get("debug");
      if (queryParam === "true") return true;
      if (queryParam === "false") return false;

      const stored = localStorage.getItem(DEBUG_MODE_STORAGE_KEY);
      return stored === "true";
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * Sets developer/debug mode in localStorage and keeps the session synchronized.
 */
export function setDeveloperModeEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (enabled) {
      localStorage.setItem(DEBUG_MODE_STORAGE_KEY, "true");
    } else {
      localStorage.setItem(DEBUG_MODE_STORAGE_KEY, "false");
    }
  } catch {
    // ignore
  }
}

/**
 * Toggles developer/debug mode and returns the new state.
 */
export function toggleDeveloperMode(): boolean {
  const current = isDeveloperModeEnabled();
  const next = !current;
  setDeveloperModeEnabled(next);
  return next;
}
