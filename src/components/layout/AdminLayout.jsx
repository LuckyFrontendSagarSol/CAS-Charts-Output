import { Suspense, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import RouteFallback from '@/components/ui/RouteFallback'
import { selectSidebarCollapsed, toggleSidebar } from '@/store/uiSlice'

/**
 * Shell for every page: the navy sidebar (fixed on desktop, a drawer below
 * lg), the header, and the routed page in <Outlet />. There is no auth guard —
 * this build has no login.
 */
export default function AdminLayout() {
  const dispatch = useDispatch()
  const location = useLocation()
  const collapsed = useSelector(selectSidebarCollapsed)

  // The drawer belongs to the route it was opened on. Deriving `drawerOpen`
  // from the current path closes it on any navigation — a sidebar link, a
  // redirect, or the back button — without an effect that writes state back
  // after every route change. (Same approach as the public site's admin.)
  const [openedOnPath, setOpenedOnPath] = useState(null)
  const drawerOpen = openedOnPath === location.pathname

  return (
    <div className="flex h-screen overflow-hidden bg-beige font-body">
      {/* Desktop sidebar */}
      <div className="hidden shrink-0 lg:block">
        <Sidebar collapsed={collapsed} onToggle={() => dispatch(toggleSidebar())} />
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpenedOnPath(null)}
              className="fixed inset-0 z-50 bg-[rgba(8,15,46,0.55)] backdrop-blur-[3px] lg:hidden"
            />
            <motion.div
              key="drawer"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="fixed bottom-0 left-0 top-0 z-[51] shadow-[18px_0_50px_-18px_rgba(8,15,46,0.7)] lg:hidden"
            >
              <Sidebar mobile onClose={() => setOpenedOnPath(null)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenDrawer={() => setOpenedOnPath(location.pathname)} />

        <main className="scroll-slim min-h-0 flex-1 overflow-y-auto">
          {/* Keyed on the path so each page animates in on navigation. */}
          <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8">
            <Suspense fallback={<RouteFallback />}>
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <Outlet />
              </motion.div>
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  )
}
