"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface DoorEntryProps {
  /** Fired the moment the leaves begin parting (cue hero reveal). */
  onOpened: () => void;
  reducedMotion: boolean;
}

type Phase = "closed" | "flash" | "opening" | "gone";

const leafStyle =
  "absolute top-0 h-full w-1/2 overflow-hidden bg-[linear-gradient(180deg,#0c1322_0%,#0a0f1c_50%,#070b14_100%)]";

export default function DoorEntry({ onOpened, reducedMotion }: DoorEntryProps) {
  const [phase, setPhase] = useState<Phase>("closed");
  const opened = useRef(false);
  // All scheduled timeouts, cleared only on unmount so a benign re-render
  // can never cancel the in-flight open sequence.
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const onOpenedRef = useRef(onOpened);
  onOpenedRef.current = onOpened;

  const open = useCallback(() => {
    if (opened.current) return;
    opened.current = true;
    setPhase("flash");
    onOpenedRef.current();
    timers.current.push(setTimeout(() => setPhase("opening"), 420));
    timers.current.push(setTimeout(() => setPhase("gone"), 420 + 1000));
  }, []);

  useEffect(() => {
    // Auto-open after ~2.5s; honor reduced motion by opening immediately.
    if (reducedMotion) {
      open();
      return;
    }
    const t = setTimeout(open, 2500);
    timers.current.push(t);
  }, [open, reducedMotion]);

  // Clear every scheduled timeout on unmount only.
  useEffect(() => {
    const all = timers.current;
    return () => all.forEach(clearTimeout);
  }, []);

  if (phase === "gone") return null;

  const opening = phase === "opening";

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-label="Enter Praxis"
      style={{ pointerEvents: opening ? "none" : "auto" }}
    >
      {/* Left leaf */}
      <div
        className={leafStyle}
        style={{
          left: 0,
          transform: opening ? "translateX(-100%)" : "translateX(0)",
          transition: reducedMotion
            ? "none"
            : "transform 1s cubic-bezier(0.7,0,0.2,1)",
          boxShadow: "inset -1px 0 0 rgba(120,140,175,0.12)",
        }}
      >
        <div className="absolute left-0 top-0 flex h-full w-[200%] items-center justify-center">
          <span className="font-display select-none text-[14vw] font-extrabold tracking-[0.08em] text-[var(--steel-lit)] sm:text-[10vw]">
            PRAXIS
          </span>
        </div>
        <DoorTexture side="left" />
      </div>

      {/* Right leaf */}
      <div
        className={leafStyle}
        style={{
          right: 0,
          transform: opening ? "translateX(100%)" : "translateX(0)",
          transition: reducedMotion
            ? "none"
            : "transform 1s cubic-bezier(0.7,0,0.2,1)",
          boxShadow: "inset 1px 0 0 rgba(120,140,175,0.12)",
        }}
      >
        <div className="absolute right-0 top-0 flex h-full w-[200%] items-center justify-center">
          <span className="font-display select-none text-[14vw] font-extrabold tracking-[0.08em] text-[var(--steel-lit)] sm:text-[10vw]">
            PRAXIS
          </span>
        </div>
        <DoorTexture side="right" />
      </div>

      {/* Seam light */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-full w-px -translate-x-1/2"
        style={{
          background:
            phase === "flash" || opening
              ? "linear-gradient(180deg, transparent, var(--amber-hot), var(--amber), var(--amber-hot), transparent)"
              : "rgba(120,140,175,0.18)",
          boxShadow:
            phase === "flash"
              ? "0 0 24px 6px rgba(255,138,43,0.75)"
              : opening
              ? "0 0 14px 3px rgba(255,138,43,0.45)"
              : "none",
          opacity: 1,
          transition: "box-shadow 0.4s ease, background 0.4s ease",
        }}
      />

      {/* Click-to-enter affordance (skippable) */}
      {phase === "closed" && (
        <button
          type="button"
          onClick={open}
          className="absolute inset-0 flex items-end justify-center pb-16 outline-none"
          aria-label="Enter site"
        >
          <span className="font-mono text-[0.65rem] uppercase tracking-[0.4em] text-[var(--ink-dim)]">
            Click to enter
          </span>
        </button>
      )}
    </div>
  );
}

function DoorTexture({ side }: { side: "left" | "right" }) {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {/* faint vertical mill lines */}
      <div
        className="absolute inset-0 opacity-[0.5]"
        style={{
          background:
            "repeating-linear-gradient(90deg, rgba(120,140,175,0.05) 0px, rgba(120,140,175,0.05) 1px, transparent 1px, transparent 26px)",
        }}
      />
      {/* corner bolts */}
      {[
        ["top-6", "left-6"],
        ["top-6", "right-6"],
        ["bottom-6", "left-6"],
        ["bottom-6", "right-6"],
      ].map(([v, h], i) => (
        <span
          key={i}
          className={`absolute ${v} ${h} h-2.5 w-2.5 rounded-full`}
          style={{
            background:
              "radial-gradient(circle at 35% 35%, #2c3b56, #0a0f1c 70%)",
            boxShadow: "0 0 0 1px rgba(120,140,175,0.15)",
            visibility:
              (side === "left" && h.includes("right")) ||
              (side === "right" && h.includes("left"))
                ? "hidden"
                : "visible",
          }}
        />
      ))}
    </div>
  );
}
