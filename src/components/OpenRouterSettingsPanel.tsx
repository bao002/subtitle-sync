import React, { useState, useEffect, useCallback } from "react";
import {
  Key,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Cpu,
  RefreshCw,
} from "lucide-react";
import {
  getOpenRouterApiKeySetting,
  setOpenRouterApiKeySetting,
  getOpenRouterModelSetting,
  setOpenRouterModelSetting,
} from "@/utils/appSettings";
import {
  CURATED_FREE_MODELS,
  DEFAULT_OPENROUTER_MODEL,
  fetchOpenRouterFreeModels,
  testOpenRouterConnection,
  type OpenRouterModel,
} from "@/utils/openRouterAiService";
import { getServerOpenRouterApiKey, hasCustomOpenRouterApiKey } from "@/lib/alternative-tts";

export interface OpenRouterSettingsPanelProps {
  apiKey?: string;
  onSaveApiKey?: (key: string) => void;
  onClearApiKey?: () => void;
  selectedModel?: string;
  onModelChange?: (modelId: string) => void;
  className?: string;
}

/**
 * Shared OpenRouter API Key & Free Models Settings Panel.
 * Fetches free models from OpenRouter on component init, defaults to `openrouter/auto:free`,
 * and renders inside the 1st accordion in Settings across Advanced Mode, Beginner Mode, and Storybook.
 */
