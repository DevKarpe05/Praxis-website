"use client";

import { useEffect, useRef } from "react";

type V3 = [number, number, number];
type V4 = [number, number, number, number];

interface PoseData {
  meta: { fps: number; nSamples: number; clipDur: number; center: V3; radius: number };
  head_pos: V3[];
  head_q: V4[];
  L_pos: V3[];
  L_q: V4[];
  L_fj: V3[][];
  R_pos: V3[];
  R_q: V4[];
  R_fj: V3[][];
}

const lerp3 = (a: V3, b: V3, t: number): V3 => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
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

/** Slide 3 — head + wrist cams + live mocap only. */
export default function CaptureScene() {
  const head = useRef<HTMLVideoElement>(null);
  const wl = useRef<HTMLVideoElement>(null);
  const wr = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const poseRef = useRef<PoseData | null>(null);
  const orbit = useRef({ yaw: -0.6, pitch: 0.32, drag: false, px: 0, py: 0, auto: true });

  useEffect(() => {
    fetch("/demo/pose.json")
      .then((r) => r.json())
      .then((d: PoseData) => {
        poseRef.current = d;
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;

    const ctx = cv.getContext("2d")!;
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

    const norm = (p: V3, center: V3, radius: number): V3 => [
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

    const drawHand = (
      wrist: V3,
      joints: V3[],
      color: string,
      glow: string,
      center: V3,
      radius: number
    ) => {
      const wp = project(norm(wrist, center, radius));
      for (let fi = 0; fi < 5; fi++) {
        let prev = wp;
        for (let j = 0; j < 4; j++) {
          const jp = project(norm(joints[fi * 4 + j], center, radius));
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
        const jp = project(norm(joints[k], center, radius));
        ctx.beginPath();
        ctx.fillStyle = k % 4 === 3 ? glow : color;
        ctx.arc(jp.x, jp.y, Math.max(1.2, 3.1 * jp.persp), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.beginPath();
      ctx.fillStyle = glow;
      ctx.shadowColor = glow;
      ctx.shadowBlur = 10;
      ctx.arc(wp.x, wp.y, Math.max(2.5, 5 * wp.persp), 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    };

    const drawAxes = (origin: V3, q: V4, len: number, center: V3, radius: number) => {
      const o = project(norm(origin, center, radius));
      const axes: [V3, string][] = [
        [[len, 0, 0], "#e04a0b"],
        [[0, len, 0], "#14a4bc"],
        [[0, 0, len], "#7c3aed"],
      ];
      for (const [ax, col] of axes) {
        const tip = qRot(q, ax);
        const end = project(
          norm([origin[0] + tip[0], origin[1] + tip[1], origin[2] + tip[2]], center, radius)
        );
        ctx.beginPath();
        ctx.strokeStyle = col;
        ctx.lineWidth = 1.5;
        ctx.moveTo(o.x, o.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
      }
    };

    const draw = () => {
      const pose = poseRef.current;
      const master = head.current;
      if (pose && master) {
        const { center, radius, fps, nSamples, clipDur } = pose.meta;
        const t = master.currentTime % clipDur;
        const fpos = t * fps;
        const i0 = Math.min(nSamples - 1, Math.floor(fpos));
        const i1 = Math.min(nSamples - 1, i0 + 1);
        const f = fpos - i0;

        for (const v of [wl.current, wr.current]) {
          if (v && Math.abs(v.currentTime - master.currentTime) > 0.12) {
            v.currentTime = master.currentTime;
          }
        }

        if (orbit.current.auto && !orbit.current.drag) orbit.current.yaw += 0.0016;

        ctx.clearRect(0, 0, W, H);

        const zf = -center[2] / radius;
        ctx.strokeStyle = "rgba(246,242,234,0.06)";
        for (let i = -5; i <= 5; i++) {
          const a = project([(i / 5) * 1.4, -1.4, zf]);
          const b = project([(i / 5) * 1.4, 1.4, zf]);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }

        const hp = lerp3(pose.head_pos[i0], pose.head_pos[i1], f);
        const lp = lerp3(pose.L_pos[i0], pose.L_pos[i1], f);
        const rp = lerp3(pose.R_pos[i0], pose.R_pos[i1], f);
        const lj = pose.L_fj[i0].map((_, k) => lerp3(pose.L_fj[i0][k], pose.L_fj[i1][k], f));
        const rj = pose.R_fj[i0].map((_, k) => lerp3(pose.R_fj[i0][k], pose.R_fj[i1][k], f));

        drawAxes(hp, pose.head_q[i0], 0.18, center, radius);
        const hproj = project(norm(hp, center, radius));
        ctx.beginPath();
        ctx.fillStyle = "#f6f2ea";
        ctx.arc(hproj.x, hproj.y, Math.max(3, 6 * hproj.persp), 0, Math.PI * 2);
        ctx.fill();

        drawAxes(lp, pose.L_q[i0], 0.12, center, radius);
        drawAxes(rp, pose.R_q[i0], 0.12, center, radius);
        drawHand(lp, lj, "rgba(20,164,188,0.85)", "#14a4bc", center, radius);
        drawHand(rp, rj, "rgba(124,58,237,0.9)", "#c9a8f0", center, radius);
      } else {
        ctx.clearRect(0, 0, W, H);
      }
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
  }, []);

  return (
    <div className="absolute inset-0 flex flex-col pt-[72px] pb-[88px] pointer-events-auto">
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 px-4 sm:px-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="flex min-h-0 flex-col gap-2">
          <div className="relative min-h-0 flex-1 overflow-hidden rounded-[2px] border border-[rgba(246,242,234,0.12)]">
            <video
              ref={head}
              src="/demo/head.mp4"
              muted
              loop
              autoPlay
              playsInline
              preload="auto"
              className="h-full w-full object-cover"
              style={{ filter: "grayscale(0.15) contrast(1.05) brightness(0.92)" }}
            />
            <span className="absolute left-2 top-2 font-mono text-[8px] uppercase tracking-[0.12em] text-[var(--bone-50)]">
              head · ZED 2i
            </span>
          </div>
          <div className="grid shrink-0 grid-cols-2 gap-2">
            {[
              { ref: wl, src: "/demo/wristL.mp4", label: "wrist · L" },
              { ref: wr, src: "/demo/wristR.mp4", label: "wrist · R" },
            ].map((c) => (
              <div
                key={c.label}
                className="relative aspect-video overflow-hidden rounded-[2px] border border-[rgba(20,164,188,0.5)]"
              >
                <video
                  ref={c.ref}
                  src={c.src}
                  muted
                  loop
                  autoPlay
                  playsInline
                  preload="auto"
                  className="h-full w-full object-cover"
                  style={{ filter: "grayscale(0.15) contrast(1.05)" }}
                />
                <span className="absolute left-1.5 top-1.5 font-mono text-[8px] uppercase tracking-[0.1em] text-[var(--signal-500)]">
                  {c.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex min-h-0 flex-col gap-2">
          <div className="relative min-h-[180px] flex-1 overflow-hidden rounded-[2px] border border-[rgba(246,242,234,0.12)] bg-[#0b0a08] lg:min-h-0">
            <canvas
              ref={canvas}
              className="h-full w-full cursor-grab active:cursor-grabbing"
            />
            <span className="pointer-events-none absolute left-2 top-2 font-mono text-[8px] uppercase tracking-[0.12em] text-[var(--fg-on-ink-2)]">
              mocap · live reconstruction
            </span>
            <span className="pointer-events-none absolute right-2 top-2 font-mono text-[8px] uppercase tracking-[0.1em] text-[var(--fg4)]">
              drag to orbit
            </span>
          </div>
          <div className="pointer-events-none shrink-0 text-center">
            <div className="font-sans text-[clamp(2rem,3.4vw,2.9rem)] font-medium leading-none tracking-[-0.02em] text-[#f6f2ea]">
              100,000 hours
            </div>
            <div className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--fg-on-ink-2)]">
              of multimodal capture
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
