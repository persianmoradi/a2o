import { useEffect } from 'react'
import { MotionConfig } from 'motion/react'
import { company, projects } from '../content'
import { initScroll } from '../lib/scroll'
import { navigate, onLinkClick } from '../lib/router'
import { Footer } from './Footer'
import { Header } from './Header'
import { Photo } from './Photo'
import { Label, Mask, Ph, Reveal } from './ui'

export function CasePage({ slug }: { slug: string }) {
  const items = projects.items
  const i = items.findIndex((c) => c.slug === slug)
  const c = items[i]
  const next = items[(i + 1) % items.length]

  useEffect(() => initScroll(), [])
  // unknown slug: back to the carousel
  useEffect(() => { if (!c) navigate('/#projekter', { replace: true }) }, [c])
  useEffect(() => {
    if (!c) return
    const prev = document.title
    document.title = `${c.type} · ${c.partner} | ${company.name}`
    return () => { document.title = prev }
  }, [c])
  if (!c) return null

  const meta = [['Samarbejdspartner', c.partner], ['Sted', c.place], ['År', c.year]].filter((m): m is [string, string] => !!m[1])
  const link = (href: string) => ({ href, onClick: (e: React.MouseEvent<HTMLAnchorElement>) => onLinkClick(e, href) })

  return (
    <MotionConfig reducedMotion="user">
      <Header home={false} />
      <main id="main" className="pt-[var(--header-h)]">
        <article aria-labelledby="case-h">
          <section className="bg-paper pt-8 pb-12 lg:pt-12 lg:pb-16">
            <div className="wrap">
              <a {...link('/#projekter')} className="t-mono link mb-8 inline-flex min-h-11 items-center text-navy">← Alle projekter</a>
              <div className="grid12 items-end gap-y-8">
                <div className="col-span-12 lg:col-span-8">
                  <Label>Udvalgt projekt</Label>
                  <Mask as="h2" className="t-h2"><span id="case-h">{c.type}</span></Mask>
                  <Reveal i={2} className="t-lead mt-4">{c.partner}</Reveal>
                  {c.placeholder && <Reveal i={3} className="mt-5"><Ph>Pladsholder · indhold følger</Ph></Reveal>}
                </div>
                <dl className="col-span-12 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 border-t border-navy pt-4 lg:col-span-4">
                  {meta.map(([k, v]) => (
                    <div key={k} className="contents">
                      <dt className="t-mono text-ink-muted">{k}</dt>
                      <dd className="font-semibold">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </section>

          <div className="wrap">
            <Photo img={c.img} ratio="aspect-[4/3] lg:aspect-[16/9]" sizes="(min-width:1024px) 78vw, 100vw" />
          </div>

          <section className="bg-paper pad-y">
            <div className="wrap grid12 gap-y-12">
              <div className="col-span-12 lg:col-span-7">
                <Reveal as="p" className="t-lead">{c.intro}</Reveal>
              </div>
              <div className="col-span-12 lg:col-span-4 lg:col-start-9">
                <Reveal as="h3" className="t-mono mb-4 text-signal-ink">Hvad vi leverede</Reveal>
                <ul className="border-t border-line">
                  {c.scope.map((s, k) => <Reveal as="li" key={s} i={k} className="border-b border-line py-4">{s}</Reveal>)}
                </ul>
              </div>
            </div>
            {c.gallery && c.gallery.length > 0 && (
              <div className="wrap mt-16 grid gap-4 sm:grid-cols-2">
                {c.gallery.map((g) => <Photo key={g.name} img={g} ratio="aspect-[4/3]" sizes="(min-width:640px) 40vw, 100vw" />)}
              </div>
            )}
          </section>

          <section className="on-navy bg-navy pad-y text-on-navy">
            <div className="wrap flex flex-col items-start gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <Label dark>Næste skridt</Label>
                <Mask as="h2" className="t-h2"><span>Har I et lignende projekt?</span></Mask>
              </div>
              <a {...link('/#kontakt')} className="btn">Tag fat i os <span aria-hidden className="arr">→</span></a>
            </div>
          </section>

          <nav aria-label="Projektnavigation" className="bg-paper-2">
            <div className="wrap flex flex-wrap items-center justify-between gap-x-8 gap-y-2 py-6">
              <a {...link('/#projekter')} className="t-mono link inline-flex min-h-11 items-center">← Alle projekter</a>
              <a {...link(`/projekter/${next.slug}`)} className="t-mono link inline-flex min-h-11 items-center">Næste projekt: {next.type} →</a>
            </div>
          </nav>
        </article>
      </main>
      <Footer home={false} />
    </MotionConfig>
  )
}
