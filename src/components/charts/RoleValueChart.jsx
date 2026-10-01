import { useMemo, useState } from 'react'
import { Wallet, ChevronRight } from 'lucide-react'
import useElementWidth from '@/hooks/useElementWidth'
import { VizCard, ViewToggle, ChartTooltip, LegendKey } from './VizParts'
import {
  CHART, TH, TD, buildRoleRows, isNum, money, moneyShort, moneyTick, niceTicks, pct,
  roleColor, roleFigures, signClass, signedPct, text,
} from './casOutputData'

/**
 * Role Diagnostic, value view — the figures the role dialog shows, for every
 * role at once: what went in (invested), what it is worth now (market value),
 * the gain between them and the absolute return, with the holdings count and
 * the role's share of the portfolio.
 *
 * Two bars per role on one money scale: the solid bar in the role's colour is
 * today's market value, the grey bar under it what was invested. A row opens
 * the same holdings dialog as the other views.
 */

const at = (value, domain) => `${Math.min(Math.max(value / domain, 0), 1) * 100}%`

const holdingsNote = count => `${count} holding${count === 1 ? '' : 's'}`

export default function RoleValueChart({ diagnostic, schemes, portfolioValue, onOpenRole, delay }) {
  const [view, setView] = useState('chart')
  const [tip, setTip] = useState(null)
  const [wrapRef, width, wrapNode] = useElementWidth()

  const rows = useMemo(
    () => buildRoleRows(diagnostic, schemes).map(row => ({ ...row, figures: roleFigures(row) })),
    [diagnostic, schemes],
  )

  const top = Math.max(0, ...rows.flatMap(r => [r.figures.marketValue ?? 0, r.figures.invested ?? 0]))
  const ticks = top > 0 ? niceTicks(0, top, 4) : []
  const domain = Math.max(top, ticks[ticks.length - 1] ?? 0) || 1

  const share = f => (portfolioValue && isNum(f.marketValue) ? f.marketValue / portfolioValue : null)

  const show = (event, row) => {
    const box = wrapNode.getBoundingClientRect()
    const bar = event.currentTarget.querySelector('[data-bar]')?.getBoundingClientRect()
    if (!bar) return
    const f = row.figures
    setTip({
      x: bar.left - box.left + bar.width / 2,
      y: bar.top - box.top,
      title: text(row.role),
      rows: [
        { label: 'market value', value: money(f.marketValue, 0), color: roleColor(row.role) },
        { label: 'invested', value: money(f.invested, 0), color: CHART.zero },
        { label: 'gain', value: money(f.gain, 0) },
        { label: 'abs. return', value: signedPct(f.absoluteReturn, 2) },
        { label: 'of portfolio', value: pct(share(f), 2) },
        { label: row.schemes.length === 1 ? 'holding' : 'holdings', value: row.schemes.length },
      ],
    })
  }

  return (
    <VizCard
      title="Value & returns"
      subtitle="Each role's money: the coloured bar is today's market value, the grey bar what was invested. Select a role to see its holdings."
      icon={Wallet}
      delay={delay}
      actions={<ViewToggle value={view} onChange={setView} />}
    >
      {!rows.length ? (
        <p className="py-8 text-center text-[13px] text-ink-mute">No role diagnostic in this output.</p>
      ) : view === 'chart' ? (
        <div ref={wrapRef} className="relative" onMouseLeave={() => setTip(null)}>
          {/* Scale — shares the track column's width on every screen. */}
          <div className="mb-1 hidden grid-cols-[minmax(0,11rem)_1fr_12rem] gap-4 sm:grid">
            <span />
            <div className="relative h-4">
              {ticks.map((tick, index) => (
                <span
                  key={tick}
                  className={`absolute text-[10.5px] tabular-nums ${index === 0 ? '' : '-translate-x-1/2'}`}
                  style={{ left: at(tick, domain), color: CHART.inkSoft }}
                >
                  {moneyTick(tick)}
                </span>
              ))}
            </div>
            <span />
          </div>

          <ul className="divide-y" style={{ borderColor: CHART.grid }}>
            {rows.map(row => {
              const f = row.figures
              return (
                <li key={row.role ?? row.order} style={{ borderColor: CHART.grid }}>
                  <button
                    type="button"
                    onClick={() => onOpenRole(row)}
                    onMouseEnter={event => show(event, row)}
                    onFocus={event => show(event, row)}
                    onBlur={() => setTip(null)}
                    className="group grid w-full grid-cols-1 items-center gap-x-4 gap-y-2 rounded-lg px-1 py-3 text-left transition-colors hover:bg-beige/50 sm:grid-cols-[minmax(0,11rem)_1fr_12rem]"
                  >
                    <span className="flex min-w-0 items-center justify-between gap-2 sm:block">
                      <span className="block truncate font-display text-[13px] font-bold text-ink" title={row.role}>
                        {text(row.role)}
                      </span>
                      <span className="block shrink-0 text-[11.5px] text-ink-mute">
                        {holdingsNote(row.schemes.length)} · {pct(share(f), 1)}
                      </span>
                    </span>

                    {/* Track: grid lines, market value bar, invested bar. */}
                    <span className="relative block h-9">
                      {ticks.map(tick => (
                        <span key={tick} className="absolute inset-y-0 w-px" style={{ left: at(tick, domain), background: CHART.grid }} aria-hidden="true" />
                      ))}
                      <span
                        data-bar
                        className="absolute left-0 top-1 h-3.5 rounded-r-[4px] transition-[filter] group-hover:brightness-110"
                        style={{ width: isNum(f.marketValue) ? at(f.marketValue, domain) : 0, background: roleColor(row.role) }}
                        aria-hidden="true"
                      />
                      <span
                        className="absolute bottom-1 left-0 h-2 rounded-r-[3px]"
                        style={{ width: isNum(f.invested) ? at(f.invested, domain) : 0, background: CHART.zero, opacity: 0.55 }}
                        aria-hidden="true"
                      />
                      {!row.schemes.length && (
                        <span className="absolute inset-0 grid place-items-center text-[11px] italic" style={{ color: CHART.inkSoft }}>no holdings</span>
                      )}
                    </span>

                    <span className="flex items-center justify-between gap-2 sm:justify-end">
                      <span className="text-right">
                        <span className="block text-[12.5px] font-semibold tabular-nums text-ink">
                          {moneyShort(f.marketValue)}
                          <span className="font-normal" style={{ color: CHART.inkSoft }}> / {moneyShort(f.invested)}</span>
                        </span>
                        <span className={`block text-[11.5px] font-bold tabular-nums ${signClass(f.gain)}`}>
                          {moneyShort(f.gain)} · {signedPct(f.absoluteReturn, 2)}
                        </span>
                      </span>
                      <ChevronRight size={15} className="shrink-0 text-ink-mute transition-colors group-hover:text-royal" aria-hidden="true" />
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>

          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
            <LegendKey color={CHART.inkSoft} label="Market value (bar in the role's colour)" />
            <LegendKey color={CHART.zero} label="Invested" />
            <span className="text-[12px] text-ink-soft">Right side: market value / invested, then gain · abs. return</span>
          </div>
          <ChartTooltip tip={tip} width={width} />
        </div>
      ) : (
        <div className="overflow-x-auto scroll-slim">
          <table className="w-full min-w-[760px] border-separate border-spacing-0">
            <thead>
              <tr>
                <th className={TH}>Macro role</th>
                <th className={`${TH} text-right`}>Holdings</th>
                <th className={`${TH} text-right`}>Invested</th>
                <th className={`${TH} text-right`}>Market value</th>
                <th className={`${TH} text-right`}>Gain</th>
                <th className={`${TH} text-right`}>Abs. return</th>
                <th className={`${TH} text-right`}>Share of portfolio</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => {
                const f = row.figures
                return (
                  <tr key={row.role ?? row.order} className="transition-colors hover:bg-beige/50">
                    <td className={`${TD} font-semibold text-ink`}>
                      <button type="button" className="inline-flex items-center gap-2 text-left hover:text-royal" onClick={() => onOpenRole(row)}>
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: roleColor(row.role) }} aria-hidden="true" />
                        <span className="underline decoration-beige-line underline-offset-2">{text(row.role)}</span>
                      </button>
                    </td>
                    <td className={`${TD} text-right tabular-nums`}>{row.schemes.length}</td>
                    <td className={`${TD} text-right tabular-nums`}>{money(f.invested)}</td>
                    <td className={`${TD} text-right tabular-nums`}>{money(f.marketValue)}</td>
                    <td className={`${TD} text-right tabular-nums ${signClass(f.gain)}`}>{money(f.gain)}</td>
                    <td className={`${TD} text-right tabular-nums ${signClass(f.absoluteReturn)}`}>{signedPct(f.absoluteReturn, 2)}</td>
                    <td className={`${TD} text-right tabular-nums`}>{pct(share(f), 2)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </VizCard>
  )
}
