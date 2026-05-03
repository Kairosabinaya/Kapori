import { SENSOR_THRESHOLDS, classifyMetric } from '../lib/sensor-thresholds'

// =================== AREA↔LAHAN MAPPING ===================
export const farmToLahan = {
  'Semua Area': ['Lahan Utama', 'Lahan Selatan', 'Lahan Barat'],
  'Area Utama': ['Lahan Utama'],
  'Area Selatan': ['Lahan Selatan'],
  'Area Barat': ['Lahan Barat'],
}

// Simple seeded hash to get consistent "random" variation per filter combo
function hashSeed(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0
  return h
}

function vary(base, seed, pct = 0.08) {
  const s = hashSeed(seed)
  const offset = ((s % 100) / 100) * pct * 2 - pct
  return Math.round((base * (1 + offset)) * 10) / 10
}

// =================== TIME MULTIPLIERS ===================
const timeMultiplier = {
  'Hari Ini': 1.0,
  '7 Hari Terakhir': 0.97,
  '30 Hari Terakhir': 0.93,
  'Bulan Ini': 0.95,
  'Kustom': 0.91,
}

// =================== SENSOR DATA ===================
// Each sensor is an IoT measurement node covering ~100 m radius. Measures:
//   - kelembaban (soil moisture, vol %)
//   - suhu (soil/ambient temp, °C)
//   - ph (soil pH)
//   - ec (electrical conductivity, dS/m)
//   - npk (NPK availability index, 0–100, derived from N/P/K reagent panel)
//   - airHumidity (canopy RH, %)
//   - sistemHealth (self-diagnostic %)
// Plus device telemetry: sinyal, baterai, solarCharge, lastReport, status.
//
// Lahan averages (post optimal-range refactor - threshold 60–80% kelembaban):
//   Utama  (Tomat & cabai) → water stress (kelembaban ~28%, suhu 33°C, RH 48%) - kritis
//   Selatan (Bawang merah) → normal optimal (kelembaban ~70%, suhu 27°C, RH 68%)
//   Barat  (Pepaya California) → fungal risk (kelembaban 72% optimal, RH 88% warning, suhu 23°C)
// Skenario per lahan (post penyesuaian threshold optimal 60–80% kelembaban):
//   Utama   → water-stress demo: kelembaban ~28% (di bawah criticalMin 30%),
//             suhu 33°C (warning), pH 5.8 (warning), EC 1.0 (warning).
//   Selatan → optimal demo: kelembaban ~70% (di optimal 60–80), suhu 27°C,
//             pH 6.5, EC 1.6, NPK 82.
//   Barat   → fungal-risk demo: airHumidity 88% (warning, di atas optimal 80
//             tapi belum critical 90), suhu 23°C (di window patogen 18–25),
//             kelembaban 72% (optimal - tanah, bukan canopy, jadi OK).
// Posisi sensor: sebar di interior polygon dengan margin minimum ~70m dari
// edge terdekat. Margin diverifikasi via interpolasi linear pada segment
// boundary terdekat. Semua sensor online; SS-02 sebelumnya offline,
// dinormalkan kembali sesuai permintaan.
export const sensors = [
  // ─── Lahan Utama (4 sensors, water stress scenario) ───
  // Pola 2x2 di kuadran polygon utama, menghindari notch di sisi selatan
  // (notch di lng 111.9127–111.9134, lat -7.5903–-7.5912).
  {
    id: 'SU-01', nama: 'Sensor Utama 01', lahan: 'Lahan Utama', tipe: 'sensor',
    position: [-7.5878, 111.9118],
    kelembaban: 26.8, suhu: 33.2, ph: 5.7, ec: 1.05, npk: 72, airHumidity: 47, sistemHealth: 99,
    sinyal: 92, baterai: 88, solarCharge: 13.4, lastReport: '1 menit lalu',
    status: 'online', error: null,
  },
  {
    id: 'SU-02', nama: 'Sensor Utama 02', lahan: 'Lahan Utama', tipe: 'sensor',
    position: [-7.5878, 111.9143],
    kelembaban: 28.4, suhu: 32.8, ph: 5.8, ec: 1.10, npk: 74, airHumidity: 49, sistemHealth: 97,
    sinyal: 88, baterai: 38, solarCharge: 3.2, lastReport: '3 menit lalu',
    status: 'online', error: null,
  },
  {
    id: 'SU-03', nama: 'Sensor Utama 03', lahan: 'Lahan Utama', tipe: 'sensor',
    position: [-7.5905, 111.9118],
    kelembaban: 27.6, suhu: 33.1, ph: 5.9, ec: 1.08, npk: 75, airHumidity: 48, sistemHealth: 98,
    sinyal: 91, baterai: 91, solarCharge: 14.0, lastReport: '1 menit lalu',
    status: 'online', error: null,
  },
  {
    id: 'SU-04', nama: 'Sensor Utama 04', lahan: 'Lahan Utama', tipe: 'sensor',
    position: [-7.5905, 111.9143],
    kelembaban: 28.9, suhu: 32.9, ph: 5.8, ec: 1.06, npk: 71, airHumidity: 48, sistemHealth: 98,
    sinyal: 89, baterai: 84, solarCharge: 12.8, lastReport: '2 menit lalu',
    status: 'online', error: null,
  },

  // ─── Lahan Selatan (3 sensors, normal/optimal) ───
  // Triangular: NW, S-center, E-middle. Polygon elongated east-west jadi
  // sebar mengikuti sumbu panjang.
  {
    id: 'SS-01', nama: 'Sensor Selatan 01', lahan: 'Lahan Selatan', tipe: 'sensor',
    position: [-7.5933, 111.9085],
    kelembaban: 71.2, suhu: 26.8, ph: 6.4, ec: 1.78, npk: 81, airHumidity: 69, sistemHealth: 96,
    sinyal: 95, baterai: 90, solarCharge: 13.2, lastReport: '1 menit lalu',
    status: 'online', error: null,
  },
  {
    id: 'SS-02', nama: 'Sensor Selatan 02', lahan: 'Lahan Selatan', tipe: 'sensor',
    position: [-7.5948, 111.9110],
    kelembaban: 69.4, suhu: 27.3, ph: 6.5, ec: 1.74, npk: 83, airHumidity: 67, sistemHealth: 94,
    sinyal: 92, baterai: 92, solarCharge: 13.0, lastReport: '1 menit lalu',
    status: 'online', error: null,
  },
  {
    id: 'SS-03', nama: 'Sensor Selatan 03', lahan: 'Lahan Selatan', tipe: 'sensor',
    position: [-7.5945, 111.9135],
    kelembaban: 70.6, suhu: 26.9, ph: 6.6, ec: 1.76, npk: 82, airHumidity: 68, sistemHealth: 95,
    sinyal: 88, baterai: 95, solarCharge: 12.9, lastReport: '2 menit lalu',
    status: 'online', error: null,
  },

  // ─── Lahan Barat (3 sensors, fungal disease scenario) ───
  // SB-01 di "tab" upper-NE polygon untuk jangkau area atas; SB-02 SW main
  // body; SB-03 east main body. Cakupan menyeluruh.
  {
    id: 'SB-01', nama: 'Sensor Barat 01', lahan: 'Lahan Barat', tipe: 'sensor',
    position: [-7.5868, 111.9098],
    kelembaban: 72.8, suhu: 22.8, ph: 6.1, ec: 1.55, npk: 71, airHumidity: 89, sistemHealth: 88,
    sinyal: 82, baterai: 75, solarCharge: 7.4, lastReport: '2 menit lalu',
    status: 'online', error: null,
  },
  {
    id: 'SB-02', nama: 'Sensor Barat 02', lahan: 'Lahan Barat', tipe: 'sensor',
    position: [-7.5905, 111.9075],
    kelembaban: 71.4, suhu: 23.2, ph: 6.2, ec: 1.52, npk: 73, airHumidity: 87, sistemHealth: 86,
    sinyal: 78, baterai: 80, solarCharge: 8.1, lastReport: '5 menit lalu',
    status: 'online', error: null,
  },
  {
    id: 'SB-03', nama: 'Sensor Barat 03', lahan: 'Lahan Barat', tipe: 'sensor',
    position: [-7.5895, 111.9095],
    kelembaban: 71.8, suhu: 23.0, ph: 6.3, ec: 1.54, npk: 72, airHumidity: 88, sistemHealth: 87,
    sinyal: 85, baterai: 82, solarCharge: 7.8, lastReport: '3 menit lalu',
    status: 'online', error: null,
  },
]

