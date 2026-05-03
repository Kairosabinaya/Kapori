// =================== SENSOR THRESHOLDS - SINGLE SOURCE OF TRUTH ===================
// Setiap halaman / komponen yang menampilkan atau mengklasifikasikan
// pembacaan sensor WAJIB mengambil ambang dari sini, tidak mengulang angka di
// tempat lain. Mengubah ambang di file ini memengaruhi viz, AI engine
// (classifyMetric, compute*), dan rollup status lahan secara konsisten.
//
// Setiap entri:
//   - label, unit               → untuk tampilan
//   - min, max                  → skala visual (track horizontal)
//   - optimalMin, optimalMax    → zona ideal (di-highlight di track)
//   - criticalMin, criticalMax  → di luar ini = bahaya (untuk metrik bell-curve)
//   - monotonic?                → 'higher-better' | 'lower-better'
//                                  → ProgressBar biasa, threshold pakai optimalMin
//                                    (higher-better) atau optimalMax (lower-better)
//
// Default range = "tanaman umum hortikultura tropis". Untuk crop spesifik
// (mis. bawang merah pH lebih sempit 5.6-6.5) bisa dibuat override per crop di
// masa depan.
//
// Acuan:
//   - Kelembaban tanah     : FAO Irrigation & Drainage Paper 56
//   - Suhu                 : crop physiology umum hortikultura
//   - Kelembaban udara     : standar greenhouse / canopy management
//   - pH tanah             : USDA NRCS soil quality
//   - EC                   : NRCS EC interpretation + hydroponic standards
//   - NPK index            : TNAU Agritech rating chart (higher = lebih baik)
//   - Kesehatan sistem     : SLA telemetri (higher = lebih baik)

export const SENSOR_THRESHOLDS = {
  kelembaban: {
    label: 'Kelembaban tanah',
    unit: '%',
    min: 0, max: 100,
    optimalMin: 60, optimalMax: 80,
    criticalMin: 30, criticalMax: 90,
  },
  suhu: {
    label: 'Suhu',
    unit: '°C',
    min: 0, max: 50,
    optimalMin: 20, optimalMax: 30,
    criticalMin: 15, criticalMax: 35,
  },
  airHumidity: {
    label: 'Kelembaban udara',
    unit: '%',
    min: 0, max: 100,
    optimalMin: 60, optimalMax: 80,
    criticalMin: 40, criticalMax: 90,
  },
  ph: {
    label: 'pH Tanah',
    unit: 'pH',
    min: 0, max: 14,
    optimalMin: 6.0, optimalMax: 7.0,
    criticalMin: 5.0, criticalMax: 8.0,
  },
  ec: {
    label: 'Konduktivitas (EC)',
    unit: 'dS/m',
    min: 0, max: 5,
    optimalMin: 1.5, optimalMax: 2.5,
    criticalMin: 0.5, criticalMax: 4.0,
  },
  npk: {
    label: 'Indeks NPK',
    unit: 'idx',
    min: 0, max: 100,
    optimalMin: 70, optimalMax: 100,
    criticalMin: 40, criticalMax: 100,
    monotonic: 'higher-better',
  },
  sistemHealth: {
    label: 'Kesehatan sistem',
    unit: '%',
    min: 0, max: 100,
    optimalMin: 90, optimalMax: 100,
    criticalMin: 70, criticalMax: 100,
    monotonic: 'higher-better',
  },
}

// Klasifikasi nilai sebuah metrik → 'optimal' | 'warning' | 'critical' | 'unknown'.
// Bell-curve: critical jika di luar criticalMin/criticalMax; warning jika di
// luar optimalMin/optimalMax; selain itu optimal.
// Monotonic 'higher-better': critical jika < criticalMin; warning jika
// < optimalMin; selain itu optimal.
// Monotonic 'lower-better': simetris - critical jika > criticalMax; warning
// jika > optimalMax.
export function classifyMetric(value, key) {
  const t = SENSOR_THRESHOLDS[key]
  if (!t || value == null || Number.isNaN(value)) return 'unknown'

  if (t.monotonic === 'higher-better') {
    if (value < t.criticalMin) return 'critical'
    if (value < t.optimalMin)  return 'warning'
    return 'optimal'
  }
  if (t.monotonic === 'lower-better') {
    if (value > t.criticalMax) return 'critical'
    if (value > t.optimalMax)  return 'warning'
    return 'optimal'
  }
  if (value < t.criticalMin || value > t.criticalMax) return 'critical'
  if (value < t.optimalMin  || value > t.optimalMax)  return 'warning'
  return 'optimal'
}
