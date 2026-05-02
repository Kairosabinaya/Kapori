import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import Sidebar from './Sidebar'
import Header from './Header'

const fullBleedRoutes = ['/lahan']

export default function Layout({ acknowledgedAlerts, filters }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const isFullBleed = fullBleedRoutes.includes(location.pathname)

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  return (
    <div className="flex min-h-screen">
      <Sidebar
        acknowledgedAlerts={acknowledgedAlerts}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        selectedFarm={filters.selectedFarm}
      />
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="md:hidden fixed inset-0 bg-black/40 z-40"
          />
        )}
      </AnimatePresence>
      <div
        className={clsx(
          'flex-1 flex flex-col min-w-0 transition-[margin] duration-200 ease-out',
          sidebarCollapsed ? 'md:ml-[72px]' : 'md:ml-64'
        )}
      >
        <Header
          acknowledgedAlerts={acknowledgedAlerts}
          filters={filters}
          onMobileMenuToggle={() => setMobileOpen(true)}
        />
        <main
          className={clsx(
            'flex-1 relative',
            isFullBleed ? 'overflow-hidden' : 'p-4 md:p-6 overflow-y-auto'
          )}
        >
          <Outlet context={{ filters }} />
        </main>
      </div>
    </div>
  )
}
