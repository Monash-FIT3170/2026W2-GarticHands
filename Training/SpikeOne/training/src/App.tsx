import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="app-container">
      <div className="counter-section">
        <button className="counter-button" onClick={() => setCount((count) => count + 1)}>
          This is a counter. Current count is {count}
        </button>
      </div>

      <div className="text-display">
        This is a text display!
      </div>

      <input className="text-input" type="text" placeholder="This is an input field!" />
    </div>
  )
}

export default App
