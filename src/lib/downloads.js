import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  sensors as allSensors, lahans, getAllDevices, alertsData, decisionHistory
} from '../data'
import {
  generateRecommendations, generateRisks,
  computeWaterStressRisk, computeDiseaseRisk,
  computeIrrigationNeed, computeFertilizationNeed
} from './domain'

// ─── Generic file save helpers ───
function saveFile(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 200)
}

function todayStamp() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`
}

function nowID() {
  return new Date().toLocaleString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ─── CSV ───
function csvEscape(v) {
  if (v == null) return ''
  const s = String(v)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function rowsToCSV(headers, rows) {
  const out = [headers.map(csvEscape).join(',')]
  for (const r of rows) {
    out.push(r.map(csvEscape).join(','))
  }
  return '﻿' + out.join('\n') // BOM for Excel UTF-8
}

export function downloadCSV(filename, headers, rows) {
  const csv = rowsToCSV(headers, rows)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  saveFile(blob, filename)
}

// ─── Excel (SpreadsheetML 2003 XML — opens natively in Excel without lib) ───
function xmlEscape(v) {
  if (v == null) return ''
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function xmlCell(v) {
  if (typeof v === 'number') {
    return `<Cell><Data ss:Type="Number">${v}</Data></Cell>`
  }
  return `<Cell><Data ss:Type="String">${xmlEscape(v)}</Data></Cell>`
}

function buildSheet(name, headers, rows) {
  const headerRow = `<Row>${headers.map(h => `<Cell ss:StyleID="hdr"><Data ss:Type="String">${xmlEscape(h)}</Data></Cell>`).join('')}</Row>`
  const bodyRows = rows.map(r => `<Row>${r.map(xmlCell).join('')}</Row>`).join('')
  return `<Worksheet ss:Name="${xmlEscape(name).slice(0, 31)}"><Table>${headerRow}${bodyRows}</Table></Worksheet>`
}

export function downloadExcel(filename, sheets) {
  const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Styles>
  <Style ss:ID="hdr">
    <Font ss:Bold="1" ss:Color="#FFFFFF"/>
    <Interior ss:Color="#2D6A4F" ss:Pattern="Solid"/>
  </Style>
</Styles>
${sheets.map(s => buildSheet(s.name, s.headers, s.rows)).join('\n')}
</Workbook>`
  const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8' })
  saveFile(blob, filename)
}

// ─── PDF ───
const KAPORI_GREEN = [45, 106, 79]
const KAPORI_GREEN_LIGHT = [220, 237, 228]

function pdfHeader(doc, title, subtitle) {
  doc.setFillColor(...KAPORI_GREEN)
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('KAPORI', 14, 14)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text('Kecerdasan Artifisial untuk Pertanian Organik Indonesia', 14, 21)
  doc.setFontSize(9)
  doc.text(`Dicetak: ${nowID()}`, doc.internal.pageSize.getWidth() - 14, 14, { align: 'right' })
  doc.setTextColor(31, 41, 55)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(title, 14, 40)
  if (subtitle) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(107, 114, 128)
    doc.text(subtitle, 14, 47)
  }
}

function pdfFooter(doc) {
  const total = doc.internal.getNumberOfPages()
  for (let i = 1; i <= total; i++) {
    doc.setPage(i)
    const w = doc.internal.pageSize.getWidth()
    const h = doc.internal.pageSize.getHeight()
    doc.setFontSize(8)
    doc.setTextColor(156, 163, 175)
    doc.text(`Halaman ${i} dari ${total}`, w / 2, h - 8, { align: 'center' })
    doc.text('KAPORI Dashboard · prototype', 14, h - 8)
    doc.text('kapori.app', w - 14, h - 8, { align: 'right' })
  }
}

function pdfSectionTitle(doc, text, y) {
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(45, 106, 79)
  doc.text(text, 14, y)
  doc.setDrawColor(45, 106, 79)
  doc.setLineWidth(0.5)
  doc.line(14, y + 1.5, 50, y + 1.5)
  return y + 8
}

// ─── Specific download helpers ───

