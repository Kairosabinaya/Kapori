import { useState, useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Cpu, Plus, Wifi, Battery, Sun,
  AlertCircle, Clock, Power, RefreshCw, Trash2
} from 'lucide-react'
import clsx from 'clsx'
import { notify } from '../lib/notify'
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
  const [newDeviceLahan, setNewDeviceLahan] = useState('Lahan Utama')
  const [addingDevice, setAddingDevice] = useState(false)
  const [restartingIds, setRestartingIds] = useState([])
  const [removeConfirm, setRemoveConfirm] = useState(null)
  const signalHistory = useMemo(() => generateSignalHistory(), [])

  const devices = [...initialDevices, ...extraDevices].filter(d => !removedIds.includes(d.id))

  const handleAddDevice = () => {
    setShowAddModal(true)
    setNewDeviceName('')
    setNewDeviceLahan('Lahan Utama')
  }

  const handleConfirmAdd = () => {
    if (!newDeviceName.trim()) {
      notify.warning('Masukkan nama perangkat')
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
      notify.success('Perangkat ditambahkan')
    }, 1200)
  }

  const handleRestartDevice = (device) => {
    if (restartingIds.includes(device.id)) return
    setRestartingIds(prev => [...prev, device.id])
    notify.info(`${device.nama} sedang dimulai ulang…`)
    setTimeout(() => {
      setRestartingIds(prev => prev.filter(id => id !== device.id))
      notify.success(`${device.nama} dimulai ulang`)
    }, 1800)
  }

  const handleRemoveDevice = (deviceId) => {
    setRemovedIds(prev => [...prev, deviceId])
    setRemoveConfirm(null)
    notify.info('Perangkat dihapus')
  }

  const removeTarget = removeConfirm ? devices.find(d => d.id === removeConfirm) : null

  return (
    <motion.div
      key={selectedFarm}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="space-y-4 md:space-y-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-gray-800">Manajemen armada perangkat</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Pantau sensor IoT, relay, dan kontroler.{' '}
            <span className="font-medium text-gray-600">{devices.length} perangkat terdaftar · {selectedFarm}</span>
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleAddDevice}
          className="btn-primary flex items-center gap-2 text-sm py-2.5 shrink-0"
        >
          <Plus className="w-4 h-4" /> Tambah perangkat
        </motion.button>
      </div>

      {devices.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AnimatePresence>
            {devices.map(device => {
              const isRestarting = restartingIds.includes(device.id)
              return (
                <motion.div
                  key={device.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95, height: 0 }}
                  whileHover={{ y: -3, boxShadow: '0 8px 25px rgba(0,0,0,0.1)' }}
                  className="card p-5 relative"
                >
                  <div className="flex items-start justify-between mb-4 gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-kapori-50 rounded-xl shrink-0">
                        <Cpu className="w-5 h-5 text-kapori-600" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-800 truncate">{device.nama}</h3>
                        <p className="text-xs text-gray-400 truncate">{device.id} · {device.lahan}</p>
                      </div>
                    </div>
                    <StatusDot status={device.status} />
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className={clsx('rounded-xl p-3', device.sinyal < 50 ? 'bg-amber-50' : 'bg-gray-50')}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Wifi className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs text-gray-400">Sinyal</span>
                      </div>
                      <p className={clsx('text-lg font-bold', device.sinyal < 50 ? 'text-amber-600' : 'text-gray-800')}>
                        {device.sinyal}%
                      </p>
                    </div>
                    <div className={clsx('rounded-xl p-3', device.baterai < 25 ? 'bg-red-50' : 'bg-gray-50')}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Battery className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs text-gray-400">Baterai</span>
                      </div>
                      <p className={clsx('text-lg font-bold', device.baterai < 25 ? 'text-red-500' : 'text-gray-800')}>
                        {device.baterai}%
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-3 mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <Sun className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-xs text-gray-400">Solar charge</span>
                      </div>
                      <span className="text-sm font-bold text-gray-800">{device.solarCharge}W</span>
                    </div>
                    <ProgressBar value={device.solarCharge} max={20} color={device.solarCharge > 5 ? 'amber' : 'red'} />
                  </div>

                  {device.error && (
                    <div className="bg-red-50 text-red-600 rounded-lg p-2.5 text-sm flex items-start gap-2 mb-3">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>{device.error}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
                    <Clock className="w-3 h-3" /> Terakhir: {device.lastReport}
                  </div>

                  <div className="flex gap-2">
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setDiagnosticDevice(device)}
                      className="btn-ghost flex-1 text-sm py-2"
                    >
                      Lihat diagnostik
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleRestartDevice(device)}
                      disabled={isRestarting}
                      className={clsx(
                        'p-2.5 border border-gray-200 rounded-lg transition-colors',
                        isRestarting ? 'bg-gray-100 cursor-wait' : 'hover:bg-gray-50'
                      )}
                      title="Mulai ulang"
                      aria-label="Mulai ulang perangkat"
                    >
                      <RefreshCw className={clsx('w-4 h-4 text-gray-500', isRestarting && 'animate-spin')} />
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setRemoveConfirm(device.id)}
                      className="p-2.5 border border-gray-200 rounded-lg hover:bg-red-50 hover:border-red-200 transition-colors"
                      title="Hapus"
                      aria-label="Hapus perangkat"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </motion.button>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      ) : (
        <div className="card p-8 text-center">
          <Cpu className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Tidak ada perangkat untuk {selectedFarm}.</p>
          <p className="text-xs text-gray-400 mt-1">Tambahkan perangkat baru lewat tombol di kanan atas.</p>
        </div>
      )}

      {/* Diagnostic Modal */}
      <Modal
        isOpen={!!diagnosticDevice}
        onClose={() => setDiagnosticDevice(null)}
        title={diagnosticDevice ? `${diagnosticDevice.nama} — diagnostik` : ''}
      >
        {diagnosticDevice && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <Cpu className="w-5 h-5 text-kapori-600 shrink-0" />
              <div className="min-w-0">
                <p className="font-semibold text-gray-800 truncate">{diagnosticDevice.nama}</p>
                <p className="text-xs text-gray-400 truncate">{diagnosticDevice.id} · {diagnosticDevice.lahan}</p>
              </div>
              <div className="ml-auto"><StatusDot status={diagnosticDevice.status} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-400">Sinyal</p>
                <p className="text-xl font-bold text-gray-800">{diagnosticDevice.sinyal}%</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-400">Baterai</p>
                <p className="text-xl font-bold text-gray-800">{diagnosticDevice.baterai}%</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-400">Solar charge</p>
                <p className="text-xl font-bold text-gray-800">{diagnosticDevice.solarCharge}W</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-400">Terakhir online</p>
                <p className="text-sm font-bold text-gray-800">{diagnosticDevice.lastReport}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Riwayat sinyal (7 hari)</p>
              <div className="bg-gray-50 rounded-xl p-3">
                <ResponsiveContainer width="100%" height={120}>
                  <AreaChart data={signalHistory}>
                    <XAxis dataKey="hari" tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
                    <YAxis hide domain={[0, 100]} />
                    <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} formatter={(val) => [`${val}%`, 'Sinyal']} />
                    <Area type="monotone" dataKey="sinyal" stroke="#2D6A4F" fill="rgba(45,106,79,0.15)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="flex gap-2">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => { handleRestartDevice(diagnosticDevice); setDiagnosticDevice(null) }}
                className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm py-2.5"
              >
                <RefreshCw className="w-4 h-4" />Mulai ulang
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  notify.info(`Kalibrasi ${diagnosticDevice.nama} dimulai`)
                  setDiagnosticDevice(null)
                }}
                className="btn-ghost flex-1 flex items-center justify-center gap-2 text-sm py-2.5"
              >
                <Power className="w-4 h-4" />Kalibrasi
              </motion.button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Device Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Tambah perangkat baru"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1.5 block">Nama perangkat</label>
            <input
              value={newDeviceName}
              onChange={e => setNewDeviceName(e.target.value)}
              placeholder="Mis. Sensor Suhu Cadangan"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-kapori-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1.5 block">Pilih jenis perangkat</label>
            <div className="grid grid-cols-2 gap-2">
              {newDeviceNames.map(name => (
                <button
                  key={name}
                  onClick={() => setNewDeviceName(name)}
                  className={clsx(
                    'p-2.5 rounded-lg text-sm border transition-colors',
                    newDeviceName === name
                      ? 'border-kapori-500 bg-kapori-50 text-kapori-700 font-medium'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  )}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1.5 block">Lahan</label>
            <select
              value={newDeviceLahan}
              onChange={e => setNewDeviceLahan(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-kapori-500 focus:border-transparent bg-white"
            >
              <option>Lahan Utama</option>
              <option>Lahan Selatan</option>
              <option>Lahan Barat</option>
            </select>
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleConfirmAdd}
            disabled={addingDevice}
            className="btn-primary w-full flex items-center justify-center gap-2 text-sm py-2.5"
          >
            {addingDevice ? (
              <><RefreshCw className="w-4 h-4 animate-spin" />Mendaftarkan…</>
            ) : (
              <><Plus className="w-4 h-4" />Tambah perangkat</>
            )}
          </motion.button>
        </div>
      </Modal>

      {/* Remove Confirm Modal */}
      <Modal
        isOpen={!!removeConfirm}
        onClose={() => setRemoveConfirm(null)}
        title="Hapus perangkat"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {removeTarget
              ? <>Perangkat <span className="font-semibold text-gray-800">{removeTarget.nama}</span> akan dihapus dari armada. Tindakan ini tidak dapat dibatalkan.</>
              : 'Perangkat akan dihapus.'}
          </p>
          <div className="flex gap-2">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => handleRemoveDevice(removeConfirm)}
              className="flex-1 bg-red-500 text-white rounded-lg px-4 py-2.5 font-medium text-sm hover:bg-red-600 transition-colors"
            >
              Hapus
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setRemoveConfirm(null)}
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
