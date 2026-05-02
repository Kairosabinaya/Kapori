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
// Each sensor covers a ~100 m radius. Multiple sensors per lahan; the lahan
// metric is the rounded average of its sensors.
export const sensors = [
  // Lahan Utama — 4 sensors
  {
    id: 'SU-01', nama: 'Sensor Utama 01', lahan: 'Lahan Utama',
    position: [-7.5870, 111.9105], lastReport: '2 menit lalu',
    kelembaban: 63.5, suhu: 32.4, ph: 6.7, ec: 1.18, npk: 84, sistemHealth: 99,
  },
  {
    id: 'SU-02', nama: 'Sensor Utama 02', lahan: 'Lahan Utama',
    position: [-7.5895, 111.9135], lastReport: '4 menit lalu',
    kelembaban: 60.8, suhu: 32.8, ph: 6.9, ec: 1.22, npk: 86, sistemHealth: 97,
  },
  {
    id: 'SU-03', nama: 'Sensor Utama 03', lahan: 'Lahan Utama',
    position: [-7.5895, 111.9165], lastReport: '1 menit lalu',
    kelembaban: 61.7, suhu: 32.5, ph: 6.8, ec: 1.21, npk: 85, sistemHealth: 98,
  },
  {
    id: 'SU-04', nama: 'Sensor Utama 04', lahan: 'Lahan Utama',
    position: [-7.5915, 111.9145], lastReport: '3 menit lalu',
    kelembaban: 62.4, suhu: 32.7, ph: 6.8, ec: 1.19, npk: 85, sistemHealth: 98,
  },

  // Lahan Selatan — 3 sensors
  {
    id: 'SS-01', nama: 'Sensor Selatan 01', lahan: 'Lahan Selatan',
    position: [-7.5940, 111.9100], lastReport: '2 menit lalu',
    kelembaban: 72.4, suhu: 28.8, ph: 7.2, ec: 1.42, npk: 91, sistemHealth: 96,
  },
  {
    id: 'SS-02', nama: 'Sensor Selatan 02', lahan: 'Lahan Selatan',
    position: [-7.5955, 111.9120], lastReport: '5 menit lalu',
    kelembaban: 70.5, suhu: 29.3, ph: 7.0, ec: 1.38, npk: 93, sistemHealth: 94,
  },
  {
    id: 'SS-03', nama: 'Sensor Selatan 03', lahan: 'Lahan Selatan',
    position: [-7.5965, 111.9128], lastReport: '3 menit lalu',
    kelembaban: 71.0, suhu: 29.2, ph: 7.1, ec: 1.40, npk: 92, sistemHealth: 95,
  },

  // Lahan Barat — 3 sensors
  {
    id: 'SB-01', nama: 'Sensor Barat 01', lahan: 'Lahan Barat',
    position: [-7.5880, 111.9070], lastReport: '1 menit lalu',
    kelembaban: 56.7, suhu: 31.2, ph: 6.4, ec: 0.92, npk: 79, sistemHealth: 88,
  },
  {
    id: 'SB-02', nama: 'Sensor Barat 02', lahan: 'Lahan Barat',
    position: [-7.5895, 111.9080], lastReport: '6 menit lalu',
    kelembaban: 54.8, suhu: 31.5, ph: 6.6, ec: 0.88, npk: 77, sistemHealth: 86,
  },
  {
    id: 'SB-03', nama: 'Sensor Barat 03', lahan: 'Lahan Barat',
    position: [-7.5905, 111.9080], lastReport: '4 menit lalu',
    kelembaban: 55.9, suhu: 31.5, ph: 6.5, ec: 0.90, npk: 78, sistemHealth: 87,
  },
]

export function getSensorsByLahan(lahanNama) {
  return sensors.filter(s => s.lahan === lahanNama)
}

// =================== LAHAN DATA ===================
const lahanMeta = [
  {
    id: 'utama', nama: 'Lahan Utama', warna: '#EF4444', statusColor: 'merah',
    status: 'perhatian',
    keterangan: 'Perlu perhatian segera. Risiko stres air dalam 5 jam.',
  },
  {
    id: 'selatan', nama: 'Lahan Selatan', warna: '#22C55E', statusColor: 'hijau',
    status: 'normal',
    keterangan: 'Kondisi optimal. Semua parameter dalam batas normal.',
  },
  {
    id: 'barat', nama: 'Lahan Barat', warna: '#F59E0B', statusColor: 'oranye',
    status: 'peringatan',
    keterangan: 'Kelembaban di bawah optimal. Monitor jadwal irigasi.',
  },
]

