import { useEffect, useRef, useState } from 'react'
import App from './App.tsx'
import { CasePage } from './components/CasePage.tsx'
import { ROUTE_EVENT, caseSlug, toTop } from './lib/router.ts'

/** Tiny router: /projekter/:slug renders the case page, everything else the homepage. Re-renders on navigate() and Back/Forward. */
export function Root() {
  const [path, setPath] = useState(location.pathname)
  const last = useRef(location.pathname)
  useEffect(() => {
    history.scrollRestoration = 'manual'
    const sync = () => {
      // a new page starts at the top, unless the URL carries a hash (the homepage then scrolls itself to that section)
      if (last.current !== location.pathname && !location.hash) toTop()
      last.current = location.pathname
      setPath(location.pathname)
    }
    addEventListener(ROUTE_EVENT, sync)
    addEventListener('popstate', sync)
    // a child may have navigated (redirect) before this listener existed
    if (location.pathname !== last.current) sync()
    return () => { removeEventListener(ROUTE_EVENT, sync); removeEventListener('popstate', sync) }
  }, [])
  const slug = caseSlug(path)
  return slug ? <CasePage key={slug} slug={slug} /> : <App />
}
