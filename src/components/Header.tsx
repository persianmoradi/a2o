import { useEffect, useRef, useState } from 'react'
import { company, nav as links } from '../content'
import { startScroll, stopScroll } from '../lib/scroll'
import { Logo } from './ui'

export function Header() {
  const [open, setOpen] = useState(false)
  const btn = useRef<HTMLButtonElement>(null)
  const nav = useRef<HTMLElement>(null)
  const close = (refocus: boolean) => { setOpen(false); if (refocus) btn.current?.focus({ preventScroll: true }) }
  // smooth scrolling pauses while the menu is open, and always resumes
  useEffect(() => {
    if (!open) return
    stopScroll()
    nav.current?.querySelector('a')?.focus({ preventScroll: true })
    // the page behind the open menu is not reachable by keyboard or assistive tech
    const behind = [...document.querySelectorAll<HTMLElement>('main, footer')]
    behind.forEach((el) => { el.inert = true })
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') close(true) }
    const wide = matchMedia('(min-width: 1024px)')
    const onWide = () => { if (wide.matches) setOpen(false) }
    addEventListener('keydown', esc)
    wide.addEventListener('change', onWide)
    return () => { startScroll(); behind.forEach((el) => { el.inert = false }); removeEventListener('keydown', esc); wide.removeEventListener('change', onWide) }
  }, [open])
  return (
    <header className="fixed inset-x-0 top-0 z-40 isolate h-[var(--header-h)] border-b border-line bg-paper">
      <div className="wrap flex h-full items-center justify-between">
        <a href="#top" className="block h-full" aria-label="A2O Anlæg og Entreprise, til toppen"><Logo size="header" /></a>
        <nav aria-label="Hovedmenu" className="hidden items-center gap-8 lg:flex xl:gap-12">
          {links.map(({ label: l, href: h }) => <a key={h} href={h} className="link inline-flex min-h-11 min-w-11 items-center justify-center font-mono text-[length:var(--fs-nav)] font-medium tracking-[0.12em] text-navy uppercase">{l}</a>)}
        </nav>
        <a href={company.tel} className="t-mono link hidden min-h-11 items-center text-navy lg:inline-flex" aria-label={`Ring til ${company.phone}`}>{company.phone}</a>
        <div className="-mr-2 flex items-center lg:hidden">
          <a href={company.tel} className="t-mono inline-flex min-h-11 min-w-11 items-center justify-center px-3 text-signal-ink" aria-label={`Ring til ${company.phone}`}>Ring</a>
          <button ref={btn} type="button" className="t-mono inline-flex min-h-11 min-w-11 items-center justify-center px-3 text-navy" aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen((o) => !o)}>{open ? 'Luk' : 'Menu'}</button>
        </div>
      </div>
      {open && (
        <nav ref={nav} id="mobile-nav" aria-label="Mobilmenu" className="absolute inset-x-0 top-full border-b border-line bg-paper shadow-[0_12px_24px_-12px_rgb(11_38_78/0.25)]">
          <ul className="wrap py-2">
            {links.map(({ label: l, href: h }) => (
              <li key={h}><a href={h} onClick={() => { close(true); startScroll() }} className="flex min-h-12 items-center border-b border-line font-mono text-[1rem] font-medium tracking-[0.12em] text-navy uppercase last:border-b-0">{l}</a></li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  )
}
