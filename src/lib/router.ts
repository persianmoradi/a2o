import { getLenis } from './scroll'

/** Minimal client router: pushState + a custom event so main.tsx re-renders on both navigate() and back/forward. */
export const ROUTE_EVENT = 'a2o:route'

export const caseSlug = (path = location.pathname): string | null => {
  const m = /^\/projekter\/([^/]+)\/?$/.exec(path)
  return m ? decodeURIComponent(m[1]) : null
}

export function navigate(href: string, opts: { replace?: boolean } = {}) {
  if (opts.replace) history.replaceState(null, '', href)
  else history.pushState(null, '', href)
  dispatchEvent(new Event(ROUTE_EVENT))
}

/** Jump to the top instantly after a route change (no smooth glide across pages). */
export function toTop() {
  const l = getLenis()
  if (l) l.scrollTo(0, { immediate: true, force: true })
  scrollTo({ top: 0, behavior: 'instant' })
}

/** Same-tab internal link click handler: lets modified clicks through to the browser. */
export function onLinkClick(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
  if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return
  e.preventDefault()
  navigate(href)
}
