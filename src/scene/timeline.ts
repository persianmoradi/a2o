/** Single source of truth for the build timeline. site.ts and the SVG fallback both read from here. */
export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
/** smoothstep over [a,b], clamped */
export const win = (a: number, b: number, p: number) => {
  const t = clamp01((p - a) / (b - a))
  return t * t * (3 - 2 * t)
}
/** linear clamp over [a,b] */
export const lin = (a: number, b: number, p: number) => clamp01((p - a) / (b - a))
export const easeOut = (t: number) => 1 - (1 - t) * (1 - t) * (1 - t)

/** [in, out] windows in p. Every scene element and the SVG fallback derive their state from these. */
export const W = {
  stakes: [0.10, 0.13], line: [0.10, 0.17], surveyor: [0.10, 0.125],
  excIn: [0.10, 0.125], excOut: [0.35, 0.365], excTrench: [0.21, 0.28],
  pit: [0.10, 0.20], spoil: [0.11, 0.20], trench: [0.20, 0.28], backfill: [0.45, 0.49],
  pipes: [0.28, 0.35], cages: [0.365, 0.385], cageCover: [0.405, 0.42], pads: [0.385, 0.40],
  gravel: [0.40, 0.415], formwork: [0.405, 0.42], formOut: [0.44, 0.45], slab: [0.43, 0.447],
  apron: [0.45, 0.50], kerb: [0.46, 0.52], compactor: [0.47, 0.52],
  crewIn: [0.37, 0.40], crewOut: [0.762, 0.79], dumperOut: [0.763, 0.79], cabinOut: [0.763, 0.79],
  craneIn: [0.62, 0.66], craneOut: [0.765, 0.797], // erection and teardown are exact mirrors (see machines.ts)
  scaffoldIn: 0.66, scaffoldOut: [0.765, 0.793],
  // finishing windows are compressed: the Aflevering headline is fully in view from p ~0.81-0.82, so the site is complete by 0.82
  roof: [0.782, 0.80], fascia: [0.787, 0.804], canopy: [0.793, 0.806],
  pavers: [0.785, 0.815], lawn: [0.795, 0.82], trees: [0.80, 0.82], planters: [0.808, 0.82],
} as const

/** frame per storey: [col a,b], [slab a,b]; facade [a,b] */
export const FRAME = [
  { col: [0.645, 0.665], slab: [0.66, 0.685], facade: [0.69, 0.725] },
  { col: [0.685, 0.703], slab: [0.70, 0.722], facade: [0.715, 0.745] },
  { col: [0.715, 0.735], slab: [0.73, 0.752], facade: [0.735, 0.762] },
] as const

/** Highest built element (m) as a function of p, used to keep the crane hook clear of the building. */
export const topY = (p: number) => {
  const s = (i: number) => win(FRAME[i].slab[0], FRAME[i].slab[1], p)
  return 0.15 + 3 * s(0) + 3 * s(1) + 3 * s(2) + 0.9 * win(W.roof[0], W.roof[1], p)
}

/** old p of the idle hero diorama: pit and trench open, spoil heap, excavator digging, first pipes laid */
export const HERO_P = 0.3
