import { useState, useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Download, Trash2, Loader2,
  CheckCircle, File, Eye, Calendar
} from 'lucide-react'
import clsx from 'clsx'
import { notify } from '../lib/notify'
import Modal from '../components/ui/Modal'
import { getFilteredReports } from '../data'
import { downloadReport } from '../lib/downloads'

const reportTypes = ['Performa Bulanan', 'Metrik Tanah', 'Log Irigasi', 'Ringkasan Harian']
const lahanOptions = ['Semua Lahan', 'Lahan Utama', 'Lahan Selatan', 'Lahan Barat']
const formatOptions = ['PDF', 'CSV', 'Excel']
const formatColors = {
  PDF: 'text-red-500 bg-red-50',
  CSV: 'text-green-600 bg-green-50',
  Excel: 'text-kapori-700 bg-kapori-50',
}
const periodeOptions = [
  { key: 'last7', label: '7 Hari', shortLabel: '7 Hari Terakhir' },
  { key: 'last30', label: '30 Hari', shortLabel: '30 Hari Terakhir' },
  { key: 'month', label: 'Bulan Ini', shortLabel: 'Bulan Ini' },
  { key: 'custom', label: 'Kustom', shortLabel: null },
]

function formatDateID(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Parse the report.nama to extract jenisLaporan + lahan if not stored explicitly
function inferReportType(nama) {
  for (const t of reportTypes) {
    if (nama.toLowerCase().includes(t.toLowerCase())) return t
  }
  if (nama.toLowerCase().includes('metrik tanah')) return 'Metrik Tanah'
  if (nama.toLowerCase().includes('irigasi')) return 'Log Irigasi'
  if (nama.toLowerCase().includes('performa')) return 'Performa Bulanan'
  return 'Ringkasan Harian'
}

export default function Laporan() {
  const { filters } = useOutletContext()
  const { selectedFarm } = filters

  const initialReports = useMemo(() => getFilteredReports(selectedFarm), [selectedFarm])

  const [extraReports, setExtraReports] = useState([])
  const [deletedIds, setDeletedIds] = useState([])
  const [jenisLaporan, setJenisLaporan] = useState(reportTypes[0])
  const [lahanFilter, setLahanFilter] = useState(lahanOptions[0])
  const [format, setFormat] = useState('PDF')
  const [isCreating, setIsCreating] = useState(false)
  const [downloadedIds, setDownloadedIds] = useState([])
  const [downloadingId, setDownloadingId] = useState(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  const [previewReport, setPreviewReport] = useState(null)
  const [dateRange, setDateRange] = useState('last30')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const reports = [...extraReports, ...initialReports].filter(r => !deletedIds.includes(r.id))

  const customRangeValid = customStart && customEnd && new Date(customStart) <= new Date(customEnd)

  const periodeLabel = useMemo(() => {
    if (dateRange === 'custom') {
      if (!customRangeValid) return null
      return `${formatDateID(customStart)} – ${formatDateID(customEnd)}`
    }
    return periodeOptions.find(p => p.key === dateRange)?.shortLabel
  }, [dateRange, customStart, customEnd, customRangeValid])

  const canCreate = !isCreating && periodeLabel

  const handleCreateReport = () => {
    if (!periodeLabel) {
      notify.warning('Pilih rentang tanggal kustom yang valid')
      return
    }
    setIsCreating(true)
    setTimeout(() => {
      const sizes = ['856 KB', '1.2 MB', '2.1 MB', '456 KB', '3.4 MB']
      const newReport = {
        id: Date.now(),
        nama: `${jenisLaporan} – ${lahanFilter}`,
        tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
        ukuran: sizes[Math.floor(Math.random() * sizes.length)],
        format,
        lahan: lahanFilter,
        periode: periodeLabel,
        jenisLaporan,
      }
      setExtraReports(prev => [newReport, ...prev])
      setIsCreating(false)
      notify.success(`Laporan dibuat — siap diunduh`)
    }, 1500)
  }

  const handleDownload = (report) => {
    setDownloadingId(report.id)
    // Build full report payload (some legacy reports lack jenisLaporan field)
    const payload = {
      ...report,
      jenisLaporan: report.jenisLaporan || inferReportType(report.nama),
      periode: report.periode || '30 Hari Terakhir',
      lahan: report.lahan || 'Semua Lahan',
    }
    setTimeout(() => {
      try {
        downloadReport(payload)
        setDownloadingId(null)
        setDownloadedIds(prev => [...prev, report.id])
        notify.success(`File ${payload.format} terunduh`)
      } catch (err) {
        setDownloadingId(null)
        notify.error('Gagal membuat file unduhan')
        console.error(err)
      }
    }, 800)
  }

  const handleDelete = (id) => {
    setDeletedIds(prev => [...prev, id])
    setDeleteConfirmId(null)
    notify.info('Laporan dihapus')
  }

  return (
    <motion.div
      key={selectedFarm}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6"
    >
      {/* Left - Create Report Form */}
      <div className="lg:col-span-2 card p-5 h-fit">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-kapori-600" /> Buat laporan baru
        </h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1.5 block">Jenis laporan</label>
            <select
              value={jenisLaporan}
              onChange={e => setJenisLaporan(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kapori-500 focus:border-transparent bg-white"
            >
              {reportTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 mb-1.5 block">Lahan</label>
            <select
              value={lahanFilter}
              onChange={e => setLahanFilter(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-kapori-500 focus:border-transparent bg-white"
            >
              {lahanOptions.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 mb-1.5 block">Periode</label>
            <div className="grid grid-cols-2 gap-2">
              {periodeOptions.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setDateRange(opt.key)}
                  className={clsx(
                    'py-2 px-2 rounded-lg text-xs font-medium border transition-colors flex items-center justify-center gap-1.5',
                    dateRange === opt.key
                      ? 'border-kapori-500 bg-kapori-50 text-kapori-700'
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  )}
                >
                  <Calendar className="w-3 h-3" />{opt.label}
                </button>
              ))}
            </div>
            <AnimatePresence initial={false}>
              {dateRange === 'custom' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <input
                      type="date"
                      value={customStart}
                      onChange={e => setCustomStart(e.target.value)}
                      max={customEnd || undefined}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-kapori-500 focus:border-transparent bg-white"
                      aria-label="Tanggal mulai"
                    />
                    <input
                      type="date"
                      value={customEnd}
                      onChange={e => setCustomEnd(e.target.value)}
                      min={customStart || undefined}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-kapori-500 focus:border-transparent bg-white"
                      aria-label="Tanggal akhir"
                    />
                  </div>
                  {!customRangeValid && (customStart || customEnd) && (
                    <p className="text-xs text-amber-600 mt-1.5">Lengkapi rentang tanggal</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 mb-1.5 block">Format</label>
            <div className="flex bg-gray-100 rounded-lg p-1">
              {formatOptions.map(f => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={clsx(
                    'flex-1 py-2 rounded-md text-sm font-medium transition-all',
                    format === f ? 'bg-white shadow-sm text-kapori-700' : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleCreateReport}
            disabled={!canCreate}
            className={clsx(
              'btn-primary w-full flex items-center justify-center gap-2 text-sm py-2.5',
              !canCreate && 'opacity-60 cursor-not-allowed'
            )}
          >
            {isCreating ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Membuat laporan…</>
            ) : 'Buat laporan'}
          </motion.button>
        </div>
      </div>

      {/* Right - Documents */}
      <div className="lg:col-span-3 card p-5">
        <div className="flex items-center justify-between mb-4 gap-2">
          <h2 className="text-lg font-bold text-gray-800">Dokumen terkini</h2>
          <span className="text-xs text-gray-400 shrink-0">
            {reports.length} dokumen · {selectedFarm}
          </span>
        </div>

        <div className="space-y-2">
          <AnimatePresence>
            {reports.map(report => {
              const isDownloaded = downloadedIds.includes(report.id)
              const isDownloading = downloadingId === report.id
              return (
                <motion.div
                  key={report.id}
                  layout
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-wrap sm:flex-nowrap items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className={clsx('p-2 rounded-lg shrink-0', formatColors[report.format] || 'bg-gray-50 text-gray-500')}>
                    <File className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0 order-2 sm:order-none basis-full sm:basis-auto">
                    <p className="text-sm font-semibold text-gray-800 truncate">{report.nama}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {report.tanggal}
                      {report.periode ? ` · ${report.periode}` : ''}
                      {' · '}{report.ukuran}
                      {' · '}{report.format}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-auto sm:ml-0">
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setPreviewReport(report)}
                      className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      title="Pratinjau"
                      aria-label="Pratinjau laporan"
                    >
                      <Eye className="w-4 h-4 text-gray-500" />
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleDownload(report)}
                      disabled={isDownloading}
                      className={clsx(
                        'text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 font-medium transition-colors',
                        isDownloaded
                          ? 'bg-green-50 text-green-600 border border-green-200'
                          : isDownloading
                            ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-wait'
                            : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                      )}
                    >
                      {isDownloading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : isDownloaded ? (
                        <><CheckCircle className="w-3.5 h-3.5" />Diunduh</>
                      ) : (
                        <><Download className="w-3.5 h-3.5" />Unduh</>
                      )}
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setDeleteConfirmId(report.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Hapus"
                      aria-label="Hapus laporan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {reports.length === 0 && (
            <div className="text-center py-10 px-4">
              <File className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Belum ada dokumen untuk {selectedFarm}.</p>
              <p className="text-xs text-gray-400 mt-1">Buat laporan baru lewat formulir di samping.</p>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        title="Hapus laporan"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Laporan akan dihapus dari daftar dokumen. Tindakan ini tidak dapat dibatalkan.
          </p>
          <div className="flex gap-2">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => handleDelete(deleteConfirmId)}
              className="flex-1 bg-red-500 text-white rounded-lg px-4 py-2.5 font-medium text-sm hover:bg-red-600 transition-colors"
            >
              Hapus
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setDeleteConfirmId(null)}
              className="flex-1 btn-ghost text-sm"
            >
              Batal
            </motion.button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!previewReport}
        onClose={() => setPreviewReport(null)}
        title={previewReport?.nama || 'Pratinjau'}
      >
        {previewReport && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Format</span>
                <span className="font-medium text-gray-800">{previewReport.format}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tanggal</span>
                <span className="font-medium text-gray-800">{previewReport.tanggal}</span>
              </div>
              {previewReport.periode && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Periode</span>
                  <span className="font-medium text-gray-800">{previewReport.periode}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Ukuran</span>
                <span className="font-medium text-gray-800">{previewReport.ukuran}</span>
              </div>
            </div>
            <div className="border border-dashed border-gray-200 rounded-xl p-6 text-center">
              <File className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Pratinjau dokumen tersedia setelah diunduh.</p>
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => { handleDownload(previewReport); setPreviewReport(null) }}
              className="btn-primary w-full flex items-center justify-center gap-2 text-sm py-2.5"
            >
              <Download className="w-4 h-4" /> Unduh untuk melihat
            </motion.button>
          </div>
        )}
      </Modal>
    </motion.div>
  )
}
