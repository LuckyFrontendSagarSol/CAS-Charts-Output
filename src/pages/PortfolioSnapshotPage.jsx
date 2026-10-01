import useCasOutput from '@/hooks/useCasOutput'
import EmptyState from '@/components/charts/EmptyState'
import { SnapshotCharts } from '@/components/charts/ChartSections'

/**
 * Portfolio Snapshot — only the charts: the Equity / Debt / Diversifier mix of
 * the CAS output, today against the recommended model, as stacked, bar and
 * donut views. Each chart takes the full width of the page.
 */
export default function PortfolioSnapshotPage() {
  const cas = useCasOutput()
  return cas.status === 'ready' ? <SnapshotCharts output={cas.output} fullWidth /> : <EmptyState />
}
