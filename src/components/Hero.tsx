import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { company, hero } from '../content'
import { reducedMotion } from '../lib/env'
import { EASE } from './ui'

const rm = reducedMotion()
const up = (i: number) => (rm ? { initial: false as const } : { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.7, ease: EASE, delay: 0.1 + i * 0.08 } })

/** 1080p on large screens, a lighter 960px encode on phones and tablets. */
const pickSrc = () => (window.matchMedia('(min-width: 1024px)').matches ? '/video/hero-1080.mp4' : '/video/hero-720.mp4')

/** Full-bleed site footage behind the copy. Poster first, plays muted and looped, pauses offscreen, and never autoplays with reduced motion. */
function HeroVideo() {
  const ref = useRef<HTMLVideoElement>(null)
  const [src] = useState(pickSrc)
  const [playing, setPlaying] = useState(!rm)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const v = ref.current
    if (!v) return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && playing) v.play().catch(() => setPlaying(false))
      else v.pause()
    })
    io.observe(v)
    return () => io.disconnect()
  }, [playing])

  const toggle = () => {
    const v = ref.current
    if (!v) return
    if (v.paused) { v.play().then(() => setPlaying(true)).catch(() => {}) } else { v.pause(); setPlaying(false) }
  }

  return (
    <>
      <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden bg-navy">
        <img src="/video/hero-poster.webp" alt="" width={1920} height={1080} className="absolute inset-0 h-full w-full object-cover object-[60%_50%]" fetchPriority="high" />
        <video
          ref={ref}
          src={src}
          poster="/video/hero-poster.webp"
          muted
          loop
          playsInline
          autoPlay={!rm}
          preload={rm ? 'none' : 'auto'}
          onPlaying={() => setShown(true)}
          className="absolute inset-0 h-full w-full object-cover object-[60%_50%] transition-opacity duration-1000"
          style={{ opacity: shown ? 1 : 0 }}
        />
        {/* legibility: navy wash, heavier on the copy side (left on desktop, bottom on phones) */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(11_38_78/0.7)_0%,rgb(11_38_78/0.66)_45%,rgb(11_38_78/0.92)_100%)] lg:bg-[linear-gradient(90deg,rgb(11_38_78/0.92)_0%,rgb(11_38_78/0.72)_40%,rgb(11_38_78/0.25)_75%,rgb(11_38_78/0.15)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(180deg,transparent,rgb(11_38_78/0.6))]" />
      </div>
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? 'Sæt video på pause' : 'Afspil video'}
        className="t-mono absolute right-[var(--pad)] bottom-5 z-10 inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full border border-on-navy/30 px-4 text-on-navy/90 backdrop-blur-sm transition-colors hover:border-on-navy/70 hover:text-on-navy"
      >
        {playing ? (
          <svg aria-hidden width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><rect x="2" y="1" width="3" height="10" /><rect x="7" y="1" width="3" height="10" /></svg>
        ) : (
          <svg aria-hidden width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M2 1l9 5-9 5z" /></svg>
        )}
        <span className="hidden sm:inline">{playing ? 'Pause' : 'Afspil'}</span>
      </button>
    </>
  )
}

export function Hero() {
  return (
    <section id="top" aria-labelledby="h1" className="on-navy relative isolate flex min-h-[88svh] flex-col justify-end overflow-hidden text-on-navy lg:min-h-[100svh] lg:justify-center">
      <HeroVideo />
      <div className="wrap grid12 relative z-10 w-full pt-[calc(var(--header-h)+48px)] pb-24 sm:pb-28 lg:py-[calc(var(--header-h)+40px)]">
        <div className="col-span-12 lg:col-span-6">
          <motion.p {...up(0)} className="t-mono mb-5 text-balance text-signal">{hero.eyebrow}</motion.p>
          <h1 id="h1" className="t-display text-on-navy">
            {hero.lines.map((l, i) => (
              <motion.span key={l} className="inline-block sm:block" {...up(i + 1)}>{l}{' '}</motion.span>
            ))}
          </h1>
          <motion.p {...up(5)} className="t-lead mt-5 max-w-[46ch] text-on-navy/90 sm:mt-7">{hero.lead}</motion.p>
          <motion.div {...up(6)} className="mt-7 flex flex-row flex-wrap items-center gap-x-6 gap-y-2 sm:mt-9 sm:gap-8">
            <a href="#kontakt" className="btn">{hero.cta}<span aria-hidden className="arr">→</span></a>
            <a href={company.tel} className="link link-on inline-flex min-h-11 items-center font-semibold text-on-navy">{hero.call}</a>
          </motion.div>
        </div>
      </div>
      <p className="t-mono pointer-events-none absolute bottom-5 left-[var(--pad)] z-10 hidden items-end gap-4 text-on-navy-muted lg:flex">
        {hero.hint}
        <span className="relative block h-10 w-px bg-on-navy/25"><span className="hint-line absolute inset-0 bg-signal" /></span>
      </p>
      <p className="t-mono absolute bottom-[4.25rem] left-[var(--pad)] z-10 hidden text-on-navy-muted lg:block">CVR {company.cvr}</p>
    </section>
  )
}
