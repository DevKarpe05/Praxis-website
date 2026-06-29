"use client";

import type { Clip } from "@/lib/clips";

function PlayGlyph({ size = 14 }: { size?: number }) {
  return (
    <span
      aria-hidden
      style={{
        display: "inline-block",
        width: 0,
        height: 0,
        borderTop: `${size * 0.62}px solid transparent`,
        borderBottom: `${size * 0.62}px solid transparent`,
        borderLeft: `${size}px solid currentColor`,
        marginLeft: 2,
      }}
    />
  );
}

/** Compact, grayscale tile used in the hero mosaic background. */
export function MosaicTile({ clip }: { clip: Clip }) {
  return (
    <div className="relative block h-full w-full overflow-hidden bg-[var(--bg-ink-elev)]">
      {clip.src ? (
        <video
          className="h-full w-full object-cover"
          src={clip.src}
          poster={clip.poster}
          muted
          loop
          playsInline
          autoPlay
        />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(124,58,237,0.12),transparent_70%)]" />
      )}
      <span className="absolute bottom-1.5 left-2 font-mono text-[8px] uppercase tracking-[0.12em] text-[var(--fg-on-ink-2)]">
        {clip.id.replace("-", " · ")}
      </span>
    </div>
  );
}

/** Larger, full-color card used in the capability gallery. */
export function ClipCard({ clip }: { clip: Clip }) {
  const hasVideo = Boolean(clip.src);
  return (
    <figure className="group relative flex flex-col">
      <div className="relative aspect-video w-full overflow-hidden rounded-[2px] border border-[var(--rule-2)] bg-[var(--ink-900)]">
        {hasVideo ? (
          <video
            className="h-full w-full object-cover"
            src={clip.src}
            poster={clip.poster}
            muted
            loop
            playsInline
            autoPlay
            controls
          />
        ) : (
          <>
            {/* grain + grid placeholder */}
            <div className="absolute inset-0 bg-grid opacity-60" />
            <div className="scanlines absolute inset-0 opacity-40" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(124,58,237,0.16),transparent_72%)]" />
            <span className="absolute left-3 top-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--fg-on-ink-2)]">
              {clip.location}
            </span>
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--rule-ink)] bg-[rgba(20,19,15,0.55)] text-[var(--bone-50)] transition-colors group-hover:border-[var(--accent-500)] group-hover:text-[var(--accent-300)]">
                <PlayGlyph />
              </span>
            </span>
            <span className="absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--fg4)]">
              Footage coming soon
            </span>
          </>
        )}
      </div>
      <figcaption className="mt-3 flex items-baseline justify-between gap-3">
        <span className="text-[15px] font-medium text-[var(--fg1)]">
          {clip.env}
        </span>
        <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--fg3)]">
          {clip.tag}
        </span>
      </figcaption>
      <span className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--fg4)]">
        {clip.location}
      </span>
    </figure>
  );
}
