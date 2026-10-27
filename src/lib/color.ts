/** Blend two #rrggbb colors; t=0 is `a`, t=1 is `b`. */
export function mix(a: string, b: string, t: number): string {
  const k = Math.max(0, Math.min(1, t));
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `#${pa.map((c, i) => Math.round(c + (pb[i] - c) * k).toString(16).padStart(2, '0')).join('')}`;
}
