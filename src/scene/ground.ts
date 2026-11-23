import * as THREE from 'three'
import { clamp01 } from './timeline'

/** Board 24 x 16 m, grade y = 0, base y = -3. One heightfield mesh (97 x 65 top verts + 4 skirts), deformed in place. */
export const NX = 96, NZ = 64, CELL = 0.25, X0 = -12, Z0 = -8, BASE = -3
export const TX = -9.3 // sewer trench centre x (kerb ring sits at x = -8.4)
export const BOTTOM = { pit: -1.0, trench: -1.65, branch: -1.55 }

const nvx = NX + 1, nvz = NZ + 1

/** Terrain height. pit 0..1 depth, head = z the trench has reached (8 = none, -8 = finished), fill 0..1 backfill. */
export function terrainY(x: number, z: number, pit: number, head: number, fill: number): number {
  const d = Math.max(Math.abs(x) - 6, Math.abs(z) - 4, 0)
  let y = BOTTOM.pit * pit * clamp01(1 - d)
  const tx = Math.abs(x - TX)
  const along = clamp01((z - head) / CELL)
  const trench = clamp01((0.9 - tx) / CELL) * along
  // manhole pockets 1.8 m at z = 0 and z = 5
  const pk = (zc: number) => clamp01((1.15 - tx) / CELL) * clamp01((1.15 - Math.abs(z - zc)) / CELL) * clamp01((z - head) / CELL)
  const pocket = Math.max(pk(0), pk(5))
  y = Math.min(y, BOTTOM.trench * Math.max(trench, pocket))
  // branch groove along z = 0 from the trench to x = -4.3
  const g = clamp01((0.75 - Math.abs(z)) / CELL) * clamp01((x - TX) / CELL) * clamp01((-4.3 - x) / CELL) * clamp01(-head / 0.5)
  y = Math.min(y, BOTTOM.branch * g)
  return y * (1 - fill)
}

