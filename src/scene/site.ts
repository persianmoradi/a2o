import * as THREE from 'three'
import { noiseTexture, noiseU } from './gfx'
import { makeCtx, makeMats } from './ctx'
import { buildGround } from './ground'
import { buildSub } from './substructure'
import { buildBuilding } from './building'
import { buildMachines } from './machines'
import { buildLandscape } from './landscape'
import { W, win } from './timeline'

export type Site = ReturnType<typeof buildSite>

/** 1 unit = 1 m. Board 24 x 16, grade y = 0, base y = -3. Every element is a pure function of p (see timeline.ts). */
export function buildSite(maxAniso = 4) {
  const root = new THREE.Group()
  const disposables: { dispose(): void }[] = []
  const M = makeMats()
  Object.values(M).forEach((m) => disposables.push(m))
  const c = makeCtx(root, M, disposables)

  const noise = c.geo(noiseTexture())
  noiseU.value = noise
  const g = buildGround(noise)
  disposables.push(g.geo, g.mat)
  const board = new THREE.Group()
  root.add(board)
  board.add(g.mesh)

  // underside: soft dark glow so the board floats on paper
  const glowC = document.createElement('canvas')
  glowC.width = glowC.height = 128
  {
    const x = glowC.getContext('2d')!
    const gr = x.createRadialGradient(64, 64, 8, 64, 64, 64)
    gr.addColorStop(0, 'rgba(0,0,0,0.7)'); gr.addColorStop(1, 'rgba(0,0,0,0)')
    x.fillStyle = gr; x.fillRect(0, 0, 128, 128)
  }
  const glowT = c.geo(new THREE.CanvasTexture(glowC))
  glowT.colorSpace = THREE.SRGBColorSpace
  const glowM = c.geo(new THREE.MeshBasicMaterial({ map: glowT, transparent: true, depthWrite: false }))
  const glow = c.inst(new THREE.PlaneGeometry(34, 24).rotateX(-Math.PI / 2), glowM, 1) // instanced so it shares the blob shader program
  glow.setMatrixAt(0, new THREE.Matrix4().makeTranslation(0, -3.06, 0))
  glow.renderOrder = -1

  const sub = buildSub(c)
  board.add(sub.staged)
  const bld = buildBuilding(c)
  const mac = buildMachines(c)
  const land = buildLandscape(c, mac.live, g.uni.uLawn, maxAniso)

  // soft cast-shadow receivers/casters: ground + slab + frame etc. are flagged in their builders
  const ease = (t: number) => 1 - (1 - t) * (1 - t) * (1 - t)

  function update(p: number, t: number, intro: number, rm: boolean) {
    const e = ease(Math.min(1, Math.max(0, intro / 0.9)))
    board.position.y = -3 * (1 - e)
    glowM.opacity = e
    // ground heightfield
    const pit = win(W.pit[0], W.pit[1], p)
    const head = 8 - 16 * win(W.trench[0], W.trench[1], p)
    const fill = win(W.backfill[0], W.backfill[1], p)
    g.uni.uFill.value = fill
    g.deform(pit, head, fill)
    sub.update(p); bld.update(p); mac.update(p, t, rm); land.update(p)
  }

  return {
    root, update, M, board, mac, casters: c.casters,
    dispose: () => { disposables.forEach((o) => o.dispose()); root.traverse((o) => { const m = o as THREE.Mesh; if (m.geometry) m.geometry.dispose() }) },
  }
}
