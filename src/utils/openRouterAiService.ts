/**
 * OpenRouter AI Service
 * Integrates with OpenRouter's free models to restore and enrich punctuation in default subtitles.
 * Allows the application to rely solely on punctuation-based splitting and on-demand translation.
 */

import { type Json3, type Cue, parseCues } from "../lib/subtitles";
import { logInfo, logWarn, logError } from "./logBuffer";

export interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
  pricing?: {
    prompt: string | number;
    completion: string | number;
  };
  isFree: boolean;
}

export const DEFAULT_OPENROUTER_MODEL = "openrouter/auto:free";
export const OPENROUTER_FREE_MODELS_FIND_URL =
  "https://openrouter.ai/api/frontend/v1/models/find?active=true&fmt=cards&max_price=0";
export const OPENROUTER_MODELS_API_URL = "https://openrouter.ai/api/v1/models";

/**
 * Curated offline fallback of top free OpenRouter models
 */
export const CURATED_FREE_MODELS: OpenRouterModel[] = [
  {
    id: "openrouter/auto:free",
    name: "OpenRouter Auto (Free Router - Default)",
    description:
      "Automatically selects the best available free model on OpenRouter for your prompt.",
    isFree: true,
  },
  {
    id: "openrouter/free",
    name: "OpenRouter Free Models Router",
    description: "Routes across all free, production-grade AI models available on OpenRouter.",
    isFree: true,
  },
  {
    id: "meta-llama/llama-3.3-70b-instruct:free",
    name: "Meta: Llama 3.3 70B Instruct (Free)",
    description:
      "State-of-the-art open weights 70B model with exceptional reasoning and punctuation.",
    isFree: true,
  },
  {
    id: "meta-llama/llama-3.1-8b-instruct:free",
    name: "Meta: Llama 3.1 8B Instruct (Free)",
    description: "Fast, efficient 8B model great for quick sentence formatting.",
    isFree: true,
  },
  {
    id: "google/gemma-4-31b:free",
    name: "Google: Gemma 4 31B (Free)",
    description: "High-accuracy language model from Google with strong grammatical capabilities.",
    isFree: true,
  },
  {
    id: "google/gemma-4-26b-a4b:free",
    name: "Google: Gemma 4 26B A4B (Free)",
    description: "Lightweight and versatile Google Gemma model.",
    isFree: true,
  },
  {
    id: "nvidia/nemotron-3-ultra-550b-a55b:free",
    name: "NVIDIA: Nemotron 3 Ultra 550B (Free)",
    description: "Large capacity model from NVIDIA with deep linguistic nuance.",
    isFree: true,
  },
  {
    id: "nvidia/nemotron-3.5-lightning:free",
    name: "NVIDIA: Nemotron 3.5 Lightning (Free)",
    description: "High-speed NVIDIA model optimized for rapid text transformation.",
    isFree: true,
  },
  {
    id: "qwen/qwen3.8-27b:free",
    name: "Qwen: Qwen 3.8 27B (Free)",
    description:
      "Alibaba Cloud's multilingual foundation model with excellent punctuation support.",
    isFree: true,
  },
  {
    id: "mistralai/mistral-7b-instruct:free",
    name: "Mistral: 7B Instruct (Free)",
    description: "Popular, robust instruction-following model.",
    isFree: true,
  },
];

let cachedModels: OpenRouterModel[] | null = null;
let cachedModelsKey = "";
let lastModelsFetchTime = 0;
const MODELS_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export function resetOpenRouterModelsCache(): void {
  cachedModels = null;
  cachedModelsKey = "";
  lastModelsFetchTime = 0;
}

interface FrontendModelCard {
  id?: string;
  slug?: string;
  name?: string;
  short_name?: string;
  description?: string;
  context_length?: number;
  has_text_output?: boolean;
  output_modalities?: string[];
  pricing?: {
    prompt?: string | number;
    completion?: string | number;
  };
  endpoint?: {
    model_variant_slug?: string;
    is_free?: boolean;
    pricing?: {
      prompt?: string | number;
      completion?: string | number;
    };
  };
}

function buildOpenRouterRequestHeaders(apiKey?: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "HTTP-Referer":
      typeof window !== "undefined"
        ? window.location.origin
        : "https://github.com/mostuf2556/subtitle-sync",
    "X-Title": "Parallel Subtitles AI",
  };
  if (apiKey && apiKey.trim().length > 0) {
    headers["Authorization"] = `Bearer ${apiKey.trim()}`;
  }
  return headers;
}