function avg(list, key) {
  return Math.round((list.reduce((s, x) => s + x[key], 0) / list.length) * 10) / 10
}

// Lahan = static metadata + averaged sensor metrics
export const lahans = lahanMeta.map(meta => {
  const lahanSensors = sensors.filter(s => s.lahan === meta.nama)
  return {
    ...meta,
    sensorCount: lahanSensors.length,
    kelembaban: avg(lahanSensors, 'kelembaban'),
    suhu: avg(lahanSensors, 'suhu'),
    ph: avg(lahanSensors, 'ph'),
    ec: avg(lahanSensors, 'ec'),
    npk: Math.round(avg(lahanSensors, 'npk')),
    sistemHealth: Math.round(avg(lahanSensors, 'sistemHealth')),
  }
})

export function getFilteredLahans(farm) {
  const mapped = farmToLahan[farm] || farmToLahan['Semua Area']
  return lahans.filter(l => mapped.includes(l.nama))
}

export function getFilteredLahanData(farm, time) {
  const filtered = getFilteredLahans(farm)
  const tm = timeMultiplier[time] || 1.0
  return filtered.map(l => ({
    ...l,
    kelembaban: vary(l.kelembaban * tm, `${l.id}-kel-${time}`, 0.06),
    suhu: vary(l.suhu * (2 - tm), `${l.id}-suhu-${time}`, 0.04),
    ph: vary(l.ph, `${l.id}-ph-${time}`, 0.02),
    ec: vary(l.ec, `${l.id}-ec-${time}`, 0.05),
    npk: Math.round(vary(l.npk * tm, `${l.id}-npk-${time}`, 0.04)),
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
    sistemHealth: Math.round(m('sistemHealth')),
  }
}

// =================== PERANGKAT DATA ===================
export const perangkats = [
  {
    id: 'SN-A01', nama: 'Master Sensor Utama', lahan: 'Lahan Utama',
    status: 'online', sinyal: 95, baterai: 88, solarCharge: 12.4,
    lastReport: '2 menit lalu', error: null,
  },
  {
    id: 'SN-A02', nama: 'Relay Node Utama 2', lahan: 'Lahan Utama',
    status: 'peringatan', sinyal: 45, baterai: 22, solarCharge: 2.1,
    lastReport: '5 menit lalu', error: null,
  },
  {
    id: 'SN-B01', nama: 'Master Sensor Selatan', lahan: 'Lahan Selatan',
    status: 'offline', sinyal: 0, baterai: 0, solarCharge: 0,
    lastReport: '4 jam lalu', error: 'Perangkat tidak melapor dalam 4 jam.',
  },
  {
    id: 'SN-C01', nama: 'Master Sensor Barat', lahan: 'Lahan Barat',
    status: 'online', sinyal: 88, baterai: 100, solarCharge: 15.2,
    lastReport: '1 menit lalu', error: null,
  },
]

export function getFilteredPerangkats(farm) {
  const mapped = farmToLahan[farm] || farmToLahan['Semua Area']
  return perangkats.filter(d => mapped.includes(d.lahan))
}

// =================== ALERTS DATA ===================
export const alertsData = [
  {
    id: 1, tipe: 'critical',
    judul: 'Kegagalan Pompa Terdeteksi',
    pesan: 'Pompa irigasi utama tidak menarik arus listrik.',
    lahan: 'Lahan Utama', waktu: '10 menit lalu',
  },
  {
    id: 2, tipe: 'warning',
    judul: 'Baterai Lemah',
    pesan: 'Sensor SN-A02 baterai turun di bawah 20%.',
    lahan: 'Lahan Utama', waktu: '1 jam lalu',
  },
  {
    id: 3, tipe: 'info',
    judul: 'Pembaruan Selesai',
    pesan: 'Firmware v2.4 diterapkan ke semua node.',
    lahan: 'Sistem', waktu: '2 jam lalu',
  },
  {
    id: 4, tipe: 'critical',
    judul: 'Peringatan Frost',
    pesan: 'Suhu diprediksi turun di bawah 0°C malam ini.',
    lahan: 'Lahan Barat', waktu: '5 jam lalu',
  },
]

export function getFilteredAlerts(farm) {
  const mapped = farmToLahan[farm] || farmToLahan['Semua Area']
  return alertsData.filter(a => a.lahan === 'Sistem' || mapped.includes(a.lahan))
}

// =================== REKOMENDASI & RISIKO ===================
export const rekomendasis = [
  {
    id: 1, judul: 'Optimalkan Aplikasi Nitrogen',
    lahan: 'Lahan Selatan', aksi: 'Terapkan 40kg/ha NPK',
    dampak: '+8% Hasil Panen', match: 92,
  },
  {
    id: 2, judul: 'Sesuaikan Jadwal Irigasi',
    lahan: 'Lahan Barat', aksi: 'Kurangi air sebesar 15%',
    dampak: 'Hemat 500L Air', match: 88,
  },
]

export function getFilteredRekomendasis(farm) {
  if (farm === 'Semua Area') return rekomendasis
  const mapped = farmToLahan[farm] || farmToLahan['Semua Area']
  return rekomendasis.filter(r => mapped.includes(r.lahan))
}

export const risks = [
  {
    id: 1, tipe: 'critical', nama: 'Stres Air',
    lahan: 'Lahan Utama', waktuDampak: '5 jam',
    pencegahan: 'Irigasi Segera',
    detail: 'Kombinasi suhu tinggi (32.6°C) dan tidak ada curah hujan menyebabkan defisit air kritis pada tanaman.',
  },
  {
    id: 2, tipe: 'warning', nama: 'Penyakit Jamur',
    lahan: 'Lahan Selatan', waktuDampak: '3 hari',
    pencegahan: 'Semprotan Preventif',
    detail: 'Pola kelembaban dan suhu mendeteksi kondisi yang mendukung pertumbuhan jamur. Tindakan preventif disarankan.',
  },
]

export function getFilteredRisks(farm) {
  if (farm === 'Semua Area') return risks
  const mapped = farmToLahan[farm] || farmToLahan['Semua Area']
  return risks.filter(r => mapped.includes(r.lahan))
}

// =================== RIWAYAT KEPUTUSAN ===================
export const decisionHistory = [
  {
    id: 1, waktu: 'Kemarin, 14:30',
    aksi: 'Diterapkan: Peningkatan Irigasi (Lahan Utama)',
    hasil: 'Kelembaban stabil di 65%. Akurasi prediksi: 98%.',
    status: 'success', lahan: 'Lahan Utama',
  },
  {
    id: 2, waktu: 'Kemarin, 10:15',
    aksi: 'Diterapkan: Pemupukan NPK (Lahan Selatan)',
    hasil: 'NPK stabil di 92. Akurasi prediksi: 95%.',
    status: 'success', lahan: 'Lahan Selatan',
  },
  {
    id: 3, waktu: '2 hari lalu, 08:00',
    aksi: 'Diterapkan: Koreksi pH Tanah (Lahan Barat)',
    hasil: 'pH naik dari 6.1 ke 6.5. Akurasi prediksi: 94%.',
    status: 'success', lahan: 'Lahan Barat',
  },
  {
    id: 4, waktu: '3 hari lalu, 16:45',
    aksi: 'Diabaikan: Semprotan Nitrogen (Lahan Selatan)',
    hasil: 'Aksi diabaikan oleh pengguna.',
    status: 'dismissed', lahan: 'Lahan Selatan',
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
    id: 1, nama: 'Performa Area Bulanan - Jan',
    tanggal: '1 Feb 2026', ukuran: '2.4 MB', format: 'PDF', lahan: 'Semua Lahan',
  },
  {
    id: 2, nama: 'Ekspor Metrik Tanah - Lahan Utama',
    tanggal: '28 Jan 2026', ukuran: '156 KB', format: 'CSV', lahan: 'Lahan Utama',
  },
  {
    id: 3, nama: 'Log Penggunaan Irigasi',
    tanggal: '15 Jan 2026', ukuran: '1.1 MB', format: 'Excel', lahan: 'Semua Lahan',
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

  const bases = {
    'Semua Area': { kel: 63, suhu: 30.5 },
    'Area Utama': { kel: 62, suhu: 32.5 },
    'Area Selatan': { kel: 71, suhu: 29 },
    'Area Barat': { kel: 56, suhu: 31.5 },
  }
  const b = bases[farm] || bases['Semua Area']

  return Array.from({ length: days }, (_, i) => {
    const s = hashSeed(`${seed}-${i}`)
    const noise1 = ((s % 100) - 50) / 50
    const noise2 = ((s % 77) - 38) / 38
    return {
      hari: isHourly ? `${String(i).padStart(2, '0')}:00` : `${i + 1}`,
      kelembaban: Math.round((b.kel + Math.sin(i * 0.4) * 8 + noise1 * 4) * 10) / 10,
      suhu: Math.round((b.suhu + Math.cos(i * 0.3) * 2 + noise2 * 1.5) * 10) / 10,
    }
  })
}
