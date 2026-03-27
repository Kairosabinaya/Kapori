// =================== FARM↔LAHAN MAPPING ===================
export const farmToLahan = {
  'Semua Farm': ['Lahan A', 'Lahan B', 'Lahan C'],
  'Farm Utama': ['Lahan A'],
  'Farm Selatan': ['Lahan B'],
  'Farm Barat': ['Lahan C'],
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

// =================== LAHAN DATA ===================
export const lahans = [
  {
    id: 'A', nama: 'Lahan A', warna: '#EF4444', statusColor: 'merah',
    status: 'perhatian',
    kelembaban: 62.1, suhu: 32.6, ph: 6.8, ec: 1.2, npk: 85, sistemHealth: 98,
    keterangan: 'Perlu perhatian segera. Risiko stres air dalam 5 jam.',
  },
  {
    id: 'B', nama: 'Lahan B', warna: '#22C55E', statusColor: 'hijau',
    status: 'normal',
    kelembaban: 71.3, suhu: 29.1, ph: 7.1, ec: 1.4, npk: 92, sistemHealth: 95,
    keterangan: 'Kondisi optimal. Semua parameter dalam batas normal.',
  },
  {
    id: 'C', nama: 'Lahan C', warna: '#F59E0B', statusColor: 'oranye',
    status: 'peringatan',
    kelembaban: 55.8, suhu: 31.4, ph: 6.5, ec: 0.9, npk: 78, sistemHealth: 87,
    keterangan: 'Kelembaban di bawah optimal. Monitor jadwal irigasi.',
  },
]

// Get lahans filtered by selected farm
export function getFilteredLahans(farm) {
  const mapped = farmToLahan[farm] || farmToLahan['Semua Farm']
  return lahans.filter(l => mapped.includes(l.nama))
}

// Get lahan data with time-adjusted metrics
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

// Get overview metrics from filtered lahans (averages)
export function getOverviewMetrics(farm, time) {
  const data = getFilteredLahanData(farm, time)
  if (data.length === 0) return null
  const avg = (key) => Math.round((data.reduce((s, d) => s + d[key], 0) / data.length) * 10) / 10
  return {
    kelembaban: avg('kelembaban'),
    suhu: avg('suhu'),
    ph: avg('ph'),
    ec: avg('ec'),
    npk: Math.round(avg('npk')),
    sistemHealth: Math.round(avg('sistemHealth')),
  }
}

// =================== PERANGKAT DATA ===================
export const perangkats = [
  {
    id: 'SN-A01', nama: 'Master Sensor A', lahan: 'Lahan A',
    status: 'online', sinyal: 95, baterai: 88, solarCharge: 12.4,
    lastReport: '2 menit lalu', error: null,
  },
  {
    id: 'SN-A02', nama: 'Relay Node A2', lahan: 'Lahan A',
    status: 'peringatan', sinyal: 45, baterai: 22, solarCharge: 2.1,
    lastReport: '5 menit lalu', error: null,
  },
  {
    id: 'SN-B01', nama: 'Master Sensor B', lahan: 'Lahan B',
    status: 'offline', sinyal: 0, baterai: 0, solarCharge: 0,
    lastReport: '4 jam lalu', error: 'Perangkat tidak melapor dalam 4 jam.',
  },
  {
    id: 'SN-C01', nama: 'Master Sensor C', lahan: 'Lahan C',
    status: 'online', sinyal: 88, baterai: 100, solarCharge: 15.2,
    lastReport: '1 menit lalu', error: null,
  },
]

export function getFilteredPerangkats(farm) {
  const mapped = farmToLahan[farm] || farmToLahan['Semua Farm']
  return perangkats.filter(d => mapped.includes(d.lahan))
}

// =================== ALERTS DATA ===================
export const alertsData = [
  {
    id: 1, tipe: 'critical',
    judul: 'Kegagalan Pompa Terdeteksi',
    pesan: 'Pompa irigasi utama tidak menarik arus listrik.',
    lahan: 'Lahan A', waktu: '10 menit lalu',
  },
  {
    id: 2, tipe: 'warning',
    judul: 'Baterai Lemah',
    pesan: 'Sensor SN-A02 baterai turun di bawah 20%.',
    lahan: 'Lahan A', waktu: '1 jam lalu',
  },
  {
    id: 3, tipe: 'info',
    judul: 'Pembaruan Selesai',
    pesan: 'Firmware v2.4 berhasil diterapkan ke semua node.',
    lahan: 'Sistem', waktu: '2 jam lalu',
  },
  {
    id: 4, tipe: 'critical',
    judul: 'Peringatan Frost',
    pesan: 'Suhu diprediksi turun di bawah 0°C malam ini.',
    lahan: 'Lahan C', waktu: '5 jam lalu',
  },
]

export function getFilteredAlerts(farm) {
  const mapped = farmToLahan[farm] || farmToLahan['Semua Farm']
  // "Sistem" alerts always show
  return alertsData.filter(a => a.lahan === 'Sistem' || mapped.includes(a.lahan))
}

// =================== REKOMENDASI & RISIKO ===================
export const rekomendasis = [
  {
    id: 1, judul: 'Optimalkan Aplikasi Nitrogen',
    lahan: 'Lahan B', aksi: 'Terapkan 40kg/ha NPK',
    dampak: '+8% Hasil Panen', match: 92,
  },
  {
    id: 2, judul: 'Sesuaikan Jadwal Irigasi',
    lahan: 'Lahan C', aksi: 'Kurangi air sebesar 15%',
    dampak: 'Hemat 500L Air', match: 88,
  },
]

export function getFilteredRekomendasis(farm) {
  if (farm === 'Semua Farm') return rekomendasis
  const mapped = farmToLahan[farm] || farmToLahan['Semua Farm']
  return rekomendasis.filter(r => mapped.includes(r.lahan))
}

export const risks = [
  {
    id: 1, tipe: 'critical', nama: 'Stres Air',
    lahan: 'Lahan A', waktuDampak: '5 jam',
    pencegahan: 'Irigasi Segera',
    detail: 'Kombinasi suhu tinggi (32.6°C) dan tidak ada curah hujan menyebabkan defisit air kritis pada tanaman.',
  },
  {
    id: 2, tipe: 'warning', nama: 'Penyakit Jamur',
    lahan: 'Lahan B', waktuDampak: '3 hari',
    pencegahan: 'Semprotan Preventif',
    detail: 'Pola kelembaban dan suhu mendeteksi kondisi yang mendukung pertumbuhan jamur. Tindakan preventif disarankan.',
  },
]

export function getFilteredRisks(farm) {
  if (farm === 'Semua Farm') return risks
  const mapped = farmToLahan[farm] || farmToLahan['Semua Farm']
  return risks.filter(r => mapped.includes(r.lahan))
}

// =================== RIWAYAT KEPUTUSAN ===================
export const decisionHistory = [
  {
    id: 1, waktu: 'Kemarin, 14:30',
    aksi: 'Diterapkan: Peningkatan Irigasi (Lahan A)',
    hasil: 'Kelembaban stabil di 65%. Akurasi prediksi: 98%.',
    status: 'success', lahan: 'Lahan A',
  },
  {
    id: 2, waktu: 'Kemarin, 10:15',
    aksi: 'Diterapkan: Pemupukan NPK (Lahan B)',
    hasil: 'NPK stabil di 92. Akurasi prediksi: 95%.',
    status: 'success', lahan: 'Lahan B',
  },
  {
    id: 3, waktu: '2 hari lalu, 08:00',
    aksi: 'Diterapkan: Koreksi pH Tanah (Lahan C)',
    hasil: 'pH naik dari 6.1 ke 6.5. Akurasi prediksi: 94%.',
    status: 'success', lahan: 'Lahan C',
  },
  {
    id: 4, waktu: '3 hari lalu, 16:45',
    aksi: 'Diabaikan: Semprotan Nitrogen (Lahan B)',
    hasil: 'Aksi diabaikan oleh pengguna.',
    status: 'dismissed', lahan: 'Lahan B',
  },
]

export function getFilteredDecisionHistory(farm) {
  if (farm === 'Semua Farm') return decisionHistory
  const mapped = farmToLahan[farm] || farmToLahan['Semua Farm']
  return decisionHistory.filter(d => mapped.includes(d.lahan))
}

// =================== LAPORAN DATA ===================
export const reportsData = [
  {
    id: 1, nama: 'Performa Farm Bulanan - Jan',
    tanggal: '1 Feb 2026', ukuran: '2.4 MB', format: 'PDF', lahan: 'Semua Lahan',
  },
  {
    id: 2, nama: 'Ekspor Metrik Tanah - Lahan A',
    tanggal: '28 Jan 2026', ukuran: '156 KB', format: 'CSV', lahan: 'Lahan A',
  },
  {
    id: 3, nama: 'Log Penggunaan Irigasi',
    tanggal: '15 Jan 2026', ukuran: '1.1 MB', format: 'Excel', lahan: 'Semua Lahan',
  },
]

export function getFilteredReports(farm) {
  if (farm === 'Semua Farm') return reportsData
  const mapped = farmToLahan[farm] || farmToLahan['Semua Farm']
  return reportsData.filter(r => r.lahan === 'Semua Lahan' || mapped.includes(r.lahan))
}

// =================== CHART DATA ===================
export const generateChartData = (farm = 'Semua Farm', time = 'Hari Ini') => {
  const days = time === 'Hari Ini' ? 24 : time === '7 Hari Terakhir' ? 7 : 30
  const isHourly = time === 'Hari Ini'
  const seed = hashSeed(`${farm}-${time}`)

  // Different base values per farm
  const bases = {
    'Semua Farm': { kel: 63, suhu: 30.5 },
    'Farm Utama': { kel: 62, suhu: 32.5 },
    'Farm Selatan': { kel: 71, suhu: 29 },
    'Farm Barat': { kel: 56, suhu: 31.5 },
  }
  const b = bases[farm] || bases['Semua Farm']

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
