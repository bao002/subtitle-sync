/**
 * Alternative Text-to-Speech (TTS) Service
 * Uses Google Translate TTS audio endpoint as a fallback and configurable alternative.
 * Endpoint: https://translate.google.com/translate_tts?ie=UTF-8&client=gtx&tl={lang}&q={text}
 */

const STORAGE_KEY_USE_ALTERNATIVE_TTS = "yt_use_alternative_tts_v1";
const STORAGE_KEY_ALTERNATIVE_TTS_MODE = "yt_alternative_tts_mode_v1";

export type AlternativeTtsMode = "fallback_only" | "always";

/**
 * Builds the Google Translate TTS audio URL.
 */
export function buildGoogleTranslateTtsUrl(text: string, lang: string): string {
  if (!text) return "";
  // Normalize language code to 2-character prefix or dialect tag expected by translate_tts
  let tl = (lang || "en").trim();
  if (tl.toLowerCase().startsWith("zh-cn") || tl.toLowerCase() === "zh_cn") {
    tl = "zh-CN";
  } else if (tl.toLowerCase().startsWith("zh-tw") || tl.toLowerCase() === "zh_tw") {
    tl = "zh-TW";
  } else {
    tl = tl.split(/[-_]/)[0].toLowerCase();
  }

  // Handle ISO-639 aliases for Google Translate
  if (tl === "iw") tl = "he";
  if (tl === "in") tl = "id";
  if (tl === "ji") tl = "yi";

  const encodedText = encodeURIComponent(text);
  const encodedTl = encodeURIComponent(tl);

  return `https://translate.google.com/translate_tts?ie=UTF-8&client=gtx&tl=${encodedTl}&q=${encodedText}`;
}

/**
 * Retrieves whether the alternative TTS service is enabled (off by default).
 */
export function getUseAlternativeTts(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const stored = localStorage.getItem(STORAGE_KEY_USE_ALTERNATIVE_TTS);
    return stored === "true";
  } catch {
    return false;
  }
}

/**
 * Stores whether the alternative TTS service is enabled.
 */
export function setUseAlternativeTts(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_USE_ALTERNATIVE_TTS, enabled ? "true" : "false");
  } catch (err) {
    console.warn("Failed to persist alternative TTS setting:", err);
  }
}

/**
 * Retrieves the alternative TTS mode: "fallback_only" (default) or "always".
 */
export function getAlternativeTtsMode(): AlternativeTtsMode {
  if (typeof window === "undefined") return "fallback_only";
  try {
    const stored = localStorage.getItem(STORAGE_KEY_ALTERNATIVE_TTS_MODE);
    if (stored === "always" || stored === "fallback_only") {
      return stored;
    }
  } catch {
    // ignore
  }
  return "fallback_only";
}

/**
 * Persists the alternative TTS mode.
 */
export function setAlternativeTtsMode(mode: AlternativeTtsMode): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_ALTERNATIVE_TTS_MODE, mode);
  } catch (err) {
    console.warn("Failed to persist alternative TTS mode:", err);
  }
}

let activeAlternativeAudio: HTMLAudioElement | null = null;
let activeAudioReject: ((reason?: unknown) => void) | null = null;

/**
 * Cancels any currently playing alternative TTS audio.
 */
export function cancelAlternativeTtsAudio(): void {
  if (activeAlternativeAudio) {
    try {
      activeAlternativeAudio.pause();
      activeAlternativeAudio.currentTime = 0;
      activeAlternativeAudio.src = "";
    } catch {
      // ignore pause errors
    }
    activeAlternativeAudio = null;
  }
  if (activeAudioReject) {
    activeAudioReject(new Error("Alternative TTS cancelled"));
    activeAudioReject = null;
  }
}

/**
 * Plays an audio stream from the Google Translate TTS service.
 */
export function playAlternativeTtsAudio(
  text: string,
  lang: string,
  rate: number = 0.5,
  onProgress?: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve) => {
    cancelAlternativeTtsAudio();

    if (!text || typeof window === "undefined") {
      return resolve();
    }

    const url = buildGoogleTranslateTtsUrl(text, lang);
    if (!url) return resolve();

    const audio = new Audio();
    activeAlternativeAudio = audio;

    let hasEnded = false;
    const cleanup = () => {
      if (hasEnded) return;
      hasEnded = true;
      if (activeAlternativeAudio === audio) {
        activeAlternativeAudio = null;
        activeAudioReject = null;
      }
      audio.removeEventListener("ended", onEnd);
      audio.removeEventListener("error", onError);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      resolve();
    };

    const onEnd = () => {
      onProgress?.(100);
      cleanup();
    };

    const onError = (e: unknown) => {
      console.warn("Alternative TTS audio error, resolving cleanly:", e);
      cleanup();
    };

    const onTimeUpdate = () => {
      if (audio.duration > 0 && onProgress) {
        const pct = Math.min(100, Math.round((audio.currentTime / audio.duration) * 100));
        onProgress(pct);
      }
    };

    audio.addEventListener("ended", onEnd);
    audio.addEventListener("error", onError);
    audio.addEventListener("timeupdate", onTimeUpdate);

    // Apply speech rate within 0.3 to 1.5 range
    try {
      audio.playbackRate = Math.max(0.3, Math.min(1.5, rate || 0.5));
    } catch {
      // ignore rate setting error
    }

    audio.src = url;
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch((err) => {
        console.warn("Alternative TTS playback rejected:", err);
        cleanup();
      });
    }
  });
}
