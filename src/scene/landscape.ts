import * as THREE from 'three'
import { bx, cyl, flag, gate, merge, noisy, paint, put, show } from './gfx'
import type { Ctx } from './ctx'
import { easeOut, W, win } from './timeline'
import { aoTexture, blobTexture, paverTexture } from './gfx'

const Z = 1e-6
type Blob = { x: number; z: number; sx: number; sz: number; e: (p: number) => number; live?: 'exc' | 'dumper' }

/** Pavers, lawn tint, trees, planters, bollards, contact blobs and footprint AO. */
export function buildLandscape(c: Ctx, live: { excX: number; excZ: number; excS: number }, uLawn: { value: number }, maxAniso: number) {
  const { M } = c
  const own = c.geo

  /* ---- pavers: one mesh, herringbone, wiped by a world-x discard ---- */
  const ring = new THREE.Shape()
  ring.moveTo(-8.27, -5.47); ring.lineTo(8.27, -5.47); ring.lineTo(8.27, 5.47); ring.lineTo(-8.27, 5.47); ring.closePath()
  const hole = new THREE.Path()
  hole.moveTo(-5.05, -3.05); hole.lineTo(-5.05, 3.05); hole.lineTo(5.05, 3.05); hole.lineTo(5.05, -3.05); hole.closePath()
  ring.holes.push(hole)
  const path = new THREE.Shape()
  path.moveTo(-1.2, -8); path.lineTo(1.2, -8); path.lineTo(1.2, -5.47); path.lineTo(-1.2, -5.47); path.closePath()
  const pg = new THREE.ShapeGeometry([ring, path]).rotateX(-Math.PI / 2)
  const tex = own(paverTexture(maxAniso))
  const lay = { value: -9 }
  const pm = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, metalness: 0, envMapIntensity: 0.2 })
  pm.onBeforeCompile = (sh) => {
    sh.uniforms.uLay = lay
    sh.vertexShader = sh.vertexShader.replace('void main() {', 'varying float vPX;\nvoid main() {').replace('#include <begin_vertex>', '#include <begin_vertex>\nvPX = position.x;')
    sh.fragmentShader = sh.fragmentShader.replace('void main() {', 'varying float vPX;\nuniform float uLay;\nvoid main() {\n  if (vPX > uLay) discard;')
  }
  pm.customProgramCacheKey = () => 'a2o-paver'
  c.geo(pm)
  const pavers = c.mesh(pg, pm, { recv: true })
  pavers.position.y = 0.05

  /* ---- trees ---- */
  const TREES: [number, number, number][] = [[-10.4, 5.6, 1], [10.8, 6.4, 1.08], [-10.4, -6.2, 0.95], [0, -7.0, 1.1], [-8.2, 7.2, 0.92], [10.7, -1.5, 1.04]]
  const trunkG = paint(cyl(0.11, 2.2, 0, 1.1, 0, 'y', 8, 0.065), '#8A6F55')
  // smooth architectural-model crowns: three icosphere blobs (detail 3, smooth normals), one muted sage, ~20% smaller
  const crown = merge([
    paint(new THREE.IcosahedronGeometry(1.35, 3).translate(0, 3.2, 0), '#7C8F5A'),
    paint(new THREE.IcosahedronGeometry(1.05, 3).translate(0.7, 3.9, 0.35), '#7C8F5A'),
    paint(new THREE.IcosahedronGeometry(1.0, 3).translate(-0.6, 3.8, -0.4), '#7C8F5A'),
  ]).scale(0.8, 0.8, 0.8)
  const trunks = c.inst(trunkG, M.vc, TREES.length, { cast: true, recv: true }), crowns = c.inst(crown, M.vc, TREES.length, { cast: true })
  const gTree = gate(W.trees[0], W.trees[1] + 0.02)
  const treeE = (i: number, p: number) => easeOut(win(W.trees[0] + i * 0.0018, W.trees[0] + i * 0.0018 + 0.008, p))
  const treesU = (p: number) => {
    show(trunks, p >= W.trees[0]); show(crowns, p >= W.trees[0])
    if (!gTree(p)) return
    for (let i = 0; i < TREES.length; i++) { const t = TREES[i], e = Math.max(treeE(i, p) * t[2], Z); put(trunks, i, t[0], 0, t[1], e, e, e, i); put(crowns, i, t[0], 0, t[1], e, e, e, i) }
    flag(trunks); flag(crowns)
  }

  /* ---- planters + shrubs + bollards ---- */
  const planters = c.inst(bx(1.4, 0.5, 0.6, 0, 0.25, 0), M.corten, 2, { cast: true, recv: true })
  const shrubG = paint(noisy(new THREE.IcosahedronGeometry(0.3, 1), 0.12, 8), '#6B7E4B')
  const shrubs = c.inst(shrubG, M.vc, 6, { cast: true })
  const bollards = c.inst(cyl(0.075, 0.9, 0, 0.45, 0, 'y', 10), M.galvDark, 4, { recv: true })
  const PL_X = [-2.3, 2.3], SH_O = [-0.4, 0, 0.4]
  const gPl = gate(W.planters[0], W.planters[1])
  const plU = (p: number) => {
    const v = p >= W.planters[0]
    show(planters, v); show(shrubs, v); show(bollards, v)
    if (!gPl(p)) return
    const e = Math.max(win(W.planters[0], W.planters[1], p), Z)
    for (let i = 0; i < 2; i++) {
      const x = PL_X[i]
      put(planters, i, x, 0.05, 4.4, e, e, e)
      for (let j = 0; j < 3; j++) put(shrubs, i * 3 + j, x + SH_O[j], 0.62, 4.4 + (j === 1 ? 0.08 : -0.04), e, e * (j === 1 ? 1.15 : 1), e)
    }
    for (let i = 0; i < 4; i++) put(bollards, i, i & 1 ? 1.5 : -1.5, 0.05, i < 2 ? 5.0 : 7.0, e, e, e)
    flag(planters); flag(shrubs); flag(bollards)
  }

  /* ---- soft contact blobs (one instanced draw) + footprint AO ---- */
  const bt = own(blobTexture())
  const bmat = new THREE.MeshBasicMaterial({ map: bt, color: 0x000000, transparent: true, opacity: 0.38, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 })
  c.geo(bmat)
  const crewE = (i: number) => (p: number) => win(W.crewIn[0] + i * 0.004, W.crewIn[0] + i * 0.004 + 0.02, p) * (1 - win(W.crewOut[0] + i * 0.004, W.crewOut[0] + i * 0.004 + 0.016, p))
  const blobs: Blob[] = [
    { x: -10.6, z: 2.4, sx: 1.6, sz: 1.6, e: crewE(0) }, { x: 9.9, z: -7.2, sx: 1.6, sz: 1.6, e: crewE(1) },
    { x: -3, z: 6.9, sx: 1.6, sz: 1.6, e: crewE(2) }, { x: 4.4, z: -6.7, sx: 1.6, sz: 1.6, e: crewE(3) },
    ...TREES.map(([x, z, s], i): Blob => ({ x: x + 0.5, z: z + 0.4, sx: 4.4 * s, sz: 4.4 * s, e: (p) => treeE(i, p) })),
    { x: -2.3, z: 4.4, sx: 2.2, sz: 1.5, e: (p) => win(W.planters[0], W.planters[1], p) }, { x: 2.3, z: 4.4, sx: 2.2, sz: 1.5, e: (p) => win(W.planters[0], W.planters[1], p) },
    { x: 10.2, z: -5.4, sx: 3.2, sz: 3.2, e: (p) => win(W.craneIn[0], W.craneIn[1], p) * (1 - win(W.craneOut[0] + 0.02, W.craneOut[1], p)) },
    { x: 10.85, z: -0.1, sx: 3.8, sz: 7.4, e: (p) => win(W.crewIn[0], W.crewIn[1], p) * (1 - win(W.cabinOut[0], W.cabinOut[1], p)) },
    { x: 9.9, z: 4.9, sx: 2.8, sz: 4.4, e: (p) => win(W.crewIn[0], W.crewIn[1], p) * (1 - win(W.dumperOut[0], W.dumperOut[1], p)) },
    { x: 0, z: 0, sx: 3.6, sz: 4.4, e: () => 1, live: 'exc' },
  ]
  const blobM = c.inst(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), bmat, blobs.length)
  blobM.renderOrder = 2
  let lastBlobP = -1
  const blobsU = (p: number) => {
    if (p === lastBlobP) return
    lastBlobP = p
    for (let i = 0; i < blobs.length; i++) {
      const b = blobs[i]
      let e = b.e(p), x = b.x, z = b.z
      if (b.live === 'exc') { e = live.excS > 1e-3 ? live.excS : 0; x = live.excX; z = live.excZ }
      e = Math.max(e, 0)
      put(blobM, i, x, 0.07, z, Math.max(b.sx * e, Z), 1, Math.max(b.sz * e, Z))
    }
    flag(blobM)
  }
  const aoT = own(aoTexture())
  const aoMat = new THREE.MeshBasicMaterial({ map: aoT, color: 0x000000, transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 })
  c.geo(aoMat)
  const ao = c.inst(new THREE.PlaneGeometry(15.5, 11).rotateX(-Math.PI / 2), aoMat, 1) // instanced: shares the blob shader program
  ao.setMatrixAt(0, new THREE.Matrix4().makeTranslation(0, 0.058, 0))
  ao.renderOrder = 1
  const gAo = gate(0.43, 0.46)
  const aoU = (p: number) => {
    const v = p >= 0.43
    show(ao, v)
    if (!gAo(p)) return
    aoMat.opacity = 0.45 * win(0.43, 0.46, p)
  }

  const gPav = gate(W.pavers[0], W.pavers[1])
  const gLawn = gate(W.lawn[0], W.lawn[1])
  function update(p: number) {
    show(pavers, p >= W.pavers[0])
    if (gPav(p)) lay.value = -8.4 + 17 * win(W.pavers[0], W.pavers[1], p)
    if (gLawn(p)) uLawn.value = win(W.lawn[0], W.lawn[1], p)
    treesU(p); plU(p); blobsU(p); aoU(p)
  }
  return { update }
}
