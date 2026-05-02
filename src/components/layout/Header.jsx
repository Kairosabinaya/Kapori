import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Bell, ChevronDown, Check, LogOut, User, Settings, Menu } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import { notify } from '../../lib/notify'
import { getFilteredAlerts } from '../../data'

const pageTitles = {
  '/overview': 'Overview',
  '/inteligensi': 'Inteligensi',
  '/lahan': 'Lahan',
  '/perangkat': 'Perangkat',
  '/peringatan': 'Peringatan',
  '/laporan': 'Laporan',
  '/pengaturan': 'Pengaturan',
}

const farmOptions = ['Semua Farm', 'Farm Utama', 'Farm Selatan', 'Farm Barat']
const timeOptions = ['Hari Ini', '7 Hari Terakhir', '30 Hari Terakhir', 'Bulan Ini', 'Kustom']

const farmFilterRoutes = ['/overview', '/inteligensi', '/lahan', '/perangkat', '/peringatan', '/laporan']
const timeFilterRoutes = ['/overview', '/lahan']

function Dropdown({ options, value, onChange, menuAlign = 'right', label }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors whitespace-nowrap"
        aria-label={label}
      >
        {value}
        <ChevronDown className={clsx('w-4 h-4 transition-transform', open && 'rotate-180')} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            className={clsx(
              'absolute top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 min-w-[180px]',
              menuAlign === 'right' ? 'right-0' : 'left-0'
            )}
          >
            {options.map(opt => (
              <button
                key={opt}
                onClick={() => { onChange(opt); setOpen(false) }}
                className={clsx(
                  'flex items-center justify-between w-full px-3 py-2 text-sm hover:bg-gray-50 transition-colors',
                  value === opt ? 'text-kapori-700 font-medium' : 'text-gray-600'
                )}
              >
                {opt}
                {value === opt && <Check className="w-4 h-4 text-kapori-600" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Header({ acknowledgedAlerts = [], filters, onMobileMenuToggle }) {
  const location = useLocation()
  const navigate = useNavigate()
  const title = pageTitles[location.pathname] || 'Dashboard'

  const { selectedFarm, selectedTime, setSelectedFarm, setSelectedTime } = filters

  const showFarmFilter = farmFilterRoutes.includes(location.pathname)
  const showTimeFilter = timeFilterRoutes.includes(location.pathname)
  const hasMobileFilters = showFarmFilter || showTimeFilter

  const filteredAlerts = getFilteredAlerts(selectedFarm)
  const unacknowledgedCount = filteredAlerts.filter(a => !acknowledgedAlerts.includes(a.id)).length

  const [showNotif, setShowNotif] = useState(false)
  const [showProfile, setShowProfile] = useState(false)

  const notifRef = useRef(null)
  const profileRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false)
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => {
    setShowProfile(false)
    notify.info('Keluar dari akun demo')
  }

  const recentAlerts = filteredAlerts.filter(a => !acknowledgedAlerts.includes(a.id)).slice(0, 3)

  return (
    <header className="bg-white border-b border-gray-100">
      <div className="h-16 flex items-center justify-between px-4 md:px-6 gap-2">
        {/* Left: hamburger + title */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onMobileMenuToggle}
            className="md:hidden p-2.5 -ml-1 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Buka menu"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-base md:text-lg font-bold text-gray-800 truncate">{title}</h1>
        </div>

        {/* Right: filters (desktop) + actions */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Desktop filters */}
          <div className="hidden md:flex items-center gap-3">
            {showFarmFilter && (
              <Dropdown
                options={farmOptions}
                value={selectedFarm}
                onChange={setSelectedFarm}
                menuAlign="right"
                label="Filter farm"
              />
            )}
            {showTimeFilter && (
              <Dropdown
                options={timeOptions}
                value={selectedTime}
                onChange={setSelectedTime}
                menuAlign="right"
                label="Filter periode"
              />
            )}
          </div>

          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => { setShowNotif(!showNotif); setShowProfile(false) }}
              className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors relative"
              aria-label="Notifikasi"
            >
              <Bell className="w-5 h-5 text-gray-400" />
              {unacknowledgedCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center font-bold">
                  {unacknowledgedCount}
                </span>
              )}
            </motion.button>

            <AnimatePresence>
              {showNotif && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.97 }}
                  transition={{ duration: 0.12 }}
                  className="absolute top-full right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-100 w-[calc(100vw-2rem)] max-w-[320px] z-50 overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <span className="font-semibold text-gray-800 text-sm">Notifikasi</span>
                    {unacknowledgedCount > 0 && (
                      <span className="badge bg-red-100 text-red-600">{unacknowledgedCount} baru</span>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {recentAlerts.length > 0 ? recentAlerts.map(alert => (
                      <button
                        key={alert.id}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-50"
                        onClick={() => { navigate('/peringatan'); setShowNotif(false) }}
                      >
                        <div className="flex items-start gap-2">
                          <span className={clsx(
                            'w-2 h-2 rounded-full mt-1.5 shrink-0',
                            alert.tipe === 'critical' ? 'bg-red-500' : alert.tipe === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                          )} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{alert.judul}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{alert.waktu}</p>
                          </div>
                        </div>
                      </button>
                    )) : (
                      <div className="px-4 py-6 text-center text-sm text-gray-400">
                        Tidak ada notifikasi baru
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => { navigate('/peringatan'); setShowNotif(false) }}
                    className="w-full px-4 py-2.5 text-sm font-medium text-kapori-600 hover:bg-kapori-50 transition-colors text-center border-t border-gray-100"
                  >
                    Lihat semua peringatan
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Avatar / Profile */}
          <div className="relative" ref={profileRef}>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => { setShowProfile(!showProfile); setShowNotif(false) }}
              className="p-1.5 rounded-full hover:bg-gray-50 transition-colors"
              aria-label="Profil"
            >
              <span className="w-8 h-8 rounded-full bg-kapori-600 text-white flex items-center justify-center text-xs font-bold ring-2 ring-transparent hover:ring-kapori-200 transition-all">
                DU
              </span>
            </motion.button>

            <AnimatePresence>
              {showProfile && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.97 }}
                  transition={{ duration: 0.12 }}
                  className="absolute top-full right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-100 w-56 z-50 overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="font-semibold text-gray-800 text-sm">Demo User</p>
                    <p className="text-xs text-gray-400">demo@kapori.app</p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => { navigate('/pengaturan'); setShowProfile(false) }}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      <User className="w-4 h-4" /> Profil saya
                    </button>
                    <button
                      onClick={() => { navigate('/pengaturan'); setShowProfile(false) }}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      <Settings className="w-4 h-4" /> Pengaturan
                    </button>
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" /> Keluar
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Mobile filter strip */}
      {hasMobileFilters && (
        <div className="md:hidden flex flex-wrap items-center gap-2 px-4 pb-3 pt-1">
          {showFarmFilter && (
            <Dropdown
              options={farmOptions}
              value={selectedFarm}
              onChange={setSelectedFarm}
              menuAlign="left"
              label="Filter farm"
            />
          )}
          {showTimeFilter && (
            <Dropdown
              options={timeOptions}
              value={selectedTime}
              onChange={setSelectedTime}
              menuAlign="left"
              label="Filter periode"
            />
          )}
        </div>
      )}
    </header>
  )
}
