import {Route, Routes, Link, Navigate, BrowserRouter} from "react-router-dom";
import Phase01 from "./pages/Phase01";
import Phase02 from "./pages/Phase02";
import Phase03 from "./pages/Phase03";
import Phase04 from "./pages/Phase04";

export default function App() {
  return (
    <BrowserRouter>
      <nav className="flex gap-4 p-4 border-b border-gray-300">
        <Link to="/phase01" className="border border-b-black px-4 py-2">Phase 01</Link>
        <Link to="/phase02" className="border border-b-black px-4 py-2">Phase 02</Link>
        <Link to="/phase03" className="border border-b-black px-4 py-2">Phase 03</Link>
        <Link to="/phase04" className="border border-b-black px-4 py-2">Phase 04</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Navigate to="/phase01" replace/>} />
        <Route path="/phase01" element={<Phase01 />} />
        <Route path="/phase02" element={<Phase02 />} />
        <Route path="/phase03" element={<Phase03 />} />
        <Route path="/phase04" element={<Phase04 />} />
      </Routes>
    </BrowserRouter>
  )
}

