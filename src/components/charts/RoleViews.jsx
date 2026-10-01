import { useMemo } from 'react'
import { ArrowLeftRight, BarChart3, ChartArea, ChartColumn, ChevronRight } from 'lucide-react'
import { VizCard, LegendKey, StatusBadge } from './VizParts'
import BulletBars from './BulletBars'
import { ColumnChart, AreaChart } from './XYCharts'
import {
  AREA_CURRENT, CHART, ROLE_BAND_MARGIN, ROLE_STATUS, STATUS_TONE, buildRoleRows, deltaPp, isNum, pp,
  roleColor, roleValueTipRows, statusTone, text,
} from './casOutputData'

/**
 * Four more ways to read the Role Diagnostic, beside the range view
 * (RoleDiagnosticChart.jsx). Same rows in the same order, a role is its
 * family's colour in every one, and every row opens the same holdings dialog:
 *
 *   RoleGapChart  only the gap — how much to add to or trim from each role
 *   RoleBars      a solid bar for today's mix, a dark tick for the target
 *   RoleColumns   a solid column for today's mix, a hollow one for the target
 *   RoleArea      today's mix and the target as two filled curves
 */

const NO_ROWS = <p className="py-8 text-center text-[13px] text-ink-mute">No role diagnostic in this output.</p>

/* Name | track | action when the card is wide; on a narrow card the name takes
   its own line so the track keeps its width. */
const GRID = 'grid grid-cols-[1fr_6rem] gap-x-3 @md:grid-cols-[minmax(0,10rem)_1fr_6.5rem]'

const holdingsNote = count => `${count} holding${count === 1 ? '' : 's'}`

/* ── Gap view ──────────────────────────────────────────────────────────── */

/**
 * A diverging bar from a zero line: right is under-held (add), left is
 * over-held (trim). The ±band sits shaded around zero, so a bar that stays
 * inside it is on track — and one that leaves it shows by how much. Bar colour
 * is status, the only place colour means good or not; the gap itself is given
 * in percentage points.
 */
const action = row => {
  if (!isNum(row.gap)) return { text: 'No target', tone: STATUS_TONE.none }
  if (row.status === ROLE_STATUS.WITHIN) return { text: 'On track', tone: STATUS_TONE.ok }
  return { text: `${row.gap > 0 ? 'Add' : 'Trim'} ${pp(row.gap)}`, tone: STATUS_TONE.act }
}

