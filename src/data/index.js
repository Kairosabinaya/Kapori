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
// Lahan averages:
//   Utama  → water stress scenario (kelembaban ~32%, suhu 33°C, RH 48%)
//   Selatan → normal optimal (kelembaban ~50%, suhu 27°C, RH 68%)
//   Barat  → disease scenario (kelembaban ~72%, suhu 23°C, RH 88%)
export const sensors = [
  // ─── Lahan Utama (4 sensors — water stress scenario) ───
  {
    id: 'SU-01', nama: 'Sensor Utama 01', lahan: 'Lahan Utama', tipe: 'sensor',
    position: [-7.5870, 111.9105],
    kelembaban: 30.2, suhu: 33.2, ph: 5.7, ec: 0.95, npk: 68, airHumidity: 47, sistemHealth: 99,
    sinyal: 92, baterai: 88, solarCharge: 13.4, lastReport: '1 menit lalu',
    status: 'online', error: null,
  },
  {
    id: 'SU-02', nama: 'Sensor Utama 02', lahan: 'Lahan Utama', tipe: 'sensor',
    position: [-7.5895, 111.9135],
    kelembaban: 33.1, suhu: 32.8, ph: 5.8, ec: 1.05, npk: 71, airHumidity: 49, sistemHealth: 97,
    sinyal: 88, baterai: 22, solarCharge: 4.1, lastReport: '3 menit lalu',
    status: 'peringatan', error: 'Baterai rendah, perlu pengisian solar.',
  },
  {
    id: 'SU-03', nama: 'Sensor Utama 03', lahan: 'Lahan Utama', tipe: 'sensor',
    position: [-7.5895, 111.9165],
    kelembaban: 31.4, suhu: 33.1, ph: 5.9, ec: 1.00, npk: 72, airHumidity: 48, sistemHealth: 98,
    sinyal: 91, baterai: 91, solarCharge: 14.0, lastReport: '1 menit lalu',
    status: 'online', error: null,
  },
  {
    id: 'SU-04', nama: 'Sensor Utama 04', lahan: 'Lahan Utama', tipe: 'sensor',
    position: [-7.5915, 111.9145],
    kelembaban: 33.7, suhu: 32.9, ph: 5.8, ec: 1.00, npk: 69, airHumidity: 48, sistemHealth: 98,
    sinyal: 89, baterai: 84, solarCharge: 12.8, lastReport: '2 menit lalu',
    status: 'online', error: null,
  },

  // ─── Lahan Selatan (3 sensors — normal/optimal) ───
  {
    id: 'SS-01', nama: 'Sensor Selatan 01', lahan: 'Lahan Selatan', tipe: 'sensor',
    position: [-7.5940, 111.9100],
    kelembaban: 51.0, suhu: 26.8, ph: 6.4, ec: 1.62, npk: 81, airHumidity: 69, sistemHealth: 96,
    sinyal: 95, baterai: 90, solarCharge: 13.2, lastReport: '1 menit lalu',
    status: 'online', error: null,
  },
  {
    id: 'SS-02', nama: 'Sensor Selatan 02', lahan: 'Lahan Selatan', tipe: 'sensor',
    position: [-7.5955, 111.9120],
    kelembaban: 49.2, suhu: 27.3, ph: 6.5, ec: 1.58, npk: 83, airHumidity: 67, sistemHealth: 94,
    sinyal: 0, baterai: 0, solarCharge: 0, lastReport: '4 jam lalu',
    status: 'offline', error: 'Perangkat tidak melapor selama 4 jam. Cek konektivitas atau modul daya.',
  },
  {
    id: 'SS-03', nama: 'Sensor Selatan 03', lahan: 'Lahan Selatan', tipe: 'sensor',
    position: [-7.5965, 111.9128],
    kelembaban: 49.8, suhu: 26.9, ph: 6.6, ec: 1.60, npk: 82, airHumidity: 68, sistemHealth: 95,
    sinyal: 88, baterai: 95, solarCharge: 12.9, lastReport: '2 menit lalu',
    status: 'online', error: null,
  },

  // ─── Lahan Barat (3 sensors — fungal disease scenario) ───
  {
    id: 'SB-01', nama: 'Sensor Barat 01', lahan: 'Lahan Barat', tipe: 'sensor',
    position: [-7.5880, 111.9070],
    kelembaban: 72.8, suhu: 22.8, ph: 6.1, ec: 1.42, npk: 64, airHumidity: 89, sistemHealth: 88,
    sinyal: 82, baterai: 75, solarCharge: 7.4, lastReport: '2 menit lalu',
    status: 'online', error: null,
  },
  {
    id: 'SB-02', nama: 'Sensor Barat 02', lahan: 'Lahan Barat', tipe: 'sensor',
    position: [-7.5895, 111.9080],
    kelembaban: 71.4, suhu: 23.2, ph: 6.2, ec: 1.38, npk: 66, airHumidity: 87, sistemHealth: 86,
    sinyal: 78, baterai: 80, solarCharge: 8.1, lastReport: '5 menit lalu',
    status: 'online', error: null,
  },
  {
    id: 'SB-03', nama: 'Sensor Barat 03', lahan: 'Lahan Barat', tipe: 'sensor',
    position: [-7.5905, 111.9080],
    kelembaban: 71.8, suhu: 23.0, ph: 6.3, ec: 1.40, npk: 65, airHumidity: 88, sistemHealth: 87,
    sinyal: 85, baterai: 82, solarCharge: 7.8, lastReport: '3 menit lalu',
    status: 'online', error: null,
  },
]

