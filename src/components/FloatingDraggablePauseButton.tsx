import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Pause,
  Play,
  GripVertical,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  X,
  Info,
  ScrollText,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export interface FloatingDraggablePauseButtonProps {
  isSetupPaused: boolean;
  onToggleSetupPause: () => void;
  isAutoScrollEnabled?: boolean;
  onToggleAutoScroll?: () => void;
  isVideoPlaying?: boolean;
  isSpeaking?: boolean;
  pauseReason?: string | null;
  className?: string;
}

const STORAGE_KEY_POS = "yt_floating_pause_pos";

interface Position {
  x: number;
  y: number;
}

export const FloatingDraggablePauseButton: React.FC<FloatingDraggablePauseButtonProps> = ({
  isSetupPaused,
  onToggleSetupPause,
  isAutoScrollEnabled = false,
  onToggleAutoScroll,
  isVideoPlaying = false,
  isSpeaking = false,
  pauseReason = null,
  className = "",
}) => {
  const [position, setPosition] = useState<Position>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY_POS);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (typeof parsed?.x === "number" && typeof parsed?.y === "number") {
            return parsed;
          }
        }
      } catch {
        // Fallback to default position below
      }
      return {
        x: Math.max(16, window.innerWidth - 220),
        y: Math.max(16, window.innerHeight - 110),
      };
    }
    return { x: 200, y: 500 };
  });

  const [isOpen, setIsOpen] = useState(false);
  const [activeExplanation, setActiveExplanation] = useState<"setup-pause" | "auto-scroll" | null>(
    null,
  );
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ clientX: number; clientY: number } | null>(null);
  const startPosRef = useRef<Position>({ x: 0, y: 0 });
  const hasMovedRef = useRef<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Clamps position inside viewport boundaries
  const clampPosition = useCallback((x: number, y: number): Position => {
    if (typeof window === "undefined") return { x, y };
    const btnWidth = containerRef.current?.offsetWidth || 180;
    const btnHeight = containerRef.current?.offsetHeight || 48;
    const maxX = Math.max(16, window.innerWidth - btnWidth - 16);
    const maxY = Math.max(16, window.innerHeight - btnHeight - 16);
    return {
      x: Math.min(maxX, Math.max(16, x)),
      y: Math.min(maxY, Math.max(16, y)),
    };
  }, []);

  // Window resize handler: keep button within screen bounds
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => clampPosition(prev.x, prev.y));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [clampPosition]);

  // Persist position whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.setItem(STORAGE_KEY_POS, JSON.stringify(position));
      } catch {
        // Ignore storage errors
      }
    }
  }, [position]);

  // Click outside listener to close dropdown
  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setActiveExplanation(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen]);

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    dragStartRef.current = { clientX: e.clientX, clientY: e.clientY };
    startPosRef.current = { ...position };
    hasMovedRef.current = false;
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;
      const dx = e.clientX - dragStartRef.current.clientX;
      const dy = e.clientY - dragStartRef.current.clientY;

      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        hasMovedRef.current = true;
      }

      const nextX = startPosRef.current.x + dx;
      const nextY = startPosRef.current.y + dy;
      setPosition(clampPosition(nextX, nextY));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, clampPosition]);

  // Touch drag handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    dragStartRef.current = { clientX: touch.clientX, clientY: touch.clientY };
    startPosRef.current = { ...position };
    hasMovedRef.current = false;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch || !dragStartRef.current) return;
    const dx = touch.clientX - dragStartRef.current.clientX;
    const dy = touch.clientY - dragStartRef.current.clientY;

    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      hasMovedRef.current = true;
    }

    const nextX = startPosRef.current.x + dx;
    const nextY = startPosRef.current.y + dy;
    setPosition(clampPosition(nextX, nextY));
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  const handleTriggerClick = (e: React.MouseEvent) => {
    if (hasMovedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    setIsOpen((prev) => !prev);
  };

  const handleToggleSetupPauseOption = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSetupPause();
    setActiveExplanation("setup-pause");
  };

  const handleToggleAutoScrollOption = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleAutoScroll) {
      onToggleAutoScroll();
    }
    setActiveExplanation("auto-scroll");
  };

  // Determine popover direction relative to viewport
  const opensUpward = typeof window !== "undefined" ? position.y > window.innerHeight / 2 : true;
  const alignsRight = typeof window !== "undefined" ? position.x > window.innerWidth / 2 : false;

  // The overall playback is effectively active if video is playing or speech is actively speaking
  const isPlaybackActive = isVideoPlaying || isSpeaking;
  const isEffectivelyPaused = isSetupPaused || !isPlaybackActive;

  return (
    <div
      ref={containerRef}
      data-testid="floating-draggable-pause-container"
      role="region"
      aria-label="Floating Controls Controller"
      style={{
        position: "fixed",
        left: `${position.x}px`,
        top: `${position.y}px`,
        touchAction: "none",
        zIndex: 9999,
      }}
      className={`select-none ${className}`}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Floating Trigger Button: 1 floating button of 1 icon */}
      <button
        type="button"
        data-testid="floating-pause-button"
        data-dropdown-trigger="true"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-pressed={isEffectivelyPaused}
        aria-label={
          isEffectivelyPaused
            ? `Paused${pauseReason ? `: ${pauseReason}` : ""}. Click for controls`
            : "Playing: Click for controls"
        }
        title={
          isEffectivelyPaused
            ? `Paused${pauseReason ? ` (${pauseReason})` : ""} - Click for controls`
            : "Playing - Click for controls"
        }
        onClick={handleTriggerClick}
        className={`flex h-12 w-12 items-center justify-center rounded-full border shadow-2xl backdrop-blur-md transition-all duration-150 active:scale-95 ${
          isDragging ? "cursor-grabbing opacity-90 scale-105" : "cursor-grab hover:scale-105"
        } ${
          isEffectivelyPaused
            ? "border-rose-500 bg-rose-600 text-white shadow-rose-500/40 hover:bg-rose-700 ring-2 ring-rose-400/50"
            : "border-emerald-500 bg-emerald-600 text-white shadow-emerald-500/40 hover:bg-emerald-700 ring-2 ring-emerald-400/50"
        }`}
      >
        <span data-testid="floating-dropdown-trigger" className="hidden" aria-hidden="true" />
        <span data-testid="floating-pause-status" className="sr-only">
          {isEffectivelyPaused
            ? `Paused (OFF)${pauseReason ? ` - ${pauseReason}` : ""}`
            : isAutoScrollEnabled
              ? "Auto-Scroll ON"
              : "Playback Active (ON)"}
        </span>
        <span data-testid="floating-pause-badge" className="sr-only">
          {isEffectivelyPaused ? "Playback Paused" : "Playback Active"}
        </span>

        {/* Exactly 1 icon */}
        {isEffectivelyPaused ? (
          <Pause className="h-5 w-5 fill-current shrink-0" />
        ) : isAutoScrollEnabled ? (
          <ScrollText className="h-5 w-5 shrink-0" />
        ) : (
          <Play className="h-5 w-5 fill-current shrink-0 ml-0.5" />
        )}
      </button>

      {/* Pause Reason Tooltip / Notification Chip attached to floating button */}
      {isEffectivelyPaused && pauseReason && !isOpen && (
        <div
          data-testid="floating-pause-reason-chip"
          className={`absolute pointer-events-none rounded-md bg-black/85 text-white px-2 py-1 text-[10px] font-medium shadow-md backdrop-blur-sm border border-white/20 whitespace-nowrap max-w-xs truncate transition-all duration-200 ${
            opensUpward ? "bottom-full mb-1.5" : "top-full mt-1.5"
          } ${alignsRight ? "right-0" : "left-0"}`}
          title={pauseReason}
        >
          {pauseReason}
        </div>
      )}

      {/* Dropdown Menu Popup */}
      {isOpen && (
        <div
          data-testid="floating-menu-dropdown"
          role="menu"
          aria-label="Floating Options Menu"
          className={`absolute w-72 rounded-xl border border-border/80 bg-popover/95 p-3.5 text-popover-foreground shadow-2xl backdrop-blur-md transition-all duration-150 ${
            opensUpward ? "bottom-full mb-2" : "top-full mt-2"
          } ${alignsRight ? "right-0" : "left-0"}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/60 pb-2 mb-2.5">
            <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
              <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
              <span>Floating Controls</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Close floating menu"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {/* Pause Reason Banner in Menu */}
            {isEffectivelyPaused && pauseReason && (
              <div
                data-testid="floating-menu-pause-reason"
                className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-2 text-xs"
              >
                <div className="font-semibold text-rose-600 dark:text-rose-400 text-[11px] flex items-center gap-1 mb-0.5">
                  <Pause className="h-3 w-3 fill-current" />
                  <span>Pause Reason</span>
                </div>
                <div className="text-[11px] text-foreground font-medium">{pauseReason}</div>
              </div>
            )}

            {/* Option 1: Pause for Setup */}
            <div
              data-testid="menu-option-setup-pause"
              className={`rounded-lg border p-2.5 transition-colors cursor-pointer ${
                isSetupPaused
                  ? "border-rose-400/80 bg-rose-500/10 text-foreground"
                  : "border-emerald-500/30 hover:border-emerald-500/60 hover:bg-emerald-500/5"
              }`}
              onClick={handleToggleSetupPauseOption}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-md ${
                      isSetupPaused ? "bg-rose-600 text-white" : "bg-emerald-600 text-white"
                    }`}
                  >
                    {isSetupPaused ? (
                      <Pause className="h-3.5 w-3.5 fill-current" />
                    ) : (
                      <Play className="h-3.5 w-3.5 fill-current" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-semibold leading-tight">Pause for Setup</div>
                    <div className="text-[10px] text-muted-foreground">
                      {isSetupPaused ? "Playback & scrolling frozen (OFF)" : "Normal playback active (ON)"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                      isSetupPaused
                        ? "bg-rose-500/20 text-rose-700 dark:text-rose-300"
                        : "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                    }`}
                  >
                    {isSetupPaused ? "Paused" : "Off"}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveExplanation((prev) =>
                        prev === "setup-pause" ? null : "setup-pause",
                      );
                    }}
                    className="p-1 text-muted-foreground hover:text-foreground"
                    title="Explain Pause for Setup"
                    aria-label="Explain Pause for Setup"
                  >
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Explanation Text */}
              {(activeExplanation === "setup-pause" || isSetupPaused) && (
                <div
                  data-testid="explanation-setup-pause"
                  className="mt-2 rounded bg-muted/60 p-2 text-[11px] leading-relaxed text-muted-foreground border-l-2 border-rose-500"
                >
                  <p className="font-medium text-foreground mb-0.5">Pause for Setup Explanation:</p>
                  Freezes video playback, text-to-speech voice synthesis, and automatic scrolling to
                  allow configuring languages, parser criteria, and audio settings without
                  interruption.
                </div>
              )}
            </div>

            {/* Option 2: Auto Scroll */}
            <div
              data-testid="menu-option-auto-scroll"
              className={`rounded-lg border p-2.5 transition-colors cursor-pointer ${
                isAutoScrollEnabled
                  ? "border-emerald-500/80 bg-emerald-500/10 text-foreground"
                  : "border-rose-400/50 bg-rose-500/5 hover:border-rose-400 hover:bg-rose-500/10"
              }`}
              onClick={handleToggleAutoScrollOption}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-md ${
                      isAutoScrollEnabled
                        ? "bg-emerald-600 text-white"
                        : "bg-rose-600 text-white"
                    }`}
                  >
                    <ScrollText className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold leading-tight">Auto-Scroll Subtitles</div>
                    <div className="text-[10px] text-muted-foreground">
                      {isAutoScrollEnabled ? "Auto-centering active row (ON)" : "Manual scrolling only (OFF)"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                      isAutoScrollEnabled
                        ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                        : "bg-rose-500/20 text-rose-700 dark:text-rose-300"
                    }`}
                  >
                    {isAutoScrollEnabled ? "Enabled" : "Disabled"}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveExplanation((prev) =>
                        prev === "auto-scroll" ? null : "auto-scroll",
                      );
                    }}
                    className="p-1 text-muted-foreground hover:text-foreground"
                    title="Explain Auto-Scroll"
                    aria-label="Explain Auto-Scroll"
                  >
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Explanation Text */}
              {(activeExplanation === "auto-scroll" || isAutoScrollEnabled) && (
                <div
                  data-testid="explanation-auto-scroll"
                  className="mt-2 rounded bg-muted/60 p-2 text-[11px] leading-relaxed text-muted-foreground border-l-2 border-emerald-500"
                >
                  <p className="font-medium text-foreground mb-0.5">
                    Auto-Scroll Subtitles Explanation:
                  </p>
                  Automatically centers and scrolls the parallel subtitles table to follow the
                  active sentence and spoken dialogue during video playback. Automatically holds for
                  5 seconds whenever you touch or scroll the screen.
                </div>
              )}
            </div>
          </div>

          {/* Footer Guidance */}
          <div className="mt-2.5 pt-2 border-t border-border/50 flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Drag handle to reposition anywhere</span>
            <span className="flex items-center gap-1 font-medium">
              {isSetupPaused || isAutoScrollEnabled ? (
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              ) : (
                <XCircle className="h-3 w-3 text-muted-foreground" />
              )}
              {isSetupPaused && isAutoScrollEnabled
                ? "2 Active"
                : isSetupPaused || isAutoScrollEnabled
                  ? "1 Active"
                  : "Inactive"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FloatingDraggablePauseButton;
