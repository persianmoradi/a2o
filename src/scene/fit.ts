import * as THREE from 'three'

/** x0, x1, y0, y1, z0, z1 in metres */
export type Box = readonly [number, number, number, number, number, number]
/** fractions of the canvas the box should fill: x0, x1, y0, y1 */
export type Region = readonly [number, number, number, number]
export type Fit = { m: number; ox: number; oy: number }

const tc = new THREE.PerspectiveCamera(30, 1, 1, 400)
const v = new THREE.Vector3()
const b = [0, 0, 0, 0]
const cam = new THREE.Vector3()

function project(pos: THREE.Vector3, tgt: THREE.Vector3, m: number, box: Box, W: number, H: number) {
  cam.copy(pos).sub(tgt).multiplyScalar(m).add(tgt)
  tc.position.copy(cam)
  tc.lookAt(tgt)
  tc.updateMatrixWorld()
  b[0] = b[2] = 1e9
  b[1] = b[3] = -1e9
  for (let i = 0; i < 8; i++) {
    v.set(i & 1 ? box[1] : box[0], i & 2 ? box[3] : box[2], i & 4 ? box[5] : box[4]).project(tc)
    const x = (v.x * 0.5 + 0.5) * W
    const y = (0.5 - v.y * 0.5) * H
    if (x < b[0]) b[0] = x
    if (x > b[1]) b[1] = x
    if (y < b[2]) b[2] = y
    if (y > b[3]) b[3] = y
  }
}

/**
 * Distance multiplier + view offset that fit a box into a region of the canvas. Run on resize only (not per frame).
 * The camera sits at tgt + (pos - tgt) * m and the image is shifted by (ox, oy) px through setViewOffset.
 */
export function fitView(out: Fit, fov: number, W: number, H: number, pos: THREE.Vector3, tgt: THREE.Vector3, box: Box, region: Region, fill = 0.94) {
  tc.fov = fov
  tc.aspect = W / H
  tc.updateProjectionMatrix()
  const rw = (region[1] - region[0]) * W * fill
  const rh = (region[3] - region[2]) * H * fill
  let m = out.m || 1.6
  for (let i = 0; i < 5; i++) {
    project(pos, tgt, m, box, W, H)
    m = Math.min(8, Math.max(0.5, m * Math.max((b[1] - b[0]) / rw, (b[3] - b[2]) / rh)))
  }
  project(pos, tgt, m, box, W, H)
  out.m = m
  out.ox = -((region[0] + region[1]) * 0.5 * W - (b[0] + b[1]) * 0.5)
  out.oy = -((region[2] + region[3]) * 0.5 * H - (b[2] + b[3]) * 0.5)
}