export function getSensorsByLahan(lahanNama) {
  return sensors.filter(s => s.lahan === lahanNama)
}

// =================== ACTUATOR & INFRASTRUCTURE ===================
// Relay nodes drive irrigation valves. Weather station feeds RH/wind to AI.
// Edge gateway provides LTE/Wi-Fi backhaul; edge compute runs AI on-prem.
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
    id: 'GW-01', nama: 'Edge Gateway LTE', lahan: 'Sistem', tipe: 'gateway',
    sinyal: 99, baterai: 100, solarCharge: 0, lastReport: 'Baru saja',
    status: 'online', error: null,
  },
  {
    id: 'EC-01', nama: 'Edge Compute (AI Inference)', lahan: 'Sistem', tipe: 'compute',
    sinyal: 100, baterai: 100, solarCharge: 0, lastReport: 'Baru saja',
    status: 'online', error: null,
  },
]

// All devices unified — used by /perangkat
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
const lahanMeta = [
  {
    id: 'utama', nama: 'Lahan Utama', warna: '#EF4444', statusColor: 'merah',
    luasHa: 1.8,
    komoditas: 'Tomat & cabai',
    sistemIrigasi: 'Drip 4 L/jam',
  },
  {
    id: 'selatan', nama: 'Lahan Selatan', warna: '#22C55E', statusColor: 'hijau',
    luasHa: 1.4,
    komoditas: 'Kubis & sawi',
    sistemIrigasi: 'Sprinkler',
  },
  {
    id: 'barat', nama: 'Lahan Barat', warna: '#F59E0B', statusColor: 'oranye',
    luasHa: 0.9,
    komoditas: 'Kentang granola',
    sistemIrigasi: 'Drip 4 L/jam',
  },
]

function avg(list, key) {
  if (!list.length) return 0
  return Math.round((list.reduce((s, x) => s + x[key], 0) / list.length) * 10) / 10
}

