// =================== KAPORI DOMAIN LOGIC ===================
// Precision agriculture rule engine — derives risks, recommendations, and
// classifications from raw sensor readings. References (sources noted in
// project docs):
//   - FAO Irrigation & Drainage Paper 56 (ETc methodology, soil water deficit)
//   - METER Group: field capacity & wilting point thresholds
//   - UF/IFAS HS1207: pH ranges for vegetable crops
//   - NRCS Soil Quality Indicators: EC interpretation
//   - TNAU Agritech: NPK soil rating
//   - APS Phytopathology: foliar fungal infection models (RH × temp × leaf wetness)

// THRESHOLDS — keyed [optimal-min, optimal-max], [warning-min, warning-max].
// Anything outside warning bounds is critical.
export const THRESHOLDS = {
  kelembaban:   { optimal: [35, 60], warning: [25, 70], unit: '%',     label: 'Kelembaban tanah' },
  suhu:         { optimal: [22, 30], warning: [18, 32], unit: '°C',    label: 'Suhu' },
  ph:           { optimal: [6.0, 7.0], warning: [5.5, 7.5], unit: 'pH', label: 'pH tanah' },
  ec:           { optimal: [0.8, 1.8], warning: [0.4, 2.5], unit: 'dS/m', label: 'Konduktivitas (EC)' },
  npk:          { optimal: [60, 90], warning: [40, 95], unit: 'idx',   label: 'Indeks NPK' },
  airHumidity:  { optimal: [55, 75], warning: [40, 85], unit: '%',     label: 'Kelembaban udara' },
  sistemHealth: { optimal: [90, 100], warning: [75, 100], unit: '%',   label: 'Kesehatan sistem' },
}

export function classifyMetric(value, key) {
  const t = THRESHOLDS[key]
  if (!t) return 'unknown'
  if (value >= t.optimal[0] && value <= t.optimal[1]) return 'optimal'
  if (value >= t.warning[0] && value <= t.warning[1]) return 'warning'
  return 'critical'
}

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
// Drivers: low soil moisture, high temperature, low air humidity.
// Threshold context: most vegetable crops trigger stress at MAD 30–50% (UMN).
// Loam/clay soils: stress when volumetric < 30%; severe < 20%.
export function computeWaterStressRisk({ kelembaban, suhu, airHumidity }) {
  let risk = 0
  if (kelembaban < 35) risk += (35 - kelembaban) * 2.5
  if (suhu > 30) risk += (suhu - 30) * 6
  if (airHumidity != null && airHumidity < 50) risk += (50 - airHumidity) * 0.6
  return Math.round(clamp(risk, 0, 100))
}

// ───── Disease (fungal) risk (0–100) ─────
// Drivers: high air humidity (RH > 70%), moderate temp window (15–25°C ideal
// for many fungal infections), high soil moisture (canopy wetness proxy).
// Reference: APS generic foliar infection model.
export function computeDiseaseRisk({ airHumidity, suhu, kelembaban }) {
  let risk = 0
  if (airHumidity != null && airHumidity > 70) risk += (airHumidity - 70) * 2
  // Temperature window scoring
  if (suhu >= 15 && suhu <= 25) risk += 30
  else if (suhu > 25 && suhu <= 30) risk += 12
  // Wet soil → splash + canopy moisture
  if (kelembaban > 70) risk += (kelembaban - 70) * 0.8
  return Math.round(clamp(risk, 0, 100))
}

// ───── Fertilization need (0–100) ─────
// Low NPK index ⇒ need fertilizer. Low EC ⇒ low nutrient salts in solution.
// Reference: TNAU rating + NRCS EC interpretation.
export function computeFertilizationNeed({ npk, ec }) {
  let need = 0
  if (npk < 60) need += (60 - npk) * 1.6
  if (ec < 0.8) need += (0.8 - ec) * 35
  return Math.round(clamp(need, 0, 100))
}

// ───── Irrigation need (0–100, treated as % MAD depleted) ─────
// Vegetable crop refill point is ≈ 35% volumetric for loam/clay (FAO 56).
export function computeIrrigationNeed({ kelembaban }) {
  if (kelembaban >= 35) return 0
  if (kelembaban >= 30) return 35
  if (kelembaban >= 25) return 65
  if (kelembaban >= 20) return 85
  return 100
}

