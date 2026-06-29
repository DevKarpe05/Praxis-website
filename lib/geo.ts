// Pure geometry helpers for the canvas-2D globe: orthographic projection of a
// rotating unit sphere. No DOM, no canvas — easy to reason about and test.

export const DEG2RAD = Math.PI / 180;

export interface Rotation {
  /** Yaw in radians — spins the globe about the polar axis. */
  yaw: number;
  /** Pitch in radians — tilts the globe toward/away from the viewer. */
  pitch: number;
}

export interface Projected {
  /** Screen-space x relative to globe center (range roughly [-R, R]). */
  x: number;
  /** Screen-space y relative to globe center (y-up). */
  y: number;
  /** Depth along view axis: z > 0 is the near (visible) hemisphere. */
  z: number;
}

/**
 * Project a geographic [lat, lon] point onto a rotated unit sphere using an
 * orthographic camera looking down -Z. Returns unit-sphere coordinates; scale
 * x/y by the globe radius for pixels.
 */
export function project(
  latDeg: number,
  lonDeg: number,
  rot: Rotation
): Projected {
  const phi = latDeg * DEG2RAD;
  const lambda = lonDeg * DEG2RAD + rot.yaw;

  const cosPhi = Math.cos(phi);
  const x0 = cosPhi * Math.sin(lambda);
  const y0 = Math.sin(phi);
  const z0 = cosPhi * Math.cos(lambda);

  const cp = Math.cos(rot.pitch);
  const sp = Math.sin(rot.pitch);

  const y1 = y0 * cp - z0 * sp;
  const z1 = y0 * sp + z0 * cp;

  return { x: x0, y: y1, z: z1 };
}

/**
 * Rotation that brings the given [lat, lon] to face the viewer dead-center
 * (projects to x=0, y=0, z=1).
 */
export function rotationFacing(latDeg: number, lonDeg: number): Rotation {
  return {
    yaw: -lonDeg * DEG2RAD,
    pitch: latDeg * DEG2RAD,
  };
}

/** Shortest signed angular distance from a to b (radians), wrapped to [-PI, PI]. */
export function shortestAngle(a: number, b: number): number {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/** Ease in-out cubic. */
export function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
