import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Phase1Page from "./pages/Phase1Page";
import Phase2Page from "./pages/Phase2Page";
import Phase3Page from "./pages/Phase3Page";
import Phase4Page from "./pages/Phase4Page"; // your Phase 4 Tailwind page

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">

        {/* Navigation Bar */}
        <nav className="bg-white shadow p-4 flex gap-4">
          <Link className="text-blue-600 hover:underline" to="/phase-1">
            Phase 1
          </Link>
          <Link className="text-blue-600 hover:underline" to="/phase-2">
            Phase 2
          </Link>
          <Link className="text-blue-600 hover:underline" to="/phase-3">
            Phase 3
          </Link>
          <Link className="text-blue-600 hover:underline" to="/phase-4">
            Phase 4
          </Link>
        </nav>

        {/* Routes */}
        <Routes>
          <Route path="/phase-1" element={<Phase1Page />} />
          <Route path="/phase-2" element={<Phase2Page />} />
          <Route path="/phase-3" element={<Phase3Page />} />
          <Route path="/phase-4" element={<Phase4Page />} />
          <Route path="*" element={<Phase1Page />} /> {/* fallback to Phase 1 */}
        </Routes>

      </div>
    </Router>
  );
}