export function getSensorsByLahan(lahanNama) {
  return sensors.filter(s => s.lahan === lahanNama)
}

// =================== ACTUATOR & INFRASTRUCTURE ===================
// Setiap stasiun KAPORI sudah self-contained - modul komunikasi 4G/WiFi/LoRa
// internal mengirim data langsung ke cloud, tanpa gateway terpisah.
// Relay nodes drive irrigation valves. Weather station feeds ambient RH/wind/rain
// to AI. Edge compute (cloud-side) runs AI inference for hybrid edge-cloud
// architecture.
export const actuators = [
  {
    id: 'RN-U01', nama: 'Relay Irigasi Utama', lahan: 'Lahan Utama', tipe: 'relay',
    sinyal: 94, baterai: 100, solarCharge: 0, lastReport: 'Baru saja',
    status: 'online', error: null,
  },
  {
    id: 'RN-S01', nama: 'Relay Irigasi Selatan', lahan: 'Lahan Selatan', tipe: 'relay',
    sinyal: 92, baterai: 100, solarCharge: 0, lastReport: '2 menit lalu',
    status: 'online', error: null,
  },
  {
    id: 'RN-B01', nama: 'Relay Irigasi Barat', lahan: 'Lahan Barat', tipe: 'relay',
    sinyal: 90, baterai: 100, solarCharge: 0, lastReport: '1 menit lalu',
    status: 'online', error: null,
  },
]

