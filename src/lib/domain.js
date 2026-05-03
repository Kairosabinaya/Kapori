// =================== KAPORI DOMAIN LOGIC ===================
// Precision agriculture rule engine - derives risks, recommendations, and
// classifications from raw sensor readings. Ambang sensor (optimal & critical)
// di-import dari `sensor-thresholds.js` (single source of truth) supaya AI
// engine, klasifikasi, dan visualisasi konsisten.
//
// Sensor parameters (per KAPORI hardware spec sheet):
//   - kelembaban (soil volumetric water content, %)
//   - suhu (soil temperature, °C)
//   - airHumidity (canopy / ambient relative humidity, %)
//   - ph (soil pH, 0–14)
//   - ec (electrical conductivity, dS/m - proxy for nutrient salts in solution)
//   - npk (NPK availability composite index, 0–100)
//
// References:
//   - FAO Irrigation & Drainage Paper 56 (Allen et al., 1998) - ETc, MAD, refill point
//   - UF/IFAS HS1207 (2022): soil pH ranges for commercial vegetable production
//   - NRCS Soil Quality Indicators: EC interpretation
//   - TNAU Agritech soil rating chart: NPK availability classes
//   - APS Phytopathology generic foliar infection model (Magarey et al., 2005)

import { SENSOR_THRESHOLDS, classifyMetric } from './sensor-thresholds'

// Re-export classifyMetric agar konsumen lama tidak perlu pindah import.
export { classifyMetric, SENSOR_THRESHOLDS }

const T = SENSOR_THRESHOLDS  // shorthand internal

export function classificationColor(status) {
  return {
    optimal:  { text: 'text-green-700', bg: 'bg-green-50',  dot: 'bg-green-500',  border: 'border-green-300' },
    warning:  { text: 'text-amber-700', bg: 'bg-amber-50',  dot: 'bg-amber-500',  border: 'border-amber-300' },
    critical: { text: 'text-red-700',   bg: 'bg-red-50',    dot: 'bg-red-500',    border: 'border-red-300' },
    unknown:  { text: 'text-gray-700',  bg: 'bg-gray-50',   dot: 'bg-gray-400',   border: 'border-gray-300' },
  }[status] || { text: 'text-gray-700', bg: 'bg-gray-50', dot: 'bg-gray-400', border: 'border-gray-300' }
}

const clamp = (n, min, max) => Math.max(min, Math.min(max, n))

// ───── Water stress risk (0–100) ─────
// Driver: kelembaban tanah di bawah optimalMin (FAO 56 refill point); suhu
// di atas optimalMax mempercepat ETc.
export function computeWaterStressRisk({ kelembaban, suhu }) {
  let risk = 0
  if (kelembaban < T.kelembaban.optimalMin) {
    risk += (T.kelembaban.optimalMin - kelembaban) * 1.6
  }
  if (suhu > T.suhu.optimalMax) {
    risk += (suhu - T.suhu.optimalMax) * 6
  }
  return Math.round(clamp(risk, 0, 100))
}

// ───── Disease (fungal) risk (0–100) ─────
// Driver utama di iklim tropis: kelembaban udara tinggi (canopy wetness) +
// suhu di window pathogen (~18–25°C). Reference: APS generic foliar
// infection model.
export function computeDiseaseRisk({ kelembaban, airHumidity, suhu }) {
  let risk = 0
  if (airHumidity != null && airHumidity > T.airHumidity.optimalMax) {
    risk += (airHumidity - T.airHumidity.optimalMax) * 3
  }
  if (kelembaban != null && kelembaban > T.kelembaban.optimalMax) {
    risk += (kelembaban - T.kelembaban.optimalMax) * 1.8
  }
  if (suhu != null) {
    if (suhu >= 18 && suhu <= 25)      risk += 35  // pathogen window
    else if (suhu > 25 && suhu <= 28)  risk += 18
  }
  return Math.round(clamp(risk, 0, 100))
}

