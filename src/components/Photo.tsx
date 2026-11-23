import { useRef } from 'react'
import { motion } from 'motion/react'
import type { Img } from '../content'
import { reducedMotion } from '../lib/env'
import { Reveal, useShown } from './ui'

const rm = reducedMotion()

type Props = {
  img: Img
  /** Tailwind aspect-ratio classes for the frame, e.g. "aspect-[4/5] lg:aspect-[5/6]" */
  ratio: string
  sizes: string
  /** override of the content focal point */
  pos?: string
  /** subtle zoom on hover-capable devices (parent needs the `group` class) */
  hoverZoom?: boolean
  i?: number
  className?: string
}

/** Photo frame: space is reserved by the ratio box (no layout shift); the image eases scale 1.05 -> 1 once when it enters. Always lazy. */
export function Photo({ img, ratio, sizes, pos, hoverZoom, i, className = '' }: Props) {
  const ref = useRef<HTMLImageElement>(null)
  const on = useShown(ref)
  const srcSet = img.widths.map((w) => `/photos/${img.name}-${w}.webp ${w}w`).join(', ')
  const src = `/photos/${img.name}-${img.widths[img.widths.length > 1 ? 1 : 0]}.webp`
  return (
    <Reveal i={i} className={`${ratio} overflow-hidden bg-paper-2 ${className}`}>
      <div className={`h-full w-full ${hoverZoom ? '[@media(hover:hover)]:transition-transform [@media(hover:hover)]:duration-[600ms] [@media(hover:hover)]:ease-out [@media(hover:hover)]:group-hover:scale-[1.03]' : ''}`}>
        <motion.img
          ref={ref} src={src} srcSet={srcSet} sizes={sizes} width={img.w} height={img.h} alt={img.alt}
          loading="lazy" decoding="async" className="h-full w-full object-cover" style={{ objectPosition: pos ?? img.pos }}
          initial={rm ? false : { scale: 1.05 }} animate={{ scale: on ? 1 : 1.05 }} transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </Reveal>
  )
}
