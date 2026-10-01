import { lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AdminLayout from '@/components/layout/AdminLayout'
import { DEFAULT_ROUTE } from '@/constants/nav'

/**
 * A fully static build — no backend, no API calls, no login. Every page reads
 * the CAS output from src/data/casOutput.json (see hooks/useCasOutput.js).
 */

const PortfolioSnapshotPage = lazy(() => import('@/pages/PortfolioSnapshotPage'))
const RoleDiagnosticPage = lazy(() => import('@/pages/RoleDiagnosticPage'))

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AdminLayout />}>
          <Route path="/" element={<Navigate to={DEFAULT_ROUTE} replace />} />
          <Route path="/portfolio-snapshot" element={<PortfolioSnapshotPage />} />
          <Route path="/role-diagnostic" element={<RoleDiagnosticPage />} />
          <Route path="*" element={<Navigate to={DEFAULT_ROUTE} replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
