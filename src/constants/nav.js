import { PieChart, Crosshair } from 'lucide-react'

/** The sidebar tree, and the index the header search runs over. */
export const NAV_ITEMS = [
  {
    to: '/portfolio-snapshot',
    label: 'Portfolio Snapshot',
    icon: PieChart,
    section: 'Portfolio',
    keywords: [
      'portfolio snapshot', 'asset mix', 'allocation', 'equity', 'debt',
      'diversifier', 'hybrid', 'recommended', 'model', 'donut', 'chart',
    ],
  },
  {
    to: '/role-diagnostic',
    label: 'Role Diagnostic',
    icon: Crosshair,
    section: 'Portfolio',
    keywords: [
      'role analytic', 'role analytics', 'role diagnostic', 'macro role',
      'target', 'gap', 'band', 'current mix', 'chart',
    ],
  },
]

export const DEFAULT_ROUTE = '/portfolio-snapshot'
