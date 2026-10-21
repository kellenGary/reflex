/** Smooth cubic path through points, with horizontal control handles. */
export function smoothPath(points: [number, number][]): string {
  if (points.length === 0) return '';
  let d = `M${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const dx = (x1 - x0) / 2;
    d += ` C${(x0 + dx).toFixed(1)} ${y0.toFixed(1)} ${(x1 - dx).toFixed(1)} ${y1.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  }
  return d;
}
