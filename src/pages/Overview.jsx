import { useState, useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BrainCircuit, Droplets, Thermometer, TestTube,
  Zap, Leaf, ShieldCheck, CheckCircle, X, ArrowRight, CloudRain
} from 'lucide-react'
import clsx from 'clsx'
import { notify } from '../lib/notify'
import MetricCard from '../components/ui/MetricCard'
import Modal from '../components/ui/Modal'
import FieldPerformanceChart from '../components/charts/FieldPerformanceChart'
import { getOverviewMetrics, getFilteredLahanData } from '../data'
import { topInsight, classifyMetric } from '../lib/domain'

export default function Overview() {
  const { filters } = useOutletContext()
  const { selectedFarm, selectedTime } = filters
  const navigate = useNavigate()

  const overview = useMemo(() => getOverviewMetrics(selectedFarm, selectedTime), [selectedFarm, selectedTime])
  const filteredLahans = useMemo(() => getFilteredLahanData(selectedFarm, selectedTime), [selectedFarm, selectedTime])
  const insight = useMemo(() => topInsight(filteredLahans), [filteredLahans])

  const [insightApplied, setInsightApplied] = useState(false)
  const [insightDismissed, setInsightDismissed] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState(null)

  const metrics = overview ? [
    { key: 'kelembaban',   icon: Droplets,    label: 'Kelembaban Tanah',     value: overview.kelembaban,   unit: '%',     trend: 'up',   trendValue: '2.1%' },
    { key: 'suhu',         icon: Thermometer, label: 'Suhu',                 value: overview.suhu,         unit: '°C',    trend: 'up',   trendValue: '1.3%' },
    { key: 'ph',           icon: TestTube,    label: 'pH Tanah',             value: overview.ph,           unit: 'pH',    trend: 'down', trendValue: '0.2%' },
    { key: 'ec',           icon: Zap,         label: 'Konduktivitas (EC)',   value: overview.ec,           unit: 'dS/m',  trend: 'up',   trendValue: '0.5%' },
    { key: 'npk',          icon: Leaf,        label: 'Indeks NPK',           value: overview.npk,          unit: 'idx',   trend: 'down', trendValue: '5%'   },
    { key: 'airHumidity',  icon: CloudRain,   label: 'Kelembaban Udara',     value: overview.airHumidity,  unit: '%',     trend: 'up',   trendValue: '3.4%' },
  ].map(m => ({ ...m, classification: classifyMetric(m.value, m.key) })) : []

  const handleApply = () => {
    setInsightApplied(true)
    if (insight?.recommendation) {
      notify.success(`Diterapkan: ${insight.recommendation.judul} (${insight.recommendation.lahan})`)
    } else {
      notify.success('Aksi diterapkan')
    }
  }

  const handleDismiss = () => setInsightDismissed(true)
  const handleSeeAll = () => navigate('/inteligensi')

  const showInsight = !!insight && !insightDismissed

  return (
    <motion.div
      key={`${selectedFarm}-${selectedTime}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="space-y-4 md:space-y-6"
    >
      {/* AI Insight Card — derived from top-priority risk */}
      <AnimatePresence>
        {showInsight && (
          <motion.div
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.3 }}
            className={clsx(
              'rounded-2xl p-4 md:p-5 border-2 transition-colors duration-300',
              insightApplied
                ? 'border-kapori-300 bg-kapori-50'
                : insight.risk.tipe === 'critical'
                  ? 'border-red-400 bg-white'
                  : 'border-amber-400 bg-white'
            )}
          >
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-kapori-100 rounded-xl shrink-0">
                  <BrainCircuit className="w-5 h-5 text-kapori-600" />
                </div>
                <span className="font-bold text-gray-800">AI Insight terdeteksi</span>
              </div>
              {insightApplied ? (
                <span className="badge bg-green-100 text-green-700">Aksi diterapkan</span>
              ) : insight.risk.tipe === 'critical' ? (
                <span className="badge bg-red-100 text-red-700">Prioritas tinggi</span>
              ) : (
                <span className="badge bg-amber-100 text-amber-700">Perlu perhatian</span>
              )}
            </div>

            <p className="text-gray-800 font-semibold mb-1.5 leading-snug">
              {insight.risk.nama} di {insight.risk.lahan} — estimasi dampak {insight.risk.waktuDampak}.
            </p>
            <p className="text-sm text-gray-500 mb-4 leading-relaxed">
              {insight.risk.detail}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-5">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">Skor risiko</p>
                <p className="text-sm font-semibold text-gray-700">{insight.risk.score}%</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">Lokasi</p>
                <p className="text-sm font-semibold text-gray-700">{insight.risk.lahan}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">Aksi</p>
                <p className="text-sm font-semibold text-gray-700 truncate" title={insight.recommendation?.aksi || insight.risk.pencegahan}>
                  {insight.recommendation?.judul || insight.risk.pencegahan}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">Est. dampak</p>
                <p className="text-sm font-semibold text-gray-700 truncate" title={insight.recommendation?.dampak || ''}>
                  {insight.recommendation?.dampak || '—'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 md:gap-3">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleApply}
                disabled={insightApplied}
                className={clsx(
                  'flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors',
                  insightApplied
                    ? 'bg-kapori-200 text-kapori-700 cursor-not-allowed'
                    : 'bg-kapori-600 text-white hover:bg-kapori-700'
                )}
              >
                <CheckCircle className="w-4 h-4" />
                {insightApplied ? 'Diterapkan' : 'Terapkan aksi'}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSeeAll}
                className="btn-ghost flex items-center gap-2 text-sm py-2.5"
              >
                Lihat semua insight <ArrowRight className="w-4 h-4" />
              </motion.button>
              {!insightApplied && (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleDismiss}
                  className="btn-ghost flex items-center gap-2 text-sm py-2.5"
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {metrics.map((m, i) => (
          <MetricCard
            key={`${selectedFarm}-${selectedTime}-${i}`}
            icon={m.icon}
            label={m.label}
            value={m.value}
            unit={m.unit}
            trend={m.trend}
            trendValue={m.trendValue}
            highlight={m.classification === 'critical'}
            warning={m.classification === 'warning'}
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
              <p className="text-4xl md:text-5xl font-bold text-gray-800">
                {selectedMetric.value}
                <span className="text-lg text-gray-400 ml-1">{selectedMetric.unit}</span>
              </p>
              <p className={clsx(
                'text-sm mt-2 font-medium',
                selectedMetric.classification === 'optimal' ? 'text-green-600'
                  : selectedMetric.classification === 'warning' ? 'text-amber-600'
                  : 'text-red-500'
              )}>
                Status: {selectedMetric.classification === 'optimal' ? 'Optimal'
                  : selectedMetric.classification === 'warning' ? 'Perhatian' : 'Kritis'}
              </p>
            </div>
            <div className="space-y-2">
              {filteredLahans.map(l => {
                const val = l[selectedMetric.key]
                const status = classifyMetric(val, selectedMetric.key)
                return (
                  <div key={l.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: l.warna }} />
                      <span className="text-sm font-medium text-gray-700 truncate">{l.nama}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="text-sm font-bold text-gray-800">{val} {selectedMetric.unit}</span>
                      <span className={clsx(
                        'w-1.5 h-1.5 rounded-full',
                        status === 'optimal' ? 'bg-green-500'
                          : status === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                      )} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  )
}
