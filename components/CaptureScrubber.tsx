"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

type V3 = [number, number, number];
type V4 = [number, number, number, number];

export interface PoseData {
  meta: {
    task: string;
    scene: string;
    world: string;
    fps: number;
    nSamples: number;
    clipDur: number;
    sessionFrames: number;
    sessionDur: number;
    rateHz: number;
    center: V3;
    radius: number;
    counts: Record<string, number>;
    camera: {
      model: string;
      serial: string;
      sdk: string;
      fx: number;
      fy: number;
      cx: number;
      cy: number;
      res: [number, number];
      hFOV: number;
      vFOV: number;
      dFOV: number;
      baselineMM: number;
    };
    dataset: {
      hours: number;
      sessions: number;
      categories: number;
      urls: number;
      filesPerPackage: number;
    };
    fingerNames: string[];
  };
  segments: { label: string; t0: number; t1: number }[];
  subIdx: number[];
  head_pos: V3[];
  head_q: V4[];
  L_pos: V3[];
  L_q: V4[];
  L_fj: V3[][];
  R_pos: V3[];
  R_q: V4[];
  R_fj: V3[][];
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerp3 = (a: V3, b: V3, t: number): V3 => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t),
  lerp(a[2], b[2], t),
];

function qRot(q: V4, v: V3): V3 {
  const [x, y, z, w] = q;
  const tx = 2 * (y * v[2] - z * v[1]);
  const ty = 2 * (z * v[0] - x * v[2]);
  const tz = 2 * (x * v[1] - y * v[0]);
  return [
    v[0] + w * tx + (y * tz - z * ty),
    v[1] + w * ty + (z * tx - x * tz),
    v[2] + w * tz + (x * ty - y * tx),
  ];
}

