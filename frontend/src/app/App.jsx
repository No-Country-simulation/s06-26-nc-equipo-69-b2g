import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from '@/shared/layout/Navbar'
import LandingPage from '@/features/landing-page/LandingPage'
import MethodologyPage from '@/features/methodology-page/MethodologyPage'
import MapPage from '@/features/map-page/pages/MapPage'
import ClusterComparisonPage from '@/features/cluster-comparison/pages/ClusterComparisonPage'
import { useAuthListener } from '@/features/auth'
import { Toaster } from '@/shared/components/ui/sonner'
import '../App.css'

function App() {
  useAuthListener()

  return (
    <BrowserRouter>
      <div className="flex min-h-dvh flex-col">
        <Navbar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/metodologia" element={<MethodologyPage />} />
          <Route path="/mapa" element={<MapPage />} />
          <Route path="/comparativa" element={<ClusterComparisonPage />} />
        </Routes>
      </div>
      <Toaster position="top-right" richColors />
    </BrowserRouter>
  )
}

export default App
