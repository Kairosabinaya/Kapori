import { useState, useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Download, Trash2, Loader2,
  CheckCircle, File, Eye, Calendar
} from 'lucide-react'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import Modal from '../components/ui/Modal'
import { getFilteredReports } from '../data'

const reportTypes = ['Performa Bulanan', 'Metrik Tanah', 'Log Irigasi', 'Ringkasan Harian']
const lahanOptions = ['Semua Lahan', 'Lahan A', 'Lahan B', 'Lahan C']
const formatColors = { PDF: 'text-red-500 bg-red-50', CSV: 'text-green-500 bg-green-50', Excel: 'text-kapori-700 bg-kapori-50' }

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

  const reports = [...extraReports, ...initialReports].filter(r => !deletedIds.includes(r.id))

  const handleCreateReport = () => {
    setIsCreating(true)
    setTimeout(() => {
      const sizes = ['856 KB', '1.2 MB', '2.1 MB', '456 KB', '3.4 MB']
      const newReport = {
        id: Date.now(),
        nama: `${jenisLaporan} - ${lahanFilter}`,
        tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
        ukuran: sizes[Math.floor(Math.random() * sizes.length)],
        format,
        lahan: lahanFilter,
      }
      setExtraReports(prev => [newReport, ...prev])
      setIsCreating(false)
      toast('✓ Laporan berhasil dibuat!', { style: { background: '#fff', color: '#1B4332', borderLeft: '4px solid #2D6A4F' } })
    }, 1500)
  }

  const handleDownload = (id) => {
    setDownloadingId(id)
    setTimeout(() => {
      setDownloadingId(null)
      setDownloadedIds(prev => [...prev, id])
      toast('✓ File berhasil diunduh', { style: { background: '#fff', color: '#1B4332', borderLeft: '4px solid #2D6A4F' } })
    }, 1200)
  }

  const handleDelete = (id) => {
    setDeletedIds(prev => [...prev, id])
    setDeleteConfirmId(null)
    toast('🗑️ Laporan dihapus', { style: { background: '#fff', color: '#92400E', borderLeft: '4px solid #F59E0B' } })
  }

  return (
    <motion.div
      key={selectedFarm}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="grid grid-cols-5 gap-6"
    >
      {/* Left - Create Report Form */}
      <div className="col-span-2 card p-5 h-fit">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-kapori-600" /> Buat Laporan Baru
        </h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1.5 block">Jenis Laporan</label>
            <select value={jenisLaporan} onChange={e => setJenisLaporan(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-kapori-500 focus:border-transparent">
              {reportTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1.5 block">Lahan</label>
            <select value={lahanFilter} onChange={e => setLahanFilter(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-kapori-500 focus:border-transparent">
              {lahanOptions.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1.5 block">Periode</label>
            <div className="grid grid-cols-2 gap-2">
              {[{ key: 'last7', label: '7 Hari' }, { key: 'last30', label: '30 Hari' }, { key: 'month', label: 'Bulan Ini' }, { key: 'custom', label: 'Kustom' }].map(opt => (
                <button key={opt.key} onClick={() => setDateRange(opt.key)} className={clsx('py-1.5 px-2 rounded-lg text-xs font-medium border transition-colors flex items-center justify-center gap-1', dateRange === opt.key ? 'border-kapori-500 bg-kapori-50 text-kapori-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50')}>
                  <Calendar className="w-3 h-3" />{opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1.5 block">Format</label>
            <div className="flex bg-gray-100 rounded-lg p-1">
              {['PDF', 'CSV'].map(f => (
                <button key={f} onClick={() => setFormat(f)} className={clsx('flex-1 py-1.5 rounded-md text-sm font-medium transition-all', format === f ? 'bg-white shadow-sm text-kapori-700' : 'text-gray-500')}>{f}</button>
              ))}
            </div>
          </div>
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleCreateReport} disabled={isCreating} className="btn-primary w-full flex items-center justify-center gap-2 text-sm">
            {isCreating ? (<><Loader2 className="w-4 h-4 animate-spin" />Membuat Laporan...</>) : 'Buat Laporan'}
          </motion.button>
        </div>
      </div>

      {/* Right - Documents */}
      <div className="col-span-3 card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">Dokumen Terkini</h2>
          <span className="text-xs text-gray-400">{reports.length} dokumen · {selectedFarm}</span>
        </div>
        <div className="space-y-2">
          <AnimatePresence>
            {reports.map(report => {
              const isDownloaded = downloadedIds.includes(report.id)
              const isDownloading = downloadingId === report.id
              return (
                <motion.div key={report.id} layout initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -100, height: 0 }} transition={{ duration: 0.2 }} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                  <div className={clsx('p-2 rounded-lg', formatColors[report.format] || 'bg-gray-50 text-gray-500')}><File className="w-5 h-5" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{report.nama}</p>
                    <p className="text-xs text-gray-400">{report.tanggal} · {report.ukuran} · {report.format}</p>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => setPreviewReport(report)} className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors" title="Pratinjau"><Eye className="w-3.5 h-3.5 text-gray-400" /></motion.button>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => handleDownload(report.id)} disabled={isDownloading} className={clsx('text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1 font-medium transition-colors', isDownloaded ? 'bg-green-50 text-green-600 border border-green-200' : 'btn-ghost')}>
                      {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isDownloaded ? (<><CheckCircle className="w-3.5 h-3.5" />Diunduh</>) : (<><Download className="w-3.5 h-3.5" />Unduh</>)}
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => setDeleteConfirmId(report.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></motion.button>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
          {reports.length === 0 && <div className="text-center py-8 text-sm text-gray-400">Belum ada dokumen untuk {selectedFarm}.</div>}
        </div>
      </div>

      <Modal isOpen={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)} title="Hapus Laporan">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Apakah kamu yakin ingin menghapus laporan ini?</p>
          <div className="flex gap-2">
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => handleDelete(deleteConfirmId)} className="flex-1 bg-red-500 text-white rounded-lg px-4 py-2 font-medium text-sm hover:bg-red-600 transition-colors">Ya, Hapus</motion.button>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => setDeleteConfirmId(null)} className="flex-1 btn-ghost text-sm">Batal</motion.button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!previewReport} onClose={() => setPreviewReport(null)} title={previewReport?.nama || 'Pratinjau'}>
        {previewReport && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Format</span><span className="font-medium text-gray-800">{previewReport.format}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Tanggal</span><span className="font-medium text-gray-800">{previewReport.tanggal}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Ukuran</span><span className="font-medium text-gray-800">{previewReport.ukuran}</span></div>
            </div>
            <div className="border border-dashed border-gray-200 rounded-xl p-6 text-center">
              <File className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Pratinjau dokumen tersedia setelah diunduh</p>
            </div>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => { handleDownload(previewReport.id); setPreviewReport(null) }} className="btn-primary w-full flex items-center justify-center gap-2 text-sm">
              <Download className="w-4 h-4" /> Unduh untuk Melihat
            </motion.button>
          </div>
        )}
      </Modal>
    </motion.div>
  )
}
