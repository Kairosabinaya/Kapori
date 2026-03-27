import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import Sidebar from './Sidebar'
import Header from './Header'

export default function Layout({ acknowledgedAlerts, filters }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="flex min-h-screen">
      <Sidebar
        acknowledgedAlerts={acknowledgedAlerts}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        selectedFarm={filters.selectedFarm}
      />
      <motion.div
        animate={{ marginLeft: sidebarCollapsed ? 72 : 256 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="flex-1 flex flex-col"
      >
        <Header
          acknowledgedAlerts={acknowledgedAlerts}
          filters={filters}
        />
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet context={{ filters }} />
        </main>
      </motion.div>
    </div>
  )
}
