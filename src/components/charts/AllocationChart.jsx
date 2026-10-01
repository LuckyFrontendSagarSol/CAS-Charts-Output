import { useState } from 'react'
import { PieChart } from 'lucide-react'
import useElementWidth from '@/hooks/useElementWidth'
import { VizCard, ViewToggle, ChartTooltip, LegendKey } from './VizParts'
import {
  CHART, REMAINDER_COLOR, REMAINDER_LABEL, TH, TD, buildAllocation, deltaPp, inkOn, isNum, pct,
  text,
} from './casOutputData'

/**
 * Portfolio Snapshot, stacked view — Equity / Debt / Diversifier, the
 * portfolio today against the recommended model.
 *
 * Two 100% stacked bars, one above the other, so each group's segment lines up
 * with its own target directly below it. Each segment is its family's colour,
 * the same in both bars — which bar it is says "today" or "recommended". The
 * bar and donut views of the same data are in AllocationViews.jsx.
 *
 * Every segment is labelled to one decimal: inside when the text fits, above
 * the bar when the segment is too thin for it.
 *
 * The groups need not add up to 100%: holdings with no macro role belong to
 * none of them. That part is drawn as its own neutral "Not in any group"
 * segment rather than stretched away, so the bar never overstates a group.
 */

/** A segment narrower than this cannot hold "90.6%" — its label goes above. */
const INSIDE_LABEL_PX = 44

const isZero = value => !isNum(value) || Math.abs(value) < 0.0005

export default function AllocationChart({ snapshot, delay }) {
  const [view, setView] = useState('chart')
  const [tip, setTip] = useState(null)
  const [ref, width, node] = useElementWidth()
  const { groups, hasTarget, bars } = buildAllocation(snapshot)

  const show = (event, bar, segment) => {
    const box = node.getBoundingClientRect()
    const mark = event.currentTarget.getBoundingClientRect()
    setTip({
      x: mark.left - box.left + mark.width / 2,
      y: mark.top - box.top,
      title: segment.label,
      rows: [{ label: bar.name.toLowerCase(), value: pct(segment.value), color: segment.color }],
    })
  }

  return (
    <VizCard
      title="Stacked view"
      subtitle="Each bar is the whole portfolio, split by group."
      icon={PieChart}
      delay={delay}
      actions={<ViewToggle value={view} onChange={setView} />}
    >
      {!groups.length ? (
        <p className="py-8 text-center text-[13px] text-ink-mute">No portfolio snapshot in this output.</p>
      ) : view === 'chart' ? (
        <div ref={ref} className="relative" onMouseLeave={() => setTip(null)}>
          <div className="space-y-5">
            {bars.map(bar => {
              const total = bar.segments.reduce((sum, segment) => sum + segment.value, 0)
              const fits = segment => width > 0 && total > 0 && (width * segment.value) / total >= INSIDE_LABEL_PX
              const anyOutside = bar.segments.some(segment => !fits(segment))
              return (
                <div key={bar.name}>
                  <p className="font-display text-[12px] font-bold uppercase tracking-[0.08em] text-ink-soft">
                    {bar.name}
                  </p>
                  {/* Room above the bar for the labels of segments too thin to hold one. */}
                  <div
                    className={`flex h-9 w-full gap-[2px] ${anyOutside ? 'mt-5' : 'mt-1.5'}`}
                    role="img"
                    aria-label={`${bar.name}: ${bar.segments.map(s => `${s.label} ${pct(s.value)}`).join(', ')}`}
                  >
                    {bar.segments.length ? bar.segments.map((segment, index) => (
                      <div key={segment.label} className="relative min-w-[3px]" style={{ flexGrow: segment.value, flexBasis: 0 }}>
                        {!fits(segment) && (
                          <span
                            className="pointer-events-none absolute bottom-full left-1/2 mb-0.5 -translate-x-1/2 whitespace-nowrap text-[10.5px] font-semibold tabular-nums"
                            style={{ color: CHART.inkSoft }}
                            aria-hidden="true"
                          >
                            {pct(segment.value)}
                          </span>
                        )}
                        <button
                          type="button"
                          onMouseEnter={event => show(event, bar, segment)}
                          onFocus={event => show(event, bar, segment)}
                          onBlur={() => setTip(null)}
                          aria-label={`${segment.label}, ${bar.name.toLowerCase()} ${pct(segment.value)}`}
                          className={[
                            'grid h-full w-full place-items-center overflow-hidden text-[11.5px] font-bold tabular-nums transition-[filter] hover:brightness-110',
                            index === 0 ? 'rounded-l-[4px]' : '',
                            index === bar.segments.length - 1 ? 'rounded-r-[4px]' : '',
                          ].join(' ')}
                          style={{ background: segment.color, color: segment.remainder ? CHART.inkSoft : inkOn(segment.color) }}
                        >
                          {fits(segment) ? pct(segment.value) : ''}
                        </button>
                      </div>
                    )) : (
                      <div className="grid flex-1 place-items-center rounded-[4px] text-[12px] text-ink-mute" style={{ background: CHART.track }}>Nothing held</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {!hasTarget && (
            <p className="mt-3 text-[12px] text-ink-mute">
              No risk profile row matched this client, so there is no recommended mix to compare with.
            </p>
          )}

          {/* Legend — every group in the bars' order, with both values and the
              change between them. The change is neutral: a rebalance is neither
              a gain nor a loss. */}
          <ul className="mt-5 grid gap-2 @lg:grid-cols-2">
            {groups.map(group => {
              const empty = isZero(group.current) && (!hasTarget || isZero(group.recommended))
              return (
                <li
                  key={group.label}
                  className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 ${empty ? 'opacity-50' : ''}`}
                  style={{ background: CHART.track }}
                >
                  <LegendKey color={group.color} label={group.label} />
                  <span className="whitespace-nowrap text-right text-[12px] tabular-nums" style={{ color: CHART.inkSoft }}>
                    {pct(group.current)}
                    {hasTarget && <> → {pct(group.recommended)}</>}
                    {empty ? (
                      <span className="ml-2">no holdings</span>
                    ) : hasTarget && isNum(group.current) && isNum(group.recommended) && (
                      <span className="ml-2 font-semibold">{deltaPp(group.recommended - group.current)}</span>
                    )}
                  </span>
                </li>
              )
            })}
            {bars.some(bar => bar.segments.some(s => s.remainder)) && (
              <li className="flex items-center justify-between gap-3 rounded-lg px-3 py-2" style={{ background: CHART.track }}>
                <LegendKey color={REMAINDER_COLOR} label={REMAINDER_LABEL} />
                <span className="text-[12px]" style={{ color: CHART.inkSoft }}>no macro role</span>
              </li>
            )}
          </ul>
          <ChartTooltip tip={tip} width={width} />
        </div>
      ) : (
        <div className="overflow-x-auto scroll-slim">
          <table className="w-full min-w-[460px] border-separate border-spacing-0">
            <thead>
              <tr>
                <th className={TH}>Group</th>
                <th className={`${TH} text-right`}>Current</th>
                <th className={`${TH} text-right`}>Recommended</th>
                <th className={TH}>Interpretation</th>
              </tr>
            </thead>
            <tbody>
              {groups.map(group => (
                <tr key={group.label}>
                  <td className={`${TD} text-ink`}><LegendKey color={group.color} label={group.label} /></td>
                  <td className={`${TD} text-right tabular-nums`}>{pct(group.current)}</td>
                  <td className={`${TD} text-right tabular-nums`}>{pct(group.recommended)}</td>
                  <td className={`${TD} min-w-[180px]`}>{text(group.interpretation)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </VizCard>
  )
}