export const infrastructure = [
  {
    id: 'WS-01', nama: 'Stasiun Cuaca', lahan: 'Sistem', tipe: 'weather',
    sinyal: 96, baterai: 88, solarCharge: 11.8, lastReport: 'Baru saja',
    status: 'online', error: null,
  },
  {
    id: 'EC-01', nama: 'Edge Compute (AI Inference)', lahan: 'Sistem', tipe: 'compute',
    sinyal: 100, baterai: 100, solarCharge: 0, lastReport: 'Baru saja',
    status: 'online', error: null,
  },
]

// All devices unified - used by /perangkat
export function getAllDevices() {
  return [...sensors, ...actuators, ...infrastructure]
}

export function getFilteredDevices(farm) {
  const all = getAllDevices()
  if (farm === 'Semua Area') return all
  const mapped = farmToLahan[farm] || farmToLahan['Semua Area']
  // Always include 'Sistem' devices
  return all.filter(d => d.lahan === 'Sistem' || mapped.includes(d.lahan))
}

// =================== LAHAN DATA (derived from sensors) ===================
// Warna lahan = status-driven traffic light (hijau=normal, kuning=peringatan,
// merah=perhatian) supaya warna benar-benar mengomunikasikan urgensi, bukan
// sekadar identitas estetik.
function statusToColor(status) {
  return status === 'perhatian'  ? '#EF4444'   // merah - perlu intervensi cepat
       : status === 'peringatan' ? '#F59E0B'   // kuning - perlu perhatian
       : status === 'normal'     ? '#22C55E'   // hijau - sehat
       :                            '#9CA3AF'   // abu - tidak diketahui
}

const lahanMeta = [
  {
    id: 'utama', nama: 'Lahan Utama',
    luasHa: 1.8,
    komoditas: 'Tomat & cabai',
    sistemIrigasi: 'Drip 4 L/jam',
  },
  {
    id: 'selatan', nama: 'Lahan Selatan',
    luasHa: 1.4,
    komoditas: 'Bawang merah',
    sistemIrigasi: 'Drip 4 L/jam',
  },
  {
    id: 'barat', nama: 'Lahan Barat',
    luasHa: 0.9,
    komoditas: 'Pepaya California',
    sistemIrigasi: 'Drip 4 L/jam',
  },
]

function avg(list, key) {
  if (!list.length) return 0
  return Math.round((list.reduce((s, x) => s + x[key], 0) / list.length) * 10) / 10
}

// Lahan = static metadata + averaged sensor metrics + derived status.
// Status rollup: ambil klasifikasi tiap metrik via classifyMetric (single
// source of truth ada di sensor-thresholds.js), lalu turunkan jadi label
// lahan: ada metrik 'critical' → 'perhatian'; ada 'warning' → 'peringatan';
// selain itu 'normal'.
const ROLLUP_KEYS = ['kelembaban', 'suhu', 'airHumidity', 'ph', 'ec', 'npk']