export function downloadLahanCSV(lahan, lahanSensors) {
  const headers = [
    'Sensor ID', 'Nama', 'Kelembaban Tanah (%)', 'Suhu (°C)',
    'Kelembaban Udara (%)', 'pH', 'EC (dS/m)', 'NPK (idx)',
    'Kesehatan (%)', 'Sinyal (%)', 'Baterai (%)', 'Status', 'Terakhir Lapor',
  ]
  const rows = lahanSensors.map(s => [
    s.id, s.nama, s.kelembaban, s.suhu, s.airHumidity,
    s.ph, s.ec, s.npk, s.sistemHealth, s.sinyal, s.baterai,
    s.status, s.lastReport,
  ])
  // Add aggregate row
  rows.push([
    'AVG', `Rata-rata ${lahan.nama}`,
    lahan.kelembaban, lahan.suhu, lahan.airHumidity,
    lahan.ph, lahan.ec, lahan.npk, lahan.sistemHealth,
    '—', '—', lahan.status, '—',
  ])
  downloadCSV(`kapori-${lahan.id}-${todayStamp()}.csv`, headers, rows)
}

export function downloadDeviceDiagnosticCSV(device, signalHistory) {
  const headers = ['Field', 'Nilai']
  const rows = [
    ['ID', device.id],
    ['Nama', device.nama],
    ['Tipe', device.tipe],
    ['Lahan', device.lahan],
    ['Status', device.status],
    ['Sinyal (%)', device.sinyal],
    ['Baterai (%)', device.baterai],
    ['Solar charge (W)', device.solarCharge ?? '—'],
    ['Terakhir lapor', device.lastReport],
    ['Error', device.error || '—'],
  ]
  if (device.tipe === 'sensor') {
    rows.push([])
    rows.push(['── Pembacaan sensor ──', ''])
    rows.push(['Kelembaban tanah (%)', device.kelembaban])
    rows.push(['Suhu (°C)', device.suhu])
    rows.push(['Kelembaban udara (%)', device.airHumidity])
    rows.push(['pH tanah', device.ph])
    rows.push(['EC (dS/m)', device.ec])
    rows.push(['Indeks NPK', device.npk])
    rows.push(['Kesehatan sistem (%)', device.sistemHealth])
  }
  rows.push([])
  rows.push(['── Riwayat sinyal 7 hari ──', ''])
  signalHistory.forEach(p => rows.push([p.hari, `${p.sinyal}%`]))
  downloadCSV(`kapori-diag-${device.id}-${todayStamp()}.csv`, headers, rows)
}

// ─── Laporan generation ───
// Builds content based on report type + lahan filter + period, returns either
// PDF, CSV, or Excel file as a download.
function buildReportData(reportType, lahanFilter, periode) {
  const lahanList = lahanFilter === 'Semua Lahan'
    ? lahans
    : lahans.filter(l => l.nama === lahanFilter)

  const sensorList = lahanFilter === 'Semua Lahan'
    ? allSensors
    : allSensors.filter(s => s.lahan === lahanFilter)

  switch (reportType) {
    case 'Performa Bulanan':
      return performaBulananData(lahanList, sensorList, periode)
    case 'Metrik Tanah':
      return metrikTanahData(lahanList, sensorList, periode)
    case 'Log Irigasi':
      return logIrigasiData(lahanList, periode)
    case 'Ringkasan Harian':
    default:
      return ringkasanHarianData(lahanList, sensorList, periode)
  }
}

function performaBulananData(lahanList, sensorList, periode) {
  const summary = lahanList.map(l => ({
    nama: l.nama,
    luas: l.luasHa,
    komoditas: l.komoditas,
    sensorAktif: l.sensorOnline + '/' + l.sensorCount,
    kelembabanRataRata: `${l.kelembaban}%`,
    suhuRataRata: `${l.suhu}°C`,
    rhUdara: `${l.airHumidity}%`,
    ph: l.ph,
    ec: `${l.ec} dS/m`,
    npk: l.npk,
    status: l.status,
    waterStressRisk: `${computeWaterStressRisk(l)}%`,
    diseaseRisk: `${computeDiseaseRisk(l)}%`,
    irrigationNeed: `${computeIrrigationNeed(l)}%`,
    fertNeed: `${computeFertilizationNeed(l)}%`,
  }))
  return {
    title: 'Performa Area Bulanan',
    subtitle: `${lahanList.map(l => l.nama).join(', ')} · Periode: ${periode}`,
    sections: [
      {
        title: 'Ringkasan per lahan',
        headers: ['Lahan', 'Luas (ha)', 'Komoditas', 'Sensor', 'Kel.', 'Suhu', 'RH', 'pH', 'EC', 'NPK', 'Status'],
        rows: summary.map(s => [
          s.nama, s.luas, s.komoditas, s.sensorAktif, s.kelembabanRataRata,
          s.suhuRataRata, s.rhUdara, s.ph, s.ec, s.npk, s.status,
        ]),
      },
      {
        title: 'Skor risiko AI',
        headers: ['Lahan', 'Stres air', 'Risiko jamur', 'Butuh irigasi', 'Butuh pupuk'],
        rows: summary.map(s => [
          s.nama, s.waterStressRisk, s.diseaseRisk, s.irrigationNeed, s.fertNeed,
        ]),
      },
      {
        title: 'Rekomendasi aktif',
        headers: ['Lahan', 'Aksi', 'Dampak estimasi', 'Confidence'],
        rows: generateRecommendations(lahanList).map(r => [
          r.lahan, r.aksi, r.dampak, `${r.match}%`,
        ]),
      },
    ],
    raw: { summary },
  }
}

