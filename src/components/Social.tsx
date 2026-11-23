import { company } from '../content'

const paths = {
  Instagram: <path transform="translate(1.4 1.4) scale(.88)" fillRule="evenodd" d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9a5.5 5.5 0 0 1-5.5 5.5h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm0 2A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4h-9ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm5.25-3.3a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4Z" />,
  Facebook: <path d="M14 8.5V7c0-.8.4-1.2 1.3-1.2H17V3h-2.4C12 3 10.8 4.6 10.8 6.8v1.7H8.5V12h2.3v9H14v-9h2.6l.4-3.5H14Z" />,
  LinkedIn: (
    <>
      <path d="M4 9.5h3.2V20H4z" />
      <circle cx="5.6" cy="5.6" r="1.8" />
      <path d="M10 9.5h3v1.5c.6-1 1.7-1.7 3.2-1.7 2.6 0 3.8 1.6 3.8 4.4V20h-3.2v-5.6c0-1.4-.5-2.2-1.7-2.2-1.3 0-1.9.9-1.9 2.2V20H10z" />
    </>
  ),
}

/** Social icon buttons (44px targets, inline SVG, no icon library). `dark` = on navy surface. */
export function SocialLinks({ dark = false, className = '' }: { dark?: boolean; className?: string }) {
  const tone = dark ? 'border-on-navy/30 text-on-navy hover:bg-signal hover:text-navy hover:border-signal' : 'border-line text-navy hover:bg-navy hover:text-paper hover:border-navy'
  return (
    <ul className={`flex items-center gap-3 ${className}`}>
      {([company.instagram, company.facebook, company.linkedin] as const).map((l) => (
        <li key={l.href}>
          <a href={l.href} target="_blank" rel="noopener noreferrer" aria-label={l.label}
            className={`inline-flex size-11 items-center justify-center rounded-[2px] border transition-colors duration-150 ${tone}`}>
            <svg aria-hidden viewBox="0 0 24 24" width="20" height="20" fill="currentColor">{paths[l.label as keyof typeof paths]}</svg>
          </a>
        </li>
      ))}
    </ul>
  )
}
