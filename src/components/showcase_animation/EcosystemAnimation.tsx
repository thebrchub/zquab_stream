"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import {
  AnimatePresence,
  motion,
  useAnimationControls,
  useInView,
  useReducedMotion,
} from "framer-motion";
import { Gift, Lock, RefreshCw, User, Users, Zap } from "lucide-react";

/* -------------------------------------------------------------------------- */
/*  Design tokens                                                             */
/* -------------------------------------------------------------------------- */

const RAISED =
  "shadow-[4px_4px_16px_rgba(0,0,0,0.15),-2px_-2px_6px_rgba(255,255,255,0.02),inset_1px_1px_2px_rgba(255,255,255,0.03),inset_-1px_-1px_2px_rgba(0,0,0,0.08)]";
const INSET =
  "shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2),inset_-2px_-2px_4px_rgba(255,255,255,0.02)]";
const SURFACE = `bg-[var(--card)] border border-[var(--border-color)] ${RAISED}`;

const POP = { type: "spring", stiffness: 420, damping: 24, mass: 0.7 } as const;
const GLIDE = { type: "spring", stiffness: 190, damping: 22, mass: 0.9 } as const;

/* -------------------------------------------------------------------------- */
/*  Timeline engine                                                           */
/*  Each scene is a tiny state machine: `stage` advances at fixed offsets     */
/*  (ms) inside a loop. Components are pure functions of `stage`, so Framer   */
/*  Motion + AnimatePresence handle every transition declaratively.           */
/* -------------------------------------------------------------------------- */

type SceneConfig = {
  /** start time (ms) of each stage, first must be 0 */
  marks: readonly number[];
  /** total loop length (ms) */
  loop: number;
  /** the frame shown when the user prefers reduced motion */
  still: number;
};

type SceneProps = { active: boolean; reduce: boolean };

const LIVE: SceneConfig = { marks: [0, 500, 1300, 2100, 2900, 3700], loop: 4800, still: 5 };
const DUO: SceneConfig = { marks: [0, 1100, 1800, 2400, 3500, 4100], loop: 4600, still: 2 };
const CHAT: SceneConfig = { marks: [0, 500, 1500, 2300, 3000, 3900], loop: 4600, still: 4 };

function useScene(cfg: SceneConfig, active: boolean, reduce: boolean) {
  const [stage, setStage] = useState(reduce ? cfg.still : 0);

  useEffect(() => {
    if (reduce) {
      setStage(cfg.still);
      return;
    }
    if (!active) return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    const run = () => {
      timers.length = 0;
      setStage(0);
      for (let i = 1; i < cfg.marks.length; i++) {
        timers.push(setTimeout(() => setStage(i), cfg.marks[i]));
      }
      timers.push(setTimeout(run, cfg.loop));
    };
    run();
    return () => timers.forEach(clearTimeout);
  }, [cfg, active, reduce]);

  return stage;
}

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/** Measures an element so motion paths can be driven in pixels (GPU transforms). */
function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return [ref as RefObject<T>, size] as const;
}

/* -------------------------------------------------------------------------- */
/*  Root                                                                      */
/* -------------------------------------------------------------------------- */

export default function EcosystemAnimation({ id }: { id: number }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { amount: 0.1 });
  const reduce = !!useReducedMotion();

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="w-full h-full relative overflow-hidden bg-transparent"
    >
      {id === 1 && <LiveStreams active={inView} reduce={reduce} />}
      {id === 2 && <Interaction active={inView} reduce={reduce} />}
      {id === 3 && <StrangerChat active={inView} reduce={reduce} />}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  1 — Live streams                                                          */
/* -------------------------------------------------------------------------- */

const TONE = {
  blue: "from-[#3B82F6] to-indigo-400",
  purple: "from-purple-500 to-fuchsia-400",
  green: "from-emerald-400 to-sky-400",
} as const;

