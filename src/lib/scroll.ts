import Lenis from 'lenis'
import { reducedMotion } from './env'

/** One Lenis instance, disabled entirely under prefers-reduced-motion. It never captures or cancels the wheel: native scroll + smoothing only. */
let lenis: Lenis | null = null
let raf = 0

export const getLenis = () => lenis
export const headerHeight = () => document.querySelector('header')?.getBoundingClientRect().height ?? 56

export function initScroll(): () => void {
  if (reducedMotion()) return () => {}
  lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.9, syncTouch: false, smoothWheel: true })
  const loop = (t: number) => { lenis?.raf(t); raf = requestAnimationFrame(loop) }
  raf = requestAnimationFrame(loop)
  return () => { cancelAnimationFrame(raf); lenis?.destroy(); lenis = null }
}

/** Scroll to an absolute page y (already offset-corrected by the caller). */
export function scrollToY(y: number, duration = 1.4) {
  if (lenis) lenis.scrollTo(y, { duration, force: true })
  else scrollTo({ top: y, behavior: reducedMotion() ? 'auto' : 'smooth' })
}

/**
 * Scroll an element to just below the header. Lenis reads the document's CSS scroll-padding-top (header + 8px) itself, so no extra offset
 * is passed (adding -header would count the header twice). Without Lenis the native jump uses the same scroll-padding.
 */
export function scrollToEl(el: HTMLElement, duration = 1.2): boolean {
  if (!lenis) return false
  lenis.scrollTo(el, { duration, force: true })
  return true
}

export const stopScroll = () => lenis?.stop()
export const startScroll = () => lenis?.start()
