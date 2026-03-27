import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, BrainCircuit, Map, Cpu, Bell,
  FileText, Settings, Menu, ChevronLeft
} from 'lucide-react'
import { motion } from 'framer-motion'
import clsx from 'clsx'
import KaporiLogo from '../ui/KaporiLogo'
import { getFilteredAlerts } from '../../data'

const menuItems = [
  { path: '/overview', label: 'Overview', icon: LayoutDashboard },
  { path: '/inteligensi', label: 'Inteligensi', icon: BrainCircuit },
  { path: '/lahan', label: 'Lahan', icon: Map },
  { path: '/perangkat', label: 'Perangkat', icon: Cpu },
  { path: '/peringatan', label: 'Peringatan', icon: Bell },
  { path: '/laporan', label: 'Laporan', icon: FileText },
  { path: '/pengaturan', label: 'Pengaturan', icon: Settings },
]

export default function Sidebar({ acknowledgedAlerts = [], collapsed, onToggleCollapse, selectedFarm }) {
  const location = useLocation()
  const filteredAlerts = getFilteredAlerts(selectedFarm || 'Semua Farm')
  const unacknowledgedCount = filteredAlerts.filter(a => !acknowledgedAlerts.includes(a.id)).length

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 256 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="fixed left-0 top-0 h-screen bg-white border-r border-gray-100 flex flex-col z-40 overflow-hidden"
    >
      {/* Logo Area */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-gray-50">
        {!collapsed && <KaporiLogo height={32} />}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors mx-auto"
          title={collapsed ? 'Perluas sidebar' : 'Perkecil sidebar'}
        >
          {collapsed ? <Menu className="w-4 h-4 text-gray-400" /> : <ChevronLeft className="w-4 h-4 text-gray-400" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : undefined}
              className={clsx(
                'flex items-center gap-3 rounded-lg text-sm font-medium transition-all relative',
                collapsed ? 'px-0 py-2.5 justify-center' : 'px-3 py-2.5',
                isActive
                  ? 'bg-kapori-50 text-kapori-700 font-semibold border-l-4 border-kapori-600'
                  : 'text-gray-600 hover:bg-gray-50'
              )}
            >
              <Icon className={clsx('w-5 h-5 shrink-0', isActive ? 'text-kapori-600' : 'text-gray-400')} />
              {!collapsed && <span>{item.label}</span>}
              {item.path === '/peringatan' && unacknowledgedCount > 0 && (
                <span className={clsx(
                  'bg-red-500 text-white text-xs rounded-full min-w-[20px] text-center',
                  collapsed ? 'absolute -top-1 -right-1 px-1 py-0.5 text-[9px]' : 'ml-auto px-1.5 py-0.5'
                )}>
                  {unacknowledgedCount}
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* User Info */}
      <div className="border-t border-gray-100 px-4 py-4">
        <div className={clsx('flex items-center', collapsed ? 'justify-center' : 'gap-3')}>
          <div className="w-9 h-9 rounded-full bg-kapori-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
            DU
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">Demo User</p>
              <span className="badge bg-kapori-800 text-white text-[10px]">DEMO</span>
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  )
}
