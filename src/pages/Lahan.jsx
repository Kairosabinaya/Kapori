import { useState, useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Droplets, Thermometer, TestTube, Zap, Leaf, ShieldCheck, Navigation, Download, RefreshCw } from 'lucide-react'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import { getFilteredLahanData, farmToLahan } from '../data'
import ProgressBar from '../components/ui/ProgressBar'

const lahanPolygons = [
  {
    id: 'A', lahan: 'Lahan A',
    points: '90,55 490,45 510,290 110,300',
    stroke: '#EF4444',
    fill: 'rgba(239,68,68,0.08)',
    labelX: 280, labelY: 170,
  },
  {
    id: 'B', lahan: 'Lahan B',
    points: '500,25 810,55 820,240 490,230',
    stroke: '#22C55E',
    fill: 'rgba(34,197,94,0.08)',
    labelX: 650, labelY: 135,
  },
  {
    id: 'C', lahan: 'Lahan C',
    points: '130,295 520,285 540,480 150,500',
    stroke: '#F59E0B',
    fill: 'rgba(245,158,11,0.08)',
    labelX: 330, labelY: 390,
  },
]

const metricIcons = [
  { key: 'kelembaban', icon: Droplets, label: 'Kelembaban', unit: '%', color: 'blue', max: 100 },
  { key: 'suhu', icon: Thermometer, label: 'Suhu', unit: '°C', color: 'amber', max: 50 },
  { key: 'ph', icon: TestTube, label: 'pH Tanah', unit: 'pH', color: 'green', max: 14 },
  { key: 'ec', icon: Zap, label: 'Konduktivitas', unit: 'dS/m', color: 'blue', max: 3 },
  { key: 'npk', icon: Leaf, label: 'Indeks NPK', unit: 'idx', color: 'kapori', max: 100 },
  { key: 'sistemHealth', icon: ShieldCheck, label: 'Kesehatan', unit: '%', color: 'kapori', max: 100 },
]

