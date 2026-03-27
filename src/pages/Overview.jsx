import { useState, useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BrainCircuit, Droplets, Thermometer, TestTube,
  Zap, Leaf, ShieldCheck, CheckCircle, X
} from 'lucide-react'
import toast from 'react-hot-toast'
import MetricCard from '../components/ui/MetricCard'
import Modal from '../components/ui/Modal'
import FieldPerformanceChart from '../components/charts/FieldPerformanceChart'
import { getOverviewMetrics, getFilteredLahanData } from '../data'

export default function Overview() {
  const { filters } = useOutletContext()
  const { selectedFarm, selectedTime } = filters

  const overview = useMemo(() => getOverviewMetrics(selectedFarm, selectedTime), [selectedFarm, selectedTime])
  const filteredLahans = useMemo(() => getFilteredLahanData(selectedFarm, selectedTime), [selectedFarm, selectedTime])

  const [insightApplied, setInsightApplied] = useState(false)
  const [insightDismissed, setInsightDismissed] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState(null)

  const metrics = overview ? [
    { icon: Droplets, label: 'Kelembaban Tanah', value: overview.kelembaban, unit: '%', trend: 'up', trendValue: '2.1%', highlight: false },
    { icon: Thermometer, label: 'Suhu', value: overview.suhu, unit: '°C', trend: 'up', trendValue: '1.3%', highlight: overview.suhu > 32 },
    { icon: TestTube, label: 'pH Tanah', value: overview.ph, unit: 'pH', trend: 'down', trendValue: '0.2%', highlight: false },
    { icon: Zap, label: 'Konduktivitas Listrik', value: overview.ec, unit: 'dS/m', trend: 'up', trendValue: '0.5%', highlight: false },
    { icon: Leaf, label: 'Indeks NPK', value: overview.npk, unit: 'idx', trend: 'down', trendValue: '5%', highlight: false },
    { icon: ShieldCheck, label: 'Kesehatan Sistem', value: overview.sistemHealth, unit: '%', trend: 'up', trendValue: '0.8%', highlight: false },
  ] : []

  const handleApply = () => {
    setInsightApplied(true)
    toast('✓ Aksi irigasi berhasil diterapkan pada Lahan A', {
      style: {
        background: '#fff',
        color: '#1B4332',
        borderLeft: '4px solid #2D6A4F',
      },
    })
  }

  const handleDismiss = () => {
    setInsightDismissed(true)
  }

  // Show insight only if relevant farm is selected
  const showInsight = (selectedFarm === 'Semua Farm' || selectedFarm === 'Farm Utama')

  return (
    <motion.div
      key={`${selectedFarm}-${selectedTime}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="space-y-6"
    >
      {/* AI Insight Card */}
      <AnimatePresence>
        {showInsight && !insightDismissed && (
          <motion.div
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.3 }}
            className={`rounded-2xl p-5 border-2 transition-all duration-300 ${
              insightApplied
                ? 'border-kapori-300 bg-kapori-50'
                : 'border-kapori-500 animate-pulse-slow bg-white'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-kapori-100 rounded-xl">
                  <BrainCircuit className="w-5 h-5 text-kapori-600" />
                </div>
                <div>
                  <span className="font-bold text-gray-800">AI Insight Terdeteksi</span>
                </div>
                {insightApplied ? (
                  <span className="badge bg-green-100 text-green-700">Aksi Diterapkan ✓</span>
                ) : (
                  <span className="badge bg-red-100 text-red-700">Prioritas Tinggi</span>
                )}
              </div>
            </div>

            <p className="text-gray-700 font-medium mb-4">
              Lahan A akan mengalami stres air dalam 5 jam.
            </p>

            <div className="grid grid-cols-4 gap-4 mb-5">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">Sebab</p>
                <p className="text-sm font-semibold text-gray-700">Suhu tinggi + tanpa hujan</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">Kepercayaan</p>
                <p className="text-sm font-semibold text-gray-700">94%</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">Aksi</p>
                <p className="text-sm font-semibold text-gray-700">Irigasi segera</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">Est. Dampak</p>
                <p className="text-sm font-semibold text-gray-700">+15% kelembaban</p>
              </div>
            </div>

            <div className="flex gap-3">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleApply}
                disabled={insightApplied}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  insightApplied
                    ? 'bg-kapori-200 text-kapori-700 cursor-not-allowed'
                    : 'bg-kapori-600 text-white hover:bg-kapori-700'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                {insightApplied ? 'Diterapkan' : 'Terapkan Aksi'}
              </motion.button>
              {!insightApplied && (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleDismiss}
                  className="btn-ghost flex items-center gap-2 text-sm"
                >
                  <X className="w-4 h-4" />
                  Abaikan
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-3 gap-4">
        {metrics.map((m, i) => (
          <MetricCard
            key={`${selectedFarm}-${selectedTime}-${i}`}
            icon={m.icon}
            label={m.label}
            value={m.value}
            unit={m.unit}
            trend={m.trend}
            trendValue={m.trendValue}
            highlight={m.highlight}
            onClick={() => setSelectedMetric(m)}
          />
        ))}
      </div>

      {/* Field Performance Chart */}
      <FieldPerformanceChart farm={selectedFarm} time={selectedTime} />

      {/* Metric Detail Modal */}
      <Modal
        isOpen={!!selectedMetric}
        onClose={() => setSelectedMetric(null)}
        title={selectedMetric?.label || ''}
      >
        {selectedMetric && (
          <div className="space-y-4">
            <div className="text-center py-4">
              <p className="text-5xl font-bold text-gray-800">
                {selectedMetric.value}
                <span className="text-lg text-gray-400 ml-1">{selectedMetric.unit}</span>
              </p>
              <p className={`text-sm mt-2 font-medium ${selectedMetric.trend === 'up' ? 'text-green-600' : 'text-red-500'}`}>
                {selectedMetric.trend === 'up' ? '↑' : '↓'} {selectedMetric.trendValue} dari kemarin
              </p>
            </div>
            <div className="space-y-2">
              {filteredLahans.map(l => (
                <div key={l.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: l.warna }} />
                    <span className="text-sm font-medium text-gray-700">{l.nama}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-800">
                    {selectedMetric.label === 'Kelembaban Tanah' ? l.kelembaban :
                     selectedMetric.label === 'Suhu' ? l.suhu :
                     selectedMetric.label === 'pH Tanah' ? l.ph :
                     selectedMetric.label === 'Konduktivitas Listrik' ? l.ec :
                     selectedMetric.label === 'Indeks NPK' ? l.npk :
                     l.sistemHealth} {selectedMetric.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  )
}
