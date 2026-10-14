import React, { useState, useEffect } from "react";
import {
  ArrowUp,
  ArrowDown,
  RotateCcw,
  CheckCircle2,
  ShieldCheck,
  Globe,
  Server,
  Trophy,
  Shuffle,
  Clock,
  Sliders,
  HelpCircle,
} from "lucide-react";
import {
  type FetchAttempt,
  type FetchStrategyMode,
  type SubtitleFetchStrategyConfig,
  DEFAULT_ATTEMPT_ORDER,
  DEFAULT_FETCH_SERVER_URL,
  DEFAULT_FETCH_STRATEGY_CONFIG,
  getFetchStrategyConfig,
  setFetchStrategyConfig,
  moveAttempt,
} from "@/lib/subtitle-fetch-plan";
import { WinnerPromotionReportModal } from "./WinnerPromotionReportModal";

interface Props {
  order: FetchAttempt[];
  onChangeOrder: (next: FetchAttempt[]) => void;
  promoteSuccess: boolean;
  onTogglePromoteSuccess: (next: boolean) => void;
  useFetchServer?: boolean;
  onToggleUseFetchServer?: (next: boolean) => void;
  fetchServerUrl?: string;
  onUpdateFetchServerUrl?: (url: string) => void;
  onSelectVideo?: (videoId: string) => void;
  strategyConfig?: SubtitleFetchStrategyConfig;
  onChangeStrategyConfig?: (next: SubtitleFetchStrategyConfig) => void;
  windowSeconds?: number;
  onChangeWindowSeconds?: (sec: number) => void;
}

