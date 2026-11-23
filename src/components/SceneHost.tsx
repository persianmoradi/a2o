import { Component, lazy, Suspense, useEffect, useState, type ReactNode, type RefObject } from 'react'
import { hasWebGL } from '../lib/env'

export const HeroScene = lazy(() => import('../scene/HeroScene'))

export class Boundary extends Component<{ onError: () => void; children: ReactNode }, { bad: boolean }> {
  state = { bad: false }
  static getDerivedStateFromError() { return { bad: true } }
  componentDidCatch() { this.props.onError() }
  render() { return this.state.bad ? null : this.props.children }
}

/** true while the element is within `margin` of the viewport (true when IntersectionObserver is missing) */
export function useNear(ref: RefObject<Element | null>, margin = '0px') {
  const [near, setNear] = useState(typeof IntersectionObserver === 'undefined')
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => setNear(e.isIntersecting), { rootMargin: margin })
    io.observe(el)
    return () => io.disconnect()
  }, [ref, margin])
  return near
}

/** WebGL availability + failure state for the hero canvas */
export function useWebGL() {
  const [webgl] = useState(hasWebGL)
  const [failed, setFailed] = useState(false)
  return { use3d: webgl && !failed, fail: () => setFailed(true) }
}

export { Suspense }
