import { useState } from 'react'
import './Phase1.css'

export default function Phase1() {
  const [count, setCount] = useState(0)
  const [text, setText] = useState('')

  return (
    <div className='Phase1-Code'>
      <h1>Phase 1, get something on screen</h1>

      {/* Widget 1*/}
      <section className='Counter-Widget1'>
        <h2>Interactive counter widget</h2>
        <p>Count: {count}</p>
        <div>
          <button 
          className='Increase1'
          onClick={() => setCount((count) => count + 1)}
          >
          Increase    
          </button>
          <button 
          className='Decrease1'
          onClick={() => setCount((count) => count - 1)}
          >
          Decrease    
          </button>
        </div>
      </section>

      {/* Widget 2*/}
      <section className='Text-Display1'>
        <h2>Display for text</h2>
        <p className='text-data1'>
          The purpose of this widget is to display text.
          Idk what else to put here, We can finally be Bees. 
        </p>
      </section>

      {/* Widget 3*/}
      <section className='Form-Input1'>
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
          <button className='submit-Button1' 
          type='submit'>Show us what you said</button>
        
        </form>
      </section>
    </div>

  )
}