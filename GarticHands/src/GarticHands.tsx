import { Routes, Route, Link, Navigate, BrowserRouter } from 'react-router-dom'
import Land from './Pages/landingPage.tsx'
import Host from './Pages/hostingPage.tsx'
import Join from './Pages/joiningPage.tsx'
import Game from './Pages/gamePage.tsx'

export default function GarticHands() {

  return (
    <BrowserRouter>
      <div className='min-h-screen p-6'>
        <h1 className='text-3xl font-bold mb-6'>Gartic Hands</h1>
        
        <nav className='flex gap-3 mb-8'>
          <Link to='/land-page' className='border px-4 py-2 rounded'>
            Join or Host a game
          </Link>
          <Link to='/host' className='border px-4 py-2 rounded'>
            Invite your friends
          </Link>
          <Link to='/join' className='border px-4 py-2 rounded'>
            Joined Host
          </Link>
          <Link to='/game' className='border px-4 py-2 rounded'>
          GAMEPLAY
          </Link>
        </nav>

        <Routes>
          <Route path='/' element={<Navigate to='/land-page' replace/>}/>
          <Route path='/land-page' element={<Land />}/>
          <Route path='/host' element={<Host />}/>
          <Route path='/join' element={<Join />}/>
          <Route path='/game' element={<Game />}/>
        </Routes>
      </div>
    </BrowserRouter>
  )
}