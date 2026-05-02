import { useState, useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Cpu, Plus, Wifi, Battery, Sun, Radio, Zap as Relay,
  Cloud, Network, Server, AlertCircle, Clock, Power,
  RefreshCw, Trash2, Download
} from 'lucide-react'
import clsx from 'clsx'
import { notify } from '../lib/notify'
import StatusDot from '../components/ui/StatusDot'
import ProgressBar from '../components/ui/ProgressBar'
import Modal from '../components/ui/Modal'
import { getFilteredDevices } from '../data'
import { classifyMetric } from '../lib/domain'
import { downloadDeviceDiagnosticCSV } from '../lib/downloads'
import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip
} from 'recharts'

function generateSignalHistory(deviceId) {
  // Deterministic per device
  let h = 0
  for (let i = 0; i < deviceId.length; i++) h = ((h << 5) - h + deviceId.charCodeAt(i)) | 0
  return Array.from({ length: 7 }, (_, i) => {
    const v = Math.abs((h * (i + 1)) % 35) + 60
    return { hari: `H${i + 1}`, sinyal: Math.round(v) }
  })
}

const tipeMeta = {
  sensor:   { icon: Radio,   label: 'Sensor IoT',          color: 'bg-kapori-50 text-kapori-600' },
  relay:    { icon: Relay,   label: 'Relay irigasi',       color: 'bg-blue-50 text-blue-600' },
  weather:  { icon: Cloud,   label: 'Stasiun cuaca',       color: 'bg-sky-50 text-sky-600' },
  gateway:  { icon: Network, label: 'Gateway LTE',         color: 'bg-purple-50 text-purple-600' },
  compute:  { icon: Server,  label: 'Edge AI compute',     color: 'bg-indigo-50 text-indigo-600' },
}

const newDeviceTypes = [
  { value: 'sensor', label: 'Sensor IoT' },
  { value: 'relay', label: 'Relay irigasi' },
  { value: 'weather', label: 'Stasiun cuaca' },
]