function rollupStatus(metrics) {
  const classes = ROLLUP_KEYS.map(k => classifyMetric(metrics[k], k))
  if (classes.includes('critical')) return 'perhatian'
  if (classes.includes('warning'))  return 'peringatan'
  return 'normal'
}

function buildKeterangan(metrics, status) {
  if (status === 'normal') return 'Semua parameter dalam batas optimal.'
  const T = SENSOR_THRESHOLDS
  const issues = []
  if (metrics.kelembaban < T.kelembaban.criticalMin) issues.push(`kelembaban tanah ${metrics.kelembaban}% kritis rendah`)
  else if (metrics.kelembaban < T.kelembaban.optimalMin) issues.push(`kelembaban tanah ${metrics.kelembaban}% di bawah optimal`)
  if (metrics.suhu > T.suhu.criticalMax) issues.push(`suhu ${metrics.suhu}°C kritis tinggi`)
  else if (metrics.suhu > T.suhu.optimalMax) issues.push(`suhu ${metrics.suhu}°C di atas optimal`)
  if (metrics.airHumidity > T.airHumidity.optimalMax) issues.push(`kelembaban udara ${metrics.airHumidity}% berisiko jamur`)
  if (metrics.ph < T.ph.optimalMin || metrics.ph > T.ph.optimalMax) issues.push(`pH ${metrics.ph} di luar 6–7`)
  if (metrics.ec < T.ec.optimalMin) issues.push(`EC ${metrics.ec} dS/m rendah`)
  if (metrics.npk < T.npk.optimalMin) issues.push(`NPK ${metrics.npk} di bawah target`)
  if (issues.length === 0) return 'Beberapa parameter perlu perhatian.'
  return issues[0].charAt(0).toUpperCase() + issues[0].slice(1) + '.'
}

export const lahans = lahanMeta.map(meta => {
  const lahanSensors = sensors.filter(s => s.lahan === meta.nama)
  const metrics = {
    kelembaban: avg(lahanSensors, 'kelembaban'),
    suhu:       avg(lahanSensors, 'suhu'),
    ph:         avg(lahanSensors, 'ph'),
    ec:         avg(lahanSensors, 'ec'),
    npk:        Math.round(avg(lahanSensors, 'npk')),
    airHumidity: Math.round(avg(lahanSensors, 'airHumidity')),
    sistemHealth: Math.round(avg(lahanSensors, 'sistemHealth')),
  }
  const status = rollupStatus(metrics)
  const keterangan = buildKeterangan(metrics, status)

  return {
    ...meta,
    sensorCount: lahanSensors.length,
    sensorOnline: lahanSensors.filter(s => s.status === 'online').length,
    ...metrics,
    status,
    keterangan,
    warna: statusToColor(status),
  }
})

export function getFilteredLahans(farm) {
  const mapped = farmToLahan[farm] || farmToLahan['Semua Area']
  return lahans.filter(l => mapped.includes(l.nama))
}

// Apply time-based variation on top of base lahan metrics
export function getFilteredLahanData(farm, time) {
  const filtered = getFilteredLahans(farm)
  const tm = timeMultiplier[time] || 1.0
  return filtered.map(l => ({
    ...l,
    kelembaban: vary(l.kelembaban * tm, `${l.id}-kel-${time}`, 0.05),
    suhu: vary(l.suhu * (2 - tm), `${l.id}-suhu-${time}`, 0.03),
    ph: vary(l.ph, `${l.id}-ph-${time}`, 0.02),
    ec: vary(l.ec, `${l.id}-ec-${time}`, 0.04),
    npk: Math.round(vary(l.npk * tm, `${l.id}-npk-${time}`, 0.04)),
    airHumidity: Math.round(vary(l.airHumidity, `${l.id}-rh-${time}`, 0.04)),
    sistemHealth: Math.round(Math.min(100, vary(l.sistemHealth * tm, `${l.id}-sh-${time}`, 0.02))),
  }))
}

export function getOverviewMetrics(farm, time) {
  const data = getFilteredLahanData(farm, time)
  if (data.length === 0) return null
  const m = (key) => Math.round((data.reduce((s, d) => s + d[key], 0) / data.length) * 10) / 10
  return {
    kelembaban: m('kelembaban'),
    suhu: m('suhu'),
    ph: m('ph'),
    ec: m('ec'),
    npk: Math.round(m('npk')),
    airHumidity: Math.round(m('airHumidity')),
    sistemHealth: Math.round(m('sistemHealth')),
  }
}

