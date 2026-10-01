import { useRef, useState } from 'react'
import useElementWidth from '@/hooks/useElementWidth'
import { ChartTooltip } from './VizParts'
import { CHART, isNum, niceTicks, pct } from './casOutputData'

/**
 * The column chart — categories along the bottom, percentage up the side, a
 * group of columns per category — drawn in SVG and sized to its container.
 *
 * It takes plain data and knows nothing about CAS outputs; the Portfolio
 * Snapshot and Role Diagnostic wrappers (AllocationViews / RoleViews) feed it.
 * Values are fractions (0.35 = 35%).
 *
 * A column is solid or `hollow`. Solid is today; hollow — a 2px outline in the
 * same colour over the card's own fill — is the target. The pair shares one
 * colour on purpose: colour says which family, fill says when.
 *
 * Category names are drawn as HTML under the plot, not SVG text, so a long
 * name wraps instead of running into its neighbour. When the categories would
 * be squeezed below the minimum band each, the plot keeps its width and the
 * card scrolls sideways — the page never does.
 */

const M = { top: 24, right: 14, bottom: 10, left: 46 }
const MIN_BAND = 68
const HEIGHT = 320
const BAR_GAP = 4
const OUTLINE = 2

/** 0 → the largest value, rounded up to the next 10%. */
const domainFor = values => {
  const max = Math.max(0.1, ...values.filter(isNum))
  return Math.min(1, Math.ceil(max * 10 - 1e-9) / 10)
}

/** A column with only its top corners rounded — it stands on the baseline. */
const columnPath = (x, y, w, base, r = 4) => {
  const radius = Math.min(r, w / 2, Math.max(base - y, 0))
  return `M${x},${base}V${y + radius}Q${x},${y} ${x + radius},${y}H${x + w - radius}Q${x + w},${y} ${x + w},${y + radius}V${base}Z`
}

/**
 *   categories = [{ key, label, note?, onClick?, extra?, bars: [{ name, value, color, hollow? }] }]
 *
 * `extra` is more tooltip rows for that category; `minBand` is the narrowest a
 * category may get before the card scrolls sideways.
 */
export function ColumnChart({ categories, minBand = MIN_BAND }) {
  const [attach, width] = useElementWidth()
  const scrollRef = useRef(null)
  const [hover, setHover] = useState(null)
  const [tip, setTip] = useState(null)

  const count = categories.length
  const chartW = Math.max(width, M.left + M.right + count * minBand)
  const plotW = chartW - M.left - M.right
  const plotH = HEIGHT - M.top - M.bottom
  const band = count ? plotW / count : plotW

  const perGroup = Math.max(1, ...categories.map(c => c.bars.length))
  const barW = Math.max(6, Math.min(64, (band * 0.62 - (perGroup - 1) * BAR_GAP) / perGroup))
  const domain = domainFor(categories.flatMap(c => c.bars.map(b => b.value)))
  const base = M.top + plotH
  const y = value => M.top + plotH * (1 - value / domain)
  const showValues = barW >= 34

  const enter = index => {
    const category = categories[index]
    const top = Math.min(base, ...category.bars.filter(b => isNum(b.value)).map(b => y(b.value)))
    setHover(index)
    setTip({
      x: M.left + band * (index + 0.5) - (scrollRef.current?.scrollLeft ?? 0),
      y: top - 12,
      title: category.label,
      rows: [
        ...category.bars.map(b => ({ label: b.name.toLowerCase(), value: pct(b.value), color: b.color })),
        ...(category.extra ?? []),
      ],
    })
  }
  const leave = () => { setHover(null); setTip(null) }

  return (
    <div ref={attach} className="relative" onMouseLeave={leave}>
      <div ref={scrollRef} className="overflow-x-auto scroll-slim" onScroll={leave}>
        {width > 0 && (
          <>
            <svg width={chartW} height={HEIGHT} className="block" role="group" aria-label="Column chart">
              {niceTicks(0, domain, 5).map(tick => (
                <g key={tick}>
                  <line x1={M.left} x2={M.left + plotW} y1={y(tick)} y2={y(tick)} stroke={tick === 0 ? CHART.zero : CHART.grid} strokeWidth={1} />
                  <text x={M.left - 8} y={y(tick)} dy="0.32em" textAnchor="end" fill={CHART.inkSoft} className="text-[10.5px] tabular-nums">
                    {pct(tick, 0)}
                  </text>
                </g>
              ))}

              {categories.map((category, index) => {
                const groupW = category.bars.length * barW + (category.bars.length - 1) * BAR_GAP
                const x0 = M.left + band * index + (band - groupW) / 2
                return (
                  <g key={category.key}>
                    {hover === index && (
                      <rect x={M.left + band * index + 3} y={M.top - 8} width={band - 6} height={plotH + 8} rx={6} fill={CHART.track} opacity={0.7} />
                    )}
                    {category.bars.map((bar, b) => {
                      if (!isNum(bar.value)) return null
                      const x = x0 + b * (barW + BAR_GAP)
                      const top = bar.value > 0 ? Math.min(y(bar.value), base - 2) : base
                      // The outline is drawn inside the column's footprint, so a
                      // hollow column is exactly as wide and tall as a solid one.
                      const inset = OUTLINE / 2
                      return (
                        <g key={bar.name}>
                          {bar.value > 0 && (bar.hollow ? (
                            <path
                              d={columnPath(x + inset, Math.min(top + inset, base), barW - OUTLINE, base)}
                              fill={CHART.card}
                              stroke={bar.color}
                              strokeWidth={OUTLINE}
                            />
                          ) : (
                            <path d={columnPath(x, top, barW, base)} fill={bar.color} />
                          ))}
                          {showValues && (
                            <text x={x + barW / 2} y={top - 6} textAnchor="middle" fill={CHART.inkSoft} className="text-[10.5px] font-semibold tabular-nums">
                              {pct(bar.value)}
                            </text>
                          )}
                        </g>
                      )
                    })}
                    {/* The whole band is the hover and click target, not the thin column. */}
                    <rect
                      x={M.left + band * index}
                      y={M.top - 8}
                      width={band}
                      height={plotH + 8}
                      fill="transparent"
                      onMouseEnter={() => enter(index)}
                      onFocus={() => enter(index)}
                      onBlur={leave}
                      {...(category.onClick
                        ? {
                            role: 'button',
                            tabIndex: 0,
                            onClick: category.onClick,
                            onKeyDown: event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); category.onClick() } },
                            className: 'cursor-pointer outline-none',
                          }
                        : {})}
                      aria-label={`${category.label}: ${category.bars.map(b => `${b.name} ${pct(b.value)}`).join(', ')}`}
                    />
                  </g>
                )
              })}
            </svg>

            {/* Category names under the plot, one cell per band. */}
            <div className="flex" style={{ paddingLeft: M.left, width: chartW }}>
              {categories.map((category, index) => (
                <div key={category.key} className="px-1 text-center" style={{ width: band }}>
                  <p
                    className={`line-clamp-2 break-words text-[11.5px] leading-tight [overflow-wrap:anywhere] ${hover === index ? 'font-bold text-ink' : 'font-semibold text-ink-soft'}`}
                    title={category.label}
                  >
                    {category.label}
                  </p>
                  {category.note && <div className="mt-1 flex justify-center">{category.note}</div>}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <ChartTooltip tip={tip} width={width} />
    </div>
  )
}
