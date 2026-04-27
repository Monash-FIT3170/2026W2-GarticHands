import { Routes, Route, Link, Navigate, BrowserRouter } from 'react-router-dom'
import Phase1 from './Pages/Phase1'
import Phase2 from './Pages/Phase2'
import Phase3 from './Pages/Phase3'
import Phase4 from './Pages/Phase4'
import Phase12 from './Pages/Phase12'
import 'react-loading-skeleton/dist/skeleton.css'

export default function App() {

  return (
    <BrowserRouter>
      <div className='min-h-screen p-6'>
        <h1 className='text-3xl font-bold mb-6'>Phase 12: Completing the Loop</h1>
        <nav className='flex gap-3 mb-8'>
          <Link to='/Phase-1' className='border px-4 py-2 rounded'>
            Phase 1
          </Link>
          <Link to='/Phase-2' className='border px-4 py-2 rounded'>
            Phase 2
          </Link>
          <Link to='/Phase-3' className='border px-4 py-2 rounded'>
            Phase 3
          </Link>
          <Link to='/Phase-4' className='border px-4 py-2 rounded'>
            Phase 4
          </Link>
          <Link to='/Phase-12' className='border px-4 py-2 rounded'>
            Phase 12
          </Link>
        </nav>

        <Routes>
          <Route path='/' element={<Navigate to='/Phase-1' replace/>}/>
          <Route path='/Phase-1' element={<Phase1 />}/>
          <Route path='/Phase-2' element={<Phase2 />}/>
          <Route path='/Phase-3' element={<Phase3 />}/>
          <Route path='/Phase-4' element={<Phase4 />}/>
          <Route path='/Phase-12' element={<Phase12 />}/>
        </Routes>
      </div>
    </BrowserRouter>
  )
}