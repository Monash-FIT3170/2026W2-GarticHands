import { useState } from 'react'
import Card from './components/Card'

function App() {
  const [count, setCount] = useState(0)
  const [text, setText] = useState('')

  return (
    <div className='Phase1-Code'>
      <h1>Phase 1, get something on screen</h1>

      {/* Widget 1*/}
      <Card>
        <section className='Counter-Widget'>
          <h2>Interactive counter widget</h2>
          <p>Count: {count}</p>
          <div>
            <button 
            className='Increase'
            onClick={() => setCount((count) => count + 1)}
            >
            Increase    
            </button>
            <button 
            className='Decrease'
            onClick={() => setCount((count) => count - 1)}
            >
            Decrease    
            </button>
          </div>
        </section>
      </Card>

      {/* Widget 2*/}
      <Card>
        <section className='Text-Display'>
          <h2>Display for text</h2>
          <p className='text-data'>
            The purpose of this widget is to display text.
            Idk what else to put here, We can finally be Bees. 
          </p>
        </section>
      </Card>

      {/* Widget 3*/}
      <Card>
        <section className='Form-Input'>
          <h2>Form for inputting information</h2>
          <form 
          onSubmit={(data) => {data.preventDefault();
            alert("You really said that, okay then: " + text)
          }}
          >
            <input type="text"
            value={text}
            onChange={(data) => setText(data.target.value)}
            placeholder='Say something'
            />
            <button className='submit-Button' 
            type='submit'>Show us what you said</button>
          
          </form>
        </section>
      </Card>
    </div>

  )
}

export default App
