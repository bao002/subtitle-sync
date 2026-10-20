/**
 * Client-Side Video Metadata Manager
 * Extracts rich YouTube video metadata without backend dependencies or API keys
 * using official CORS oEmbed endpoints and thumbnail services.
 */

import { VideoMetadata } from "../types";

const METADATA_KEY_PREFIX = "yt_video_metadata_";
const inMemoryCache = new Map<string, VideoMetadata>();
const inFlightRequests = new Map<string, Promise<VideoMetadata>>();

export interface ThumbnailCollection {
  maxRes: string;
  hq: string;
  mq: string;
  default: string;
}

/**
 * Returns standard YouTube image thumbnail URLs for a given video ID.
 */
export function getVideoThumbnails(videoId: string): ThumbnailCollection {
  const cleanId = (videoId || "").trim();
  return {
    maxRes: `https://img.youtube.com/vi/${cleanId}/maxresdefault.jpg`,
    hq: `https://img.youtube.com/vi/${cleanId}/hqdefault.jpg`,
    mq: `https://img.youtube.com/vi/${cleanId}/mqdefault.jpg`,
    default: `https://img.youtube.com/vi/${cleanId}/default.jpg`,
  };
}

/**
 * Retrieves cached video metadata from localStorage or memory cache if present.
 */
export function getCachedVideoMetadata(videoId: string): VideoMetadata | null {
  const cleanId = (videoId || "").trim();
  if (!cleanId) return null;

  if (inMemoryCache.has(cleanId)) {
    return inMemoryCache.get(cleanId)!;
  }

  if (typeof window !== "undefined" && typeof window.localStorage !== "undefined") {
    try {
      const raw = window.localStorage.getItem(`${METADATA_KEY_PREFIX}${cleanId}`);
      if (raw) {
        const parsed = JSON.parse(raw) as VideoMetadata;
        if (parsed && parsed.videoId === cleanId && parsed.title) {
          inMemoryCache.set(cleanId, parsed);
          return parsed;
        }
      }
    } catch {
      // Ignore localStorage read errors
    }
  }

  return null;
}

/**
 * Persists video metadata into memory and localStorage.
 */
function cacheVideoMetadata(metadata: VideoMetadata): void {
  const cleanId = metadata.videoId;
  inMemoryCache.set(cleanId, metadata);

  if (typeof window !== "undefined" && typeof window.localStorage !== "undefined") {
    try {
      window.localStorage.setItem(`${METADATA_KEY_PREFIX}${cleanId}`, JSON.stringify(metadata));
    } catch {
      // Ignore localStorage write quota errors
    }
  }

  if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
    try {
      window.dispatchEvent(
        new CustomEvent("video-metadata-updated", { detail: { videoId: cleanId, metadata } }),
      );
    } catch {}
  }
}

/**
 * Client-side fetch for YouTube video metadata.
 * Uses YouTube's official public CORS oEmbed API with fallback to noembed and standard metadata.
 */
export async function fetchVideoMetadata(
  videoId: string,
  options?: { forceRefresh?: boolean },
): Promise<VideoMetadata> {
  const cleanId = (videoId || "").trim();
  if (!cleanId) {
    throw new Error("Invalid videoId provided for metadata extraction");
  }

  if (!options?.forceRefresh) {
    const cached = getCachedVideoMetadata(cleanId);
    if (cached) return cached;
  }

  // Deduplicate in-flight requests for the same video ID
  if (inFlightRequests.has(cleanId)) {
    return inFlightRequests.get(cleanId)!;
  }

  const fetchPromise = (async (): Promise<VideoMetadata> => {
    const thumbs = getVideoThumbnails(cleanId);
    const watchUrl = `https://www.youtube.com/watch?v=${cleanId}`;

    // Attempt 1: Official YouTube oEmbed endpoint (CORS-enabled)
    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`;
      const res = await fetch(oembedUrl, { method: "GET" });
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.title === "string" && data.title.trim()) {
          const metadata: VideoMetadata = {
            videoId: cleanId,
            title: data.title.trim(),
            authorName: data.author_name || undefined,
            authorUrl: data.author_url || undefined,
            thumbnailUrl: data.thumbnail_url || thumbs.hq,
            maxResThumbnailUrl: thumbs.maxRes,
            hqThumbnailUrl: thumbs.hq,
            mqThumbnailUrl: thumbs.mq,
            html: data.html || undefined,
            providerName: data.provider_name || "YouTube",
            providerUrl: data.provider_url || "https://www.youtube.com/",
            fetchedAt: Date.now(),
          };
          cacheVideoMetadata(metadata);
          return metadata;
        }
      }
    } catch {
      // Fallback to secondary endpoint
    }

    // Attempt 2: NoEmbed open CORS proxy
    try {
      const noembedUrl = `https://noembed.com/embed?url=${encodeURIComponent(watchUrl)}`;
      const res = await fetch(noembedUrl, { method: "GET" });
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.title === "string" && data.title.trim() && !data.error) {
          const metadata: VideoMetadata = {
            videoId: cleanId,
            title: data.title.trim(),
            authorName: data.author_name || undefined,
            authorUrl: data.author_url || undefined,
            thumbnailUrl: data.thumbnail_url || thumbs.hq,
            maxResThumbnailUrl: thumbs.maxRes,
            hqThumbnailUrl: thumbs.hq,
            mqThumbnailUrl: thumbs.mq,
            html: data.html || undefined,
            providerName: "YouTube",
            providerUrl: "https://www.youtube.com/",
            fetchedAt: Date.now(),
          };
          cacheVideoMetadata(metadata);
          return metadata;
        }
      }
    } catch {
      // Fallback to structured fallback
    }

    // Fallback 3: Standard structured fallback metadata
    const fallbackMetadata: VideoMetadata = {
      videoId: cleanId,
      title: `YouTube Video (${cleanId})`,
      thumbnailUrl: thumbs.hq,
      maxResThumbnailUrl: thumbs.maxRes,
      hqThumbnailUrl: thumbs.hq,
      mqThumbnailUrl: thumbs.mq,
      providerName: "YouTube",
      providerUrl: "https://www.youtube.com/",
      fetchedAt: Date.now(),
    };
    cacheVideoMetadata(fallbackMetadata);
    return fallbackMetadata;
  })();

  inFlightRequests.set(cleanId, fetchPromise);
  try {
    return await fetchPromise;
  } finally {
    inFlightRequests.delete(cleanId);
  }
}

/**
 * Batch fetches metadata for multiple video IDs.
 */
export async function fetchMultipleVideoMetadata(
  videoIds: string[],
): Promise<Record<string, VideoMetadata>> {
  const results: Record<string, VideoMetadata> = {};
  const promises = videoIds.map(async (id) => {
    try {
      const meta = await fetchVideoMetadata(id);
      results[id] = meta;
    } catch {
      // ignore individual failures
    }
  });
  await Promise.all(promises);
  return results;
}

/**
 * Clears video metadata from in-memory and local storage caches.
 */
export function clearVideoMetadataCache(): void {
  inMemoryCache.clear();
  if (typeof window !== "undefined" && typeof window.localStorage !== "undefined") {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && key.startsWith(METADATA_KEY_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      for (const k of keysToRemove) {
        window.localStorage.removeItem(k);
      }
    } catch {}
  }
}
