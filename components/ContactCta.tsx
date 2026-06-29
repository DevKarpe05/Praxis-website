"use client";

import { EMAIL } from "@/lib/clips";
import { useInView } from "@/lib/hooks";

export default function ContactCta() {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <section
      id="contact"
      className="relative scroll-mt-4 border-t border-[var(--rule-2)] bg-[var(--bg)] px-5 py-28 sm:px-12 sm:py-40"
    >
      <div
        ref={ref}
        className={`in-view-reveal ${inView ? "is-visible" : ""} mx-auto max-w-[900px] text-center`}
      >
        <p className="t-eyebrow">Tell us the environment you need</p>
        <h2 className="mx-auto mt-6 max-w-[16ch] font-sans text-[clamp(2rem,5.5vw,3.6rem)] font-medium leading-[1.04] tracking-[-0.03em] text-[var(--fg1)]">
          We&apos;re probably{" "}
          <span className="font-serif italic text-[var(--accent-600)]">
            already in it.
          </span>
        </h2>
        <p className="mx-auto mt-6 max-w-[48ch] text-[16px] leading-[1.55] text-[var(--fg2)]">
          Working on physical AI, or want footage and data from a specific kind
          of floor? Reach the founders directly.
        </p>
        <div className="mt-10 flex flex-col items-center gap-4">
          <a
            href={`mailto:${EMAIL}`}
            className="inline-flex h-12 items-center gap-2 rounded-[2px] bg-[var(--accent-500)] px-7 font-sans text-[15px] font-medium text-[var(--bone-50)] transition-colors hover:bg-[var(--accent-600)]"
          >
            Email the founders <span aria-hidden>→</span>
          </a>
          <a
            href={`mailto:${EMAIL}`}
            className="font-mono text-[13px] tracking-[0.04em] text-[var(--fg3)] underline-offset-4 hover:text-[var(--accent-600)] hover:underline"
          >
            {EMAIL}
          </a>
        </div>
      </div>
    </section>
  );
}
