export interface BrandColor {
  hex: string;
}

// Web-friendly palette — hand-picked from the Tailwind 500/600 range.
// Modern, accessible, render consistently across screens.
export const BRAND_PALETTE: BrandColor[] = [
  { hex: "#3B82F6" }, // blue
  { hex: "#6366F1" }, // indigo
  { hex: "#8B5CF6" }, // violet
  { hex: "#EC4899" }, // pink
  { hex: "#EF4444" }, // red
  { hex: "#F97316" }, // orange
  { hex: "#F59E0B" }, // amber
  { hex: "#84CC16" }, // lime
  { hex: "#10B981" }, // emerald
  { hex: "#14B8A6" }, // teal
  { hex: "#06B6D4" }, // cyan
  { hex: "#64748B" }, // slate
];

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function hexToRgb(hex: string): [number, number, number] {
  const m = hex.replace("#", "").match(/.{2}/g);
  if (!m || m.length !== 3) return [0, 0, 0];
  return [parseInt(m[0], 16), parseInt(m[1], 16), parseInt(m[2], 16)];
}

function rgbToHex(r: number, g: number, b: number): string {
  const to2 = (n: number) =>
    Math.round(Math.max(0, Math.min(255, n)))
      .toString(16)
      .padStart(2, "0");
  return `#${to2(r)}${to2(g)}${to2(b)}`.toUpperCase();
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      case bn:
        h = (rn - gn) / d + 4;
        break;
    }
    h /= 6;
  }
  return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) {
    const v = l * 255;
    return [v, v, v];
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue2rgb = (t: number): number => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [hue2rgb(h + 1 / 3) * 255, hue2rgb(h) * 255, hue2rgb(h - 1 / 3) * 255];
}

export function shadeHex(hex: string, lightnessDelta: number): string {
  const [r, g, b] = hexToRgb(hex);
  const [h, s, l] = rgbToHsl(r, g, b);
  const [nr, ng, nb] = hslToRgb(h, s, clamp01(l + lightnessDelta));
  return rgbToHex(nr, ng, nb);
}

export function getShades(hex: string): string[] {
  return [-0.3, -0.15, 0, 0.15, 0.3].map((d) => shadeHex(hex, d));
}
