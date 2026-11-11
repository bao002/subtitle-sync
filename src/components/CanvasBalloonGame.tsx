import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import {
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  RotateCcw,
  SkipBack,
  SkipForward,
  X,
  Sparkles,
  Trophy,
  Languages,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RTL } from "@/lib/subtitles";

export interface CanvasBalloonGameProps {
  /** Current base language sentence (e.g. English) */
  currentSentence: string;
  /** Base language code (e.g. "en") */
  baseLanguage: string;
  /** Base language human name */
  baseLanguageName: string;
  /** Target translation language code (e.g. "he", "es") */
  targetLanguage: string;
  /** Target translation language human name */
  targetLanguageName: string;
  /** Full sentence translated in target language */
  targetTranslation: string;
  /** Available languages to switch target translation */
  availableTargetLanguages?: Array<{ code: string; name: string }>;
  /** Callback when target language changes */
  onSelectTargetLanguage?: (langCode: string) => void;
  /** Active sentence index (0-based) */
  activeRowIndex: number;
  /** Total number of sentences */
  totalRows: number;
  /** Previous sentence navigation */
  onPrevSentence?: () => void;
  /** Next sentence navigation */
  onNextSentence?: () => void;
  /** Replay/Restart sentence */
  onReplaySentence?: () => void;
  /** TTS pronunciation callback */
  onSpeakText?: (text: string, langCode: string) => void;
  /** Callback to exit/close the canvas game */
  onCloseGame?: () => void;
  /** Optional initial full screen mode */
  initialFullScreen?: boolean;
  /** Custom wrapper className */
  className?: string;
}

interface BalloonEntity {
  id: string;
  index: number;
  word: string;
  cleanWord: string;
  translation: string;
  x: number;
  y: number;
  baseX: number;
  radiusX: number;
  radiusY: number;
  speedY: number;
  swaySpeed: number;
  swayAmp: number;
  swayPhase: number;
  color: string;
  shineColor: string;
  popped: boolean;
  stringLength: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  decay: number;
}

interface TranslationTag {
  id: string;
  x: number;
  y: number;
  word: string;
  translation: string;
  alpha: number;
  life: number;
}

const BALLOON_COLORS = [
  { main: "#ef4444", shine: "#fca5a5" }, // red
  { main: "#3b82f6", shine: "#93c5fd" }, // blue
  { main: "#10b981", shine: "#6ee7b7" }, // emerald
  { main: "#f59e0b", shine: "#fde68a" }, // amber
  { main: "#8b5cf6", shine: "#c4b5fd" }, // violet
  { main: "#ec4899", shine: "#fbcfe8" }, // pink
  { main: "#06b6d4", shine: "#a5f3fc" }, // cyan
  { main: "#14b8a6", shine: "#99f6e4" }, // teal
];

function playPopAudioEffect(): void {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);
  } catch {
    // Audio context may be restricted before user interaction
  }
}

function playFanfareAudioEffect(): void {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = ctx.currentTime + i * 0.08;
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.18, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.35);
    });
  } catch {
    // Ignore audio errors
  }
}

function extractWords(text: string): string[] {
  if (!text) return [];
  const matches = text.trim().match(/\S+/g);
  return matches || [];
}

function sanitizeWord(raw: string): string {
  return raw.replace(
    /^[^a-zA-Z0-9\u0590-\u05FF\u0600-\u06FF]+|[^a-zA-Z0-9\u0590-\u05FF\u0600-\u06FF]+$/g,
    "",
  );
}