// =================== ALERTS - derived from current state + system events ===================
// Hanya peringatan agronomi tingkat lahan + event sistem yang relevan untuk
// pengambilan keputusan. Kondisi telemetri perangkat (solar lemah, sinyal
// turun, dsb.) sudah tampil langsung di /perangkat - tidak perlu duplikasi
// di feed peringatan.

function lahanAlerts() {
  const out = []
  let id = 200
  const T = SENSOR_THRESHOLDS
  for (const l of lahans) {
    // Critical water stress: kelembaban di zona critical AND suhu di atas optimal
    if (l.kelembaban < T.kelembaban.criticalMin && l.suhu > T.suhu.optimalMax) {
      out.push({
        id: id++, tipe: 'critical',
        judul: `Stres air dini di ${l.nama}`,
        pesan: `Kelembaban tanah ${l.kelembaban}% jatuh di bawah ambang kritis ${T.kelembaban.criticalMin}% sementara suhu ${l.suhu}°C dan kelembaban udara ${l.airHumidity}%. Tanaman akan mengalami stres dalam beberapa jam tanpa intervensi.`,
        lahan: l.nama, waktu: '20 menit lalu', sumberId: l.id, kategori: 'lahan',
      })
    }
    // Fungal risk: kelembaban udara di atas optimal AND suhu di window patogen
    if (l.airHumidity > T.airHumidity.optimalMax && l.suhu >= 18 && l.suhu <= 28) {
      out.push({
        id: id++, tipe: 'warning',
        judul: `Risiko penyakit jamur di ${l.nama}`,
        pesan: `Kelembaban udara ${l.airHumidity}% (di atas optimal ${T.airHumidity.optimalMax}%) pada suhu ${l.suhu}°C berada di window ideal patogen jamur (downy/late blight). Pertimbangkan fungisida preventif.`,
        lahan: l.nama, waktu: '40 menit lalu', sumberId: l.id, kategori: 'lahan',
      })
    }
    // pH ekstrem: di luar batas aman (critical bounds)
    if (l.ph < T.ph.criticalMin || l.ph > T.ph.criticalMax) {
      const tooAcid = l.ph < T.ph.criticalMin
      out.push({
        id: id++, tipe: 'warning',
        judul: `pH tanah ${tooAcid ? 'asam' : 'basa'} di ${l.nama}`,
        pesan: `pH ${l.ph} di luar rentang aman ${T.ph.criticalMin}–${T.ph.criticalMax}. ${tooAcid ? 'Disarankan pengapuran dolomit.' : 'Disarankan aplikasi belerang elemental.'}`,
        lahan: l.nama, waktu: '2 jam lalu', sumberId: l.id, kategori: 'lahan',
      })
    }
  }
  return out
}

const systemEvents = [
  {
    id: 1, tipe: 'info',
    judul: 'Pembaruan firmware selesai',
    pesan: 'Firmware sensor v2.4 diterapkan ke seluruh node. Peningkatan akurasi pembacaan EC dan stabilitas radio.',
    lahan: 'Sistem', waktu: '2 jam lalu', kategori: 'sistem',
  },
  {
    id: 2, tipe: 'info',
    judul: 'Hujan terdeteksi stasiun cuaca',
    pesan: 'Curah hujan 4 mm dalam 30 menit terakhir. Jadwal irigasi otomatis ditunda 24 jam.',
    lahan: 'Sistem', waktu: '3 jam lalu', kategori: 'sistem',
  },
]

export const alertsData = [...lahanAlerts(), ...systemEvents]
  .sort((a, b) => {
    const rank = { critical: 0, warning: 1, info: 2 }
    return rank[a.tipe] - rank[b.tipe]
  })

export function getFilteredAlerts(farm) {
  const mapped = farmToLahan[farm] || farmToLahan['Semua Area']
  return alertsData.filter(a => a.lahan === 'Sistem' || mapped.includes(a.lahan))
}