// Lahan = static metadata + averaged sensor metrics + derived status
export const lahans = lahanMeta.map(meta => {
  const lahanSensors = sensors.filter(s => s.lahan === meta.nama)
  const kel = avg(lahanSensors, 'kelembaban')
  const suh = avg(lahanSensors, 'suhu')
  const ph = avg(lahanSensors, 'ph')
  const ec = avg(lahanSensors, 'ec')
  const npk = Math.round(avg(lahanSensors, 'npk'))
  const rh = Math.round(avg(lahanSensors, 'airHumidity'))
  const sh = Math.round(avg(lahanSensors, 'sistemHealth'))

  // Derived high-level status: critical → red, warning → amber, normal → green
  let status = 'normal'
  let keterangan = 'Semua parameter dalam batas normal.'
  if (kel < 30 || suh > 32) {
    status = 'perhatian'
    keterangan = `Kelembaban tanah ${kel}% rendah, suhu ${suh}°C tinggi. Risiko stres air dalam beberapa jam.`
  } else if (rh > 85 || kel > 70) {
    status = 'peringatan'
    keterangan = `Kelembaban udara ${rh}% pada suhu ${suh}°C berada di window patogen jamur.`
  } else if (ph < 5.5 || ph > 7.5) {
    status = 'peringatan'
    keterangan = `pH tanah ${ph} di luar rentang aman 5.5–7.5.`
  }

  return {
    ...meta,
    sensorCount: lahanSensors.length,
    sensorOnline: lahanSensors.filter(s => s.status === 'online').length,
    kelembaban: kel,
    suhu: suh,
    ph,
    ec,
    npk,
    airHumidity: rh,
    sistemHealth: sh,
    status,
    keterangan,
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

// =================== ALERTS — derived from current state + system events ===================
// We compute device-level + lahan-level alerts dynamically, then merge with
// a small set of historical/system events for richness.

function deviceAlerts() {
  const out = []
  let id = 100
  for (const d of getAllDevices()) {
    if (d.status === 'offline') {
      out.push({
        id: id++, tipe: 'critical',
        judul: `Perangkat tidak melapor: ${d.nama}`,
        pesan: d.error || 'Perangkat offline lebih dari 4 jam. Cek konektivitas atau modul daya.',
        lahan: d.lahan === 'Sistem' ? 'Sistem' : d.lahan,
        waktu: '4 jam lalu', sumberId: d.id, kategori: 'perangkat',
      })
    } else if (d.tipe === 'sensor' && d.baterai > 0 && d.baterai < 25) {
      out.push({
        id: id++, tipe: 'warning',
        judul: `Baterai rendah: ${d.nama}`,
        pesan: `Baterai ${d.baterai}% pada ${d.nama}. Solar charge ${d.solarCharge}W. Segera cek panel surya atau ganti baterai.`,
        lahan: d.lahan, waktu: '15 menit lalu', sumberId: d.id, kategori: 'perangkat',
      })
    } else if (d.tipe === 'sensor' && d.sinyal > 0 && d.sinyal < 50) {
      out.push({
        id: id++, tipe: 'warning',
        judul: `Sinyal lemah: ${d.nama}`,
        pesan: `Kekuatan sinyal ${d.sinyal}% di bawah ambang minimum 50%. Data mungkin tertunda.`,
        lahan: d.lahan, waktu: '1 jam lalu', sumberId: d.id, kategori: 'perangkat',
      })
    }
  }
  return out
}

function lahanAlerts() {
  const out = []
  let id = 200
  for (const l of lahans) {
    if (l.kelembaban < 30 && l.suhu > 32) {
      out.push({
        id: id++, tipe: 'critical',
        judul: `Stres air dini di ${l.nama}`,
        pesan: `Kelembaban tanah ${l.kelembaban}% turun di bawah refill point 35% sementara suhu ${l.suhu}°C dan kelembaban udara ${l.airHumidity}%. Tanaman akan mengalami stres dalam beberapa jam tanpa intervensi.`,
        lahan: l.nama, waktu: '20 menit lalu', sumberId: l.id, kategori: 'lahan',
      })
    }
    if (l.airHumidity > 85 && l.suhu >= 18 && l.suhu <= 28) {
      out.push({
        id: id++, tipe: 'warning',
        judul: `Risiko penyakit jamur di ${l.nama}`,
        pesan: `Kelembaban udara ${l.airHumidity}% pada suhu ${l.suhu}°C berada di window ideal patogen jamur (downy/late blight). Pertimbangkan fungisida preventif.`,
        lahan: l.nama, waktu: '40 menit lalu', sumberId: l.id, kategori: 'lahan',
      })
    }
    if (l.ph < 5.5 || l.ph > 7.5) {
      out.push({
        id: id++, tipe: 'warning',
        judul: `pH tanah ${l.ph < 5.5 ? 'asam' : 'basa'} di ${l.nama}`,
        pesan: `pH ${l.ph} di luar rentang aman 5.5–7.5. ${l.ph < 5.5 ? 'Disarankan pengapuran dolomit.' : 'Disarankan aplikasi belerang elemental.'}`,
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

export const alertsData = [...lahanAlerts(), ...deviceAlerts(), ...systemEvents]
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

  // Per-area baseline reflecting the scenarios above
  const bases = {
    'Semua Area': { kel: 51, suhu: 27.5 },
    'Area Utama': { kel: 32, suhu: 33 },
    'Area Selatan': { kel: 50, suhu: 27 },
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