export const CanvasBalloonGame: React.FC<CanvasBalloonGameProps> = ({
  currentSentence,
  baseLanguage,
  baseLanguageName,
  targetLanguage,
  targetLanguageName,
  targetTranslation,
  availableTargetLanguages = [],
  onSelectTargetLanguage,
  activeRowIndex,
  totalRows,
  onPrevSentence,
  onNextSentence,
  onReplaySentence,
  onSpeakText,
  onCloseGame,
  initialFullScreen = false,
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isFullScreen, setIsFullScreen] = useState<boolean>(initialFullScreen);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [score, setScore] = useState<number>(0);

  // Entities stored in refs for smooth animation frame updates
  const balloonsRef = useRef<BalloonEntity[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const translationTagsRef = useRef<TranslationTag[]>([]);
  const animFrameIdRef = useRef<number | null>(null);

  // Synchronized state for UI progress
  const [poppedIndices, setPoppedIndices] = useState<Set<number>>(new Set());

  const baseWords = useMemo(() => extractWords(currentSentence), [currentSentence]);
  const translationWords = useMemo(() => extractWords(targetTranslation), [targetTranslation]);

  const isBaseRtl = RTL.has(baseLanguage);
  const isTargetRtl = RTL.has(targetLanguage);

  // Initialize or re-inflate balloons when sentence or target translation changes
  const initBalloons = useCallback(() => {
    if (!canvasRef.current || baseWords.length === 0) {
      balloonsRef.current = [];
      setPoppedIndices(new Set());
      return;
    }

    const canvas = canvasRef.current;
    const width = canvas.width;
    const height = canvas.height;

    const count = baseWords.length;
    // Calculate column spacing across width
    const colWidth = width / (count + 1);

    const newBalloons: BalloonEntity[] = baseWords.map((word, index) => {
      const cleanWord = sanitizeWord(word);
      const palette = BALLOON_COLORS[index % BALLOON_COLORS.length];

      // Proportional word alignment to target translation words
      let wordTranslation = "";
      if (translationWords.length > 0) {
        if (baseWords.length === translationWords.length) {
          wordTranslation = translationWords[index];
        } else {
          const targetIndex = Math.min(
            translationWords.length - 1,
            Math.floor((index / baseWords.length) * translationWords.length),
          );
          wordTranslation = translationWords[targetIndex];
        }
      }
      if (!wordTranslation) {
        wordTranslation = `[${cleanWord || word}]`;
      }

      const baseX = colWidth * (index + 1) + (Math.random() - 0.5) * (colWidth * 0.4);
      const baseY = height + 40 + index * 60 + Math.random() * 80;

      // Balloon size adapted to word length
      const radiusX = Math.max(38, Math.min(65, cleanWord.length * 6 + 24));
      const radiusY = radiusX * 1.25;

      return {
        id: `balloon-${index}-${cleanWord}`,
        index,
        word,
        cleanWord,
        translation: sanitizeWord(wordTranslation) || wordTranslation,
        x: baseX,
        y: baseY,
        baseX,
        radiusX,
        radiusY,
        speedY: 1.1 + Math.random() * 0.6,
        swaySpeed: 0.025 + Math.random() * 0.02,
        swayAmp: 18 + Math.random() * 14,
        swayPhase: Math.random() * Math.PI * 2,
        color: palette.main,
        shineColor: palette.shine,
        popped: false,
        stringLength: 35 + Math.random() * 15,
      };
    });

    balloonsRef.current = newBalloons;
    particlesRef.current = [];
    translationTagsRef.current = [];
    setPoppedIndices(new Set());
  }, [baseWords, translationWords]);

  // Adjust canvas dimensions to match container or full screen
  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const w = Math.floor(rect.width || window.innerWidth);
      const h = Math.floor(rect.height || (isFullScreen ? window.innerHeight : 540));

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(dpr, dpr);
      }

      initBalloons();
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isFullScreen, initBalloons]);

  // Fullscreen toggle handler (Native API with fallback)
  const toggleFullScreen = useCallback(() => {
    setIsFullScreen((prev) => {
      const next = !prev;
      if (next) {
        try {
          if (containerRef.current?.requestFullscreen && document.fullscreenEnabled) {
            containerRef.current.requestFullscreen().catch(() => {});
          }
        } catch {
          // Fallback to CSS full-screen
        }
      } else {
        try {
          if (document.fullscreenElement && document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
          }
        } catch {
          // Ignore
        }
      }
      return next;
    });
  }, []);

  // Listen for fullscreen change from browser (e.g. Esc key)
  useEffect(() => {
    const onFullscreenChange = () => {
      if (!document.fullscreenElement && isFullScreen) {
        setIsFullScreen(false);
      }
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, [isFullScreen]);

  // Key listener: Esc exits fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullScreen) {
        setIsFullScreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullScreen]);

  // Spawn confetti particles on pop
  const spawnPopParticles = (x: number, y: number, color: string) => {
    const particleCount = 24;
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
      const speed = 2.5 + Math.random() * 4.5;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        color,
        size: 3 + Math.random() * 4,
        alpha: 1,
        decay: 0.02 + Math.random() * 0.015,
      });
    }
  };

  // Handle popping a balloon at given index
  const popBalloon = useCallback(
    (balloon: BalloonEntity) => {
      if (balloon.popped) return;

      balloon.popped = true;
      if (soundEnabled) {
        playPopAudioEffect();
      }

      spawnPopParticles(balloon.x, balloon.y, balloon.color);

      // Add floating translation tag at pop location
      translationTagsRef.current.push({
        id: `tag-${Date.now()}-${balloon.index}`,
        x: balloon.x,
        y: balloon.y - 10,
        word: balloon.cleanWord,
        translation: balloon.translation,
        alpha: 1,
        life: 0,
      });

      // Pronounce translation via TTS
      if (onSpeakText && balloon.translation) {
        onSpeakText(balloon.translation, targetLanguage);
      }

      setScore((s) => s + 10);
      setPoppedIndices((prev) => {
        const next = new Set(prev);
        next.add(balloon.index);

        // Check if all balloons are now popped
        if (next.size === balloonsRef.current.length) {
          if (soundEnabled) {
            playFanfareAudioEffect();
          }
          // Spawn victory confetti bursts
          const canvas = canvasRef.current;
          if (canvas) {
            const w = canvas.width / (window.devicePixelRatio || 1);
            const h = canvas.height / (window.devicePixelRatio || 1);
            spawnPopParticles(w * 0.3, h * 0.4, "#f59e0b");
            spawnPopParticles(w * 0.7, h * 0.4, "#ec4899");
          }
        }
        return next;
      });
    },
    [soundEnabled, onSpeakText, targetLanguage],
  );

  // Main Canvas Animation Render Loop
  useEffect(() => {
    let animId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      // 1. Clear frame with atmospheric background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, "#0b0f19");
      bgGrad.addColorStop(0.5, "#111827");
      bgGrad.addColorStop(1, "#1e1b4b");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Draw subtle background clouds / soft glowing stars
      ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
      for (let i = 0; i < 20; i++) {
        const sx = ((i * 137) % width);
        const sy = ((i * 229) % height);
        ctx.beginPath();
        ctx.arc(sx, sy, (i % 3) + 1, 0, Math.PI * 2);
        ctx.fill();
      }

      const time = performance.now() * 0.001;

      // 2. Update and Draw Balloons
      const balloons = balloonsRef.current;
      for (let i = 0; i < balloons.length; i++) {
        const b = balloons[i];
        if (b.popped) continue;

        // Floating Physics: ascend and sway horizontally
        b.y -= b.speedY;
        b.x = b.baseX + Math.sin(time * 2 + b.swayPhase) * b.swayAmp;

        // Loop back to bottom if floated past top
        if (b.y < -b.radiusY * 2) {
          b.y = height + b.radiusY + 20;
          b.baseX = Math.random() * (width - b.radiusX * 2) + b.radiusX;
        }

        // Draw string flowing down from bottom knot
        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(b.x, b.y + b.radiusY);
        const stringSway = Math.sin(time * 3 + b.swayPhase) * 6;
        ctx.quadraticCurveTo(
          b.x + stringSway,
          b.y + b.radiusY + b.stringLength * 0.5,
          b.x,
          b.y + b.radiusY + b.stringLength,
        );
        ctx.stroke();

        // Draw Balloon Body with 3D gradient shine
        const balloonGrad = ctx.createRadialGradient(
          b.x - b.radiusX * 0.3,
          b.y - b.radiusY * 0.3,
          b.radiusX * 0.1,
          b.x,
          b.y,
          b.radiusY,
        );
        balloonGrad.addColorStop(0, b.shineColor);
        balloonGrad.addColorStop(0.7, b.color);
        balloonGrad.addColorStop(1, "#18181b");

        ctx.fillStyle = balloonGrad;
        ctx.beginPath();
        ctx.ellipse(b.x, b.y, b.radiusX, b.radiusY, 0, 0, Math.PI * 2);
        ctx.fill();

        // Highlight sheen on top-left
        ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
        ctx.beginPath();
        ctx.ellipse(
          b.x - b.radiusX * 0.35,
          b.y - b.radiusY * 0.35,
          b.radiusX * 0.25,
          b.radiusY * 0.15,
          -Math.PI / 6,
          0,
          Math.PI * 2,
        );
        ctx.fill();

        // Bottom knot
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.moveTo(b.x - 5, b.y + b.radiusY - 2);
        ctx.lineTo(b.x + 5, b.y + b.radiusY - 2);
        ctx.lineTo(b.x, b.y + b.radiusY + 4);
        ctx.closePath();
        ctx.fill();

        // Word Label inside Balloon
        ctx.save();
        ctx.fillStyle = "#ffffff";
        ctx.font = `bold ${Math.max(13, Math.min(18, Math.floor(b.radiusX * 0.35)))}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "rgba(0,0,0,0.8)";
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        ctx.fillText(b.cleanWord, b.x, b.y);
        ctx.restore();
      }

      // 3. Update & Draw Confetti Particles
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08; // gravity
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 4. Update & Draw Floating Translation Tags
      const tags = translationTagsRef.current;
      for (let i = tags.length - 1; i >= 0; i--) {
        const tag = tags[i];
        tag.y -= 0.8;
        tag.life += 0.016;
        if (tag.life > 1.8) {
          tag.alpha -= 0.02;
        }

        if (tag.alpha <= 0) {
          tags.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, tag.alpha);

        const displayText = `${tag.word} → ${tag.translation}`;
        ctx.font = "bold 14px sans-serif";
        const textMetrics = ctx.measureText(displayText);
        const tagWidth = textMetrics.width + 20;
        const tagHeight = 28;

        // Tag background
        ctx.fillStyle = "rgba(17, 24, 39, 0.85)";
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(tag.x - tagWidth / 2, tag.y - tagHeight / 2, tagWidth, tagHeight, 6);
        ctx.fill();
        ctx.stroke();

        // Tag text
        ctx.fillStyle = "#38bdf8";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(displayText, tag.x, tag.y);
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    animFrameIdRef.current = animId;

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);

  // Canvas Click / Tap Hit Detection
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Check hit against active balloons (topmost first)
    const balloons = balloonsRef.current;
    for (let i = balloons.length - 1; i >= 0; i--) {
      const b = balloons[i];
      if (b.popped) continue;

      // Ellipse collision equation: ((x - h)^2 / rx^2) + ((y - k)^2 / ry^2) <= 1
      const dx = clickX - b.x;
      const dy = clickY - b.y;
      const hit = (dx * dx) / (b.radiusX * b.radiusX) + (dy * dy) / (b.radiusY * b.radiusY) <= 1.1;

      if (hit) {
        popBalloon(b);
        break; // Only pop one balloon per click
      }
    }
  };

  const totalBalloons = baseWords.length;
  const punchedCount = poppedIndices.size;
  const isAllPunched = totalBalloons > 0 && punchedCount === totalBalloons;

  return (
    <div
      ref={containerRef}
      data-testid="canvas-balloon-game-container"
      id="canvas-balloon-game"
      className={`relative flex flex-col justify-between overflow-hidden bg-slate-950 text-white select-none ${
        isFullScreen
          ? "fixed inset-0 z-50 h-screen w-screen"
          : `rounded-xl border-2 border-indigo-500/40 shadow-2xl h-[520px] sm:h-[580px] ${className}`
      }`}
    >
      {/* 1. Top HUD Control Bar */}
      <div className="absolute top-0 inset-x-0 z-20 flex flex-wrap items-center justify-between gap-2.5 p-3 sm:p-4 bg-gradient-to-b from-slate-950/90 via-slate-950/70 to-transparent backdrop-blur-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-bold text-white shadow-md">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Canvas Balloon Game</span>
          </div>

          <span
            data-testid="canvas-balloon-sentence-counter"
            className="text-xs font-semibold text-slate-300"
          >
            {activeRowIndex >= 0
              ? `Sentence ${activeRowIndex + 1} of ${totalRows}`
              : "No sentence"}
          </span>

          <span
            data-testid="canvas-balloon-score"
            className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-md"
          >
            <Trophy className="h-3 w-3" />
            <span>Score: {score}</span>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Target Language Selector */}
          {availableTargetLanguages.length > 1 && onSelectTargetLanguage && (
            <div className="flex items-center gap-1 bg-slate-900/80 border border-slate-700/80 px-2 py-1 rounded-md text-xs">
              <Languages className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <select
                data-testid="canvas-balloon-target-lang-select"
                aria-label="Select Target Language"
                value={targetLanguage}
                onChange={(e) => onSelectTargetLanguage(e.target.value)}
                className="bg-transparent font-medium text-xs text-white focus:outline-hidden cursor-pointer"
                title="Select target translation language"
              >
                {availableTargetLanguages.map((lang) => (
                  <option
                    key={lang.code}
                    value={lang.code}
                    className="bg-slate-900 text-white"
                  >
                    {lang.name} ({lang.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Sound Toggle */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="canvas-balloon-sound-toggle"
            onClick={() => setSoundEnabled((prev) => !prev)}
            className={`h-7 px-2 text-xs gap-1 border-slate-700 bg-slate-900/80 hover:bg-slate-800 ${
              soundEnabled ? "text-indigo-400" : "text-slate-400"
            }`}
            title={soundEnabled ? "Mute pop sound effects" : "Enable pop sound effects"}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sound ON</span>
              </>
            ) : (
              <>
                <VolumeX className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sound OFF</span>
              </>
            )}
          </Button>

          {/* Full Screen Toggle */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="canvas-balloon-fullscreen-toggle"
            onClick={toggleFullScreen}
            className="h-7 px-2.5 text-xs gap-1 border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-white"
            title={isFullScreen ? "Exit Full Screen" : "Play Full Screen"}
          >
            {isFullScreen ? (
              <>
                <Minimize2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Exit Fullscreen</span>
              </>
            ) : (
              <>
                <Maximize2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Fullscreen</span>
              </>
            )}
          </Button>

          {/* Close Game / Back to Video */}
          {onCloseGame && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-testid="canvas-balloon-close-btn"
              onClick={onCloseGame}
              className="h-7 px-2 text-xs gap-1 border-slate-700 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300"
              title="Close game and return to video player"
            >
              <X className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Close</span>
            </Button>
          )}
        </div>
      </div>

      {/* 2. Primary HTML5 Canvas for Floating Balloons */}
      <canvas
        ref={canvasRef}
        data-testid="canvas-balloon-game-canvas"
        onClick={handleCanvasClick}
        className="w-full h-full cursor-crosshair touch-none"
      />

      {/* 3. Bottom HUD: Sentence Word Progress & Navigation */}
      <div className="absolute bottom-0 inset-x-0 z-20 flex flex-col gap-2 p-3 sm:p-4 bg-gradient-to-t from-slate-950/95 via-slate-950/80 to-transparent backdrop-blur-xs">
        {/* Words Status Flow: Highlights popped vs unpopped words */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 px-2 py-1 max-w-4xl mx-auto">
          {baseWords.map((word, idx) => {
            const isPopped = poppedIndices.has(idx);
            const translation = translationWords[idx] || "";
            return (
              <span
                key={`hud-word-${idx}`}
                data-testid={`canvas-hud-word-${idx}`}
                data-popped={isPopped ? "true" : "false"}
                className={`text-xs px-2 py-1 rounded-md transition-all font-medium ${
                  isPopped
                    ? "bg-emerald-500/25 border border-emerald-400/50 text-emerald-300 shadow-sm"
                    : "bg-slate-900/60 border border-slate-700/60 text-slate-400"
                }`}
                title={isPopped && translation ? `${word} = ${translation}` : word}
              >
                {word}
                {isPopped && translation && (
                  <span className="ml-1 text-[10px] text-cyan-300 font-normal">
                    ({translation})
                  </span>
                )}
              </span>
            );
          })}
        </div>

        {/* Translation Banner when fully popped */}
        {isAllPunched && targetTranslation && (
          <div
            data-testid="canvas-balloon-victory-banner"
            className="text-center py-1 px-3 bg-emerald-950/60 border border-emerald-500/40 rounded-lg max-w-2xl mx-auto text-emerald-300 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2"
          >
            <Trophy className="h-4 w-4 text-amber-400 shrink-0" />
            <span dir={isTargetRtl ? "rtl" : "ltr"}>{targetTranslation}</span>
          </div>
        )}

        {/* Action Controls & Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-2 max-w-4xl mx-auto w-full pt-1">
          <div className="flex items-center gap-2">
            {onPrevSentence && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                data-testid="canvas-balloon-prev-btn"
                onClick={onPrevSentence}
                disabled={activeRowIndex <= 0}
                className="h-8 px-2.5 text-xs gap-1 border-slate-700 bg-slate-900/80 text-white hover:bg-slate-800 disabled:opacity-40"
              >
                <SkipBack className="h-3.5 w-3.5" />
                <span>Prev</span>
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              data-testid="canvas-balloon-reinflate-btn"
              onClick={initBalloons}
              className="h-8 px-2.5 text-xs gap-1 border-slate-700 bg-slate-900/80 text-white hover:bg-slate-800"
              title="Re-inflate all balloons"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Re-inflate</span>
            </Button>

            {onNextSentence && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                data-testid="canvas-balloon-next-btn"
                onClick={onNextSentence}
                disabled={activeRowIndex >= totalRows - 1}
                className="h-8 px-2.5 text-xs gap-1 border-slate-700 bg-slate-900/80 text-white hover:bg-slate-800 disabled:opacity-40"
              >
                <span>Next</span>
                <SkipForward className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-2">
            <span>
              Popped: <strong className="text-white">{punchedCount}/{totalBalloons}</strong>
            </span>
            <span className="hidden sm:inline">· Tap floating balloons to pop and hear translations!</span>
          </div>
        </div>
      </div>
    </div>
  );
};
