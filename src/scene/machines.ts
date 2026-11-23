import * as THREE from 'three'
import { bx, cyl, flag, gate, merge, paint, put, show, strut } from './gfx'
import type { Ctx } from './ctx'
import { clamp01, easeOut, lin, topY, W, win } from './timeline'

const Z = 1e-6
/** worker spots (x, z, facing offset); shared with the row-4 highlight rings */
export const CREW_AT: [number, number, number][] = [[-10.6, 2.4, 0.2], [9.9, -7.2, -0.25], [-3, 6.9, -0.2], [4.4, -6.7, 0.3]]
// machine palette: orange bodywork (NAVY/ORG keep their old roles as body / accent), steel and track colours from the art direction
const OFFW = '#D6D3CB', NAVY = '#FF761E', GRAPH = '#1F2A3A', RUB = '#15191F', ORG = '#0B264E'

/** Excavator / dumper / crane / crew / site cabin / compactor. All pure functions of p (+ a tiny idle on the crane). */
export function buildMachines(c: Ctx) {
  const { M } = c
  const live = { excX: -13, excZ: 0, excS: 0, dumpS: 0, dumpZ: 10.5, craneS: 0, craneMoved: false }

  /* ================= excavator ================= */
  const exc = new THREE.Group()
  c.root.add(exc)
  const tracks = c.mesh(merge([
    ...[-0.62, 0.62].flatMap((z) => [paint(bx(2.4, 0.6, 0.55, 0, 0.3, z), GRAPH), paint(cyl(0.3, 0.55, -1.2, 0.3, z, 'z', 14), GRAPH), paint(cyl(0.3, 0.55, 1.2, 0.3, z, 'z', 14), GRAPH)]),
    paint(bx(2.2, 0.28, 1.3, 0, 0.5, 0), '#16233A'),
  ]), M.machine, { cast: true, recv: false, parent: exc })
  const house = new THREE.Group(); house.position.y = 0.64; exc.add(house)
  c.mesh(merge([
    paint(cyl(0.6, 0.1, 0, 0.05, 0, 'y', 16), GRAPH),
    paint(bx(2.1, 0.75, 1.6, -0.35, 0.475, 0), NAVY), paint(bx(2.12, 0.1, 1.62, -0.35, 0.64, 0), ORG), paint(bx(0.7, 0.8, 1.55, -1.45, 0.5, 0), '#1F2F47'),
    paint(bx(1.0, 0.1, 0.9, 0.55, 0.88, 0.42), '#31506F'), paint(bx(1.04, 0.07, 0.95, 0.55, 1.85, 0.42), NAVY),
    paint(cyl(0.07, 0.5, -1.0, 1.1, -0.5, 'y', 8), GRAPH),
  ]), M.machine, { cast: true, parent: house })
  c.mesh(bx(0.92, 0.92, 0.86, 0.55, 1.37, 0.42), M.glass, { parent: house })
  const boom = new THREE.Group(); boom.position.set(0.8, 0.55, -0.2); house.add(boom)
  const boomG = merge([
    paint(bx(1.85, 0.36, 0.3, 0.92, 0, 0), NAVY),
    paint(bx(1.3, 0.3, 0.28, 0, 0, 0).rotateZ(-0.38).translate(2.4, 0.05, 0), NAVY),
  ])
  c.mesh(boomG, M.machine, { cast: true, parent: boom })
  const stick = new THREE.Group(); stick.position.set(3.0, -0.2, 0); boom.add(stick)
  c.mesh(merge([paint(bx(1.7, 0.24, 0.22, 0.8, 0, 0), NAVY), paint(strut(0.4, 0.25, 0, 1.2, 0.3, 0, 0.1), GRAPH)]), M.machine, { cast: true, parent: stick })
  const bucket = new THREE.Group(); bucket.position.set(1.65, 0, 0); stick.add(bucket)
  c.mesh(merge([
    paint(bx(0.07, 0.55, 0.7, 0.03, -0.28, 0), '#1F2F47'), paint(bx(0.62, 0.07, 0.7, 0.3, -0.56, 0), '#1F2F47'),
    paint(bx(0.62, 0.5, 0.05, 0.3, -0.3, 0.33), '#1F2F47'), paint(bx(0.62, 0.5, 0.05, 0.3, -0.3, -0.33), '#1F2F47'),
    ...[-0.27, -0.09, 0.09, 0.27].map((z) => paint(bx(0.14, 0.07, 0.09, 0.66, -0.57, z), '#16233A')),
  ]), M.machine, { cast: true, parent: bucket })
  const excU = (p: number) => {
    const vis = p >= W.excIn[0] && p < W.excOut[1]
    show(exc, vis)
    if (!vis) { live.excS = 0; return }
    const inn = win(W.excIn[0], W.excIn[1], p), out = win(W.excOut[0], W.excOut[1], p)
    const s = Math.max(clamp01(inn * 3) * (1 - clamp01((out - 0.8) * 5)), Z)
    live.excS = s
    // rest x = -11.1 keeps the 1.8 m wide tracks clear of the sewer trench lip (x = -10.2)
    live.excX = -13.4 + 2.3 * easeOut(inn) + 1.6 * easeOut(inn) * (1 - win(0.17, 0.19, p)) // pit phase works from x = -9.5, backs out to -11.1 before the trench opens
    live.excZ = 4.5 * win(0.19, 0.21, p) - 6 * win(W.excTrench[0], W.excTrench[1], p) - 6 * out
    exc.position.set(live.excX, 0, live.excZ)
    exc.scale.setScalar(s)
    tracks.rotation.y = (Math.PI / 2) * win(0.115, 0.127, p) // along x while driving in, along z at rest
    const dig = win(0.125, 0.14, p) * (1 - win(0.34, 0.35, p))
    const sw = 2 * Math.PI * ((p * 45) % 1) // dig cycle is scroll-driven, never time-driven
    house.rotation.y = dig * 0.5 * Math.sin(sw + 0.6)
    const tr = win(0.19, 0.21, p) // trench stage: the trench is 2 m away, so the arm works close in
    boom.rotation.z = 0.75 + dig * (0.5 + 0.15 * Math.sin(sw) + 0.3 * tr - 0.75)
    stick.rotation.z = -2.1 + dig * (-1.3 - 0.6 * tr + 0.45 * Math.cos(sw) + 2.1)
    bucket.rotation.z = 0.5 + dig * (-0.2 + 0.8 * Math.sin(sw - 1) - 0.5)
  }

  /* ================= dumper ================= */
  const dumper = new THREE.Group(); c.root.add(dumper)
  c.mesh(merge([
    ...[-0.78, 0.78].flatMap((x) => [-0.95, 0.95].map((z) => paint(cyl(0.42, 0.4, x, 0.42, z, 'x', 14), RUB))),
    paint(bx(1.2, 0.3, 3.0, 0, 0.55, 0), GRAPH), paint(bx(1.3, 0.75, 1.0, 0, 1.05, 1.0), NAVY), paint(bx(1.32, 0.09, 1.02, 0, 1.3, 1.0), ORG), paint(bx(1.0, 0.1, 0.9, 0, 1.55, 0.55), '#31506F'),
    paint(bx(1.5, 0.12, 1.7, 0, 0.75, -0.8), GRAPH), paint(bx(1.5, 0.55, 0.08, 0.0, 1.05, -1.62), NAVY), paint(bx(0.08, 0.5, 1.6, -0.75, 1.0, -0.8), NAVY), paint(bx(0.08, 0.5, 1.6, 0.75, 1.0, -0.8), NAVY),
    paint(bx(1.5, 0.5, 0.08, 0, 1.0, -0.0), NAVY), paint(bx(0.06, 0.9, 0.06, -0.55, 1.95, 0.3), GRAPH), paint(bx(0.06, 0.9, 0.06, 0.55, 1.95, 0.3), GRAPH), paint(bx(1.2, 0.06, 0.9, 0, 2.4, 0.5), GRAPH),
  ]), M.machineD, { cast: true, parent: dumper })
  const beaconD = c.mesh(new THREE.SphereGeometry(0.1, 10, 8).translate(0, 2.5, 0.5), M.beacon, { parent: dumper })
  void beaconD
  const gDump = gate(W.crewIn[0], W.dumperOut[1])
  const dumpU = (p: number) => {
    const vis = p >= W.crewIn[0] && p < W.dumperOut[1]
    show(dumper, vis)
    if (!vis) { live.dumpS = 0; return }
    if (!gDump(p)) return
    const inn = easeOut(win(W.crewIn[0], W.crewIn[1], p)), out = win(W.dumperOut[0], W.dumperOut[1], p)
    const e = (1 - out) * clamp01(inn * 2.5)
    live.dumpS = e
    live.dumpZ = 4.9 + 5.6 * (1 - inn) + 5.6 * out
    dumper.position.set(9.9, 0.03, live.dumpZ)
    dumper.rotation.y = Math.PI
    dumper.scale.setScalar(Math.max(e, Z))
  }

  /* ================= site cabin ================= */
  const cabin = c.mesh(merge([
    paint(bx(2.2, 2.4, 6, 0, 1.4, 0), OFFW), paint(bx(2.4, 0.08, 6.2, 0, 2.64, 0), '#B7B1A5'), paint(bx(0.25, 0.2, 6, -0.8, 0.1, 0), GRAPH), paint(bx(0.25, 0.2, 6, 0.8, 0.1, 0), GRAPH),
    paint(bx(0.04, 0.75, 1.0, -1.12, 1.7, -1.4), '#31506F'), paint(bx(0.04, 0.75, 1.0, -1.12, 1.7, 0.2), '#31506F'), paint(bx(0.04, 2.0, 0.9, -1.12, 1.3, 2.0), GRAPH),
    paint(bx(0.5, 0.1, 1.1, -1.4, 0.3, 2.0), '#B7B1A5'),
  ]), M.machine, { cast: true, recv: true })
  cabin.position.set(10.85, 0, -0.1)
  const gCab = gate(W.crewIn[0], W.cabinOut[1])
  const cabU = (p: number) => {
    const vis = p >= W.crewIn[0] && p < W.cabinOut[1]
    show(cabin, vis)
    if (!vis || !gCab(p)) return
    const e = Math.max(win(W.crewIn[0], W.crewIn[1], p) * (1 - win(W.cabinOut[0], W.cabinOut[1], p)), Z)
    cabin.scale.setScalar(e)
  }

  /* ================= compactor ================= */
  const compactor = c.mesh(merge([
    paint(bx(0.5, 0.08, 0.45, 0, 0.04, 0), GRAPH), paint(bx(0.32, 0.32, 0.3, 0, 0.26, 0), OFFW), paint(strut(-0.1, 0.3, 0, -0.55, 0.95, 0, 0.04), GRAPH), paint(bx(0.04, 0.04, 0.4, -0.55, 0.95, 0), GRAPH),
  ]), M.machine, { cast: true, parent: c.root })
  const gComp = gate(0.49, W.compactor[1] + 0.005)
  const compU = (p: number) => {
    const vis = p >= 0.49 && p < W.compactor[1] + 0.005
    show(compactor, vis)
    if (!vis || !gComp(p)) return
    const u = lin(0.49, W.compactor[1], p)
    const e = Math.max(win(0.49, 0.495, p) * (1 - win(W.compactor[1] - 0.004, W.compactor[1] + 0.005, p)), Z)
    compactor.position.set(-7.8 + 15.6 * u, 0.03, 4.4 + 0.7 * Math.sin(u * Math.PI * 6))
    compactor.rotation.y = -Math.atan2(13.2 * Math.cos(u * Math.PI * 6), 15.6)
    compactor.scale.setScalar(e * 1.2)
  }

  /* ================= crew ================= */
  const poseGeo = (point: boolean) => {
    const body: THREE.BufferGeometry[] = [], vest: THREE.BufferGeometry[] = []
    for (const s of [-1, 1]) {
      body.push(paint(bx(0.13, 0.1, 0.28, s * 0.1, 0.05, 0.04), RUB), paint(bx(0.14, 0.8, 0.15, s * 0.1, 0.5, 0), '#20262C'))
    }
    body.push(paint(new THREE.SphereGeometry(0.11, 12, 10).translate(0, 1.62, 0), '#D9A98A'))
    body.push(paint(new THREE.SphereGeometry(0.125, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2).translate(0, 1.64, 0), '#E9E6DD'), paint(cyl(0.16, 0.02, 0, 1.645, 0.03, 'y', 12), '#E9E6DD'))
    vest.push(paint(bx(0.42, 0.55, 0.26, 0, 1.17, 0), '#FF761E'), paint(bx(0.435, 0.045, 0.275, 0, 1.0, 0), '#F5F3EE'), paint(bx(0.435, 0.045, 0.275, 0, 1.28, 0), '#F5F3EE'))
    const sleeve = '#2B3F5E'
    if (!point) {
      for (const s of [-1, 1]) body.push(paint(bx(0.1, 0.55, 0.11, s * 0.27, 1.18, 0), sleeve), paint(bx(0.09, 0.09, 0.09, s * 0.27, 0.84, 0), '#D9A98A'))
    } else {
      // radio to the ear: upper arm down and out, forearm up to the helmet, small handset; the other hand holds a clipboard at the hip
      body.push(paint(strut(0.27, 1.36, 0, 0.36, 1.12, 0.1, 0.1), sleeve), paint(strut(0.36, 1.12, 0.1, 0.17, 1.55, 0.1, 0.09), sleeve))
      body.push(paint(bx(0.09, 0.09, 0.09, 0.15, 1.6, 0.1), '#D9A98A'), paint(bx(0.05, 0.13, 0.04, 0.14, 1.66, 0.12), GRAPH))
      body.push(paint(strut(-0.27, 1.36, 0, -0.2, 1.12, 0.3, 0.1), sleeve), paint(bx(0.3, 0.4, 0.025, -0.2, 1.15, 0.38), '#C9A06A'), paint(bx(0.26, 0.34, 0.02, -0.2, 1.15, 0.395), '#E9E6DD'))
    }
    return { body: merge(body), vest: merge(vest) }
  }
  const standing = poseGeo(false), pointing = poseGeo(true)
  const bodyS = c.inst(standing.body, M.crew, 3, { cast: true }), vestS = c.inst(standing.vest, M.vest, 3, { cast: true })
  const bodyP = c.inst(pointing.body, M.crew, 2, { cast: true }), vestP = c.inst(pointing.vest, M.vest, 2, { cast: true })
  const crewAt = CREW_AT
  const SC = 1.2
  const face = (x: number, z: number, off: number) => Math.atan2(-x, -z) + off
  const crewIdx = [[bodyS, vestS, 0], [bodyP, vestP, 0], [bodyS, vestS, 1], [bodyP, vestP, 1]] as const
  const gCrew = gate(W.crewIn[0], W.crewOut[1])
  const crewU = (p: number) => {
    const vis = p >= W.crewIn[0] && p < W.crewOut[1]
    show(bodyS, vis); show(vestS, vis); show(bodyP, vis); show(vestP, vis)
    if (!vis || !gCrew(p)) return
    for (let i = 0; i < 4; i++) {
      const x = crewAt[i][0], z = crewAt[i][1], off = crewAt[i][2]
      const a = W.crewIn[0] + i * 0.004, o = W.crewOut[0] + i * 0.004
      const inn = win(a, a + 0.02, p), out = win(o, o + 0.016, p)
      const s = Math.max(inn * (1 - out) * SC, Z)
      const ry = face(x, z, off)
      const d = out * 2 // walks 2 m outward
      const l = Math.hypot(x, z) || 1
      const ci = crewIdx[i]
      put(ci[0], ci[2], x + (x / l) * d, 0.03, z + (z / l) * d, s, s, s, ry)
      put(ci[1], ci[2], x + (x / l) * d, 0.03, z + (z / l) * d, s, s, s, ry)
    }
    flag(bodyS); flag(vestS); flag(bodyP); flag(vestP)
  }
  // surveyor + tripod share the standing pose (index 2)
  const tripod = c.mesh(merge([
    ...[0, 1, 2].map((i) => paint(strut(0, 1.25, 0, 0.55 * Math.cos(i * 2.094), 0, 0.55 * Math.sin(i * 2.094), 0.045), '#8B9196')),
    paint(bx(0.22, 0.12, 0.22, 0, 1.28, 0), GRAPH), paint(bx(0.18, 0.28, 0.16, 0, 1.48, 0), '#D9D6CE'), paint(cyl(0.04, 0.12, 0, 1.55, 0.1, 'z', 8), GRAPH),
  ]), M.machine, { cast: false, parent: c.root })
  tripod.position.set(-5.6, 0, 6.0)
  const gSv = gate(W.surveyor[0], W.surveyor[1])
  const svU = (p: number) => {
    const vis = p < W.surveyor[1]
    show(tripod, vis)
    if (!vis) { put(bodyS, 2, 0, 0, 0, Z, Z, Z); put(vestS, 2, 0, 0, 0, Z, Z, Z); flag(bodyS); flag(vestS); return }
    if (!gSv(p)) return
    const e = Math.max(1 - win(W.surveyor[0], W.surveyor[1], p), Z)
    tripod.scale.setScalar(e)
    const x = -6.7, z = 6.7, ry = Math.atan2(-5.6 - x, 6.0 - z)
    put(bodyS, 2, x, 0.03, z, e * SC, e * SC, e * SC, ry); put(vestS, 2, x, 0.03, z, e * SC, e * SC, e * SC, ry)
    flag(bodyS); flag(vestS)
  }

  /* ================= tower crane ================= */
  const CX = 10.2, CZ = -5.4, SLEW = 13.5, MAST0 = 0.4, NS = 7, SH = (SLEW - MAST0) / NS
  const crane = new THREE.Group(); crane.position.set(CX, 0, CZ); c.root.add(crane)
  const baseM = c.mesh(bx(1.8, 0.4, 1.8, 0, 0.2, 0), M.concrete, { cast: false, recv: true, parent: crane })
  const sec = (() => {
    const p: THREE.BufferGeometry[] = []
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) p.push(bx(0.12, SH, 0.12, sx * 0.6, SH / 2, sz * 0.6))
    for (const s of [-0.6, 0.6]) {
      p.push(strut(-0.6, 0.05, s, 0.6, SH - 0.05, s, 0.05), strut(0.6, 0.05, s, -0.6, SH - 0.05, s, 0.05), strut(s, 0.05, -0.6, s, SH - 0.05, 0.6, 0.05), strut(s, 0.05, 0.6, s, SH - 0.05, -0.6, 0.05))
      p.push(bx(1.2, 0.06, 0.06, 0, 0.03, s), bx(0.06, 0.06, 1.2, s, 0.03, 0), bx(1.2, 0.06, 0.06, 0, SH - 0.03, s), bx(0.06, 0.06, 1.2, s, SH - 0.03, 0))
    }
    return merge(p)
  })()
  const mast = c.inst(sec, M.craneSteel, NS, { cast: true })
  crane.add(mast)
  const slew = new THREE.Group(); crane.add(slew)
  const jib: THREE.BufferGeometry[] = []
  {
    const ST = '#8794A6', CW = '#0B264E'
    const ch = (x0: number, x1: number, y: number, z: number, t = 0.12) => bx(x1 - x0, t, t, (x0 + x1) / 2, y, z)
    jib.push(paint(bx(1.6, 0.5, 1.6, 0, 0.25, 0), GRAPH))
    jib.push(paint(ch(0.8, 15.8, 0.2, -0.5), ST), paint(ch(0.8, 15.8, 0.2, 0.5), ST), paint(ch(0.8, 15.8, 1.2, 0, 0.14), ST))
    const n = 12, dx = 15 / n
    for (let i = 0; i < n; i++) {
      const s = i % 2 ? -0.5 : 0.5, xa = 0.8 + i * dx
      jib.push(paint(strut(xa, 0.2, s, xa + dx / 2, 1.2, 0, 0.06), ST), paint(strut(xa + dx / 2, 1.2, 0, xa + dx, 0.2, s, 0.06), ST))
      if (i % 2 === 0) jib.push(paint(bx(0.05, 0.05, 1.0, xa, 0.2, 0), ST))
    }
    jib.push(paint(ch(-4.2, -0.8, 0.2, -0.5), ST), paint(ch(-4.2, -0.8, 0.2, 0.5), ST), paint(bx(0.1, 0.1, 1.1, -4.2, 0.2, 0), ST))
    for (let i = 0; i < 3; i++) jib.push(paint(strut(-4.2 + i * 1.13, 0.2, i % 2 ? 0.5 : -0.5, -4.2 + (i + 1) * 1.13, 0.2, i % 2 ? -0.5 : 0.5, 0.05), ST))
    for (let i = 0; i < 5; i++) jib.push(paint(bx(0.4, 0.9, 1.2, -3.85 + i * 0.5, 0.71, 0), CW))
    jib.push(paint(strut(0, 0.5, -0.6, 0, 2.5, 0, 0.1), ST), paint(strut(0, 0.5, 0.6, 0, 2.5, 0, 0.1), ST))
    jib.push(paint(strut(0, 2.5, 0, 6, 1.2, 0, 0.035), ST), paint(strut(0, 2.5, 0, 12.5, 1.2, 0, 0.035), ST), paint(strut(0, 2.5, 0, -3.9, 0.3, 0, 0.035), ST))
    jib.push(paint(bx(1.4, 1.4, 1.2, 1.05, 0.95, 1.3).translate(0, 0, 0), NAVY))
  }
  c.mesh(merge(jib), M.craneVc, { cast: true, parent: slew })
  c.mesh(bx(1.0, 0.5, 0.02, 1.05, 1.2, 1.91), M.glass, { parent: slew })
  c.mesh(new THREE.SphereGeometry(0.13, 10, 8).translate(0, 2.62, 0), M.beacon, { parent: slew })
  const trolley = new THREE.Group(); slew.add(trolley)
  c.mesh(paint(bx(0.7, 0.35, 0.7, 0, -0.02, 0), GRAPH), M.machine, { parent: trolley })
  const cable = c.mesh(cyl(0.015, 1, 0, 0, 0, 'y', 5), M.steel, { parent: trolley })
  const hookG = new THREE.Group(); slew.add(hookG)
  c.mesh(bx(0.5, 0.5, 0.35, 0, 0, 0), M.hook, { parent: hookG })
  const load = c.mesh(merge([
    ...[0, 1, 2].flatMap((i) => [0, 1].map((j) => cyl(0.03, 4, 0, -1.55 - j * 0.07, (i - 1) * 0.07, 'x', 6))),
    strut(0, -0.25, 0, -1.8, -1.52, 0, 0.02), strut(0, -0.25, 0, 1.8, -1.52, 0, 0.02),
  ]), M.steel, { parent: hookG })
  const TH0 = -2.65, PARK = -Math.PI / 2 // working yaw (over the site) / parked yaw (jib along the east edge, clear of the building at every height)
  const U0 = 0.06, DU = 0.097 // erection parameter u: base 0..U0, then one mast section per DU (sequential, never overlapping), then the jib swings round
  const craneU = (p: number, t: number, rm: boolean) => {
    const [i0, i1] = W.craneIn, [c0, c1] = W.craneOut
    const vis = p >= i0 && p < c1
    show(crane, vis)
    live.craneS = vis ? 1 : 0
    if (!vis) return
    const idle = rm ? 0 : t
    live.craneMoved = p > i0 && p < c1
    // one parameter drives both directions: teardown is the exact mirror of erection
    const u = p < 0.5 * (i1 + c0) ? lin(i0, i1, p) : 1 - lin(c0, c1, p)
    // every section stays at its final height and grows in Y from its own base, so the stack is contiguous and nothing floats
    let stack = 0
    for (let i = 0; i < NS; i++) {
      const k = win(U0 + DU * i, U0 + DU * (i + 1), u)
      stack += k
      put(mast, i, 0, MAST0 + SH * i, 0, k > 1e-3 ? 1 : Z, Math.max(k, Z), 1)
    }
    flag(mast)
    baseM.scale.setScalar(Math.max(win(0, U0, u), Z))
    const f = stack / NS
    // slew unit, cab and jib always ride the top of the current stack and shrink away only with the last sections
    const se = win(0.1, 0.6, f)
    show(slew, se > 0.002)
    slew.position.y = MAST0 + SH * stack
    slew.scale.setScalar(Math.max(se, Z))
    const swing = win(0.74, 1, u)
    const w = lin(i1, c0, p)
    slew.rotation.y = PARK + (TH0 - PARK) * swing + swing * (0.35 * Math.sin(w * Math.PI * 3) + (rm ? 0 : 0.025 * Math.sin((idle * Math.PI * 2) / 24)))
    const r = 3 + (10 + 3.5 * Math.sin(w * Math.PI * 4 + 1) - 3) * swing
    // hook: world height is chosen first (clear of the build, never below grade), then expressed in the scaled slew frame
    const hookW = Math.max(Math.min(topY(p) + 5.6, 12.6, slew.position.y - 2.2 * se), 1.2) + (rm ? 0 : 0.04 * Math.sin(idle * 1.3))
    const rel = (hookW - slew.position.y) / Math.max(se, 0.05)
    trolley.position.x = r
    hookG.position.set(r, rel, 0)
    const L = 0.1 - (rel + 0.25)
    cable.position.set(0, (0.1 + rel + 0.25) / 2, 0) // lives in the trolley frame
    cable.scale.set(1, Math.max(L, Z), 1)
    const lo = win(i1, i1 + 0.012, p) * (1 - win(c0 - 0.012, c0, p))
    show(load, lo > 0.002)
    load.scale.setScalar(Math.max(lo, Z))
  }

  function update(p: number, t: number, rm: boolean) {
    excU(p); dumpU(p); cabU(p); compU(p); crewU(p); svU(p); craneU(p, t, rm)
  }
  return { update, live, crane, house, boom, stick, bucket, exc }
}
