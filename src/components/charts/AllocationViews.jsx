import { useState } from 'react'
import { BarChart3, ChartArea, ChartColumn, PieChart } from 'lucide-react'
import { VizCard, LegendKey } from './VizParts'
import BulletBars from './BulletBars'
import { ColumnChart, AreaChart } from './XYCharts'
import {
  AREA_CURRENT, CHART, REMAINDER_COLOR, REMAINDER_LABEL, buildAllocation, deltaPp, isNum, pct,
} from './casOutputData'

/**
 * Four more ways to read the Portfolio Snapshot, beside the stacked view
 * (AllocationChart.jsx). Same data, and a group is its family's colour in
 * every one of them:
 *
 *   AllocationBars     each group on its own row — a solid bar for today, a
 *                      dark tick for the recommended share
 *   AllocationDonuts   today and the recommended mix as two rings
 *   AllocationColumns  groups along the bottom — a solid column for today, a
 *                      hollow one for the recommended share
 *   AllocationArea     today and the recommended mix as two filled curves
 */

const NO_SNAPSHOT = <p className="py-8 text-center text-[13px] text-ink-mute">No portfolio snapshot in this output.</p>

/* ── Bar view ──────────────────────────────────────────────────────────── */

export function AllocationBars({ snapshot, delay }) {
  const { groups, bars } = buildAllocation(snapshot)
  const remainder = bars[0]?.segments.find(segment => segment.remainder)

  const rows = [
    ...groups.map(group => ({
      key: group.label,
      label: group.label,
      current: group.current,
      target: group.recommended,
      color: group.color,
    })),
    ...(remainder
      ? [{ key: REMAINDER_LABEL, label: REMAINDER_LABEL, sublabel: 'Holdings with no macro role', current: remainder.value, target: null, color: REMAINDER_COLOR }]
      : []),
  ]

  return (
    <VizCard
      title="Bar view"
      subtitle="Each group on its own: the bar is today's share, the tick is the recommended share."
      icon={BarChart3}
      delay={delay}
    >
      {groups.length ? <BulletBars rows={rows} targetLabel="Recommended" /> : NO_SNAPSHOT}
    </VizCard>
  )
}

/* ── Donut view ────────────────────────────────────────────────────────── */

const R = 46
const STROKE = 15
const C = 2 * Math.PI * R
/** Surface gap between slices, in the ring's own length units. */
const GAP = 1.6

function Donut({ bar, active, headline, onHover }) {
  // Where each slice starts along the ring — the running total before it.
  const starts = bar.segments.map((_, index) =>
    bar.segments.slice(0, index).reduce((sum, segment) => sum + Math.max(segment.value * C, 0), 0),
  )
  /* The centre shows the hovered group, and at rest the headline group —
     equity, the number most readers look for first. */
  const shown = active ?? headline
  const focus = shown ? bar.segments.find(segment => segment.label === shown) : null
  return (
    <figure className="flex min-w-0 flex-1 flex-col items-center">
      <div className="relative w-full max-w-[200px] @3xl:max-w-[240px]">
        <svg viewBox="0 0 120 120" className="block w-full -rotate-90" role="img" aria-label={`${bar.name}: ${bar.segments.map(s => `${s.label} ${pct(s.value)}`).join(', ')}`}>
          <circle cx="60" cy="60" r={R} fill="none" stroke={CHART.track} strokeWidth={STROKE} />
          {bar.segments.map((segment, index) => {
            const length = Math.max(segment.value * C, 0)
            const dash = Math.max(length - (bar.segments.length > 1 ? GAP : 0), 0.001)
            return (
              <circle
                key={segment.label}
                cx="60"
                cy="60"
                r={R}
                fill="none"
                stroke={segment.color}
                strokeWidth={active === segment.label ? STROKE + 3 : STROKE}
                strokeDasharray={`${dash} ${C - dash}`}
                strokeDashoffset={-starts[index]}
                opacity={active && active !== segment.label ? 0.3 : 1}
                onMouseEnter={() => onHover(segment.label)}
                onMouseLeave={() => onHover(null)}
                className="cursor-pointer transition-[opacity,stroke-width] duration-200"
              />
            )
          })}
        </svg>
        {/* The centre answers the hover, so no tooltip covers the ring. */}
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div className="w-[58%]">
            {shown && (
              <>
                <p className={`font-display text-[22px] font-extrabold leading-none ${focus ? 'text-ink' : 'text-ink-mute'}`}>
                  {pct(focus ? focus.value : 0)}
                </p>
                <p className="mt-1 line-clamp-2 text-[10.5px] leading-tight" style={{ color: CHART.inkSoft }}>{shown}</p>
              </>
            )}
          </div>
        </div>
      </div>
      <figcaption className="mt-2 font-display text-[11px] font-bold uppercase tracking-[0.1em] text-ink-soft">
        {bar.name}
      </figcaption>
    </figure>
  )
}

