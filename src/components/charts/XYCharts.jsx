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

/* ── Area chart ────────────────────────────────────────────────────────── */

/**
 * A smooth path through the points that never overshoots them (monotone
 * cubic, Fritsch–Carlson), so a curve between two zero shares stays on zero
 * and never dips below the axis.
 */
function monotonePath(points) {
  const n = points.length
  if (n < 2) return ''
  const dx = []
  const slope = []
  for (let i = 0; i < n - 1; i++) {
    dx[i] = points[i + 1][0] - points[i][0]
    slope[i] = (points[i + 1][1] - points[i][1]) / dx[i]
  }
  const tangent = points.map((_, i) => {
    if (i === 0) return slope[0]
    if (i === n - 1) return slope[n - 2]
    return slope[i - 1] * slope[i] <= 0 ? 0 : (slope[i - 1] + slope[i]) / 2
  })
  for (let i = 0; i < n - 1; i++) {
    if (slope[i] === 0) {
      tangent[i] = 0
      tangent[i + 1] = 0
      continue
    }
    const a = tangent[i] / slope[i]
    const b = tangent[i + 1] / slope[i]
    const h = a * a + b * b
    if (h > 9) {
      const t = 3 / Math.sqrt(h)
      tangent[i] = t * a * slope[i]
      tangent[i + 1] = t * b * slope[i]
    }
  }
  let d = `M${points[0][0]},${points[0][1]}`
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = points[i]
    const [x1, y1] = points[i + 1]
    const third = dx[i] / 3
    d += `C${x0 + third},${y0 + tangent[i] * third} ${x1 - third},${y1 - tangent[i + 1] * third} ${x1},${y1}`
  }
  return d
}

/**
 * Categories along the bottom, percentage up the side, and each series as a
 * smooth filled curve through one point per category. Both curves start and
 * end on the zero line at the plot's edges, so each reads as one shape; the
 * space between the two shapes is the gap between them.
 *
 *   categories = [{ key, label, note?, onClick?, extra? }]
 *   series     = [{ name, color, values: [fraction per category], target? }]
 *
 * A `target` series is drawn the way every CAS chart draws the target: a
 * dashed line, a faint fill and hollow points. Today is a solid line, a
 * stronger fill and solid points.
 */
export function AreaChart({ categories, series, minBand = MIN_BAND, label = 'Area chart' }) {
  const [attach, width] = useElementWidth()
  const scrollRef = useRef(null)
  const [hover, setHover] = useState(null)
  const [tip, setTip] = useState(null)

  const count = categories.length
  const chartW = Math.max(width, M.left + M.right + count * minBand)
  const plotW = chartW - M.left - M.right
  const plotH = HEIGHT - M.top - M.bottom
  const band = count ? plotW / count : plotW
  const domain = domainFor(series.flatMap(s => s.values))
  const base = M.top + plotH
  const y = value => M.top + plotH * (1 - Math.min(Math.max(value, 0), domain) / domain)
  const cx = index => M.left + band * (index + 0.5)

  const shapes = series.map(s => {
    const points = [
      [M.left, base],
      ...s.values.map((value, index) => [cx(index), y(isNum(value) ? value : 0)]),
      [M.left + plotW, base],
    ]
    const line = monotonePath(points)
    return { ...s, line, area: `${line}L${M.left},${base}Z` }
  })

  const enter = index => {
    const top = Math.min(base, ...series.map(s => s.values[index]).filter(isNum).map(y))
    setHover(index)
    setTip({
      x: cx(index) - (scrollRef.current?.scrollLeft ?? 0),
      y: top - 12,
      title: categories[index].label,
      rows: [
        ...series.map(s => ({ label: s.name.toLowerCase(), value: pct(s.values[index]), color: s.color })),
        ...(categories[index].extra ?? []),
      ],
    })
  }
  const leave = () => { setHover(null); setTip(null) }

  return (
    <div ref={attach} className="relative" onMouseLeave={leave}>
      <div ref={scrollRef} className="overflow-x-auto scroll-slim" onScroll={leave}>
        {width > 0 && (
          <>
            <svg width={chartW} height={HEIGHT} className="block" role="group" aria-label={label}>
              {niceTicks(0, domain, 3).map(tick => (
                <g key={tick}>
                  <line x1={M.left} x2={M.left + plotW} y1={y(tick)} y2={y(tick)} stroke={tick === 0 ? CHART.zero : CHART.grid} strokeWidth={1} />
                  <text x={M.left - 8} y={y(tick)} dy="0.32em" textAnchor="end" fill={CHART.inkSoft} className="text-[10.5px] tabular-nums">
                    {pct(tick, 0)}
                  </text>
                </g>
              ))}

              {hover !== null && (
                <line x1={cx(hover)} x2={cx(hover)} y1={M.top - 8} y2={base} stroke={CHART.zero} strokeDasharray="3 3" />
              )}

              {/* Fills first, so neither shape hides the other's outline. */}
              {shapes.map(s => (
                <path key={`${s.name}-area`} d={s.area} fill={s.color} opacity={s.target ? 0.08 : 0.16} />
              ))}
              {shapes.map(s => (
                <path
                  key={`${s.name}-line`}
                  d={s.line}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={2.25}
                  strokeLinejoin="round"
                  strokeDasharray={s.target ? '6 4' : undefined}
                />
              ))}
              {shapes.map(s =>
                s.values.map((value, index) =>
                  isNum(value) ? (
                    <circle
                      key={`${s.name}-${categories[index].key}`}
                      cx={cx(index)}
                      cy={y(value)}
                      r={hover === index ? 5.5 : 4.5}
                      fill={s.target ? CHART.card : s.color}
                      stroke={s.target ? s.color : '#ffffff'}
                      strokeWidth={2}
                    />
                  ) : null,
                ),
              )}

              {/* Each category's whole band is the hover and click target. */}
              {categories.map((category, index) => (
                <rect
                  key={category.key}
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
                  aria-label={`${category.label}: ${series.map(s => `${s.name} ${pct(s.values[index])}`).join(', ')}`}
                />
              ))}
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
