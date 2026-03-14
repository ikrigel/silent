/**
 * Sinusoidal darkness factor based on current time.
 * darkness = 0 at noon (lightest), 1 at midnight (darkest).
 */
export function getSmoothDarknessFactor(date = new Date()): number {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  const t = hours + minutes / 60 + seconds / 3600; // fractional hour 0–24

  // Cosine wave: 0 at noon (t=12), 1 at midnight (t=0/24)
  const angle = (2 * Math.PI * (t - 12)) / 24;
  const darkness = (1 - Math.cos(angle)) / 2;

  return Math.min(1, Math.max(0, darkness));
}

/** Linear interpolation between two numbers */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Interpolate between two hex colors.
 * @param light - Hex color string for lightest state (e.g. "#FFFFFF")
 * @param dark - Hex color string for darkest state (e.g. "#000011")
 * @param t - Interpolation factor 0..1 (0 = light, 1 = dark)
 */
export function lerpColor(light: string, dark: string, t: number): string {
  const parse = (c: string) => {
    const m = c.match(/^#?([0-9a-f]{6})$/i);
    if (!m) throw new Error('Expected #rrggbb');
    const n = parseInt(m[1], 16);
    return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
  };

  const l = parse(light);
  const d = parse(dark);

  const r = Math.round(lerp(l.r, d.r, t));
  const g = Math.round(lerp(l.g, d.g, t));
  const b = Math.round(lerp(l.b, d.b, t));

  return `#${((1 << 24) + (r << 16) + (g << 8) + b)
    .toString(16)
    .slice(1)
    .toUpperCase()}`;
}
