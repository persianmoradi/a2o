import { bx, flag, gate, merge, paint, put, show, strut } from './gfx'
import type { Ctx } from './ctx'
import { FRAME, W, win } from './timeline'
import { COLX, COLZ } from './substructure'

const S0 = 0.15 // finished floor level (ground slab top)
const STOREY = 3

type Piece = { x: number; z: number; w: number; d: number; y: number; h: number }

/** Frame, facade, roof, canopy, scaffold. Every transform is f(p). */
export function buildBuilding(c: Ctx) {
  const { M } = c

  /* ---- frame: columns 24, beams 30, floor/roof slabs 3 = 3 draws ---- */
  const columns = c.inst(bx(0.4, 1, 0.4, 0, 0.5, 0), M.concrete, 24, { cast: true, recv: true })
  const beams = c.inst(bx(1, 1, 1, 0, 0.5, 0), M.concrete, 30, { cast: true })
  const slabs = c.inst(bx(10, 1, 6, 0, 0.5, 0), M.concrete, 3, { cast: true, recv: true })
  const gF = FRAME.map((f) => gate(f.col[0], f.slab[1]))
  const frameU = (p: number) => {
    for (let s = 0; s < 3; s++) {
      if (!gF[s](p)) continue
      const f = FRAME[s]
      const ce = win(f.col[0], f.col[1], p), se = win(f.slab[0], f.slab[1], p), be = win(f.slab[0] + 0.005, f.slab[1], p)
      const base = S0 + STOREY * s
      let ci = s * 8
      for (const x of COLX) for (const z of COLZ) put(columns, ci++, x, base, z, 1, 2.71 * ce, 1)
      let bi = s * 10
      const by = base + STOREY - 0.3 - 0.01 - 0.45 // beam top = slab underside - 0.01
      for (let a = 0; a < 3; a++) for (const z of COLZ) put(beams, bi++, (COLX[a] + COLX[a + 1]) / 2, by, z, (COLX[a + 1] - COLX[a] - 0.4) * be, 0.45, 0.3 * be)
      for (const x of COLX) put(beams, bi++, x, by, 0, 0.3 * be, 0.45, (COLZ[1] - COLZ[0] - 0.4) * be)
      put(slabs, s, 0, base + STOREY - 0.3, 0, 1, 0.3 * se, 1)
    }
    flag(columns); flag(beams); flag(slabs)
    show(columns, p >= FRAME[0].col[0]); show(beams, p >= FRAME[0].slab[0]); show(slabs, p >= FRAME[0].slab[0])
  }

  /* ---- facade: panel / glass / frame instanced ---- */
  const panelP: Piece[][] = [[], [], []], glassP: Piece[][] = [[], [], []], frameP: Piece[][] = [[], [], []]
  for (let s = 0; s < 3; s++) {
    const bays: { x: number; z: number; w: number; d: number; glass: boolean }[] = []
    ;[-3.75, -1.25, 1.25, 3.75].forEach((x, k) => bays.push({ x, z: 3.1, w: 2.5, d: 0.12, glass: k === 1 || k === 2 }))
    ;[-3.75, -1.25, 1.25, 3.75].forEach((x) => bays.push({ x, z: -3.1, w: 2.5, d: 0.12, glass: false }))
    ;[-1.5, 1.5].forEach((z, k) => bays.push({ x: 5.1, z, w: 0.12, d: 3, glass: k === 0 }))
    ;[-1.5, 1.5].forEach((z) => bays.push({ x: -5.1, z, w: 0.12, d: 3, glass: false }))
    for (const b of bays) {
      panelP[s].push({ ...b, y: 0, h: 0.9 }, { ...b, y: 2.72, h: 0.28 }) // 0.04 reveal under the spandrel = dark joint at the floor slab line
      if (b.glass) {
        const gw = b.w > b.d ? b.w - 0.06 : 0.08, gd = b.w > b.d ? 0.08 : b.d - 0.06
        const side = b.z === 3.1 ? 3.1 - 0.01 : b.x === 5.1 ? 0 : 0
        glassP[s].push({ x: b.w > b.d ? b.x : b.x - 0.01, z: b.w > b.d ? side : b.z, w: gw, d: gd, y: 0.9, h: 1.8 })
        if (!(s === 0 && b.z === 3.1)) frameP[s].push({ x: b.x + (b.w > b.d ? 0 : 0.11), z: b.z + (b.w > b.d ? 0.11 : 0), w: b.w > b.d ? b.w : 0.05, d: b.w > b.d ? 0.05 : b.d, y: 1.85, h: 0.05 })
      } else panelP[s].push({ ...b, y: 0.9, h: 1.78 })
    }
    for (const [x, z] of [[5.1, 3.1], [-5.1, 3.1], [5.1, -3.1], [-5.1, -3.1]]) panelP[s].push({ x, z, w: 0.12, d: 0.12, y: 0, h: 3 })
    // only mullions that bound a glass bay: front bays 1-2 (x -2.5, 0, 2.5; none at the door) and the right-end glass bay (z 0). Corners are solid posts.
    for (const x of [-2.5, 0, 2.5]) if (!(s === 0 && x === 0)) frameP[s].push({ x, z: 3.2, w: 0.06, d: 0.1, y: 0.9, h: 1.8 })
    frameP[s].push({ x: 5.2, z: 0, w: 0.1, d: 0.06, y: 0.9, h: 1.8 })
  }
  const cnt = (a: Piece[][]) => a.reduce((n, l) => n + l.length, 0)
  const off = (a: Piece[][], s: number) => a.slice(0, s).reduce((n, l) => n + l.length, 0)
  const panelM = c.inst(bx(1, 1, 1, 0, 0.5, 0), M.panel, cnt(panelP), { cast: true, recv: true })
  const glassM = c.inst(bx(1, 1, 1, 0, 0.5, 0), M.glass, cnt(glassP), { cast: true })
  const frameM = c.inst(bx(1, 1, 1, 0, 0.5, 0), M.galvDark, cnt(frameP))
  const gFa = FRAME.map((f) => gate(f.facade[0], f.facade[1]))
  const facadeU = (p: number) => {
    for (let s = 0; s < 3; s++) {
      if (!gFa[s](p)) continue
      const e = win(FRAME[s].facade[0], FRAME[s].facade[1], p)
      const y0 = S0 + STOREY * s
      let i = off(panelP, s)
      for (const q of panelP[s]) put(panelM, i++, q.x, y0 + q.y * e, q.z, q.w, q.h * e, q.d)
      i = off(glassP, s)
      for (const q of glassP[s]) put(glassM, i++, q.x, y0 + q.y * e, q.z, q.w, q.h * e, q.d)
      i = off(frameP, s)
      for (const q of frameP[s]) put(frameM, i++, q.x, y0 + q.y * e, q.z, q.w, q.h * e, q.d)
    }
    flag(panelM); flag(glassM); flag(frameM)
    const any = p >= FRAME[0].facade[0]
    show(panelM, any); show(glassM, any); show(frameM, any)
  }

  /* ---- roof ---- */
  const membrane = c.mesh(bx(9.5, 0.02, 5.5, 0, 0.01, 0), M.membrane, { recv: true })
  membrane.position.y = 9.15
  const parapet = c.mesh(merge([
    bx(10.4, 0.85, 0.2, 0, 0.425, 3.1), bx(10.4, 0.85, 0.2, 0, 0.425, -3.1), bx(0.2, 0.85, 6.0, 5.1, 0.425, 0), bx(0.2, 0.85, 6.0, -5.1, 0.425, 0),
    bx(10.5, 0.05, 0.28, 0, 0.875, 3.1), bx(10.5, 0.05, 0.28, 0, 0.875, -3.1), bx(0.28, 0.05, 6.1, 5.1, 0.875, 0), bx(0.28, 0.05, 6.1, -5.1, 0.875, 0),
  ]), M.panel, { cast: true, recv: true })
  parapet.position.y = 9.15
  const units = c.mesh(merge([
    ...[-2.2, 2.0].flatMap((x) => [
      paint(bx(2.0, 1.0, 1.2, x, 0.5, -0.4), '#D9D5CC'), paint(bx(1.8, 0.7, 0.02, x, 0.5, 0.21), '#1F2F47'), paint(bx(2.04, 0.06, 1.24, x, 1.03, -0.4), '#B7B1A5'),
    ]),
    paint(bx(1.6, 0.35, 1.0, 3.3, 0.175, 1.6), '#D9D5CC'),
  ]), M.craneVc, { cast: true })
  units.position.y = 9.17
  const skylight = c.mesh(bx(1.6, 0.25, 1.0, 0, 0.125, 0), M.glass, { cast: false })
  skylight.position.set(-2.2, 9.17, 1.6)
  const fascia = c.mesh(merge([paint(bx(1, 0.25, 0.04, 0.5, 0, 0), '#0B264E'), paint(bx(1, 0.045, 0.055, 0.5, -0.1, 0.005), '#FF761E')]), M.fascia)
  fascia.position.set(-5, 8.675, 3.27)
  const fasciaR = c.mesh(merge([paint(bx(0.04, 0.25, 1, 0, 0, -0.5), '#0B264E'), paint(bx(0.055, 0.045, 1, 0.005, -0.1, -0.5), '#FF761E')]), M.fascia) // returns along the right side face
  fasciaR.position.set(5.27, 8.675, 3.29)
  const gRoof = gate(W.roof[0], W.fascia[1])
  const roofU = (p: number) => {
    show(units, p >= W.roof[0]); show(parapet, p >= W.roof[0]); show(membrane, p >= W.roof[0]); show(skylight, p >= W.roof[0]); show(fascia, p >= W.fascia[0]); show(fasciaR, p >= W.fascia[0])
    if (!gRoof(p)) return
    const re = win(W.roof[0], W.roof[1], p)
    const k = Math.max(re, 1e-6)
    membrane.scale.set(k, 1, k)
    parapet.scale.set(1, k, 1)
    units.scale.setScalar(k); skylight.scale.setScalar(k)
    const fe = win(W.fascia[0], W.fascia[1], p)
    fascia.scale.set(Math.max(10.29 * Math.min(1, fe * 2), 1e-6), 1, 1)
    fasciaR.scale.set(1, 1, Math.max(6.58 * Math.max(0, fe * 2 - 1), 1e-6))
  }

  /* ---- canopy + door ---- */
  const canopy = c.mesh(bx(3, 0.12, 1, 0, 0, 0.5), M.concrete, { cast: true })
  canopy.position.set(0, 2.8, 3.16)
  const door = c.mesh(bx(1.8, 2.3, 0.06, 0, 1.15, 0), M.glass)
  door.position.set(0, S0, 3.19)
  const doorFrame = c.mesh(merge([bx(0.08, 2.4, 0.08, -0.94, 1.2, 0), bx(0.08, 2.4, 0.08, 0.94, 1.2, 0), bx(1.96, 0.08, 0.08, 0, 2.36, 0), bx(0.05, 2.3, 0.08, 0, 1.15, 0)]), M.galvDark)
  doorFrame.position.set(0, S0, 3.2)
  const gCan = gate(W.canopy[0], W.canopy[1])
  const canopyU = (p: number) => {
    show(canopy, p >= W.canopy[0]); show(door, p >= W.canopy[0]); show(doorFrame, p >= W.canopy[0])
    if (!gCan(p)) return
    const e = Math.max(win(W.canopy[0], W.canopy[1], p), 1e-6)
    canopy.scale.set(1, e, e); door.scale.set(e, e, e); doorFrame.scale.set(e, e, e)
  }

  /* ---- scaffold: 5 lifts x (front 4 bays, back 4, right 2) ---- */
  const barG = merge([
    bx(2.5, 0.06, 0.06, 0, -0.03, -0.35), bx(2.5, 0.06, 0.06, 0, -0.03, 0.35),
    bx(2.5, 0.04, 0.04, 0, 0.5, 0.35), bx(2.5, 0.04, 0.04, 0, 1.0, 0.35),
    strut(-1.25, 0, 0.35, 1.25, 2.0, 0.35, 0.035),
  ])
  const standG = merge([bx(0.05, 2.0, 0.05, 0, 1, -0.35), bx(0.05, 2.0, 0.05, 0, 1, 0.35)])
  const deckG = bx(2.46, 0.04, 0.7, 0, 0.02, 0)
  const sides = [
    { n: 4, step: 2.5, sx: 1, pos: (i: number) => [-3.75 + 2.5 * i, 3.9] as const, sp: (i: number) => [-5 + 2.5 * i, 3.9] as const, ry: 0 },
    { n: 4, step: 2.5, sx: 1, pos: (i: number) => [-3.75 + 2.5 * i, -3.9] as const, sp: (i: number) => [-5 + 2.5 * i, -3.9] as const, ry: Math.PI },
    { n: 2, step: 3, sx: 1.2, pos: (i: number) => [5.9, -1.5 + 3 * i] as const, sp: (i: number) => [5.9, -3 + 3 * i] as const, ry: Math.PI / 2 },
  ]
  const nBay = sides.reduce((a, s) => a + s.n, 0) * 5
  const nStd = sides.reduce((a, s) => a + s.n + 1, 0) * 5
  const bars = c.inst(barG, M.galv, nBay), stands = c.inst(standG, M.galv, nStd), decks = c.inst(deckG, M.timber, nBay)
  const gSc = gate(W.scaffoldIn, W.scaffoldOut[1])
  const scaffU = (p: number) => {
    show(bars, p >= W.scaffoldIn && p < W.scaffoldOut[1]); show(stands, p >= W.scaffoldIn && p < W.scaffoldOut[1]); show(decks, p >= W.scaffoldIn && p < W.scaffoldOut[1])
    if (!gSc(p)) return
    let bi = 0, si = 0
    for (let k = 0; k < 5; k++) {
      const a = W.scaffoldIn + 0.022 * k, o = W.scaffoldOut[0] + (4 - k) * 0.004
      const e = win(a, a + 0.02, p) * (1 - win(o, o + 0.01, p))
      const y0 = 0.08 + 2 * k
      for (const s of sides) {
        for (let i = 0; i < s.n; i++) {
          const [x, z] = s.pos(i)
          put(bars, bi, x, y0 * 1, z, s.sx, e, 1, s.ry)
          put(decks, bi, x, y0, z, s.sx * e, 1, e, s.ry) // planks shrink in plan, so a lift that is not up yet leaves no timber lying on grade
          bi++
        }
        for (let i = 0; i <= s.n; i++) { const [x, z] = s.sp(i); put(stands, si++, x, y0, z, 1, e, 1, s.ry) }
      }
    }
    flag(bars); flag(stands); flag(decks)
  }

  function update(p: number) { frameU(p); facadeU(p); roofU(p); canopyU(p); scaffU(p) }
  return { update }
}
