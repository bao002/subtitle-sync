import React, { useState, useEffect } from "react";
import { ArrowUp, ArrowDown, RotateCcw, CheckCircle2, ShieldCheck, Globe, Server } from "lucide-react";
import {
  type FetchAttempt,
  DEFAULT_ATTEMPT_ORDER,
  DEFAULT_FETCH_SERVER_URL,
  moveAttempt,
} from "@/lib/subtitle-fetch-plan";

interface Props {
  order: FetchAttempt[];
  onChangeOrder: (next: FetchAttempt[]) => void;
  promoteSuccess: boolean;
  onTogglePromoteSuccess: (next: boolean) => void;
  useFetchServer?: boolean;
  onToggleUseFetchServer?: (next: boolean) => void;
  fetchServerUrl?: string;
  onUpdateFetchServerUrl?: (url: string) => void;
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
}) => {
  const [inputServerUrl, setInputServerUrl] = useState(fetchServerUrl);

  useEffect(() => {
    setInputServerUrl(fetchServerUrl);
  }, [fetchServerUrl]);

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
      className="space-y-3 rounded-xl border border-border/70 bg-card/60 p-3.5 sm:p-4 text-xs shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2.5">
        <div>
          <h3 className="font-semibold text-foreground text-sm flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-primary" />
            <span>Subtitle Fetch Attempt Order (Android)</span>
          </h3>
          <p className="text-muted-foreground text-[11px] mt-0.5">
            Sequential fallback chain (tlang/lang × session/anon). The loop stops at the first good response.
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

      <div className="space-y-1.5">
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
          When enabled, the attempt style that yields a good response is remembered and prioritized first on subsequent subtitle fetches.
        </p>
      </div>

      <div className="pt-2 border-t border-border/60 space-y-2">
        <label className="flex items-center gap-2 cursor-pointer select-none text-foreground font-medium text-[11px]">
          <input
            type="checkbox"
            checked={useFetchServer}
            onChange={(e) => onToggleUseFetchServer?.(e.target.checked)}
            data-testid="use-fetch-server-toggle"
            className="rounded border-input text-primary focus:ring-primary h-4 w-4 cursor-pointer"
          />
          <Server className="w-3.5 h-3.5 text-primary" />
          <span>Use server for repeating fetch requests (off by default)</span>
        </label>
        <p className="text-[10px] text-muted-foreground ml-6">
          Routes repeated subtitle fetches through an external server/proxy to bypass device IP rate limits (e.g. YouTube bot detection HTTP 429).
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
            Enter server endpoint. URL will receive target via <code>?url=...</code> or replacing <code>{"{url}"}</code> placeholder.
          </p>
        </div>
      </div>
    </div>
  );
};
