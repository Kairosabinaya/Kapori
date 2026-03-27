import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/layout/Layout'
import Overview from './pages/Overview'
import Inteligensi from './pages/Inteligensi'
import Lahan from './pages/Lahan'
import Perangkat from './pages/Perangkat'
import Peringatan from './pages/Peringatan'
import Laporan from './pages/Laporan'
import Pengaturan from './pages/Pengaturan'

export default function App() {
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState([])
  const [selectedFarm, setSelectedFarm] = useState('Semua Farm')
  const [selectedTime, setSelectedTime] = useState('Hari Ini')

  const handleAcknowledge = (id) => {
    setAcknowledgedAlerts(prev =>
      prev.includes(id) ? prev : [...prev, id]
    )
  }

  const filters = { selectedFarm, selectedTime, setSelectedFarm, setSelectedTime }

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '14px',
          },
        }}
      />
      <Routes>
        <Route element={
          <Layout
            acknowledgedAlerts={acknowledgedAlerts}
            filters={filters}
          />
        }>
          <Route path="/" element={<Navigate to="/overview" replace />} />
          <Route path="/overview" element={<Overview />} />
          <Route path="/inteligensi" element={<Inteligensi />} />
          <Route path="/lahan" element={<Lahan />} />
          <Route path="/perangkat" element={<Perangkat />} />
          <Route
            path="/peringatan"
            element={
              <Peringatan
                acknowledgedAlerts={acknowledgedAlerts}
                onAcknowledge={handleAcknowledge}
              />
            }
          />
          <Route path="/laporan" element={<Laporan />} />
          <Route path="/pengaturan" element={<Pengaturan />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
