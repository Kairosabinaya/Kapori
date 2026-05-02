import { useState, useMemo } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertOctagon, AlertTriangle, Info,
  CheckCircle, MapPin, Trash2, Search,
  ArrowRight, BellOff
} from 'lucide-react'
import clsx from 'clsx'
import { notify } from '../lib/notify'
import Modal from '../components/ui/Modal'
import { getFilteredAlerts } from '../data'

const tabs = [
  { key: 'semua', label: 'Semua' },
  { key: 'critical', label: 'Kritis' },
  { key: 'warning', label: 'Peringatan' },
  { key: 'info', label: 'Info' },
]

const iconMap = { critical: AlertOctagon, warning: AlertTriangle, info: Info }

const colorMap = {
  critical: { border: 'border-l-red-400', bg: 'bg-red-50', iconBg: 'bg-red-100', icon: 'text-red-500', label: 'Kritis' },
  warning: { border: 'border-l-amber-400', bg: 'bg-amber-50', iconBg: 'bg-amber-100', icon: 'text-amber-500', label: 'Peringatan' },
  info: { border: 'border-l-blue-400', bg: 'bg-blue-50', iconBg: 'bg-blue-100', icon: 'text-blue-500', label: 'Informasi' },
}

// Where each alert category navigates when user clicks "Tindak lanjuti"
const followUpRoute = {
  perangkat: '/perangkat',
  lahan: '/lahan',
  sistem: '/perangkat',
}

