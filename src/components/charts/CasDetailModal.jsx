import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  X, ArrowLeft, CheckCircle2, AlertTriangle, Repeat, ChevronRight, BarChart3, TrendingUp, Table2,
} from 'lucide-react'
import useEscapeKey from '@/hooks/useEscapeKey'
import useBodyScrollLock from '@/hooks/useBodyScrollLock'
import { formatDate } from '@/utils/date'
import { StatusBadge, Segmented } from './VizParts'
import { HoldingsValueChart, HoldingsReturnChart } from './HoldingsCharts'
import {
  DASH, TH, TD, aggregate, holdingShade, deltaPp, isNum, money, num, pct, signedPct, signClass, text,
} from './casOutputData'

/**
 * The drill-down behind every chart. It holds a stack of views so a group can
 * open one of its holdings and Back returns to the group:
 *
 *   { kind: 'scheme', scheme }
 *   { kind: 'group', title, subtitle, schemes, role?, baseName? }
 *
 * `role` is a Role Diagnostic row (current / target / gap / status);
 * `baseName` is the backend's own Base Names record for a fund group — both
 * shown in full when present, since the chart only draws part of them.
 */

/* ── Building blocks ───────────────────────────────────────────────────── */

function Figure({ label, value, valueClass = '' }) {
  return (
    <div className="min-w-0 rounded-xl border border-beige-line bg-white/60 px-3 py-2.5">
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-mute">{label}</p>
      <p className={`mt-0.5 truncate font-display text-[15px] font-extrabold text-ink ${valueClass}`} title={typeof value === 'string' ? value : undefined}>
        {value}
      </p>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section className="min-w-0">
      <h3 className="mb-2 font-display text-[11px] font-bold uppercase tracking-[0.12em] text-gold-text">{title}</h3>
      <dl className="rounded-xl border border-beige-line bg-white/50 px-3">{children}</dl>
    </section>
  )
}

function Field({ label, children, mono = false }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-beige-line/70 py-2 last:border-0">
      <dt className="shrink-0 text-[12px] text-ink-mute">{label}</dt>
      <dd className={`min-w-0 break-words text-right text-[12.5px] font-semibold text-ink ${mono ? 'font-mono text-[12px]' : ''}`}>
        {children}
      </dd>
    </div>
  )
}

function Chips({ items }) {
  if (!items?.length) return <span className="font-normal text-ink-mute">{DASH}</span>
  return (
    <span className="flex flex-wrap justify-end gap-1">
      {items.map(item => (
        <span key={item} className="rounded-md border border-beige-line bg-beige/60 px-1.5 py-0.5 text-[11.5px] font-medium text-ink-soft">
          {item}
        </span>
      ))}
    </span>
  )
}

/* ── Scheme ────────────────────────────────────────────────────────────── */

function SchemeView({ scheme: s, portfolioValue }) {
  const gain = isNum(s.marketValue) && isNum(s.costValue) ? s.marketValue - s.costValue : null
  const valueGap = isNum(s.marketValue) && isNum(s.marketValueCas) ? s.marketValue - s.marketValueCas : null
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Figure label="Market value" value={money(s.marketValue)} />
        <Figure label="Gain" value={money(gain)} valueClass={signClass(gain)} />
        <Figure label="Abs. return" value={signedPct(s.absoluteReturn, 2)} valueClass={signClass(s.absoluteReturn)} />
        <Figure label="XIRR" value={signedPct(s.xirr, 2)} valueClass={signClass(s.xirr)} />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Section title="Position">
          <Field label="Closing units">{num(s.closingUnits, 3)}</Field>
          <Field label="NAV">{num(s.nav, 4)}</Field>
          <Field label="NAV date">{s.navDate ? formatDate(s.navDate) : DASH}</Field>
          <Field label="Invested">{money(s.investedValue)}</Field>
          <Field label="Cost value">{money(s.costValue)}</Field>
          <Field label="Market value (units × NAV)">{money(s.marketValue)}</Field>
          <Field label="Market value (CAS)">{money(s.marketValueCas)}</Field>
          <Field label="Difference">{money(valueGap)}</Field>
          <Field label="Share of portfolio">{portfolioValue && isNum(s.marketValue) ? pct(s.marketValue / portfolioValue, 2) : DASH}</Field>
        </Section>

        <Section title="Classification">
          <Field label="Macro role">{text(s.macroRole)}</Field>
          <Field label="Base name">{text(s.baseName)}</Field>
          <Field label="Plan">{text(s.plan)}</Field>
          <Field label="Option">{text(s.option)}</Field>
          <Field label="IDCW frequency">{text(s.idcwFrequency)}</Field>
          <Field label="AMC">{text(s.amc)}</Field>
          <Field label="Registrar">{text(s.registrar)}</Field>
          <Field label="Holding mode">{text(s.holdingMode)}</Field>
          <Field label="SIP">
            {s.sipActive
              ? <span className="inline-flex items-center gap-1"><Repeat size={12} className="text-royal" aria-hidden="true" />{money(s.sipAmount, 0)} per instalment</span>
              : 'None active'}
          </Field>
        </Section>
      </div>

      <Section title="Identity">
        <Field label="ISIN" mono>{text(s.isin)}</Field>
        <Field label="PAN" mono>{text(s.pan)}</Field>
        <Field label="In ISIN master">
          {s.inIsinMaster
            ? <span className="inline-flex items-center gap-1 text-[var(--status-approved-text)]"><CheckCircle2 size={13} /> Yes</span>
            : <span className="inline-flex items-center gap-1 text-gold-text"><AlertTriangle size={13} /> No — role and base name unknown</span>}
        </Field>
        <Field label="Name in CAS">{text(s.casSchemeName)}</Field>
        <Field label="Name in ISIN master">{text(s.isinMasterSchemeName)}</Field>
        <Field label="AMFI name">{text(s.amfiSchemeName)}</Field>
        <Field label="Canonical scheme id" mono>{text(s.canonicalSchemeId)}</Field>
        <Field label={`Folio${s.folioNos.length === 1 ? '' : 's'}`}><Chips items={s.folioNos} /></Field>
      </Section>
    </div>
  )
}

