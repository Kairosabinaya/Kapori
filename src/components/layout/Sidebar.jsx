import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, BrainCircuit, Map, Cpu, Bell,
  FileText, Settings, Menu, ChevronLeft, X
} from 'lucide-react'
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

export default function Sidebar({
  acknowledgedAlerts = [],
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onMobileClose,
  selectedFarm,
}) {
  const location = useLocation()
  const filteredAlerts = getFilteredAlerts(selectedFarm || 'Semua Area')
  const unacknowledgedCount = filteredAlerts.filter(a => !acknowledgedAlerts.includes(a.id)).length

  // On mobile drawer, always show full content; collapse only matters on desktop
  const expanded = !collapsed || mobileOpen

  return (
    <aside
      className={clsx(
        'fixed left-0 top-0 h-screen bg-white border-r border-gray-100 flex flex-col z-50 overflow-hidden',
        'w-64 transition-[width,transform] duration-200 ease-out',
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
        'md:translate-x-0',
        collapsed ? 'md:w-[72px]' : 'md:w-64'
      )}
    >
      {/* Logo + Toggle */}
      <div className="flex items-center justify-between gap-2 px-5 py-4 border-b border-gray-50 shrink-0 min-h-[64px]">
        {expanded && (
          <div className="flex flex-col">
            <KaporiLogo height={32} />
            <span className="text-[10px] text-gray-400 mt-1 leading-none">Data Presisi, Panen Lebih Pasti</span>
          </div>
        )}

        {/* Mobile close */}
        <button
          onClick={onMobileClose}
          className="md:hidden p-2.5 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Tutup menu"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>

        {/* Desktop collapse */}
        <button
          onClick={onToggleCollapse}
          className={clsx(
            'hidden md:flex p-2 hover:bg-gray-100 rounded-lg transition-colors items-center justify-center',
            collapsed && 'mx-auto'
          )}
          aria-label={collapsed ? 'Perluas sidebar' : 'Perkecil sidebar'}
          title={collapsed ? 'Perluas sidebar' : 'Perkecil sidebar'}
        >
          {collapsed ? <Menu className="w-4 h-4 text-gray-400" /> : <ChevronLeft className="w-4 h-4 text-gray-400" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-3 space-y-1 overflow-y-auto">
        {menuItems.map(item => {
          const isActive = location.pathname === item.path
          const Icon = item.icon
          const showBadge = item.path === '/peringatan' && unacknowledgedCount > 0
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onMobileClose}
              title={!expanded ? item.label : undefined}
              className={clsx(
                'flex items-center gap-3 rounded-lg text-sm font-medium transition-all relative px-3 py-2.5',
                isActive
                  ? 'bg-kapori-50 text-kapori-700 font-semibold border-l-4 border-kapori-600'
                  : 'text-gray-600 hover:bg-gray-50',
                !expanded && 'md:px-0 md:justify-center'
              )}
            >
              <Icon className={clsx('w-5 h-5 shrink-0', isActive ? 'text-kapori-600' : 'text-gray-400')} />
              {expanded && <span>{item.label}</span>}
              {showBadge && (
                <span
                  className={clsx(
                    'bg-red-500 text-white text-xs rounded-full min-w-[20px] text-center font-semibold',
                    expanded
                      ? 'ml-auto px-1.5 py-0.5'
                      : 'absolute -top-1 -right-1 px-1 py-0.5 text-[9px]'
                  )}
                >
                  {unacknowledgedCount}
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* User Info */}
      <div className="border-t border-gray-100 px-4 py-4 shrink-0">
        <div className={clsx('flex items-center', expanded ? 'gap-3' : 'justify-center')}>
          <div className="w-9 h-9 rounded-full bg-kapori-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
            DU
          </div>
          {expanded && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">Demo User</p>
              <span className="badge bg-kapori-800 text-white text-[10px]">DEMO</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
