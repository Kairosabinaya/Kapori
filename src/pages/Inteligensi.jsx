import { useState, useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BrainCircuit, CheckCircle, X, AlertTriangle,
  AlertOctagon, Clock, Shield, MapPin, Droplets, Sprout,
  Beaker, FlaskConical, TrendingUp, Info
} from 'lucide-react'
import clsx from 'clsx'
import { notify } from '../lib/notify'
import Modal from '../components/ui/Modal'
import { getFilteredLahanData, getFilteredDecisionHistory } from '../data'
import { generateRecommendations, generateRisks } from '../lib/domain'

const recoIcon = {
  irrigation: Droplets,
  fertilizer: Sprout,
  liming: Beaker,
  acidify: FlaskConical,
  disease_prevent: Shield,
  mulching: TrendingUp,
}

const urgencyStyle = {
  high:   { bg: 'bg-red-50',   text: 'text-red-700',   border: 'border-l-red-400',   label: 'Mendesak' },
  medium: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-l-amber-400', label: 'Disarankan' },
  low:    { bg: 'bg-kapori-50', text: 'text-kapori-700', border: 'border-l-kapori-400', label: 'Opsional' },
}

export default function Inteligensi() {
  const { filters } = useOutletContext()
  const { selectedFarm, selectedTime } = filters

  const lahanList = useMemo(
    () => getFilteredLahanData(selectedFarm, selectedTime),
    [selectedFarm, selectedTime]
  )
  const rekomendasis = useMemo(() => generateRecommendations(lahanList), [lahanList])
  const risks = useMemo(() => generateRisks(lahanList), [lahanList])
  const decisionHistory = useMemo(() => getFilteredDecisionHistory(selectedFarm), [selectedFarm])

  const [appliedRekoms, setAppliedRekoms] = useState([])
  const [dismissedRekoms, setDismissedRekoms] = useState([])
  const [riskDetail, setRiskDetail] = useState(null)
  const [recoDetail, setRecoDetail] = useState(null)

  const handleApplyRekom = (rekom) => {
    setAppliedRekoms(prev => [...prev, rekom.id])
    notify.success(`Diterapkan: ${rekom.judul} (${rekom.lahan})`)
  }

  const handleDismissRekom = (id) => {
    setDismissedRekoms(prev => [...prev, id])
  }

  const visibleRekoms = rekomendasis.filter(r => !dismissedRekoms.includes(r.id))

  return (
    <motion.div
      key={`${selectedFarm}-${selectedTime}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="space-y-6 md:space-y-8"
    >
      {/* Section header explanation */}
      <div className="card p-4 bg-kapori-50 border border-kapori-100 flex items-start gap-3">
        <div className="p-2 bg-white rounded-lg shrink-0">
          <BrainCircuit className="w-5 h-5 text-kapori-600" />
        </div>
        <div className="text-sm text-gray-600 leading-relaxed">
          <p className="font-semibold text-gray-800 mb-0.5">Bagaimana KAPORI menghasilkan rekomendasi</p>
          <p>
            Mesin AI memproses pembacaan real-time dari {lahanList.reduce((s, l) => s + l.sensorCount, 0)} sensor IoT
            (kelembaban, suhu, pH, EC, NPK, kelembaban udara), membandingkan dengan ambang FAO/agronomi,
            lalu menghitung risiko stres air, risiko penyakit, kebutuhan irigasi, dan dosis pupuk presisi.
          </p>
        </div>
      </div>

      {/* Section 1: Rekomendasi Aktif */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <BrainCircuit className="w-5 h-5 text-kapori-600" />
          <h2 className="text-lg font-bold text-gray-800">Rekomendasi aktif</h2>
          <span className="text-xs text-gray-400 ml-1">({visibleRekoms.length})</span>
        </div>
        {visibleRekoms.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AnimatePresence>
              {visibleRekoms.map(rekom => {
                const isApplied = appliedRekoms.includes(rekom.id)
                const Icon = recoIcon[rekom.type] || BrainCircuit
                const u = urgencyStyle[rekom.urgency] || urgencyStyle.low
                return (
                  <motion.div
                    key={rekom.id}
                    layout
                    exit={{ opacity: 0, y: -20, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className={clsx(
                      'card p-5 border-l-4 transition-all',
                      u.border,
                      isApplied && 'bg-kapori-50 border-kapori-300'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={clsx('p-1.5 rounded-lg', u.bg)}>
                          <Icon className={clsx('w-4 h-4', u.text)} />
                        </div>
                        <h3 className="font-bold text-gray-800 truncate">{rekom.judul}</h3>
                      </div>
                      <span className={clsx('badge shrink-0', u.bg, u.text)}>{u.label}</span>
                    </div>

                    <div className="space-y-1.5 mb-3 text-sm">
                      <div className="flex gap-2">
                        <span className="text-gray-500 w-16 shrink-0">Lahan</span>
                        <span className="text-gray-800 font-medium">{rekom.lahan}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-gray-500 w-16 shrink-0">Aksi</span>
                        <span className="text-gray-800">{rekom.aksi}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-gray-500 w-16 shrink-0">Dampak</span>
                        <span className="text-gray-800">{rekom.dampak}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-3 text-xs text-gray-500 bg-gray-50 rounded-lg px-2.5 py-2">
                      <Info className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                      <span className="leading-snug">{rekom.reason}</span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-gray-400">Confidence {rekom.match}%</span>
                      <div className="flex flex-wrap gap-2">
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setRecoDetail(rekom)}
                          className="text-xs text-kapori-600 hover:text-kapori-700 font-medium px-2 py-1.5"
                        >
                          Detail
                        </motion.button>
                        {!isApplied && (
                          <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={() => handleDismissRekom(rekom.id)}
                            className="btn-ghost flex items-center gap-1.5 text-xs py-1.5 px-3"
                          >
                            <X className="w-3.5 h-3.5" />
                            Abaikan
                          </motion.button>
                        )}
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handleApplyRekom(rekom)}
                          disabled={isApplied}
                          className={clsx(
                            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                            isApplied
                              ? 'bg-kapori-200 text-kapori-700 cursor-default'
                              : 'bg-kapori-600 text-white hover:bg-kapori-700'
                          )}
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          {isApplied ? 'Diterapkan' : 'Terapkan'}
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        ) : (
          <div className="card p-8 text-center">
            <CheckCircle className="w-10 h-10 text-green-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Tidak ada rekomendasi aktif untuk {selectedFarm}.</p>
            <p className="text-xs text-gray-400 mt-1">Semua parameter tanah berada dalam batas optimal.</p>
          </div>
        )}
      </div>

      {/* Section 2: Risiko Terdeteksi */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-bold text-gray-800">Risiko terdeteksi</h2>
          <span className="text-xs text-gray-400 ml-1">({risks.length})</span>
        </div>
        {risks.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {risks.map(risk => (
              <motion.div
                key={risk.id}
                whileHover={{ y: -2 }}
                className={clsx(
                  'card p-5 border-l-4',
                  risk.tipe === 'critical'
                    ? 'border-l-red-400 bg-red-50'
                    : 'border-l-amber-400 bg-amber-50'
                )}
              >
                <div className="flex items-start gap-3 mb-3">
                  {risk.tipe === 'critical' ? (
                    <AlertOctagon className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className={clsx(
                      'font-bold',
                      risk.tipe === 'critical' ? 'text-red-700' : 'text-amber-700'
                    )}>
                      {risk.nama}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">Skor risiko {risk.score}%</p>
                  </div>
                </div>
                <div className="space-y-1.5 mb-4 ml-8">
                  <p className="text-sm text-gray-600 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 shrink-0" /> {risk.lahan}
                  </p>
                  <p className="text-sm text-gray-600 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 shrink-0" /> Estimasi dampak: {risk.waktuDampak}
                  </p>
                  <p className="text-sm text-gray-600 flex items-start gap-1.5">
                    <Shield className="w-3.5 h-3.5 shrink-0 mt-0.5" /> Pencegahan: {risk.pencegahan}
                  </p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setRiskDetail(risk)}
                  className="btn-ghost text-sm w-full py-2"
                >
                  Lihat detail risiko
                </motion.button>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="card p-8 text-center">
            <Shield className="w-10 h-10 text-green-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Tidak ada risiko terdeteksi untuk {selectedFarm}.</p>
            <p className="text-xs text-gray-400 mt-1">Pemantauan terus berjalan setiap menit.</p>
          </div>
        )}
      </div>

      {/* Section 3: Riwayat Keputusan */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-bold text-gray-800">Riwayat keputusan</h2>
          <span className="text-xs text-gray-400 ml-1">({decisionHistory.length})</span>
        </div>
        {decisionHistory.length > 0 ? (
          <div className="card p-5">
            <div className="relative">
              <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gray-200" />
              <div className="space-y-0">
                {decisionHistory.map((item) => (
                  <motion.div
                    key={item.id}
                    whileHover={{ backgroundColor: '#F9FAFB' }}
                    className="flex items-start gap-4 p-3 rounded-lg transition-colors relative"
                  >
                    <div className={clsx(
                      'w-3.5 h-3.5 rounded-full mt-0.5 border-2 border-white ring-2 z-10 shrink-0',
                      item.status === 'success' ? 'bg-green-500 ring-green-200' : 'bg-gray-400 ring-gray-200'
                    )} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs text-gray-400">{item.waktu}</p>
                        {item.applier && (
                          <span className="text-[10px] text-gray-400 bg-gray-100 rounded px-1.5 py-0.5">
                            oleh {item.applier}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-gray-800 mt-0.5">{item.aksi}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{item.hasil}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="card p-8 text-center text-sm text-gray-400">
            Tidak ada riwayat keputusan untuk {selectedFarm}.
          </div>
        )}
      </div>

      {/* Risk Detail Modal */}
      <Modal
        isOpen={!!riskDetail}
        onClose={() => setRiskDetail(null)}
        title={riskDetail?.nama || ''}
      >
        {riskDetail && (
          <div className="space-y-4">
            <div className={clsx(
              'p-4 rounded-xl',
              riskDetail.tipe === 'critical' ? 'bg-red-50' : 'bg-amber-50'
            )}>
              <div className="flex items-center gap-2 mb-2">
                {riskDetail.tipe === 'critical' ? (
                  <AlertOctagon className="w-5 h-5 text-red-500" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                )}
                <span className={clsx(
                  'font-semibold text-sm',
                  riskDetail.tipe === 'critical' ? 'text-red-700' : 'text-amber-700'
                )}>
                  {riskDetail.tipe === 'critical' ? 'Risiko kritis' : 'Peringatan'}
                </span>
                <span className="ml-auto text-xs text-gray-500">Skor {riskDetail.score}%</span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{riskDetail.detail}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400">Lokasi</p>
                <p className="text-sm font-semibold text-gray-700">{riskDetail.lahan}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400">Estimasi dampak</p>
                <p className="text-sm font-semibold text-gray-700">{riskDetail.waktuDampak}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 sm:col-span-2">
                <p className="text-xs text-gray-400">Pencegahan</p>
                <p className="text-sm font-semibold text-gray-700">{riskDetail.pencegahan}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Recommendation Detail Modal */}
      <Modal
        isOpen={!!recoDetail}
        onClose={() => setRecoDetail(null)}
        title={recoDetail?.judul || ''}
      >
        {recoDetail && (
          <div className="space-y-4">
            <div className={clsx('p-4 rounded-xl', urgencyStyle[recoDetail.urgency]?.bg || 'bg-gray-50')}>
              <div className="flex items-center gap-2 mb-2">
                <span className={clsx(
                  'badge',
                  urgencyStyle[recoDetail.urgency]?.bg,
                  urgencyStyle[recoDetail.urgency]?.text
                )}>
                  {urgencyStyle[recoDetail.urgency]?.label}
                </span>
                <span className="text-xs text-gray-500 ml-auto">Confidence {recoDetail.match}%</span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{recoDetail.reason}</p>
            </div>
            <div className="space-y-2">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">Lokasi</p>
                <p className="text-sm font-semibold text-gray-700">{recoDetail.lahan}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">Aksi yang disarankan</p>
                <p className="text-sm font-semibold text-gray-700">{recoDetail.aksi}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">Estimasi dampak</p>
                <p className="text-sm font-semibold text-gray-700">{recoDetail.dampak}</p>
              </div>
            </div>
            {!appliedRekoms.includes(recoDetail.id) && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => { handleApplyRekom(recoDetail); setRecoDetail(null) }}
                className="btn-primary w-full flex items-center justify-center gap-2 text-sm py-2.5"
              >
                <CheckCircle className="w-4 h-4" />
                Terapkan rekomendasi
              </motion.button>
            )}
          </div>
        )}
      </Modal>
    </motion.div>
  )
}
