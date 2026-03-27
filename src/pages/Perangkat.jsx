import { useState, useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Cpu, Plus, Wifi, Battery, Sun,
  AlertCircle, Clock, Power, RefreshCw, Trash2
} from 'lucide-react'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import StatusDot from '../components/ui/StatusDot'
import ProgressBar from '../components/ui/ProgressBar'
import Modal from '../components/ui/Modal'
import { getFilteredPerangkats } from '../data'
import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip
} from 'recharts'

function generateSignalHistory() {
  return Array.from({ length: 7 }, (_, i) => ({
    hari: `H${i + 1}`,
    sinyal: Math.round(60 + Math.random() * 35),
  }))
}

const newDeviceNames = ['Sensor Tambahan', 'Relay Node Baru', 'Kontroler Cadangan', 'Weather Station']

export default function Perangkat() {
  const { filters } = useOutletContext()
  const { selectedFarm } = filters

  const initialDevices = useMemo(() => getFilteredPerangkats(selectedFarm), [selectedFarm])

  const [extraDevices, setExtraDevices] = useState([])
  const [removedIds, setRemovedIds] = useState([])
  const [diagnosticDevice, setDiagnosticDevice] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newDeviceName, setNewDeviceName] = useState('')
  const [newDeviceLahan, setNewDeviceLahan] = useState('Lahan A')
  const [addingDevice, setAddingDevice] = useState(false)
  const signalHistory = useMemo(() => generateSignalHistory(), [])

  const devices = [...initialDevices, ...extraDevices].filter(d => !removedIds.includes(d.id))

  const handleAddDevice = () => {
    setShowAddModal(true)
    setNewDeviceName('')
    setNewDeviceLahan('Lahan A')
  }

  const handleConfirmAdd = () => {
    if (!newDeviceName.trim()) {
      toast('⚠️ Masukkan nama perangkat', { style: { background: '#fff', color: '#92400E', borderLeft: '4px solid #F59E0B' } })
      return
    }
    setAddingDevice(true)
    setTimeout(() => {
      const newDevice = {
        id: `SN-${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String(Math.floor(Math.random() * 99)).padStart(2, '0')}`,
        nama: newDeviceName,
        lahan: newDeviceLahan,
        status: 'online',
        sinyal: Math.floor(75 + Math.random() * 25),
        baterai: Math.floor(80 + Math.random() * 20),
        solarCharge: Math.round((10 + Math.random() * 8) * 10) / 10,
        lastReport: 'Baru saja',
        error: null,
      }
      setExtraDevices(prev => [...prev, newDevice])
      setAddingDevice(false)
      setShowAddModal(false)
      toast('✓ Perangkat berhasil ditambahkan', { style: { background: '#fff', color: '#1B4332', borderLeft: '4px solid #2D6A4F' } })
    }, 1200)
  }

  const handleRestartDevice = (device) => {
    toast(`🔄 Memulai ulang ${device.nama}...`, { style: { background: '#fff', color: '#1B4332', borderLeft: '4px solid #2D6A4F' } })
  }

  const handleRemoveDevice = (deviceId) => {
    setRemovedIds(prev => [...prev, deviceId])
    toast('🗑️ Perangkat dihapus', { style: { background: '#fff', color: '#92400E', borderLeft: '4px solid #F59E0B' } })
  }

  return (
    <motion.div
      key={selectedFarm}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="space-y-6"
    >
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Manajemen Armada Perangkat</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Pantau sensor IoT, relay, dan kontroler.
            <span className="font-medium text-gray-600"> {devices.length} perangkat terdaftar · {selectedFarm}</span>
          </p>
        </div>
        <motion.button whileTap={{ scale: 0.97 }} onClick={handleAddDevice} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Tambah Perangkat
        </motion.button>
      </div>

      {devices.length > 0 ? (
        <div className="grid grid-cols-2 gap-4">
          <AnimatePresence>
            {devices.map(device => (
              <motion.div key={device.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95, height: 0 }} whileHover={{ y: -3, boxShadow: '0 8px 25px rgba(0,0,0,0.1)' }} className="card p-5 relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-kapori-50 rounded-xl"><Cpu className="w-5 h-5 text-kapori-600" /></div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{device.nama}</h3>
                      <p className="text-xs text-gray-400">{device.id} · {device.lahan}</p>
                    </div>
                  </div>
                  <StatusDot status={device.status} />
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className={clsx('rounded-xl p-3', device.sinyal < 50 ? 'bg-amber-50' : 'bg-gray-50')}>
                    <div className="flex items-center gap-1.5 mb-1"><Wifi className="w-3.5 h-3.5 text-gray-400" /><span className="text-xs text-gray-400">Sinyal</span></div>
                    <p className={clsx('text-lg font-bold', device.sinyal < 50 ? 'text-amber-500' : 'text-gray-800')}>{device.sinyal}%</p>
                  </div>
                  <div className={clsx('rounded-xl p-3', device.baterai < 25 ? 'bg-red-50' : 'bg-gray-50')}>
                    <div className="flex items-center gap-1.5 mb-1"><Battery className="w-3.5 h-3.5 text-gray-400" /><span className="text-xs text-gray-400">Baterai</span></div>
                    <p className={clsx('text-lg font-bold', device.baterai < 25 ? 'text-red-500' : 'text-gray-800')}>{device.baterai}%</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5"><Sun className="w-3.5 h-3.5 text-amber-400" /><span className="text-xs text-gray-400">Solar Charge</span></div>
                    <span className="text-sm font-bold text-gray-800">{device.solarCharge}W</span>
                  </div>
                  <ProgressBar value={device.solarCharge} max={20} color={device.solarCharge > 5 ? 'amber' : 'red'} />
                </div>
                {device.error && (
                  <div className="bg-red-50 text-red-600 rounded-lg p-2 text-sm flex items-start gap-2 mb-3">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><span>{device.error}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
                  <Clock className="w-3 h-3" /> Terakhir: {device.lastReport}
                </div>
                <div className="flex gap-2">
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => setDiagnosticDevice(device)} className="btn-ghost flex-1 text-sm">Lihat Diagnostik</motion.button>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => handleRestartDevice(device)} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors" title="Mulai Ulang"><RefreshCw className="w-4 h-4 text-gray-400" /></motion.button>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => handleRemoveDevice(device.id)} className="p-2 border border-gray-200 rounded-lg hover:bg-red-50 transition-colors" title="Hapus"><Trash2 className="w-4 h-4 text-red-400" /></motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="card p-8 text-center text-sm text-gray-400">
          Tidak ada perangkat terdaftar untuk {selectedFarm}.
        </div>
      )}

      {/* Diagnostic Modal */}
      <Modal isOpen={!!diagnosticDevice} onClose={() => setDiagnosticDevice(null)} title={diagnosticDevice ? `${diagnosticDevice.nama} — Diagnostik` : ''}>
        {diagnosticDevice && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <Cpu className="w-5 h-5 text-kapori-600" />
              <div><p className="font-semibold text-gray-800">{diagnosticDevice.nama}</p><p className="text-xs text-gray-400">{diagnosticDevice.id} · {diagnosticDevice.lahan}</p></div>
              <div className="ml-auto"><StatusDot status={diagnosticDevice.status} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3 text-center"><p className="text-xs text-gray-400">Sinyal</p><p className="text-xl font-bold text-gray-800">{diagnosticDevice.sinyal}%</p></div>
              <div className="bg-gray-50 rounded-xl p-3 text-center"><p className="text-xs text-gray-400">Baterai</p><p className="text-xl font-bold text-gray-800">{diagnosticDevice.baterai}%</p></div>
              <div className="bg-gray-50 rounded-xl p-3 text-center"><p className="text-xs text-gray-400">Solar Charge</p><p className="text-xl font-bold text-gray-800">{diagnosticDevice.solarCharge}W</p></div>
              <div className="bg-gray-50 rounded-xl p-3 text-center"><p className="text-xs text-gray-400">Terakhir Online</p><p className="text-sm font-bold text-gray-800">{diagnosticDevice.lastReport}</p></div>
            </div>
            <div><p className="text-sm font-semibold text-gray-700 mb-2">Riwayat Sinyal (7 hari)</p>
              <div className="bg-gray-50 rounded-xl p-3">
                <ResponsiveContainer width="100%" height={120}>
                  <AreaChart data={signalHistory}><XAxis dataKey="hari" tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} /><YAxis hide domain={[0, 100]} /><Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} formatter={(val) => [`${val}%`, 'Sinyal']} /><Area type="monotone" dataKey="sinyal" stroke="#2D6A4F" fill="rgba(45,106,79,0.15)" strokeWidth={2} /></AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="flex gap-2">
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => { handleRestartDevice(diagnosticDevice); setDiagnosticDevice(null) }} className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm"><RefreshCw className="w-4 h-4" />Mulai Ulang</motion.button>
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => { toast(`⏱️ Kalibrasi ${diagnosticDevice.nama} dimulai...`, { style: { background: '#fff', color: '#1B4332', borderLeft: '4px solid #2D6A4F' } }); setDiagnosticDevice(null) }} className="btn-ghost flex-1 flex items-center justify-center gap-2 text-sm"><Power className="w-4 h-4" />Kalibrasi</motion.button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Device Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Tambah Perangkat Baru">
        <div className="space-y-4">
          <div><label className="text-sm font-medium text-gray-600 mb-1.5 block">Nama Perangkat</label><input value={newDeviceName} onChange={e => setNewDeviceName(e.target.value)} placeholder="Contoh: Sensor Suhu Lahan D" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-kapori-500 focus:border-transparent" /></div>
          <div><label className="text-sm font-medium text-gray-600 mb-1.5 block">Pilih Perangkat</label>
            <div className="grid grid-cols-2 gap-2">{newDeviceNames.map(name => (<button key={name} onClick={() => setNewDeviceName(name)} className={clsx('p-2 rounded-lg text-sm border transition-colors', newDeviceName === name ? 'border-kapori-500 bg-kapori-50 text-kapori-700 font-medium' : 'border-gray-200 text-gray-600 hover:bg-gray-50')}>{name}</button>))}</div>
          </div>
          <div><label className="text-sm font-medium text-gray-600 mb-1.5 block">Lahan</label><select value={newDeviceLahan} onChange={e => setNewDeviceLahan(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-kapori-500 focus:border-transparent"><option>Lahan A</option><option>Lahan B</option><option>Lahan C</option></select></div>
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleConfirmAdd} disabled={addingDevice} className="btn-primary w-full flex items-center justify-center gap-2 text-sm">
            {addingDevice ? (<><RefreshCw className="w-4 h-4 animate-spin" />Mendaftarkan...</>) : (<><Plus className="w-4 h-4" />Tambah Perangkat</>)}
          </motion.button>
        </div>
      </Modal>
    </motion.div>
  )
}
