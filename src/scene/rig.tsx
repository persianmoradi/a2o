import { useEffect, useMemo, type RefObject } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { buildSite } from './site'

/** The procedural site, built once per canvas and disposed with it. */
export function useSite() {
  const gl = useThree((s) => s.gl)
  const site = useMemo(() => buildSite(gl.capabilities.getMaxAnisotropy()), [gl])
  useEffect(() => () => site.dispose(), [site])
  return site
}

/**
 * Light rig from the art direction: warm key (the only shadow caster), sky/ground hemisphere, cool fill.
 * Image based light comes from a one-off PMREM of RoomEnvironment, assigned per material so env intensity stays per-material.
 */
export function Rig({ site, small, keyRef }: { site: ReturnType<typeof buildSite>; small: boolean; keyRef: RefObject<THREE.DirectionalLight | null> }) {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  useEffect(() => {
    const pm = new THREE.PMREMGenerator(gl)
    const room = new RoomEnvironment()
    const rt = pm.fromScene(room, 0.04)
    scene.environmentIntensity = 0.55
    const mats: THREE.MeshStandardMaterial[] = []
    site.root.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined
      if (m?.isMeshStandardMaterial && !mats.includes(m)) { m.envMap = rt.texture; mats.push(m) }
    })
    pm.dispose(); room.dispose()
    return () => { mats.forEach((m) => { m.envMap = null }); rt.dispose() }
  }, [gl, scene, site])
  return (
    <>
      <hemisphereLight args={['#DCE6F5', '#8A6B4A', 0.9]} />
      <directionalLight
        ref={keyRef} color="#FFF1DC" intensity={2.4} position={[14, 18, 8]} castShadow
        shadow-mapSize={small ? [1024, 1024] : [2048, 2048]} shadow-bias={-0.0004} shadow-normalBias={0.03}
        shadow-camera-left={-14} shadow-camera-right={14} shadow-camera-top={14} shadow-camera-bottom={-14} shadow-camera-near={1} shadow-camera-far={60}
      />
      <directionalLight color="#DCE6F5" intensity={0.35} position={[-10, 6, -8]} />
      <primitive object={site.root} />
    </>
  )
}

export const canvasGl = { antialias: true, alpha: true, powerPreference: 'high-performance' as const, toneMapping: THREE.ACESFilmicToneMapping }
