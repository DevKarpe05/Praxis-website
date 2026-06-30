"use client";

import { useEffect, useState } from "react";
import { CLIPS, EMAIL, STATS } from "@/lib/clips";
import { useReducedMotion } from "@/lib/hooks";
import { MosaicTile } from "@/components/ClipTile";

export default function MosaicHero() {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShown(true), 60);
    return () => clearTimeout(t);
  }, []);

  const reveal = (i: number) => {
    if (reduced) return { className: "" };
    return {
      className: shown ? "reveal reveal-on" : "reveal",
      style: { animationDelay: `${0.1 + i * 0.1}s` },
    };
  };

  const tiles = CLIPS.slice(0, 12);

  return (
    <section className="surface-ink relative h-[100svh] min-h-[620px] w-full overflow-hidden">
      {/* mosaic of capability clips */}
      <div
        className="absolute inset-0 grid grid-cols-2 grid-rows-6 gap-[2px] sm:grid-cols-3 sm:grid-rows-4 lg:grid-cols-4 lg:grid-rows-3"
        style={{ filter: "grayscale(1) contrast(1.05) brightness(0.82)" }}
        aria-hidden
      >
        {tiles.map((clip, i) => (
          <MosaicTile key={clip.id} clip={clip} index={i} />
        ))}
      </div>

      {/* legibility veil + scanlines */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(100deg, rgba(16,15,11,.95) 24%, rgba(16,15,11,.66) 58%, rgba(16,15,11,.34) 100%)",
        }}
      />
      <div className="scanlines pointer-events-none absolute inset-0 opacity-40" aria-hidden />

      {/* live count pill */}
      <div className="pointer-events-none absolute right-4 top-[76px] z-20 inline-flex items-center gap-1.5 rounded-full bg-[rgba(16,15,11,0.7)] px-2 py-[3px] font-mono text-[9px] tracking-[0.08em] text-[var(--bone-50)] sm:right-6">
        <span className="h-[5px] w-[5px] rounded-full bg-[var(--accent-500)] blink" aria-hidden />
        {STATS.liveCount}
      </div>

      {/* nav */}
      <nav className="relative z-20 flex h-16 items-center justify-between border-b border-[var(--rule-ink)] px-5 sm:px-10">
        <div className="flex items-center gap-8 lg:gap-10">
          <a
            href="#top"
            className="font-serif text-[28px] leading-none tracking-[-0.005em] text-[var(--bone-50)]"
          >
            Praxis<span className="text-[var(--accent-500)]">.</span>
          </a>
          <div className="hidden items-center gap-7 font-sans text-[14px] text-[var(--bone-50)] md:flex">
            <a href="#capability" className="opacity-90 transition-opacity hover:opacity-100">
              Capability
            </a>
            <a href="#approach" className="opacity-90 transition-opacity hover:opacity-100">
              Approach
            </a>
            <a href="#contact" className="opacity-90 transition-opacity hover:opacity-100">
              Contact
            </a>
          </div>
        </div>
        <a
          href={`mailto:${EMAIL}`}
          className="inline-flex h-[38px] items-center gap-2 rounded-[2px] bg-[var(--accent-500)] px-4 font-sans text-[14px] font-medium text-[var(--bone-50)] transition-colors hover:bg-[var(--accent-600)]"
        >
          Get in touch <span aria-hidden>→</span>
        </a>
      </nav>

      {/* content */}
      <div className="absolute inset-x-5 bottom-[88px] z-10 sm:inset-x-12 sm:bottom-[96px]">
        <p {...reveal(0)} className={`t-eyebrow !text-[var(--fg-on-ink-2)] ${reveal(0).className}`}>
          Praxis · {STATS.environments} · {STATS.continents}
        </p>
        <h1
          {...reveal(1)}
          className={`mt-5 max-w-[18ch] font-sans text-[clamp(2.4rem,7vw,4.4rem)] font-medium leading-[0.95] tracking-[-0.035em] text-[var(--bone-50)] ${reveal(1).className}`}
        >
          Every room the internet can&apos;t see.
        </h1>
        <p
          {...reveal(2)}
          className={`mt-5 max-w-[42ch] font-sans text-[16px] leading-[1.5] text-[var(--bone-50)]/90 sm:text-[18px] ${reveal(2).className}`}
        >
          A deployment company operating inside live industrial floors across
          five continents — robots doing the work, and the manipulation data
          those floors produce flowing to the labs that need it.
        </p>
        <div
          {...reveal(3)}
          className={`mt-7 flex flex-wrap gap-3 ${reveal(3).className}`}
        >
          <a
            href={`mailto:${EMAIL}`}
            className="inline-flex h-12 items-center gap-2 rounded-[2px] bg-[var(--accent-500)] px-6 font-sans text-[15px] font-medium text-[var(--bone-50)] transition-colors hover:bg-[var(--accent-600)]"
          >
            Get in touch <span aria-hidden>→</span>
          </a>
          <a
            href="#capability"
            className="inline-flex h-12 items-center gap-2 rounded-[2px] border border-[var(--rule-3)] bg-[rgba(246,242,234,0.08)] px-6 font-sans text-[15px] font-medium text-[var(--bone-50)] transition-colors hover:bg-[rgba(246,242,234,0.14)]"
          >
            See our capability
          </a>
        </div>
      </div>

      {/* telemetry bar */}
      <div className="absolute inset-x-0 bottom-0 z-10 flex h-[52px] items-center justify-between border-t border-[var(--rule-ink)] bg-[rgba(16,15,11,0.6)] px-5 sm:px-12">
        <span className="font-mono text-[10px] tracking-[0.05em] text-[var(--bone-50)] sm:text-[11px]">
          {STATS.markets}
        </span>
        <span className="hidden gap-8 font-mono text-[11px] text-[var(--bone-50)] sm:flex">
          <span>{STATS.continents}</span>
          <span>{STATS.workers}</span>
          <span>
            150<span className="text-[var(--accent-300)]">+</span> environments
          </span>
        </span>
      </div>
    </section>
  );
}
