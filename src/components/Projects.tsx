import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { motion, useReducedMotion, useSpring, useTransform, type MotionValue } from 'motion/react'
import { projects, type Case, type Img } from '../content'
import { navigate } from '../lib/router'
import { Label, Mask, Ph, Reveal } from './ui'

/** The ring holds each case twice so it reads as a full cylinder; the counter still shows the real index. */
const COPIES = 2
const AUTO_MS = 4500
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))
const mod = (n: number, m: number) => ((n % m) + m) % m
const pad2 = (n: number) => String(n).padStart(2, '0')

/** Card width from the viewport; R puts neighbouring cards just beside the front one (chord of the ring = card width + gap). */
function geometry(vw: number, step: number) {
  const mobile = vw < 640
  const cw = mobile ? Math.round(vw * 0.68) : vw < 1024 ? Math.round(Math.min(vw * 0.42, 380)) : Math.round(Math.min(vw * 0.26, 420))
  const gap = mobile ? 8 : 24
  const R = Math.round((cw / 2 + gap / 2) / Math.tan((step / 2) * (Math.PI / 180)))
  return { cw, R, persp: mobile ? 1800 : 2600 }
}

const srcSet = (img: Img) => img.widths.map((w) => `/photos/${img.name}-${w}.webp ${w}w`).join(', ')
const src = (img: Img) => `/photos/${img.name}-${img.widths[img.widths.length > 1 ? 1 : 0]}.webp`

function Arrow({ dir, onClick }: { dir: 'prev' | 'next'; onClick: () => void }) {
  return (
    <button
      type="button" onClick={onClick} aria-label={dir === 'prev' ? 'Forrige projekt' : 'Næste projekt'}
      className="inline-flex size-12 items-center justify-center border border-navy text-navy transition-[background-color,color] duration-200 hover:bg-navy hover:text-paper"
    >
      <svg aria-hidden width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" className={dir === 'prev' ? 'rotate-180' : ''}>
        <path d="M3 10h13M11 4.5 16.5 10 11 15.5" />
      </svg>
    </button>
  )
}

type CardProps = { c: Case; slot: number; step: number; R: number; rot: MotionValue<number>; front: boolean; near: boolean; flat: boolean; eager: boolean; onPick: (slot: number, href: string) => void }

function Card({ c, slot, step, R, rot, front, near, flat, eager, onPick }: CardProps) {
  // angle of this card relative to the front, in degrees (-180..180)
  const rel = (v: number) => mod(v - slot * step + 180, 360) - 180
  const fade = useTransform(rot, (v) => { const a = Math.abs(rel(v)); return a <= 78 ? 1 : a >= 100 ? 0 : (100 - a) / 22 })
  // backface-visibility breaks hit-testing in Chromium, so cards past 90deg simply fade to 0 and stop taking pointer events
  const hit = useTransform(rot, (v) => (Math.abs(rel(v)) <= 80 ? 'auto' : 'none'))
  // cards on the far side of the ring are removed from layout so the 3D depth sort only sees the visible half
  const shown = useTransform(rot, (v) => (Math.abs(rel(v)) <= 105 ? 'block' : 'none'))
  const veil = useTransform(rot, (v) => Math.min(0.75, (Math.abs(rel(v)) / 48) * 0.5))
  const text = useTransform(rot, (v) => clamp(1 - Math.abs(rel(v)) / 14, 0, 1))
  const href = `/projekter/${c.slug}`
  return (
    <motion.li
      aria-hidden={!near || undefined}
      className="absolute top-0 left-1/2"
      style={{
        width: 'var(--cw)', marginLeft: 'calc(var(--cw) / -2)',
        transform: flat ? undefined : `rotateY(${-slot * step}deg) translateZ(${-R}px)`,
        opacity: flat ? undefined : fade, display: flat ? undefined : shown, pointerEvents: flat ? (front ? undefined : 'none') : hit,
      }}
      animate={flat ? { opacity: front ? 1 : 0 } : undefined} transition={{ duration: 0.3 }} initial={false}
    >
      <a
        href={href} data-slot={slot} draggable={false} tabIndex={front ? 0 : -1}
        aria-label={front ? `${c.type}, ${c.partner}. Åbn projekt` : `Vis projekt: ${c.type}, ${c.partner}`}
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return
          e.preventDefault()
          // pointer taps are resolved in the stage's pointerup (3D hit-testing is unreliable); only keyboard activation lands here
          if (e.detail === 0) onPick(slot, href)
        }}
        className="group relative block overflow-hidden border border-line bg-paper select-none"
      >
        <div className="relative aspect-[4/5] overflow-hidden bg-paper-2">
          <img
            src={src(c.img)} srcSet={srcSet(c.img)} sizes="(min-width:1024px) 420px, 70vw" width={c.img.w} height={c.img.h} alt={front ? c.img.alt : ''}
            loading={eager ? 'eager' : 'lazy'} decoding={eager ? "sync" : "async"} draggable={false} className="h-full w-full object-cover" style={{ objectPosition: c.img.pos }}
          />
          {c.placeholder && <span className="absolute top-3 left-3 bg-paper"><Ph /></span>}
        </div>
        <motion.div className="flex h-[13.5rem] flex-col p-5 sm:p-6" style={{ opacity: flat ? 1 : text }}>
          <span className="t-mono text-signal-ink">{c.type}</span>
          <h3 className="mt-2 text-[length:clamp(1.25rem,1rem+0.7vw,1.75rem)] leading-[1.15] font-semibold">{c.partner}</h3>
          <p className="mt-2 line-clamp-2 text-[0.9375rem] leading-snug text-ink-muted">{c.teaser}</p>
          <span className="t-mono mt-auto text-navy">{projects.cta} <span aria-hidden className="inline-block transition-transform duration-200 group-hover:translate-x-1">→</span></span>
        </motion.div>
        {/* side cards dim with an opaque veil, so edges never show through each other */}
        {!flat && <motion.span aria-hidden style={{ opacity: veil }} className="pointer-events-none absolute inset-0 bg-paper-2" />}
      </a>
    </motion.li>
  )
}