export function buildGround(noise: THREE.Texture) {
  const nTop = nvx * nvz
  const skirtN = [nvx, nvx, nvz, nvz] // -z, +z, -x, +x
  const total = nTop + skirtN.reduce((a, n) => a + 2 * n, 0)
  const pos = new Float32Array(total * 3)
  const nor = new Float32Array(total * 3)
  const H = new Float32Array(nTop)
  const idx: number[] = []
  for (let j = 0; j < nvz; j++) for (let i = 0; i < nvx; i++) {
    const k = (j * nvx + i) * 3
    pos[k] = X0 + i * CELL; pos[k + 2] = Z0 + j * CELL; nor[k + 1] = 1
  }
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) {
    const a = j * nvx + i, b = a + 1, c = a + nvx, d = c + 1
    idx.push(a, c, b, b, c, d)
  }
  // skirts: duplicate border verts (top copy follows the heightfield, bottom copy at BASE) so the cut faces show strata
  const skirts: { top: number[]; bot: number; ni: number }[] = []
  let v = nTop
  const sides: { ids: number[]; n: [number, number, number] }[] = [
    { ids: Array.from({ length: nvx }, (_, i) => i), n: [0, 0, -1] },
    { ids: Array.from({ length: nvx }, (_, i) => NZ * nvx + i), n: [0, 0, 1] },
    { ids: Array.from({ length: nvz }, (_, j) => j * nvx), n: [-1, 0, 0] },
    { ids: Array.from({ length: nvz }, (_, j) => j * nvx + NX), n: [1, 0, 0] },
  ]
  sides.forEach((s) => {
    const n = s.ids.length
    const t0 = v, b0 = v + n
    s.ids.forEach((id, k) => {
      for (const [o, y] of [[t0, 0], [b0, BASE]] as const) {
        pos[(o + k) * 3] = pos[id * 3]; pos[(o + k) * 3 + 1] = y; pos[(o + k) * 3 + 2] = pos[id * 3 + 2]
        nor[(o + k) * 3] = s.n[0]; nor[(o + k) * 3 + 1] = s.n[1]; nor[(o + k) * 3 + 2] = s.n[2]
      }
    })
    // winding: pick the order whose face normal points outward
    // face (t_i, t_i+1, b_i) has normal (along x down) = (az, 0, -ax)
    const ax = pos[(t0 + 1) * 3] - pos[t0 * 3], az = pos[(t0 + 1) * 3 + 2] - pos[t0 * 3 + 2]
    const cx = az, cz = -ax
    const flip = cx * s.n[0] + cz * s.n[2] < 0
    for (let k = 0; k < n - 1; k++) {
      const t = t0 + k, t1 = t + 1, b = b0 + k, b1 = b + 1
      if (!flip) idx.push(t, t1, b, t1, b1, b)
      else idx.push(t, b, t1, t1, b, b1)
    }
    skirts.push({ top: s.ids, bot: b0, ni: t0 })
    v += 2 * n
  })
  const geo = new THREE.BufferGeometry()
  const pa = new THREE.BufferAttribute(pos, 3), na = new THREE.BufferAttribute(nor, 3)
  pa.setUsage(THREE.DynamicDrawUsage); na.setUsage(THREE.DynamicDrawUsage)
  geo.setAttribute('position', pa); geo.setAttribute('normal', na)
  geo.setIndex(idx)

  const key = [NaN, NaN, NaN]
  /** Deform in place; skipped unless an input changed by > 1e-3. Zero allocations. */
  function deform(pit: number, head: number, fill: number) {
    if (Math.abs(pit - key[0]) < 1e-3 && Math.abs(head - key[1]) < 1e-3 && Math.abs(fill - key[2]) < 1e-3) return false
    key[0] = pit; key[1] = head; key[2] = fill
    for (let j = 0; j < nvz; j++) for (let i = 0; i < nvx; i++) {
      const id = j * nvx + i
      H[id] = terrainY(X0 + i * CELL, Z0 + j * CELL, pit, head, fill)
      pos[id * 3 + 1] = H[id]
    }
    for (let j = 0; j < nvz; j++) for (let i = 0; i < nvx; i++) {
      const id = j * nvx + i
      const hl = H[j * nvx + Math.max(i - 1, 0)], hr = H[j * nvx + Math.min(i + 1, NX)]
      const hd = H[Math.max(j - 1, 0) * nvx + i], hu = H[Math.min(j + 1, NZ) * nvx + i]
      const sx = (hr - hl) / ((Math.min(i + 1, NX) - Math.max(i - 1, 0)) * CELL)
      const sz = (hu - hd) / ((Math.min(j + 1, NZ) - Math.max(j - 1, 0)) * CELL)
      const l = 1 / Math.hypot(sx, 1, sz)
      nor[id * 3] = -sx * l; nor[id * 3 + 1] = l; nor[id * 3 + 2] = -sz * l
    }
    for (const s of skirts) for (let k = 0; k < s.top.length; k++) pos[(s.ni + k) * 3 + 1] = H[s.top[k]]
    pa.needsUpdate = true; na.needsUpdate = true
    return true
  }

  const uni = {
    uNoise: { value: noise }, uLawn: { value: 0 }, uFill: { value: 0 },
    uTop: { value: new THREE.Color('#8A6B4A') }, uClay: { value: new THREE.Color('#6B4F36') },
    uSand: { value: new THREE.Color('#B8B2A5') }, uChalk: { value: new THREE.Color('#7D7468') },
    uGrass: { value: new THREE.Color('#8A6B4A') }, uLawnC: { value: new THREE.Color('#7C8F5A') },
  }
  const mat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.95, metalness: 0, envMapIntensity: 0.15 })
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uni)
    sh.vertexShader = sh.vertexShader
      .replace('void main() {', 'varying vec3 vLP;\nvarying vec3 vLN;\nvoid main() {')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLP = position; vLN = normal;')
    sh.fragmentShader = sh.fragmentShader
      .replace('void main() {', `varying vec3 vLP;
varying vec3 vLN;
uniform sampler2D uNoise;
uniform float uLawn, uFill;
uniform vec3 uTop, uClay, uSand, uChalk, uGrass, uLawnC;
float gNz;
void main() {`)
      .replace('#include <color_fragment>', `#include <color_fragment>
      {
        float y = vLP.y;
        vec3 nn = normalize(vLN);
        vec3 bw = pow(abs(nn), vec3(4.0)); bw /= (bw.x + bw.y + bw.z);
        gNz = texture2D(uNoise, vLP.zy * 0.21).r * bw.x + texture2D(uNoise, vLP.xz * 0.21).r * bw.y + texture2D(uNoise, vLP.xy * 0.21).r * bw.z;
        vec3 c = uTop;
        c = mix(c, uClay, smoothstep(-0.32, -0.38, y));
        c = mix(c, uSand, smoothstep(-1.58, -1.64, y));
        c = mix(c, uChalk, smoothstep(-2.38, -2.44, y));
        float line = (1.0 - smoothstep(0.0, 0.035, abs(y + 0.35))) + (1.0 - smoothstep(0.0, 0.035, abs(y + 1.6))) + (1.0 - smoothstep(0.0, 0.035, abs(y + 2.4)));
        c *= 1.0 - 0.4 * clamp(line, 0.0, 1.0);
        float lawn = uLawn;
        vec3 grass = mix(uGrass, uLawnC, lawn);
        // backfilled ground (pit + sewer trench) turns to grass as the fill rises, so no soil strip is left over the lawn
        float gm = max(smoothstep(-0.12, -0.02, y), smoothstep(0.3, 0.8, uFill) * step(-0.9, y));
        c = mix(c, grass, smoothstep(0.6, 0.85, nn.y) * gm);
        diffuseColor.rgb = c * (0.92 + 0.16 * gNz);
      }`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = clamp(roughnessFactor + (gNz - 0.5) * 0.2, 0.3, 1.0);')
  }
  mat.customProgramCacheKey = () => 'a2o-ground'
  const mesh = new THREE.Mesh(geo, mat)
  mesh.frustumCulled = false
  mesh.receiveShadow = true
  return { mesh, geo, mat, uni, deform }
}