export default function Perangkat() {
  const { filters } = useOutletContext()
  const { selectedFarm } = filters

  const initialDevices = useMemo(() => getFilteredDevices(selectedFarm), [selectedFarm])

  const [extraDevices, setExtraDevices] = useState([])
  const [removedIds, setRemovedIds] = useState([])
  const [diagnosticDevice, setDiagnosticDevice] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newDeviceName, setNewDeviceName] = useState('')
  const [newDeviceTipe, setNewDeviceTipe] = useState('sensor')
  const [newDeviceLahan, setNewDeviceLahan] = useState('Lahan Utama')
  const [addingDevice, setAddingDevice] = useState(false)
  const [restartingIds, setRestartingIds] = useState([])
  const [removeConfirm, setRemoveConfirm] = useState(null)

  const devices = [...initialDevices, ...extraDevices].filter(d => !removedIds.includes(d.id))

  const counts = devices.reduce((acc, d) => {
    acc[d.status] = (acc[d.status] || 0) + 1
    return acc
  }, {})

  const handleAddDevice = () => {
    setShowAddModal(true)
    setNewDeviceName('')
    setNewDeviceTipe('sensor')
    setNewDeviceLahan('Lahan Utama')
  }

  const handleConfirmAdd = () => {
    if (!newDeviceName.trim()) {
      notify.warning('Masukkan nama perangkat')
      return
    }
    setAddingDevice(true)
    setTimeout(() => {
      const prefix = newDeviceTipe === 'sensor' ? 'SN'
        : newDeviceTipe === 'relay' ? 'RN'
        : 'WS'
      const newDevice = {
        id: `${prefix}-${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String(Math.floor(Math.random() * 99)).padStart(2, '0')}`,
        nama: newDeviceName,
        lahan: newDeviceLahan,
        tipe: newDeviceTipe,
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
      notify.success(`Perangkat ${newDevice.nama} terdaftar (${newDevice.id})`)
    }, 1200)
  }

  const handleRestartDevice = (device) => {
    if (restartingIds.includes(device.id)) return
    setRestartingIds(prev => [...prev, device.id])
    notify.info(`${device.nama} sedang dimulai ulang…`)
    setTimeout(() => {
      setRestartingIds(prev => prev.filter(id => id !== device.id))
      notify.success(`${device.nama} dimulai ulang (uptime reset)`)
    }, 1800)
  }

  const handleRemoveDevice = (deviceId) => {
    setRemovedIds(prev => [...prev, deviceId])
    setRemoveConfirm(null)
    notify.info('Perangkat dihapus dari armada')
  }

  const handleDownloadDiagnostic = (device) => {
    downloadDeviceDiagnosticCSV(device, generateSignalHistory(device.id))
    notify.success(`Diagnostik ${device.nama} diunduh (CSV)`)
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
            {devices.length} perangkat terdaftar · {selectedFarm}
            <span className="ml-2 text-xs">
              <span className="text-green-600 font-medium">{counts.online || 0} online</span>
              {' · '}
              <span className="text-amber-600 font-medium">{counts.peringatan || 0} perhatian</span>
              {' · '}
              <span className="text-red-500 font-medium">{counts.offline || 0} offline</span>
            </span>
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
              const meta = tipeMeta[device.tipe] || tipeMeta.sensor
              const Icon = meta.icon
              const isOffline = device.status === 'offline'
              return (
                <motion.div
                  key={device.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95, height: 0 }}
                  whileHover={{ y: -3, boxShadow: '0 8px 25px rgba(0,0,0,0.1)' }}
                  className={clsx(
                    'card p-5 relative',
                    isOffline && 'opacity-75'
                  )}
                >
                  <div className="flex items-start justify-between mb-4 gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={clsx('p-2 rounded-xl shrink-0', meta.color)}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-800 truncate">{device.nama}</h3>
                        <p className="text-xs text-gray-400 truncate">
                          {device.id} · {device.lahan} · {meta.label}
                        </p>
                      </div>
                    </div>
                    <StatusDot status={device.status === 'online' ? 'online' : device.status === 'offline' ? 'offline' : 'peringatan'} />
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
                    <div className={clsx('rounded-xl p-3', device.baterai < 25 && device.baterai > 0 ? 'bg-red-50' : 'bg-gray-50')}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Battery className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs text-gray-400">Baterai</span>
                      </div>
                      <p className={clsx('text-lg font-bold', device.baterai < 25 && device.baterai > 0 ? 'text-red-500' : 'text-gray-800')}>
                        {device.baterai}%
                      </p>
                    </div>
                  </div>

                  {device.tipe === 'sensor' && (
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
                  )}

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
          <DiagnosticContent
            device={diagnosticDevice}
            signalHistory={generateSignalHistory(diagnosticDevice.id)}
            onRestart={() => { handleRestartDevice(diagnosticDevice); setDiagnosticDevice(null) }}
            onCalibrate={() => {
              notify.info(`Kalibrasi ${diagnosticDevice.nama} dimulai`)
              setDiagnosticDevice(null)
            }}
            onDownload={() => handleDownloadDiagnostic(diagnosticDevice)}
          />
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
              placeholder="Mis. Sensor Tambahan Lahan Utama"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kapori-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1.5 block">Jenis perangkat</label>
            <div className="grid grid-cols-3 gap-2">
              {newDeviceTypes.map(t => (
                <button
                  key={t.value}
                  onClick={() => setNewDeviceTipe(t.value)}
                  className={clsx(
                    'p-2.5 rounded-lg text-sm border transition-colors',
                    newDeviceTipe === t.value
                      ? 'border-kapori-500 bg-kapori-50 text-kapori-700 font-medium'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1.5 block">Lahan</label>
            <select
              value={newDeviceLahan}
              onChange={e => setNewDeviceLahan(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kapori-500 focus:border-transparent bg-white"
            >
              <option>Lahan Utama</option>
              <option>Lahan Selatan</option>
              <option>Lahan Barat</option>
              <option>Sistem</option>
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

function DiagnosticContent({ device, signalHistory, onRestart, onCalibrate, onDownload }) {
  const meta = tipeMeta[device.tipe] || tipeMeta.sensor
  const Icon = meta.icon
  const isSensor = device.tipe === 'sensor'

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
        <div className={clsx('p-2 rounded-xl shrink-0', meta.color)}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-gray-800 truncate">{device.nama}</p>
          <p className="text-xs text-gray-400 truncate">{device.id} · {device.lahan} · {meta.label}</p>
        </div>
        <div className="ml-auto"><StatusDot status={device.status === 'online' ? 'online' : device.status === 'offline' ? 'offline' : 'peringatan'} /></div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-400">Sinyal</p>
          <p className="text-xl font-bold text-gray-800">{device.sinyal}%</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-400">Baterai</p>
          <p className="text-xl font-bold text-gray-800">{device.baterai}%</p>
        </div>
        {isSensor && (
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-400">Solar charge</p>
            <p className="text-xl font-bold text-gray-800">{device.solarCharge}W</p>
          </div>
        )}
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-400">Terakhir online</p>
          <p className="text-sm font-bold text-gray-800">{device.lastReport}</p>
        </div>
      </div>

      {/* Sensor measurements (only for sensor type) */}
      {isSensor && device.kelembaban != null && (
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Pembacaan sensor terakhir</p>
          <div className="bg-gray-50 rounded-xl p-3 space-y-1.5 text-sm">
            <DiagRow label="Kelembaban tanah" value={`${device.kelembaban}%`} status={classifyMetric(device.kelembaban, 'kelembaban')} />
            <DiagRow label="Suhu" value={`${device.suhu}°C`} status={classifyMetric(device.suhu, 'suhu')} />
            <DiagRow label="Kelembaban udara" value={`${device.airHumidity}%`} status={classifyMetric(device.airHumidity, 'airHumidity')} />
            <DiagRow label="pH tanah" value={device.ph} status={classifyMetric(device.ph, 'ph')} />
            <DiagRow label="Konduktivitas (EC)" value={`${device.ec} dS/m`} status={classifyMetric(device.ec, 'ec')} />
            <DiagRow label="Indeks NPK" value={device.npk} status={classifyMetric(device.npk, 'npk')} />
          </div>
        </div>
      )}

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

      <div className="flex gap-2 flex-wrap">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onRestart}
          className="btn-primary flex-1 min-w-[140px] flex items-center justify-center gap-2 text-sm py-2.5"
        >
          <RefreshCw className="w-4 h-4" />Mulai ulang
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onCalibrate}
          className="btn-ghost flex-1 min-w-[140px] flex items-center justify-center gap-2 text-sm py-2.5"
        >
          <Power className="w-4 h-4" />Kalibrasi
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onDownload}
          className="btn-ghost flex items-center justify-center gap-2 text-sm py-2.5 px-3"
          aria-label="Unduh diagnostik"
        >
          <Download className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  )
}

function DiagRow({ label, value, status }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-500">{label}</span>
      <span className={clsx(
        'font-semibold tabular-nums flex items-center gap-1.5',
        status === 'optimal' ? 'text-green-700'
          : status === 'warning' ? 'text-amber-700'
          : status === 'critical' ? 'text-red-700' : 'text-gray-800'
      )}>
        <span className={clsx(
          'w-1.5 h-1.5 rounded-full',
          status === 'optimal' ? 'bg-green-500'
            : status === 'warning' ? 'bg-amber-500'
            : status === 'critical' ? 'bg-red-500' : 'bg-gray-400'
        )} />
        {value}
      </span>
    </div>
  )
}
