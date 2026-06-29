"use client";

import { useEffect, useRef } from "react";
import { LAND } from "@/lib/land";
import type { PraxisNode } from "@/lib/nodes";
import {
  DEG2RAD,
  easeInOut,
  project,
  rotationFacing,
  shortestAngle,
  type Rotation,
} from "@/lib/geo";

interface GlobeProps {
  nodes: PraxisNode[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  reducedMotion: boolean;
  /** Globe is "live" once the door has opened — enables entry + auto-rotation. */
  active: boolean;
}

interface Tween {
  fromYaw: number;
  fromPitch: number;
  toYaw: number;
  toPitch: number;
  start: number;
  dur: number;
}

const AUTO_SPEED = 0.055; // radians / second
const IDLE_RESUME_MS = 2600;

export default function Globe({
  nodes,
  selectedIndex,
  onSelect,
  reducedMotion,
  active,
}: GlobeProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Mutable render state kept in refs so the RAF loop never triggers re-renders.
  const rot = useRef<Rotation>({ yaw: -0.5, pitch: 0.32 });
  const tween = useRef<Tween | null>(null);
  const dragging = useRef(false);
  const pointerMoved = useRef(0);
  const last = useRef({ x: 0, y: 0 });
  const lastInteract = useRef(0);
  const entryStart = useRef<number | null>(null);
  const sizeRef = useRef({ w: 0, h: 0, cx: 0, cy: 0, r: 0, dpr: 1 });
  const onSelectRef = useRef(onSelect);
  const reducedRef = useRef(reducedMotion);
  const activeRef = useRef(active);
  const selectedRef = useRef(selectedIndex);

  // Flat typed land arrays for fast per-frame projection.
  const landRef = useRef<{ lat: Float32Array; lon: Float32Array }>({
    lat: new Float32Array(0),
    lon: new Float32Array(0),
  });

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);
  useEffect(() => {
    reducedRef.current = reducedMotion;
  }, [reducedMotion]);
  useEffect(() => {
    selectedRef.current = selectedIndex;
  }, [selectedIndex]);

  useEffect(() => {
    activeRef.current = active;
    if (active && entryStart.current === null) {
      entryStart.current = performance.now();
      lastInteract.current = performance.now();
    }
  }, [active]);

  // Build flat land arrays once.
  useEffect(() => {
    const lat = new Float32Array(LAND.length);
    const lon = new Float32Array(LAND.length);
    for (let i = 0; i < LAND.length; i++) {
      lat[i] = LAND[i][0];
      lon[i] = LAND[i][1];
    }
    landRef.current = { lat, lon };
  }, []);

  // Tween to face the selected node.
  useEffect(() => {
    if (selectedIndex == null) return;
    const node = nodes.find((n) => n.index === selectedIndex);
    if (!node) return;
    const target = rotationFacing(node.lat, node.lon);
    const cur = rot.current;
    target.yaw = cur.yaw + shortestAngle(cur.yaw, target.yaw);
    // Keep within the same pitch range the drag interaction allows so the
    // first post-tween drag doesn't snap.
    target.pitch = Math.max(-1.2, Math.min(1.2, target.pitch));
    if (reducedRef.current) {
      rot.current = target;
      return;
    }
    tween.current = {
      fromYaw: cur.yaw,
      fromPitch: cur.pitch,
      toYaw: target.yaw,
      toPitch: target.pitch,
      start: performance.now(),
      dur: 1100,
    };
  }, [selectedIndex, nodes]);

  // Main render loop + interaction wiring.
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      // Globe sits a touch right of center on wide screens (hero text is left).
      const wide = w >= 980;
      const cx = wide ? w * 0.66 : w * 0.5;
      const cy = wide ? h * 0.52 : h * 0.42;
      const r = Math.min(w, h) * (wide ? 0.4 : 0.42);
      sizeRef.current = { w, h, cx, cy, r, dpr };
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const nodeScreen = (n: PraxisNode) => {
      const { cx, cy, r } = sizeRef.current;
      const p = project(n.lat, n.lon, rot.current);
      return { x: cx + r * p.x, y: cy - r * p.y, z: p.z };
    };

    // ---- pointer interaction ----
    const onDown = (e: PointerEvent) => {
      dragging.current = true;
      pointerMoved.current = 0;
      last.current = { x: e.clientX, y: e.clientY };
      lastInteract.current = performance.now();
      tween.current = null;
      canvas.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - last.current.x;
      const dy = e.clientY - last.current.y;
      pointerMoved.current += Math.abs(dx) + Math.abs(dy);
      last.current = { x: e.clientX, y: e.clientY };
      const k = 0.005;
      rot.current.yaw += dx * k;
      rot.current.pitch = Math.max(
        -1.2,
        Math.min(1.2, rot.current.pitch + dy * k)
      );
      lastInteract.current = performance.now();
    };
    const onCancel = (e: PointerEvent) => {
      dragging.current = false;
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {}
    };
    const onUp = (e: PointerEvent) => {
      const wasDragging = dragging.current;
      dragging.current = false;
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {}
      if (!wasDragging) return;
      lastInteract.current = performance.now();
      if (pointerMoved.current > 6) return; // it was a drag, not a click
      // hit-test near-side nodes
      const rect = canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      let best: { idx: number; d: number } | null = null;
      for (const n of nodes) {
        const s = nodeScreen(n);
        if (s.z <= 0) continue;
        const d = Math.hypot(s.x - px, s.y - py);
        if (d < 22 && (!best || d < best.d)) best = { idx: n.index, d };
      }
      if (best) onSelectRef.current(best.idx);
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onCancel);

