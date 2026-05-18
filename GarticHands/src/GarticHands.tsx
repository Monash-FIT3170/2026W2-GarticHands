import { Routes, Route, BrowserRouter } from 'react-router-dom'
import Land from './Pages/landingPage.tsx'
import Host from './Pages/hostingPage.tsx'
import Join from './Pages/joiningPage.tsx'
import Joined from './Pages/joinedPage.tsx'
import Game from './Pages/gamePage.tsx'

export default function GarticHands() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Land />}/>
        <Route path='/host' element={<Host />}/>
        <Route path='/join' element={<Join />}/>
        <Route path='/joined/:roomcode' element={<Joined />}/>
        <Route path='/game' element={<Game />}/>
      </Routes>
    </BrowserRouter>
  )
}