import { team, type Member } from '../content'
import { Photo } from './Photo'
import { Label, Mask, Reveal } from './ui'

const initials = (n: string) => n.split(/\s+/).filter(Boolean).map((w) => w[0]).join('').toUpperCase()
const corners = ['left-0 top-0', 'right-0 top-0', 'left-0 bottom-0', 'right-0 bottom-0'] as const
const cornerPath = ['M0.75 8V0.75H8', 'M0 0.75H7.25V8', 'M0.75 0V7.25H8', 'M0 7.25H7.25V0'] as const

/** Portrait frame. Renders the photo when a member has one, otherwise a navy tile with initials (same ratio, same corner brackets). */
function Portrait({ m }: { m: Member }) {
  return (
    <div className="relative">
      {m.photo ? (
        <Photo img={m.photo} ratio="aspect-[4/5]" sizes="(min-width:640px) 420px, 136px" />
      ) : (
        <Reveal className="grid aspect-[4/5] place-items-center overflow-hidden bg-navy">
          <span aria-hidden className="text-[clamp(2.5rem,12vw,3.5rem)] leading-none font-extrabold text-paper sm:text-[clamp(5rem,9vw,8rem)]">{initials(m.name)}</span>
        </Reveal>
      )}
      {corners.map((c, k) => (
        <svg key={c} aria-hidden width="8" height="8" viewBox="0 0 8 8" className={`pointer-events-none absolute ${c}`} fill="none">
          <path d={cornerPath[k]} stroke="#FF761E" strokeWidth="1.5" />
        </svg>
      ))}
    </div>
  )
}

export function Team() {
  return (
    <section id="ledelse" aria-labelledby="le-h" className="relative bg-paper pad-y text-navy">
      <div className="wrap grid12 gap-y-12">
        <div className="col-span-12 lg:col-span-4">
          <Label>{team.label}</Label>
          <Mask className="t-h2"><span id="le-h">{team.title}</span></Mask>
          <Reveal i={2} className="t-lead mt-4">{team.lead}</Reveal>
        </div>
        <ul className="col-span-12 grid gap-6 sm:grid-cols-2 sm:gap-8 lg:col-span-8 lg:col-start-5">
          {team.members.map((m, i) => (
            <Reveal as="li" key={m.name} i={i} className="grid min-w-0 grid-cols-[8.5rem_minmax(0,1fr)] items-start gap-4 sm:block">
              <Portrait m={m} />
              <div className="min-w-0">
                <h3 className="t-h3 sm:mt-5">{m.name}</h3>
                <p className="t-mono mt-1 text-ink-muted">{m.role}</p>
                <p className="mt-2 sm:mt-3"><a className="link inline-flex min-h-11 items-center" href={m.tel}>Tlf. {m.phone}</a></p>
                <p><a className="link inline-flex min-h-11 items-center [overflow-wrap:anywhere]" href={`mailto:${m.email}`}>{m.email}</a></p>
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}
