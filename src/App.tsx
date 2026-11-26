import { useEffect } from 'react'
import { MotionConfig } from 'motion/react'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { About, Crew, Services } from './components/Story'
import { Projects } from './components/Projects'
import { Team } from './components/Team'
import { Contact } from './components/Contact'
import { Footer } from './components/Footer'
import { getLenis, headerHeight, initScroll, scrollToEl } from './lib/scroll'

export default function App() {
  useEffect(() => initScroll(), [])
  // in-page links: Lenis glides to the section just below the header; with Lenis off the native jump uses CSS scroll-padding
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.('a[href^="#"]') as HTMLAnchorElement | null
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button || a.hash.length < 2) return
      const el = document.getElementById(decodeURIComponent(a.hash.slice(1)))
      if (!el) return
      const lenis = getLenis()
      if (!lenis) return
      e.preventDefault()
      if (el.id === 'top') lenis.scrollTo(0, { duration: 1.4, force: true })
      else scrollToEl(el)
      history.pushState(null, '', a.hash)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])
  // deep link: re-apply once layout and fonts have settled, unless the visitor already scrolled
  useEffect(() => {
    const id = location.hash.length > 1 ? decodeURIComponent(location.hash.slice(1)) : ''
    if (!id) return
    let moved = false
    const stop = () => { moved = true }
    for (const ev of ['wheel', 'touchstart', 'keydown', 'pointerdown']) addEventListener(ev, stop, { passive: true, once: true })
    const go = () => { const el = document.getElementById(id); if (el && !moved) scrollTo({ top: el.getBoundingClientRect().top + scrollY - headerHeight() - 8, behavior: 'instant' }) }
    document.fonts?.ready.then(go)
    const t = setTimeout(go, 500)
    return () => { clearTimeout(t); for (const ev of ['wheel', 'touchstart', 'keydown', 'pointerdown']) removeEventListener(ev, stop) }
  }, [])
  return (
    <MotionConfig reducedMotion="user">
      <a href="#main" className="fixed top-2 left-2 z-[60] -translate-y-24 bg-navy px-4 py-3 font-semibold text-paper focus:translate-y-0">Gå til indhold</a>
      <Header />
      <main id="main">
        <Hero />
        <About />
        <Services />
        <Crew />
        <Projects />
        <Team />
        <Contact />
      </main>
      <Footer />
    </MotionConfig>
  )
}
