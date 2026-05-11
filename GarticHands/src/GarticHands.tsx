import { Routes, Route, BrowserRouter } from 'react-router-dom'
import Land from './Pages/landingPage.tsx'
import Host from './Pages/hostingPage.tsx'
import Join from './Pages/joiningPage.tsx'
import Game from './Pages/gamePage.tsx'

export default function GarticHands() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Land />}/>
        <Route path='/host' element={<Host />}/>
        <Route path='/join:roomcode' element={<Join />}/>
        <Route path='/game' element={<Game />}/>
      </Routes>
    </BrowserRouter>
  )
}