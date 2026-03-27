import { useState, useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BrainCircuit, CheckCircle, X, AlertTriangle,
  AlertOctagon, Clock, Shield, MapPin
} from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import Modal from '../components/ui/Modal'
import { getFilteredRekomendasis, getFilteredRisks, getFilteredDecisionHistory } from '../data'

export default function Inteligensi() {
  const { filters } = useOutletContext()
  const { selectedFarm } = filters

  const rekomendasis = useMemo(() => getFilteredRekomendasis(selectedFarm), [selectedFarm])
  const risks = useMemo(() => getFilteredRisks(selectedFarm), [selectedFarm])
  const decisionHistory = useMemo(() => getFilteredDecisionHistory(selectedFarm), [selectedFarm])

  const [appliedRekoms, setAppliedRekoms] = useState([])
  const [dismissedRekoms, setDismissedRekoms] = useState([])
  const [riskDetail, setRiskDetail] = useState(null)

  const handleApplyRekom = (id) => {
    setAppliedRekoms(prev => [...prev, id])
    toast('✓ Rekomendasi berhasil diterapkan', {
      style: { background: '#fff', color: '#1B4332', borderLeft: '4px solid #2D6A4F' },
    })
  }

  const handleDismissRekom = (id) => {
    setDismissedRekoms(prev => [...prev, id])
  }

  const visibleRekoms = rekomendasis.filter(r => !dismissedRekoms.includes(r.id))

  return (
    <motion.div
      key={selectedFarm}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="space-y-8"
    >
      {/* Section 1: Rekomendasi Aktif */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <BrainCircuit className="w-5 h-5 text-kapori-600" />
          <h2 className="text-lg font-bold text-gray-800">Rekomendasi Aktif</h2>
          <span className="text-xs text-gray-400 ml-1">({visibleRekoms.length})</span>
        </div>
        {visibleRekoms.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            <AnimatePresence>
              {visibleRekoms.map(rekom => {
                const isApplied = appliedRekoms.includes(rekom.id)
                return (
                  <motion.div
                    key={rekom.id}
                    layout
                    exit={{ opacity: 0, y: -20, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className={clsx(
                      'card p-5 border-l-4 border-l-kapori-500 transition-all',
                      isApplied && 'bg-kapori-50 border-kapori-300'
                    )}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-bold text-gray-800">{rekom.judul}</h3>
                      <span className="badge bg-kapori-100 text-kapori-700">{rekom.match}% Match</span>
                    </div>
                    <div className="space-y-2 mb-4">
                      <p className="text-sm text-gray-500">
                        <span className="font-medium text-gray-600">Lahan:</span> {rekom.lahan}
                      </p>
                      <p className="text-sm text-gray-500">
                        <span className="font-medium text-gray-600">Aksi:</span> {rekom.aksi}
                      </p>
                      <p className="text-sm text-gray-500">
                        <span className="font-medium text-gray-600">Dampak:</span> {rekom.dampak}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleApplyRekom(rekom.id)}
                        disabled={isApplied}
                        className={clsx(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                          isApplied
                            ? 'bg-kapori-200 text-kapori-700 cursor-not-allowed'
                            : 'bg-kapori-600 text-white hover:bg-kapori-700'
                        )}
                      >
                        <CheckCircle className="w-4 h-4" />
                        {isApplied ? 'Diterapkan ✓' : 'Terapkan'}
                      </motion.button>
                      {!isApplied && (
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handleDismissRekom(rekom.id)}
                          className="btn-ghost flex items-center gap-1.5 text-sm py-1.5"
                        >
                          <X className="w-4 h-4" />
                          Abaikan
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        ) : (
          <div className="card p-8 text-center text-sm text-gray-400">
            Tidak ada rekomendasi aktif untuk {selectedFarm}.
          </div>
        )}
      </div>

      {/* Section 2: Risiko Terdeteksi */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-bold text-gray-800">Risiko Terdeteksi</h2>
          <span className="text-xs text-gray-400 ml-1">({risks.length})</span>
        </div>
        {risks.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
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
                    <AlertOctagon className="w-5 h-5 text-red-500 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
                  )}
                  <div>
                    <h3 className={clsx(
                      'font-bold',
                      risk.tipe === 'critical' ? 'text-red-700' : 'text-amber-700'
                    )}>
                      {risk.nama}
                    </h3>
                  </div>
                </div>
                <div className="space-y-1.5 mb-4 ml-8">
                  <p className="text-sm text-gray-600 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> {risk.lahan}
                  </p>
                  <p className="text-sm text-gray-600 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Waktu Dampak: {risk.waktuDampak}
                  </p>
                  <p className="text-sm text-gray-600 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" /> Pencegahan: {risk.pencegahan}
                  </p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setRiskDetail(risk)}
                  className="btn-ghost text-sm w-full"
                >
                  Lihat Detail
                </motion.button>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="card p-8 text-center text-sm text-gray-400">
            Tidak ada risiko terdeteksi untuk {selectedFarm}.
          </div>
        )}
      </div>

      {/* Section 3: Riwayat Keputusan */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-bold text-gray-800">Riwayat Keputusan</h2>
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
                      <p className="text-xs text-gray-400 mb-0.5">{item.waktu}</p>
                      <p className="text-sm font-semibold text-gray-800">{item.aksi}</p>
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
                  {riskDetail.tipe === 'critical' ? 'Risiko Kritis' : 'Peringatan'}
                </span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{riskDetail.detail}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400">Lokasi</p>
                <p className="text-sm font-semibold text-gray-700">{riskDetail.lahan}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400">Waktu Dampak</p>
                <p className="text-sm font-semibold text-gray-700">{riskDetail.waktuDampak}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 col-span-2">
                <p className="text-xs text-gray-400">Pencegahan</p>
                <p className="text-sm font-semibold text-gray-700">{riskDetail.pencegahan}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  )
}