// =================== DECISION HISTORY ===================
// Past actions taken (some by user, some auto by AI), with observed outcomes.
export const decisionHistory = [
  {
    id: 1, waktu: 'Kemarin, 14:30',
    aksi: 'Diterapkan: Irigasi presisi 12 L/m² (Lahan Utama)',
    hasil: 'Kelembaban naik dari 28% ke 47% dalam 2 jam. Suhu zona akar turun 2°C.',
    status: 'success', lahan: 'Lahan Utama', applier: 'Otomatis',
  },
  {
    id: 2, waktu: 'Kemarin, 10:15',
    aksi: 'Diterapkan: Aplikasi NPK 16-16-16 35 kg/ha (Lahan Selatan)',
    hasil: 'Indeks NPK naik dari 71 ke 82 dalam 18 jam. EC stabil di 1.6 dS/m.',
    status: 'success', lahan: 'Lahan Selatan', applier: 'Pengguna',
  },
  {
    id: 3, waktu: '2 hari lalu, 08:00',
    aksi: 'Diterapkan: Pengapuran dolomit 1.2 ton/ha (Lahan Barat)',
    hasil: 'pH naik dari 5.4 ke 6.2 dalam 5 hari. Bertahap menuju 6.5 (target).',
    status: 'success', lahan: 'Lahan Barat', applier: 'Pengguna',
  },
  {
    id: 4, waktu: '3 hari lalu, 16:45',
    aksi: 'Diabaikan: Semprotan fungisida preventif (Lahan Selatan)',
    hasil: 'Aksi diabaikan. Insiden tidak terjadi karena RH turun di bawah 70% dalam 6 jam.',
    status: 'dismissed', lahan: 'Lahan Selatan', applier: 'Pengguna',
  },
]

export function getFilteredDecisionHistory(farm) {
  if (farm === 'Semua Area') return decisionHistory
  const mapped = farmToLahan[farm] || farmToLahan['Semua Area']
  return decisionHistory.filter(d => mapped.includes(d.lahan))
}

// =================== LAPORAN DATA ===================
export const reportsData = [
  {
    id: 1, nama: 'Performa Area Bulanan – Januari 2026',
    tanggal: '1 Feb 2026', ukuran: '2.4 MB', format: 'PDF', lahan: 'Semua Lahan',
    periode: 'Bulan Ini',
  },
  {
    id: 2, nama: 'Ekspor Metrik Tanah – Lahan Utama',
    tanggal: '28 Jan 2026', ukuran: '156 KB', format: 'CSV', lahan: 'Lahan Utama',
    periode: '7 Hari Terakhir',
  },
  {
    id: 3, nama: 'Log Penggunaan Irigasi',
    tanggal: '15 Jan 2026', ukuran: '1.1 MB', format: 'Excel', lahan: 'Semua Lahan',
    periode: '30 Hari Terakhir',
  },
]

export function getFilteredReports(farm) {
  if (farm === 'Semua Area') return reportsData
  const mapped = farmToLahan[farm] || farmToLahan['Semua Area']
  return reportsData.filter(r => r.lahan === 'Semua Lahan' || mapped.includes(r.lahan))
}

// =================== CHART DATA ===================
export const generateChartData = (farm = 'Semua Area', time = 'Hari Ini') => {
  const days = time === 'Hari Ini' ? 24 : time === '7 Hari Terakhir' ? 7 : 30
  const isHourly = time === 'Hari Ini'
  const seed = hashSeed(`${farm}-${time}`)

  // Per-area baseline mengikuti skenario sensor terbaru (post optimal-range refactor)
  const bases = {
    'Semua Area': { kel: 56, suhu: 27.5 },
    'Area Utama': { kel: 28, suhu: 33 },
    'Area Selatan': { kel: 70, suhu: 27 },
    'Area Barat': { kel: 72, suhu: 23 },
  }
  const b = bases[farm] || bases['Semua Area']

  return Array.from({ length: days }, (_, i) => {
    const s = hashSeed(`${seed}-${i}`)
    const noise1 = ((s % 100) - 50) / 50
    const noise2 = ((s % 77) - 38) / 38
    return {
      hari: isHourly ? `${String(i).padStart(2, '0')}:00` : `${i + 1}`,
      kelembaban: Math.round((b.kel + Math.sin(i * 0.4) * 5 + noise1 * 3) * 10) / 10,
      suhu: Math.round((b.suhu + Math.cos(i * 0.3) * 1.6 + noise2 * 1.0) * 10) / 10,
    }
  })
}