type ChatItem = {
  id: string;
  at: number;
  tone?: keyof typeof TONE;
  lines?: string[];
  gift?: boolean;
};

const LIVE_FEED: ChatItem[] = [
  { id: "a", at: 1, tone: "blue", lines: ["78%", "46%"] },
  { id: "b", at: 2, tone: "purple", lines: ["92%"] },
  { id: "g", at: 3, gift: true },
  { id: "c", at: 4, tone: "green", lines: ["66%", "38%"] },
];

function LiveStreams({ active, reduce }: SceneProps) {
  const stage = useScene(LIVE, active, reduce);
  const [panelRef, { w, h }] = useSize<HTMLDivElement>();

  const giftOn = stage === 3 || stage === 4;
  const viewers = stage >= 3 ? "1.3k" : "1.2k";
  const feed = LIVE_FEED.filter((m) => m.at <= stage).slice(-3);

  return (
    <div className="absolute inset-0 flex gap-3 p-3 sm:gap-4 sm:p-4">
      {/* Video player */}
      <div
        ref={panelRef}
        className={`relative min-w-0 flex-1 overflow-hidden rounded-[1.25rem] ${SURFACE}`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(90%_100%_at_25%_0%,rgba(99,102,241,0.22),transparent_60%),radial-gradient(70%_80%_at_100%_100%,rgba(168,85,247,0.14),transparent_65%)]" />

        {/* Live pill */}
        <div className="absolute left-2.5 top-2.5 z-10 flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/15 px-2 py-1 backdrop-blur-md">
          <span className="relative flex h-1.5 w-1.5">
            <motion.span
              className="absolute inset-0 rounded-full bg-red-500"
              animate={reduce ? undefined : { scale: [1, 2.6], opacity: [0.6, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
            />
            <span className="relative h-1.5 w-1.5 rounded-full bg-red-500" />
          </span>
          <span className="text-[8px] font-bold leading-none tracking-wide text-red-500 sm:text-[9px]">
            LIVE
          </span>
        </div>

        {/* Viewer count */}
        <div className="absolute right-2.5 top-2.5 z-10 flex items-center gap-1 rounded-full border border-[var(--border-color)] bg-[var(--background)] px-2 py-1">
          <Users className="h-3 w-3 text-[var(--text-muted)]" />
          <span className="relative inline-flex h-3 items-center overflow-hidden">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={viewers}
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -8, opacity: 0 }}
                transition={POP}
                className="block text-[10px] font-semibold leading-3 tabular-nums text-[var(--text-main)]"
              >
                {viewers}
              </motion.span>
            </AnimatePresence>
          </span>
        </div>

        {/* Creator */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative flex aspect-square h-[40%] items-center justify-center">
            {[0, 1].map((i) => (
              <motion.span
                key={i}
                className="absolute inset-0 rounded-full border border-[#3B82F6]/40"
                initial={{ scale: 1, opacity: 0 }}
                animate={reduce ? undefined : { scale: [1, 1.5], opacity: [0.4, 0] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut", delay: i * 1.2 }}
              />
            ))}
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={POP}
              className="h-full w-full rounded-full bg-gradient-to-tr from-[#3B82F6] to-purple-500 p-[2px]"
            >
              <div className="flex h-full w-full items-center justify-center rounded-full bg-[var(--card)]">
                <User className="h-[45%] w-[45%] text-[var(--text-muted)]" />
              </div>
            </motion.div>

            {/* Speaking bars */}
            <div className="absolute -bottom-3.5 left-1/2 flex -translate-x-1/2 items-end gap-[3px]">
              {[0, 1, 2, 3].map((i) => (
                <motion.span
                  key={i}
                  className="h-2.5 w-[3px] origin-bottom rounded-full bg-[var(--text-muted)] opacity-60"
                  animate={reduce ? { scaleY: 0.6 } : { scaleY: [0.35, 1, 0.5, 0.9, 0.35] }}
                  transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut", delay: i * 0.12 }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Stream title */}
        <div className="absolute bottom-2.5 left-2.5 flex flex-col gap-1">
          <span className="h-1.5 w-16 rounded-full bg-[var(--text-muted)] opacity-40" />
          <span className="h-1 w-10 rounded-full bg-[var(--border-color)]" />
        </div>

        {w > 0 && (
          <AnimatePresence>{giftOn && <GiftFlight key="gift" w={w} h={h} />}</AnimatePresence>
        )}
      </div>

      {/* Live chat */}
      <div
        className={`flex w-[36%] min-w-0 flex-col gap-2 overflow-hidden rounded-[1.25rem] p-2 sm:p-2.5 ${SURFACE}`}
      >
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#4ade80]" />
          <span className="h-1.5 w-10 rounded-full bg-[var(--border-color)]" />
        </div>

        <div className="flex min-h-0 flex-1 flex-col justify-end gap-1.5 overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false}>
            {feed.map((m) => (
              <motion.div
                key={m.id}
                layout
                initial={{ opacity: 0, y: 14, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.96, transition: { duration: 0.2 } }}
                transition={POP}
              >
                {m.gift ? <GiftEvent /> : <ChatRow tone={m.tone!} lines={m.lines!} />}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div
          className={`flex h-5 shrink-0 items-center rounded-full bg-[var(--background)] pl-2 pr-0.5 sm:h-6 ${INSET}`}
        >
          <span className="h-1 w-10 rounded-full bg-[var(--border-color)]" />
          <span className="ml-auto flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-b from-[#3B82F6] to-[#2563EB] sm:h-5 sm:w-5">
            <Gift className="h-2.5 w-2.5 text-white" />
          </span>
        </div>
      </div>
    </div>
  );
}

function ChatRow({ tone, lines }: { tone: keyof typeof TONE; lines: string[] }) {
  return (
    <div className="flex items-start gap-1.5">
      <span className={`mt-0.5 h-4 w-4 shrink-0 rounded-full bg-gradient-to-tr sm:h-5 sm:w-5 ${TONE[tone]}`} />
      <div className="flex min-w-0 flex-1 flex-col gap-1 rounded-xl rounded-tl-sm border border-[var(--border-color)] bg-[var(--background)] px-1.5 py-1.5">
        {lines.map((width, i) => (
          <span
            key={i}
            className="h-1 rounded-full bg-[var(--text-muted)] opacity-40"
            style={{ width }}
          />
        ))}
      </div>
    </div>
  );
}

function GiftEvent() {
  return (
    <div className="flex items-center gap-1.5 rounded-xl border border-amber-400/25 bg-amber-500/10 px-1.5 py-1">
      <Gift className="h-3 w-3 shrink-0 text-amber-400" />
      <span className="h-1 w-[45%] rounded-full bg-amber-400 opacity-50" />
    </div>
  );
}

function GiftFlight({ w, h }: { w: number; h: number }) {
  const xs = [w * 0.3, w * 0.52, w * 0.74];
  const ys = [h * 0.84, h * 0.48, h * 0.22];
  const T = 1.6;

  const path = (delay: number, peak: number) => ({
    initial: { x: xs[0], y: ys[0], opacity: 0 },
    animate: { x: xs, y: ys, opacity: [0, peak, peak, 0] },
    transition: {
      x: { duration: T, ease: "easeInOut" as const, times: [0, 0.5, 1], delay },
      y: { duration: T, ease: "easeOut" as const, times: [0, 0.5, 1], delay },
      opacity: { duration: T, times: [0, 0.12, 0.8, 1], delay },
    },
  });

  return (
    <motion.div
      className="pointer-events-none absolute inset-0 z-20"
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
    >
      {[
        { size: 6, delay: 0.1, peak: 0.55 },
        { size: 5, delay: 0.2, peak: 0.4 },
        { size: 4, delay: 0.3, peak: 0.25 },
      ].map(({ size, delay, peak }) => (
        <motion.span
          key={size}
          className="absolute left-0 top-0 rounded-full bg-amber-400"
          style={{ width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2 }}
          {...path(delay, peak)}
        />
      ))}

      <motion.div className="absolute left-0 top-0" {...path(0, 1)}>
        <div className="-translate-x-1/2 -translate-y-1/2">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={POP}
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-amber-400/50 bg-amber-500/20 shadow-[0_0_24px_rgba(245,158,11,0.35)] backdrop-blur-md sm:h-11 sm:w-11"
          >
            <motion.span
              className="absolute inset-0 rounded-full bg-amber-400/30 blur-md"
              animate={{ scale: [1, 1.6, 1.2], opacity: [0.6, 0.2, 0.4] }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
            <Gift className="relative h-5 w-5 text-amber-400" />
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  2 — 1:1 interaction                                                       */
/* -------------------------------------------------------------------------- */

type Geo = {
  lx: number;
  rx: number;
  top: number;
  bw: number;
  bh: number;
  lock: number;
  cx: number;
  cy: number;
};

function Interaction({ active, reduce }: SceneProps) {
  const stage = useScene(DUO, active, reduce);
  const [boxRef, { w, h }] = useSize<HTMLDivElement>();

  const connected = stage >= 1 && stage <= 4;
  const ready = w > 0 && h > 0;

  const lock = Math.max(32, Math.min(44, h * 0.17));
  const gap = Math.max(16, w * 0.05);
  const bh = h * 0.82;
  const bw = Math.min(bh * 0.78, (w * 0.9 - lock - gap * 2) / 2);
  const g: Geo = {
    lx: w / 2 - lock / 2 - gap - bw,
    rx: w / 2 + lock / 2 + gap,
    top: (h - bh) / 2,
    bw,
    bh,
    lock,
    cx: w / 2,
    cy: h / 2,
  };

  return (
    <div ref={boxRef} className="absolute inset-0">
      {ready && (
        <AnimatePresence>
          {!connected && <Searching key="search" g={g} reduce={reduce} />}
          {connected && <FeedBlock key="you" g={g} side="l" label="You" />}
          {connected && <FeedBlock key="creator" g={g} side="r" label="Creator" flash={stage === 4} />}
          {connected && <LockBridge key="lock" g={g} gap={gap} secure={stage >= 2} />}
          {stage === 3 && <TipFlight key="tip" g={g} />}
        </AnimatePresence>
      )}
    </div>
  );
}

function Searching({ g, reduce }: { g: Geo; reduce: boolean }) {
  return (
    <motion.div className="absolute inset-0" exit={{ opacity: 0, transition: { duration: 0.18 } }}>
      {(["l", "r"] as const).map((side, i) => (
        <motion.div
          key={side}
          className={`absolute rounded-[1.25rem] border border-dashed border-[var(--border-color)] bg-[var(--background)] ${INSET}`}
          style={{
            left: side === "l" ? g.lx : g.rx,
            top: g.top,
            width: g.bw,
            height: g.bh,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: reduce ? 0.5 : [0.3, 0.75, 0.3] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut", delay: i * 0.35 }}
        />
      ))}

      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={POP}
          className={`flex items-center justify-center rounded-full ${SURFACE}`}
          style={{ width: g.lock, height: g.lock }}
        >
          <motion.span
            className="flex"
            animate={reduce ? undefined : { rotate: 360 }}
            transition={{ duration: 1.1, ease: "linear", repeat: Infinity }}
          >
            <RefreshCw className="h-4 w-4 text-[#3B82F6]" />
          </motion.span>
        </motion.div>
      </div>
    </motion.div>
  );
}

function FeedBlock({
  g,
  side,
  label,
  flash = false,
}: {
  g: Geo;
  side: "l" | "r";
  label: string;
  flash?: boolean;
}) {
  const isL = side === "l";
  const dir = isL ? -1 : 1;

  return (
    <motion.div
      className={`absolute overflow-hidden rounded-[1.25rem] ${SURFACE}`}
      style={{ left: isL ? g.lx : g.rx, top: g.top, width: g.bw, height: g.bh }}
      initial={{ x: dir * g.bw * 0.9, opacity: 0, scale: 0.94 }}
      animate={{ x: 0, opacity: 1, scale: 1 }}
      exit={{
        x: dir * g.bw * 0.5,
        opacity: 0,
        scale: 0.95,
        transition: { duration: 0.3, ease: "easeIn" },
      }}
      transition={{ ...GLIDE, delay: 0.1 }}
    >
      <div
        className={
          isL
            ? "absolute inset-0 bg-[radial-gradient(110%_90%_at_50%_0%,rgba(99,102,241,0.24),transparent_65%)]"
            : "absolute inset-0 bg-[radial-gradient(110%_90%_at_50%_0%,rgba(168,85,247,0.22),transparent_65%)]"
        }
      />

      <div className="absolute inset-0 flex items-center justify-center pb-4">
        <div
          className={`flex aspect-square h-[40%] items-center justify-center rounded-full border border-[var(--border-color)] bg-[var(--background)] ${INSET}`}
        >
          <User className="h-[45%] w-[45%] text-[var(--text-muted)]" />
        </div>
      </div>

      <div className="absolute inset-x-2 bottom-2 flex items-center justify-between">
        <span className="rounded-full border border-[var(--border-color)] bg-[var(--background)] px-1.5 py-0.5 text-[8px] font-semibold leading-none text-[var(--text-main)] sm:text-[9px]">
          {label}
        </span>
        <span className="h-1.5 w-1.5 rounded-full bg-[#4ade80]" />
      </div>

      {flash && (
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-[1.25rem] border border-amber-400/60"
          initial={{ boxShadow: "inset 0 0 0px 0px rgba(245,158,11,0)" }}
          animate={{
            boxShadow: [
              "inset 0 0 0px 0px rgba(245,158,11,0)",
              "inset 0 0 28px 2px rgba(245,158,11,0.4)",
              "inset 0 0 0px 0px rgba(245,158,11,0)",
            ],
          }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      )}
    </motion.div>
  );
}

function LockBridge({ g, gap, secure }: { g: Geo; gap: number; secure: boolean }) {
  return (
    <motion.div className="absolute inset-0" exit={{ opacity: 0, transition: { duration: 0.2 } }}>
      {secure && (
        <>
          <motion.span
            className="absolute h-[2px] rounded-full bg-gradient-to-l from-[#4ade80]/60 to-[#4ade80]/10"
            style={{ left: g.lx + g.bw, top: g.cy - 1, width: gap, transformOrigin: "right" }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
          <motion.span
            className="absolute h-[2px] rounded-full bg-gradient-to-r from-[#4ade80]/60 to-[#4ade80]/10"
            style={{ left: g.cx + g.lock / 2, top: g.cy - 1, width: gap, transformOrigin: "left" }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </>
      )}

      <motion.div
        className={`absolute flex items-center justify-center rounded-full ${SURFACE}`}
        style={{ left: g.cx - g.lock / 2, top: g.cy - g.lock / 2, width: g.lock, height: g.lock }}
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ ...POP, delay: 0.3 }}
      >
        {secure && (
          <motion.span
            className="absolute inset-0 rounded-full border border-[#4ade80]/50"
            initial={{ scale: 1, opacity: 0.6 }}
            animate={{ scale: 1.9, opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        )}
        <Lock
          className={`h-4 w-4 transition-colors duration-300 ${
            secure ? "text-[#4ade80]" : "text-[var(--text-muted)]"
          }`}
        />
      </motion.div>
    </motion.div>
  );
}

function TipFlight({ g }: { g: Geo }) {
  const xs = [g.lx + g.bw * 0.5, g.cx, g.rx + g.bw * 0.5];
  const ys = [g.top + g.bh * 0.68, g.top + g.bh * 0.12, g.top + g.bh * 0.46];
  const T = 1.0;

  const path = (delay: number, peak: number, end: number) => ({
    initial: { x: xs[0], y: ys[0], opacity: 0, scale: 0.6 },
    animate: { x: xs, y: ys, opacity: [0, peak, peak, 0], scale: [0.6, 1, 1, end] },
    transition: {
      x: { duration: T, ease: "easeInOut" as const, times: [0, 0.5, 1], delay },
      y: { duration: T, ease: "easeInOut" as const, times: [0, 0.5, 1], delay },
      opacity: { duration: T, times: [0, 0.2, 0.85, 1], delay },
      scale: { duration: T, times: [0, 0.25, 0.85, 1], delay },
    },
  });

  return (
    <motion.div
      className="pointer-events-none absolute inset-0 z-30"
      exit={{ opacity: 0, transition: { duration: 0.12 } }}
    >
      {[
        { size: 5, delay: 0.08, peak: 0.5 },
        { size: 4, delay: 0.16, peak: 0.3 },
      ].map(({ size, delay, peak }) => (
        <motion.span
          key={size}
          className="absolute left-0 top-0 rounded-full bg-amber-400"
          style={{ width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2 }}
          {...path(delay, peak, 0.4)}
        />
      ))}

      <motion.div className="absolute left-0 top-0" {...path(0, 1, 0.7)}>
        <div className="-translate-x-1/2 -translate-y-1/2">
          <div className="flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-500/20 px-2 py-0.5 shadow-[0_0_18px_rgba(245,158,11,0.3)] backdrop-blur-md">
            <Zap className="h-3 w-3 text-amber-400" />
            <span className="text-[11px] font-bold leading-none tabular-nums text-amber-400 sm:text-xs">
              +150
            </span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  3 — Stranger chat                                                         */
/* -------------------------------------------------------------------------- */

const PEER_TONES = [
  "from-indigo-500/30 to-purple-500/30",
  "from-emerald-500/30 to-sky-500/30",
  "from-amber-500/30 to-rose-500/30",
];

function StrangerChat({ active, reduce }: SceneProps) {
  const stage = useScene(CHAT, active, reduce);
  const next = useAnimationControls();
  const [peer, setPeer] = useState(0);

  useEffect(() => {
    if (stage === 5) {
      setPeer((p) => p + 1);
      next.start({
        rotate: 360,
        scale: [1, 0.86, 1],
        transition: {
          rotate: { duration: 0.7, ease: "easeInOut" },
          scale: { duration: 0.35 },
        },
      });
    } else if (stage === 0) {
      next.set({ rotate: 0, scale: 1 });
    }
  }, [stage, next]);

  const showTyping = stage === 1;
  const showIncoming = stage >= 2 && stage < 5;
  const showOutgoing = stage >= 4 && stage < 5;

  const exit = {
    opacity: 0,
    y: -14,
    scale: 0.94,
    transition: { duration: 0.28, ease: "easeIn" },
  } as const;

  return (
    <div className="absolute inset-0 flex justify-center p-3 sm:p-4">
      <div className="flex h-full w-full max-w-[28rem] flex-col gap-2 sm:gap-3">
        {/* Header */}
        <div className="flex items-center gap-2">
          <motion.div
            key={peer}
            initial={{ scale: 0.5, opacity: 0, rotate: -15 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={POP}
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--border-color)] bg-gradient-to-br sm:h-7 sm:w-7 ${PEER_TONES[peer % PEER_TONES.length]} ${RAISED}`}
          >
            <User className="h-3 w-3 text-[var(--text-muted)] sm:h-3.5 sm:w-3.5" />
          </motion.div>
          <div className="flex flex-col gap-1">
            <span className="h-1.5 w-14 rounded-full bg-[var(--border-color)]" />
            <span className="h-1 w-8 rounded-full bg-[var(--border-color)] opacity-60" />
          </div>
          <div className="ml-auto flex items-center gap-1 rounded-full border border-[var(--border-color)] bg-[var(--background)] px-1.5 py-0.5">
            <Lock className="h-2.5 w-2.5 text-[#4ade80]" />
            <span className="text-[8px] font-medium leading-none text-[var(--text-muted)] sm:text-[9px]">
              Anonymous
            </span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex min-h-0 flex-1 flex-col justify-end gap-1.5 overflow-hidden sm:gap-2">
          <AnimatePresence mode="popLayout">
            {showTyping && (
              <motion.div
                key="typing"
                layout
                initial={{ opacity: 0, y: 10, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.15 } }}
                transition={POP}
                style={{ transformOrigin: "bottom left" }}
                className={`flex items-center gap-1 self-start rounded-2xl rounded-bl-md border border-[var(--border-color)] bg-[var(--card)] px-2.5 py-2.5 ${RAISED}`}
              >
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="h-1 w-1 rounded-full bg-[var(--text-muted)]"
                    animate={{ y: [0, -3, 0], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut", delay: i * 0.15 }}
                  />
                ))}
              </motion.div>
            )}

            {showIncoming && (
              <motion.div
                key="incoming"
                layout
                initial={{ opacity: 0, y: 10, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ ...exit, transition: { duration: 0.28, ease: "easeIn", delay: 0.05 } }}
                transition={POP}
                style={{ transformOrigin: "bottom left" }}
                className={`flex w-[62%] flex-col gap-1.5 self-start rounded-2xl rounded-bl-md border border-[var(--border-color)] bg-[var(--card)] px-2.5 py-2 ${RAISED}`}
              >
                <span className="h-1.5 w-[88%] rounded-full bg-[var(--text-muted)] opacity-40" />
                <span className="h-1.5 w-[56%] rounded-full bg-[var(--text-muted)] opacity-40" />
              </motion.div>
            )}

            {showOutgoing && (
              <motion.div
                key="outgoing"
                layout
                initial={{ opacity: 0, x: 18, y: 8, scale: 0.85 }}
                animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                exit={exit}
                transition={POP}
                style={{ transformOrigin: "bottom right" }}
                className="flex w-[54%] flex-col items-end gap-1.5 self-end rounded-2xl rounded-br-md bg-gradient-to-b from-[#3B82F6] to-[#2563EB] px-2.5 py-2 shadow-[0_6px_16px_rgba(37,99,235,0.3),inset_0_1px_1px_rgba(255,255,255,0.3)]"
              >
                <span className="h-1.5 w-[92%] rounded-full bg-white opacity-70" />
                <span className="h-1.5 w-[48%] rounded-full bg-white opacity-70" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Composer */}
        <div className="flex shrink-0 items-center gap-2">
          <div
            className={`flex h-7 flex-1 items-center rounded-full bg-[var(--background)] px-3 sm:h-8 ${INSET}`}
          >
            <motion.span
              className="h-1.5 rounded-full bg-[var(--text-muted)] opacity-50"
              initial={false}
              animate={{ width: stage === 3 ? "58%" : "0%" }}
              transition={stage === 3 ? { duration: 0.65, ease: "easeOut" } : { duration: 0.12 }}
            />
          </div>

          <div className="relative shrink-0">
            {stage === 5 && (
              <motion.span
                className="absolute inset-0 rounded-full border border-[#3B82F6]/60"
                initial={{ scale: 1, opacity: 0.7 }}
                animate={{ scale: 2, opacity: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
              />
            )}
            <motion.div
              animate={next}
              className={`flex h-7 w-7 items-center justify-center rounded-full sm:h-8 sm:w-8 ${SURFACE}`}
            >
              <RefreshCw
                className={`h-3.5 w-3.5 transition-colors duration-200 ${
                  stage === 5 ? "text-[var(--text-main)]" : "text-[var(--text-muted)]"
                }`}
              />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}