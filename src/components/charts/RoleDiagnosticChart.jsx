import { useMemo, useState } from 'react'
import { Crosshair, ChevronRight } from 'lucide-react'
import useElementWidth from '@/hooks/useElementWidth'
import { VizCard, ViewToggle, ChartTooltip, StatusBadge } from './VizParts'
import { roleValueTipRows } from './casOutputData'
import {
  CHART, ROLE_BAND_MARGIN, STATUS_TONE, TH, TD, buildRoleRows, deltaPp, isNum, niceTicks, pct,
  roleColor, statusTone, text,
} from './casOutputData'

/**
 * Role Diagnostic, range view — for each macro role, where the portfolio is
 * (current mix) against where the model wants it (target mix), and whether
 * that is inside the tolerance band.
 *
 * A dumbbell per role: the target is a dark tick with its band shaded around
 * it, today's mix a dot in the role's family colour, and a line joins them in
 * the status colour. The eye reads the length of the line as the gap, and
 * whether the dot has left the shaded band as the status — which is why one
 * role 4 points off its target can be "Within" while another is not.
 *
 * The band is ±ROLE_BAND_MARGIN around the target: the backend's rule, held as
 * one constant in casOutputData.js, because the API sends the status but not
 * the range behind it.
 *
 * A row is a button: it opens the holdings that make up that role's mix.
 */

const at = (value, domain) => `${Math.min(Math.max(value / domain, 0), 1) * 100}%`

/**
 * How to read the chart, under it. Each entry shows its mark the way the chart
 * draws it, with a name and a line saying what it means.
 */
const GUIDE = [
  {
    key: 'current',
    name: 'Today',
    meaning: "The share of the portfolio this role holds now. The dot's colour is the role's asset class.",
    mark: (
      <span className="flex items-center gap-1">
        {['EQ_LargeCore', 'FI_Core', 'DV_HY_Diversifiers'].map(role => (
          <span key={role} className="h-2.5 w-2.5 rounded-full" style={{ background: roleColor(role), boxShadow: '0 0 0 2px #fff' }} />
        ))}
      </span>
    ),
  },
  {
    key: 'target',
    name: 'Target',
    meaning: 'The share the recommended model asks for.',
    needsTarget: true,
    mark: <span className="h-6 w-[3px] rounded-full" style={{ background: CHART.target }} />,
  },
  {
    key: 'band',
    name: 'Tolerance band',
    meaning: `Within ${ROLE_BAND_MARGIN * 100} points either side of the target counts as on track.`,
    needsTarget: true,
    mark: <span className="h-5 w-10 rounded-[4px]" style={{ background: CHART.band }} />,
  },
  {
    key: 'act',
    name: 'Needs action',
    meaning: 'Amber line: today is outside the band (Below or Above Band).',
    needsTarget: true,
    mark: <span className="h-1 w-9 rounded-full" style={{ background: STATUS_TONE.act.line }} />,
  },
  {
    key: 'ok',
    name: 'On track',
    meaning: 'Green line: today is inside the band (Within Band).',
    needsTarget: true,
    mark: <span className="h-1 w-9 rounded-full" style={{ background: STATUS_TONE.ok.line }} />,
  },
]

