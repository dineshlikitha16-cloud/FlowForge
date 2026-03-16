/* ===================================================
   Shared utility helpers
   =================================================== */

/** Generate a unique ID */
let counter = 0;
export const generateId = (prefix = 'id'): string =>
  `${prefix}_${++counter}_${Date.now().toString(36)}`;

/** Clamp a value between min and max */
export const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

/* ===================================================
   SVG edge path calculation (cubic bezier)
   =================================================== */
export interface PortPosition {
  x: number;
  y: number;
}

/**
 * Calculate a smooth cubic bezier path between two ports.
 * The curve flows left→right with adaptive curvature.
 */
export const getEdgePath = (
  source: PortPosition,
  target: PortPosition
): string => {
  const dx = Math.abs(target.x - source.x);
  const curvature = Math.min(dx * 0.5, 120);

  const c1x = source.x + curvature;
  const c1y = source.y;
  const c2x = target.x - curvature;
  const c2y = target.y;

  return `M ${source.x} ${source.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${target.x} ${target.y}`;
};

/**
 * Calculate the midpoint of a cubic bezier (for edge labels, delete buttons).
 */
export const getEdgeMidpoint = (
  source: PortPosition,
  target: PortPosition
): PortPosition => ({
  x: (source.x + target.x) / 2,
  y: (source.y + target.y) / 2,
});