/**
 * Parses either OpenRouter's frontend `/models/find?fmt=cards&max_price=0` payload
 * (`{ data: { models: [...] } }`) or `/api/v1/models` payload (`{ data: [...] }`)
 * into normalized free text models with `openrouter/auto:free` pinned first.
 */
export function parseOpenRouterFreeModelsPayload(payload: unknown): OpenRouterModel[] {
  const obj = payload as { data?: unknown } | null | undefined;
  const rawData = obj?.data;

  const isFrontendCardsPayload = Boolean(
    rawData &&
      !Array.isArray(rawData) &&
      Array.isArray((rawData as { models?: unknown }).models),
  );

  const rawItems: FrontendModelCard[] = isFrontendCardsPayload
    ? ((rawData as { models: FrontendModelCard[] }).models || [])
    : Array.isArray(rawData)
      ? (rawData as FrontendModelCard[])
      : [];

  if (rawItems.length === 0) {
    return [];
  }

  const freeList: OpenRouterModel[] = [CURATED_FREE_MODELS[0]!];
  const seenIds = new Set<string>([DEFAULT_OPENROUTER_MODEL]);

  for (const m of rawItems) {
    if (!m || typeof m !== "object") continue;

    // Exclude non-text-output models (e.g., pure image generators)
    if (m.has_text_output === false) continue;
    if (
      Array.isArray(m.output_modalities) &&
      m.output_modalities.length > 0 &&
      !m.output_modalities.includes("text")
    ) {
      continue;
    }

    const endpointSlug =
      typeof m.endpoint?.model_variant_slug === "string"
        ? m.endpoint.model_variant_slug.trim()
        : "";
    const directId = typeof m.id === "string" ? m.id.trim() : "";
    const rawSlug = typeof m.slug === "string" ? m.slug.trim() : "";

    const resolvedId =
      endpointSlug ||
      directId ||
      (rawSlug ? (rawSlug.endsWith(":free") ? rawSlug : `${rawSlug}:free`) : "");

    if (!resolvedId) continue;

    const effectivePricing = m.endpoint?.pricing || m.pricing;
    const promptPrice =
      effectivePricing?.prompt !== undefined ? Number(effectivePricing.prompt) : null;
    const completionPrice =
      effectivePricing?.completion !== undefined ? Number(effectivePricing.completion) : null;

    const isZeroPrice =
      (promptPrice === 0 || promptPrice === null || Number.isNaN(promptPrice)) &&
      (completionPrice === 0 || completionPrice === null || Number.isNaN(completionPrice));
    const lowerId = resolvedId.toLowerCase();
    const isFreeTag =
      m.endpoint?.is_free === true ||
      lowerId.endsWith(":free") ||
      lowerId.includes("/free") ||
      lowerId.includes(":free");

    // In frontend cards mode (max_price=0), items are already free unless explicitly paid
    const hasExplicitNonZeroPrice =
      (promptPrice !== null && !Number.isNaN(promptPrice) && promptPrice > 0) ||
      (completionPrice !== null && !Number.isNaN(completionPrice) && completionPrice > 0);

    const shouldInclude = isFrontendCardsPayload
      ? !hasExplicitNonZeroPrice
      : !hasExplicitNonZeroPrice && (isZeroPrice || isFreeTag);

    if (!shouldInclude) continue;

    if (resolvedId === DEFAULT_OPENROUTER_MODEL) {
      // Update display metadata if OpenRouter provided a richer card for default auto router
      if (m.name || m.description || m.context_length) {
        freeList[0] = {
          id: DEFAULT_OPENROUTER_MODEL,
          name: m.name || freeList[0]!.name,
          description: m.description || freeList[0]!.description,
          context_length: m.context_length,
          pricing: effectivePricing as OpenRouterModel["pricing"],
          isFree: true,
        };
      }
      continue;
    }

    if (seenIds.has(resolvedId)) continue;
    seenIds.add(resolvedId);

    freeList.push({
      id: resolvedId,
      name: m.name || m.short_name || resolvedId,
      description: m.description,
      context_length: m.context_length,
      pricing: effectivePricing as OpenRouterModel["pricing"],
      isFree: true,
    });
  }

  return freeList;
}

export interface FetchOpenRouterFreeModelsOptions {
  forceRefresh?: boolean;
}

