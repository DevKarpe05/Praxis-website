"use client";

interface HeroProps {
  revealed: boolean;
  reducedMotion: boolean;
  onRequestCollection: () => void;
  onSeeCapture: () => void;
}

export default function Hero({
  revealed,
  reducedMotion,
  onRequestCollection,
  onSeeCapture,
}: HeroProps) {
  // Staggered reveal: each element animates in after the door opens.
  const reveal = (i: number) => {
    if (reducedMotion) return { className: "" };
    return {
      className: revealed ? "reveal reveal-on" : "reveal",
      style: { animationDelay: `${0.12 + i * 0.12}s` },
    };
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center">
      <div className="mx-auto w-full max-w-[1400px] px-6 sm:px-10">
        <div className="max-w-[40rem]">
          <p {...reveal(0)} className={`label-mono ${reveal(0).className}`}>
            Praxis — Industrial access for physical AI
          </p>

          <h1
            {...reveal(1)}
            className={`font-display mt-5 text-balance text-[2.4rem] font-extrabold leading-[1.04] tracking-[-0.02em] text-[var(--ink-bright)] sm:text-6xl ${
              reveal(1).className
            }`}
          >
            The physical world is the bottleneck.{" "}
            <span className="text-[var(--amber-hot)]">
              We&apos;re already inside it.
            </span>
          </h1>

          <p
            {...reveal(2)}
            className={`mt-6 max-w-[34rem] text-base leading-relaxed text-[var(--ink)] sm:text-lg ${
              reveal(2).className
            }`}
          >
            Egocentric, multimodal capture from inside live industrial operations
            across four continents.{" "}
            <span className="text-[var(--ink-bright)]">
              Click a node to step onto the floor.
            </span>
          </p>

          <div
            {...reveal(3)}
            className={`pointer-events-auto mt-9 flex flex-wrap items-center gap-3 ${
              reveal(3).className
            }`}
          >
            <button
              type="button"
              onClick={onRequestCollection}
              className="group inline-flex items-center gap-2 rounded-sm bg-[var(--amber)] px-5 py-3 text-sm font-semibold text-[var(--void)] transition-colors hover:bg-[var(--amber-hot)]"
            >
              Request a collection
              <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </button>
            <button
              type="button"
              onClick={onSeeCapture}
              className="inline-flex items-center gap-2 rounded-sm border border-[var(--line)] bg-[rgba(8,12,22,0.4)] px-5 py-3 text-sm font-medium text-[var(--ink-bright)] backdrop-blur-sm transition-colors hover:border-[var(--steel-lit)] hover:bg-[rgba(26,36,54,0.55)]"
            >
              See what we capture
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