export default function Lahan() {
  const { filters } = useOutletContext()
  const { selectedFarm, selectedTime } = filters

  const filteredLahans = useMemo(() => getFilteredLahanData(selectedFarm, selectedTime), [selectedFarm, selectedTime])
  const visibleLahanNames = useMemo(() => farmToLahan[selectedFarm] || farmToLahan['Semua Farm'], [selectedFarm])

  const [selectedLahan, setSelectedLahan] = useState(null)
  const [hoveredLahan, setHoveredLahan] = useState(null)
  const [irrigating, setIrrigating] = useState(null)

  const lahanData = selectedLahan ? filteredLahans.find(l => l.id === selectedLahan) : null

  const handleIrigate = (lahanId) => {
    setIrrigating(lahanId)
    toast(`💧 Memulai irigasi untuk Lahan ${lahanId}...`, {
      style: { background: '#fff', color: '#1B4332', borderLeft: '4px solid #2D6A4F' },
    })
    setTimeout(() => {
      setIrrigating(null)
      toast(`✓ Irigasi pada Lahan ${lahanId} berhasil dimulai`, {
        style: { background: '#fff', color: '#1B4332', borderLeft: '4px solid #2D6A4F' },
      })
    }, 2000)
  }

  const handleExportData = (lahanNama) => {
    toast(`📊 Mengekspor data ${lahanNama}...`, {
      style: { background: '#fff', color: '#1B4332', borderLeft: '4px solid #2D6A4F' },
    })
    setTimeout(() => {
      toast(`✓ Data ${lahanNama} berhasil diekspor (CSV)`, {
        style: { background: '#fff', color: '#1B4332', borderLeft: '4px solid #2D6A4F' },
      })
    }, 1500)
  }

  const handleRefreshData = (lahanNama) => {
    toast(`🔄 Memperbarui data sensor ${lahanNama}...`, {
      style: { background: '#fff', color: '#1B4332', borderLeft: '4px solid #2D6A4F' },
    })
    setTimeout(() => {
      toast(`✓ Data sensor ${lahanNama} diperbarui`, {
        style: { background: '#fff', color: '#1B4332', borderLeft: '4px solid #2D6A4F' },
      })
    }, 1000)
  }

  return (
    <motion.div
      key={selectedFarm}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="relative"
    >
      <div className="card overflow-hidden relative">
        {/* SVG Map */}
        <div
          className="w-full"
          style={{
            background: '#E8EDE9',
            backgroundImage: 'radial-gradient(circle, #C5CEC7 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        >
          <svg viewBox="0 0 900 550" className="w-full h-auto">
            {lahanPolygons.map(poly => {
              const isVisible = visibleLahanNames.includes(poly.lahan)
              const isHovered = hoveredLahan === poly.id
              const isSelected = selectedLahan === poly.id
              return (
                <g key={poly.id} className={isVisible ? '' : 'opacity-20 pointer-events-none'}>
                  <polygon
                    points={poly.points}
                    stroke={poly.stroke}
                    strokeWidth={isHovered || isSelected ? 4 : 2.5}
                    fill={isHovered || isSelected ? poly.fill.replace('0.08', '0.22') : poly.fill}
                    className={clsx('transition-all duration-200', isVisible && 'cursor-pointer')}
                    onClick={() => isVisible && setSelectedLahan(poly.id)}
                    onMouseEnter={() => isVisible && setHoveredLahan(poly.id)}
                    onMouseLeave={() => setHoveredLahan(null)}
                  />
                  <text
                    x={poly.labelX}
                    y={poly.labelY}
                    textAnchor="middle"
                    className="pointer-events-none select-none"
                    fill={poly.stroke}
                    fontSize="16"
                    fontWeight="600"
                    fontFamily="Inter, system-ui, sans-serif"
                    opacity={isVisible ? 1 : 0.3}
                  >
                    ● Lahan {poly.id}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>

        {/* Detail Panel */}
        <AnimatePresence>
          {lahanData && (
            <motion.div
              initial={{ x: 320 }}
              animate={{ x: 0 }}
              exit={{ x: 320 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="absolute top-0 right-0 h-full w-80 bg-white border-l border-gray-100 shadow-xl overflow-y-auto z-10"
            >
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: lahanData.warna }} />
                    <h3 className="font-bold text-gray-800">{lahanData.nama}</h3>
                  </div>
                  <button onClick={() => setSelectedLahan(null)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>

                <div className={clsx(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold mb-4',
                  lahanData.status === 'normal' && 'bg-green-100 text-green-700',
                  lahanData.status === 'perhatian' && 'bg-red-100 text-red-700',
                  lahanData.status === 'peringatan' && 'bg-amber-100 text-amber-700',
                )}>
                  <span className={clsx(
                    'w-1.5 h-1.5 rounded-full',
                    lahanData.status === 'normal' && 'bg-green-500',
                    lahanData.status === 'perhatian' && 'bg-red-500',
                    lahanData.status === 'peringatan' && 'bg-amber-500',
                  )} />
                  {lahanData.status === 'normal' ? 'Normal' :
                   lahanData.status === 'perhatian' ? 'Perlu Perhatian' : 'Peringatan'}
                </div>

                <p className="text-sm text-gray-500 mb-5">{lahanData.keterangan}</p>

                <div className="space-y-3 mb-5">
                  {metricIcons.map(m => {
                    const Icon = m.icon
                    const val = lahanData[m.key]
                    return (
                      <div key={m.key} className="p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{m.label}</span>
                          </div>
                          <span className="text-sm font-bold text-gray-800">{val} {m.unit}</span>
                        </div>
                        <ProgressBar value={val} max={m.max} color={m.color} />
                      </div>
                    )
                  })}
                </div>

                <div className="space-y-2">
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => handleIrigate(lahanData.id)} disabled={irrigating === lahanData.id} className="btn-primary w-full flex items-center justify-center gap-2 text-sm">
                    {irrigating === lahanData.id ? (<><RefreshCw className="w-4 h-4 animate-spin" />Memulai Irigasi...</>) : (<><Navigation className="w-4 h-4" />Mulai Irigasi</>)}
                  </motion.button>
                  <div className="flex gap-2">
                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => handleExportData(lahanData.nama)} className="btn-ghost flex-1 flex items-center justify-center gap-1.5 text-sm">
                      <Download className="w-3.5 h-3.5" />Ekspor Data
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => handleRefreshData(lahanData.nama)} className="btn-ghost flex-1 flex items-center justify-center gap-1.5 text-sm">
                      <RefreshCw className="w-3.5 h-3.5" />Refresh
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
