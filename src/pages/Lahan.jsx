import { useState, useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MapContainer, TileLayer, Polygon, Tooltip, ZoomControl, CircleMarker } from 'react-leaflet'
import {
  X, Droplets, Thermometer, TestTube, Zap, Leaf, ShieldCheck,
  Navigation, Download, RefreshCw, Compass, Radio, CloudRain, AlertTriangle
} from 'lucide-react'
import clsx from 'clsx'
import { notify } from '../lib/notify'
import { useMediaQuery } from '../lib/useMediaQuery'
import { getFilteredLahanData, farmToLahan, sensors, lahans } from '../data'
import {
  classifyMetric, computeWaterStressRisk, computeDiseaseRisk,
  computeIrrigationNeed, computeFertilizationNeed
} from '../lib/domain'
import { SENSOR_THRESHOLDS } from '../lib/sensor-thresholds'
import { downloadLahanCSV } from '../lib/downloads'

// Anchor: Nganjuk, Jawa Timur agricultural plain. Pusat dihitung dari
// bounding box gabungan 3 polygon lahan baru (lat -7.5959 s/d -7.5859,
// lng 111.9061 s/d 111.9161).
const FARM_CENTER = [-7.5909, 111.9111]
const PAN_RADIUS = 0.012

// Polygon coords statis dari GeoJSON survei lahan (Nganjuk plot).
// Warna fill diambil dari status terkini lahan (lihat `lahans[i].warna`
// di src/data/index.js: hijau/kuning/merah). Format koordinat Leaflet
// adalah [lat, lng] (di GeoJSON aslinya [lng, lat], sudah di-swap).
const lahanPolygons = [
  {
    id: 'utama', lahan: 'Lahan Utama',
    coords: [
      [-7.58589669132823,  111.91074987859417],
      [-7.591121749058701, 111.910075162066],
      [-7.591226249566105, 111.91245775480303],
      [-7.590275294015697, 111.91265806127132],
      [-7.590567895946947, 111.91340657491804],
      [-7.591132199110817, 111.91342765981005],
      [-7.591351650140751, 111.9138809849756],
      [-7.591142649162649, 111.91401803677019],
      [-7.591832352005483, 111.91488251732176],
      [-7.58634604878776,  111.91607381368908],
      [-7.586189296239496, 111.91560994607647],
    ],
  },
  {
    id: 'selatan', lahan: 'Lahan Selatan',
    coords: [
      [-7.595866046471741, 111.90941098798504],
      [-7.595907846216107, 111.90974834624797],
      [-7.59516590014718,  111.91258426415055],
      [-7.595301749523102, 111.91348037203892],
      [-7.593880553926567, 111.91387044253071],
      [-7.593817854013224, 111.91352254182061],
      [-7.59335805436416,  111.91358579649665],
      [-7.5923757534665555,111.90765039954732],
      [-7.594612052247612, 111.90721815927151],
      [-7.595364449221009, 111.90959020956365],
    ],
  },
  {
    id: 'barat', lahan: 'Lahan Barat',
    coords: [
      [-7.5861874822364825,111.90906280239409],
      [-7.586967179516222, 111.90895869586893],
      [-7.587035976266435, 111.90644857187704],
      [-7.589134271885612, 111.90632133056795],
      [-7.589111339747845, 111.90613625230156],
      [-7.591301353333165, 111.90611311751888],
      [-7.591266955300611, 111.9067608914525],
      [-7.591049101027679, 111.9087736176026],
      [-7.591117897126125, 111.90997662633526],
      [-7.586267745256563, 111.91064753505282],
    ],
  },
]

// Lookup warna lahan berdasarkan nama (status-driven dari data)
const lahanColor = lahans.reduce((acc, l) => {
  acc[l.nama] = l.warna
  return acc
}, {})

