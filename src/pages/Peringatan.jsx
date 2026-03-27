import { useState, useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertOctagon, AlertTriangle, Info,
  CheckCircle, MapPin, Trash2, Search
} from 'lucide-react'
import clsx from 'clsx'
import toast from 'react-hot-toast'
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
  critical: { border: 'border-l-red-400', bg: 'bg-red-50', iconBg: 'bg-red-100', icon: 'text-red-500' },
  warning: { border: 'border-l-amber-400', bg: 'bg-amber-50', iconBg: 'bg-amber-100', icon: 'text-amber-500' },
  info: { border: 'border-l-blue-400', bg: 'bg-blue-50', iconBg: 'bg-blue-100', icon: 'text-blue-500' },
}

export default function Peringatan({ acknowledgedAlerts = [], onAcknowledge }) {
  const { filters } = useOutletContext()
  const { selectedFarm } = filters

  const allAlerts = useMemo(() => getFilteredAlerts(selectedFarm), [selectedFarm])

  const [activeTab, setActiveTab] = useState('semua')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAlert, setSelectedAlert] = useState(null)
  const [deletedAlerts, setDeletedAlerts] = useState([])

  const visibleAlerts = allAlerts.filter(a => !deletedAlerts.includes(a.id))

  const filteredAlerts = visibleAlerts
    .filter(a => activeTab === 'semua' || a.tipe === activeTab)
    .filter(a => !searchQuery || a.judul.toLowerCase().includes(searchQuery.toLowerCase()) || a.pesan.toLowerCase().includes(searchQuery.toLowerCase()))

  const getCounts = (type) => {
    if (type === 'semua') return visibleAlerts.length
    return visibleAlerts.filter(a => a.tipe === type).length
  }

  const handleAcknowledge = (id) => {
    if (onAcknowledge) onAcknowledge(id)
    toast('✓ Peringatan telah diakui', { style: { background: '#fff', color: '#1B4332', borderLeft: '4px solid #2D6A4F' } })
  }

  const handleDelete = (id) => {
    setDeletedAlerts(prev => [...prev, id])
    toast('🗑️ Peringatan dihapus', { style: { background: '#fff', color: '#92400E', borderLeft: '4px solid #F59E0B' } })
  }

  const handleAcknowledgeAll = () => {
    visibleAlerts.forEach(a => { if (!acknowledgedAlerts.includes(a.id) && onAcknowledge) onAcknowledge(a.id) })
    toast('✓ Semua peringatan telah diakui', { style: { background: '#fff', color: '#1B4332', borderLeft: '4px solid #2D6A4F' } })
  }

  return (
    <motion.div
      key={selectedFarm}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="space-y-5"
    >
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Cari peringatan..." className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-kapori-500 focus:border-transparent" />
        </div>
        <motion.button whileTap={{ scale: 0.97 }} onClick={handleAcknowledgeAll} className="btn-ghost text-sm flex items-center gap-1.5">
          <CheckCircle className="w-4 h-4" /> Akui Semua
        </motion.button>
      </div>

      <div className="flex gap-2">
        {tabs.map(tab => (
          <motion.button key={tab.key} whileTap={{ scale: 0.97 }} onClick={() => setActiveTab(tab.key)} className={clsx('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors', activeTab === tab.key ? 'bg-kapori-600 text-white' : 'btn-ghost')}>
            {tab.label}
            <span className={clsx('rounded-full px-1.5 py-0.5 text-xs min-w-[20px] text-center', activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500')}>{getCounts(tab.key)}</span>
          </motion.button>
        ))}
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {filteredAlerts.map(alert => {
            const isAcknowledged = acknowledgedAlerts.includes(alert.id)
            const colors = colorMap[alert.tipe]
            const Icon = isAcknowledged ? CheckCircle : iconMap[alert.tipe]
            return (
              <motion.div key={alert.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: isAcknowledged ? 0.5 : 1, y: 0 }} exit={{ opacity: 0, x: -200, height: 0 }} className={clsx('card p-4 border-l-4 flex items-start gap-4 transition-opacity cursor-pointer hover:shadow-md', colors.border)} onClick={() => setSelectedAlert(alert)}>
                <div className={clsx('p-2 rounded-full shrink-0', colors.iconBg)}>
                  <Icon className={clsx('w-5 h-5', isAcknowledged ? 'text-green-500' : colors.icon)} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-800 text-sm">{alert.judul}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{alert.pesan}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="badge bg-gray-100 text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" />{alert.lahan}</span>
                  </div>
                </div>
                <div className="text-right shrink-0 flex flex-col items-end gap-2" onClick={e => e.stopPropagation()}>
                  <p className="text-xs text-gray-400">{alert.waktu}</p>
                  <div className="flex items-center gap-1.5">
                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => handleAcknowledge(alert.id)} disabled={isAcknowledged} className={clsx('text-xs font-medium px-3 py-1.5 rounded-lg transition-colors', isAcknowledged ? 'bg-green-50 text-green-600 cursor-not-allowed' : 'bg-kapori-600 text-white hover:bg-kapori-700')}>
                      {isAcknowledged ? 'Diakui ✓' : '✓ Akui'}
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => handleDelete(alert.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors" title="Hapus"><Trash2 className="w-3.5 h-3.5" /></motion.button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
        {filteredAlerts.length === 0 && (
          <div className="text-center py-8 text-sm text-gray-400">
            {searchQuery ? `Tidak ada peringatan cocok dengan "${searchQuery}"` : `Tidak ada peringatan untuk ${selectedFarm} dalam kategori ini.`}
          </div>
        )}
      </div>

      <Modal isOpen={!!selectedAlert} onClose={() => setSelectedAlert(null)} title={selectedAlert?.judul || ''}>
        {selectedAlert && (
          <div className="space-y-4">
            <div className={clsx('p-4 rounded-xl', colorMap[selectedAlert.tipe]?.bg || 'bg-gray-50')}>
              <div className="flex items-center gap-2 mb-2">
                {selectedAlert.tipe === 'critical' ? <AlertOctagon className="w-5 h-5 text-red-500" /> : selectedAlert.tipe === 'warning' ? <AlertTriangle className="w-5 h-5 text-amber-500" /> : <Info className="w-5 h-5 text-blue-500" />}
                <span className={clsx('font-semibold text-sm badge', selectedAlert.tipe === 'critical' ? 'bg-red-100 text-red-700' : selectedAlert.tipe === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700')}>
                  {selectedAlert.tipe === 'critical' ? 'Kritis' : selectedAlert.tipe === 'warning' ? 'Peringatan' : 'Informasi'}
                </span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{selectedAlert.pesan}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-400">Lokasi</p><p className="text-sm font-semibold text-gray-700">{selectedAlert.lahan}</p></div>
              <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-400">Waktu</p><p className="text-sm font-semibold text-gray-700">{selectedAlert.waktu}</p></div>
            </div>
            <div className="flex gap-2">
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => { handleAcknowledge(selectedAlert.id); setSelectedAlert(null) }} disabled={acknowledgedAlerts.includes(selectedAlert.id)} className={clsx('flex-1 flex items-center justify-center gap-2 text-sm rounded-lg px-4 py-2 font-medium transition-colors', acknowledgedAlerts.includes(selectedAlert.id) ? 'bg-green-50 text-green-600 cursor-not-allowed' : 'bg-kapori-600 text-white hover:bg-kapori-700')}>
                <CheckCircle className="w-4 h-4" />{acknowledgedAlerts.includes(selectedAlert.id) ? 'Telah Diakui' : 'Akui Peringatan'}
              </motion.button>
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => { handleDelete(selectedAlert.id); setSelectedAlert(null) }} className="btn-ghost flex items-center justify-center gap-2 text-sm text-red-500"><Trash2 className="w-4 h-4" />Hapus</motion.button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  )
}
