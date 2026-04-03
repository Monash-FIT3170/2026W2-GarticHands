import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [text, setText] = useState('')

  return (
    <div className="app-container">
      <h1>Phase 1: Widget Layout</h1>

      {/* Widget 1: Counter */}
      <section className="counter-widget">
        <h2>Interactive Counter</h2>
        <p>Current Count: {count}</p>
        <div className="counter-controls">
          <button onClick={() => setCount(count + 1)}>Increment</button>
          <button onClick={() => setCount(count - 1)}>Decrement</button>
        </div>
      </section>

      {/* Widget 2: Text Display */}
      <section className="display-widget">
        <h2>Static Information</h2>
        <p className="display-text">
          This widget displays static content. It is styled independently to
          demonstrate the layout structure of Phase 1.
        </p>
      </section>

      {/* Widget 3: Form Input */}
      <section className="input-widget">
        <h2>Live Input Preview</h2>
        <input
          type="text"
          placeholder="Type something..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <p>Preview: <span className="input-preview">{text}</span></p>
      </section>
    </div>
  )
}

export default App