function metrikTanahData(lahanList, sensorList, periode) {
  return {
    title: 'Metrik Tanah Detail',
    subtitle: `${lahanList.map(l => l.nama).join(', ')} · Periode: ${periode}`,
    sections: [
      {
        title: `Pembacaan sensor (${sensorList.length} unit)`,
        headers: ['Sensor', 'Lahan', 'Kelembaban', 'Suhu', 'RH', 'pH', 'EC', 'NPK', 'Sehat', 'Status'],
        rows: sensorList.map(s => [
          s.id, s.lahan, `${s.kelembaban}%`, `${s.suhu}°C`, `${s.airHumidity}%`,
          s.ph, `${s.ec} dS/m`, s.npk, `${s.sistemHealth}%`, s.status,
        ]),
      },
    ],
    raw: { sensorList },
  }
}

function logIrigasiData(lahanList, periode) {
  // Synthesize an irrigation log from decision history filtered to irrigation actions
  const entries = decisionHistory
    .filter(d => d.aksi.toLowerCase().includes('irigasi') || d.aksi.toLowerCase().includes('air'))
    .filter(d => lahanList.some(l => l.nama === d.lahan))
  // Augment with auto-generated daily entries
  const auto = []
  for (const l of lahanList) {
    const days = periode === '7 Hari Terakhir' ? 7 : periode === '30 Hari Terakhir' ? 30 : 14
    for (let i = 0; i < days; i++) {
      const liters = Math.round(8 + Math.random() * 12)
      auto.push({
        tanggal: new Date(Date.now() - i * 86400000).toLocaleDateString('id-ID'),
        lahan: l.nama,
        durasi: `${20 + Math.floor(Math.random() * 25)} menit`,
        volume: `${liters} L/m²`,
        pemicu: i % 3 === 0 ? 'Otomatis (AI)' : 'Otomatis (jadwal)',
      })
    }
  }
  return {
    title: 'Log Irigasi',
    subtitle: `${lahanList.map(l => l.nama).join(', ')} · Periode: ${periode}`,
    sections: [
      {
        title: 'Riwayat irigasi otomatis',
        headers: ['Tanggal', 'Lahan', 'Durasi', 'Volume', 'Pemicu'],
        rows: auto.slice(0, 30).map(a => [a.tanggal, a.lahan, a.durasi, a.volume, a.pemicu]),
      },
      {
        title: 'Tindakan manual & catatan',
        headers: ['Waktu', 'Lahan', 'Aksi', 'Hasil'],
        rows: entries.map(e => [e.waktu, e.lahan, e.aksi, e.hasil]),
      },
    ],
  }
}

function ringkasanHarianData(lahanList, sensorList, periode) {
  return {
    title: 'Ringkasan Harian',
    subtitle: `${lahanList.map(l => l.nama).join(', ')} · ${nowID()}`,
    sections: [
      {
        title: 'Status setiap lahan',
        headers: ['Lahan', 'Status', 'Sensor online', 'Kel.', 'Suhu', 'RH', 'pH'],
        rows: lahanList.map(l => [
          l.nama, l.status, `${l.sensorOnline}/${l.sensorCount}`,
          `${l.kelembaban}%`, `${l.suhu}°C`, `${l.airHumidity}%`, l.ph,
        ]),
      },
      {
        title: 'Risiko terdeteksi hari ini',
        headers: ['Lahan', 'Jenis risiko', 'Tipe', 'Skor', 'Estimasi dampak', 'Pencegahan'],
        rows: generateRisks(lahanList).map(r => [
          r.lahan, r.nama, r.tipe, `${r.score}%`, r.waktuDampak, r.pencegahan,
        ]),
      },
      {
        title: 'Rekomendasi prioritas',
        headers: ['Lahan', 'Aksi', 'Dampak'],
        rows: generateRecommendations(lahanList).slice(0, 6).map(r => [
          r.lahan, r.aksi, r.dampak,
        ]),
      },
    ],
  }
}

