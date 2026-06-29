"use client";

import { useInView } from "@/lib/hooks";

const STEPS = [
  {
    k: "01",
    t: "Deploy",
    d: "We operate inside live industrial floors — embedded in the real work, not staged demos.",
  },
  {
    k: "02",
    t: "Capture",
    d: "Egocentric, multimodal manipulation data from real operators doing dexterous physical work.",
  },
  {
    k: "03",
    t: "Deliver",
    d: "The data those floors produce flows to the labs building physical AI — plus managed deployment.",
  },
];

export default function Approach() {
  return (
    <section
      id="approach"
      className="surface-ink relative border-t border-[var(--rule-ink)] px-5 py-20 sm:px-12 sm:py-28"
    >
      <div className="mx-auto max-w-[1240px]">
        <p className="t-eyebrow flex items-center gap-3 !text-[var(--fg-on-ink-2)]">
          <span aria-hidden className="h-px w-8 bg-[var(--accent-500)]" />
          How it works
        </p>
        <div className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-[2px] border border-[var(--rule-ink)] bg-[var(--rule-ink)] md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Cell key={s.k} step={s} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Cell({
  step,
  index,
}: {
  step: { k: string; t: string; d: string };
  index: number;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`in-view-reveal ${inView ? "is-visible" : ""} flex h-full flex-col bg-[var(--ink-900)] p-7`}
      style={{ transitionDelay: `${index * 0.06}s` }}
    >
      <span className="font-mono text-[11px] tracking-[0.18em] text-[var(--accent-300)]">
        {step.k}
      </span>
      <h3 className="mt-4 font-sans text-[20px] font-medium text-[var(--bone-50)]">
        {step.t}
      </h3>
      <p className="mt-3 text-[14px] leading-[1.55] text-[var(--fg2)]">
        {step.d}
      </p>
    </div>
  );
}
