import { useCallback, useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import AllocationChart from './AllocationChart'
import { AllocationBars, AllocationDonuts, AllocationColumns } from './AllocationViews'
import RoleDiagnosticChart from './RoleDiagnosticChart'
import RoleValueChart from './RoleValueChart'
import { RoleGapChart, RoleBars, RoleColumns } from './RoleViews'
import CasDetailModal from './CasDetailModal'
import { aggregate, isNum } from './casOutputData'

/**
 * The two chart groups of a CAS output, each usable on its own page or inside
 * the CAS Output dashboard:
 *
 *   SnapshotCharts  Portfolio Snapshot — stacked / bar / donut views
 *   RoleCharts      Role Diagnostic    — range / value / gap / bar views, and
 *                                        the holdings dialog a role opens
 *
 * `fullWidth` gives every chart the whole width of the page, one under the
 * other — what the chart-only pages use — and adds the column view, which
 * needs that width. Without it the three compact charts sit side by side
 * where there is room, as on the dashboard.
 *
 * There is no line, curve or area view: groups and roles are categories, not
 * points along an axis, so a line between two of them would show values that
 * do not exist.
 */

const STACK = 'grid gap-5 sm:gap-6'

export function SnapshotCharts({ output, fullWidth = false }) {
  const snapshot = output.portfolioSnapshot
  return (
    <div className={`${STACK} ${fullWidth ? '' : 'xl:grid-cols-3'}`}>
      <AllocationChart snapshot={snapshot} delay={0.05} />
      <AllocationBars snapshot={snapshot} delay={0.1} />
      <AllocationDonuts snapshot={snapshot} delay={0.15} />
      {fullWidth && <AllocationColumns snapshot={snapshot} delay={0.2} />}
    </div>
  )
}

export function RoleCharts({ output, fullWidth = false }) {
  const [modalStack, setModalStack] = useState([])
  const { schemes, roleDiagnostic } = output

  /* Units × NAV — the same basis as each scheme's market value, so the shares
     of the schemes add up to 100%. */
  const portfolioValue = useMemo(() => {
    const total = output.totals?.marketValue
    return isNum(total) && total > 0 ? total : aggregate(schemes).marketValue
  }, [output, schemes])

  const pushView = useCallback(view => setModalStack(stack => [...stack, view]), [])
  const backView = useCallback(() => setModalStack(stack => stack.slice(0, -1)), [])
  const closeModal = useCallback(() => setModalStack([]), [])
  const openRole = useCallback(
    row => setModalStack([{ kind: 'group', title: row.role || 'Macro role', subtitle: 'Macro role', schemes: row.schemes, role: row }]),
    [],
  )

  const gap = <RoleGapChart diagnostic={roleDiagnostic} schemes={schemes} onOpenRole={openRole} delay={0.1} />
  const bars = <RoleBars diagnostic={roleDiagnostic} schemes={schemes} onOpenRole={openRole} delay={0.15} />

  return (
    <>
      <div className={STACK}>
        <RoleDiagnosticChart diagnostic={roleDiagnostic} schemes={schemes} onOpenRole={openRole} delay={0.05} />
        <RoleValueChart diagnostic={roleDiagnostic} schemes={schemes} portfolioValue={portfolioValue} onOpenRole={openRole} delay={0.08} />
        {fullWidth ? (
          <>
            {gap}
            {bars}
            <RoleColumns diagnostic={roleDiagnostic} schemes={schemes} onOpenRole={openRole} delay={0.2} />
          </>
        ) : (
          /* items-start: the bar view runs taller than the gap view, and
             stretching the gap card to match only leaves an empty block
             under it. */
          <div className={`${STACK} items-start xl:grid-cols-2`}>{gap}{bars}</div>
        )}
      </div>

      <AnimatePresence>
        {modalStack.length > 0 && (
          <CasDetailModal
            key="cas-detail"
            stack={modalStack}
            portfolioValue={portfolioValue}
            onPush={pushView}
            onBack={backView}
            onClose={closeModal}
          />
        )}
      </AnimatePresence>
    </>
  )
}