export function Projects() {
  const items = projects.items
  const n = items.length
  const N = n * COPIES
  const step = 360 / N
  const [a, setA] = useState(0) // unbounded slot index; real project = a mod n
  const aRef = useRef(0)
  const [vw, setVw] = useState(() => (typeof innerWidth === 'number' ? innerWidth : 1440))
  const flat = !!useReducedMotion()
  const { cw, R, persp } = geometry(vw, step)
  const stageRef = useRef<HTMLDivElement>(null)
  const rot = useSpring(0, { stiffness: 120, damping: 20, mass: 1 })
  const drag = useRef({ id: -1, x: 0, rot0: 0, a0: 0, on: false, moved: false, t: 0, vx: 0, lastX: 0 })
  const [hold, setHold] = useState({ hover: false, focus: false, drag: false, vis: false, hid: false })
  const setH = (k: keyof typeof hold, v: boolean) => setHold((h) => (h[k] === v ? h : { ...h, [k]: v }))

  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setVw(el.clientWidth))
    ro.observe(el)
    setVw(el.clientWidth)
    const io = new IntersectionObserver(([e]) => setH('vis', !e.isIntersecting), { threshold: 0.35 })
    io.observe(el)
    const onVis = () => setH('hid', document.hidden)
    document.addEventListener('visibilitychange', onVis)
    onVis()
    return () => { ro.disconnect(); io.disconnect(); document.removeEventListener('visibilitychange', onVis) }
  }, [])

  const goTo = useCallback((to: number) => {
    aRef.current = to
    setA(to)
    rot.set(to * step)
  }, [rot, step])

  const paused = hold.hover || hold.focus || hold.drag || hold.vis || hold.hid
  useEffect(() => {
    if (flat || paused) return
    const t = setTimeout(() => goTo(aRef.current + 1), AUTO_MS)
    return () => clearTimeout(t)
  }, [a, paused, flat, goTo])

  const k = step / cw // degrees per dragged pixel
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(aRef.current - 1) }
    else if (e.key === 'ArrowRight') { e.preventDefault(); goTo(aRef.current + 1) }
  }
  const down = (e: PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    drag.current = { id: e.pointerId, x: e.clientX, rot0: rot.get(), a0: aRef.current, on: true, moved: false, t: performance.now(), vx: 0, lastX: e.clientX }
  }
  const move = (e: PointerEvent) => {
    const d = drag.current
    if (!d.on || e.pointerId !== d.id) return
    if (!d.moved) {
      if (Math.abs(e.clientX - d.x) <= 8) return
      d.moved = true
      stageRef.current?.setPointerCapture(e.pointerId)
      setH('drag', true)
    }
    const now = performance.now()
    const dt = Math.max(1, now - d.t)
    d.vx = d.vx * 0.6 + ((e.clientX - d.lastX) / dt) * 0.4
    d.t = now; d.lastX = e.clientX
    if (!flat) rot.jump(d.rot0 - (e.clientX - d.x) * k)
  }
  const up = (e: PointerEvent) => {
    const d = drag.current
    if (!d.on || e.pointerId !== d.id) return
    d.on = false
    if (stageRef.current?.hasPointerCapture(e.pointerId)) stageRef.current.releasePointerCapture(e.pointerId)
    if (!d.moved) {
      // a tap: resolve the card under the pointer ourselves, because Chromium's hit-test misses cards inside a preserve-3d ring
      const hit = document.elementsFromPoint(e.clientX, e.clientY).find((el): el is HTMLAnchorElement => el instanceof HTMLAnchorElement && 'slot' in el.dataset)
      if (hit) pick(Number(hit.dataset.slot), hit.getAttribute('href') ?? '/')
      return
    }
    setH('drag', false)
    const dx = e.clientX - d.x
    if (flat) goTo(d.a0 + (Math.abs(dx) > 60 ? (dx < 0 ? 1 : -1) : 0))
    else {
      // a flick carries on for a moment: project the release velocity, snap to the nearest slot (at most 2 away)
      const proj = rot.get() - d.vx * k * 1000 * 0.18
      goTo(clamp(Math.round(proj / step), d.a0 - 2, d.a0 + 2))
    }
    // a drag must never also count as a click on a card
    setTimeout(() => { drag.current.moved = false }, 0)
  }

  const pick = (slot: number, href: string) => {
    if (drag.current.moved) return
    const cur = aRef.current
    const off = mod(slot - cur + N / 2, N) - N / 2
    if (off !== 0) { goTo(cur + off); return }
    // so that Back returns to the carousel, not the top of the page
    history.replaceState(null, '', '/#projekter')
    navigate(href)
  }

  const frontSlot = mod(a, N)
  const real = mod(a, n)
  return (
    <section id="projekter" aria-labelledby="pr-h" className="relative overflow-x-clip bg-paper-2 pad-y">
      <div className="wrap">
        <div className="max-w-3xl">
          <Label>{projects.eyebrow}</Label>
          <Mask className="t-h2"><span id="pr-h">{projects.title}</span></Mask>
          <Reveal i={2} className="t-lead mt-4">{projects.lead}</Reveal>
        </div>
      </div>

      <div
        role="region" aria-roledescription="karrusel" aria-label="Udvalgte projekter" onKeyDown={onKey} className="mt-12 lg:mt-16"
        onPointerEnter={(e) => { if (e.pointerType === 'mouse') setH('hover', true) }} onPointerLeave={() => setH('hover', false)}
        onFocus={() => setH('focus', true)} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setH('focus', false) }}
      >
        <div
          ref={stageRef}
          onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
          className="relative mx-auto w-full cursor-grab touch-pan-y overflow-x-clip select-none active:cursor-grabbing"
          style={{ ['--cw' as string]: `${cw}px`, height: `calc(var(--cw) * 1.25 + 13.5rem + 5rem)`, paddingBlock: '2.5rem', perspective: `${persp}px` }}
        >
          <motion.ul
            className="absolute inset-x-0 top-10 bottom-10"
            style={{ transformStyle: flat ? 'flat' : 'preserve-3d', willChange: flat ? undefined : 'transform', transform: useTransform(rot, (v) => (flat ? 'none' : `translateZ(${R}px) rotateY(${v}deg)`)) }}
          >
            {Array.from({ length: N }, (_, slot) => {
              const off = mod(slot - a + N / 2, N) - N / 2
              return (
                <Card
                  key={slot} c={items[slot % n]} slot={slot} step={step} R={R} rot={rot} flat={flat}
                  front={slot === frontSlot} near={Math.abs(off) <= 1} eager={slot < 3 || slot >= N - 2} onPick={pick}
                />
              )
            })}
          </motion.ul>
        </div>

        <div className="wrap mt-8 flex items-center justify-center gap-6">
          <Arrow dir="prev" onClick={() => goTo(aRef.current - 1)} />
          <p className="t-mono min-w-[6ch] text-center text-navy" aria-hidden>{pad2(real + 1)} / {pad2(n)}</p>
          <Arrow dir="next" onClick={() => goTo(aRef.current + 1)} />
        </div>
        <p className="sr-only-live" aria-live="polite">Projekt {real + 1} af {n}</p>
      </div>
    </section>
  )
}
