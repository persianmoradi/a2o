import type { CSSProperties } from 'react'
import { FRAME, W } from '../scene/timeline'

type R = readonly [number, number]
/** linear window over --p, expressed in CSS so the SVG never re-renders. Windows come from scene/timeline.ts. */
const lin = ([a, b]: R) => `clamp(0, calc((var(--p) - ${a}) / ${b - a}), 1)`
const io = (i: R, o?: R) => (o ? `calc(${lin(i)} * (1 - ${lin(o)}))` : lin(i))
const fade = (i: R, o?: R): CSSProperties => ({ opacity: io(i, o), transition: 'opacity 150ms' })
/** scale about an anchor point (SVG user units) */
const grow = (axis: 'X' | 'Y', origin: string, i: R, o?: R): CSSProperties => ({ transform: `scale${axis}(${io(i, o)})`, transformOrigin: origin })

const STAKE_LINE: R = W.line
const COLS = [215, 330, 530, 645]
const GRADE = 330

/** Elevation drawing mirroring the 3D scene's build sequence (same timing windows, same palette). Driven by the --p custom property. */
export function SiteIllustration({ fixed, align = 'xMaxYMid' }: { fixed: number; align?: string }) {
  const storey = (s: number) => FRAME[s]
  return (
    <svg viewBox="0 0 800 500" className="h-full w-full" role="presentation" aria-hidden="true" preserveAspectRatio={`${align} meet`} style={{ '--p': fixed } as CSSProperties}>
      <g stroke="#0B264E" strokeOpacity="0.25" strokeWidth="1"><path d="M40 330H760M40 380H760M40 430H760M40 480H760" /></g>
      <rect x="40" y="330" width="720" height="50" fill="#C4B59C" />
      <rect x="40" y="380" width="720" height="50" fill="#A8916F" />
      <rect x="40" y="430" width="720" height="50" fill="#D6C9B0" />

      {/* survey line at grade: fades once the pit opens (no ghost volume) */}
      <path d="M150 328H690" stroke="#FF761E" strokeWidth="2" strokeDasharray="6 5" fill="none" style={{ opacity: `calc(0.8 * (1 - ${lin(STAKE_LINE)}))` }} />
      {/* surveyor */}
      <g style={fade([0, 0.01], W.surveyor)}>
        <path d="M110 330L120 292L130 330M120 292V284" stroke="#8E97A3" strokeWidth="2" fill="none" />
        <rect x="140" y="296" width="8" height="34" fill="#0B264E" /><circle cx="144" cy="291" r="5" fill="#E9E6DD" />
      </g>

      {/* pit (trapezoid cut) + sewer trench; backfill covers both */}
      <g style={grow('Y', `0px ${GRADE}px`, W.pit)}>
        <path d="M170 330L205 368H655L690 330Z" fill="#E3DED3" />
      </g>
      <g style={grow('Y', `0px ${GRADE}px`, W.trench)}><rect x="86" y="330" width="40" height="70" fill="#E3DED3" /></g>
      <g style={fade(W.pipes)} fill="none" stroke="#8E97A3" strokeWidth="3">
        {Array.from({ length: 6 }, (_, i) => <circle key={i} cx="106" cy={346 + i * 9} r="3.5" />)}
        <circle cx="106" cy="392" r="5" />
        {Array.from({ length: 5 }, (_, i) => <circle key={`b${i}`} cx={250 + i * 90} cy="378" r="6" />)}
      </g>
      {/* excavator (drives in, digs, drives off) */}
      <g style={fade([W.excIn[0], W.excIn[0] + 0.015], W.excOut)}>
        <rect x="60" y="312" width="52" height="18" rx="6" fill="#1F2F47" />
        <rect x="66" y="288" width="36" height="24" fill="#0B264E" /><rect x="86" y="292" width="14" height="14" fill="#31506F" />
        <path d="M98 296L146 270L170 318" stroke="#0B264E" strokeWidth="6" fill="none" strokeLinejoin="round" />
      </g>
      <g style={fade(W.spoil, W.backfill)}><path d="M300 330Q330 298 360 330Z" fill="#A98A66" /></g>

      {/* row 2: pads + gravel, buried by the backfill, then slab + rebar */}
      <g style={fade(W.pads)}>
        {COLS.map((x) => <rect key={x} x={x - 22} y="342" width="44" height="26" fill="#C9C4B8" />)}
        <rect x="205" y="350" width="450" height="18" fill="#B7B1A5" style={{ opacity: lin(W.gravel) }} />
      </g>
      <g style={fade(W.backfill)}><path d="M170 330L205 368H655L690 330ZM86 330V400H126V330Z" fill="#C4B59C" /></g>
      <g style={grow('Y', `0px ${GRADE + 10}px`, W.slab)}>
        <rect x="200" y="320" width="460" height="20" fill="#C9C4B8" />
        <path d="M206 330H654" stroke="#8E97A3" strokeWidth="1.5" strokeDasharray="8 4" />
      </g>

      {/* row 3: kerb + gravel apron, then pavers */}
      <g style={fade(W.kerb)}>
        <rect x="128" y="322" width="12" height="9" fill="#C9C4B8" /><rect x="720" y="322" width="12" height="9" fill="#C9C4B8" />
        <rect x="140" y="328" width="580" height="3" fill="#B7B1A5" style={{ opacity: `calc(1 - ${lin(W.pavers)})` }} />
      </g>
      <rect x="140" y="326" width="580" height="5" fill="#B7B1A5" style={grow('X', '140px 0px', W.pavers)} />

      {/* row 4: crew in hi-vis, dumper + cabin */}
      <g style={fade(W.crewIn, W.crewOut)}>
        {[122, 330, 480, 700].map((x) => (
          <g key={x}><rect x={x - 5} y="304" width="10" height="26" fill="#FF761E" /><circle cx={x} cy="298" r="5" fill="#E9E6DD" /></g>
        ))}
        <rect x="718" y="300" width="36" height="30" fill="#0B264E" />
      </g>

      {/* tower crane: mast, jib, counterweight */}
      <g style={grow('Y', `0px ${GRADE}px`, W.craneIn, W.craneOut)} stroke="#8E97A3" strokeWidth="3" fill="none">
        <path d="M742 330V70M752 330V70" /><path d="M742 330L752 300L742 270L752 240L742 210L752 180L742 150L752 120" strokeWidth="1.5" />
        <path d="M692 68H800M740 68L747 44L754 68M747 44L795 68M747 44L700 68" strokeWidth="2" />
        <rect x="700" y="66" width="14" height="8" fill="#0B264E" stroke="none" />
      </g>

      {/* scaffold hatch, lift by lift */}
      <g style={grow('Y', `0px ${GRADE}px`, [W.scaffoldIn, W.scaffoldIn + 0.1], W.scaffoldOut)} stroke="#8E97A3" strokeWidth="1.2" fill="none">
        {Array.from({ length: 9 }, (_, i) => <path key={i} d={`M${180 + i * 59} 330V140`} />)}
        {[330, 270, 210, 150].map((y) => <path key={y} d={`M180 ${y}H652`} />)}
        <path d="M180 330L240 270L300 330L360 270L420 330" />
      </g>

      {/* frame: columns + slabs per storey, then facade */}
      {[0, 1, 2].map((s) => {
        const f = storey(s), y0 = 330 - s * 60
        return (
          <g key={s}>
            <g style={grow('Y', `0px ${y0}px`, f.col)} stroke="#C9C4B8" strokeWidth="8" fill="none">{COLS.map((x) => <path key={x} d={`M${x} ${y0}V${y0 - 56}`} />)}</g>
            <g style={grow('Y', `0px ${y0 - 54}px`, f.slab)}><rect x="200" y={y0 - 60} width="460" height="8" fill="#C9C4B8" /></g>
            <g style={grow('Y', `0px ${y0}px`, f.facade)}>
              <rect x="222" y={y0 - 54} width="100" height="52" fill="#CFC9BC" />
              <rect x="338" y={y0 - 54} width="184" height="52" fill="#31506F" />
              <rect x="538" y={y0 - 54} width="100" height="52" fill="#CFC9BC" />
            </g>
          </g>
        )
      })}

      {/* roof, parapet, orange fascia drawn left to right */}
      <g style={fade(W.roof)}>
        <rect x="196" y="140" width="468" height="10" fill="#3C4A5F" /><rect x="196" y="128" width="468" height="12" fill="#CFC9BC" />
      </g>
      <rect x="200" y="162" width="460" height="10" fill="#FF761E" style={grow('X', '200px 0px', W.fascia)} />
      <g style={fade(W.canopy)}><rect x="415" y="283" width="60" height="5" fill="#C9C4B8" /><rect x="425" y="288" width="40" height="42" fill="#31506F" /></g>

      {/* planting */}
      <g style={fade(W.trees)}>
        {[[96, 270], [756, 280], [40, 290]].map(([x, y]) => (
          <g key={x}><rect x={x - 3} y={y + 20} width="6" height={310 - y} fill="#8A6F55" /><circle cx={x} cy={y} r="26" fill="#A9B58F" /></g>
        ))}
      </g>
    </svg>
  )
}
