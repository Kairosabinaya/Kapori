import { useState, useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MapContainer, TileLayer, Polygon, Tooltip, ZoomControl, CircleMarker } from 'react-leaflet'
import {
  X, Droplets, Thermometer, TestTube, Zap, Leaf, ShieldCheck,
  Navigation, Download, RefreshCw, Compass, Radio
} from 'lucide-react'
import clsx from 'clsx'
import { notify } from '../lib/notify'
import { useMediaQuery } from '../lib/useMediaQuery'
import { getFilteredLahanData, farmToLahan, sensors } from '../data'
import ProgressBar from '../components/ui/ProgressBar'

// Anchor — Nganjuk, Jawa Timur agricultural plain
const FARM_CENTER = [-7.5915, 111.9111]
const PAN_RADIUS = 0.012 // ~1.3 km radius lock

// Polygon corners — user-plotted via geojson.io
const lahanPolygons = [
  {
    id: 'utama', lahan: 'Lahan Utama',
    color: '#EF4444',
    coords: [
      [-7.585828036297912, 111.90909196387753],
      [-7.592086858726859, 111.90899593151477],
      [-7.592420025428197, 111.91636641530340],
      [-7.586898943932937, 111.91723070656230],
      [-7.586161207848249, 111.91547811595382],
    ],
  },
  {
    id: 'selatan', lahan: 'Lahan Selatan',
    color: '#22C55E',
    coords: [
      [-7.592205846863834, 111.90618698492568],
      [-7.594204842642057, 111.90606694447229],
      [-7.595370919219334, 111.90966815805012],
      [-7.596727371663690, 111.90940406905452],
      [-7.597203318874335, 111.91187690237780],
      [-7.596108639500514, 111.91317333926526],
      [-7.593895474856510, 111.91389358198006],
      [-7.593419523980927, 111.91360548489382],
    ],
  },
  {
    id: 'barat', lahan: 'Lahan Barat',
    color: '#F59E0B',
    coords: [
      [-7.587136923045165, 111.90498658039905],
      [-7.589254931345479, 111.90496257230842],
      [-7.589254931345479, 111.90621099301626],
      [-7.591230143167977, 111.90609095256292],
      [-7.591253940845661, 111.90673917100759],
      [-7.591182547808771, 111.90889989915394],
      [-7.586970337680953, 111.90887589106325],
    ],
  },
]

// Map lahan name -> color (for sensor dots)
const lahanColor = lahanPolygons.reduce((acc, p) => {
  acc[p.lahan] = p.color
  return acc
}, {})

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
    () => farmToLahan[selectedFarm] || farmToLahan['Semua Area'],
    [selectedFarm]
  )

  const [selectedLahan, setSelectedLahan] = useState(null)
  const [irrigating, setIrrigating] = useState(null)

  const lahanData = selectedLahan
    ? filteredLahans.find(l => l.id === selectedLahan)
    : null

  const handleIrigate = (lahanNama) => {
    setIrrigating(lahanNama)
    notify.info(`Memulai irigasi untuk ${lahanNama}…`)
    setTimeout(() => {
      setIrrigating(null)
      notify.success(`Irigasi ${lahanNama} dimulai`)
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="absolute inset-0 overflow-hidden"
    >
      <MapContainer
        center={FARM_CENTER}
        zoom={16}
        minZoom={14}
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

        {/* Lahan polygons */}
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
                  Lahan {poly.lahan.replace('Lahan ', '')}
                </Tooltip>
              )}
            </Polygon>
          )
        })}

        {/* Sensor markers */}
        {sensors.map(sensor => {
          const isVisible = visibleLahanNames.includes(sensor.lahan)
          if (!isVisible) return null
          const color = lahanColor[sensor.lahan] || '#2D6A4F'
          return (
            <CircleMarker
              key={sensor.id}
              center={sensor.position}
              radius={7}
              pathOptions={{
                color: 'white',
                weight: 2.5,
                fillColor: color,
                fillOpacity: 1,
                className: 'sensor-marker',
              }}
              eventHandlers={{
                mouseover: (e) => e.target.setRadius(9),
                mouseout: (e) => e.target.setRadius(7),
              }}
            >
              <Tooltip
                direction="top"
                offset={[0, -8]}
                opacity={1}
                className="sensor-tooltip"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-gray-800 leading-tight">{sensor.nama}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{sensor.id} · {sensor.lahan}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-500">Kelembaban</span>
                      <span className="font-semibold text-gray-800">{sensor.kelembaban}%</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-500">Suhu</span>
                      <span className="font-semibold text-gray-800">{sensor.suhu}°C</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-500">pH</span>
                      <span className="font-semibold text-gray-800">{sensor.ph}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-500">EC</span>
                      <span className="font-semibold text-gray-800">{sensor.ec}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-500">NPK</span>
                      <span className="font-semibold text-gray-800">{sensor.npk}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-500">Sehat</span>
                      <span className="font-semibold text-gray-800">{sensor.sistemHealth}%</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 pt-1.5 border-t border-gray-100">
                    Terakhir lapor: {sensor.lastReport} · cakupan ~100 m
                  </p>
                </div>
              </Tooltip>
            </CircleMarker>
          )
        })}
      </MapContainer>

      {/* Compass / location label */}
      <div className="absolute top-3 left-3 z-[400] bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md flex items-center gap-2 pointer-events-none">
        <Compass className="w-4 h-4 text-kapori-600" />
        <div className="leading-tight">
          <p className="text-xs font-semibold text-gray-800">Nganjuk, Jawa Timur</p>
          <p className="text-[10px] text-gray-400">Polygon &amp; sensor: simulasi demo</p>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-6 left-3 z-[400] bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md">
        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Status Lahan</p>
        <div className="space-y-1">
          {lahanPolygons.map(p => (
            <div key={p.id} className="flex items-center gap-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: p.color }} />
              <span className="text-gray-700">{p.lahan}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-1.5 text-[10px] text-gray-500">
          <Radio className="w-3 h-3" />
          <span>{sensors.length} titik sensor</span>
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

                <div className="flex items-center gap-2 flex-wrap mb-4">
                  <div className={clsx(
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold',
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
                  <span className="badge bg-gray-100 text-gray-600 flex items-center gap-1">
                    <Radio className="w-3 h-3" />
                    {lahanData.sensorCount} sensor · rata-rata
                  </span>
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
                    onClick={() => handleIrigate(lahanData.nama)}
                    disabled={irrigating === lahanData.nama}
                    className={clsx(
                      'btn-primary w-full flex items-center justify-center gap-2 text-sm py-2.5',
                      irrigating === lahanData.nama && 'opacity-70 cursor-wait'
                    )}
                  >
                    {irrigating === lahanData.nama ? (
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
    </motion.div>
  )
}