export default function CaptureScrubber({ compact = false }: { compact?: boolean }) {
  const [pose, setPose] = useState<PoseData | null>(null);
  const [playing, setPlaying] = useState(true);

  const head = useRef<HTMLVideoElement>(null);
  const wl = useRef<HTMLVideoElement>(null);
  const wr = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const scrub = useRef<HTMLInputElement>(null);
  const root = useRef<HTMLDivElement>(null);

  const tRead = useRef<HTMLSpanElement>(null);
  const subRead = useRef<HTMLSpanElement>(null);
  const headRead = useRef<HTMLSpanElement>(null);
  const lRead = useRef<HTMLSpanElement>(null);
  const rRead = useRef<HTMLSpanElement>(null);
  const gripL = useRef<HTMLDivElement>(null);
  const gripR = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);

  const orbit = useRef({ yaw: -0.6, pitch: 0.32, drag: false, px: 0, py: 0, auto: true });

  useEffect(() => {
    fetch("/demo/pose.json")
      .then((r) => r.json())
      .then((d: PoseData) => setPose(d))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!pose) return;
    const cv = canvas.current!;
    const ctx = cv.getContext("2d")!;
    const master = head.current!;
    const { center, radius } = pose.meta;
    const N = pose.meta.nSamples;
    const FPS = pose.meta.fps;

    let raf = 0;
    let W = 0;
    let H = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = cv.getBoundingClientRect();
      W = r.width;
      H = r.height;
      cv.width = Math.max(1, Math.floor(W * dpr));
      cv.height = Math.max(1, Math.floor(H * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(cv);

    const norm = (p: V3): V3 => [
      (p[0] - center[0]) / radius,
      (p[1] - center[1]) / radius,
      (p[2] - center[2]) / radius,
    ];

    const project = (p: V3) => {
      const { yaw, pitch } = orbit.current;
      const cy = Math.cos(yaw);
      const sy = Math.sin(yaw);
      const x = p[0] * cy - p[1] * sy;
      const y = p[0] * sy + p[1] * cy;
      const z = p[2];
      const cp = Math.cos(pitch);
      const sp = Math.sin(pitch);
      const y2 = y * cp - z * sp;
      const z2 = y * sp + z * cp;
      const depth = y2;
      const persp = 2.6 / (3.1 + depth);
      const s = Math.min(W, H) * 0.42;
      return {
        x: W / 2 + x * persp * s,
        y: H / 2 - z2 * persp * s,
        persp,
      };
    };

    const at = (arr: V3[], i0: number, i1: number, f: number) =>
      lerp3(arr[i0], arr[i1], f);

    const drawHand = (wrist: V3, joints: V3[], color: string, glow: string) => {
      const wp = project(norm(wrist));
      for (let fi = 0; fi < 5; fi++) {
        let prev = wp;
        for (let j = 0; j < 4; j++) {
          const jp = project(norm(joints[fi * 4 + j]));
          ctx.beginPath();
          ctx.strokeStyle = color;
          ctx.lineWidth = Math.max(0.6, 2.4 * jp.persp);
          ctx.globalAlpha = 0.55 + 0.45 * Math.min(1, jp.persp);
          ctx.moveTo(prev.x, prev.y);
          ctx.lineTo(jp.x, jp.y);
          ctx.stroke();
          prev = jp;
        }
      }
      ctx.globalAlpha = 1;
      for (let k = 0; k < joints.length; k++) {
        const jp = project(norm(joints[k]));
        ctx.beginPath();
        ctx.fillStyle = k % 4 === 3 ? glow : color;
        ctx.arc(jp.x, jp.y, Math.max(1.2, 3.1 * jp.persp), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.beginPath();
      ctx.fillStyle = glow;
      ctx.shadowColor = glow;
      ctx.shadowBlur = 12;
      ctx.arc(wp.x, wp.y, Math.max(2.5, 5 * wp.persp), 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      return wp;
    };

    const drawAxes = (origin: V3, q: V4, len: number) => {
      const o = project(norm(origin));
      const axes: [V3, string][] = [
        [[len, 0, 0], "#e04a0b"],
        [[0, len, 0], "#14a4bc"],
        [[0, 0, len], "#7c3aed"],
      ];
      for (const [ax, col] of axes) {
        const tip = qRot(q, ax);
        const end = project(
          norm([origin[0] + tip[0], origin[1] + tip[1], origin[2] + tip[2]])
        );
        ctx.beginPath();
        ctx.strokeStyle = col;
        ctx.globalAlpha = 0.9;
        ctx.lineWidth = 1.5;
        ctx.moveTo(o.x, o.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };

    const grip = (wrist: V3, joints: V3[]) => {
      let sum = 0;
      for (let fi = 0; fi < 5; fi++) {
        const t = joints[fi * 4 + 3];
        sum += Math.hypot(t[0] - wrist[0], t[1] - wrist[1], t[2] - wrist[2]);
      }
      return Math.max(0, Math.min(1, 1 - (sum / 5 - 0.06) / 0.12));
    };

    const fmt3 = (p: V3) =>
      `${p[0].toFixed(2)} ${p[1].toFixed(2)} ${p[2].toFixed(2)}`;

    const draw = () => {
      const t = master.currentTime % pose.meta.clipDur;
      const fpos = t * FPS;
      const i0 = Math.min(N - 1, Math.floor(fpos));
      const i1 = Math.min(N - 1, i0 + 1);
      const f = fpos - i0;

      for (const v of [wl.current, wr.current]) {
        if (v && Math.abs(v.currentTime - master.currentTime) > 0.12) {
          v.currentTime = master.currentTime;
        }
      }

      if (orbit.current.auto && !orbit.current.drag) orbit.current.yaw += 0.0016;

      ctx.clearRect(0, 0, W, H);

      ctx.strokeStyle = "rgba(246,242,234,0.06)";
      ctx.lineWidth = 1;
      const g = 5;
      const zf = -center[2] / radius;
      for (let i = -g; i <= g; i++) {
        const a = project([(i / g) * 1.4, -1.4, zf]);
        const b = project([(i / g) * 1.4, 1.4, zf]);
        const c = project([-1.4, (i / g) * 1.4, zf]);
        const d = project([1.4, (i / g) * 1.4, zf]);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.moveTo(c.x, c.y);
        ctx.lineTo(d.x, d.y);
        ctx.stroke();
      }

      const hp = at(pose.head_pos, i0, i1, f);
      const lp = at(pose.L_pos, i0, i1, f);
      const rp = at(pose.R_pos, i0, i1, f);
      const lj = pose.L_fj[i0].map((_, k) =>
        lerp3(pose.L_fj[i0][k], pose.L_fj[i1][k], f)
      );
      const rj = pose.R_fj[i0].map((_, k) =>
        lerp3(pose.R_fj[i0][k], pose.R_fj[i1][k], f)
      );

      const hproj = project(norm(hp));
      drawAxes(hp, pose.head_q[i0], 0.18);
      ctx.beginPath();
      ctx.fillStyle = "#f6f2ea";
      ctx.shadowColor = "#f6f2ea";
      ctx.shadowBlur = 10;
      ctx.arc(hproj.x, hproj.y, Math.max(3, 6 * hproj.persp), 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(246,242,234,0.55)";
      ctx.font = "9px ui-monospace, monospace";
      ctx.fillText("HEAD", hproj.x + 8, hproj.y - 8);

      drawAxes(lp, pose.L_q[i0], 0.12);
      drawAxes(rp, pose.R_q[i0], 0.12);
      drawHand(lp, lj, "rgba(20,164,188,0.85)", "#14a4bc");
      drawHand(rp, rj, "rgba(124,58,237,0.9)", "#c9a8f0");

      if (tRead.current)
        tRead.current.textContent = `${t.toFixed(1)}s / ${pose.meta.clipDur.toFixed(0)}s`;
      const si = pose.subIdx[i0] ?? 0;
      if (subRead.current)
        subRead.current.textContent = pose.segments[si]?.label ?? "";
      if (headRead.current) headRead.current.textContent = fmt3(hp);
      if (lRead.current) lRead.current.textContent = fmt3(lp);
      if (rRead.current) rRead.current.textContent = fmt3(rp);
      if (gripL.current) gripL.current.style.width = `${grip(lp, lj) * 100}%`;
      if (gripR.current) gripR.current.style.width = `${grip(rp, rj) * 100}%`;

      if (scrub.current && document.activeElement !== scrub.current)
        scrub.current.value = String(t);
      if (playheadRef.current)
        playheadRef.current.style.left = `${(t / pose.meta.clipDur) * 100}%`;

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    const down = (e: PointerEvent) => {
      orbit.current.drag = true;
      orbit.current.auto = false;
      orbit.current.px = e.clientX;
      orbit.current.py = e.clientY;
    };
    const move = (e: PointerEvent) => {
      if (!orbit.current.drag) return;
      orbit.current.yaw += (e.clientX - orbit.current.px) * 0.008;
      orbit.current.pitch = Math.max(
        -1.2,
        Math.min(1.3, orbit.current.pitch + (e.clientY - orbit.current.py) * 0.006)
      );
      orbit.current.px = e.clientX;
      orbit.current.py = e.clientY;
    };
    const up = () => {
      orbit.current.drag = false;
    };
    cv.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      cv.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [pose]);

  const togglePlay = () => {
    const vids = [head.current, wl.current, wr.current];
    if (playing) vids.forEach((v) => v?.pause());
    else vids.forEach((v) => v?.play());
    setPlaying(!playing);
  };

  const onScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = Number(e.target.value);
    [head.current, wl.current, wr.current].forEach((v) => {
      if (v) v.currentTime = t;
    });
  };

  const m = pose?.meta;
  const pad = compact ? "px-4 sm:px-6" : "px-6";
  const bottomPad = compact ? "pb-[68px]" : "pb-6";

  return (
    <div
      ref={root}
      className={`${
        compact
          ? "absolute inset-0 flex flex-col overflow-hidden bg-[#0f0e0b] pointer-events-auto"
          : "w-full"
      } text-[var(--bone-50)]`}
    >
      {!compact && (
        <section className={`mx-auto max-w-[1240px] ${pad} pt-12 pb-6`}>
          <div className="t-eyebrow mb-4 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-500)] blink" />
            one capture · every modality
          </div>
          <h1 className="m-0 max-w-[900px] font-sans text-[clamp(2rem,5.2vw,3.6rem)] font-medium leading-[1.02] tracking-[-0.035em] text-[#f6f2ea]">
            One home task, recorded the way a machine must learn it.
          </h1>
        </section>
      )}

      {compact && (
        <div className={`flex shrink-0 items-center justify-between ${pad} pt-[72px] pb-2`}>
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--fg-on-ink-2)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--flare-500)] blink" />
            REC · 4 streams · 30 Hz
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--signal-500)]">
            {m?.task ?? "tidy pillowcases"}
          </span>
        </div>
      )}

      <section className={`${compact ? "flex min-h-0 flex-1 flex-col" : "mx-auto max-w-[1240px]"} ${pad}`}>
        <div
          className={`grid min-h-0 flex-1 gap-2 ${compact ? "grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]" : "grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]"}`}
        >
          <div className="flex min-h-0 flex-col gap-2">
            <Panel label="egocentric · head (ZED 2i)" accent="#f6f2ea">
              <video
                ref={head}
                src="/demo/head.mp4"
                muted
                loop
                autoPlay
                playsInline
                preload="auto"
                className={`w-full object-cover ${compact ? "h-full min-h-[120px]" : "aspect-video"}`}
              />
            </Panel>
            <div className="grid grid-cols-2 gap-2">
              <Panel label="wrist · left" accent="#14a4bc">
                <video
                  ref={wl}
                  src="/demo/wristL.mp4"
                  muted
                  loop
                  autoPlay
                  playsInline
                  preload="auto"
                  className={`w-full object-cover ${compact ? "aspect-video max-h-[90px]" : "aspect-video"}`}
                />
              </Panel>
              <Panel label="wrist · right" accent="#c9a8f0">
                <video
                  ref={wr}
                  src="/demo/wristR.mp4"
                  muted
                  loop
                  autoPlay
                  playsInline
                  preload="auto"
                  className={`w-full object-cover ${compact ? "aspect-video max-h-[90px]" : "aspect-video"}`}
                />
              </Panel>
            </div>
          </div>

          <Panel
            label="motion capture · live reconstruction"
            accent="#7c3aed"
            hint="drag to orbit"
            fill
          >
            <div className={`relative w-full bg-[#0b0a08] ${compact ? "h-full min-h-[160px]" : "min-h-[420px] h-full"}`}>
              <canvas
                ref={canvas}
                className="h-full w-full cursor-grab active:cursor-grabbing"
              />
              <div className="pointer-events-none absolute left-2 top-2 flex flex-col gap-0.5 font-mono text-[8px] uppercase tracking-[0.1em]">
                <span className="text-[#14a4bc]">■ L · 20 joints</span>
                <span className="text-[#c9a8f0]">■ R · 20 joints</span>
                <span className="text-[#f6f2ea]">■ head · 6-DoF</span>
              </div>
              <div className="pointer-events-none absolute bottom-2 right-2 font-mono text-[8px] text-[var(--fg-on-ink-2)]">
                {m?.world ?? "RH · FLU"}
              </div>
            </div>
          </Panel>
        </div>

        {/* transport + sub-task track */}
        <div className={`mt-2 shrink-0 rounded-[3px] border border-[rgba(246,242,234,0.12)] bg-[rgba(15,14,11,0.85)] p-3`}>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={togglePlay}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent-500)] text-[#f6f2ea] text-xs"
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? "❚❚" : "▶"}
            </button>
            <input
              ref={scrub}
              type="range"
              min={0}
              max={m?.clipDur ?? 40}
              step={0.033}
              defaultValue={0}
              onChange={onScrub}
              className="praxis-range min-w-0 flex-1"
            />
            <span
              ref={tRead}
              className="w-[72px] shrink-0 text-right font-mono text-[10px] text-[var(--fg-on-ink-2)]"
            >
              0.0s
            </span>
          </div>

          <div className="mt-2">
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-[var(--fg-on-ink-2)]">
                sub-task instruction
              </span>
              <span
                ref={subRead}
                className="truncate text-right font-mono text-[10px] text-[var(--signal-500)]"
              >
                —
              </span>
            </div>
            <div className="relative h-7 overflow-hidden rounded-[2px] bg-[#0b0a08]">
              {pose?.segments.map((s, i) => (
                <div
                  key={i}
                  className="absolute top-0 flex h-full items-center overflow-hidden border-l border-[rgba(246,242,234,0.14)] px-1.5"
                  style={{
                    left: `${(s.t0 / (m!.clipDur)) * 100}%`,
                    width: `${((s.t1 - s.t0) / m!.clipDur) * 100}%`,
                    background:
                      i % 2 === 0
                        ? "rgba(20,164,188,0.14)"
                        : "rgba(124,58,237,0.16)",
                  }}
                >
                  <span className="truncate font-mono text-[8px] text-[var(--fg-on-ink-2)]">
                    {s.label}
                  </span>
                </div>
              ))}
              <div
                ref={playheadRef}
                className="absolute top-0 z-10 h-full w-px bg-[var(--flare-500)]"
                style={{ left: 0 }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* readouts */}
      <section className={`shrink-0 ${pad} py-2`}>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <Readout label="head · pos (m)" refEl={headRead} accent="#f6f2ea" />
          <Readout label="left EE · pos (m)" refEl={lRead} accent="#14a4bc" />
          <Readout label="right EE · pos (m)" refEl={rRead} accent="#c9a8f0" />
          <div className="rounded-[3px] border border-[rgba(246,242,234,0.12)] bg-[rgba(15,14,11,0.85)] p-2">
            <div className="mb-1.5 font-mono text-[8px] uppercase tracking-[0.12em] text-[var(--fg-on-ink-2)]">
              grip · L / R
            </div>
            <div className="mb-1 h-1 overflow-hidden rounded-full bg-[#0b0a08]">
              <div ref={gripL} className="h-full bg-[var(--signal-500)]" style={{ width: "0%" }} />
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-[#0b0a08]">
              <div ref={gripR} className="h-full bg-[var(--accent-300)]" style={{ width: "0%" }} />
            </div>
          </div>
        </div>
      </section>

      {/* calibration */}
      <section className={`shrink-0 ${pad} ${bottomPad}`}>
        <div className="mb-2 font-mono text-[8px] uppercase tracking-[0.14em] text-[var(--fg-on-ink-2)]">
          Calibrated, not just recorded
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { title: "Coord frame", src: "/demo/coord.jpg", alt: "RH FLU coordinate system" },
            { title: "Rig extrinsics", src: "/demo/extrinsics.png", alt: "Head to camera extrinsics" },
            { title: "Hand joint map", src: "/demo/handmap.png", alt: "Finger joint naming" },
          ].map((c) => (
            <div
              key={c.title}
              className="overflow-hidden rounded-[2px] border border-[rgba(246,242,234,0.12)] bg-[rgba(15,14,11,0.85)]"
            >
              <div className="relative aspect-[16/10] w-full bg-[#0b0a08]">
                <Image src={c.src} alt={c.alt} fill sizes="200px" style={{ objectFit: "contain" }} />
              </div>
              <div className="px-1.5 py-1 font-mono text-[8px] text-[var(--fg-on-ink-2)]">
                {c.title}
              </div>
            </div>
          ))}
        </div>
        {m && (
          <div className="mt-2 grid grid-cols-3 gap-x-3 gap-y-1 rounded-[2px] border border-[rgba(246,242,234,0.12)] bg-[rgba(15,14,11,0.85)] p-2 font-mono text-[9px] text-[var(--fg-on-ink-2)] sm:grid-cols-6">
            <KV k="camera" v={m.camera.model} />
            <KV k="fx / fy" v={`${m.camera.fx} / ${m.camera.fy}`} />
            <KV k="cx / cy" v={`${m.camera.cx} / ${m.camera.cy}`} />
            <KV k="resolution" v={m.camera.res.join("×")} />
            <KV k="dFOV" v={`${m.camera.dFOV}°`} />
            <KV k="baseline" v={`${m.camera.baselineMM} mm`} />
          </div>
        )}
      </section>

      <style jsx global>{`
        .praxis-range {
          -webkit-appearance: none;
          appearance: none;
          height: 4px;
          border-radius: 999px;
          background: rgba(246, 242, 234, 0.16);
          outline: none;
        }
        .praxis-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #7c3aed;
          cursor: pointer;
          border: 2px solid #f6f2ea;
        }
        .praxis-range::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #7c3aed;
          cursor: pointer;
          border: 2px solid #f6f2ea;
        }
      `}</style>
    </div>
  );
}