/**
 * Fetches free models dynamically from OpenRouter (`frontend/v1/models/find?active=true&fmt=cards&max_price=0`),
 * using the supplied API key when available and defaulting to `openrouter/auto:free`.
 * Falls back to `/api/v1/models` and finally `CURATED_FREE_MODELS` if offline.
 */
export async function fetchOpenRouterFreeModels(
  apiKey?: string,
  options?: FetchOpenRouterFreeModelsOptions,
): Promise<OpenRouterModel[]> {
  const normalizedKey = (apiKey || "").trim();
  const now = Date.now();
  if (
    !options?.forceRefresh &&
    cachedModels &&
    cachedModelsKey === normalizedKey &&
    now - lastModelsFetchTime < MODELS_CACHE_TTL_MS
  ) {
    return cachedModels;
  }

  const headers = buildOpenRouterRequestHeaders(normalizedKey);
  const endpoints = [OPENROUTER_FREE_MODELS_FIND_URL, OPENROUTER_MODELS_API_URL];

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, { headers });
      if (!res.ok) {
        logWarn("OpenRouter", `Models fetch (${endpoint}) returned status ${res.status}`);
        continue;
      }
      const data = await res.json();
      const parsed = parseOpenRouterFreeModelsPayload(data);
      if (parsed.length > 0) {
        cachedModels = parsed;
        cachedModelsKey = normalizedKey;
        lastModelsFetchTime = now;
        return parsed;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logWarn("OpenRouter", `Models fetch (${endpoint}) failed: ${message}`);
    }
  }

  logWarn("OpenRouter", "All dynamic model endpoints unavailable; falling back to curated free models.");
  return CURATED_FREE_MODELS;
}

export type PunctuationStyle = "conversational" | "formal" | "short_sentences";

export interface PunctuateSubtitlesOptions {
  cues: Array<{ start: number; end: number; text: string }>;
  model?: string;
  apiKey?: string;
  temperature?: number;
  batchSize?: number;
  style?: PunctuationStyle;
  signal?: AbortSignal;
  onProgress?: (progressPercent: number, statusMessage: string) => void;
}

export interface PunctuatedSegment {
  index: number;
  start: number;
  end: number;
  originalText: string;
  punctuatedText: string;
}

export interface PunctuatedSubtitleResult {
  segments: PunctuatedSegment[];
  punctuatedJson3: Json3;
  stats: {
    totalSegments: number;
    punctuationMarksAdded: number;
    capitalizedWordsCount: number;
    modelUsed: string;
    totalLatencyMs: number;
    batchesCount: number;
  };
}

/**
 * Builds the AI prompt for punctuating a batch of subtitle lines
 */
export function buildPunctuationPrompt(
  lines: Array<{ index: number; text: string }>,
  style: PunctuationStyle = "conversational",
): string {
  const formattedLines = lines.map((l) => `${l.index}: ${l.text}`).join("\n");
  const styleInstruction =
    style === "formal"
      ? "Use formal, grammatically strict punctuation with complete sentences, standard capitalization, and appropriate commas."
      : style === "short_sentences"
        ? "Break long run-on phrases into concise, short sentences with periods and question marks where natural pauses occur."
        : "Restore natural conversational punctuation (commas, periods, question marks, exclamation marks) and proper sentence capitalization.";

  return `You are a subtitle punctuation restoration engine.
The following subtitle segments lack proper punctuation and sentence capitalization.
${styleInstruction}

CRITICAL RULES:
1. DO NOT change, add, or omit words. Keep the exact sequence of words intact.
2. Maintain the exact same number of lines with the prefix "INDEX: Punctuated text".
3. Return ONLY the numbered lines with no preamble, markdown code blocks, or conversational text.

Segments to punctuate:
${formattedLines}`;
}

/**
 * Parses the AI output back into punctuated strings mapped by index
 */
export function parsePunctuationOutput(
  rawAiOutput: string,
  expectedCount: number,
): Map<number, string> {
  const result = new Map<number, string>();
  const lines = rawAiOutput
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  for (const line of lines) {
    const match = line.match(/^(\d+)[\s:.\-)]+(.+)$/);
    if (match && match[1] && match[2]) {
      const idx = parseInt(match[1], 10);
      result.set(idx, match[2].trim());
    }
  }

  // Fallback: if lines weren't numbered cleanly, assign sequentially
  if (result.size < expectedCount && lines.length >= expectedCount) {
    lines.forEach((l, idx) => {
      if (!result.has(idx)) {
        const cleaned = l.replace(/^\d+[\s:.\-)]+/, "").trim();
        result.set(idx, cleaned);
      }
    });
  }

  return result;
}

