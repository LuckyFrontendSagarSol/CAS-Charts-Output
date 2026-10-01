import { motion } from 'framer-motion'
import { BarChart3, Table2, CheckCircle2, ArrowDown, ArrowUp, MinusCircle } from 'lucide-react'
import { ROLE_STATUS, statusTone } from './casOutputData'

/**
 * The small pieces every CAS Output chart is built from, so the panels read as
 * one dashboard: the card, the chart/table switch, the tooltip, the legend key
 * and the band-status badge.
 */

const EASE = [0.22, 1, 0.36, 1]

/** A dashboard panel: icon, title, one-line note, actions on the right. */
export function VizCard({ title, subtitle, icon: Icon, actions, children, className = '', delay = 0 }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: EASE }}
      className={[
        '@container h-full min-w-0 rounded-2xl border border-beige-line bg-paper p-4 sm:p-6',
        'shadow-[0_1px_2px_rgba(8,15,46,0.04),0_10px_30px_-18px_rgba(8,15,46,0.25)]',
        className,
      ].join(' ')}
    >
      <header className="mb-4 flex flex-wrap items-start gap-3">
        {Icon && (
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-royal/[0.08] text-royal">
            <Icon size={17} />
          </span>
        )}
        {/* A floor on the title's width: on a phone the actions wrap under it
            rather than squeezing the note into a narrow column. */}
        <div className="min-w-[min(100%,14rem)] flex-1">
          <h2 className="font-display text-[15px] font-extrabold tracking-tight text-ink">{title}</h2>
          {subtitle && <p className="mt-0.5 text-[12.5px] leading-snug text-ink-mute">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </header>
      {children}
    </motion.section>
  )
}

/** Two-way segmented switch. `options` is `[{ value, label, icon }]`. */
export function Segmented({ value, onChange, options, label }) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-lg border border-beige-line bg-beige/60 p-0.5">
      {options.map(option => {
        const active = option.value === value
        const Icon = option.icon
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={[
              'inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 font-display text-[12px] font-bold transition-colors',
              active ? 'bg-white text-royal shadow-sm' : 'text-ink-mute hover:text-royal',
            ].join(' ')}
          >
            {Icon && <Icon size={13} />}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

const VIEW_OPTIONS = [
  { value: 'chart', label: 'Chart', icon: BarChart3 },
  { value: 'table', label: 'Table', icon: Table2 },
]

/** Every chart has a table twin — the exact values, without hovering. */
export function ViewToggle({ value, onChange }) {
  return <Segmented value={value} onChange={onChange} options={VIEW_OPTIONS} label="View as" />
}

/**
 * Hover/focus read-out, positioned inside a `relative` chart container. The
 * value leads, the label follows. Kept inside the container's width so it
 * never pushes the page sideways.
 *
 *   tip = { x, y, title, rows: [{ label, value, color? }] }
 */
export function ChartTooltip({ tip, width }) {
  if (!tip) return null
  const half = 100
  const left = width ? Math.min(Math.max(tip.x, half), Math.max(width - half, half)) : tip.x
  return (
    <div
      role="status"
      className="pointer-events-none absolute z-20 w-max max-w-[200px] -translate-x-1/2 -translate-y-full rounded-lg border border-beige-line bg-white px-3 py-2 shadow-[0_12px_30px_-12px_rgba(8,15,46,0.35)]"
      style={{ left, top: tip.y - 10 }}
    >
      {tip.title && (
        <p className="mb-1 truncate font-display text-[12px] font-bold text-ink">{tip.title}</p>
      )}
      {tip.rows.map(row => (
        <p key={row.label} className="flex items-center gap-1.5 text-[11.5px] leading-5">
          {row.color && (
            <span className="h-0.5 w-3 shrink-0 rounded-full" style={{ background: row.color }} aria-hidden="true" />
          )}
          <span className="font-semibold tabular-nums text-ink">{row.value}</span>
          <span className="text-ink-mute">{row.label}</span>
        </p>
      ))}
    </div>
  )
}

/** Legend entry — the swatch mirrors the mark (a block for bars, a dot, a line,
 *  a hollow box or a tick for the target). */
export function LegendKey({ color, label, shape = 'block', children }) {
  const swatch = {
    block: 'h-2.5 w-2.5 rounded-[3px]',
    dot: 'h-2.5 w-2.5 rounded-full',
    line: 'h-0.5 w-3.5 rounded-full',
    band: 'h-2.5 w-3.5 rounded-[3px]',
    // The target's two forms: an outlined box, or a dark upright tick.
    hollow: 'h-2.5 w-2.5 rounded-[3px] border-2',
    tick: 'h-3.5 w-[3px] rounded-full',
  }[shape]
  const paint = shape === 'hollow' ? { borderColor: color, background: 'transparent' } : { background: color }
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] text-ink-soft">
      <span className={`${swatch} shrink-0`} style={paint} aria-hidden="true" />
      {label}
      {children}
    </span>
  )
}

/** Band status — always an icon and a word, never colour alone. */
export function StatusBadge({ status }) {
  const Icon = {
    [ROLE_STATUS.WITHIN]: CheckCircle2,
    [ROLE_STATUS.BELOW]: ArrowDown,
    [ROLE_STATUS.ABOVE]: ArrowUp,
  }[status] ?? MinusCircle
  const tone = statusTone(status)
  return (
    <span
      className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-bold"
      style={{ color: tone.text, background: tone.bg, borderColor: tone.border }}
    >
      <Icon size={12} />
      {status || 'No target'}
    </span>
  )
}