function Panel({
  label,
  accent,
  hint,
  fill,
  children,
}: {
  label: string;
  accent: string;
  hint?: string;
  fill?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[3px] border border-[rgba(246,242,234,0.12)] bg-[rgba(15,14,11,0.85)] ${
        fill ? "flex min-h-0 flex-col" : ""
      }`}
    >
      <div className="flex items-center justify-between border-b border-[rgba(246,242,234,0.08)] px-2 py-1">
        <span className="flex items-center gap-1 font-mono text-[8px] uppercase tracking-[0.12em] text-[var(--fg-on-ink-2)]">
          <span className="h-1 w-1 rounded-full" style={{ background: accent }} />
          {label}
        </span>
        {hint && (
          <span className="font-mono text-[8px] uppercase tracking-[0.1em] text-[var(--fg4)]">
            {hint}
          </span>
        )}
      </div>
      {fill ? <div className="min-h-0 flex-1">{children}</div> : children}
    </div>
  );
}

function Readout({
  label,
  refEl,
  accent,
}: {
  label: string;
  refEl: React.RefObject<HTMLSpanElement | null>;
  accent: string;
}) {
  return (
    <div className="rounded-[3px] border border-[rgba(246,242,234,0.12)] bg-[rgba(15,14,11,0.85)] p-2">
      <div className="mb-1 flex items-center gap-1 font-mono text-[8px] uppercase tracking-[0.12em] text-[var(--fg-on-ink-2)]">
        <span className="h-1 w-1 rounded-full" style={{ background: accent }} />
        {label}
      </div>
      <span ref={refEl} className="font-mono text-[11px] tabular-nums text-[#f6f2ea]">
        —
      </span>
    </div>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <span className="text-[var(--fg4)]">{k}</span>
      <br />
      <span className="text-[#f6f2ea]">{v}</span>
    </div>
  );
}