/**
 * Curated preset models for rapid 1-click selection pills in UI
 */
export function getCuratedFreeModelPresets(): Array<{ id: string; label: string }> {
  return [
    { id: "openrouter/auto:free", label: "Auto (Default)" },
    { id: "meta-llama/llama-3.3-70b-instruct:free", label: "Llama 3.3 70B" },
    { id: "google/gemma-4-31b:free", label: "Gemma 4 31B" },
    { id: "mistralai/mistral-7b-instruct:free", label: "Mistral 7B" },
    { id: "qwen/qwen3.8-27b:free", label: "Qwen 3.8 27B" },
  ];
}

/**
 * Core function to punctuate subtitle cues using OpenRouter's free AI models
 */
export async function punctuateSubtitlesWithOpenRouter({
  cues,
  model = DEFAULT_OPENROUTER_MODEL,
  apiKey,
  temperature = 0.2,
  batchSize = 50,
  style = "conversational",
  signal,
  onProgress,
}: PunctuateSubtitlesOptions): Promise<PunctuatedSubtitleResult> {
  if (!cues || cues.length === 0) {
    throw new Error("No subtitle cues provided for punctuation processing.");
  }

  if (signal?.aborted) {
    throw new Error("AI punctuation was cancelled.");
  }

  const startTime = Date.now();
  const effectiveModel = model.trim() || DEFAULT_OPENROUTER_MODEL;
  onProgress?.(
    10,
    `Preparing ${cues.length} subtitle segments for AI punctuation with ${effectiveModel}…`,
  );

  // Ensure batch size is within sensible boundaries
  const effectiveBatchSize = Math.max(10, Math.min(100, batchSize));
  const punctuatedSegments: PunctuatedSegment[] = [];

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "HTTP-Referer":
      typeof window !== "undefined"
        ? window.location.origin
        : "https://github.com/mostuf2556/subtitle-sync",
    "X-Title": "Parallel Subtitles AI Punctuation",
  };
  if (apiKey && apiKey.trim().length > 0) {
    headers["Authorization"] = `Bearer ${apiKey.trim()}`;
  }

  const totalBatches = Math.ceil(cues.length / effectiveBatchSize);

  for (let batchIdx = 0; batchIdx < totalBatches; batchIdx++) {
    if (signal?.aborted) {
      throw new Error("AI punctuation was cancelled.");
    }

    const startIdx = batchIdx * effectiveBatchSize;
    const endIdx = Math.min(cues.length, startIdx + effectiveBatchSize);
    const batchCues = cues.slice(startIdx, endIdx);

    const inputLines = batchCues.map((c, i) => ({
      index: startIdx + i,
      text: c.text,
    }));

    const userPrompt = buildPunctuationPrompt(inputLines, style);

    onProgress?.(
      Math.round(15 + (batchIdx / totalBatches) * 75),
      `Processing batch ${batchIdx + 1} of ${totalBatches} (${batchCues.length} lines)…`,
    );

    const requestPayload = {
      model: effectiveModel,
      temperature,
      messages: [
        {
          role: "system",
          content:
            "You are a professional subtitle punctuation restoration specialist. You add clean punctuation and capitalization while preserving exact wording.",
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
    };

    let aiContent = "";
    let attempt = 0;
    const maxAttempts = 3;
    let batchSuccess = false;

    while (attempt < maxAttempts && !batchSuccess) {
      if (signal?.aborted) {
        throw new Error("AI punctuation was cancelled.");
      }
      attempt++;
      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers,
          body: JSON.stringify(requestPayload),
          signal,
        });

        if (response.status === 429 || response.status === 503) {
          if (attempt < maxAttempts) {
            const backoffMs = attempt * 1500;
            onProgress?.(
              Math.round(15 + (batchIdx / totalBatches) * 75),
              `Rate limited (HTTP ${response.status}). Backing off for ${(backoffMs / 1000).toFixed(1)}s (retry ${attempt}/${maxAttempts})…`,
            );
            await new Promise((resolve) => setTimeout(resolve, backoffMs));
            continue;
          }
        }

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`OpenRouter API error ${response.status}: ${errorText}`);
        }

        const responseData = await response.json();
        aiContent = responseData?.choices?.[0]?.message?.content || "";
        if (!aiContent || aiContent.trim().length === 0) {
          throw new Error("Empty response returned from OpenRouter model.");
        }
        batchSuccess = true;
      } catch (err: unknown) {
        const errObj = err as { name?: string; message?: string } | null;
        if (
          signal?.aborted ||
          errObj?.name === "AbortError" ||
          errObj?.message?.includes("cancelled")
        ) {
          throw new Error("AI punctuation was cancelled.");
        }
        if (attempt >= maxAttempts) {
          logError(
            "OpenRouter",
            `Batch ${batchIdx + 1} failed after ${maxAttempts} attempts: ${errObj?.message || String(err)}`,
          );
          // Fallback: keep original text with basic sentence capitalization if AI request fails
          inputLines.forEach((item) => {
            const fallbackText = item.text
              ? item.text.charAt(0).toUpperCase() + item.text.slice(1)
              : "";
            punctuatedSegments.push({
              index: item.index,
              start: cues[item.index]?.start ?? 0,
              end: cues[item.index]?.end ?? 0,
              originalText: item.text,
              punctuatedText: fallbackText || item.text,
            });
          });
          break;
        } else {
          await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
        }
      }
    }

    if (batchSuccess && aiContent) {
      const parsedMap = parsePunctuationOutput(aiContent, batchCues.length);

      inputLines.forEach((item) => {
        const punctuated = parsedMap.get(item.index) || item.text;
        punctuatedSegments.push({
          index: item.index,
          start: cues[item.index]?.start ?? 0,
          end: cues[item.index]?.end ?? 0,
          originalText: item.text,
          punctuatedText: punctuated,
        });
      });
    }
  }

  // Sort by index
  punctuatedSegments.sort((a, b) => a.index - b.index);

  // Compute punctuation statistics
  let punctuationCount = 0;
  let capitalizedWords = 0;

  for (const seg of punctuatedSegments) {
    const origPunct = (seg.originalText.match(/[.,?!;:]/g) || []).length;
    const newPunct = (seg.punctuatedText.match(/[.,?!;:]/g) || []).length;
    if (newPunct > origPunct) {
      punctuationCount += newPunct - origPunct;
    }
    const origCaps = (seg.originalText.match(/[A-Z]/g) || []).length;
    const newCaps = (seg.punctuatedText.match(/[A-Z]/g) || []).length;
    if (newCaps > origCaps) {
      capitalizedWords += newCaps - origCaps;
    }
  }

  // Create valid Json3 format
  const punctuatedJson3: Json3 = {
    events: punctuatedSegments.map((seg) => ({
      tStartMs: seg.start,
      dDurationMs: Math.max(0, seg.end - seg.start),
      segs: [{ utf8: seg.punctuatedText }],
    })),
  };

  const totalLatencyMs = Date.now() - startTime;
  onProgress?.(
    100,
    `Successfully punctuated ${punctuatedSegments.length} subtitle segments in ${(totalLatencyMs / 1000).toFixed(1)}s!`,
  );

  return {
    segments: punctuatedSegments,
    punctuatedJson3,
    stats: {
      totalSegments: punctuatedSegments.length,
      punctuationMarksAdded: punctuationCount,
      capitalizedWordsCount: capitalizedWords,
      modelUsed: effectiveModel,
      totalLatencyMs,
      batchesCount: totalBatches,
    },
  };
}

/**
 * Tests OpenRouter connection and validates API key / model availability
 */
export async function testOpenRouterConnection(
  apiKey?: string,
  model = DEFAULT_OPENROUTER_MODEL,
): Promise<{ success: boolean; message: string; model: string; latencyMs: number }> {
  const startTime = Date.now();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "HTTP-Referer": "https://github.com/mostuf2556/subtitle-sync",
    "X-Title": "Parallel Subtitles AI Punctuation",
  };
  if (apiKey && apiKey.trim().length > 0) {
    headers["Authorization"] = `Bearer ${apiKey.trim()}`;
  }

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: "Say OK" }],
        max_tokens: 5,
        temperature: 0,
      }),
    });

    const latencyMs = Date.now() - startTime;

    if (!res.ok) {
      const errBody = await res.text();
      return {
        success: false,
        message: `HTTP ${res.status}: ${errBody.slice(0, 120)}`,
        model,
        latencyMs,
      };
    }

    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content || "Connected";
    return {
      success: true,
      message: `Connection successful (${latencyMs}ms)! Response: "${reply.trim()}"`,
      model,
      latencyMs,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message,
      model,
      latencyMs: Date.now() - startTime,
    };
  }
}
