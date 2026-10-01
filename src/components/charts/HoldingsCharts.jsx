import { ChevronRight } from 'lucide-react'
import { LegendKey } from './VizParts'
import {
  CHART, HOLDING_SHADES, holdingShade, isNum, moneyShort, moneyTick, niceTicks, pct, signClass, signedPct,
  text, tintOf,
} from './casOutputData'

/**
 * Charts of the holdings inside one group of the detail dialog — the same rows
 * as its holdings table, largest first, and each row opens that holding:
 *
 *   HoldingsValueChart    market value against what was invested
 *   HoldingsReturnChart   absolute return and XIRR, from a zero line
 *
 * Each holding keeps one shade in both charts and the table: the largest market
 * value in the group is the deepest indigo, and smaller holdings get lighter in
 * proportion to their value (holdingShade in casOutputData.js). The second
 * series of each chart is neutral grey (invested) or the same shade washed
 * lighter (XIRR).
 */

const INVESTED = CHART.zero

const largest = rows => Math.max(0, ...rows.map(s => (isNum(s.marketValue) ? s.marketValue : 0)))

/** Legend swatch for the shade scale: deep (largest) to light (smallest). */
const ShadeKey = ({ label }) => (
  <span className="inline-flex items-center gap-1.5 text-[12px] text-ink-soft">
    <span
      className="h-2.5 w-7 shrink-0 rounded-[3px]"
      style={{ background: `linear-gradient(90deg, ${HOLDING_SHADES.dark}, ${HOLDING_SHADES.light})` }}
      aria-hidden="true"
    />
    {label}
  </span>
)

const GRID = 'grid grid-cols-1 items-center gap-x-4 gap-y-1.5 sm:grid-cols-[minmax(0,15rem)_1fr_8.5rem]'

const nameOf = s => text(s.casSchemeName || s.baseName)

/** Round ticks that cover [min, max] fully — one more step either end when
 *  the plain ticks stop short, so the longest bar never runs off the scale. */
function coveringTicks(min, max, count = 5) {
  const ticks = niceTicks(min, max, count)
  if (ticks.length < 2) return ticks
  const step = ticks[1] - ticks[0]
  while (ticks[0] > min + 1e-9) ticks.unshift(Number((ticks[0] - step).toFixed(12)))
  while (ticks[ticks.length - 1] < max - 1e-9) ticks.push(Number((ticks[ticks.length - 1] + step).toFixed(12)))
  return ticks
}

/** Value labels across the top of the track column. */
function Scale({ ticks, position, format }) {
  return (
    <div className={`mb-1 hidden ${GRID} sm:grid`}>
      <span />
      <span className="relative block h-4">
        {ticks.map((tick, index) => (
          <span
            key={tick}
            className={`absolute whitespace-nowrap text-[10.5px] tabular-nums ${index === 0 ? '' : index === ticks.length - 1 ? '-translate-x-full' : '-translate-x-1/2'}`}
            style={{ left: position(tick), color: CHART.inkSoft }}
          >
            {format(tick)}
          </span>
        ))}
      </span>
      <span />
    </div>
  )
}

/** One holding: its name, a track and the figures, as a button. */
function Row({ scheme, note, track, figures, onOpen }) {
  return (
    <li style={{ borderColor: CHART.grid }}>
      <button
        type="button"
        onClick={() => onOpen(scheme)}
        title={scheme.casSchemeName ?? ''}
        className={`group ${GRID} w-full rounded-lg px-1 py-2.5 text-left transition-colors hover:bg-beige/50`}
      >
        <span className="min-w-0">
          <span className="block truncate font-display text-[12.5px] font-bold text-ink group-hover:text-royal">{nameOf(scheme)}</span>
          <span className="block text-[11px] text-ink-mute">{note}</span>
        </span>
        <span className="relative block h-8">{track}</span>
        <span className="flex items-center justify-between gap-1 sm:justify-end">
          <span className="text-right">{figures}</span>
          <ChevronRight size={14} className="shrink-0 text-ink-mute transition-colors group-hover:text-royal" aria-hidden="true" />
        </span>
      </button>
    </li>
  )
}

const GridLines = ({ ticks, position }) =>
  ticks.map(tick => (
    <span key={tick} className="absolute inset-y-0 w-px" style={{ left: position(tick), background: CHART.grid }} aria-hidden="true" />
  ))

/* ── Value ─────────────────────────────────────────────────────────────── */

