import { company, nav, team } from '../content'
import { SocialLinks } from './Social'
import { Logo } from './ui'

export function Footer() {
  return (
    <footer className="relative z-10 overflow-hidden bg-paper-2 text-navy">
      <div className="wrap pt-16">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <Logo size="footer" bg="var(--color-paper-2)" />
          <SocialLinks />
        </div>
        <p className="t-mono mt-6 flex flex-wrap items-center gap-x-3 gap-y-0 text-ink-muted">
          <span className="whitespace-nowrap">A2O ANLÆG &amp; ENTREPRISE</span>
          <span className="whitespace-nowrap">CVR {company.cvr}</span>
          <a className="link inline-flex min-h-11 items-center whitespace-nowrap" href={company.tel}>{company.phone}</a>
        </p>
        <ul className="mt-1 grid gap-y-0 text-[0.9375rem]">
          {team.members.map((m) => (
            <li key={m.name} className="flex flex-wrap items-center gap-x-4 gap-y-0 max-sm:grid max-sm:py-1">
              <span className="whitespace-nowrap font-semibold max-sm:pt-2">{m.name} <span className="font-normal text-ink-muted">· {m.role}</span></span>
              <span className="flex flex-wrap items-center gap-x-4">
                <a className="link inline-flex min-h-11 items-center whitespace-nowrap" href={m.tel}>{m.phone}</a>
                <a className="link inline-flex min-h-11 items-center [overflow-wrap:anywhere]" href={`mailto:${m.email}`}>{m.email}</a>
              </span>
            </li>
          ))}
        </ul>
        <nav aria-label="Sidefod" className="mt-8 border-t border-line pt-4">
          <ul className="flex flex-wrap items-center gap-x-8 gap-y-1">
            {nav.map((n) => <li key={n.href}><a className="t-mono link inline-flex min-h-11 items-center" href={n.href}>{n.label}</a></li>)}
            <li className="t-mono text-ink-muted sm:ml-auto">© 2026</li>
          </ul>
        </nav>
      </div>
      <div className="pb-10" />
    </footer>
  )
}