// Daftar metrik yang ditampilkan di sidebar lahan. Hanya icon + key - label,
// unit, dan ambang diambil dari SENSOR_THRESHOLDS supaya satu sumber kebenaran.
const metricIcons = [
  { key: 'kelembaban',   icon: Droplets },
  { key: 'suhu',         icon: Thermometer },
  { key: 'airHumidity',  icon: CloudRain },
  { key: 'ph',           icon: TestTube },
  { key: 'ec',           icon: Zap },
  { key: 'npk',          icon: Leaf },
  { key: 'sistemHealth', icon: ShieldCheck },
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
  const [refreshing, setRefreshing] = useState(null)

  const lahanData = selectedLahan
    ? filteredLahans.find(l => l.id === selectedLahan)
    : null

  // Derived insights for the selected lahan
  const insights = useMemo(() => {
    if (!lahanData) return null
    return {
      waterStress: computeWaterStressRisk(lahanData),
      diseaseRisk: computeDiseaseRisk(lahanData),
      irrigationNeed: computeIrrigationNeed(lahanData),
      fertilizationNeed: computeFertilizationNeed(lahanData),
    }
  }, [lahanData])

  const handleIrigate = (lahanNama) => {
    setIrrigating(lahanNama)
    notify.info(`Membuka katup relay irigasi ${lahanNama}…`)
    setTimeout(() => {
      setIrrigating(null)
      notify.success(`Irigasi ${lahanNama} dimulai (katup terbuka)`)
    }, 2000)
  }

  const handleExportData = (lahan) => {
    const lahanSensors = sensors.filter(s => s.lahan === lahan.nama)
    downloadLahanCSV(lahan, lahanSensors)
    notify.success(`Data ${lahan.nama} diunduh (CSV)`)
  }

  const handleRefreshData = (lahanNama) => {
    setRefreshing(lahanNama)
    notify.info(`Memperbarui pembacaan sensor ${lahanNama}…`)
    setTimeout(() => {
      setRefreshing(null)
      notify.success(`Pembacaan sensor ${lahanNama} diperbarui`)
    }, 1200)
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
      className="absolute inset-0 overflow-hidden isolate"
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

        {lahanPolygons.map(poly => {
          const isVisible = visibleLahanNames.includes(poly.lahan)
          const isSelected = selectedLahan === poly.id
          const polyColor = lahanColor[poly.lahan] || '#9CA3AF'
          return (
            <Polygon
              key={poly.id}
              positions={poly.coords}
              pathOptions={{
                color: polyColor,
                weight: isSelected ? 4 : 2.5,
                fillColor: polyColor,
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
                <Tooltip permanent direction="center" className="lahan-label" opacity={1}>
                  Lahan {poly.lahan.replace('Lahan ', '')}
                </Tooltip>
              )}
            </Polygon>
          )
        })}

        {sensors.map(sensor => {
          const isVisible = visibleLahanNames.includes(sensor.lahan)
          if (!isVisible) return null
          const color = lahanColor[sensor.lahan] || '#2D6A4F'
          const isOffline = sensor.status === 'offline'
          const isWarning = sensor.status === 'peringatan'
          return (
            <CircleMarker
              key={sensor.id}
              center={sensor.position}
              radius={isOffline ? 5 : 7}
              pathOptions={{
                color: 'white',
                weight: 2.5,
                fillColor: isOffline ? '#9CA3AF' : color,
                fillOpacity: isOffline ? 0.6 : 1,
                dashArray: isOffline ? '3 3' : null,
                className: 'sensor-marker',
              }}
              eventHandlers={{
                mouseover: (e) => e.target.setRadius(9),
                mouseout: (e) => e.target.setRadius(isOffline ? 5 : 7),
              }}
            >
              <Tooltip direction="top" offset={[0, -8]} opacity={1} className="sensor-tooltip">
                <div>
                  <div className="flex items-center gap-2 pb-2.5 mb-2.5 border-b border-gray-100">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: isOffline ? '#9CA3AF' : color }}
                    />
                    <div className="min-w-0 flex-1 leading-tight">
                      <p className="text-[13px] font-bold text-gray-800">{sensor.nama}</p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {sensor.id} · {sensor.lahan}
                        {isOffline && <span className="ml-1 text-red-500 font-semibold">· Offline</span>}
                        {isWarning && !isOffline && <span className="ml-1 text-amber-600 font-semibold">· Perhatian</span>}
                      </p>
                    </div>
                  </div>

                  {!isOffline ? (
                    <div className="flex flex-col gap-1.5">
                      <SensorRow label="Kelembaban tanah" value={`${sensor.kelembaban}%`} status={classifyMetric(sensor.kelembaban, 'kelembaban')} />
                      <SensorRow label="Suhu" value={`${sensor.suhu}°C`} status={classifyMetric(sensor.suhu, 'suhu')} />
                      <SensorRow label="Kelembaban udara" value={`${sensor.airHumidity}%`} status={classifyMetric(sensor.airHumidity, 'airHumidity')} />
                      <SensorRow label="pH tanah" value={sensor.ph} status={classifyMetric(sensor.ph, 'ph')} />
                      <SensorRow label="Konduktivitas" value={`${sensor.ec} dS/m`} status={classifyMetric(sensor.ec, 'ec')} />
                      <SensorRow label="Indeks NPK" value={sensor.npk} status={classifyMetric(sensor.npk, 'npk')} />
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 italic py-2">
                      Sensor offline. Pembacaan terakhir 4 jam lalu, diperlukan pengecekan lapangan.
                    </p>
                  )}

                  <p className="text-[10px] text-gray-400 pt-2.5 mt-2.5 border-t border-gray-100">
                    {sensor.lastReport} · cakupan ~100 m · sinyal {sensor.sinyal}% · baterai {sensor.baterai}%
                  </p>
                </div>
              </Tooltip>
            </CircleMarker>
          )
        })}
      </MapContainer>

      <div className="absolute top-3 left-3 z-[1000] bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md flex items-center gap-2 pointer-events-none">
        <Compass className="w-4 h-4 text-kapori-600" />
        <div className="leading-tight">
          <p className="text-xs font-semibold text-gray-800">Nganjuk, Jawa Timur</p>
          <p className="text-[10px] text-gray-400">Polygon &amp; sensor: simulasi demo</p>
        </div>
      </div>

      <div className="absolute bottom-6 left-3 z-[1000] bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md">
        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Status Lahan</p>
        <div className="space-y-1">
          {lahanPolygons.map(p => {
            const info = lahans.find(l => l.nama === p.lahan)
            const swatch = lahanColor[p.lahan] || '#9CA3AF'
            const label = info?.status === 'perhatian'  ? 'Perlu perhatian'
                         : info?.status === 'peringatan' ? 'Peringatan'
                         : info?.status === 'normal'     ? 'Normal'
                         :                                  '-'
            return (
              <div key={p.id} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: swatch }} />
                <span className="text-gray-700">{p.lahan}</span>
                <span className="text-gray-400">· {label}</span>
              </div>
            )
          })}
        </div>
        <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-1.5 text-[10px] text-gray-500">
          <Radio className="w-3 h-3" />
          <span>{sensors.length} titik sensor IoT</span>
        </div>
      </div>

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
                className="fixed inset-0 bg-black/40 z-[990]"
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
                  ? 'fixed bottom-0 left-0 right-0 max-h-[85vh] rounded-t-2xl z-[1000]'
                  : 'absolute top-0 right-0 h-full w-[360px] border-l border-gray-100 z-[1000]'
              )}
            >
              {isMobile && (
                <div className="pt-2 pb-1 flex justify-center sticky top-0 bg-white">
                  <div className="w-10 h-1 bg-gray-200 rounded-full" />
                </div>
              )}

              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
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

                <div className="flex items-center gap-2 flex-wrap mb-3">
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
                    {lahanData.status === 'normal' ? 'Normal'
                      : lahanData.status === 'perhatian' ? 'Perlu perhatian' : 'Peringatan'}
                  </div>
                  <span className="badge bg-gray-100 text-gray-600 flex items-center gap-1">
                    <Radio className="w-3 h-3" />
                    {lahanData.sensorOnline}/{lahanData.sensorCount} sensor online
                  </span>
                </div>

                <div className="space-y-1 text-xs text-gray-500 mb-4">
                  <p><span className="text-gray-400">Komoditas:</span> <span className="text-gray-700 font-medium">{lahanData.komoditas}</span></p>
                  <p><span className="text-gray-400">Luas:</span> <span className="text-gray-700 font-medium">{lahanData.luasHa} ha</span></p>
                  <p><span className="text-gray-400">Sistem irigasi:</span> <span className="text-gray-700 font-medium">{lahanData.sistemIrigasi}</span></p>
                </div>

                <p className="text-sm text-gray-600 mb-5 bg-gray-50 rounded-xl p-3 leading-relaxed">{lahanData.keterangan}</p>

                {/* Derived insights */}
                {insights && (
                  <div className="mb-5">
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Analitik AI
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <InsightTile label="Stres air" value={insights.waterStress} icon={AlertTriangle} />
                      <InsightTile label="Risiko jamur" value={insights.diseaseRisk} icon={AlertTriangle} />
                      <InsightTile label="Butuh irigasi" value={insights.irrigationNeed} icon={Droplets} variant="action" />
                      <InsightTile label="Butuh pupuk" value={insights.fertilizationNeed} icon={Leaf} variant="action" />
                    </div>
                  </div>
                )}

                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Pembacaan rata-rata
                </p>
                <div className="rounded-xl bg-gray-50 divide-y divide-gray-100 mb-5">
                  {metricIcons.map(m => {
                    const Icon = m.icon
                    const t = SENSOR_THRESHOLDS[m.key]
                    if (!t) return null
                    const val = lahanData[m.key]
                    const status = classifyMetric(val, m.key)
                    const valueClass = status === 'critical' ? 'text-red-700'
                                    : status === 'warning' ? 'text-amber-700'
                                    : status === 'optimal' ? 'text-green-700'
                                    : 'text-gray-500'
                    const ideal = t.monotonic === 'higher-better' ? `≥ ${t.optimalMin}${t.unit}`
                               : t.monotonic === 'lower-better'  ? `≤ ${t.optimalMax}${t.unit}`
                               : `${t.optimalMin}–${t.optimalMax}${t.unit}`
                    return (
                      <div key={m.key} className="flex items-center justify-between gap-2 px-3 py-2.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <Icon className="w-4 h-4 text-gray-400 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm text-gray-700 truncate leading-tight">{t.label}</p>
                            <p className="text-[11px] text-gray-400 leading-tight mt-0.5">Ideal {ideal}</p>
                          </div>
                        </div>
                        <span className={clsx('text-sm font-semibold tabular-nums shrink-0', valueClass)}>
                          {val ?? '-'}{val != null ? ` ${t.unit}` : ''}
                        </span>
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
                      <><RefreshCw className="w-4 h-4 animate-spin" />Membuka katup…</>
                    ) : (
                      <><Navigation className="w-4 h-4" />Mulai irigasi presisi</>
                    )}
                  </motion.button>
                  <div className="flex gap-2">
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleExportData(lahanData)}
                      className="btn-ghost flex-1 flex items-center justify-center gap-1.5 text-sm py-2.5"
                    >
                      <Download className="w-3.5 h-3.5" />Ekspor CSV
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleRefreshData(lahanData.nama)}
                      disabled={refreshing === lahanData.nama}
                      className={clsx(
                        'btn-ghost flex-1 flex items-center justify-center gap-1.5 text-sm py-2.5',
                        refreshing === lahanData.nama && 'opacity-70 cursor-wait'
                      )}
                    >
                      <RefreshCw className={clsx('w-3.5 h-3.5', refreshing === lahanData.nama && 'animate-spin')} />
                      Refresh
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