/* ── Group ─────────────────────────────────────────────────────────────── */

const HOLDING_VIEWS = [
  { value: 'value', label: 'Value', icon: BarChart3 },
  { value: 'returns', label: 'Returns', icon: TrendingUp },
  { value: 'table', label: 'Table', icon: Table2 },
]

function GroupView({ view, portfolioValue, onOpenScheme }) {
  const figures = aggregate(view.schemes)
  const { role, baseName } = view
  const rows = [...view.schemes].sort((a, b) => (b.marketValue ?? -Infinity) - (a.marketValue ?? -Infinity))
  const max = Math.max(0, ...rows.map(r => (isNum(r.marketValue) ? r.marketValue : 0)))
  const [holdingView, setHoldingView] = useState('value')

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        <Figure label="Market value" value={money(figures.marketValue)} />
        <Figure label="Share of portfolio" value={portfolioValue && isNum(figures.marketValue) ? pct(figures.marketValue / portfolioValue, 2) : DASH} />
        <Figure label="Holdings" value={figures.count} />
        <Figure label="Invested" value={money(figures.investedValue)} />
        <Figure label="Gain" value={money(figures.gain)} valueClass={signClass(figures.gain)} />
        <Figure label="Abs. return" value={signedPct(figures.absoluteReturn, 2)} valueClass={signClass(figures.absoluteReturn)} />
      </div>

      {role && (
        <Section title="Against the model">
          <Field label="Current mix">{pct(role.currentMix)}</Field>
          <Field label="Target mix">{pct(role.targetMix)}</Field>
          <Field label="Gap (target − current)">{deltaPp(role.gap)}</Field>
          <Field label="Status"><StatusBadge status={role.status} /></Field>
        </Section>
      )}

      {baseName && (
        <Section title="Base name record">
          <Field label="Macro roles"><Chips items={baseName.macroRoles} /></Field>
          <Field label="Schemes">{text(baseName.schemeCount)}</Field>
          <Field label="Plans"><Chips items={baseName.plans} /></Field>
          <Field label="Options"><Chips items={baseName.options} /></Field>
          <Field label="AMCs"><Chips items={baseName.amcs} /></Field>
          <Field label="ISINs" mono><Chips items={baseName.isins} /></Field>
          <Field label="Invested">{money(baseName.investedValue)}</Field>
          <Field label="Cost value">{money(baseName.costValue)}</Field>
          <Field label="Market value">{money(baseName.marketValue)}</Field>
          <Field label="Portfolio weight">{pct(baseName.portfolioWeight, 2)}</Field>
          <Field label="Abs. return">{signedPct(baseName.absoluteReturn, 2)}</Field>
          <Field label="PAN" mono>{text(baseName.pan)}</Field>
        </Section>
      )}

      <section>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-[11px] font-bold uppercase tracking-[0.12em] text-gold-text">
            Holdings in this group
          </h3>
          {rows.length > 0 && (
            <Segmented value={holdingView} onChange={setHoldingView} options={HOLDING_VIEWS} label="Show holdings as" />
          )}
        </div>
        {!rows.length ? (
          <p className="rounded-xl border border-beige-line bg-white/50 px-3 py-4 text-center text-[12.5px] text-ink-mute">
            No holding sits in this group{role ? ' — the whole target is still to be bought' : ''}.
          </p>
        ) : holdingView !== 'table' ? (
          <div className="rounded-xl border border-beige-line bg-white/50 px-3 py-3">
            {holdingView === 'value' ? (
              <HoldingsValueChart rows={rows} groupValue={figures.marketValue} onOpenScheme={onOpenScheme} />
            ) : (
              <HoldingsReturnChart rows={rows} onOpenScheme={onOpenScheme} />
            )}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-beige-line bg-white/50 scroll-slim">
            <table className="w-full min-w-[560px] border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className={`${TH} pt-2.5`}>Scheme</th>
                  <th className={`${TH} pt-2.5`}>Share of group</th>
                  <th className={`${TH} pt-2.5 text-right`}>Market value</th>
                  <th className={`${TH} pt-2.5 text-right`}>Abs. return</th>
                  <th className={`${TH} pt-2.5 text-right`}>XIRR</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(s => (
                  <tr key={s.id} className="transition-colors hover:bg-beige/50">
                    <td className={`${TD} max-w-[240px]`}>
                      <button type="button" onClick={() => onOpenScheme(s)} className="flex max-w-full items-center gap-1 text-left font-semibold text-ink hover:text-royal">
                        <span className="truncate" title={s.casSchemeName ?? ''}>{text(s.casSchemeName || s.baseName)}</span>
                        <ChevronRight size={14} className="shrink-0 text-ink-mute" aria-hidden="true" />
                      </button>
                    </td>
                    <td className={`${TD} w-32`}>
                      <span className="flex items-center gap-2">
                        <span className="relative block h-2 flex-1 rounded-[3px] bg-beige/70">
                          {isNum(s.marketValue) && s.marketValue > 0 && max > 0 && (
                            <span className="absolute inset-y-0 left-0 rounded-r-[3px]" style={{ width: `${(s.marketValue / max) * 100}%`, background: holdingShade(s.marketValue, max) }} />
                          )}
                        </span>
                        <span className="w-12 text-right text-[11.5px] tabular-nums">
                          {figures.marketValue && isNum(s.marketValue) ? pct(s.marketValue / figures.marketValue, 1) : DASH}
                        </span>
                      </span>
                    </td>
                    <td className={`${TD} text-right tabular-nums`}>{money(s.marketValue)}</td>
                    <td className={`${TD} text-right tabular-nums ${signClass(s.absoluteReturn)}`}>{signedPct(s.absoluteReturn, 2)}</td>
                    <td className={`${TD} text-right tabular-nums ${signClass(s.xirr)}`}>{signedPct(s.xirr, 2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

/* ── Dialog shell ──────────────────────────────────────────────────────── */

export default function CasDetailModal({ stack, portfolioValue, onPush, onBack, onClose }) {
  useEscapeKey(onClose)
  useBodyScrollLock()

  const view = stack[stack.length - 1]
  const isScheme = view.kind === 'scheme'
  const title = isScheme ? text(view.scheme.casSchemeName || view.scheme.baseName) : text(view.title)
  const subtitle = isScheme
    ? [view.scheme.amc, view.scheme.macroRole, view.scheme.isin].filter(Boolean).join(' · ')
    : view.subtitle

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="absolute inset-0 bg-[rgba(8,15,46,0.55)] backdrop-blur-[3px]"
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cas-detail-title"
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl border border-beige-line bg-paper shadow-[0_40px_90px_-30px_rgba(8,15,46,0.7)] sm:max-h-[88vh] sm:rounded-2xl"
      >
        <div className="flex items-start gap-3 border-b border-beige-line px-4 py-4 sm:px-5">
          {stack.length > 1 && (
            <button
              type="button"
              onClick={onBack}
              aria-label="Back"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-mute transition-colors hover:bg-beige hover:text-royal"
            >
              <ArrowLeft size={17} />
            </button>
          )}
          <div className="min-w-0 flex-1">
            <h2 id="cas-detail-title" className="truncate font-display text-[15px] font-extrabold tracking-tight text-ink" title={title}>
              {title}
            </h2>
            {subtitle && <p className="mt-1 truncate text-[12.5px] text-ink-mute">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-mute transition-colors hover:bg-beige hover:text-royal"
          >
            <X size={17} />
          </button>
        </div>

        <div className="overflow-y-auto px-4 py-5 scroll-slim sm:px-5">
          {isScheme ? (
            <SchemeView scheme={view.scheme} portfolioValue={portfolioValue} />
          ) : (
            <GroupView
              view={view}
              portfolioValue={portfolioValue}
              onOpenScheme={scheme => onPush({ kind: 'scheme', scheme })}
            />
          )}
        </div>
      </motion.div>
    </div>
  )
}