export const OpenRouterSettingsPanel: React.FC<OpenRouterSettingsPanelProps> = React.memo(
  ({
    apiKey,
    onSaveApiKey,
    onClearApiKey,
    selectedModel: selectedModelProp,
    onModelChange,
    className = "",
  }) => {
    const [keyInput, setKeyInput] = useState<string>(() =>
      apiKey !== undefined ? apiKey : getOpenRouterApiKeySetting(),
    );
    const [savedEffectiveKey, setSavedEffectiveKey] = useState<string>(() =>
      (apiKey !== undefined ? apiKey : getOpenRouterApiKeySetting()).trim(),
    );
    const [selectedModel, setSelectedModel] = useState<string>(() => {
      if (selectedModelProp && selectedModelProp.trim()) return selectedModelProp.trim();
      return getOpenRouterModelSetting() || DEFAULT_OPENROUTER_MODEL;
    });
    const [freeModels, setFreeModels] = useState<OpenRouterModel[]>(() => CURATED_FREE_MODELS);
    const [isLoadingModels, setIsLoadingModels] = useState<boolean>(false);
    const [modelsFetchCount, setModelsFetchCount] = useState<number>(0);

    const [showKey, setShowKey] = useState<boolean>(false);
    const [savedFeedback, setSavedFeedback] = useState<boolean>(false);
    const [isTesting, setIsTesting] = useState<boolean>(false);
    const [testResult, setTestResult] = useState<{
      success: boolean;
      message: string;
      latencyMs?: number;
    } | null>(null);

    useEffect(() => {
      if (apiKey !== undefined) {
        setKeyInput(apiKey);
        setSavedEffectiveKey(apiKey.trim());
      }
    }, [apiKey]);

    useEffect(() => {
      if (selectedModelProp && selectedModelProp.trim()) {
        setSelectedModel(selectedModelProp.trim());
      }
    }, [selectedModelProp]);

    const loadFreeModels = useCallback(async (effectiveKey: string, forceRefresh = false) => {
      setIsLoadingModels(true);
      try {
        const models = await fetchOpenRouterFreeModels(effectiveKey, { forceRefresh });
        setFreeModels(models.length > 0 ? models : CURATED_FREE_MODELS);
        setModelsFetchCount((prev) => prev + 1);
      } catch {
        setFreeModels(CURATED_FREE_MODELS);
      } finally {
        setIsLoadingModels(false);
      }
    }, []);

    // Automatically fetch active free models on component init and when saved key changes
    useEffect(() => {
      void loadFreeModels(savedEffectiveKey, false);
    }, [savedEffectiveKey, loadFreeModels]);

    const trimmedKey = keyInput.trim();
    const hasCustomKey =
      typeof window !== "undefined" ? hasCustomOpenRouterApiKey() || Boolean(trimmedKey) : false;
    const hasServerKey = Boolean(getServerOpenRouterApiKey());

    const handleSave = () => {
      const clean = keyInput.trim();
      setOpenRouterApiKeySetting(clean);
      setSavedEffectiveKey(clean);
      onSaveApiKey?.(clean);
      setTestResult(null);
      setSavedFeedback(true);
      setTimeout(() => setSavedFeedback(false), 2500);
      void loadFreeModels(clean, true);
    };

    const handleClear = () => {
      setKeyInput("");
      setOpenRouterApiKeySetting("");
      setSavedEffectiveKey("");
      onClearApiKey?.();
      setTestResult(null);
      setSavedFeedback(false);
      void loadFreeModels("", true);
    };

    const handleModelSelect = (nextModel: string) => {
      const resolved = nextModel.trim() || DEFAULT_OPENROUTER_MODEL;
      setSelectedModel(resolved);
      setOpenRouterModelSetting(resolved);
      onModelChange?.(resolved);
    };

    const handleTestConnection = async () => {
      setIsTesting(true);
      setTestResult(null);
      try {
        const activeModel = selectedModel || getOpenRouterModelSetting() || DEFAULT_OPENROUTER_MODEL;
        const effectiveKey = keyInput.trim() || getOpenRouterApiKeySetting();
        const res = await testOpenRouterConnection(effectiveKey, activeModel);
        setTestResult(res);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        setTestResult({ success: false, message });
      } finally {
        setIsTesting(false);
      }
    };

    const dropdownModels = React.useMemo(() => {
      if (!selectedModel || freeModels.some((m) => m.id === selectedModel)) {
        return freeModels;
      }
      return [
        ...freeModels,
        {
          id: selectedModel,
          name: `${selectedModel} (Saved)`,
          isFree: true,
        },
      ];
    }, [freeModels, selectedModel]);

    return (
      <div
        data-testid="openrouter-settings-panel"
        className={`space-y-3 p-3 rounded-lg border border-border bg-card text-card-foreground text-xs ${className}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Key className="h-3.5 w-3.5 text-primary shrink-0" />
            <label
              htmlFor="openrouter-api-key-input"
              className="font-semibold text-xs text-foreground"
            >
              OpenRouter API Key
            </label>
            <span
              data-testid="openrouter-key-status-badge"
              className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${
                hasCustomOpenRouterApiKey()
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                  : hasServerKey
                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30"
                    : "bg-muted text-muted-foreground border-border"
              }`}
            >
              {hasCustomOpenRouterApiKey()
                ? "✓ Custom key saved"
                : hasServerKey
                  ? "Using server .env key"
                  : "Optional (enter sk-or-v1-...)"}
            </span>
          </div>

          <a
            href="https://openrouter.ai/keys"
            target="_blank"
            rel="noreferrer"
            data-testid="openrouter-get-key-link"
            className="text-[11px] font-mono text-primary hover:underline inline-flex items-center gap-1"
          >
            <span>Get OpenRouter Key</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Set your own OpenRouter API key (<code className="font-mono text-primary">sk-or-v1-...</code>)
          to fetch active free models and generate target-word game sentences.
        </p>

        <div className="flex flex-wrap items-center gap-1.5">
          <div className="relative flex-1 min-w-[200px]">
            <input
              id="openrouter-api-key-input"
              data-testid="openrouter-api-key-input"
              type={showKey ? "text" : "password"}
              value={keyInput}
              onChange={(e) => {
                setKeyInput(e.target.value);
                setSavedFeedback(false);
                setTestResult(null);
              }}
              placeholder={
                hasServerKey
                  ? "Using server key (or enter your sk-or-v1-... key)"
                  : "sk-or-v1-..."
              }
              className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 pr-8 text-xs font-mono text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="button"
              data-testid="openrouter-toggle-show-key-btn"
              onClick={() => setShowKey((prev) => !prev)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              title={showKey ? "Hide API key" : "Show API key"}
              aria-label={showKey ? "Hide API key" : "Show API key"}
            >
              {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>

          <button
            type="button"
            data-testid="openrouter-save-key-btn"
            onClick={handleSave}
            className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium cursor-pointer transition"
          >
            {savedFeedback ? "Saved!" : "Save Key"}
          </button>

          {(keyInput || hasCustomKey) && (
            <button
              type="button"
              data-testid="openrouter-clear-key-btn"
              onClick={handleClear}
              className="px-2.5 py-1.5 rounded-md border border-input bg-background text-muted-foreground hover:text-foreground text-xs cursor-pointer transition"
              title="Clear saved OpenRouter key"
            >
              Clear
            </button>
          )}

          <button
            type="button"
            data-testid="openrouter-test-connection-btn"
            disabled={isTesting}
            onClick={handleTestConnection}
            className="px-2.5 py-1.5 rounded-md border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium inline-flex items-center gap-1 disabled:opacity-60 cursor-pointer transition"
          >
            {isTesting ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Testing…</span>
              </>
            ) : (
              <span>Test Key</span>
            )}
          </button>
        </div>

        {/* Free Models Dropdown List (fetched on component init, defaults to openrouter/auto:free) */}
        <div
          data-testid="openrouter-free-models-section"
          className="pt-2.5 border-t border-border/50 space-y-1.5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor="openrouter-free-models-dropdown"
              className="font-semibold text-xs text-foreground inline-flex items-center gap-1.5"
            >
              <Cpu className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>Free AI Model</span>
              <span
                data-testid="openrouter-models-count-badge"
                className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border"
              >
                {isLoadingModels ? "Loading…" : `${dropdownModels.length} free`}
              </span>
            </label>

            <button
              type="button"
              data-testid="openrouter-refresh-models-btn"
              disabled={isLoadingModels}
              onClick={() =>
                void loadFreeModels(keyInput.trim() || getOpenRouterApiKeySetting(), true)
              }
              className="text-[11px] font-medium text-primary hover:underline inline-flex items-center gap-1 disabled:opacity-50 cursor-pointer"
              title="Refresh free OpenRouter models list"
            >
              <RefreshCw className={`h-3 w-3 ${isLoadingModels ? "animate-spin" : ""}`} />
              <span>Refresh Models</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              id="openrouter-free-models-dropdown"
              data-testid="openrouter-free-models-dropdown"
              value={selectedModel}
              onChange={(e) => handleModelSelect(e.target.value)}
              data-fetch-count={modelsFetchCount}
              className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              {dropdownModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.id === DEFAULT_OPENROUTER_MODEL
                    ? `${model.name || "OpenRouter Auto"} — ${model.id} (Default)`
                    : `${model.name} (${model.id})`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {testResult && (
          <div
            data-testid="openrouter-test-result"
            className={`flex items-center justify-between gap-2 p-2 rounded border text-[11px] ${
              testResult.success
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                : "bg-destructive/10 border-destructive/30 text-destructive"
            }`}
          >
            <div className="flex items-center gap-1.5">
              {testResult.success ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
            {typeof testResult.latencyMs === "number" && (
              <span className="font-mono opacity-80">{testResult.latencyMs}ms</span>
            )}
          </div>
        )}
      </div>
    );
  },
);

OpenRouterSettingsPanel.displayName = "OpenRouterSettingsPanel";
