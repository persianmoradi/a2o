import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { clamp01 } from './timeline'

export function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Shared scratch objects: the frame loop never allocates. */
export const dummy = new THREE.Object3D()
const ZERO = 1e-6
export function put(m: THREE.InstancedMesh, i: number, x: number, y: number, z: number, sx = 1, sy = 1, sz = 1, ry = 0) {
  dummy.position.set(x, y, z)
  dummy.rotation.set(0, ry, 0)
  // any collapsed axis collapses all three so no sheet or sliver survives
  if (sx <= ZERO || sy <= ZERO || sz <= ZERO) dummy.scale.setScalar(ZERO)
  else dummy.scale.set(sx, sy, sz)
  dummy.updateMatrix()
  m.setMatrixAt(i, dummy.matrix)
}
export const flag = (m: THREE.InstancedMesh) => { m.instanceMatrix.needsUpdate = true }
export const show = (o: THREE.Object3D, v: boolean) => { if (o.visible !== v) o.visible = v }

/** Re-evaluate a group only while its window is active or when it crosses a boundary (jumps stay correct). */
export function gate(a: number, b: number) {
  let last = -1
  return (p: number) => {
    const s = p < a ? 0 : p > b ? 2 : 1
    const run = s === 1 || s !== last
    last = s
    return run
  }
}

/* ---------- geometry ---------- */
const ni = (g: THREE.BufferGeometry) => (g.index ? g.toNonIndexed() : g)
export function paint<T extends THREE.BufferGeometry>(g: T, color: THREE.ColorRepresentation): T {
  const c = new THREE.Color(color)
  const n = g.attributes.position.count
  const a = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b }
  g.setAttribute('color', new THREE.BufferAttribute(a, 3))
  return g
}
export const bx = (w: number, h: number, d: number, x = 0, y = 0, z = 0) => new THREE.BoxGeometry(w, h, d).translate(x, y, z)
export type Axis = 'x' | 'y' | 'z'
export function cyl(r: number, h: number, x = 0, y = 0, z = 0, axis: Axis = 'y', seg = 10, r2 = r) {
  const g = new THREE.CylinderGeometry(r2, r, h, seg)
  if (axis === 'x') g.rotateZ(Math.PI / 2)
  else if (axis === 'z') g.rotateX(Math.PI / 2)
  return g.translate(x, y, z)
}
/** bar between two points (D = diameter), square section */
export function strut(ax: number, ay: number, az: number, bx_: number, by: number, bz: number, t: number) {
  const dx = bx_ - ax, dy = by - ay, dz = bz - az
  const len = Math.hypot(dx, dy, dz)
  const g = new THREE.BoxGeometry(t, len, t)
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx, dy, dz).normalize())
  g.applyQuaternion(q)
  return g.translate((ax + bx_) / 2, (ay + by) / 2, (az + bz) / 2)
}
export function merge(parts: THREE.BufferGeometry[]) {
  const ng = parts.map(ni)
  const m = mergeGeometries(ng, false)
  ng.forEach((g, i) => { if (g !== parts[i]) g.dispose() })
  parts.forEach((g) => g.dispose())
  return m
}
export function noisy(g: THREE.BufferGeometry, amt: number, seed: number) {
  const r = rng(seed)
  const pos = g.attributes.position
  const map = new Map<string, number[]>()
  for (let i = 0; i < pos.count; i++) {
    const k = `${pos.getX(i).toFixed(3)},${pos.getY(i).toFixed(3)},${pos.getZ(i).toFixed(3)}`
    let o = map.get(k)
    if (!o) { o = [(r() - 0.5) * amt, (r() - 0.5) * amt, (r() - 0.5) * amt]; map.set(k, o) }
    pos.setXYZ(i, pos.getX(i) + o[0], pos.getY(i) + o[1], pos.getZ(i) + o[2])
  }
  g.computeVertexNormals()
  return g
}

/* ---------- materials ---------- */
export const ORANGE = '#FF761E'
// mixed over the lit colour just before tone mapping so the hue stays the brand orange on light and dark surfaces alike
const HL = new THREE.Color(ORANGE).multiplyScalar(0.9)
export type Std = THREE.MeshStandardMaterial & { userData: { uHl: { value: number } } }