export const AttemptOrderSettings: React.FC<Props> = ({
  order,
  onChangeOrder,
  promoteSuccess,
  onTogglePromoteSuccess,
  useFetchServer = false,
  onToggleUseFetchServer,
  fetchServerUrl = DEFAULT_FETCH_SERVER_URL,
  onUpdateFetchServerUrl,
  onSelectVideo,
  strategyConfig,
  onChangeStrategyConfig,
  windowSeconds,
  onChangeWindowSeconds,
}) => {
  const [inputServerUrl, setInputServerUrl] = useState(fetchServerUrl);
  const [showWinnerReport, setShowWinnerReport] = useState(false);
  const [showExplanation, setShowExplanation] = useState(true);

  const [activeStrategyConfig, setActiveStrategyConfig] = useState<SubtitleFetchStrategyConfig>(
    () => strategyConfig || getFetchStrategyConfig(),
  );

  useEffect(() => {
    if (strategyConfig) {
      setActiveStrategyConfig(strategyConfig);
    }
  }, [strategyConfig]);

  useEffect(() => {
    setInputServerUrl(fetchServerUrl);
  }, [fetchServerUrl]);

  const handleUpdateConfig = (patch: Partial<SubtitleFetchStrategyConfig>) => {
    const next = setFetchStrategyConfig(patch);
    setActiveStrategyConfig(next);
    onChangeStrategyConfig?.(next);
    if (patch.windowSeconds !== undefined && onChangeWindowSeconds) {
      onChangeWindowSeconds(patch.windowSeconds);
    }
  };

  const handleSaveServerUrl = () => {
    onUpdateFetchServerUrl?.(inputServerUrl.trim());
  };

  const handleToggle = (index: number) => {
    const next = [...order];
    const current = next[index];
    if (!current) return;
    next[index] = { ...current, enabled: !current.enabled };
    onChangeOrder(next);
  };

  const handleMove = (index: number, dir: -1 | 1) => {
    const next = moveAttempt(order, index, dir);
    onChangeOrder(next);
  };

  const handleReset = () => {
    onChangeOrder([...DEFAULT_ATTEMPT_ORDER]);
    handleUpdateConfig({ ...DEFAULT_FETCH_STRATEGY_CONFIG });
  };

  const describeAttempt = (a: FetchAttempt) => {
    const isTranslate = a.mode === "tlang";
    const isSession = a.send === "session";
    return {
      title: `${isTranslate ? "Translate (tlang)" : "Direct Track (lang)"} · ${
        isSession ? "Player Session" : "Link-Only (Anon)"
      }`,
      subtitle: isSession
        ? `${isTranslate ? "Keeps original lang and requests target tlang" : "Replaces lang parameter directly"} using captured player cookies & headers.`
        : `${isTranslate ? "Requests tlang" : "Replaces lang"} via bare URL without session cookies (like pasting in browser).`,
    };
  };

  return (
    <div
      id="subtitle-attempt-order-settings"
      data-testid="subtitle-attempt-order-settings"
      className="space-y-3.5 rounded-xl border border-border/70 bg-card/60 p-3.5 sm:p-4 text-xs shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2.5">
        <div>
          <h3 className="font-semibold text-foreground text-sm flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-primary" />
            <span>Subtitle Fetch Strategy & Attempt Order</span>
          </h3>
          <p className="text-muted-foreground text-[11px] mt-0.5">
            Sequential & randomized fallback chain (tlang/lang × session/anon). Stops at first good
            response.
          </p>
        </div>
        <button
          type="button"
          onClick={handleReset}
          data-testid="reset-attempt-order-button"
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-border bg-muted/60 hover:bg-muted text-foreground text-[11px] font-medium transition active:scale-95"
          title="Reset to default attempts order"
        >
          <RotateCcw className="w-3 h-3 text-muted-foreground" />
          <span>Reset Order</span>
        </button>
      </div>

      {/* Fetching Strategy Mode Selector */}
      <div className="rounded-lg border border-border/70 bg-background/70 p-3 space-y-2.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <label
            htmlFor="fetch-strategy-mode-select"
            className="font-medium text-foreground text-[12px] flex items-center gap-1.5"
          >
            <Shuffle className="w-3.5 h-3.5 text-primary" />
            <span>Active Strategy:</span>
          </label>
          <select
            id="fetch-strategy-mode-select"
            data-testid="fetch-strategy-mode-select"
            value={activeStrategyConfig.mode}
            onChange={(e) =>
              handleUpdateConfig({ mode: e.target.value as FetchStrategyMode })
            }
            className="rounded border border-input bg-card px-2.5 py-1 text-xs font-medium text-foreground focus:ring-1 focus:ring-primary"
          >
            <option value="ordered">Ordered Fallback (Deterministic 1→4)</option>
            <option value="random">First-Random Strategy (Anti-Bot Fingerprint)</option>
            <option value="server_alternate">Server Alternate (Client vs Proxy)</option>
          </select>
        </div>

        {/* Configuration Options / Switches */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 border-t border-border/50 text-[11px]">
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              id="strategy-toggle-server-alternate"
              data-testid="strategy-toggle-server-alternate"
              checked={activeStrategyConfig.useServerAlternate}
              onChange={(e) =>
                handleUpdateConfig({ useServerAlternate: e.target.checked })
              }
              className="rounded border-input text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
            />
            <span className="text-foreground">server:alternate</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              id="strategy-toggle-session"
              data-testid="strategy-toggle-session"
              checked={activeStrategyConfig.allowSession}
              onChange={(e) =>
                handleUpdateConfig({ allowSession: e.target.checked })
              }
              className="rounded border-input text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
            />
            <span className="text-foreground">session:yes/no</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              id="strategy-toggle-anon"
              data-testid="strategy-toggle-anon"
              checked={activeStrategyConfig.allowAnon}
              onChange={(e) =>
                handleUpdateConfig({ allowAnon: e.target.checked })
              }
              className="rounded border-input text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
            />
            <span className="text-foreground">anon (link-only)</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              id="strategy-toggle-tlang"
              data-testid="strategy-toggle-tlang"
              checked={activeStrategyConfig.allowTlang}
              onChange={(e) =>
                handleUpdateConfig({ allowTlang: e.target.checked })
              }
              className="rounded border-input text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
            />
            <span className="text-foreground">tlang:on/off</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              id="strategy-toggle-lang"
              data-testid="strategy-toggle-lang"
              checked={activeStrategyConfig.allowLang}
              onChange={(e) =>
                handleUpdateConfig({ allowLang: e.target.checked })
              }
              className="rounded border-input text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
            />
            <span className="text-foreground">lang:on/off</span>
          </label>
        </div>

        {/* Window Frame Rate Limiting Input */}
        <div className="pt-2 border-t border-border/50 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-foreground text-[11px]">
            <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="font-medium">Fetch Window Frame:</span>
            <span className="text-muted-foreground text-[10px]">
              (Never &gt;1 fetch per window of X seconds)
            </span>
          </div>
          <div className="flex items-center gap-1">
            <input
              type="number"
              id="strategy-window-seconds-input"
              data-testid="strategy-window-seconds-input"
              min={1}
              max={60}
              value={activeStrategyConfig.windowSeconds}
              onChange={(e) => {
                const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                handleUpdateConfig({ windowSeconds: val });
              }}
              className="w-14 rounded border border-input bg-card px-2 py-0.5 text-xs text-right font-mono"
            />
            <span className="text-[11px] text-muted-foreground">sec</span>
          </div>
        </div>
      </div>

      {/* Attempt Order Rows */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-semibold text-foreground flex items-center justify-between">
          <span>Priority Sequence (Drag or toggle attempts)</span>
          <span className="text-[10px] text-muted-foreground font-normal">
            {activeStrategyConfig.mode === "random"
              ? "Randomized per fetch"
              : "Executed in order"}
          </span>
        </div>

        {order.map((a, idx) => {
          const info = describeAttempt(a);
          const isFirst = idx === 0;
          const isLast = idx === order.length - 1;

          return (
            <div
              key={`${a.mode}-${a.send}`}
              data-testid={`attempt-row-${a.mode}-${a.send}`}
              className={`flex items-center justify-between gap-2.5 p-2 rounded-lg border transition ${
                a.enabled
                  ? "bg-background/80 border-border/80 text-foreground"
                  : "bg-muted/30 border-dashed border-border/50 text-muted-foreground opacity-60"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="font-mono text-[11px] font-bold text-muted-foreground w-4 text-center">
                  #{idx + 1}
                </span>
                <input
                  type="checkbox"
                  checked={a.enabled}
                  onChange={() => handleToggle(idx)}
                  data-testid={`attempt-toggle-${a.mode}-${a.send}`}
                  className="rounded border-input text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                  title="Enable or disable this attempt"
                />
                <div className="min-w-0">
                  <div className="font-medium text-foreground flex items-center gap-1.5 flex-wrap">
                    <span>{info.title}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-semibold uppercase ${
                        a.send === "session"
                          ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                          : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      }`}
                    >
                      {a.send}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate">{info.subtitle}</p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  disabled={isFirst}
                  onClick={() => handleMove(idx, -1)}
                  data-testid={`attempt-move-up-${a.mode}-${a.send}`}
                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition"
                  title="Move up in order"
                  aria-label="Move attempt up"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={isLast}
                  onClick={() => handleMove(idx, 1)}
                  data-testid={`attempt-move-down-${a.mode}-${a.send}`}
                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition"
                  title="Move down in order"
                  aria-label="Move attempt down"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-2 border-t border-border/60">
        <label className="flex items-center gap-2 cursor-pointer select-none text-foreground font-medium text-[11px]">
          <input
            type="checkbox"
            checked={promoteSuccess}
            onChange={(e) => onTogglePromoteSuccess(e.target.checked)}
            data-testid="promote-successful-attempt-toggle"
            className="rounded border-input text-primary focus:ring-primary h-4 w-4 cursor-pointer"
          />
          <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
          <span>Move successful attempt to front automatically</span>
        </label>
        <p className="text-[10px] text-muted-foreground ml-6 mt-0.5">
          When enabled, the attempt style that yields a good response is remembered and prioritized
          first on subsequent subtitle fetches.
        </p>

        <div className="mt-2.5 flex items-center justify-between gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px]">
          <div className="flex items-center gap-1.5 text-foreground">
            <Trophy className="h-4 w-4 text-amber-500 shrink-0" />
            <span className="font-medium">Winner Promotion History:</span>
            <span className="text-muted-foreground hidden sm:inline">
              Persisted across all past videos
            </span>
          </div>
          <button
            type="button"
            data-testid="view-winner-promotion-report-btn"
            onClick={() => setShowWinnerReport(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-600 dark:text-amber-400 font-semibold transition active:scale-95"
          >
            <Trophy className="h-3 w-3" />
            <span>View Report</span>
          </button>
        </div>
      </div>

      {/* Explanatory Guide Card */}
      <div
        id="strategy-explanation-panel"
        data-testid="strategy-explanation-panel"
        className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-[11px] text-muted-foreground space-y-1.5"
      >
        <div className="flex items-center justify-between text-foreground font-semibold">
          <span className="flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-primary" />
            <span>How Fetching Strategies & Pacing Protect You</span>
          </span>
          <button
            type="button"
            onClick={() => setShowExplanation(!showExplanation)}
            className="text-[10px] text-primary hover:underline"
          >
            {showExplanation ? "Hide Details" : "Show Details"}
          </button>
        </div>
        {showExplanation && (
          <div className="space-y-1.5 pt-1 text-[10.5px] leading-relaxed">
            <p>
              <strong className="text-foreground">Window Frame Rate Limiting:</strong> Enforces a strict minimum of {activeStrategyConfig.windowSeconds}s between any two YouTube subtitle fetches. Multiple clicks or simultaneous language additions are serialized, never hitting YouTube API concurrently.
            </p>
            <p>
              <strong className="text-foreground">First-Random Strategy:</strong> Shuffles attempt order randomly per request. Bypasses repetitive bot fingerprinting patterns when scraping or fetching multiple tracks.
            </p>
            <p>
              <strong className="text-foreground">Server Alternate:</strong> Distributes requests between local Android WebView (with session cookies) and external server proxy, preventing IP-level rate limits.
            </p>
            <p>
              <strong className="text-foreground">Session vs Anon:</strong> Session uses embedded player cookies/tokens for private tracks; anon uses bare links for public caption streams.
            </p>
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-border/60 space-y-2 opacity-85">
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer select-none text-foreground font-medium text-[11px]">
            <input
              type="checkbox"
              checked={useFetchServer}
              onChange={(e) => onToggleUseFetchServer?.(e.target.checked)}
              data-testid="use-fetch-server-toggle"
              className="rounded border-input text-primary focus:ring-primary h-4 w-4 cursor-pointer"
            />
            <Server className="w-3.5 h-3.5 text-primary" />
            <span>Use server for repeating fetch requests</span>
          </label>
        </div>
        <p className="text-[10px] text-muted-foreground ml-6">
          Android only. Sends the URL anonymously to <code>&lt;server&gt;/api/proxy?url=…</code>.
          Defaults: <code>src/config/server.json</code>.
        </p>

        <div className="ml-6 space-y-1 pt-1">
          <label
            htmlFor="fetch-server-url-input"
            className="text-[11px] font-medium text-foreground block"
          >
            Server address:
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              id="fetch-server-url-input"
              data-testid="fetch-server-url-input"
              value={inputServerUrl}
              onChange={(e) => setInputServerUrl(e.target.value)}
              placeholder="http://localhost:8080/fetch"
              className="flex-1 rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
            />
            <button
              type="button"
              onClick={handleSaveServerUrl}
              data-testid="update-fetch-server-url-button"
              className="px-2.5 py-1 rounded-md border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium transition active:scale-95"
            >
              Update
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Enter server endpoint. URL will receive target via <code>?url=...</code> or replacing{" "}
            <code>{"{url}"}</code> placeholder.
          </p>
        </div>
      </div>

      <WinnerPromotionReportModal
        isOpen={showWinnerReport}
        onClose={() => setShowWinnerReport(false)}
        onSelectVideo={onSelectVideo}
      />
    </div>
  );
};
