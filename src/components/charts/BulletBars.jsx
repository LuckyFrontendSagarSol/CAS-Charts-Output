import { ChevronRight } from 'lucide-react'
import { LegendKey } from './VizParts'
import { CHART, isNum, niceTicks, pct } from './casOutputData'

/**
 * One bar per row on a shared scale: the solid bar is today, in the row's
 * family colour, and a dark upright tick marks the target. Fill says "when",
 * colour says "what" — there is no second bar in a second colour to decode.
 *
 *   rows = [{ key, label, sublabel?, current, target, color, badge?, onClick? }]
 *
 * A row that holds nothing and is meant to hold nothing (0% against a 0%
 * target) collapses to one thin dimmed line: it is worth knowing the row
 * exists, not worth a full bar's height.
 */

const isZero = value => !isNum(value) || Math.abs(value) < 0.0005

export default function BulletBars({ rows, targetLabel = 'Target' }) {
  const hasTarget = rows.some(row => isNum(row.target))
  // One scale for all rows: the largest value, rounded up to the next 10%.
  const max = Math.max(0.1, ...rows.flatMap(row => [row.current, row.target].filter(isNum)))
  const domain = Math.min(1, Math.ceil(max * 10 - 1e-9) / 10)
  const ticks = niceTicks(0, domain, 4)
  const at = value => `${Math.min(Math.max(value / domain, 0), 1) * 100}%`

  return (
    <div>
      <ul className="space-y-0.5">
        {rows.map(row => {
          const Tag = row.onClick ? 'button' : 'div'
          const interactive = row.onClick ? { type: 'button', onClick: row.onClick } : {}
          const hover = row.onClick ? 'transition-colors hover:bg-beige/50' : ''

          if (isZero(row.current) && isNum(row.target) && isZero(row.target)) {
            return (
              <li key={row.key}>
                <Tag {...interactive} className={`group flex w-full items-center justify-between gap-3 rounded-lg px-1 py-1.5 text-left opacity-50 ${hover}`}>
                  <span className="truncate font-display text-[12.5px] font-bold text-ink" title={row.label}>{row.label}</span>
                  <span className="shrink-0 text-[11.5px] tabular-nums" style={{ color: CHART.inkSoft }}>
                    {pct(0)} · {targetLabel.toLowerCase()} {pct(0)} · no holdings
                  </span>
                </Tag>
              </li>
            )
          }

          return (
            <li key={row.key}>
              <Tag {...interactive} className={`group block w-full rounded-lg px-1 py-2.5 text-left ${hover}`}>
                <span className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="min-w-0">
                    <span className="block truncate font-display text-[13px] font-bold text-ink" title={row.label}>{row.label}</span>
                    {row.sublabel && <span className="block text-[11.5px] text-ink-mute">{row.sublabel}</span>}
                  </span>
                  <span className="flex shrink-0 items-center gap-1">
                    {row.badge}
                    {row.onClick && <ChevronRight size={15} className="text-ink-mute transition-colors group-hover:text-royal" aria-hidden="true" />}
                  </span>
                </span>

                <span className="grid grid-cols-[1fr_6.75rem] items-center gap-x-3">
                  <span className="relative block h-5" aria-hidden="true">
                    <span className="absolute inset-x-0 top-1/2 h-3 -translate-y-1/2 rounded-[4px]" style={{ background: CHART.track }} />
                    {ticks.slice(1).map(tick => (
                      <span key={tick} className="absolute top-1/2 h-3 w-px -translate-y-1/2" style={{ left: at(tick), background: CHART.grid }} />
                    ))}
                    {isNum(row.current) && row.current > 0 && (
                      <span
                        className="absolute left-0 top-1/2 h-3 -translate-y-1/2 rounded-r-[4px] transition-[filter] group-hover:brightness-110"
                        style={{ width: at(row.current), minWidth: 3, background: row.color }}
                      />
                    )}
                    {isNum(row.target) && (
                      <span
                        className="absolute top-0 h-5 w-[3px] -translate-x-1/2 rounded-full"
                        style={{ left: at(row.target), background: CHART.target, boxShadow: `0 0 0 1.5px ${CHART.card}` }}
                      />
                    )}
                  </span>
                  {/* `relative` anchors the sr-only labels here — without it they resolve against the page and stretch the document. */}
                  <span className="relative text-right text-[12px] tabular-nums">
                    <span className="sr-only">Current </span>
                    <span className="font-semibold text-ink">{pct(row.current)}</span>
                    {hasTarget && (
                      <span style={{ color: CHART.inkSoft }}>
                        <span className="sr-only"> {targetLabel} </span>
                        <span aria-hidden="true"> / </span>
                        {pct(row.target)}
                      </span>
                    )}
                  </span>
                </span>
              </Tag>
            </li>
          )
        })}
      </ul>

      {/* Scale under the bars, then what the bar and the tick mean. */}
      <div className="mt-1 grid grid-cols-[1fr_6.75rem] gap-x-3 px-1">
        <div className="relative h-4">
          {ticks.map(tick => (
            <span
              key={tick}
              className={`absolute text-[10.5px] tabular-nums text-ink-mute ${tick === 0 ? '' : tick === domain ? '-translate-x-full' : '-translate-x-1/2'}`}
              style={{ left: at(tick) }}
            >
              {pct(tick, 0)}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
        <LegendKey color={CHART.inkSoft} label="Current (solid bar)" />
        {hasTarget && <LegendKey color={CHART.target} label={`${targetLabel} (tick)`} shape="tick" />}
      </div>
    </div>
  )
}
