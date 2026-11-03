import { useSyncExternalStore } from "react";

export type PerformanceMode = "fast" | "slow";

export const STORAGE_KEY_PERFORMANCE_MODE = "yt_performance_mode_v1";
export const STORAGE_KEY_DISABLED_ELEMENTS = "yt_disabled_elements_v1";

export type NonObligatoryElementId =
  | "network_inspector"
  | "state_machine_logs"
  | "tts_debugger"
  | "timing_lab"
  | "experimental_fetch"
  | "multi_video_swiper"
  | "audio_track_sections"
  | "winner_promotion"
  | "default_subtitles_stats"
  | "floating_pause_button"
  | "critical_captions_alert"
  | "settings_backup";

export interface NonObligatoryElementMeta {
  id: NonObligatoryElementId;
  label: string;
  description: string;
  category: "debug" | "experimental" | "overlay" | "analytics";
}

export const NON_OBLIGATORY_ELEMENTS: NonObligatoryElementMeta[] = [
  {
    id: "network_inspector",
    label: "Network Requests Inspector",
    description: "Low-level HTTP traffic and timedtext query monitor",
    category: "debug",
  },
  {
    id: "state_machine_logs",
    label: "State Machine Action Logs",
    description: "Internal video and audio player transition logs",
    category: "debug",
  },
  {
    id: "tts_debugger",
    label: "External TTS Debugger",
    description: "Speak API network latency and payload telemetry",
    category: "debug",
  },
  {
    id: "timing_lab",
    label: "Parser Timing Lab",
    description: "Experimental millisecond segment timing workbench",
    category: "experimental",
  },
  {
    id: "experimental_fetch",
    label: "Experimental Subtitle Fetch Panel",
    description: "Secondary experimental fetch attempts and headers test",
    category: "experimental",
  },
  {
    id: "multi_video_swiper",
    label: "Multi-Video Instances Swiper",
    description: "Multi-video simultaneous player synchronization playground",
    category: "experimental",
  },
  {
    id: "audio_track_sections",
    label: "Audio Track Time Sections",
    description: "Audio timeline slicing and section debug preview",
    category: "debug",
  },
  {
    id: "winner_promotion",
    label: "Winner Promotion Analytics",
    description: "Timedtext fallback attempt winner race reports",
    category: "analytics",
  },
  {
    id: "default_subtitles_stats",
    label: "Default Subtitles Punctuation Stats",
    description: "Dense comma and period frequency tables inside subtitles bar",
    category: "analytics",
  },
  {
    id: "floating_pause_button",
    label: "Floating Draggable Pause Button",
    description: "Floating draggable overlay pause button on screen",
    category: "overlay",
  },
  {
    id: "critical_captions_alert",
    label: "Critical Captions Alert Banner",
    description: "Top alert banner for non-critical fallback notifications",
    category: "overlay",
  },
  {
    id: "settings_backup",
    label: "Settings Backup Launcher",
    description: "JSON application settings backup and export launcher",
    category: "debug",
  },
];

const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) {
    try {
      listener();
    } catch {
      // ignore
    }
  }
}

export function subscribePerformanceMode(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Retrieves the current performance mode: "fast" (default) or "slow".
 */
export function getPerformanceMode(): PerformanceMode {
  if (typeof window === "undefined") return "fast";
  try {
    const stored = localStorage.getItem(STORAGE_KEY_PERFORMANCE_MODE);
    if (stored === "slow" || stored === "fast") {
      return stored;
    }
  } catch {
    // ignore
  }
  return "fast";
}

/**
 * Persists the performance mode ("fast" | "slow").
 */
export function setPerformanceMode(mode: PerformanceMode): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_PERFORMANCE_MODE, mode);
  } catch (e) {
    console.warn("Failed to persist performance mode:", e);
  }
  notify();
}

/**
 * Retrieves explicit per-element overrides map.
 */
export function getElementOverrides(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DISABLED_ELEMENTS);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Persists explicit per-element overrides.
 */
export function setElementOverrides(overrides: Record<string, boolean>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_DISABLED_ELEMENTS, JSON.stringify(overrides));
  } catch (e) {
    console.warn("Failed to persist element overrides:", e);
  }
  notify();
}

/**
 * Determines whether a non-obligatory element is currently enabled and visible.
 *
 * Logic:
 * - If user explicitly set an override for this element, respect the override.
 * - Otherwise:
 *   - "fast" mode (default) -> FALSE (disabled & hidden)
 *   - "slow" mode -> TRUE (enabled & visible)
 */
export function isElementEnabled(id: NonObligatoryElementId): boolean {
  const overrides = getElementOverrides();
  if (Object.prototype.hasOwnProperty.call(overrides, id)) {
    return Boolean(overrides[id]);
  }
  const mode = getPerformanceMode();
  return mode === "slow";
}

/**
 * Sets the enabled state for a specific element.
 */
export function setElementEnabled(id: NonObligatoryElementId, enabled: boolean): void {
  const overrides = getElementOverrides();
  overrides[id] = enabled;
  setElementOverrides(overrides);
}

/**
 * "Disable All" action:
 * Instantly sets mode to "fast" and disables all non-obligatory elements.
 */
export function disableAllNonObligatoryElements(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_PERFORMANCE_MODE, "fast");
    const disabledMap: Record<string, boolean> = {};
    for (const el of NON_OBLIGATORY_ELEMENTS) {
      disabledMap[el.id] = false;
    }
    localStorage.setItem(STORAGE_KEY_DISABLED_ELEMENTS, JSON.stringify(disabledMap));
  } catch (e) {
    console.warn("Failed to disable all non-obligatory elements:", e);
  }
  notify();
}

/**
 * "Enable All" action:
 * Instantly sets mode to "slow" and enables all non-obligatory elements.
 */
export function enableAllNonObligatoryElements(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_PERFORMANCE_MODE, "slow");
    const enabledMap: Record<string, boolean> = {};
    for (const el of NON_OBLIGATORY_ELEMENTS) {
      enabledMap[el.id] = true;
    }
    localStorage.setItem(STORAGE_KEY_DISABLED_ELEMENTS, JSON.stringify(enabledMap));
  } catch (e) {
    console.warn("Failed to enable all non-obligatory elements:", e);
  }
  notify();
}

/**
 * Resets performance mode to the clean initial state (Fast Mode, no overrides).
 */
export function resetPerformanceModeToDefault(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY_PERFORMANCE_MODE);
    localStorage.removeItem(STORAGE_KEY_DISABLED_ELEMENTS);
  } catch {
    // ignore
  }
  notify();
}

/**
 * React hook to reactively track the current PerformanceMode.
 */
export function usePerformanceMode(): PerformanceMode {
  return useSyncExternalStore(
    subscribePerformanceMode,
    getPerformanceMode,
    () => "fast",
  );
}

/**
 * React hook to reactively check if a specific element is enabled.
 */
export function useIsElementEnabled(id: NonObligatoryElementId): boolean {
  return useSyncExternalStore(
    subscribePerformanceMode,
    () => isElementEnabled(id),
    () => false,
  );
}

/**
 * React hook to reactively get all element overrides.
 */
export function useElementOverrides(): Record<string, boolean> {
  return useSyncExternalStore(
    subscribePerformanceMode,
    getElementOverrides,
    () => ({}),
  );
}