export default function Peringatan({ acknowledgedAlerts = [], onAcknowledge }) {
  const { filters } = useOutletContext()
  const { selectedFarm } = filters
  const navigate = useNavigate()

  const allAlerts = useMemo(() => getFilteredAlerts(selectedFarm), [selectedFarm])

  const [activeTab, setActiveTab] = useState('semua')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAlert, setSelectedAlert] = useState(null)
  const [deletedAlerts, setDeletedAlerts] = useState([])
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const visibleAlerts = allAlerts.filter(a => !deletedAlerts.includes(a.id))

  const filteredAlerts = visibleAlerts
    .filter(a => activeTab === 'semua' || a.tipe === activeTab)
    .filter(a => !searchQuery
      || a.judul.toLowerCase().includes(searchQuery.toLowerCase())
      || a.pesan.toLowerCase().includes(searchQuery.toLowerCase()))

  const getCounts = (type) => {
    if (type === 'semua') return visibleAlerts.length
    return visibleAlerts.filter(a => a.tipe === type).length
  }

  const handleMarkRead = (id) => {
    if (onAcknowledge) onAcknowledge(id)
    notify.success('Ditandai sudah dibaca')
  }

  const handleFollowUp = (alert) => {
    if (onAcknowledge) onAcknowledge(alert.id)
    const route = followUpRoute[alert.kategori] || '/perangkat'
    navigate(route)
  }

  const handleDelete = (id) => {
    setDeletedAlerts(prev => [...prev, id])
    setDeleteConfirm(null)
    notify.info('Peringatan dihapus')
  }

  const handleMarkAllRead = () => {
    const pending = visibleAlerts.filter(a => !acknowledgedAlerts.includes(a.id))
    if (pending.length === 0) {
      notify.info('Tidak ada peringatan yang belum dibaca')
      return
    }
    pending.forEach(a => { if (onAcknowledge) onAcknowledge(a.id) })
    notify.success(`${pending.length} peringatan ditandai dibaca`)
  }

  const deleteTarget = deleteConfirm ? visibleAlerts.find(a => a.id === deleteConfirm) : null

  return (
    <motion.div
      key={selectedFarm}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="space-y-4 md:space-y-5"
    >
      {/* Search + Mark All */}
      <div className="flex flex-wrap items-center gap-2 md:gap-3">
        <div className="relative flex-1 min-w-[180px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari peringatan"
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-kapori-500 focus:border-transparent"
          />
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleMarkAllRead}
          className="btn-ghost text-sm flex items-center gap-1.5 py-2.5 shrink-0"
        >
          <CheckCircle className="w-4 h-4" /> Tandai semua dibaca
        </motion.button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 pb-1">
        {tabs.map(tab => (
          <motion.button
            key={tab.key}
            whileTap={{ scale: 0.97 }}
            onClick={() => setActiveTab(tab.key)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors shrink-0',
              activeTab === tab.key
                ? 'bg-kapori-600 text-white'
                : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
            )}
          >
            {tab.label}
            <span className={clsx(
              'rounded-full px-1.5 py-0.5 text-xs min-w-[20px] text-center',
              activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
            )}>
              {getCounts(tab.key)}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Alert list */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredAlerts.map(alert => {
            const isRead = acknowledgedAlerts.includes(alert.id)
            const colors = colorMap[alert.tipe]
            const Icon = isRead ? CheckCircle : iconMap[alert.tipe]
            return (
              <motion.div
                key={alert.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: isRead ? 0.55 : 1, y: 0 }}
                exit={{ opacity: 0, x: -200, height: 0 }}
                className={clsx(
                  'card p-4 border-l-4 flex flex-wrap sm:flex-nowrap items-start gap-3 sm:gap-4 transition-opacity cursor-pointer hover:shadow-md',
                  colors.border
                )}
                onClick={() => setSelectedAlert(alert)}
              >
                <div className={clsx('p-2 rounded-full shrink-0', colors.iconBg)}>
                  <Icon className={clsx('w-5 h-5', isRead ? 'text-green-500' : colors.icon)} />
                </div>
                <div className="flex-1 min-w-0 order-2 sm:order-none basis-full sm:basis-auto">
                  <h3 className="font-bold text-gray-800 text-sm">{alert.judul}</h3>
                  <p className="text-sm text-gray-500 mt-0.5 leading-snug">{alert.pesan}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="badge bg-gray-100 text-gray-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{alert.lahan}
                    </span>
                    <span className="text-xs text-gray-400">{alert.waktu}</span>
                    {alert.kategori && (
                      <span className="text-[10px] text-gray-400 uppercase tracking-wide bg-gray-50 rounded px-1.5 py-0.5">
                        {alert.kategori}
                      </span>
                    )}
                  </div>
                </div>
                <div
                  className="flex items-center gap-1.5 shrink-0 ml-auto sm:ml-0"
                  onClick={e => e.stopPropagation()}
                >
                  {!isRead && alert.kategori && alert.kategori !== 'sistem' && (
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleFollowUp(alert)}
                      className="text-xs font-medium px-3 py-2 rounded-lg bg-kapori-600 text-white hover:bg-kapori-700 transition-colors flex items-center gap-1.5"
                    >
                      Tindak lanjuti
                      <ArrowRight className="w-3 h-3" />
                    </motion.button>
                  )}
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleMarkRead(alert.id)}
                    disabled={isRead}
                    className={clsx(
                      'text-xs font-medium px-3 py-2 rounded-lg transition-colors',
                      isRead
                        ? 'bg-green-50 text-green-600 cursor-default'
                        : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                    )}
                    title={isRead ? 'Sudah dibaca' : 'Tandai sebagai dibaca'}
                  >
                    {isRead ? 'Sudah dibaca' : 'Tandai dibaca'}
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setDeleteConfirm(alert.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Hapus"
                    aria-label="Hapus peringatan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
        {filteredAlerts.length === 0 && (
          <div className="text-center py-10 px-4">
            <BellOff className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              {searchQuery
                ? <>Tidak ada peringatan cocok dengan <span className="font-medium">"{searchQuery}"</span>.</>
                : <>Tidak ada peringatan untuk {selectedFarm} dalam kategori ini.</>}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-kapori-600 hover:text-kapori-700 mt-2 font-medium"
              >
                Hapus pencarian
              </button>
            )}
          </div>
        )}
      </div>

      {/* Detail modal */}
      <Modal
        isOpen={!!selectedAlert}
        onClose={() => setSelectedAlert(null)}
        title={selectedAlert?.judul || ''}
      >
        {selectedAlert && (
          <div className="space-y-4">
            <div className={clsx('p-4 rounded-xl', colorMap[selectedAlert.tipe]?.bg || 'bg-gray-50')}>
              <div className="flex items-center gap-2 mb-2">
                {selectedAlert.tipe === 'critical' ? <AlertOctagon className="w-5 h-5 text-red-500" />
                  : selectedAlert.tipe === 'warning' ? <AlertTriangle className="w-5 h-5 text-amber-500" />
                  : <Info className="w-5 h-5 text-blue-500" />}
                <span className={clsx(
                  'font-semibold text-sm badge',
                  selectedAlert.tipe === 'critical' ? 'bg-red-100 text-red-700'
                    : selectedAlert.tipe === 'warning' ? 'bg-amber-100 text-amber-700'
                    : 'bg-blue-100 text-blue-700'
                )}>
                  {colorMap[selectedAlert.tipe]?.label}
                </span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{selectedAlert.pesan}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400">Lokasi</p>
                <p className="text-sm font-semibold text-gray-700">{selectedAlert.lahan}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400">Waktu</p>
                <p className="text-sm font-semibold text-gray-700">{selectedAlert.waktu}</p>
              </div>
              {selectedAlert.kategori && (
                <div className="bg-gray-50 rounded-xl p-3 col-span-2">
                  <p className="text-xs text-gray-400">Kategori</p>
                  <p className="text-sm font-semibold text-gray-700 capitalize">{selectedAlert.kategori}</p>
                </div>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              {selectedAlert.kategori && selectedAlert.kategori !== 'sistem' && (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { handleFollowUp(selectedAlert); setSelectedAlert(null) }}
                  className="flex-1 min-w-[140px] flex items-center justify-center gap-2 text-sm rounded-lg px-4 py-2.5 font-medium transition-colors bg-kapori-600 text-white hover:bg-kapori-700"
                >
                  Tindak lanjuti
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              )}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => { handleMarkRead(selectedAlert.id); setSelectedAlert(null) }}
                disabled={acknowledgedAlerts.includes(selectedAlert.id)}
                className={clsx(
                  'flex-1 min-w-[140px] flex items-center justify-center gap-2 text-sm rounded-lg px-4 py-2.5 font-medium transition-colors',
                  acknowledgedAlerts.includes(selectedAlert.id)
                    ? 'bg-green-50 text-green-600 cursor-default'
                    : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                )}
              >
                <CheckCircle className="w-4 h-4" />
                {acknowledgedAlerts.includes(selectedAlert.id) ? 'Sudah dibaca' : 'Tandai dibaca'}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => { setDeleteConfirm(selectedAlert.id); setSelectedAlert(null) }}
                className="btn-ghost flex items-center justify-center gap-2 text-sm text-red-500 py-2.5"
              >
                <Trash2 className="w-4 h-4" />Hapus
              </motion.button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete confirm */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Hapus peringatan"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {deleteTarget
              ? <>Peringatan <span className="font-semibold text-gray-800">{deleteTarget.judul}</span> akan dihapus dari daftar. Tindakan ini tidak dapat dibatalkan.</>
              : 'Peringatan akan dihapus.'}
          </p>
          <div className="flex gap-2">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => handleDelete(deleteConfirm)}
              className="flex-1 bg-red-500 text-white rounded-lg px-4 py-2.5 font-medium text-sm hover:bg-red-600 transition-colors"
            >
              Hapus
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setDeleteConfirm(null)}
              className="flex-1 btn-ghost text-sm"
            >
              Batal
            </motion.button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}