export function RoleGapChart({ diagnostic, schemes, onOpenRole, delay }) {
  const rows = useMemo(() => buildRoleRows(diagnostic, schemes), [diagnostic, schemes])
  const hasTarget = rows.some(row => isNum(row.gap))

  // Symmetric scale: the largest gap either way, and always past the band edge.
  const reach = Math.min(
    1,
    Math.ceil(Math.max(ROLE_BAND_MARGIN * 1.5, ...rows.map(row => Math.abs(row.gap ?? 0))) * 10 - 1e-9) / 10,
  )
  const at = value => `${50 + (Math.max(Math.min(value, reach), -reach) / reach) * 50}%`

  return (
    <VizCard
      title="Gap view"
      subtitle="How far each role is from its target, in percentage points — bars to the right need adding, bars to the left need trimming."
      icon={ArrowLeftRight}
      delay={delay}
    >
      {!rows.length ? NO_ROWS : !hasTarget ? (
        <p className="py-8 text-center text-[13px] text-ink-mute">
          No risk profile row matched this client, so there are no targets to measure a gap against.
        </p>
      ) : (
        <>
          {/* Direction heading over the track column. */}
          <div className={`mb-1 ${GRID} px-1`}>
            <span className="hidden @md:block" />
            <span className="flex justify-between text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: CHART.inkSoft }}>
              <span>← Trim</span>
              <span>Add →</span>
            </span>
            <span />
          </div>

          <ul>
            {rows.map(row => {
              const next = action(row)
              const hasGap = isNum(row.gap)
              return (
                <li key={row.role ?? row.order}>
                  <button
                    type="button"
                    onClick={() => onOpenRole(row)}
                    className={`group ${GRID} w-full items-center gap-y-1.5 rounded-lg px-1 py-2.5 text-left transition-colors hover:bg-beige/50`}
                  >
                    <span className="col-span-2 min-w-0 @md:col-span-1">
                      <span className="block truncate font-display text-[12.5px] font-bold text-ink" title={row.role}>{text(row.role)}</span>
                      <span className="block text-[11px] text-ink-mute">{holdingsNote(row.schemes.length)}</span>
                    </span>

                    <span className="relative block h-7 rounded-[4px]" style={{ background: CHART.track }} aria-hidden="true">
                      {/* Full track, the ±band, the zero line, then the bar. */}
                      {hasGap && (
                        <span
                          className="absolute inset-y-0 rounded-[4px]"
                          style={{ left: at(-ROLE_BAND_MARGIN), right: `calc(100% - ${at(ROLE_BAND_MARGIN)})`, background: CHART.band }}
                        />
                      )}
                      <span className="absolute inset-y-0 w-px" style={{ left: '50%', background: CHART.zero }} />
                      {hasGap && Math.abs(row.gap) > 0 && (
                        <span
                          className="absolute top-1/2 h-3 -translate-y-1/2 transition-[filter] group-hover:brightness-110"
                          style={{
                            left: row.gap > 0 ? '50%' : at(row.gap),
                            right: row.gap > 0 ? `calc(100% - ${at(row.gap)})` : '50%',
                            background: statusTone(row.status).line,
                            borderRadius: row.gap > 0 ? '0 4px 4px 0' : '4px 0 0 4px',
                          }}
                        />
                      )}
                      {!hasGap && (
                        <span className="absolute inset-0 grid place-items-center text-[11px] italic" style={{ color: CHART.inkSoft }}>no target</span>
                      )}
                    </span>

                    <span className="flex items-center justify-end gap-1">
                      <span className="text-right text-[12px] font-bold tabular-nums" style={{ color: next.tone.text }}>{next.text}</span>
                      <ChevronRight size={14} className="shrink-0 text-ink-mute transition-colors group-hover:text-royal" aria-hidden="true" />
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>

          {/* Scale, in percentage points: the reach either way, the band edges and zero. */}
          <div className={`mt-1 ${GRID} px-1`}>
            <span className="hidden @md:block" />
            <span className="relative block h-4">
              {[-reach, -ROLE_BAND_MARGIN, 0, ROLE_BAND_MARGIN, reach].map((tick, index, all) => (
                <span
                  key={tick}
                  className={[
                    'absolute whitespace-nowrap text-[10.5px] tabular-nums',
                    index === 0 ? '' : index === all.length - 1 ? '-translate-x-full' : '-translate-x-1/2',
                    Math.abs(tick) === ROLE_BAND_MARGIN ? 'hidden @md:inline' : '',
                  ].join(' ')}
                  style={{ left: at(tick), color: CHART.inkSoft }}
                >
                  {tick === 0 ? '0' : `${tick > 0 ? '+' : '−'}${Math.round(Math.abs(tick) * 100)} pp`}
                </span>
              ))}
            </span>
            <span />
          </div>

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
            <LegendKey color={STATUS_TONE.act.line} label="Needs action (Below / Above Band)" />
            <LegendKey color={STATUS_TONE.ok.line} label="On track (Within Band)" />
            <LegendKey color={CHART.band} label={`±${ROLE_BAND_MARGIN * 100} pp band`} shape="band" />
          </div>
        </>
      )}
    </VizCard>
  )
}

/* ── Bar view ──────────────────────────────────────────────────────────── */

export function RoleBars({ diagnostic, schemes, onOpenRole, delay }) {
  const rows = useMemo(() => buildRoleRows(diagnostic, schemes), [diagnostic, schemes])

  return (
    <VizCard
      title="Bar view"
      subtitle="Each role on its own: the bar is today's mix, the tick is the target."
      icon={BarChart3}
      delay={delay}
    >
      {!rows.length ? NO_ROWS : (
        <BulletBars
          rows={rows.map(row => ({
            key: row.role ?? row.order,
            label: text(row.role),
            sublabel: holdingsNote(row.schemes.length),
            current: row.currentMix,
            target: row.targetMix,
            color: roleColor(row.role),
            badge: <StatusBadge status={row.status} />,
            onClick: () => onOpenRole(row),
          }))}
          targetLabel="Target"
        />
      )}
    </VizCard>
  )
}

/* ── Column view ───────────────────────────────────────────────────────── */

/* A role name with its status under it needs more room than a bare label. */
const ROLE_BAND = 108

export function RoleColumns({ diagnostic, schemes, onOpenRole, delay }) {
  const rows = useMemo(() => buildRoleRows(diagnostic, schemes), [diagnostic, schemes])
  const hasTarget = rows.some(row => isNum(row.targetMix))

  return (
    <VizCard
      title="Column view"
      subtitle="Roles along the bottom, share of the portfolio up the side. The solid column is today's mix; the hollow one is the target. Select a role to see its holdings."
      icon={ChartColumn}
      delay={delay}
    >
      {!rows.length ? NO_ROWS : (
        <>
          <ColumnChart
            minBand={ROLE_BAND}
            categories={rows.map(row => ({
              key: row.role ?? row.order,
              label: text(row.role),
              note: <StatusBadge status={row.status} />,
              onClick: () => onOpenRole(row),
              extra: [
                { label: 'gap (target − current)', value: deltaPp(row.gap) },
                { label: row.schemes.length === 1 ? 'holding' : 'holdings', value: row.schemes.length },
                ...roleValueTipRows(row),
              ],
              bars: [
                { name: 'Current', value: row.currentMix, color: roleColor(row.role) },
                ...(hasTarget ? [{ name: 'Target', value: row.targetMix, color: roleColor(row.role), hollow: true }] : []),
              ],
            }))}
          />
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
            <LegendKey color={CHART.inkSoft} label="Current" />
            {hasTarget && <LegendKey color={CHART.inkSoft} label="Target" shape="hollow" />}
          </div>
        </>
      )}
    </VizCard>
  )
}

/* ── Area view ─────────────────────────────────────────────────────────── */

export function RoleArea({ diagnostic, schemes, onOpenRole, delay }) {
  const rows = useMemo(() => buildRoleRows(diagnostic, schemes), [diagnostic, schemes])
  const hasTarget = rows.some(row => isNum(row.targetMix))

  return (
    <VizCard
      title="Area view"
      subtitle="Today's mix and the target as two filled curves — the space between the two shapes is the gap. Select a role to see its holdings."
      icon={ChartArea}
      delay={delay}
    >
      {!rows.length ? NO_ROWS : (
        <>
          <AreaChart
            label="Role diagnostic area chart"
            minBand={ROLE_BAND}
            categories={rows.map(row => ({
              key: row.role ?? row.order,
              label: text(row.role),
              note: <StatusBadge status={row.status} />,
              onClick: () => onOpenRole(row),
              extra: [
                { label: 'gap (target − current)', value: deltaPp(row.gap) },
                { label: row.schemes.length === 1 ? 'holding' : 'holdings', value: row.schemes.length },
                ...roleValueTipRows(row),
              ],
            }))}
            series={[
              { name: 'Current mix', color: AREA_CURRENT, values: rows.map(row => row.currentMix) },
              ...(hasTarget ? [{ name: 'Target', color: CHART.target, values: rows.map(row => row.targetMix), target: true }] : []),
            ]}
          />
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
            <LegendKey color={AREA_CURRENT} label="Current mix" shape="line" />
            {hasTarget && <LegendKey color={CHART.target} label="Target — dashed, hollow points" shape="line" />}
          </div>
        </>
      )}
    </VizCard>
  )
}
