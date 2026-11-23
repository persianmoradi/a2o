export const reducedMotion = (): boolean =>
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

export const isDesktop = (): boolean => matchMedia('(min-width: 1024px)').matches
export const isFinePointer = (): boolean => matchMedia('(hover: hover) and (pointer: fine)').matches

/** ?webgl=off forces the SVG fallback (demo/test flag). */
let glProbe: boolean | undefined
export function hasWebGL(): boolean {
  if (new URLSearchParams(location.search).get('webgl') === 'off') return false
  return (glProbe ??= probeGL())
}
function probeGL(): boolean {
  try {
    const c = document.createElement('canvas')
    const gl = (c.getContext('webgl2') || c.getContext('webgl')) as WebGLRenderingContext | null
    if (!gl) return false
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return true
  } catch {
    return false
  }
}