// ───── Fertilization need (0–100) ─────
// Indeks NPK di bawah optimalMin (monotonic) ⇒ butuh pupuk. EC di bawah
// optimalMin ⇒ nutrisi terlarut rendah. Reference: TNAU rating + NRCS EC.
export function computeFertilizationNeed({ npk, ec }) {
  let need = 0
  if (npk != null && npk < T.npk.optimalMin) {
    need += (T.npk.optimalMin - npk) * 1.6
  }
  if (ec != null && ec < T.ec.optimalMin) {
    need += (T.ec.optimalMin - ec) * 18
  }
  return Math.round(clamp(need, 0, 100))
}

// ───── Irrigation need (0–100, treated as % MAD depleted) ─────
// Refill point dipatok ke optimalMin (60%). Critical low (<criticalMin = 30%)
// = wilting imminent → 100% need.
export function computeIrrigationNeed({ kelembaban }) {
  if (kelembaban == null) return 0
  const t = T.kelembaban
  if (kelembaban >= t.optimalMin) return 0          // ≥60% - tidak perlu
  if (kelembaban >= t.optimalMin - 10) return 30    // 50–60% - sedikit
  if (kelembaban >= t.criticalMin + 10) return 55   // 40–50% - sedang
  if (kelembaban >= t.criticalMin) return 80        // 30–40% - tinggi
  return 100                                        // <30% - kritis
}

// ───── Time-to-impact estimator (water stress, hours) ─────
export function estimateTimeToWaterStress({ kelembaban, suhu }) {
  const t = T.kelembaban
  if (kelembaban == null) return '-'
  if (kelembaban < t.criticalMin - 10) return '< 1 jam'
  const buffer = Math.max(0, kelembaban - t.criticalMin)
  const depletionRate = Math.max(0.5, ((suhu ?? 25) - 20) * 0.4)
  const hours = buffer / depletionRate
  if (hours < 1) return '< 1 jam'
  if (hours < 2) return '~1 jam'
  if (hours < 24) return `${Math.round(hours)} jam`
  return `${Math.round(hours / 24)} hari`
}

