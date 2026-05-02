import { useState, useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MapContainer, TileLayer, Polygon, Tooltip, ZoomControl } from 'react-leaflet'
import { X, Droplets, Thermometer, TestTube, Zap, Leaf, ShieldCheck, Navigation, Download, RefreshCw, Compass } from 'lucide-react'
import clsx from 'clsx'
import { notify } from '../lib/notify'
import { useMediaQuery } from '../lib/useMediaQuery'
import { getFilteredLahanData, farmToLahan } from '../data'
import ProgressBar from '../components/ui/ProgressBar'

// Anchor — Cikole / Lembang vegetable-farming area, ~1300 m elevation
const FARM_CENTER = [-6.8133, 107.6498]
const PAN_RADIUS = 0.0025 // ~280 m radius lock

// Polygon corners drawn over visible field patches at z18
const lahanPolygons = [
  {
    id: 'A', lahan: 'Lahan A',
    color: '#EF4444',
    coords: [
      [-6.8121, 107.6481],
      [-6.8120, 107.6494],
      [-6.8129, 107.6495],
      [-6.8130, 107.6482],
    ],
  },
  {
    id: 'B', lahan: 'Lahan B',
    color: '#22C55E',
    coords: [
      [-6.8121, 107.6499],
      [-6.8120, 107.6512],
      [-6.8128, 107.6513],
      [-6.8129, 107.6500],
    ],
  },
  {
    id: 'C', lahan: 'Lahan C',
    color: '#F59E0B',
    coords: [
      [-6.8133, 107.6486],
      [-6.8131, 107.6504],
      [-6.8142, 107.6505],
      [-6.8143, 107.6487],
    ],
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
  const isMobile = useMediaQuery('(max-width: 767px)')

  const filteredLahans = useMemo(
    () => getFilteredLahanData(selectedFarm, selectedTime),
    [selectedFarm, selectedTime]
  )
  const visibleLahanNames = useMemo(
    () => farmToLahan[selectedFarm] || farmToLahan['Semua Farm'],
    [selectedFarm]
  )

  const [selectedLahan, setSelectedLahan] = useState(null)
  const [irrigating, setIrrigating] = useState(null)

  const lahanData = selectedLahan ? filteredLahans.find(l => l.id === selectedLahan) : null

  const handleIrigate = (lahanId) => {
    setIrrigating(lahanId)
    notify.info(`Memulai irigasi untuk Lahan ${lahanId}…`)
    setTimeout(() => {
      setIrrigating(null)
      notify.success(`Irigasi Lahan ${lahanId} dimulai`)
    }, 2000)
  }

  const handleExportData = (lahanNama) => {
    notify.info(`Mengekspor data ${lahanNama}…`)
    setTimeout(() => notify.success(`Data ${lahanNama} diekspor (CSV)`), 1500)
  }

  const handleRefreshData = (lahanNama) => {
    notify.info(`Memperbarui data sensor ${lahanNama}…`)
    setTimeout(() => notify.success(`Data sensor ${lahanNama} diperbarui`), 1000)
  }

  const panelInitial = isMobile ? { y: '100%' } : { x: 320 }
  const panelAnimate = isMobile ? { y: 0 } : { x: 0 }
  const panelExit = isMobile ? { y: '100%' } : { x: 320 }

  const panBounds = [
    [FARM_CENTER[0] - PAN_RADIUS, FARM_CENTER[1] - PAN_RADIUS],
    [FARM_CENTER[0] + PAN_RADIUS, FARM_CENTER[1] + PAN_RADIUS],
  ]

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
        <div className="relative h-[480px] md:h-[600px]">
          <MapContainer
            center={FARM_CENTER}
            zoom={18}
            minZoom={17}
            maxZoom={19}
            maxBounds={panBounds}
            maxBoundsViscosity={1.0}
            zoomControl={false}
            attributionControl={true}
            scrollWheelZoom={!isMobile}
            doubleClickZoom={true}
            dragging={true}
            style={{ width: '100%', height: '100%' }}
          >
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution='Tiles &copy; <a href="https://www.esri.com/" target="_blank" rel="noreferrer">Esri</a>, Maxar, Earthstar Geographics'
              maxZoom={19}
            />
            <ZoomControl position="topright" />

            {lahanPolygons.map(poly => {
              const isVisible = visibleLahanNames.includes(poly.lahan)
              const isSelected = selectedLahan === poly.id
              return (
                <Polygon
                  key={poly.id}
                  positions={poly.coords}
                  pathOptions={{
                    color: poly.color,
                    weight: isSelected ? 4 : 2.5,
                    fillColor: poly.color,
                    fillOpacity: isVisible ? (isSelected ? 0.4 : 0.22) : 0.05,
                    opacity: isVisible ? 1 : 0.25,
                    dashArray: isVisible ? null : '4 4',
                  }}
                  eventHandlers={{
                    click: () => isVisible && setSelectedLahan(poly.id),
                    mouseover: (e) => isVisible && e.target.setStyle({ fillOpacity: 0.4, weight: 4 }),
                    mouseout: (e) => {
                      if (!isVisible) return
                      e.target.setStyle({
                        fillOpacity: isSelected ? 0.4 : 0.22,
                        weight: isSelected ? 4 : 2.5,
                      })
                    },
                  }}
                >
                  {isVisible && (
                    <Tooltip
                      permanent
                      direction="center"
                      className="lahan-label"
                      opacity={1}
                    >
                      Lahan {poly.id}
                    </Tooltip>
                  )}
                </Polygon>
              )
            })}
          </MapContainer>

          {/* Compass + scale overlay (decorative) */}
          <div className="absolute top-3 left-3 z-[400] bg-white/90 backdrop-blur-sm rounded-lg px-2.5 py-2 shadow-md flex items-center gap-1.5 pointer-events-none">
            <Compass className="w-4 h-4 text-kapori-600" />
            <span className="text-xs font-semibold text-gray-700">Lembang, Bandung Barat</span>
          </div>

          {/* Legend */}
          <div className="absolute bottom-3 left-3 z-[400] bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Status Lahan</p>
            <div className="space-y-0.5">
              {lahanPolygons.map(p => (
                <div key={p.id} className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: p.color }} />
                  <span className="text-gray-700">Lahan {p.id}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detail Panel + mobile backdrop */}
        <AnimatePresence>
          {lahanData && (
            <>
              {isMobile && (
                <motion.div
                  key="backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSelectedLahan(null)}
                  className="fixed inset-0 bg-black/40 z-30"
                />
              )}
              <motion.div
                key="panel"
                initial={panelInitial}
                animate={panelAnimate}
                exit={panelExit}
                transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                className={clsx(
                  'bg-white shadow-xl overflow-y-auto',
                  isMobile
                    ? 'fixed bottom-0 left-0 right-0 max-h-[85vh] rounded-t-2xl z-40'
                    : 'absolute top-0 right-0 h-full w-80 border-l border-gray-100 z-[500]'
                )}
              >
                {isMobile && (
                  <div className="pt-2 pb-1 flex justify-center sticky top-0 bg-white">
                    <div className="w-10 h-1 bg-gray-200 rounded-full" />
                  </div>
                )}

                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: lahanData.warna }} />
                      <h3 className="font-bold text-gray-800 truncate">{lahanData.nama}</h3>
                    </div>
                    <button
                      onClick={() => setSelectedLahan(null)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
                      aria-label="Tutup detail"
                    >
                      <X className="w-4 h-4 text-gray-500" />
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
                     lahanData.status === 'perhatian' ? 'Perlu perhatian' : 'Peringatan'}
                  </div>

                  <p className="text-sm text-gray-500 mb-5">{lahanData.keterangan}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-3 mb-5">
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
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleIrigate(lahanData.id)}
                      disabled={irrigating === lahanData.id}
                      className={clsx(
                        'btn-primary w-full flex items-center justify-center gap-2 text-sm py-2.5',
                        irrigating === lahanData.id && 'opacity-70 cursor-wait'
                      )}
                    >
                      {irrigating === lahanData.id ? (
                        <><RefreshCw className="w-4 h-4 animate-spin" />Memulai irigasi…</>
                      ) : (
                        <><Navigation className="w-4 h-4" />Mulai irigasi</>
                      )}
                    </motion.button>
                    <div className="flex gap-2">
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleExportData(lahanData.nama)}
                        className="btn-ghost flex-1 flex items-center justify-center gap-1.5 text-sm py-2.5"
                      >
                        <Download className="w-3.5 h-3.5" />Ekspor data
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleRefreshData(lahanData.nama)}
                        className="btn-ghost flex-1 flex items-center justify-center gap-1.5 text-sm py-2.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />Refresh
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      <p className="text-xs text-gray-400 mt-2 px-1">
        Tampilan satellite area Lembang, Jawa Barat. Polygon lahan adalah simulasi untuk demo.
      </p>
    </motion.div>
  )
}
