"use client";

import { useInView } from "@/lib/hooks";

function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`in-view-reveal ${inView ? "is-visible" : ""} ${className}`}
      style={{ transitionDelay: `${delay}s` }}
    >
      {children}
    </div>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p className="label-mono flex items-center gap-3 text-[var(--amber)]">
      <span aria-hidden className="h-px w-8 bg-[var(--amber-deep)]" />
      {children}
    </p>
  );
}

export function Bottleneck() {
  return (
    <section className="relative border-t border-[var(--line)] bg-[var(--void)] px-6 py-24 sm:px-10 sm:py-32">
      <div className="mx-auto max-w-[1100px]">
        <Reveal>
          <Kicker>The bottleneck</Kicker>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="font-display mt-8 max-w-[28ch] text-balance text-3xl font-bold leading-[1.12] tracking-[-0.02em] text-[var(--ink-bright)] sm:text-5xl">
            Compute is abundant. The constraint is{" "}
            <span className="text-[var(--amber-hot)]">real-world data</span> —
            and it&apos;s gated behind operating businesses that don&apos;t pick
            up the phone for a lab.
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-8 max-w-[58ch] text-base leading-relaxed text-[var(--ink)] sm:text-lg">
            Praxis holds those relationships. We&apos;re already on the floor —
            embedded inside live operations where the work actually happens,
            capturing the egocentric, physical signal that can&apos;t be
            scraped, simulated, or synthesized.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

const PILLARS = [
  {
    t: "Deployment",
    d: "Sensors worn by real workers inside live operations — not staged demos or lab rigs.",
  },
  {
    t: "Diversity",
    d: "Four continents, a dozen sectors — from sub-millimetre craft to heavy-industrial scale.",
  },
  {
    t: "Fidelity",
    d: "Stereo-RGB, IMU, wrist cameras and haptic-glove kinematics, time-synced at the hand.",
  },
  {
    t: "Scale",
    d: "Standing relationships and recurring access across markets — throughput that compounds.",
  },
];

export function Pillars() {
  return (
    <section className="relative border-t border-[var(--line)] bg-[var(--void2)] px-6 py-24 sm:px-10 sm:py-32">
      <div className="mx-auto max-w-[1200px]">
        <Reveal>
          <Kicker>What makes the data gold standard</Kicker>
        </Reveal>
        <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-sm border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((p, i) => (
            <Reveal key={p.t} delay={0.05 * i}>
              <div className="flex h-full flex-col bg-[var(--void2)] p-7">
                <span className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-[var(--ink-dim)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="font-display mt-4 text-xl font-bold text-[var(--ink-bright)]">
                  {p.t}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--ink-dim)]">
                  {p.d}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const ROADMAP = [
  {
    k: "Today",
    t: "Egocentric data",
    d: "Multimodal capture from inside live operations across four continents.",
    current: true,
  },
  {
    k: "Next",
    t: "Physical evals",
    d: "Test your policy in our environments before you trust it in the wild.",
    current: false,
  },
  {
    k: "Then",
    t: "Managed deployment",
    d: "Robotics and managed teleop in the same floors we collected from.",
    current: false,
  },
];

export function Roadmap() {
  return (
    <section className="relative border-t border-[var(--line)] bg-[var(--void)] px-6 py-24 sm:px-10 sm:py-32">
      <div className="mx-auto max-w-[1200px]">
        <Reveal>
          <Kicker>Where this goes</Kicker>
        </Reveal>
        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
          {ROADMAP.map((r, i) => (
            <Reveal key={r.k} delay={0.06 * i}>
              <div
                className="relative flex h-full flex-col rounded-sm border p-7"
                style={{
                  borderColor: r.current
                    ? "rgba(255,138,43,0.45)"
                    : "var(--line)",
                  background: r.current
                    ? "linear-gradient(160deg, rgba(255,138,43,0.07), rgba(8,12,22,0))"
                    : "var(--void2)",
                }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{
                      background: r.current
                        ? "var(--amber)"
                        : "var(--steel-lit)",
                      boxShadow: r.current
                        ? "0 0 8px 1px rgba(255,138,43,0.7)"
                        : "none",
                    }}
                    aria-hidden
                  />
                  <span
                    className="font-mono text-[0.62rem] uppercase tracking-[0.22em]"
                    style={{
                      color: r.current ? "var(--amber)" : "var(--ink-dim)",
                    }}
                  >
                    {r.k}
                    {r.current ? " · current" : ""}
                  </span>
                </div>
                <h3 className="font-display mt-4 text-xl font-bold text-[var(--ink-bright)]">
                  {r.t}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--ink-dim)]">
                  {r.d}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function EndCta() {
  return (
    <section
      id="request"
      className="relative scroll-mt-12 border-t border-[var(--line)] bg-[var(--void2)] px-6 py-28 sm:px-10 sm:py-40"
    >
      <div className="mx-auto max-w-[1000px] text-center">
        <Reveal>
          <h2 className="font-display mx-auto max-w-[20ch] text-balance text-3xl font-extrabold leading-[1.08] tracking-[-0.02em] text-[var(--ink-bright)] sm:text-6xl">
            Tell us the environment you need.{" "}
            <span className="text-[var(--amber-hot)]">
              We&apos;re probably already in it.
            </span>
          </h2>
        </Reveal>
        <Reveal delay={0.08}>
          <div className="mt-10 flex flex-col items-center gap-3">
            <button
              type="button"
              aria-disabled="true"
              className="inline-flex cursor-not-allowed items-center gap-2 rounded-sm bg-[var(--amber)] px-7 py-3.5 text-sm font-semibold text-[var(--void)] opacity-90"
              onClick={(e) => e.preventDefault()}
            >
              Request a collection
            </button>
            <span className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-[var(--ink-dim)]">
              Contact form coming soon
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-[var(--line)] bg-[var(--void)] px-6 py-10 sm:px-10">
      <div className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <p className="font-display text-sm font-semibold text-[var(--ink)]">
          Praxis{" "}
          <span className="font-body font-normal text-[var(--ink-dim)]">
            — Industrial access for physical AI
          </span>
        </p>
        <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-[var(--ink-dim)]">
          4 markets · 4 continents · <span className="text-[var(--amber)]">live</span>
        </p>
      </div>
    </footer>
  );
}