// ───── Recommendation generator ─────
// Produces precise, actionable, dose-quantified recommendations from a lahan
// (already aggregated metrics across its sensors).
export function generateRecommendations(lahanList) {
  const recs = []
  let id = 1

  for (const l of lahanList) {
    const irrigationNeed = computeIrrigationNeed(l)
    const fertNeed = computeFertilizationNeed(l)
    const waterStress = computeWaterStressRisk(l)
    const diseaseRisk = computeDiseaseRisk(l)

    // 1) IRRIGATION - when soil moisture below refill point
    if (irrigationNeed >= 30) {
      const targetVWC = T.kelembaban.optimalMin + 10  // tengah-tengah optimal
      const deltaVWC = Math.max(0, targetVWC - l.kelembaban)
      const rootDepthMM = 300
      const liters_per_m2 = Math.round((deltaVWC / 100) * rootDepthMM)
      recs.push({
        id: id++,
        type: 'irrigation',
        lahan: l.nama,
        judul: 'Jadwalkan irigasi presisi',
        aksi: `Irigasi ${liters_per_m2} L/m² selama 30–45 menit (drip 4 L/jam)`,
        dampak: `Pulihkan kelembaban dari ${l.kelembaban}% ke ~${targetVWC}%`,
        match: 80 + Math.round(irrigationNeed * 0.18),
        reason: `Kelembaban ${l.kelembaban}% di bawah refill point ${T.kelembaban.optimalMin}% (FAO 56 MAD).`,
        urgency: irrigationNeed >= 80 ? 'high' : irrigationNeed >= 50 ? 'medium' : 'low',
      })
    }

    // 2) FERTIGATION - low NPK / low EC
    if (fertNeed >= 30) {
      const dose = fertNeed > 60 ? '40 kg/ha NPK 16-16-16' : '25 kg/ha NPK 16-16-16'
      recs.push({
        id: id++,
        type: 'fertilizer',
        lahan: l.nama,
        judul: 'Aplikasi pupuk NPK presisi',
        aksi: `${dose} via fertigasi (3 hari berturut)`,
        dampak: `Naikkan indeks NPK ke ≥${T.npk.optimalMin} (dari ${l.npk})`,
        match: 75 + Math.round(fertNeed * 0.2),
        reason: `Indeks NPK ${l.npk} di bawah target ${T.npk.optimalMin}; EC ${l.ec} dS/m menandakan rendahnya nutrisi terlarut.`,
        urgency: fertNeed > 60 ? 'medium' : 'low',
      })
    }

    // 3) pH CORRECTION
    if (l.ph < T.ph.criticalMin) {
      const limeAmount = Math.round((T.ph.optimalMin - l.ph) * 1500)
      recs.push({
        id: id++,
        type: 'liming',
        lahan: l.nama,
        judul: 'Aplikasi kapur dolomit',
        aksi: `${limeAmount} kg/ha kapur dolomit, taburkan merata`,
        dampak: `Naikkan pH dari ${l.ph} ke target ${T.ph.optimalMin}–${T.ph.optimalMax}`,
        match: 88,
        reason: `pH ${l.ph} di bawah ambang aman ${T.ph.criticalMin}. Risiko keracunan Al/Mn dan kunci hara.`,
        urgency: 'medium',
      })
    } else if (l.ph > T.ph.criticalMax) {
      recs.push({
        id: id++,
        type: 'acidify',
        lahan: l.nama,
        judul: 'Aplikasi belerang elemental',
        aksi: `200 kg/ha S elemental + bahan organik`,
        dampak: `Turunkan pH dari ${l.ph} ke target ${T.ph.optimalMin}–${T.ph.optimalMax}`,
        match: 78,
        reason: `pH ${l.ph} di atas ambang ${T.ph.criticalMax}. Mengikat Fe/Mn dan menghambat penyerapan.`,
        urgency: 'low',
      })
    }

    // 4) DISEASE PREVENTION
    if (diseaseRisk >= 50) {
      recs.push({
        id: id++,
        type: 'disease_prevent',
        lahan: l.nama,
        judul: 'Semprotan fungisida preventif',
        aksi: 'Mancozeb 80% WP, 2 g/L, semprot pagi sebelum embun',
        dampak: `Turunkan risiko infeksi jamur ${diseaseRisk}% → <20%`,
        match: 70 + Math.round(diseaseRisk * 0.2),
        reason: `Kelembaban udara ${l.airHumidity}% pada suhu ${l.suhu}°C berada dalam window patogen jamur.`,
        urgency: diseaseRisk > 70 ? 'high' : 'medium',
      })
    }

    // 5) WATER STRESS MITIGATION - preventive (mulsa) when moisture still OK
    if (waterStress >= 60 && irrigationNeed < 30) {
      recs.push({
        id: id++,
        type: 'mulching',
        lahan: l.nama,
        judul: 'Aplikasi mulsa organik',
        aksi: 'Mulsa jerami / serbuk gergaji 5 cm di sekitar tanaman',
        dampak: 'Kurangi evaporasi tanah hingga 60%, stabilkan suhu zona akar',
        match: 80,
        reason: `Risiko stres air ${waterStress}% akibat suhu ${l.suhu}°C tinggi.`,
        urgency: 'medium',
      })
    }
  }

  const urgencyRank = { high: 3, medium: 2, low: 1 }
  recs.sort((a, b) => (urgencyRank[b.urgency] - urgencyRank[a.urgency]) || (b.match - a.match))
  return recs
}

