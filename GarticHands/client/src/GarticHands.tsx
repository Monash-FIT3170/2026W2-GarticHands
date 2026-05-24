import { Routes, Route, BrowserRouter } from 'react-router-dom'
import Land from './Pages/landingPage.tsx'
import Host from './Pages/hostingPage.tsx'
import Join from './Pages/joiningPage.tsx'
import Joined from './Pages/joinedPage.tsx'
import Game from './Pages/gamePage.tsx'
import Input from './Pages/inputPage.tsx'
import Draw from './Pages/drawPage.tsx'
import Guess from './Pages/guessingPage.tsx'
import Playground from './Pages/playgroundPage.tsx'
import Solo from './Pages/soloPage.tsx'
import { RecordingsProvider } from './state/RecordingsContext.tsx'

export default function GarticHands() {
  return (
    <BrowserRouter>
      <RecordingsProvider>
        <Routes>
          <Route path='/' element={<Land />}/>
          <Route path='/host' element={<Host />}/>
          <Route path='/join' element={<Join />}/>
          <Route path='/joined/:roomCode' element={<Joined />}/>
          <Route path='/game' element={<Game />}/>
          <Route path='/input' element={<Input />}/>
          <Route path='/draw' element={<Draw />}/>
          <Route path='/guess' element={<Guess />}/>
          <Route path='/playground' element={<Playground />}/>
          <Route path='/solo' element={<Solo />}/>
        </Routes>
      </RecordingsProvider>
    </BrowserRouter>
  )
}
