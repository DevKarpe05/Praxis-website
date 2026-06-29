import { EMAIL, STATS } from "@/lib/clips";

export default function SiteFooter() {
  return (
    <footer className="surface-ink border-t border-[var(--rule-ink)] px-5 py-10 sm:px-12">
      <div className="mx-auto flex max-w-[1240px] flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <span className="font-serif text-[22px] leading-none text-[var(--bone-50)]">
            Praxis<span className="text-[var(--accent-500)]">.</span>
          </span>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--fg3)]">
            {STATS.markets}
          </p>
        </div>
        <div className="flex flex-col items-start gap-1 sm:items-end">
          <a
            href={`mailto:${EMAIL}`}
            className="font-mono text-[12px] tracking-[0.04em] text-[var(--bone-50)] hover:text-[var(--accent-300)]"
          >
            {EMAIL}
          </a>
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--fg3)]">
            {STATS.continents} · {STATS.environments}
          </span>
        </div>
      </div>
    </footer>
  );
}
