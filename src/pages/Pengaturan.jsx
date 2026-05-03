import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Bell, Sliders, Mail, Save, Camera, Check } from 'lucide-react'
import clsx from 'clsx'
import { notify } from '../lib/notify'
import Modal from '../components/ui/Modal'
import { SENSOR_THRESHOLDS } from '../lib/sensor-thresholds'

function Toggle({ label, defaultChecked = false, onChange }) {
  const [checked, setChecked] = useState(defaultChecked)

  const handleToggle = () => {
    const newVal = !checked
    setChecked(newVal)
    if (onChange) onChange(newVal)
    notify.success(`${label} ${newVal ? 'diaktifkan' : 'dinonaktifkan'}`)
  }

  return (
    <div className="flex items-center justify-between py-3 gap-4">
      <span className="text-sm text-gray-700 min-w-0">{label}</span>
      <button
        onClick={handleToggle}
        className="flex items-center justify-center min-h-[44px] px-1 -my-2 shrink-0"
        aria-label={`${checked ? 'Matikan' : 'Aktifkan'} ${label}`}
        aria-pressed={checked}
      >
        <span
          className={clsx(
            'relative w-11 h-6 rounded-full transition-colors duration-200 block',
            checked ? 'bg-kapori-600' : 'bg-gray-300'
          )}
        >
          <motion.span
            className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm block"
            animate={{ x: checked ? 20 : 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        </span>
      </button>
    </div>
  )
}

function SliderInput({ label, defaultValue, min, max, step = 1, unit = '' }) {
  const [value, setValue] = useState(defaultValue)
  const [saved, setSaved] = useState(true)

  const handleChange = (newVal) => {
    setValue(newVal)
    setSaved(false)
  }

  const handleSave = () => {
    setSaved(true)
    notify.success(`${label} diatur ke ${value}${unit}`)
  }

  return (
    <div className="py-3">
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="text-sm text-gray-700 min-w-0">{label}</span>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-bold text-kapori-700">{value}{unit}</span>
          {!saved && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleSave}
              className="text-xs bg-kapori-600 text-white px-2.5 py-1 rounded-md hover:bg-kapori-700 transition-colors"
            >
              Simpan
            </motion.button>
          )}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => handleChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-kapori-600"
        aria-label={label}
      />
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  )
}

