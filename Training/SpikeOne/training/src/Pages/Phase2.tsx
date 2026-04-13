import { useState } from 'react'
import CardWithCss from '../components/CardWithCSS'
import './Phase2.css'

export default function Phase2() {
  const [count, setCount] = useState(0)
  const [text, setText] = useState('')

  return (
    <div className='Phase2-Code'>
      <h1>Phase 2: Refactor Towards Usability</h1>

      {/* Widget 1*/}
      <CardWithCss>
        <section className='Counter-Widget2'>
          <h2>Interactive counter widget</h2>
          <p>Count: {count}</p>
          <div>
            <button 
            className='Increase2'
            onClick={() => setCount((count) => count + 1)}
            >
            Increase    
            </button>
            <button 
            className='Decrease2'
            onClick={() => setCount((count) => count - 1)}
            >
            Decrease    
            </button>
          </div>
        </section>
      </CardWithCss>

      {/* Widget 2*/}
      <CardWithCss>
        <section className='Text-Display2'>
          <h2>Display for text</h2>
          <p className='text-data2'>
            The purpose of this widget is to display text.
            Idk what else to put here, We can finally be Bees. 
          </p>
        </section>
      </CardWithCss>

      {/* Widget 3*/}
      <CardWithCss>
        <section className='Form-Input2'>
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
            <button className='submit-Button2' 
            type='submit'>Show us what you said</button>
          
          </form>
        </section>
      </CardWithCss>
    </div>

  )
}