export function HoldingsValueChart({ rows, groupValue, onOpenScheme }) {
  const invested = s => s.investedValue ?? s.costValue
  const top = Math.max(0, ...rows.flatMap(s => [s.marketValue ?? 0, invested(s) ?? 0]))
  const ticks = top > 0 ? coveringTicks(0, top, 4) : []
  const domain = ticks[ticks.length - 1] || 1
  const position = value => `${Math.min(Math.max(value / domain, 0), 1) * 100}%`
  const biggest = largest(rows)

  return (
    <div>
      <Scale ticks={ticks} position={position} format={moneyTick} />
      <ul className="divide-y" style={{ borderColor: CHART.grid }}>
        {rows.map(s => {
          const cost = invested(s)
          const gain = isNum(s.marketValue) && isNum(cost) ? s.marketValue - cost : null
          const shade = holdingShade(s.marketValue, biggest)
          return (
            <Row
              key={s.id}
              scheme={s}
              onOpen={onOpenScheme}
              note={`${groupValue && isNum(s.marketValue) ? pct(s.marketValue / groupValue, 1) : '—'} of group`}
              track={
                <>
                  <GridLines ticks={ticks} position={position} />
                  <span
                    className="absolute left-0 top-1 h-3 rounded-r-[3px] transition-[filter] group-hover:brightness-125"
                    style={{ width: isNum(s.marketValue) ? position(s.marketValue) : 0, background: shade }}
                    aria-hidden="true"
                  />
                  <span
                    className="absolute bottom-1 left-0 h-2 rounded-r-[3px]"
                    style={{ width: isNum(cost) ? position(cost) : 0, background: INVESTED, opacity: 0.55 }}
                    aria-hidden="true"
                  />
                </>
              }
              figures={
                <>
                  <span className="block text-[12px] font-semibold tabular-nums text-ink">
                    {moneyShort(s.marketValue)}
                    <span className="font-normal" style={{ color: CHART.inkSoft }}> / {moneyShort(cost)}</span>
                  </span>
                  <span className={`block text-[11px] font-bold tabular-nums ${signClass(gain)}`}>
                    {moneyShort(gain)} · {signedPct(s.absoluteReturn, 1)}
                  </span>
                </>
              }
            />
          )
        })}
      </ul>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
        <ShadeKey label="Market value — deepest is the largest holding, lighter as it gets smaller" />
        <LegendKey color={INVESTED} label="Invested" />
        <span className="text-[12px] text-ink-soft">Right: market value / invested, then gain · abs. return</span>
      </div>
    </div>
  )
}

/* ── Returns ───────────────────────────────────────────────────────────── */

export function HoldingsReturnChart({ rows, onOpenScheme }) {
  const values = rows.flatMap(s => [s.absoluteReturn, s.xirr]).filter(isNum)
  const raw = [Math.min(0, ...values), Math.max(0, ...values)]
  const ticks = coveringTicks(raw[0], raw[1], 5)
  const lo = ticks[0] ?? 0
  const hi = ticks[ticks.length - 1] || 1
  const position = value => `${((Math.min(Math.max(value, lo), hi) - lo) / (hi - lo)) * 100}%`
  const biggest = largest(rows)

  /* A bar from the zero line to the value, either way. */
  const bar = (value, color, className) =>
    isNum(value) && value !== 0 && (
      <span
        className={`absolute ${className} transition-[filter] group-hover:brightness-125`}
        style={{
          left: value > 0 ? position(0) : position(value),
          width: `calc(${position(Math.max(value, 0))} - ${position(Math.min(value, 0))})`,
          background: color,
          borderRadius: value > 0 ? '0 3px 3px 0' : '3px 0 0 3px',
        }}
        aria-hidden="true"
      />
    )

  return (
    <div>
      <Scale ticks={ticks} position={position} format={tick => (tick === 0 ? '0%' : pct(tick, 0))} />
      <ul className="divide-y" style={{ borderColor: CHART.grid }}>
        {rows.map(s => {
          const shade = holdingShade(s.marketValue, biggest)
          return (
          <Row
            key={s.id}
            scheme={s}
            onOpen={onOpenScheme}
            note={text(s.plan)}
            track={
              <>
                <GridLines ticks={ticks} position={position} />
                <span className="absolute inset-y-0 w-px" style={{ left: position(0), background: CHART.zero }} aria-hidden="true" />
                {bar(s.absoluteReturn, shade, 'top-1 h-3')}
                {bar(s.xirr, tintOf(shade, 0.45), 'bottom-1 h-2')}
                {!isNum(s.xirr) && (
                  <span className="absolute bottom-0 text-[10px] italic" style={{ left: `calc(${position(0)} + 4px)`, color: CHART.inkSoft }}>no XIRR</span>
                )}
              </>
            }
            figures={
              <>
                <span className={`block text-[12px] font-semibold tabular-nums text-ink ${signClass(s.absoluteReturn)}`}>
                  {signedPct(s.absoluteReturn, 2)}
                </span>
                <span className={`block text-[11px] font-bold tabular-nums ${signClass(s.xirr)}`}>
                  XIRR {signedPct(s.xirr, 2)}
                </span>
              </>
            }
          />
          )
        })}
      </ul>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
        <ShadeKey label="Absolute return (thick bar) — shade follows holding size" />
        <LegendKey color={tintOf(HOLDING_SHADES.dark, 0.45)} label="XIRR (thin, lighter bar)" />
        <span className="text-[12px] text-ink-soft">Bars right of the zero line are gains, left are losses.</span>
      </div>
    </div>
  )
}