export function AllocationDonuts({ snapshot, delay }) {
  const { groups, hasTarget, bars } = buildAllocation(snapshot)
  const [active, setActive] = useState(null)
  const hasRemainder = bars.some(bar => bar.segments.some(segment => segment.remainder))
  const headline = groups.find(group => group.family === 'equity')?.label ?? null

  return (
    <VizCard
      title="Donut view"
      subtitle="The whole portfolio as a ring, today and as recommended. The centre shows the equity share; point at a slice or a group for another."
      icon={PieChart}
      delay={delay}
    >
      {!groups.length ? NO_SNAPSHOT : (
        /* On a wide card the rings sit beside the legend instead of above it. */
        <div className="@3xl:grid @3xl:grid-cols-2 @3xl:items-center @3xl:gap-10">
          <div>
            <div className="flex items-start justify-center gap-4 @md:gap-8">
              {bars.map(bar => <Donut key={bar.name} bar={bar} active={active} headline={headline} onHover={setActive} />)}
            </div>
            {!hasTarget && (
              <p className="mt-3 text-center text-[12px] text-ink-mute">
                No risk profile row matched this client, so there is no recommended ring.
              </p>
            )}
          </div>

          <ul className="mt-5 space-y-1.5 @3xl:mt-0" onMouseLeave={() => setActive(null)}>
            {groups.map(group => (
              <li key={group.label}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(group.label)}
                  onFocus={() => setActive(group.label)}
                  onBlur={() => setActive(null)}
                  className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left transition-[filter]"
                  style={{ background: CHART.track, filter: active === group.label ? 'brightness(0.96)' : undefined }}
                >
                  <LegendKey color={group.color} label={group.label} />
                  <span className="whitespace-nowrap text-[12px] tabular-nums" style={{ color: CHART.inkSoft }}>
                    {pct(group.current)}
                    {hasTarget && <> → {isNum(group.recommended) ? pct(group.recommended) : '—'}</>}
                  </span>
                </button>
              </li>
            ))}
            {hasRemainder && (
              <li className="flex items-center justify-between gap-3 rounded-lg px-3 py-2" style={{ background: CHART.track }}>
                <LegendKey color={REMAINDER_COLOR} label={REMAINDER_LABEL} />
                <span className="text-[12px]" style={{ color: CHART.inkSoft }}>no macro role</span>
              </li>
            )}
          </ul>
        </div>
      )}
    </VizCard>
  )
}

/* ── Column view ───────────────────────────────────────────────────────── */

export function AllocationColumns({ snapshot, delay }) {
  const { groups, hasTarget, bars } = buildAllocation(snapshot)
  const remainder = bars[0]?.segments.find(segment => segment.remainder)

  const categories = [
    ...groups.map(group => ({ key: group.label, label: group.label, color: group.color, current: group.current, target: group.recommended })),
    ...(remainder ? [{ key: REMAINDER_LABEL, label: REMAINDER_LABEL, color: REMAINDER_COLOR, current: remainder.value, target: null }] : []),
  ].map(item => ({
    key: item.key,
    label: item.label,
    bars: [
      { name: 'Current', value: item.current, color: item.color },
      ...(hasTarget ? [{ name: 'Recommended', value: item.target, color: item.color, hollow: true }] : []),
    ],
  }))

  return (
    <VizCard
      title="Column view"
      subtitle="Groups along the bottom, share of the portfolio up the side. The solid column is today; the hollow one is the recommended share."
      icon={ChartColumn}
      delay={delay}
    >
      {!groups.length ? NO_SNAPSHOT : (
        <>
          <ColumnChart categories={categories} />
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
            <LegendKey color={CHART.inkSoft} label="Current" />
            {hasTarget && <LegendKey color={CHART.inkSoft} label="Recommended" shape="hollow" />}
          </div>
        </>
      )}
    </VizCard>
  )
}

/* ── Area view ─────────────────────────────────────────────────────────── */

export function AllocationArea({ snapshot, delay }) {
  const { groups, hasTarget, bars } = buildAllocation(snapshot)
  const remainder = bars[0]?.segments.find(segment => segment.remainder)

  const items = [
    ...groups.map(group => ({ key: group.label, label: group.label, current: group.current, target: group.recommended })),
    ...(remainder ? [{ key: REMAINDER_LABEL, label: REMAINDER_LABEL, current: remainder.value, target: null }] : []),
  ]

  return (
    <VizCard
      title="Area view"
      subtitle="Today's mix and the recommended mix as two filled curves — the space between the two shapes is how far apart they are."
      icon={ChartArea}
      delay={delay}
    >
      {!groups.length ? NO_SNAPSHOT : (
        <>
          <AreaChart
            label="Portfolio snapshot area chart"
            minBand={120}
            categories={items.map(item => ({
              key: item.key,
              label: item.label,
              extra: isNum(item.current) && isNum(item.target)
                ? [{ label: 'gap (recommended − current)', value: deltaPp(item.target - item.current) }]
                : [],
            }))}
            series={[
              { name: 'Current', color: AREA_CURRENT, values: items.map(item => item.current) },
              ...(hasTarget ? [{ name: 'Recommended', color: CHART.target, values: items.map(item => item.target), target: true }] : []),
            ]}
          />
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
            <LegendKey color={AREA_CURRENT} label="Current" shape="line" />
            {hasTarget && <LegendKey color={CHART.target} label="Recommended — dashed, hollow points" shape="line" />}
          </div>
        </>
      )}
    </VizCard>
  )
}
