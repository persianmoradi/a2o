import * as THREE from 'three'
import { bx, cyl, flag, gate, merge, noisy, put, show } from './gfx'
import type { Ctx } from './ctx'
import { easeOut, W, win } from './timeline'
import { TX } from './ground'

export const COLX = [-4.4, -1.47, 1.47, 4.4]
export const COLZ = [-2.4, 2.4]

/** Everything below grade and the ground-level works: survey, pipes, pads, gravel, slab, kerb, apron. */
export function buildSub(c: Ctx) {
  const { M } = c
  const staged = new THREE.Group() // survey items ride the board with the intro
  c.root.add(staged)

  /* ---- survey: grid (clipped around the excavation), stakes + tape, dashed footprint line ---- */
  const gp: number[] = []
  const inHole = (x: number, z: number) => (Math.abs(x) < 7.6 && Math.abs(z) < 5.6) || (x > TX - 1.2 && x < TX + 1.2)
  const seg = (x0: number, z0: number, x1: number, z1: number) => {
    const n = Math.round(Math.hypot(x1 - x0, z1 - z0) / 0.5)
    for (let i = 0; i < n; i++) {
      const a = i / n, b = (i + 1) / n
      const mx = x0 + (x1 - x0) * (a + b) / 2, mz = z0 + (z1 - z0) * (a + b) / 2
      if (!inHole(mx, mz)) gp.push(x0 + (x1 - x0) * a, 0.012, z0 + (z1 - z0) * a, x0 + (x1 - x0) * b, 0.012, z0 + (z1 - z0) * b)
    }
  }
  for (let x = -12; x <= 12; x += 2) seg(x, -8, x, 8)
  for (let z = -8; z <= 8; z += 2) seg(-12, z, 12, z)
  const mkLines = (pos: number[], color: string, opacity: number) => {
    const g = c.geo(new THREE.BufferGeometry())
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity })
    const l = new THREE.LineSegments(g, mat)
    l.frustumCulled = false
    staged.add(l)
    return { l, mat }
  }
  const grid = mkLines(gp, '#0B264E', 1)
  const dash: number[] = []
  {
    const X = 7.25, Z = 5.25
    const edge = (x0: number, z0: number, x1: number, z1: number) => {
      const len = Math.hypot(x1 - x0, z1 - z0), n = Math.floor(len / 0.85)
      for (let i = 0; i < n; i++) {
        const a = (i * 0.85) / len, b = (i * 0.85 + 0.5) / len
        dash.push(x0 + (x1 - x0) * a, 0.03, z0 + (z1 - z0) * a, x0 + (x1 - x0) * b, 0.03, z0 + (z1 - z0) * b)
      }
    }
    edge(-X, -Z, X, -Z); edge(X, -Z, X, Z); edge(X, Z, -X, Z); edge(-X, Z, -X, -Z)
  }
  const line = mkLines(dash, '#0B264E', 0.9)
  const stakePos: [number, number][] = [[-7.6, -5.6], [7.6, -5.6], [-7.6, 5.6], [7.6, 5.6], [-11, -7], [11, -7], [-11, 7], [11, 7], [0, -6.1], [0, 6.1]]
  const stakes = c.inst(bx(0.05, 0.9, 0.05, 0, 0.45, 0), M.timber, stakePos.length, { recv: true })
  staged.add(stakes)
  const tapeG = new THREE.Group()
  const tape = (() => {
    const X = 7.6, Z = 5.6, y = 0.78
    const pos = [-X, y, -Z, X, y, -Z, X, y, -Z, X, y, Z, X, y, Z, -X, y, Z, -X, y, Z, -X, y, -Z]
    const g = c.geo(new THREE.BufferGeometry())
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    const l = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: '#FF761E', transparent: true }))
    l.frustumCulled = false
    tapeG.add(l)
    return l
  })()
  staged.add(tapeG)
  const gSurvey = gate(0.10, 0.17)
  const survey = (p: number) => {
    if (!gSurvey(p)) return
    const sink = win(W.stakes[0], W.stakes[1], p)
    show(stakes, sink < 1); show(tapeG, sink < 1)
    tapeG.position.y = -0.9 * sink
    for (let i = 0; i < stakePos.length; i++) put(stakes, i, stakePos[i][0], -0.9 * sink, stakePos[i][1])
    flag(stakes)
    const lf = 1 - win(W.line[0], W.line[1], p)
    show(line.l, lf > 0.002); show(grid.l, lf > 0.002)
    line.mat.opacity = 0.9 * lf; grid.mat.opacity = 0.35 * lf
  }
  void tape

  /* ---- spoil heap (also the backfill) ---- */
  // low-frequency lumps (slumps, a shoulder, a dip) so the dome reads as dumped soil, then fine noise
  const dome = new THREE.IcosahedronGeometry(1, 3)
  {
    const q = dome.attributes.position
    for (let i = 0; i < q.count; i++) {
      const x = q.getX(i), y = q.getY(i), z = q.getZ(i)
      const k = 1 + 0.16 * Math.sin(3.1 * x + 1.7 * z + 0.4) + 0.12 * Math.sin(2.3 * z - 2.6 * x + 1.1) + 0.1 * Math.sin(4.2 * y + 2.1 * x)
      q.setXYZ(i, x * k, y * (0.9 + 0.25 * Math.sin(2.7 * x - 1.9 * z + 2.2)) * k, z * k)
    }
  }
  const spoil = c.mesh(noisy(dome.scale(1.55, 0.8, 1.35), 0.08, 9), M.soil, { recv: true })
  spoil.position.set(-3.8, 0, -6.4)
  const gSpoil = gate(W.spoil[0], W.backfill[1])
  const spoilU = (p: number) => {
    if (!gSpoil(p)) return
    const s = win(W.spoil[0], W.spoil[1], p) * (1 - win(W.backfill[0], W.backfill[1], p))
    show(spoil, s > 0.002); spoil.scale.setScalar(Math.max(s, 1e-6))
  }

  /* ---- row 1: sewer ---- */
  const pipeGeo = merge([cyl(0.25, 2, 0, 0, 0, 'z', 14), cyl(0.31, 0.2, 0, 0, 0.9, 'z', 14)])
  const MAIN: [number, number][] = [[-7.95, -6], [-6, -4], [-4, -2], [-2, -0.6], [0.6, 2.6], [2.6, 4.4], [5.6, 7.95]]
  const pipes = c.inst(pipeGeo, M.pipe, MAIN.length, { recv: true })
  const pvcGeo = merge([cyl(0.15, 2, 0, 0, 0, 'x', 12), cyl(0.19, 0.16, 0.92, 0, 0, 'x', 12)])
  const BX0 = TX + 0.6, BX1 = 4.0
  const pvc = c.inst(pvcGeo, M.pvc, 6, { recv: true })
  const ringGeo = merge([0, 1, 2].map((i) => cyl(0.6, 0.6, 0, 0.3 + 0.6 * i, 0, 'y', 20)).concat([1, 2].map((i) => cyl(0.64, 0.05, 0, 0.6 * i, 0, 'y', 20))))
  const rings = c.inst(ringGeo, M.ring, 2, { recv: true })
  const lids = c.inst(cyl(0.35, 0.04, 0, 0, 0, 'y', 20), M.lid, 2, { recv: true })
  const gPipes = gate(W.pipes[0] - 0.01, W.pipes[1] + 0.02)
  const pipesU = (p: number) => {
    if (!gPipes(p)) return
    const any = p > W.pipes[0] - 0.005
    show(pipes, any); show(pvc, any); show(rings, any)
    for (let i = 0; i < MAIN.length; i++) {
      const a = MAIN[i][0], b = MAIN[i][1]
      const e = easeOut(win(W.pipes[0] + i * 0.004, W.pipes[0] + i * 0.004 + 0.03, p))
      put(pipes, i, TX, -1.4 + 1.5 * (1 - e), (a + b) / 2, e, e, (b - a) / 2 * e)
    }
    const len = (BX1 - BX0) / 6
    for (let i = 0; i < 6; i++) {
      const e = easeOut(win(W.pipes[0] + 0.012 + i * 0.004, W.pipes[0] + 0.012 + i * 0.004 + 0.03, p))
      put(pvc, i, BX0 + len * (i + 0.5), -1.4 + 1.5 * (1 - e), 0, len / 2 * e, e, e)
    }
    const er = easeOut(win(W.pipes[0] + 0.004, W.pipes[0] + 0.04, p))
    for (let i = 0; i < 2; i++) put(rings, i, TX, -1.65 + 1.5 * (1 - er), i * 5, er, er, er)
    flag(pipes); flag(pvc); flag(rings)
  }
  // lids stay after the pipe window
  const gLid = gate(W.backfill[1], W.backfill[1] + 0.012)
  const lidU = (p: number) => {
    if (!gLid(p)) return
    const lidE = win(W.backfill[1], W.backfill[1] + 0.012, p)
    show(lids, lidE > 0)
    for (let i = 0; i < 2; i++) put(lids, i, TX, 0.17, i * 5, lidE, lidE, lidE)
    flag(lids)
  }

  /* ---- row 2: cages, pads, gravel, starter bars, rebar mat, formwork, slab ---- */
  const cageGeo = merge([-0.4, 0, 0.4].flatMap((o) => [cyl(0.01, 1.0, 0, -0.95, o, 'x', 6), cyl(0.01, 1.0, o, -0.92, 0, 'z', 6)]))
  const cages = c.inst(cageGeo, M.rebar, 8)
  const pads = c.inst(bx(1.2, 1, 1.2, 0, 0.5, 0), M.pad, 8, { cast: false, recv: true })
  const starters = c.inst(cyl(0.015, 0.95, 0, 0, 0, 'y', 6), M.rebar, 8)
  const gravel = c.inst(bx(11.9, 1, 7.9, 0, 0.5, 0), M.gravel, 1, { recv: true })
  const mat = (() => {
    const parts: THREE.BufferGeometry[] = []
    for (let z = -3; z <= 3.001; z += 0.5) parts.push(cyl(0.008, 9.8, 0, -0.07, z, 'x', 5))
    for (let x = -5; x <= 5.001; x += 0.5) parts.push(cyl(0.008, 5.8, x, -0.04, 0, 'z', 5))
    return c.mesh(merge(parts), M.rebar)
  })()
  const formGeo = bx(1, 0.3, 1)
  const form = c.inst(formGeo, M.timber, 4, { recv: true })
  const slab = c.inst(bx(10, 1, 6, 0, 0.5, 0), M.slab, 1, { cast: true, recv: true })
  const FORM: [number, number, number, number, number, number][] = [ // x, z, sx, sz, outx, outz
    [0, 3.045, 10.1, 0.05, 0, 1], [0, -3.045, 10.1, 0.05, 0, -1], [5.045, 0, 0.05, 6.1, 1, 0], [-5.045, 0, 0.05, 6.1, -1, 0],
  ]
  const gSub = gate(W.cages[0], W.formOut[1] + 0.01)
  const subU = (p: number) => {
    if (!gSub(p)) return
    const cageIn = (i: number) => easeOut(win(W.cages[0] + i * 0.0015, W.cages[0] + 0.01 + i * 0.001, p))
    let padE = 0
    let k = 0
    for (const x of COLX) for (const z of COLZ) {
      const ce = cageIn(k)
      put(cages, k, x, 0.6 * (1 - ce), z, ce, ce, ce)
      padE = win(W.pads[0] + k * 0.0012, W.pads[1] - 0.0014 + k * 0.0002, p)
      put(pads, k, x, -1.0, z, 1, Math.max(0.5 * padE, 0), 1)
      put(starters, k, x, -0.025, z, 1, padE, 1)
      k++
    }
    const padsDone = p >= W.pads[1]
    show(cages, p >= W.cages[0] && !padsDone && p < W.cageCover[1]); show(pads, p >= W.pads[0]); show(starters, p >= W.pads[0])
    flag(cages); flag(pads); flag(starters)
    const ge = win(W.gravel[0], W.gravel[1], p)
    show(gravel, ge > 0 && p < W.backfill[1] + 0.005)
    put(gravel, 0, 0, -1.0, 0, 1, 0.85 * ge, 1); flag(gravel)
    const fe = win(W.formwork[0], W.formwork[1], p), fo = win(W.formOut[0], W.formOut[1], p)
    show(form, fe > 0 && fo < 1)
    for (let i = 0; i < FORM.length; i++) { const f = FORM[i], s = Math.max(fe * (1 - fo), 0); put(form, i, f[0] + f[4] * 0.3 * fo, 0, f[1] + f[5] * 0.3 * fo, f[2] * s, s, f[3] * s) }
    flag(form)
    const se = win(W.slab[0], W.slab[1], p)
    show(slab, se > 0); put(slab, 0, 0, -0.15, 0, 1, 0.3 * se, 1); flag(slab)
    const me = win(W.formwork[0], W.formwork[1], p)
    show(mat, me > 0 && se < 0.98)
    mat.position.y = 0.6 * (1 - easeOut(me)); mat.scale.setScalar(Math.max(me, 1e-6))
  }

  /* ---- row 3: apron + kerb ring ---- */
  const apron = c.mesh(c.geo(new THREE.PlaneGeometry(16.5, 10.9).rotateX(-Math.PI / 2)), M.gravel, { recv: true })
  apron.position.y = 0.03
  const stones: { x: number; z: number; l: number; ry: number }[] = []
  {
    const run = (x0: number, z0: number, x1: number, z1: number, ry: number) => {
      const len = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(len))
      for (let i = 0; i < n; i++) { const t = (i + 0.5) / n; stones.push({ x: x0 + (x1 - x0) * t, z: z0 + (z1 - z0) * t, l: len / n - 0.03, ry }) }
    }
    const X = 8.4, Z = 5.6
    run(1.2, Z, X + 0.125, Z, 0)
    run(X, Z - 0.125, X, -Z + 0.125, Math.PI / 2)
    run(X + 0.125, -Z, -X - 0.125, -Z, 0)
    run(-X, -Z + 0.125, -X, Z - 0.125, Math.PI / 2)
    run(-X - 0.125, Z, -1.2, Z, 0)
  }
  const kerb = c.inst(bx(1, 0.15, 0.25, 0, 0.075, 0), M.kerb, stones.length, { recv: true })
  const gKerb = gate(W.apron[0], W.kerb[1])
  const kerbU = (p: number) => {
    show(apron, p > 0.485 && p < W.pavers[1])
    if (!gKerb(p)) return
    const ae = win(0.485, 0.505, p)
    apron.scale.x = Math.max(ae, 1e-6); apron.position.x = -8.25 * (1 - ae)
    const n = stones.length
    show(kerb, p >= W.kerb[0])
    for (let i = 0; i < n; i++) {
      const s = stones[i]
      const a = W.kerb[0] + (W.kerb[1] - W.kerb[0] - 0.012) * (i / n)
      const e = win(a, a + 0.012, p)
      put(kerb, i, s.x, 0, s.z, s.l * e, e, e, s.ry)
    }
    flag(kerb)
  }

  function update(p: number) { survey(p); spoilU(p); pipesU(p); lidU(p); subU(p); kerbU(p) }
  return { update, staged }
}
