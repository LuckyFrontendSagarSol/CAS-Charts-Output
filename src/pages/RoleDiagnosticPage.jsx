import useCasOutput from '@/hooks/useCasOutput'
import EmptyState from '@/components/charts/EmptyState'
import { RoleCharts } from '@/components/charts/ChartSections'

/**
 * Role Diagnostic — only the charts: each macro role of the CAS output against
 * its target, as range, gap and bar views. Each chart takes the full width of
 * the page, and a role opens its holdings.
 */
export default function RoleDiagnosticPage() {
  const cas = useCasOutput()
  return cas.status === 'ready' ? <RoleCharts output={cas.output} fullWidth /> : <EmptyState />
}
