import Navbar from './components/layout/Navbar'
import LeftSidebar from './components/layout/LeftSidebar'
import RightSidebar from './components/layout/RightSidebar'
import MapboxMap from './components/MapboxMap'
import './App.css'

function App() {
  return (
    <>
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />
        <MapboxMap />
        <RightSidebar />
      </div>
    </>
  )
}

export default App