// ───── Time to water-stress impact (rough estimate, hours) ─────
// At higher temp + lower moisture, depletion accelerates.
export function estimateTimeToWaterStress({ kelembaban, suhu }) {
  if (kelembaban < 20) return '< 1 jam'
  const buffer = Math.max(0, kelembaban - 25)  // %-points before critical
  const depletionRate = Math.max(0.5, (suhu - 20) * 0.4) // %/h
  const hours = buffer / depletionRate
  if (hours < 1) return '< 1 jam'
  if (hours < 2) return '~1 jam'
  if (hours < 6) return `${Math.round(hours)} jam`
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

    // 1) IRRIGATION — when soil moisture below refill point
    if (irrigationNeed >= 35) {
      // Crude water requirement: refill 1 m soil column from current to 45%.
      // ΔVWC × root depth × 10 → mm water (which equals L/m²).
      const targetVWC = 45
      const deltaVWC = Math.max(0, targetVWC - l.kelembaban)
      const rootDepthMM = 300 // assume 30 cm root zone for vegetables
      const liters_per_m2 = Math.round((deltaVWC / 100) * rootDepthMM)
      recs.push({
        id: id++,
        type: 'irrigation',
        lahan: l.nama,
        judul: 'Jadwalkan irigasi presisi',
        aksi: `Irigasi ${liters_per_m2} L/m² selama 30–45 menit (drip 4 L/jam)`,
        dampak: `Pulihkan kelembaban dari ${l.kelembaban}% ke ~${targetVWC}%`,
        match: 80 + Math.round(irrigationNeed * 0.18),
        reason: `Kelembaban ${l.kelembaban}% di bawah refill point 35% (FAO 56 MAD).`,
        urgency: irrigationNeed > 80 ? 'high' : irrigationNeed > 50 ? 'medium' : 'low',
      })
    }

    // 2) FERTIGATION — low NPK / low EC
    if (fertNeed >= 30) {
      const npkBoost = Math.round((75 - l.npk) * 1.2)
      const dose = npkBoost > 30 ? '40 kg/ha NPK 16-16-16' : '25 kg/ha NPK 16-16-16'
      recs.push({
        id: id++,
        type: 'fertilizer',
        lahan: l.nama,
        judul: 'Aplikasi pupuk NPK presisi',
        aksi: `${dose} via fertigasi (3 hari berturut)`,
        dampak: `Naikkan indeks NPK ke ~75 (dari ${l.npk})`,
        match: 75 + Math.round(fertNeed * 0.2),
        reason: `Indeks NPK ${l.npk} (target 60–90), EC ${l.ec} dS/m menandakan rendahnya nutrisi terlarut.`,
        urgency: fertNeed > 60 ? 'medium' : 'low',
      })
    }

    // 3) pH CORRECTION
    if (l.ph < 5.5) {
      const limeAmount = Math.round((6.2 - l.ph) * 1500) // kg/ha dolomit, rough
      recs.push({
        id: id++,
        type: 'liming',
        lahan: l.nama,
        judul: 'Aplikasi kapur dolomit',
        aksi: `${limeAmount} kg/ha kapur dolomit, taburkan merata`,
        dampak: `Naikkan pH dari ${l.ph} ke target 6.0–6.5`,
        match: 88,
        reason: `pH ${l.ph} di bawah ambang 5.5 — risiko keracunan Al/Mn dan kunci hara.`,
        urgency: 'medium',
      })
    } else if (l.ph > 7.5) {
      recs.push({
        id: id++,
        type: 'acidify',
        lahan: l.nama,
        judul: 'Aplikasi belerang elemental',
        aksi: `200 kg/ha S elemental + bahan organik`,
        dampak: `Turunkan pH dari ${l.ph} ke target 6.5–7.0`,
        match: 78,
        reason: `pH ${l.ph} terlalu basa — mengikat besi & mangan, menghambat penyerapan.`,
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
        reason: `RH ${l.airHumidity}% + suhu ${l.suhu}°C berada di window ideal patogen jamur.`,
        urgency: diseaseRisk > 70 ? 'high' : 'medium',
      })
    }

    // 5) WATER STRESS MITIGATION (separate from straight irrigation)
    if (waterStress >= 60 && irrigationNeed < 35) {
      // High temp + dry air situation but moisture still OK — preventive mulsa
      recs.push({
        id: id++,
        type: 'mulching',
        lahan: l.nama,
        judul: 'Aplikasi mulsa organik',
        aksi: 'Mulsa jerami / serbuk gergaji 5 cm di sekitar tanaman',
        dampak: 'Kurangi evaporasi tanah hingga 60%, stabilkan suhu zona akar',
        match: 80,
        reason: `Risiko stres air ${waterStress}% (suhu ${l.suhu}°C, RH ${l.airHumidity}%).`,
        urgency: 'medium',
      })
    }
  }

  // Sort by urgency desc, then by match score desc
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
        detail: `Kombinasi kelembaban tanah ${l.kelembaban}% (target ≥35%) dengan suhu ${l.suhu}°C dan kelembaban udara ${l.airHumidity}% mendorong defisit air pada zona akar. Tanpa intervensi, stomata akan menutup, fotosintesis menurun, dan dalam waktu beberapa jam berikutnya tanaman akan mengalami wilting yang signifikan.`,
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
        detail: `Kelembaban udara ${l.airHumidity}% pada suhu ${l.suhu}°C berada dalam jendela ideal patogen jamur (downy mildew, late blight, powdery mildew). Kelembaban tanah ${l.kelembaban}% meningkatkan probabilitas kanopi basah dan splash dispersal. Pengendalian preventif jauh lebih efektif daripada kuratif.`,
      })
    }

    if (l.ph < 5.5 || l.ph > 7.5) {
      const tooAcid = l.ph < 5.5
      risks.push({
        id: id++,
        type: 'ph_extreme',
        tipe: 'warning',
        nama: tooAcid ? 'pH tanah terlalu asam' : 'pH tanah terlalu basa',
        lahan: l.nama,
        score: Math.round(Math.abs(l.ph - 6.5) * 30),
        waktuDampak: '3–7 hari (akumulatif)',
        pencegahan: tooAcid ? 'Pengapuran dolomit' : 'Belerang + bahan organik',
        detail: tooAcid
          ? `pH ${l.ph} di bawah ambang aman 5.5. Pada kondisi ini Al³⁺ dan Mn²⁺ menjadi toksik bagi akar, P terikat menjadi tidak tersedia, dan aktivitas mikroba simbiosis menurun.`
          : `pH ${l.ph} di atas ambang 7.5. Fe, Mn, Zn, dan B menjadi tidak tersedia untuk akar; gejala klorosis daun muda akan muncul.`,
      })
    }
  }

  // Sort by criticality then score
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