function ReadingGuide({ hasTarget }) {
  const items = GUIDE.filter(item => hasTarget || !item.needsTarget)
  return (
    <div className="mt-5 rounded-xl border p-3 sm:p-4" style={{ background: CHART.track, borderColor: CHART.grid }}>
      <ul className="grid gap-3 @md:grid-cols-2 @5xl:grid-cols-5">
        {items.map(item => (
          <li key={item.key} className="flex items-center gap-3">
            <span
              className="grid h-10 w-14 shrink-0 place-items-center rounded-lg border"
              style={{ background: CHART.card, borderColor: CHART.grid }}
              aria-hidden="true"
            >
              {item.mark}
            </span>
            <span className="min-w-0">
              <span className="block font-display text-[13px] font-bold text-ink">{item.name}</span>
              <span className="block text-[12px] leading-snug" style={{ color: CHART.inkSoft }}>{item.meaning}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function RoleDiagnosticChart({ diagnostic, schemes, onOpenRole, delay }) {
  const [view, setView] = useState('chart')
  const [tip, setTip] = useState(null)
  const [wrapRef, width, wrapNode] = useElementWidth()

  const rows = useMemo(() => buildRoleRows(diagnostic, schemes), [diagnostic, schemes])

  const hasTarget = rows.some(row => isNum(row.targetMix))

  /* One scale for every row — the highest current mix or band edge, rounded up
     to the next 10%, so a band is never cut off at the right-hand end. */
  const domain = Math.min(
    1,
    Math.max(
      0.2,
      Math.ceil(
        Math.max(0, ...rows.map(r => Math.max(r.currentMix ?? 0, isNum(r.targetMix) ? r.targetMix + ROLE_BAND_MARGIN : 0))) * 10 - 1e-9,
      ) / 10,
    ),
  )
  const ticks = niceTicks(0, domain, 4)

  const show = (event, row) => {
    const box = wrapNode.getBoundingClientRect()
    const dot = event.currentTarget.querySelector('[data-dot]')?.getBoundingClientRect()
    if (!dot) return
    setTip({
      x: dot.left - box.left + dot.width / 2,
      y: dot.top - box.top,
      title: text(row.role),
      rows: [
        { label: 'current', value: pct(row.currentMix), color: roleColor(row.role) },
        { label: 'target', value: pct(row.targetMix), color: CHART.target },
        { label: 'gap (target − current)', value: deltaPp(row.gap) },
        { label: `holding${row.schemes.length === 1 ? '' : 's'}`, value: row.schemes.length },
        ...roleValueTipRows(row),
      ],
    })
  }

  return (
    <VizCard
      title="Range view"
      subtitle="The dot is today's mix, the tick is the target and the shaded band is the tolerance around it. Select a role to see its holdings."
      icon={Crosshair}
      delay={delay}
      actions={<ViewToggle value={view} onChange={setView} />}
    >
      {!rows.length ? (
        <p className="py-8 text-center text-[13px] text-ink-mute">No role diagnostic in this output.</p>
      ) : (
        <>
          {!hasTarget && (
            <p className="mb-3 rounded-lg px-3 py-2 text-[12.5px]" style={{ background: CHART.track, color: CHART.inkSoft }}>
              No risk profile row matched this client, so roles show their current mix only — there is no target or band.
            </p>
          )}

          {view === 'chart' ? (
            <div ref={wrapRef} className="relative" onMouseLeave={() => setTip(null)}>
              {/* Scale — shares the track column's width on every screen. */}
              <div className="mb-1 hidden grid-cols-[minmax(0,11rem)_1fr_10.5rem] gap-4 sm:grid">
                <span />
                <div className="relative h-4">
                  {ticks.map(tick => (
                    <span
                      key={tick}
                      className="absolute -translate-x-1/2 text-[10.5px] tabular-nums"
                      style={{ left: at(tick, domain), color: CHART.inkSoft }}
                    >
                      {pct(tick, 0)}
                    </span>
                  ))}
                </div>
                <span />
              </div>

              <ul className="divide-y" style={{ borderColor: CHART.grid }}>
                {rows.map(row => {
                  const rowHasTarget = isNum(row.targetMix)
                  const low = Math.min(row.currentMix ?? 0, row.targetMix ?? row.currentMix ?? 0)
                  const high = Math.max(row.currentMix ?? 0, row.targetMix ?? row.currentMix ?? 0)
                  const bandLow = rowHasTarget ? Math.max(row.targetMix - ROLE_BAND_MARGIN, 0) : 0
                  const bandHigh = rowHasTarget ? Math.min(row.targetMix + ROLE_BAND_MARGIN, domain) : 0
                  return (
                    <li key={row.role ?? row.order} style={{ borderColor: CHART.grid }}>
                      <button
                        type="button"
                        onClick={() => onOpenRole(row)}
                        onMouseEnter={event => show(event, row)}
                        onFocus={event => show(event, row)}
                        onBlur={() => setTip(null)}
                        className="group grid w-full grid-cols-1 items-center gap-x-4 gap-y-2 rounded-lg px-1 py-3 text-left transition-colors hover:bg-beige/50 sm:grid-cols-[minmax(0,11rem)_1fr_10.5rem]"
                      >
                        <span className="flex min-w-0 items-center justify-between gap-2 sm:block">
                          <span className="block truncate font-display text-[13px] font-bold text-ink" title={row.role}>
                            {text(row.role)}
                          </span>
                          <span className="block shrink-0 text-[11.5px] text-ink-mute">
                            {row.schemes.length} holding{row.schemes.length === 1 ? '' : 's'}
                          </span>
                        </span>

                        {/* Track: grid, band, connector, target tick, today's dot. */}
                        <span className="relative block h-7">
                          {ticks.map(tick => (
                            <span key={tick} className="absolute inset-y-0 w-px" style={{ left: at(tick, domain), background: CHART.grid }} aria-hidden="true" />
                          ))}
                          {rowHasTarget && (
                            <span
                              className="absolute inset-y-1 rounded-[4px]"
                              style={{
                                left: at(bandLow, domain),
                                width: `calc(${at(bandHigh, domain)} - ${at(bandLow, domain)})`,
                                background: CHART.band,
                              }}
                              aria-hidden="true"
                            />
                          )}
                          {rowHasTarget && isNum(row.currentMix) && (
                            <span
                              className="absolute top-1/2 h-[3px] -translate-y-1/2 rounded-full"
                              style={{ left: at(low, domain), width: `calc(${at(high, domain)} - ${at(low, domain)})`, background: statusTone(row.status).line }}
                              aria-hidden="true"
                            />
                          )}
                          {rowHasTarget && (
                            <span
                              className="absolute top-1/2 h-[20px] w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full"
                              style={{ left: at(row.targetMix, domain), background: CHART.target }}
                              aria-hidden="true"
                            />
                          )}
                          {isNum(row.currentMix) && (
                            <span
                              data-dot
                              className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full transition-transform group-hover:scale-125"
                              style={{ left: at(row.currentMix, domain), background: roleColor(row.role), boxShadow: '0 0 0 2px #fff' }}
                              aria-hidden="true"
                            />
                          )}
                        </span>

                        <span className="flex items-center justify-between gap-2 sm:justify-end">
                          <span className="text-right">
                            <span className="block text-[12.5px] font-semibold tabular-nums text-ink">
                              {pct(row.currentMix)}
                              {rowHasTarget && <span className="font-normal" style={{ color: CHART.inkSoft }}> / {pct(row.targetMix)}</span>}
                            </span>
                            <StatusBadge status={row.status} />
                          </span>
                          <ChevronRight size={15} className="shrink-0 text-ink-mute transition-colors group-hover:text-royal" aria-hidden="true" />
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>

              <ReadingGuide hasTarget={hasTarget} />
              <ChartTooltip tip={tip} width={width} />
            </div>
          ) : (
            <div className="overflow-x-auto scroll-slim">
              <table className="w-full min-w-[700px] border-separate border-spacing-0">
                <thead>
                  <tr>
                    <th className={TH}>Macro role</th>
                    <th className={`${TH} text-right`}>Holdings</th>
                    <th className={`${TH} text-right`}>Current</th>
                    <th className={`${TH} text-right`}>Target</th>
                    <th className={`${TH} text-right`}>Band</th>
                    <th className={`${TH} text-right`}>Gap</th>
                    <th className={TH}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(row => (
                    <tr key={row.role ?? row.order} className="transition-colors hover:bg-beige/50">
                      <td className={`${TD} font-semibold text-ink`}>
                        <button type="button" className="inline-flex items-center gap-2 text-left hover:text-royal" onClick={() => onOpenRole(row)}>
                          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: roleColor(row.role) }} aria-hidden="true" />
                          <span className="underline decoration-beige-line underline-offset-2">{text(row.role)}</span>
                        </button>
                      </td>
                      <td className={`${TD} text-right tabular-nums`}>{row.schemes.length}</td>
                      <td className={`${TD} text-right tabular-nums`}>{pct(row.currentMix)}</td>
                      <td className={`${TD} text-right tabular-nums`}>{pct(row.targetMix)}</td>
                      <td className={`${TD} whitespace-nowrap text-right tabular-nums`}>
                        {isNum(row.targetMix)
                          ? `${pct(Math.max(row.targetMix - ROLE_BAND_MARGIN, 0))} – ${pct(row.targetMix + ROLE_BAND_MARGIN)}`
                          : '—'}
                      </td>
                      <td className={`${TD} whitespace-nowrap text-right tabular-nums`} style={{ color: CHART.inkSoft }}>{deltaPp(row.gap)}</td>
                      <td className={TD}><StatusBadge status={row.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-2 text-[12px]" style={{ color: CHART.inkSoft }}>
                Gap is target − current, in percentage points: ▲ means the role is under-held (add), ▼ over-held (trim).
              </p>
            </div>
          )}
        </>
      )}
    </VizCard>
  )
}
