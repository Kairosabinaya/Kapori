import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Bell, Sliders, Monitor, Mail, Save, X, Camera, Check } from 'lucide-react'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import Modal from '../components/ui/Modal'

function Toggle({ label, defaultChecked = false, onChange }) {
  const [checked, setChecked] = useState(defaultChecked)

  const handleToggle = () => {
    const newVal = !checked
    setChecked(newVal)
    if (onChange) onChange(newVal)
    toast(newVal ? `✓ ${label} diaktifkan` : `✗ ${label} dinonaktifkan`, {
      style: { background: '#fff', color: '#1B4332', borderLeft: `4px solid ${newVal ? '#2D6A4F' : '#9CA3AF'}` },
    })
  }

  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm text-gray-700">{label}</span>
      <button
        onClick={handleToggle}
        className={clsx(
          'relative w-11 h-6 rounded-full transition-colors duration-200',
          checked ? 'bg-kapori-600' : 'bg-gray-300'
        )}
      >
        <motion.div
          className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm"
          animate={{ x: checked ? 20 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
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
    toast(`✓ ${label} diubah ke ${value}${unit}`, {
      style: { background: '#fff', color: '#1B4332', borderLeft: '4px solid #2D6A4F' },
    })
  }

  return (
    <div className="py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-700">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-kapori-700">{value}{unit}</span>
          {!saved && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleSave}
              className="text-xs bg-kapori-600 text-white px-2 py-0.5 rounded-md"
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
      toast('✓ Profil berhasil diperbarui', {
        style: { background: '#fff', color: '#1B4332', borderLeft: '4px solid #2D6A4F' },
      })
    }, 1000)
  }

  const initials = profileName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="space-y-6 max-w-3xl"
    >
      {/* Section 1: Profil Akun */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-kapori-600" />
          <h2 className="text-lg font-bold text-gray-800">Profil Akun</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-kapori-600 text-white flex items-center justify-center text-xl font-bold relative group cursor-pointer">
            {initials}
            <div className="absolute inset-0 bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <p className="font-semibold text-gray-800">{profileName}</p>
            <p className="text-sm text-gray-400 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" /> {profileEmail}
            </p>
            <span className="badge bg-kapori-800 text-white text-[10px] mt-1 inline-block">DEMO</span>
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={openEditProfile}
            className="btn-ghost text-sm ml-auto"
          >
            Edit Profil
          </motion.button>
        </div>
      </div>

      {/* Section 2: Preferensi Notifikasi */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-2">
          <Bell className="w-5 h-5 text-kapori-600" />
          <h2 className="text-lg font-bold text-gray-800">Preferensi Notifikasi</h2>
        </div>
        <div className="divide-y divide-gray-100">
          <Toggle label="Peringatan Kritis via Email" defaultChecked={true} />
          <Toggle label="Peringatan Cuaca Ekstrem" defaultChecked={true} />
          <Toggle label="Laporan Mingguan Otomatis" defaultChecked={false} />
          <Toggle label="Update Firmware Perangkat" defaultChecked={true} />
        </div>
      </div>

      {/* Section 3: Ambang Batas Peringatan */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-2">
          <Sliders className="w-5 h-5 text-kapori-600" />
          <h2 className="text-lg font-bold text-gray-800">Ambang Batas Peringatan</h2>
        </div>
        <div className="divide-y divide-gray-100">
          <SliderInput label="Kelembaban Minimum" defaultValue={40} min={0} max={100} unit="%" />
          <SliderInput label="Kelembaban Maksimum" defaultValue={80} min={0} max={100} unit="%" />
          <SliderInput label="pH Minimum" defaultValue={6.0} min={4.0} max={9.0} step={0.1} />
          <SliderInput label="pH Maksimum" defaultValue={7.5} min={4.0} max={9.0} step={0.1} />
          <SliderInput label="Suhu Maksimum" defaultValue={35} min={20} max={50} unit="°C" />
        </div>
      </div>

      {/* Section 4: Tampilan */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-2">
          <Monitor className="w-5 h-5 text-kapori-600" />
          <h2 className="text-lg font-bold text-gray-800">Tampilan</h2>
        </div>
        <Toggle label="Mode Gelap" defaultChecked={false} />
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        title="Edit Profil"
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
            <label className="text-sm font-medium text-gray-600 mb-1.5 block">Nama Lengkap</label>
            <input
              value={editName}
              onChange={e => setEditName(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-kapori-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1.5 block">Email</label>
            <input
              type="email"
              value={editEmail}
              onChange={e => setEditEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-kapori-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1.5 block">Nomor Telepon</label>
            <input
              value={editPhone}
              onChange={e => setEditPhone(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-kapori-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1.5 block">Role</label>
            <select
              value={editRole}
              onChange={e => setEditRole(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-kapori-500 focus:border-transparent"
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
              className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm"
            >
              {saving ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                    <Save className="w-4 h-4" />
                  </motion.div>
                  Menyimpan...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Simpan Perubahan
                </>
              )}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowEditProfile(false)}
              className="btn-ghost flex items-center justify-center gap-2 text-sm"
            >
              Batal
            </motion.button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}
