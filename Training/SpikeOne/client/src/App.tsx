import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Nav from './components/Nav'
import Phase1 from './pages/Phase1'
import Placeholder from './pages/Placeholder'

export default function App() {
  return (
    <BrowserRouter>
      <div className="max-w-xl mx-auto px-4 mt-8">
        <Nav />
        <Routes>
          <Route path="/" element={<Navigate to="/phase-1" replace />} />
          <Route path="/phase-1" element={<Phase1 />} />
          <Route path="/phase-2" element={<Placeholder phase="Phase 2" />} />
          <Route path="/phase-3" element={<Placeholder phase="Phase 3" />} />
          <Route path="/phase-4" element={<Placeholder phase="Phase 4" />} />
          <Route path="/phase-5" element={<Placeholder phase="Phase 5" />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}