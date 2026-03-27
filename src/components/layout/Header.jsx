import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Bell, Moon, Sun, ChevronDown, Check, X, Search, LogOut, User, Settings } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import toast from 'react-hot-toast'
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

function Dropdown({ options, value, onChange }) {
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
        className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
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
            className="absolute top-full right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 min-w-[180px]"
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

export default function Header({ acknowledgedAlerts = [], filters }) {
  const location = useLocation()
  const navigate = useNavigate()
  const title = pageTitles[location.pathname] || 'Dashboard'

  const { selectedFarm, selectedTime, setSelectedFarm, setSelectedTime } = filters

  const filteredAlerts = getFilteredAlerts(selectedFarm)
  const unacknowledgedCount = filteredAlerts.filter(a => !acknowledgedAlerts.includes(a.id)).length

  const [isDark, setIsDark] = useState(false)
  const [showNotif, setShowNotif] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

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

  const handleFarmChange = (val) => {
    setSelectedFarm(val)
    toast(`📍 Filter: ${val}`, {
      style: { background: '#fff', color: '#1B4332', borderLeft: '4px solid #2D6A4F' },
    })
  }

  const handleTimeChange = (val) => {
    setSelectedTime(val)
    toast(`📅 Periode: ${val}`, {
      style: { background: '#fff', color: '#1B4332', borderLeft: '4px solid #2D6A4F' },
    })
  }

  const handleDarkToggle = () => {
    setIsDark(!isDark)
    toast(isDark ? '☀️ Mode Terang diaktifkan' : '🌙 Mode Gelap diaktifkan', {
      style: { background: '#fff', color: '#1B4332', borderLeft: '4px solid #2D6A4F' },
    })
  }

  const recentAlerts = filteredAlerts.filter(a => !acknowledgedAlerts.includes(a.id)).slice(0, 3)

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6">
      {/* Left - Page Title + Search */}
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold text-gray-800">{title}</h1>
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 220, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <input
                autoFocus
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari lahan, perangkat..."
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-kapori-500"
                onKeyDown={e => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    toast(`🔍 Mencari: "${searchQuery}"`, {
                      style: { background: '#fff', color: '#1B4332', borderLeft: '4px solid #2D6A4F' },
                    })
                  }
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={() => { setShowSearch(!showSearch); if (showSearch) setSearchQuery('') }}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {showSearch ? <X className="w-4 h-4 text-gray-400" /> : <Search className="w-4 h-4 text-gray-400" />}
        </button>
      </div>

      {/* Right - Controls */}
      <div className="flex items-center gap-3">
        <Dropdown options={farmOptions} value={selectedFarm} onChange={handleFarmChange} />
        <Dropdown options={timeOptions} value={selectedTime} onChange={handleTimeChange} />

        {/* Dark Mode Toggle */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleDarkToggle}
          className={clsx(
            'p-2 rounded-lg transition-colors',
            isDark ? 'bg-gray-800 text-yellow-400' : 'hover:bg-gray-100'
          )}
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5 text-gray-400" />}
        </motion.button>

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => { setShowNotif(!showNotif); setShowProfile(false) }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
          >
            <Bell className="w-5 h-5 text-gray-400" />
            {unacknowledgedCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
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
                className="absolute top-full right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-100 w-80 z-50 overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <span className="font-semibold text-gray-800 text-sm">Notifikasi</span>
                  <span className="badge bg-red-100 text-red-600">{unacknowledgedCount} baru</span>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {recentAlerts.length > 0 ? recentAlerts.map(alert => (
                    <div
                      key={alert.id}
                      className="px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-50"
                      onClick={() => { navigate('/peringatan'); setShowNotif(false) }}
                    >
                      <div className="flex items-start gap-2">
                        <span className={clsx(
                          'w-2 h-2 rounded-full mt-1.5 shrink-0',
                          alert.tipe === 'critical' ? 'bg-red-500' : alert.tipe === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                        )} />
                        <div>
                          <p className="text-sm font-medium text-gray-800">{alert.judul}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{alert.waktu}</p>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="px-4 py-6 text-center text-sm text-gray-400">
                      Semua notifikasi telah dibaca ✓
                    </div>
                  )}
                </div>
                <button
                  onClick={() => { navigate('/peringatan'); setShowNotif(false) }}
                  className="w-full px-4 py-2.5 text-sm font-medium text-kapori-600 hover:bg-kapori-50 transition-colors text-center border-t border-gray-100"
                >
                  Lihat Semua Peringatan
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Avatar + Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => { setShowProfile(!showProfile); setShowNotif(false) }}
            className="w-8 h-8 rounded-full bg-kapori-600 text-white flex items-center justify-center text-xs font-bold cursor-pointer ring-2 ring-transparent hover:ring-kapori-200 transition-all"
          >
            DU
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
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <User className="w-4 h-4" /> Profil Saya
                  </button>
                  <button
                    onClick={() => { navigate('/pengaturan'); setShowProfile(false) }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <Settings className="w-4 h-4" /> Pengaturan
                  </button>
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button
                      onClick={() => {
                        setShowProfile(false)
                        toast('👋 Keluar dari akun demo', {
                          style: { background: '#fff', color: '#1B4332', borderLeft: '4px solid #2D6A4F' },
                        })
                      }}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
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
    </header>
  )
}
