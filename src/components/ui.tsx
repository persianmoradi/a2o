import { useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from 'react'
import { motion, useInView } from 'motion/react'
import { reducedMotion } from '../lib/env'

// eslint-disable-next-line
export const EASE = [0.22, 1, 0.36, 1] as const

/**
 * Brand logo: the original 300x300 PNG (untouched) cropped with CSS only. The mark's non-white pixels span x 51..248, y 84..189
 * (measured); the window keeps 6 source px of clear white on every side: x 45..254 (210 wide), y 78..195 (118 tall).
 * --s is the rendered size of one source pixel. The white remainder vanishes via multiply against the opaque surface behind.
 */
const CROP = { x: 45, y: 78, w: 210, h: 118 } as const
export function Logo({ size, className = '', bg = 'var(--color-paper)' }: { size: 'header' | 'footer'; className?: string; bg?: string }) {
  const alt = 'A2O Anlæg & Entreprise'
  const scale = size === 'header' ? '[--s:0.53px] lg:[--s:0.66px]' : '[--s:0.66px]'
  return (
    <span className={`relative block shrink-0 overflow-hidden isolate ${scale} ${className}`}
      style={{ width: `calc(${CROP.w} * var(--s))`, height: `calc(${CROP.h} * var(--s))`, background: bg }}>
      <img src="/brand/a2o-logo-original.png" width={300} height={300} alt={alt} decoding="async"
        className="pointer-events-none absolute max-w-none mix-blend-multiply"
        style={{ width: 'calc(300 * var(--s))', height: 'calc(300 * var(--s))', left: `calc(${-CROP.x} * var(--s))`, top: `calc(${-CROP.y} * var(--s))` }} />
    </span>
  )
}

/*
 * Reveal system (Motion). Opacity 0 -> 1, y 20 -> 0, 0.7 s, once, amount 0.15, stagger 0.08 s via the `i` index.
 * It always resolves: besides whileInView-style detection (useInView) a cheap rect watchdog reveals anything that is in view
 * or already scrolled past (fast scrolls, anchor jumps, tab restore), and without IntersectionObserver or with reduced motion
 * the content is simply rendered visible.
 */
const noIO = typeof IntersectionObserver === 'undefined'
export function useShown(ref: React.RefObject<Element | null>) {
  const rm = reducedMotion()
  const seen = useInView(ref, { once: true, amount: 0.15 })
  const [late, setLate] = useState(false)
  useEffect(() => {
    if (rm || noIO) return
    const el = ref.current
    if (!el) return
    let id = 0
    const check = () => {
      const r = el.getBoundingClientRect()
      if (r.top < innerHeight * 0.9 || !el.isConnected) { setLate(true); clearInterval(id) }
    }
    check()
    id = window.setInterval(check, 200)
    return () => clearInterval(id)
  }, [ref, rm])
  return rm || noIO || seen || late
}

const hidden = { opacity: 0, y: 20 }
const shown = { opacity: 1, y: 0 }
const tr = (i: number) => ({ duration: 0.7, ease: EASE, delay: i * 0.08 })

export function Reveal({ children, delay = 0, i, className = '', as: Tag = 'div', style }: { children: ReactNode; delay?: number; i?: number; className?: string; as?: 'div' | 'h3' | 'p' | 'li' | 'dl'; style?: CSSProperties }) {
  const ref = useRef<HTMLElement>(null)
  const on = useShown(ref)
  const M = motion[Tag] as ElementType
  const rm = reducedMotion()
  const n = i ?? Math.round(delay / 0.08)
  return (
    <M ref={ref} className={className} style={style} initial={rm ? false : hidden} animate={on ? shown : hidden} transition={tr(n)}>
      {children}
    </M>
  )
}

/** Section headings. Same reveal, multi-line safe. */
export function Mask({ children, className = '', as: Tag = 'h2' }: { children: ReactNode; className?: string; as?: 'h2' | 'h3' | 'p'; delay?: number }) {
  const ref = useRef<HTMLElement>(null)
  const on = useShown(ref)
  const rm = reducedMotion()
  const M = motion[Tag] as ElementType
  return (
    <M ref={ref} className={className} initial={rm ? false : hidden} animate={on ? shown : hidden} transition={tr(1)}>
      {children}
    </M>
  )
}

/** Plain section label (real copy from content.ts). */
export function Label({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <Reveal i={0} className={`t-mono mb-5 ${dark ? 'text-on-navy-muted' : 'text-signal-ink'}`}>{children}</Reveal>
  )
}


/** Marks content that is a stand-in until the client supplies the real thing. */
export function Ph({ children = 'Pladsholder', dark = false }: { children?: ReactNode; dark?: boolean }) {
  return (
    <span className={`t-mono inline-flex items-center border border-dashed px-2 py-0.5 ${dark ? 'border-on-navy-muted text-on-navy-muted' : 'border-signal-ink text-signal-ink'}`}>{children}</span>
  )
}
