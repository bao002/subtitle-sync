import React, { useState, useEffect, useMemo, useTransition } from "react";
import {
  Sparkles,
  RefreshCw,
  Key,
  CheckCircle2,
  ArrowRight,
  Sliders,
  Split,
  Eye,
  FileCheck,
  Search,
  AlertCircle,
  Cpu,
  Layers,
  Wand2,
  Database,
  Trash2,
  Share2,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { type Json3, type Cue, parseCues, fmt } from "@/lib/subtitles";
import {
  saveCachedAiSubtitles,
  getCachedAiSubtitles,
  hasCachedAiSubtitles,
  clearCachedAiSubtitles,
  type CachedAiSubtitleData,
} from "@/utils/subtitleCache";
import {
  type OpenRouterModel,
  DEFAULT_OPENROUTER_MODEL,
  CURATED_FREE_MODELS,
  fetchOpenRouterFreeModels,
  punctuateSubtitlesWithOpenRouter,
  testOpenRouterConnection,
  getCuratedFreeModelPresets,
  type PunctuationStyle,
  type PunctuatedSubtitleResult,
  type PunctuatedSegment,
} from "@/utils/openRouterAiService";
import {
  getOpenRouterModelSetting,
  setOpenRouterModelSetting,
  getOpenRouterApiKeySetting,
  setOpenRouterApiKeySetting,
  getOpenRouterPunctuationStyleSetting,
  setOpenRouterPunctuationStyleSetting,
  getAiPunctuateAutoApplySetting,
  setAiPunctuateAutoApplySetting,
} from "@/utils/appSettings";

export interface AiSubtitlePunctuationTabProps {
  rawJson3: Json3 | null;
  baseLanguage: string;
  onApplyPunctuatedTrack: (punctuatedJson3: Json3, relySolelyOnPunctuation?: boolean) => void;
  onSwitchToViewer: () => void;
  videoId?: string;
  isSolelyPunctuationActive?: boolean;
  onRevertCriteria?: () => void;
  onOpenShareModal?: () => void;
}

export function AiSubtitlePunctuationTab({
  rawJson3,
  baseLanguage,
  onApplyPunctuatedTrack,
  onSwitchToViewer,
  videoId,
  isSolelyPunctuationActive = false,
  onRevertCriteria,
  onOpenShareModal,
}: AiSubtitlePunctuationTabProps) {
  // Model & API Key State
  const [selectedModel, setSelectedModel] = useState<string>(() => getOpenRouterModelSetting());
  const [apiKey, setApiKey] = useState<string>(() => getOpenRouterApiKeySetting());
  const [modelsList, setModelsList] = useState<OpenRouterModel[]>(CURATED_FREE_MODELS);
  const [modelsFilter, setModelsFilter] = useState<string>("");
  const [isLoadingModels, setIsLoadingModels] = useState<boolean>(false);
  const [autoApply, setAutoApply] = useState<boolean>(() => getAiPunctuateAutoApplySetting());
  const [punctuationStyle, setPunctuationStyle] = useState<PunctuationStyle>(() =>
    getOpenRouterPunctuationStyleSetting(),
  );

  const abortControllerRef = React.useRef<AbortController | null>(null);

  // Test Connection State
  const [isTestingKey, setIsTestingKey] = useState<boolean>(false);
  const [testStatus, setTestStatus] = useState<{
    success?: boolean;
    message?: string;
    latencyMs?: number;
  } | null>(null);

  // Processing State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [progressMessage, setProgressMessage] = useState<string>("");
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [result, setResult] = useState<PunctuatedSubtitleResult | null>(null);

  // Cached AI Subtitles State
  const [cachedAiData, setCachedAiData] = useState<CachedAiSubtitleData | null>(() =>
    getCachedAiSubtitles(videoId || "current", baseLanguage || "en"),
  );

  useEffect(() => {
    setCachedAiData(getCachedAiSubtitles(videoId || "current", baseLanguage || "en"));
  }, [videoId, baseLanguage]);

  // View state
  const [viewMode, setViewMode] = useState<"side-by-side" | "diff">("side-by-side");
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [, startTransition] = useTransition();

  const presets = useMemo(() => getCuratedFreeModelPresets(), []);

  // Load models dynamically on mount
  useEffect(() => {
    let active = true;
    setIsLoadingModels(true);
    fetchOpenRouterFreeModels(apiKey)
      .then((models) => {
        if (active) {
          setModelsList(models);
          setIsLoadingModels(false);
        }
      })
      .catch(() => {
        if (active) setIsLoadingModels(false);
      });
    return () => {
      active = false;
    };
  }, [apiKey]);

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    setOpenRouterModelSetting(modelId);
  };

  const handlePunctuationStyleChange = (style: PunctuationStyle) => {
    setPunctuationStyle(style);
    setOpenRouterPunctuationStyleSetting(style);
  };

  const handleApiKeyChange = (key: string) => {
    setApiKey(key);
    setOpenRouterApiKeySetting(key);
    setTestStatus(null);
  };

  const handleTestConnection = async () => {
    setIsTestingKey(true);
    setTestStatus(null);
    try {
      const res = await testOpenRouterConnection(apiKey, selectedModel);
      setTestStatus(res);
    } catch (err: any) {
      setTestStatus({ success: false, message: err?.message || String(err) });
    } finally {
      setIsTestingKey(false);
    }
  };

  const handleRefreshModels = async () => {
    setIsLoadingModels(true);
    try {
      const models = await fetchOpenRouterFreeModels(apiKey);
      setModelsList(models);
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleToggleAutoApply = (enabled: boolean) => {
    setAutoApply(enabled);
    setAiPunctuateAutoApplySetting(enabled);
  };

  const handleCancelProcessing = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsProcessing(false);
    setProgressMessage("Cancelled by user.");
  };

  // Extract raw cues from input Json3
  const rawCues = useMemo<Cue[]>(() => {
    if (!rawJson3) return [];
    return parseCues(rawJson3);
  }, [rawJson3]);

  // Filtered models for searchable dropdown / list
  const filteredModels = useMemo(() => {
    if (!modelsFilter.trim()) return modelsList;
    const q = modelsFilter.toLowerCase().trim();
    return modelsList.filter(
      (m) =>
        m.id.toLowerCase().includes(q) ||
        m.name.toLowerCase().includes(q) ||
        (m.description && m.description.toLowerCase().includes(q)),
    );
  }, [modelsList, modelsFilter]);

  // Execute AI Punctuation Processing
  const handleStartProcessing = async () => {
    if (rawCues.length === 0) {
      setErrorNotice(
        "No subtitles available to punctuate. Please load a video with subtitles first.",
      );
      return;
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsProcessing(true);
    setProgressPercent(5);
    setProgressMessage("Initiating OpenRouter AI subtitle punctuation…");
    setErrorNotice(null);

    try {
      const res = await punctuateSubtitlesWithOpenRouter({
        cues: rawCues,
        model: selectedModel,
        apiKey: apiKey.trim(),
        temperature: 0.2,
        style: punctuationStyle,
        signal: abortController.signal,
        onProgress: (percent, msg) => {
          setProgressPercent(percent);
          setProgressMessage(msg);
        },
      });

      setResult(res);
      setProgressPercent(100);
      setProgressMessage("AI punctuation complete & cached!");

      // Persist in AI subtitle cache under videoId and language code
      saveCachedAiSubtitles({
        videoId: videoId || "current",
        lang: baseLanguage || "en",
        punctuatedJson3: res.punctuatedJson3,
        segments: res.segments,
        modelUsed: selectedModel,
        style: punctuationStyle,
        timestamp: Date.now(),
        latencyMs: res.stats.totalLatencyMs,
        rawCount: rawCues.length,
        punctuatedCount: res.segments.length,
      });
      setCachedAiData(getCachedAiSubtitles(videoId || "current", baseLanguage || "en"));

      if (autoApply) {
        onApplyPunctuatedTrack(res.punctuatedJson3, false);
      }
    } catch (err: any) {
      if (err?.message?.includes("cancelled")) {
        setProgressMessage("Processing cancelled.");
      } else {
        setErrorNotice(err?.message || "Failed to process subtitles with OpenRouter AI.");
      }
    } finally {
      setIsProcessing(false);
      abortControllerRef.current = null;
    }
  };

  const handleApplyPunctuated = (relySolelyOnPunctuation = false) => {
    if (!result?.punctuatedJson3) return;
    onApplyPunctuatedTrack(result.punctuatedJson3, relySolelyOnPunctuation);
  };

  const handleLoadCachedAiSubtitles = (relySolelyOnPunctuation = false) => {
    if (!cachedAiData?.punctuatedJson3) return;
    setResult({
      punctuatedJson3: cachedAiData.punctuatedJson3,
      segments: cachedAiData.segments || [],
      stats: {
        totalSegments: cachedAiData.rawCount || 0,
        punctuationMarksAdded: cachedAiData.punctuatedCount || 0,
        capitalizedWordsCount: 0,
        batchesCount: 1,
        totalLatencyMs: cachedAiData.latencyMs || 0,
        modelUsed: cachedAiData.modelUsed || "cached-ai",
      },
    });
    onApplyPunctuatedTrack(cachedAiData.punctuatedJson3, relySolelyOnPunctuation);
  };

  const handlePreviewCachedAiSubtitles = () => {
    if (!cachedAiData?.punctuatedJson3) return;
    setResult({
      punctuatedJson3: cachedAiData.punctuatedJson3,
      segments: cachedAiData.segments || [],
      stats: {
        totalSegments: cachedAiData.rawCount || 0,
        punctuationMarksAdded: cachedAiData.punctuatedCount || 0,
        capitalizedWordsCount: 0,
        batchesCount: 1,
        totalLatencyMs: cachedAiData.latencyMs || 0,
        modelUsed: cachedAiData.modelUsed || "cached-ai",
      },
    });
  };

  const handleClearCachedAiSubtitles = () => {
    clearCachedAiSubtitles(videoId || "current", baseLanguage || "en");
    setCachedAiData(null);
  };

  // Filtered segments for display
  const displayedSegments = useMemo(() => {
    const list =
      result?.segments ||
      rawCues.map((c, i) => ({
        index: i,
        start: c.start,
        end: c.end,
        originalText: c.text,
        punctuatedText: "",
      }));

    if (!searchFilter.trim()) return list;
    const q = searchFilter.toLowerCase();
    return list.filter(
      (s) =>
        s.originalText.toLowerCase().includes(q) ||
        (s.punctuatedText && s.punctuatedText.toLowerCase().includes(q)),
    );
  }, [result, rawCues, searchFilter]);

  return (
    <div
      id="ai-subtitle-punctuation-panel"
      data-testid="ai-subtitle-punctuation-panel"
      className="container mx-auto px-4 py-6 max-w-6xl space-y-6"
    >
      {/* Header Banner */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <Sparkles className="h-4 w-4" />
              </span>
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                AI Subtitle Punctuation Engine
              </h2>
              <Badge variant="secondary" className="gap-1 font-mono text-xs">
                <Cpu className="h-3 w-3 text-primary" />
                OpenRouter Free Models
              </Badge>
            </div>
            <div className="flex items-center gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => setShowGuide((prev) => !prev)}
                data-testid="ai-guide-toggle-btn"
                aria-expanded={showGuide}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline transition-colors cursor-pointer"
              >
                <HelpCircle className="h-3 w-3" />
                <span>{showGuide ? "Hide Explanation" : "Learn How Punctuation Works"}</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-background/80 p-1 shadow-2xs">
            {onOpenShareModal && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onOpenShareModal}
                className="gap-1.5 text-xs h-7 hover:bg-muted text-foreground"
                data-testid="ai-tab-share-link-btn"
                title="Share link with default subtitles, OpenRouter key, and target translation language"
              >
                <Share2 className="h-3.5 w-3.5 text-primary" />
                <span>Share Setup</span>
              </Button>
            )}
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={onSwitchToViewer}
              className="gap-1.5 text-xs h-7 font-medium shadow-xs"
              data-testid="ai-tab-return-viewer-btn"
            >
              <span>Back to Viewer</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {showGuide && (
          <div
            data-testid="ai-guide-explanation"
            className="rounded-lg bg-background/90 border border-primary/20 p-3 text-xs text-muted-foreground mt-3 space-y-1.5 animate-in fade-in duration-150"
          >
            <p>
              Adds missing punctuation (periods, commas, question marks) and capitalization to raw default subtitles.
            </p>
            <p>
              Clean punctuation allows our sentence boundary parser and lookahead on-demand translation to produce high-fidelity translations without broken phrases.
            </p>
          </div>
        )}
      </div>

      {/* Configuration Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Model Selection & API Key */}
        <div className="lg:col-span-1 rounded-xl border border-border bg-card p-5 space-y-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Sliders className="h-4 w-4 text-primary" />
              AI Model & Credentials
            </h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRefreshModels}
              disabled={isLoadingModels}
              className="h-7 px-2 text-xs gap-1"
              data-testid="ai-refresh-models-btn"
              title="Refresh available free models from OpenRouter API"
            >
              <RefreshCw className={`h-3 w-3 ${isLoadingModels ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </Button>
          </div>

          {/* Model Search & Dropdown */}
          <div className="space-y-2">
            <label
              htmlFor="ai-model-select"
              className="text-xs font-medium text-foreground flex items-center justify-between"
            >
              <span>Select Free AI Model</span>
              <span className="text-[10px] text-muted-foreground font-mono">
                {modelsList.length} options
              </span>
            </label>

            {/* Quick Filter Box */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                data-testid="ai-model-search-input"
                type="text"
                placeholder="Filter models (e.g. auto, llama, gemma)…"
                value={modelsFilter}
                onChange={(e) => setModelsFilter(e.target.value)}
                className="w-full rounded-md border border-input bg-background pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Quick Model Presets Pills */}
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground">Quick Presets:</span>
              <div
                className="flex flex-wrap items-center gap-1.5"
                data-testid="ai-model-presets-container"
              >
                {presets.map((p) => {
                  const isSelected = selectedModel === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      data-testid={`ai-preset-${p.id.replace(/[^a-zA-Z0-9]/g, "-")}`}
                      onClick={() => handleModelChange(p.id)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-all ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary font-semibold shadow-xs"
                          : "bg-muted/60 text-muted-foreground hover:text-foreground border-border"
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dropdown Selection */}
            <select
              id="ai-model-select"
              data-testid="ai-model-select"
              value={selectedModel}
              onChange={(e) => handleModelChange(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
            >
              {filteredModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} {m.id === DEFAULT_OPENROUTER_MODEL ? "⭐ (Default)" : ""}
                </option>
              ))}
            </select>

            <p className="text-[11px] text-muted-foreground">
              Default is{" "}
              <code className="bg-muted px-1 rounded font-mono">openrouter/auto:free</code>, which
              automatically selects the most capable available free model.
            </p>
          </div>

          {/* Punctuation Style Selector */}
          <div className="space-y-1.5 pt-2 border-t border-border/60">
            <label className="text-xs font-medium text-foreground flex items-center justify-between">
              <span>Punctuation Style</span>
              <span className="text-[10px] text-muted-foreground font-mono">AI formatting</span>
            </label>
            <div
              className="grid grid-cols-3 gap-1.5 text-xs"
              data-testid="ai-punctuation-style-selector"
            >
              <button
                type="button"
                data-testid="ai-style-conversational-btn"
                onClick={() => handlePunctuationStyleChange("conversational")}
                className={`py-1 px-1.5 rounded-md border text-center text-[11px] transition-all ${
                  punctuationStyle === "conversational"
                    ? "border-primary bg-primary/10 text-primary font-semibold"
                    : "border-input bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                Conversational
              </button>
              <button
                type="button"
                data-testid="ai-style-formal-btn"
                onClick={() => handlePunctuationStyleChange("formal")}
                className={`py-1 px-1.5 rounded-md border text-center text-[11px] transition-all ${
                  punctuationStyle === "formal"
                    ? "border-primary bg-primary/10 text-primary font-semibold"
                    : "border-input bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                Formal
              </button>
              <button
                type="button"
                data-testid="ai-style-short_sentences-btn"
                onClick={() => handlePunctuationStyleChange("short_sentences")}
                className={`py-1 px-1.5 rounded-md border text-center text-[11px] transition-all ${
                  punctuationStyle === "short_sentences"
                    ? "border-primary bg-primary/10 text-primary font-semibold"
                    : "border-input bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                Short
              </button>
            </div>
          </div>

          {/* Custom Model ID Input */}
          <div className="space-y-1.5 pt-2 border-t border-border/60">
            <label
              htmlFor="ai-custom-model-input"
              className="text-xs font-medium text-foreground block"
            >
              Custom Model Identifier (Optional)
            </label>
            <input
              id="ai-custom-model-input"
              data-testid="ai-custom-model-input"
              type="text"
              placeholder="e.g. meta-llama/llama-3.3-70b-instruct:free"
              value={selectedModel}
              onChange={(e) => handleModelChange(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* OpenRouter API Key Input */}
          <div className="space-y-1.5 pt-2 border-t border-border/60">
            <label
              htmlFor="ai-api-key-input"
              className="text-xs font-medium text-foreground flex items-center justify-between"
            >
              <span className="flex items-center gap-1.5">
                <Key className="h-3 w-3 text-muted-foreground" />
                OpenRouter API Key (Optional)
              </span>
              <span className="text-[10px] text-muted-foreground">Private & Local</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                id="ai-api-key-input"
                data-testid="ai-api-key-input"
                type="password"
                placeholder="sk-or-v1-..."
                value={apiKey}
                onChange={(e) => handleApiKeyChange(e.target.value)}
                className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <Button
                type="button"
                data-testid="ai-test-api-key-btn"
                variant="outline"
                size="sm"
                onClick={handleTestConnection}
                disabled={isTestingKey}
                className="h-8 text-xs shrink-0"
                title="Test connection to OpenRouter with current key and model"
              >
                {isTestingKey ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : (
                  <span>Test Key</span>
                )}
              </Button>
            </div>
            {testStatus && (
              <div
                data-testid="ai-test-connection-result"
                className={`text-[11px] p-2 rounded border ${
                  testStatus.success
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "border-destructive/30 bg-destructive/10 text-destructive"
                }`}
              >
                {testStatus.message}
              </div>
            )}
            <p className="text-[11px] text-muted-foreground">
              Free models can be accessed without a key. Providing your free OpenRouter API key
              prevents anonymous rate-limit throttling.
            </p>
          </div>

          {/* Auto-apply checkbox */}
          <div className="pt-2 border-t border-border/60">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                data-testid="ai-auto-apply-checkbox"
                checked={autoApply}
                onChange={(e) => handleToggleAutoApply(e.target.checked)}
                className="rounded border-input text-primary focus:ring-primary h-4 w-4 mt-0.5 cursor-pointer"
              />
              <span className="text-xs text-foreground leading-tight">
                Automatically apply punctuated subtitles to player upon completion
              </span>
            </label>
          </div>
        </div>

        {/* Right Column: Processing Controls & Real-Time Stats */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5 space-y-5 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-primary" />
                Punctuation Pipeline & Action
              </h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Layers className="h-3.5 w-3.5" />
                <span>
                  {rawCues.length} segments in base track ({baseLanguage || "en"})
                </span>
              </div>
            </div>

            {/* Cached AI Subtitles Card */}
            {cachedAiData && (
              <div
                data-testid="cached-ai-subtitles-card"
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3.5 text-xs shadow-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-foreground">
                      Cached AI Subtitles Available
                    </span>
                    <Badge variant="secondary" className="text-[10px] font-mono">
                      {cachedAiData.modelUsed || "AI model"}
                    </Badge>
                    {cachedAiData.punctuatedCount !== undefined && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                        +{cachedAiData.punctuatedCount} marks
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Saved on {new Date(cachedAiData.timestamp).toLocaleString()} for{" "}
                    {(cachedAiData.lang || baseLanguage).toUpperCase()} · Video{" "}
                    {cachedAiData.videoId}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border/70 bg-background/90 p-1 shadow-2xs">
                  <Button
                    type="button"
                    size="sm"
                    variant="default"
                    data-testid="load-cached-ai-subtitles-btn"
                    onClick={() => handleLoadCachedAiSubtitles(false)}
                    className="h-7 px-2.5 text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-xs"
                  >
                    <FileCheck className="h-3.5 w-3.5" />
                    <span>Load &amp; Apply</span>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    data-testid="preview-cached-ai-subtitles-btn"
                    onClick={handlePreviewCachedAiSubtitles}
                    className="h-7 px-2.5 text-xs gap-1.5"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Preview Diff</span>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    data-testid="clear-cached-ai-subtitles-btn"
                    onClick={handleClearCachedAiSubtitles}
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive gap-1"
                    title="Clear cached AI subtitles for this video"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Clear</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Solely Punctuation Active Indicator */}
            {isSolelyPunctuationActive && (
              <div
                data-testid="ai-solely-punctuation-badge"
                className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-300"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-semibold">
                    Player is currently relying solely on sentence punctuation marks for alignment
                    &amp; lookahead translation!
                  </span>
                </div>
                {onRevertCriteria && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    data-testid="ai-revert-criteria-btn"
                    onClick={onRevertCriteria}
                    className="h-6 text-[11px] px-2 border-emerald-500/30 hover:bg-emerald-500/20"
                  >
                    Reset Alignment
                  </Button>
                )}
              </div>
            )}

            {/* Error Notice */}
            {errorNotice && (
              <div
                data-testid="ai-error-notice"
                className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span className="flex-1">{errorNotice}</span>
              </div>
            )}

            {/* Progress Display */}
            {isProcessing && (
              <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground flex items-center gap-2">
                    <RefreshCw className="h-3 w-3 animate-spin text-primary" />
                    {progressMessage}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-primary">{progressPercent}%</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCancelProcessing}
                      data-testid="ai-cancel-processing-btn"
                      className="h-6 px-2 text-[10px] text-destructive border-destructive/40 hover:bg-destructive/10"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    data-testid="ai-punctuation-progress-bar"
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Completed Stats Card */}
            {result && !isProcessing && (
              <div
                data-testid="ai-stats-card"
                className="grid grid-cols-2 sm:grid-cols-5 gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4"
              >
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase font-medium">
                    Processed
                  </div>
                  <div className="text-base font-bold text-foreground">
                    {result.stats.totalSegments} segments
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase font-medium">
                    Punctuation Added
                  </div>
                  <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                    +{result.stats.punctuationMarksAdded} marks
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase font-medium">
                    Capitalized Words
                  </div>
                  <div className="text-base font-bold text-blue-600 dark:text-blue-400">
                    +{result.stats.capitalizedWordsCount} words
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase font-medium">
                    Batches &amp; Latency
                  </div>
                  <div className="text-sm font-bold text-foreground" data-testid="ai-stats-latency">
                    {result.stats.batchesCount} b ·{" "}
                    {(result.stats.totalLatencyMs / 1000).toFixed(1)}s
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase font-medium">
                    Active Model
                  </div>
                  <div
                    className="text-xs font-mono font-semibold text-foreground truncate"
                    title={result.stats.modelUsed}
                  >
                    {result.stats.modelUsed}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                type="button"
                data-testid="start-ai-punctuation-btn"
                onClick={handleStartProcessing}
                disabled={isProcessing || rawCues.length === 0}
                className="gap-2 font-medium"
              >
                <Sparkles className="h-4 w-4" />
                <span>
                  {isProcessing
                    ? "Processing AI Punctuation…"
                    : result
                      ? "Re-Process with AI"
                      : "Start AI Punctuation Processing"}
                </span>
              </Button>

              {result && (
                <>
                  <Button
                    type="button"
                    data-testid="apply-ai-subtitles-btn"
                    onClick={() => handleApplyPunctuated(false)}
                    variant="default"
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                  >
                    <FileCheck className="h-4 w-4" />
                    <span>Apply Punctuated Subtitles</span>
                  </Button>
                  <Button
                    type="button"
                    data-testid="apply-ai-subtitles-solely-punctuation-btn"
                    onClick={() => handleApplyPunctuated(true)}
                    variant="outline"
                    className="gap-2 border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-medium"
                    title="Apply punctuated subtitles and switch division criteria to rely solely on sentence punctuation marks"
                  >
                    <Split className="h-4 w-4" />
                    <span>Apply &amp; Rely Solely on Punctuation</span>
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
            <strong>How this works:</strong> Standard YouTube subtitles lack sentence-ending
            punctuation. Once punctuated by the AI, sentences are split cleanly by punctuation.
            Then, the lookahead translation engine translates each full sentence ahead on demand.
          </div>
        </div>
      </div>

      {/* Comparison & Preview Panel */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/30 px-5 py-3">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">Subtitle Segments Preview</h3>
            <Badge variant="outline" className="text-xs font-mono">
              {displayedSegments.length} rows
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center rounded-lg border border-input bg-background p-0.5 text-xs">
              <button
                type="button"
                data-testid="ai-view-side-by-side-btn"
                onClick={() => setViewMode("side-by-side")}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  viewMode === "side-by-side"
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="flex items-center gap-1">
                  <Split className="h-3 w-3" />
                  Side-by-Side
                </span>
              </button>
              <button
                type="button"
                data-testid="ai-view-diff-btn"
                onClick={() => setViewMode("diff")}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  viewMode === "diff"
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  Diff View
                </span>
              </button>
            </div>

            {/* Search Filter */}
            <input
              type="text"
              placeholder="Search in cues…"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-36 sm:w-48 rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Cues Table */}
        <div className="max-h-[500px] overflow-auto">
          <table className="w-full border-collapse text-xs">
            <thead className="sticky top-0 z-10 bg-muted border-b border-border text-muted-foreground">
              <tr>
                <th className="w-16 px-3 py-2 text-left font-mono">#</th>
                <th className="w-24 px-3 py-2 text-left font-mono">Time</th>
                <th className="px-3 py-2 text-left font-medium">Original Raw Subtitle</th>
                <th className="px-3 py-2 text-left font-medium">
                  {result ? "AI Punctuated Subtitle" : "AI Preview (Run processing to view)"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {displayedSegments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground">
                    No subtitle segments found matching your filter.
                  </td>
                </tr>
              ) : (
                displayedSegments.map((seg) => (
                  <tr key={seg.index} className="hover:bg-muted/20 transition-colors">
                    <td className="px-3 py-2 font-mono text-muted-foreground">{seg.index + 1}</td>
                    <td className="px-3 py-2 font-mono text-muted-foreground whitespace-nowrap">
                      {fmt(seg.start)}–{fmt(seg.end)}
                    </td>
                    <td className="px-3 py-2 text-foreground/80 leading-relaxed font-normal">
                      {seg.originalText}
                    </td>
                    <td className="px-3 py-2 leading-relaxed">
                      {seg.punctuatedText ? (
                        viewMode === "diff" ? (
                          <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                            {seg.punctuatedText}
                          </span>
                        ) : (
                          <span className="text-foreground font-medium">{seg.punctuatedText}</span>
                        )
                      ) : (
                        <span className="text-muted-foreground italic">
                          Awaiting AI punctuation processing…
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