/** shared low-frequency noise (assigned by buildSite before the first compile) for the roughness variation */
export const noiseU: { value: THREE.Texture | null } = { value: null }
type StdOpts = { rv?: number; color?: THREE.ColorRepresentation; rough?: number; metal?: number; env?: number; vc?: boolean; row?: 1 | 2 | 3 | 4; hl?: number; emissive?: THREE.ColorRepresentation; emi?: number; side?: THREE.Side }
/** Every std material reads vertex colours (geometry without a colour attribute gets white in ctx) so instanced / plain meshes share the fewest shader programs. */
/** MeshStandardMaterial with a shared rim-light highlight patch (uniform uHl, orange silhouette only). */
export function std(o: StdOpts = {}): Std {
  const m = new THREE.MeshStandardMaterial({
    color: o.color ?? '#ffffff', roughness: o.rough ?? 0.8, metalness: o.metal ?? 0, envMapIntensity: o.env ?? 0.5,
    vertexColors: true, side: o.side ?? THREE.FrontSide,
  })
  if (o.emissive) { m.emissive.set(o.emissive); m.emissiveIntensity = o.emi ?? 0.4 }
  const u = { value: 0 }, rv = { value: o.rv ?? 0 }, hs = { value: o.hl ?? 1 } // hl: highlight strength (white concrete only gets a faint rim; the chalk outline carries the row)
  m.userData.uHl = u
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uHl = u
    sh.uniforms.uHlC = { value: HL }
    sh.uniforms.uRv = rv
    sh.uniforms.uHs = hs
    sh.uniforms.uRn = noiseU
    sh.vertexShader = sh.vertexShader
      .replace('void main() {', 'varying vec3 vWp;\nvoid main() {')
      .replace('#include <project_vertex>', `#include <project_vertex>
      vec4 wp4 = vec4(transformed, 1.0);
      #ifdef USE_INSTANCING
      wp4 = instanceMatrix * wp4;
      #endif
      vWp = (modelMatrix * wp4).xyz;`)
    sh.fragmentShader = sh.fragmentShader
      .replace('void main() {', 'varying vec3 vWp;\nuniform sampler2D uRn;\nuniform float uRv;\nuniform float uHl;\nuniform float uHs;\nuniform vec3 uHlC;\nfloat hlMix;\nvoid main() {')
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
      roughnessFactor = clamp(roughnessFactor + (texture2D(uRn, vWp.xz * 0.37 + vWp.y * 0.23).r - 0.5) * uRv, 0.04, 1.0);`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      float hlRim = pow(1.0 - saturate(dot(normalize(normal), normalize(vViewPosition))), 3.0);
      hlMix = uHl * uHs * 0.9 * smoothstep(0.25, 0.6, hlRim);`)
      // orange tint that keeps the surface shading (hue stays brand orange on light concrete, no pink wash) + a thin emissive edge for dark materials
      .replace('#include <opaque_fragment>', `outgoingLight = mix(outgoingLight, outgoingLight * vec3(2.8, 0.3, 0.03) + uHlC * 0.25, hlMix);
      #include <opaque_fragment>`)
  }
  m.customProgramCacheKey = () => 'a2o-hl'
  return m as Std
}

/* ---------- textures ---------- */
export function noiseTexture() {
  const N = 128, r = rng(11)
  const coarse = (n: number) => { const a = new Float32Array(n * n); for (let i = 0; i < a.length; i++) a[i] = r(); return a }
  const c1 = coarse(8), c2 = coarse(16), c3 = coarse(32)
  const samp = (a: Float32Array, n: number, u: number, v: number) => {
    const x = u * n, y = v * n, x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0
    const g = (i: number, j: number) => a[((j % n + n) % n) * n + ((i % n + n) % n)]
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy)
    return (g(x0, y0) * (1 - sx) + g(x0 + 1, y0) * sx) * (1 - sy) + (g(x0, y0 + 1) * (1 - sx) + g(x0 + 1, y0 + 1) * sx) * sy
  }
  const data = new Uint8Array(N * N * 4)
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const u = i / N, v = j / N
    const n = samp(c1, 8, u, v) * 0.5 + samp(c2, 16, u, v) * 0.3 + samp(c3, 32, u, v) * 0.2
    const k = (j * N + i) * 4
    data[k] = data[k + 1] = data[k + 2] = Math.round(clamp01(n) * 255)
    data[k + 3] = 255
  }
  const t = new THREE.DataTexture(data, N, N, THREE.RGBAFormat)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.generateMipmaps = true
  t.minFilter = THREE.LinearMipmapLinearFilter
  t.magFilter = THREE.LinearFilter
  t.needsUpdate = true
  return t
}
export function blobTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.5, 'rgba(0,0,0,0.45)'); g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}
/** soft rect (alpha only) for the building footprint AO */
export function aoTexture() {
  const N = 256, c = document.createElement('canvas')
  c.width = c.height = N
  const ctx = c.getContext('2d')!
  const img = ctx.createImageData(N, N)
  const hx = 0.62, hy = 0.5 // rect half extents in uv units (of 0.5)
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const x = Math.abs(i / N - 0.5) * 2, y = Math.abs(j / N - 0.5) * 2
    const dx = Math.max(x - hx * 0.78, 0), dy = Math.max(y - hy * 0.7, 0)
    const d = Math.hypot(dx, dy)
    const a = clamp01(1 - d / 0.3)
    const k = (j * N + i) * 4
    img.data[k + 3] = Math.round(a * a * (3 - 2 * a) * 255)
  }
  ctx.putImageData(img, 0, 0)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}
/** 512px herringbone, 16 x 16 units of 0.1 m = 1.6 m tile */
export function paverTexture(maxAniso: number) {
  const c = document.createElement('canvas')
  c.width = c.height = 512
  const ctx = c.getContext('2d')!
  const r = rng(5)
  ctx.fillStyle = '#A59F92'; ctx.fillRect(0, 0, 512, 512)
  const U = 32, cols = ['#CFC9BC', '#C4BEB1', '#CAC4B7', '#D6D0C4']
  for (let i = -6; i <= 6; i++) for (let j = -6; j <= 6; j++) {
    const ox = i * 4 + j * 3, oy = j
    for (const [x, y, w, h] of [[ox, oy, 2, 1], [ox, oy - 2, 1, 2]]) {
      for (let wx = -16; wx <= 16; wx += 16) for (let wy = -16; wy <= 16; wy += 16) {
        const X = (x + wx) * U, Y = (y + wy) * U
        if (X > 512 || Y > 512 || X + w * U < 0 || Y + h * U < 0) continue
        ctx.fillStyle = cols[Math.floor(r() * cols.length)]
        ctx.fillRect(X + 1.5, Y + 1.5, w * U - 3, h * U - 3)
      }
    }
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(1 / 1.6, 1 / 1.6)
  t.anisotropy = Math.min(4, maxAniso)
  return t
}