// ───── Risk generator ─────
export function generateRisks(lahanList) {
  const risks = []
  let id = 1

  for (const l of lahanList) {
    const waterStress = computeWaterStressRisk(l)
    const diseaseRisk = computeDiseaseRisk(l)

    if (waterStress >= 50) {
      risks.push({
        id: id++,
        type: 'water_stress',
        tipe: waterStress >= 70 ? 'critical' : 'warning',
        nama: 'Risiko stres air',
        lahan: l.nama,
        score: waterStress,
        waktuDampak: estimateTimeToWaterStress(l),
        pencegahan: waterStress >= 70 ? 'Irigasi segera + mulsa' : 'Irigasi bertahap + monitor',
        detail: `Kombinasi kelembaban tanah ${l.kelembaban}% (target ${T.kelembaban.optimalMin}–${T.kelembaban.optimalMax}%, FAO 56 refill point) dengan suhu ${l.suhu}°C mendorong defisit air pada zona akar. Tanpa intervensi, stomata akan menutup, fotosintesis menurun, dan dalam beberapa jam berikutnya tanaman akan mengalami wilting yang signifikan dan kehilangan hasil panen permanen.`,
      })
    }

    if (diseaseRisk >= 50) {
      risks.push({
        id: id++,
        type: 'disease',
        tipe: diseaseRisk >= 70 ? 'critical' : 'warning',
        nama: 'Risiko penyakit jamur',
        lahan: l.nama,
        score: diseaseRisk,
        waktuDampak: '24–72 jam',
        pencegahan: 'Fungisida preventif + ventilasi kanopi',
        detail: `Kelembaban udara ${l.airHumidity}% (di atas optimal ${T.airHumidity.optimalMax}%) pada suhu ${l.suhu}°C berada dalam window ideal patogen jamur (downy mildew, late blight, powdery mildew). Pengendalian preventif jauh lebih efektif daripada kuratif. Referensi: APS generic foliar infection model.`,
      })
    }

    if (l.ph < T.ph.criticalMin || l.ph > T.ph.criticalMax) {
      const tooAcid = l.ph < T.ph.criticalMin
      const phMid = (T.ph.optimalMin + T.ph.optimalMax) / 2
      risks.push({
        id: id++,
        type: 'ph_extreme',
        tipe: 'warning',
        nama: tooAcid ? 'pH tanah terlalu asam' : 'pH tanah terlalu basa',
        lahan: l.nama,
        score: Math.round(Math.abs(l.ph - phMid) * 30),
        waktuDampak: '3–7 hari (akumulatif)',
        pencegahan: tooAcid ? 'Pengapuran dolomit' : 'Belerang + bahan organik',
        detail: tooAcid
          ? `pH ${l.ph} di bawah ambang aman ${T.ph.criticalMin}. Al³⁺ dan Mn²⁺ menjadi toksik bagi akar, P terikat menjadi tidak tersedia, dan aktivitas mikroba simbiosis menurun.`
          : `pH ${l.ph} di atas ambang ${T.ph.criticalMax}. Fe, Mn, Zn, dan B menjadi tidak tersedia untuk akar; gejala klorosis daun muda akan muncul.`,
      })
    }

    if (l.npk != null && l.npk < T.npk.criticalMin) {
      risks.push({
        id: id++,
        type: 'nutrient_deficiency',
        tipe: 'warning',
        nama: 'Defisiensi NPK',
        lahan: l.nama,
        score: Math.round((T.npk.criticalMin - l.npk) * 2),
        waktuDampak: '5–10 hari (akumulatif)',
        pencegahan: 'Fertigasi NPK presisi',
        detail: `Indeks NPK ${l.npk} di bawah ambang ${T.npk.criticalMin}. Konduktivitas EC ${l.ec} dS/m mengonfirmasi rendahnya nutrisi terlarut. Defisiensi nitrogen akan menampakkan klorosis daun tua dalam 5–10 hari.`,
      })
    }
  }

  risks.sort((a, b) => {
    if (a.tipe !== b.tipe) return a.tipe === 'critical' ? -1 : 1
    return b.score - a.score
  })
  return risks
}

// ───── Top-priority insight (for Overview AI Insight card) ─────
export function topInsight(lahanList) {
  const allRisks = generateRisks(lahanList)
  if (allRisks.length === 0) return null
  const top = allRisks[0]
  const recsForLahan = generateRecommendations(lahanList).filter(r => r.lahan === top.lahan)
  const topRec = recsForLahan[0] || null
  return {
    risk: top,
    recommendation: topRec,
  }
}

// ───── Performance KPIs (advertised vs realised) ─────
// Grounded in industry benchmarks cited in pitch:
//   - Fasal India + ScienceDirect 2025 systematic review: 25–35% irrigation
//     water savings using IoT-driven precision agriculture.
//   - Nitrogen-use efficiency studies: 15–25% reduction in N fertilizer when
//     fertigation is sensor-driven (target ≥20%).
//   - Sensor-based prediction models: ≥85% accuracy for water stress and
//     foliar disease early detection (target 90%).
export const KPI_BENCHMARKS = {
  waterSaving:  { value: 28, unit: '%', label: 'Penghematan air irigasi', range: '25–35%' },
  nitrogenSave: { value: 22, unit: '%', label: 'Pengurangan pupuk nitrogen', range: '20%' },
  aiAccuracy:   { value: 91, unit: '%', label: 'Akurasi prediksi AI', range: '90%' },
}