export default function Pengaturan() {
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [profileName, setProfileName] = useState('Demo User')
  const [profileEmail, setProfileEmail] = useState('demo@kapori.app')
  const [profilePhone, setProfilePhone] = useState('+62 812-3456-7890')
  const [profileRole, setProfileRole] = useState('Administrator')
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editRole, setEditRole] = useState('')
  const [saving, setSaving] = useState(false)

  const openEditProfile = () => {
    setEditName(profileName)
    setEditEmail(profileEmail)
    setEditPhone(profilePhone)
    setEditRole(profileRole)
    setShowEditProfile(true)
  }

  const handleSaveProfile = () => {
    setSaving(true)
    setTimeout(() => {
      setProfileName(editName)
      setProfileEmail(editEmail)
      setProfilePhone(editPhone)
      setProfileRole(editRole)
      setSaving(false)
      setShowEditProfile(false)
      notify.success('Profil diperbarui')
    }, 1000)
  }

  const initials = profileName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="space-y-4 md:space-y-6 max-w-3xl"
    >
      {/* Section 1: Profil Akun */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-kapori-600" />
          <h2 className="text-lg font-bold text-gray-800">Profil akun</h2>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-kapori-600 text-white flex items-center justify-center text-xl font-bold relative group cursor-pointer shrink-0">
            {initials}
            <div className="absolute inset-0 bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gray-800 truncate">{profileName}</p>
            <p className="text-sm text-gray-400 flex items-center gap-1 truncate">
              <Mail className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{profileEmail}</span>
            </p>
            <span className="badge bg-kapori-800 text-white text-[10px] mt-1 inline-block">DEMO</span>
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={openEditProfile}
            className="btn-ghost text-sm py-2 shrink-0"
          >
            Edit profil
          </motion.button>
        </div>
      </div>

      {/* Section 2: Preferensi Notifikasi */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-2">
          <Bell className="w-5 h-5 text-kapori-600" />
          <h2 className="text-lg font-bold text-gray-800">Preferensi notifikasi</h2>
        </div>
        <div className="divide-y divide-gray-100">
          <Toggle label="Peringatan kritis via email" defaultChecked={true} />
          <Toggle label="Peringatan cuaca ekstrem" defaultChecked={true} />
          <Toggle label="Laporan mingguan otomatis" defaultChecked={false} />
          <Toggle label="Update firmware perangkat" defaultChecked={true} />
        </div>
      </div>

      {/* Section 3: Ambang Batas Peringatan */}
      {/* Default value setiap slider diambil dari SENSOR_THRESHOLDS (single
          source of truth). User bisa override per akun kalau crop spesifik
          butuh rentang berbeda. */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-2">
          <Sliders className="w-5 h-5 text-kapori-600" />
          <h2 className="text-lg font-bold text-gray-800">Ambang batas peringatan</h2>
        </div>
        <div className="divide-y divide-gray-100">
          <SliderInput
            label="Kelembaban minimum"
            defaultValue={SENSOR_THRESHOLDS.kelembaban.optimalMin}
            min={SENSOR_THRESHOLDS.kelembaban.min}
            max={SENSOR_THRESHOLDS.kelembaban.max}
            unit={SENSOR_THRESHOLDS.kelembaban.unit}
          />
          <SliderInput
            label="Kelembaban maksimum"
            defaultValue={SENSOR_THRESHOLDS.kelembaban.optimalMax}
            min={SENSOR_THRESHOLDS.kelembaban.min}
            max={SENSOR_THRESHOLDS.kelembaban.max}
            unit={SENSOR_THRESHOLDS.kelembaban.unit}
          />
          <SliderInput
            label="pH minimum"
            defaultValue={SENSOR_THRESHOLDS.ph.optimalMin}
            min={4.0}
            max={9.0}
            step={0.1}
          />
          <SliderInput
            label="pH maksimum"
            defaultValue={SENSOR_THRESHOLDS.ph.optimalMax}
            min={4.0}
            max={9.0}
            step={0.1}
          />
          <SliderInput
            label="Suhu maksimum"
            defaultValue={SENSOR_THRESHOLDS.suhu.optimalMax}
            min={SENSOR_THRESHOLDS.suhu.min}
            max={SENSOR_THRESHOLDS.suhu.max}
            unit={SENSOR_THRESHOLDS.suhu.unit}
          />
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        title="Edit profil"
      >
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-kapori-600 text-white flex items-center justify-center text-2xl font-bold relative group cursor-pointer">
              {editName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'DU'}
              <div className="absolute inset-0 bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1.5 block">Nama lengkap</label>
            <input
              value={editName}
              onChange={e => setEditName(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kapori-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1.5 block">Email</label>
            <input
              type="email"
              inputMode="email"
              value={editEmail}
              onChange={e => setEditEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kapori-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1.5 block">Nomor telepon</label>
            <input
              type="tel"
              inputMode="tel"
              value={editPhone}
              onChange={e => setEditPhone(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kapori-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1.5 block">Peran</label>
            <select
              value={editRole}
              onChange={e => setEditRole(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kapori-500 focus:border-transparent bg-white"
            >
              <option>Administrator</option>
              <option>Manajer Farm</option>
              <option>Teknisi Lapangan</option>
              <option>Viewer</option>
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSaveProfile}
              disabled={saving}
              className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm py-2.5"
            >
              {saving ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                    <Save className="w-4 h-4" />
                  </motion.div>
                  Menyimpan…
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Simpan perubahan
                </>
              )}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowEditProfile(false)}
              className="btn-ghost flex items-center justify-center gap-2 text-sm py-2.5"
            >
              Batal
            </motion.button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}