    let raf = 0;
    let prev = performance.now();

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      const { w, h, cx, cy, r, dpr } = sizeRef.current;
      const reduced = reducedRef.current;

      // ---- update rotation ----
      if (tween.current) {
        const tw = tween.current;
        const t = Math.min(1, (now - tw.start) / tw.dur);
        const e = easeInOut(t);
        rot.current.yaw = tw.fromYaw + (tw.toYaw - tw.fromYaw) * e;
        rot.current.pitch = tw.fromPitch + (tw.toPitch - tw.fromPitch) * e;
        if (t >= 1) tween.current = null;
      } else if (
        !dragging.current &&
        !reduced &&
        activeRef.current &&
        now - lastInteract.current > IDLE_RESUME_MS
      ) {
        rot.current.yaw += AUTO_SPEED * dt;
      }

      // ---- entry alpha ----
      let entry = 1;
      if (!reduced && entryStart.current != null) {
        entry = Math.min(1, (now - entryStart.current) / 1000);
      } else if (!reduced && entryStart.current == null) {
        entry = 0;
      }
      const entryEase = easeInOut(entry);

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      // ---- sphere body: faint disc + rim so the globe reads as a solid ----
      const grad = ctx.createRadialGradient(
        cx - r * 0.3,
        cy - r * 0.3,
        r * 0.1,
        cx,
        cy,
        r * 1.05
      );
      grad.addColorStop(0, "rgba(20,28,46,0.55)");
      grad.addColorStop(1, "rgba(8,12,22,0.0)");
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.02, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.globalAlpha = entryEase;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(120,140,175,0.10)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // ---- land points ----
      const { lat, lon } = landRef.current;
      const yaw = rot.current.yaw;
      const pitch = rot.current.pitch;
      const cp = Math.cos(pitch);
      const sp = Math.sin(pitch);
      const ptSize = Math.max(1, r * 0.0095);
      for (let i = 0; i < lat.length; i++) {
        const phi = lat[i] * DEG2RAD;
        const lambda = lon[i] * DEG2RAD + yaw;
        const cosPhi = Math.cos(phi);
        const x0 = cosPhi * Math.sin(lambda);
        const y0 = Math.sin(phi);
        const z0 = cosPhi * Math.cos(lambda);
        const z1 = y0 * sp + z0 * cp;
        if (z1 <= 0.01) continue; // near side only
        const y1 = y0 * cp - z0 * sp;
        const sx = cx + r * x0;
        const sy = cy - r * y1;
        // depth shading -> terminator
        const a = (0.12 + z1 * 0.62) * entryEase;
        const lit = 120 + z1 * 60;
        ctx.fillStyle = `rgba(${Math.round(120 + z1 * 40)},${Math.round(
          140 + z1 * 30
        )},${Math.round(lit + 35)},${a})`;
        ctx.fillRect(sx - ptSize / 2, sy - ptSize / 2, ptSize, ptSize);
      }

      // ---- operating nodes (amber) ----
      const selIdx = selectedRef.current;
      for (const n of nodes) {
        const p = project(n.lat, n.lon, rot.current);
        if (p.z <= 0.02) continue; // near side only
        const sx = cx + r * p.x;
        const sy = cy - r * p.y;
        const selected = n.index === selIdx;
        const depth = 0.4 + p.z * 0.6;
        const pulse = reduced
          ? 0.5
          : 0.5 + 0.5 * Math.sin(now / 620 + n.index);
        const baseA = depth * entryEase;

        // soft radial glow
        const glowR = (selected ? 34 : 24) + pulse * 8;
        const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, glowR);
        g.addColorStop(0, `rgba(255,138,43,${0.5 * baseA})`);
        g.addColorStop(0.4, `rgba(255,138,43,${0.18 * baseA})`);
        g.addColorStop(1, "rgba(255,138,43,0)");
        ctx.beginPath();
        ctx.fillStyle = g;
        ctx.arc(sx, sy, glowR, 0, Math.PI * 2);
        ctx.fill();

        // expanding pulse ring
        if (!reduced) {
          const pr = 6 + pulse * (selected ? 20 : 14);
          ctx.beginPath();
          ctx.arc(sx, sy, pr, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255,210,122,${(1 - pulse) * 0.5 * baseA})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // thin ring (amber token: #ff8a2b)
        ctx.beginPath();
        ctx.arc(sx, sy, selected ? 9 : 6.5, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,138,43,${0.9 * baseA})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // bright core
        ctx.beginPath();
        ctx.arc(sx, sy, selected ? 3.4 : 2.6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,210,122,${Math.min(1, baseA + 0.15)})`;
        ctx.fill();
      }

      ctx.restore();
      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onCancel);
    };
  }, [nodes]);

  return (
    <div ref={wrapRef} className="absolute inset-0 h-full w-full">
      <canvas
        ref={canvasRef}
        className="h-full w-full touch-pan-y select-none"
        aria-hidden="true"
      />
      {/* Keyboard-reachable, screen-reader accessible node controls. */}
      <div className="sr-focusable-group">
        <p className="sr-only" id="globe-desc">
          Interactive globe showing Praxis operating locations. Select a market
          to open its details.
        </p>
        {nodes.map((n) => (
          <button
            key={n.index}
            type="button"
            className="sr-focusable"
            onClick={() => onSelect(n.index)}
            aria-describedby="globe-desc"
          >
            {`Open ${n.n} — ${n.region}, ${n.continent}, status ${n.status}`}
          </button>
        ))}
      </div>
    </div>
  );
}
