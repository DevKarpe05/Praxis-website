"use client";

import { useEffect, useRef, useState } from "react";
import type { PraxisNode } from "@/lib/nodes";

interface NodePanelProps {
  node: PraxisNode | null;
  total: number;
  onClose: () => void;
}

function fmtCoord(lat: number, lon: number): string {
  const la = `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? "N" : "S"}`;
  const lo = `${Math.abs(lon).toFixed(2)}°${lon >= 0 ? "E" : "W"}`;
  return `${la} · ${lo}`;
}

export default function NodePanel({ node, total, onClose }: NodePanelProps) {
  const open = node !== null;
  const [cached, setCached] = useState<PraxisNode | null>(node);
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (node) setCached(node);
  }, [node]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => closeRef.current?.focus(), 60);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const n = cached;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden
        className="fixed inset-0 z-40 bg-[rgba(3,5,10,0.45)] transition-opacity duration-500"
        style={{
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
        }}
      />

      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="false"
        aria-label={n ? `${n.n} operating environment` : "Node details"}
        aria-hidden={!open}
        inert={!open}
        className="fixed right-0 top-0 z-50 flex h-full w-full flex-col border-l border-[var(--line)] bg-[var(--void2)] shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] sm:max-w-[440px]"
        style={{ transform: open ? "translateX(0)" : "translateX(101%)" }}
      >
        {n && (
          <>
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-[var(--line)] px-6 py-5">
              <div>
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.24em] text-[var(--amber)]">
                  Node {String(n.index).padStart(2, "0")} / {String(total).padStart(2, "0")}
                </p>
                <h2 className="font-display mt-2 text-2xl font-bold text-[var(--ink-bright)]">
                  {n.n}
                </h2>
                <p className="mt-1 font-mono text-[0.72rem] text-[var(--ink-dim)]">
                  {fmtCoord(n.lat, n.lon)} · {n.region}
                </p>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label="Close panel"
                className="-mr-2 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-[var(--line)] text-[var(--ink)] transition-colors hover:border-[var(--steel-lit)] hover:text-[var(--ink-bright)]"
              >
                <span aria-hidden className="text-lg leading-none">×</span>
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {/* Status row */}
              <div className="flex items-center gap-2 font-mono text-[0.7rem] uppercase tracking-[0.18em]">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{
                    background:
                      n.status === "Live"
                        ? "var(--amber)"
                        : "var(--amber-deep)",
                    boxShadow:
                      n.status === "Live"
                        ? "0 0 8px 1px rgba(255,138,43,0.7)"
                        : "none",
                  }}
                  aria-hidden
                />
                <span className="text-[var(--ink-bright)]">{n.status}</span>
                <span className="text-[var(--steel-lit)]">·</span>
                <span className="text-[var(--ink-dim)]">{n.continent}</span>
              </div>

              {/* Secured sample frame */}
              <SampleFrame />

              {/* Environments */}
              <h3 className="label-mono mt-7">Environments</h3>
              <ul className="mt-3 flex flex-col divide-y divide-[var(--line)]">
                {n.environments.map((env, i) => {
                  const hot = env.flag === "hot";
                  return (
                    <li
                      key={i}
                      className="py-3 first:pt-0"
                      style={
                        hot
                          ? {
                              background:
                                "linear-gradient(90deg, rgba(255,138,43,0.10), rgba(255,138,43,0))",
                              boxShadow: "inset 2px 0 0 var(--amber)",
                              paddingLeft: "0.75rem",
                              marginLeft: "-0.75rem",
                              borderRadius: "2px",
                            }
                          : undefined
                      }
                    >
                      <div className="flex items-baseline justify-between gap-3">
                        <span
                          className={`text-sm font-semibold ${
                            hot
                              ? "text-[var(--amber-hot)]"
                              : "text-[var(--ink-bright)]"
                          }`}
                        >
                          {env.n}
                        </span>
                        <span className="shrink-0 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[var(--ink-dim)]">
                          {env.t}
                        </span>
                      </div>
                      <p className="mt-1 text-[0.8rem] leading-relaxed text-[var(--ink-dim)]">
                        {env.task}
                      </p>
                    </li>
                  );
                })}
              </ul>

              {/* Capture stack */}
              <h3 className="label-mono mt-7">Capture stack</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {n.modalities.map((m) => (
                  <span
                    key={m.code}
                    className="inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1.5 font-mono text-[0.66rem] uppercase tracking-[0.1em]"
                    style={{
                      borderColor: m.active
                        ? "rgba(255,138,43,0.4)"
                        : "var(--line)",
                      color: m.active ? "var(--ink-bright)" : "var(--ink-dim)",
                      opacity: m.active ? 1 : 0.6,
                    }}
                  >
                    <span
                      className="inline-block h-1.5 w-1.5 rounded-full"
                      style={{
                        background: m.active
                          ? "var(--amber)"
                          : "var(--steel-lit)",
                        boxShadow: m.active
                          ? "0 0 6px 1px rgba(255,138,43,0.6)"
                          : "none",
                      }}
                      aria-hidden
                    />
                    {m.label}
                    <span className="sr-only">
                      {m.active ? " active" : " inactive"}
                    </span>
                  </span>
                ))}
              </div>

              {/* Note */}
              <p className="mt-7 border-t border-[var(--line)] pt-5 text-[0.82rem] leading-relaxed text-[var(--ink)]">
                {n.note}
              </p>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

function SampleFrame() {
  return (
    <figure className="mt-5">
      <div className="relative aspect-video w-full overflow-hidden rounded-sm border border-[var(--line)] bg-[var(--void)]">
        {/* scanlines */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "repeating-linear-gradient(0deg, rgba(120,140,175,0.06) 0px, rgba(120,140,175,0.06) 1px, transparent 1px, transparent 3px)",
          }}
          aria-hidden
        />
        {/* grain */}
        <div
          className="absolute inset-0 opacity-50 mix-blend-screen"
          style={{
            backgroundImage:
              "radial-gradient(rgba(120,140,175,0.10) 0.5px, transparent 0.5px)",
            backgroundSize: "3px 3px",
          }}
          aria-hidden
        />
        {/* vignette */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 40%, rgba(3,5,10,0.7) 100%)",
          }}
          aria-hidden
        />
        {/* secured label */}
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 font-mono text-[0.58rem] tracking-[0.14em] text-[var(--ink-dim)]">
          <LockGlyph />
          EGO-SAMPLE · under NDA
        </span>
        {/* play glyph */}
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--line)] bg-[rgba(8,12,22,0.55)] backdrop-blur-sm">
            <span
              aria-hidden
              className="ml-0.5 inline-block h-0 w-0 border-y-[7px] border-l-[11px] border-y-transparent border-l-[var(--ink)]"
            />
          </span>
        </span>
      </div>
      <figcaption className="mt-2 text-center font-mono text-[0.62rem] tracking-[0.12em] text-[var(--ink-dim)]">
        Sample available under NDA
      </figcaption>
    </figure>
  );
}

function LockGlyph() {
  return (
    <svg
      width="9"
      height="9"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <rect x="4" y="11" width="16" height="9" rx="1.5" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
