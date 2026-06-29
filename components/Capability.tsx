"use client";

import { CLIPS } from "@/lib/clips";
import { useInView } from "@/lib/hooks";
import { ClipCard } from "@/components/ClipTile";

export default function Capability() {
  const head = useInView<HTMLDivElement>();

  return (
    <section
      id="capability"
      className="relative scroll-mt-4 border-t border-[var(--rule-2)] bg-[var(--bg)] px-5 py-20 sm:px-12 sm:py-28"
    >
      <div className="mx-auto max-w-[1240px]">
        <div
          ref={head.ref}
          className={`in-view-reveal ${head.inView ? "is-visible" : ""} max-w-[680px]`}
        >
          <p className="t-eyebrow flex items-center gap-3">
            <span aria-hidden className="h-px w-8 bg-[var(--accent-500)]" />
            What we capture
          </p>
          <h2 className="mt-5 font-sans text-[clamp(1.8rem,4vw,2.6rem)] font-medium leading-[1.08] tracking-[-0.025em] text-[var(--fg1)]">
            Inside the floors —{" "}
            <span className="font-serif italic text-[var(--accent-600)]">
              the work the internet never sees.
            </span>
          </h2>
          <p className="mt-5 text-[16px] leading-[1.55] text-[var(--fg2)]">
            Egocentric footage from real operators doing real, dexterous work
            across our live environments. Clips are rolling out soon — here&apos;s
            the floor coverage going live first.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {CLIPS.map((clip, i) => (
            <RevealCard key={clip.id} index={i} clip={clip} />
          ))}
        </div>
      </div>
    </section>
  );
}

function RevealCard({
  clip,
  index,
}: {
  clip: (typeof CLIPS)[number];
  index: number;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`in-view-reveal ${inView ? "is-visible" : ""}`}
      style={{ transitionDelay: `${(index % 3) * 0.06}s` }}
    >
      <ClipCard clip={clip} />
    </div>
  );
}