function SensorRow({ label, value, status }) {
  return (
    <div className="flex justify-between items-baseline gap-4">
      <span className="text-gray-500">{label}</span>
      <span className={clsx(
        'font-semibold tabular-nums flex items-center gap-1.5',
        status === 'optimal' ? 'text-green-700'
          : status === 'warning' ? 'text-amber-700'
          : status === 'critical' ? 'text-red-700' : 'text-gray-800'
      )}>
        <span className={clsx(
          'w-1.5 h-1.5 rounded-full inline-block',
          status === 'optimal' ? 'bg-green-500'
            : status === 'warning' ? 'bg-amber-500'
            : status === 'critical' ? 'bg-red-500' : 'bg-gray-400'
        )} />
        {value}
      </span>
    </div>
  )
}

function InsightTile({ label, value, icon: Icon, variant }) {
  // For risk variant: 0-30 green, 30-60 amber, 60+ red
  // For action variant: 0 = green (none needed), 1-50 amber (some), 50+ red (urgent)
  let tone = 'optimal'
  if (variant === 'action') {
    if (value === 0) tone = 'optimal'
    else if (value < 50) tone = 'warning'
    else tone = 'critical'
  } else {
    if (value < 30) tone = 'optimal'
    else if (value < 60) tone = 'warning'
    else tone = 'critical'
  }

  const toneStyle = {
    optimal:  { bg: 'bg-green-50', text: 'text-green-700', icon: 'text-green-500' },
    warning:  { bg: 'bg-amber-50', text: 'text-amber-700', icon: 'text-amber-500' },
    critical: { bg: 'bg-red-50',   text: 'text-red-700',   icon: 'text-red-500' },
  }[tone]

  return (
    <div className={clsx('rounded-xl p-2.5', toneStyle.bg)}>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className={clsx('w-3.5 h-3.5', toneStyle.icon)} />
        <span className="text-[10px] text-gray-600">{label}</span>
      </div>
      <p className={clsx('text-lg font-bold', toneStyle.text)}>{value}%</p>
    </div>
  )
}