// ─── Format dispatchers ───

function downloadAsPDF(filename, data) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  pdfHeader(doc, data.title, data.subtitle)
  let y = 56

  for (const section of data.sections) {
    if (y > 250) { doc.addPage(); pdfHeader(doc, data.title, data.subtitle); y = 56 }
    y = pdfSectionTitle(doc, section.title, y)
    if (section.rows.length === 0) {
      doc.setFontSize(9)
      doc.setFont('helvetica', 'italic')
      doc.setTextColor(156, 163, 175)
      doc.text('(tidak ada data untuk periode ini)', 14, y)
      y += 8
      continue
    }
    autoTable(doc, {
      startY: y,
      head: [section.headers],
      body: section.rows,
      theme: 'grid',
      headStyles: { fillColor: KAPORI_GREEN, textColor: 255, fontSize: 9 },
      bodyStyles: { fontSize: 8.5, textColor: [55, 65, 81] },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      margin: { left: 14, right: 14 },
      styles: { cellPadding: 2 },
    })
    y = (doc.lastAutoTable?.finalY || y) + 8
  }

  pdfFooter(doc)
  doc.save(filename)
}

function downloadAsCSV(filename, data) {
  // Concatenate sections into a single CSV with section headers
  const lines = []
  lines.push(`# ${data.title}`)
  if (data.subtitle) lines.push(`# ${data.subtitle}`)
  lines.push(`# Dicetak: ${nowID()}`)
  lines.push('')
  for (const s of data.sections) {
    lines.push(`# ${s.title}`)
    lines.push(s.headers.map(csvEscape).join(','))
    for (const r of s.rows) {
      lines.push(r.map(csvEscape).join(','))
    }
    lines.push('')
  }
  const csv = '﻿' + lines.join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  saveFile(blob, filename)
}

function downloadAsExcel(filename, data) {
  const sheets = data.sections.map(s => ({ name: s.title, headers: s.headers, rows: s.rows }))
  downloadExcel(filename, sheets)
}

export function downloadReport(report) {
  const data = buildReportData(report.jenisLaporan || report.nama.split(' – ')[0] || 'Ringkasan Harian',
                                report.lahan || 'Semua Lahan',
                                report.periode || '30 Hari Terakhir')
  const baseFilename = `kapori-${(report.nama || 'laporan').replace(/\s+/g, '-').toLowerCase()}-${todayStamp()}`
  const fmt = report.format || 'PDF'
  if (fmt === 'PDF') downloadAsPDF(`${baseFilename}.pdf`, data)
  else if (fmt === 'Excel') downloadAsExcel(`${baseFilename}.xls`, data)
  else downloadAsCSV(`${baseFilename}.csv`, data)
}

// Export combined alerts CSV (for any "export alerts" button)
export function downloadAlertsCSV() {
  const headers = ['Tipe', 'Judul', 'Pesan', 'Lahan', 'Kategori', 'Waktu']
  const rows = alertsData.map(a => [a.tipe, a.judul, a.pesan, a.lahan, a.kategori || '—', a.waktu])
  downloadCSV(`kapori-peringatan-${todayStamp()}.csv`, headers, rows)
}

export function downloadAllDevicesCSV() {
  const headers = ['ID', 'Nama', 'Tipe', 'Lahan', 'Status', 'Sinyal (%)', 'Baterai (%)', 'Solar (W)', 'Terakhir lapor', 'Error']
  const rows = getAllDevices().map(d => [
    d.id, d.nama, d.tipe, d.lahan, d.status,
    d.sinyal, d.baterai, d.solarCharge ?? '—', d.lastReport, d.error || '—',
  ])
  downloadCSV(`kapori-perangkat-${todayStamp()}.csv`, headers, rows)
}
