import { about, crew, services } from '../content'
import { Photo } from './Photo'
import { Label, Mask, Reveal } from './ui'

export function About() {
  return (
    <section id="om" aria-labelledby="om-h" className="relative bg-paper pad-y">
      <div className="wrap">
        <div className="grid12 gap-y-12">
          <div className="col-span-12 lg:col-span-7">
            <Label>{about.label}</Label>
            <Mask className="t-h2"><span id="om-h">{about.title}</span></Mask>
            <Reveal i={2} className="t-lead mt-6">{about.lead}</Reveal>
            <Reveal as="p" i={3} className="t-h3 mt-10 max-w-[28ch] border-t border-navy pt-5">{about.pull}</Reveal>
          </div>
          <ul className="col-span-12 border-t border-line lg:col-span-5 lg:col-start-8 lg:self-start">
            {about.rows.map((r, i) => (
              <Reveal as="li" key={r.k} i={i} className="grid grid-cols-[2.5rem_1fr] gap-x-4 border-b border-line py-5">
                <span className="t-mono text-signal-ink">{r.k}</span>
                <p className="max-w-[62ch]"><strong className="font-semibold text-navy">{r.t}</strong> <span className="text-ink-muted">{r.d}</span></p>
              </Reveal>
            ))}
          </ul>
        </div>
        <ul className="mt-16 grid12 items-start gap-y-10 lg:mt-24">
          {about.projects.map((p, i) => (
            <li key={p.img.name} className={i === 0 ? 'col-span-12 lg:col-span-7' : 'col-span-12 lg:col-span-5 lg:mt-24'}>
              <figure>
                <Photo img={p.img} ratio={i === 0 ? 'aspect-[4/5] lg:aspect-[5/6]' : 'aspect-[4/5]'} sizes={i === 0 ? '(min-width:1024px) 54vw, 100vw' : '(min-width:1024px) 38vw, 100vw'} />
                <figcaption className="mt-4 border-t border-line pt-4">
                  <span className="t-mono block text-signal-ink">REFERENCEPROJEKT</span>
                  <span className="t-h3 mt-2 block">{p.caption}</span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export function Services() {
  return (
    <section id="ydelser" aria-labelledby="yd-h" className="relative bg-paper-2 pad-y">
      <div className="wrap">
        <div className="max-w-3xl">
          <Label>{services.label}</Label>
          <Mask className="t-h2"><span id="yd-h">{services.title}</span></Mask>
          <Reveal i={2} className="t-lead mt-4">{services.lead}</Reveal>
        </div>
        <ul className="mt-12 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {services.items.map((s) => (
            <li key={s.n} className="group flex flex-col bg-paper">
              <Photo img={s.img} ratio="aspect-[4/3]" hoverZoom sizes="(min-width:1024px) 26vw, (min-width:640px) 45vw, 100vw" />
              <div className="flex flex-1 flex-col p-6 sm:p-8">
                <span className="font-mono text-[13px] leading-none font-medium tracking-[0.12em] text-signal-ink">{s.n}</span>
                <h3 className="t-h3 mt-4">{s.t}</h3>
                <p className="mt-3 max-w-[52ch] text-ink-muted">{s.d}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export function Crew() {
  return (
    <section id="mandskab" aria-labelledby="ma-h" className="on-navy relative bg-navy pad-y text-on-navy">
      <div className="wrap grid12 gap-y-14">
        <div className="col-span-12 lg:order-2 lg:col-span-4 lg:col-start-9 lg:self-start">
          <Label dark>{crew.label}</Label>
          <Mask className="t-h2 text-on-navy lg:text-[clamp(2.25rem,1rem+2.9vw,5rem)]!"><span id="ma-h">{crew.title}</span></Mask>
          <Reveal as="p" i={2} className="t-mono mt-6 text-signal">{crew.sub}</Reveal>
          <Reveal i={3} className="t-lead mt-4">{crew.lead}</Reveal>
          <dl className="mt-10 border-t border-on-navy/20">
            {crew.lines.map((l, i) => (
              <Reveal key={l.k} i={i} className="grid gap-1 border-b border-on-navy/20 py-5">
                <dt className="t-mono text-on-navy-muted">{l.k}</dt>
                <dd>{l.v}</dd>
              </Reveal>
            ))}
          </dl>
        </div>
        <div className="col-span-12 grid grid-cols-[1.5fr_1fr] items-start gap-3 sm:gap-4 lg:order-1 lg:col-span-8 lg:flex lg:flex-col lg:self-start lg:pr-8">
          <Photo img={crew.b} ratio="aspect-[3/4] lg:aspect-[4/5]" sizes="(min-width:1024px) 40vw, 58vw" className="lg:w-[80%]" />
          <Photo img={crew.a} ratio="aspect-[3/4]" sizes="(min-width:1024px) 26vw, 40vw" className="mt-10 lg:ml-auto lg:-mt-[17vw] lg:w-[48%] lg:border-[6px] lg:border-navy" i={1} />
        </div>
      </div>
    </section>
  )
}
