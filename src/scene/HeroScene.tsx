import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { isFinePointer } from '../lib/env'
import { fitView, type Box, type Fit, type Region } from './fit'
import { canvasGl, Rig, useSite } from './rig'
import { HERO_P } from './timeline'

declare global { interface Window { __a2o?: Record<string, unknown> } }

const TAU = Math.PI * 2
const TGT = new THREE.Vector3(-5, 1.0, -1)
const POS_L = new THREE.Vector3(15, 7.5, 17)
const POS_P = new THREE.Vector3(17, 9, 19)
const BOX: Box = [-13.2, -1.5, -1.5, 4.5, -6, 2.5]
const damp = THREE.MathUtils.damp

type Props = { run: boolean; rm: boolean; onReady: () => void; onFail: () => void }

function Diorama({ run, rm, onReady }: Omit<Props, 'onFail'>) {
  const { camera, size, gl, invalidate } = useThree()
  const site = useSite()
  const keyRef = useRef<THREE.DirectionalLight>(null)
  const fine = useMemo(() => isFinePointer(), [])
  const s = useMemo(() => ({
    t: 0, frame: 0, ready: false, px: 0, py: 0, cx: 0, cy: 0, slow: 0, n: 0, dropped: false,
    fit: { m: 0, ox: 0, oy: 0 } as Fit, dir: new THREE.Vector3(), fov: 32, portrait: false,
  }), [])

  // fit the diorama into the free part of the canvas (right of the text column on desktop) whenever the canvas resizes
  useEffect(() => {
    const W = size.width, H = size.height
    s.portrait = W / H < 1.1
    s.fov = s.portrait ? 40 : 32
    const wide = innerWidth >= 1024 // the canvas only covers the right 58% of the viewport on desktop
    const region: Region = wide ? [0.04, 1.02, 0.1, 1.0] : [0.02, 0.98, 0, 0.82]
    const pos = s.portrait ? POS_P : POS_L
    fitView(s.fit, s.fov, W, H, pos, TGT, BOX, region, wide ? 1.0 : 0.94)
    s.dir.copy(pos).sub(TGT).multiplyScalar(s.fit.m)
    const c = camera as THREE.PerspectiveCamera
    c.fov = s.fov
    c.setViewOffset(W, H, s.fit.ox, s.fit.oy, W, H)
    if (rm) invalidate()
  }, [size.width, size.height, camera, s, rm, invalidate])

  useEffect(() => {
    if (!fine || rm) return
    const move = (e: PointerEvent) => { s.px = (e.clientX / innerWidth) * 2 - 1; s.py = -((e.clientY / innerHeight) * 2 - 1) }
    addEventListener('pointermove', move, { passive: true })
    return () => removeEventListener('pointermove', move)
  }, [fine, rm, s])

  // a hero that starts out of view still renders its first frame (demand), and wakes up when it scrolls in
  useEffect(() => { if (run) invalidate() }, [run, invalidate])

  // small static spoil heap where the bucket bottoms out, so the idle dig reads as digging rather than waving at air
  useEffect(() => {
    const geo = new THREE.IcosahedronGeometry(1, 2)
    const q = geo.attributes.position
    for (let i = 0; i < q.count; i++) {
      const x = q.getX(i), y = q.getY(i), z = q.getZ(i)
      q.setXYZ(i, x, Math.max(y, -0.1) * (1 + 0.15 * Math.sin(3 * x + 2 * z)), z)
    }
    geo.scale(1.3, 0.8, 1.1)
    geo.computeVertexNormals()
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(q.count * 3).fill(1), 3)) // site materials read vertex colours
    const heap = new THREE.Mesh(geo, site.M.soil)
    heap.position.set(-7.7, 0, -2.2)
    heap.castShadow = heap.receiveShadow = true
    site.board.add(heap)
    return () => { site.board.remove(heap); geo.dispose() }
  }, [site])

  useEffect(() => {
    gl.shadowMap.autoUpdate = false
    gl.shadowMap.needsUpdate = true
    if (new URLSearchParams(location.search).has('debug')) (window.__a2o ??= {}).hero = { gl, site }
  }, [gl, site])

  useFrame((state, rawDt) => {
    if (!run && s.ready) return
    const dt = Math.min(rawDt, 0.05)
    s.t += rm ? 0 : dt
    const { mac } = site
    // intro rise (board settles in over 0.9 s), then the state is frozen: only the excavator and the camera move
    if (s.t < 1.2 || !s.ready) site.update(HERO_P, s.t, rm ? 9 : s.t, rm)
    const t = s.t
    if (!rm) {
      // idle dig cycle, sin only. Bases are the dig pose of the scene at HERO_P.
      mac.boom.rotation.z = 0.8 + 0.25 * Math.sin((TAU * t) / 9)
      mac.stick.rotation.z = -1.9 + 0.35 * Math.sin((TAU * t) / 9 + 0.8)
      mac.bucket.rotation.z = -0.2 + 0.4 * Math.sin((TAU * t) / 9 - 0.6)
      mac.house.rotation.y = 0.25 * Math.sin((TAU * t) / 14)
    } else {
      mac.boom.rotation.z = 0.8; mac.stick.rotation.z = -1.9; mac.bucket.rotation.z = -0.2; mac.house.rotation.y = 0
    }
    // camera: slow azimuth sway, y drift, damped pointer parallax (fine pointers only)
    const az = rm ? 0 : 0.2 * Math.sin((TAU * t) / 36)
    const cs = Math.cos(az), sn = Math.sin(az)
    s.cx = damp(s.cx, s.px * 0.6, 2.5, dt)
    s.cy = damp(s.cy, s.py * 0.35, 2.5, dt)
    const d = s.dir
    camera.position.set(TGT.x + d.x * cs + d.z * sn + s.cx, TGT.y + d.y + (rm ? 0 : 0.35 * Math.sin((TAU * t) / 14)) + s.cy, TGT.z - d.x * sn + d.z * cs)
    camera.lookAt(TGT)
    // soft shadows follow the digging arm at 30 Hz
    if ((++s.frame & 1) === 0 || !s.ready) gl.shadowMap.needsUpdate = true
    if (!s.ready) { s.ready = true; requestAnimationFrame(onReady) }
    // one-shot perf guard: if the idle loop cannot hold ~30 fps, drop to dpr 1 and a 1024 shadow map
    if (!rm && !s.dropped && t > 1.5) {
      s.slow += rawDt; s.n++
      if (s.n >= 90) {
        if (s.slow / s.n > 1 / 28) {
          s.dropped = true
          state.setDpr(1)
          const k = keyRef.current
          if (k) { k.shadow.mapSize.set(1024, 1024); k.shadow.map?.dispose(); k.shadow.map = null }
        }
        s.slow = 0; s.n = 0
      }
    }
  })
  return <Rig site={site} small={size.width < 1024 || !fine} keyRef={keyRef} />
}

export default function HeroScene({ run, rm, onReady, onFail }: Props) {
  const touch = useMemo(() => !isFinePointer(), [])
  return (
    <Canvas
      shadows="percentage"
      frameloop={rm || !run ? 'demand' : 'always'}
      dpr={touch ? [1, 1.5] : [1, 1.75]}
      camera={{ fov: 32, near: 4, far: 200, position: [15, 7.5, 17] }}
      gl={canvasGl}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0)
        gl.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); onFail() })
      }}
    >
      <Diorama run={run} rm={rm} onReady={onReady} />
    </Canvas>
  )
}
