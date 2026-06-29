"use client";

interface HudProps {
  revealed: boolean;
  reducedMotion: boolean;
}

export default function Hud({ revealed, reducedMotion }: HudProps) {
  const revealClass =
    reducedMotion || !revealed ? "" : "reveal reveal-on";
  const revealStyle =
    reducedMotion || !revealed ? undefined : { animationDelay: "0.6s" };

  return (
    <>
      {/* Bottom-corner live readout */}
      <div
        className={`pointer-events-none absolute bottom-5 left-6 z-20 sm:left-10 ${revealClass}`}
        style={revealStyle}
      >
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-[var(--ink-dim)]">
          <span className="inline-flex items-center gap-1.5 text-[var(--ink)]">
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full bg-[var(--amber)] ${
                reducedMotion ? "" : "live-dot"
              }`}
              aria-hidden
            />
            Live network
          </span>
          <span className="text-[var(--steel-lit)]">·</span>
          <span>4 markets</span>
          <span className="text-[var(--steel-lit)]">·</span>
          <span>4 continents</span>
          <span className="text-[var(--steel-lit)]">·</span>
          <span className="text-[var(--ink-dim)]">
            Modalities{" "}
            <span className="text-[var(--ink)]">RGB · IMU · WRIST · GLOVE</span>
          </span>
        </div>
      </div>

      {/* Vertical scroll cue */}
      <div
        className={`pointer-events-none absolute bottom-5 right-6 z-20 hidden flex-col items-center gap-2 sm:right-10 sm:flex ${revealClass}`}
        style={revealStyle}
      >
        <span className="font-mono text-[0.6rem] uppercase tracking-[0.3em] text-[var(--ink-dim)] [writing-mode:vertical-rl]">
          Scroll
        </span>
        <span
          className={`inline-block h-2 w-2 rounded-full bg-[var(--ink-dim)] ${
            reducedMotion ? "" : "scroll-cue-dot"
          }`}
          aria-hidden
        />
      </div>
    </>
  );
}
