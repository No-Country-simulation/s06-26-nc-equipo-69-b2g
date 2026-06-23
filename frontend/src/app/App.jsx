import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from '../features/landing-page/LandingPage'
import MethodologyPage from '../features/methodology-page/MethodologyPage'
import MapPage from '../features/map-page/pages/MapPage'
import '../App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/metodologia" element={<MethodologyPage />} />
        <Route path="/mapa" element={<MapPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
