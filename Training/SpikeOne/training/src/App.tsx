import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import JoinPage from './pages/JoinPage'

function App() {
  return (
    <BrowserRouter>
      <nav style={{ padding: '12px 20px', backgroundColor: '#f3f4f6', borderBottom: '1px solid #ddd' }}>
        <Link to="/join" style={{ color: '#2563eb' }}>Join Game</Link>
      </nav>
      <Routes>
        <Route path="/join" element={<JoinPage />} />
        <Route path="/" element={
          <div style={{ padding: '40px' }}>
            <h1>Gartic Hands</h1>
            <p>Go to <a href="/join">/join</a> to join a game.</p>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App