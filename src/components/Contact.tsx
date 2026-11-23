import { useRef, useState, type FormEvent } from 'react'
import { motion } from 'motion/react'
import { company, contact, team } from '../content'
import { submit, validators } from '../lib/contact'
import { SocialLinks } from './Social'
import { EASE, Label, Mask, Reveal } from './ui'

type Field = 'name' | 'email' | 'message'
const meta: Record<Field, { label: string }> = { name: { label: 'Navn' }, email: { label: 'Email' }, message: { label: 'Besked' } }
const inputCls = 'block w-full min-h-[52px] rounded-[2px] border border-on-navy-muted bg-navy-2 px-4 text-[length:var(--fs-body)] text-on-navy placeholder:text-on-navy-muted/70 aria-[invalid=true]:border-l-4 aria-[invalid=true]:border-l-signal'

export function Contact() {
  const [vals, setVals] = useState({ name: '', email: '', message: '', website: '' })
  const [errs, setErrs] = useState<Partial<Record<Field, string>>>({})
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle')
  const refs = { name: useRef<HTMLInputElement>(null), email: useRef<HTMLInputElement>(null), message: useRef<HTMLTextAreaElement>(null) }
  const thanks = useRef<HTMLHeadingElement>(null)

  const check = (f: Field, v = vals[f]) => {
    const e = validators[f](v)
    setErrs((s) => ({ ...s, [f]: e }))
    return e
  }
  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault()
    const bad = (['name', 'email', 'message'] as Field[]).filter((f) => check(f))
    if (bad.length) return refs[bad[0]].current?.focus()
    setState('sending')
    await submit(vals)
    setState('done')
    requestAnimationFrame(() => thanks.current?.focus())
  }
  const field = (f: Field, props: Record<string, unknown>, Tag: 'input' | 'textarea' = 'input') => {
    const common = {
      id: f, name: f, value: vals[f], required: true, noValidate: true,
      'aria-invalid': errs[f] ? true : undefined, 'aria-describedby': errs[f] ? `${f}-err` : undefined,
      onChange: (e: { target: { value: string } }) => { setVals((s) => ({ ...s, [f]: e.target.value })); if (errs[f]) check(f, e.target.value) },
      onBlur: () => check(f), className: inputCls, ...props,
    }
    return (
      <div className="mb-6">
        <label htmlFor={f} className="t-mono mb-2 block text-on-navy-muted">{meta[f].label}</label>
        {Tag === 'input' ? <input ref={refs[f as 'name' | 'email']} {...common} /> : <textarea ref={refs.message} rows={5} {...common} className={`${inputCls} py-3`} />}
        {errs[f] && (
          <motion.p id={`${f}-err`} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.16 }} className="mt-2 border-l-2 border-signal pl-3 text-[length:var(--fs-mono)] font-semibold text-signal"><span aria-hidden>⚠ </span>{errs[f]}</motion.p>
        )}
      </div>
    )
  }
  const detail = (k: string, v: React.ReactNode) => (
    <div className="grid grid-cols-[6rem_1fr] gap-4 border-b border-on-navy/20 py-4"><dt className="t-mono text-on-navy-muted">{k}</dt><dd className="font-semibold">{v}</dd></div>
  )
  return (
    <section id="kontakt" aria-labelledby="ko-h" className="on-navy relative z-10 bg-navy text-on-navy pad-y">
      <div className="wrap">
        <div className="max-w-3xl">
          <Label dark>{contact.label}</Label>
          <Mask className="t-h2"><span id="ko-h">{contact.title}</span></Mask>
          <Reveal delay={0.2} className="t-lead mt-4">{contact.lead}</Reveal>
        </div>
        <div className="grid12 mt-14 gap-y-16">
          <div className="col-span-12 lg:col-span-6" aria-live="polite">
            {state === 'done' ? (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}>
                <h3 ref={thanks} tabIndex={-1} className="t-h3 !text-[clamp(1.5rem,1rem+1.5vw,2.25rem)] outline-none">{contact.thanks}</h3>
                <p className="mt-3">{contact.thanksSub}</p>
                <button type="button" className="link link-on mt-6 min-h-11 font-semibold" onClick={() => { setVals({ name: '', email: '', message: '', website: '' }); setErrs({}); setState('idle') }}>Send en ny besked</button>
              </motion.div>
            ) : (
              <form onSubmit={onSubmit} noValidate>
                {field('name', { type: 'text', autoComplete: 'name', maxLength: 120 })}
                {field('email', { type: 'email', autoComplete: 'email', maxLength: 254 })}
                {field('message', { maxLength: 2000 }, 'textarea')}
                <div inert aria-hidden="true" className="absolute -left-[9999px] size-px overflow-hidden opacity-0">
                  <label>Website<input tabIndex={-1} autoComplete="off" name="website" value={vals.website} onChange={(e) => setVals((s) => ({ ...s, website: e.target.value }))} /></label>
                </div>
                <button type="submit" className="btn" disabled={state === 'sending'}>{state === 'sending' ? 'Sender…' : 'Send besked'}{state !== 'sending' && <span aria-hidden className="arr">→</span>}</button>
              </form>
            )}
          </div>
          <dl className="col-span-12 border-t border-on-navy/20 lg:col-span-5 lg:col-start-8">
            {detail('Telefon', <a className="link inline-flex min-h-11 items-center" href={company.tel}>{company.phone}</a>)}
            {detail('CVR', company.cvr)}
            <div className="grid gap-3 border-b border-on-navy/20 py-4">
              <dt className="t-mono text-on-navy-muted">Ledelse</dt>
              {team.members.map((m) => (
                <dd key={m.name} className="grid">
                  <span className="font-semibold">{m.name} <span className="font-normal text-on-navy-muted">· {m.role}</span></span>
                  <span className="flex flex-wrap items-center gap-x-4">
                    <a className="link inline-flex min-h-11 items-center whitespace-nowrap" href={m.tel}>{m.phone}</a>
                    <a className="link inline-flex min-h-11 items-center [overflow-wrap:anywhere]" href={`mailto:${m.email}`}>{m.email}</a>
                  </span>
                </dd>
              ))}
            </div>
            {detail('Følg os', <SocialLinks dark />)}
          </dl>
        </div>
      </div>
    </section>
  )
}
