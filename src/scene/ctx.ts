import * as THREE from 'three'
import { std, ORANGE, type Std } from './gfx'

/** white vertex colours when a geometry has none (all std materials use vertexColors) */
function ensureColor(g: THREE.BufferGeometry) {
  if (g.attributes.color || !g.attributes.position) return g
  g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 3).fill(1), 3))
  return g
}

/** Palette from the spec (albedo, roughness, metalness, env intensity). One material per use so row highlights stay scoped. */
export function makeMats() {
  // albedo ~12% darker than the first pass; env lowered on the ground receivers so shadows hold contrast
  return {
    concrete: std({ color: '#C9C6BE', rough: 0.85, env: 0.3, rv: 0.2 }),
    slab: std({ color: '#D6D3CB', rough: 0.85, env: 0.3, rv: 0.2, row: 2, hl: 0.1 }),
    pad: std({ color: '#D6D3CB', rough: 0.85, env: 0.3, rv: 0.2, row: 2, hl: 0.1 }),
    pipe: std({ color: '#CFC9BC', rough: 0.85, env: 0.4, rv: 0.2, row: 1 }),
    pvc: std({ color: '#E9E5DB', rough: 0.6, env: 0.5, row: 1 }),
    ring: std({ color: '#CFC9BC', rough: 0.85, env: 0.5, row: 1 }),
    lid: std({ color: '#1F2F47', rough: 0.5, metal: 0.8, env: 1, row: 1 }),
    rebar: std({ color: '#9AA3AE', rough: 0.45, metal: 0.7, env: 1, row: 2 }),
    steel: std({ color: '#9AA3AE', rough: 0.45, metal: 0.7, env: 1 }),
    galv: std({ color: '#9AA3AE', rough: 0.5, metal: 0.6, env: 1 }),
    galvDark: std({ color: '#F5F3EE', rough: 0.5, metal: 0.6, env: 1 }),
    timber: std({ color: '#C9A06A', rough: 0.8, env: 0.5 }),
    gravel: std({ color: '#B8B2A5', rough: 1, env: 0.15 }),
    soil: std({ color: '#7E6043', rough: 1, env: 0.3 }),
    glass: std({ color: '#2B4C7E', rough: 0.04, metal: 0.55, env: 1.3 }),
    panel: std({ color: '#0B264E', rough: 0.7, env: 0.3, rv: 0.2 }),
    membrane: std({ color: '#3C4A5F', rough: 0.9, env: 0.3 }),
    kerb: std({ color: '#D6D3CB', rough: 0.85, env: 0.3, rv: 0.2, row: 3 }),
    corten: std({ color: '#7A4A2C', rough: 0.6, metal: 0.4, env: 0.8 }),
    machine: std({ rough: 0.6, env: 0.7, vc: true }),
    machineD: std({ rough: 0.6, env: 0.7, vc: true, row: 4 }), // dumper: row 4 rim
    crew: std({ rough: 0.9, env: 0.4, vc: true, row: 4 }), // helmets, trousers, skin (the vests are already orange)
    craneSteel: std({ color: '#8794A6', rough: 0.55, metal: 0.5, env: 1 }),
    craneVc: std({ rough: 0.55, metal: 0.3, env: 1, vc: true }),
    vc: std({ rough: 0.9, env: 0.4, vc: true }),
    vest: std({ rough: 0.7, env: 0.5, vc: true, row: 4 }),
    hook: std({ color: ORANGE, rough: 0.5, env: 0.6, row: 4 }),
    beacon: std({ color: ORANGE, rough: 0.4, env: 0.6, emissive: ORANGE, emi: 0.25, row: 4 }),
    fascia: std({ rough: 0.5, env: 0.6 }),
  }
}
export type Mats = ReturnType<typeof makeMats>

/** Builder context: tracks everything for disposal and keeps shadow bookkeeping in one place. */
export type Ctx = {
  root: THREE.Group
  M: Mats
  casters: THREE.Object3D[]
  geo: <G extends { dispose(): void }>(g: G) => G
  mesh: (g: THREE.BufferGeometry, m: THREE.Material, o?: { cast?: boolean; recv?: boolean; parent?: THREE.Object3D }) => THREE.Mesh
  inst: (g: THREE.BufferGeometry, m: THREE.Material, n: number, o?: { cast?: boolean; recv?: boolean; color?: boolean }) => THREE.InstancedMesh
}

export function makeCtx(root: THREE.Group, M: Mats, disposables: { dispose(): void }[]): Ctx {
  const casters: THREE.Object3D[] = []
  const geo = <G extends { dispose(): void }>(g: G) => (disposables.push(g), g)
  return {
    root, M, casters, geo,
    mesh: (g, m, o = {}) => {
      const me = new THREE.Mesh(geo((m as THREE.MeshStandardMaterial).isMeshStandardMaterial ? ensureColor(g) : g), m)
      me.castShadow = !!o.cast; me.receiveShadow = !!o.recv
      me.frustumCulled = false
      if (o.cast) casters.push(me)
      ;(o.parent ?? root).add(me)
      return me
    },
    inst: (g, m, n, o = {}) => {
      const me = new THREE.InstancedMesh(geo((m as THREE.MeshStandardMaterial).isMeshStandardMaterial ? ensureColor(g) : g), m, n)
      me.castShadow = !!o.cast; me.receiveShadow = !!o.recv
      me.frustumCulled = false
      if (o.cast) casters.push(me)
      root.add(me)
      return me
    },
  }
}
export type { Std }
