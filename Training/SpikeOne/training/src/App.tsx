import { useState } from 'react'
import Card from './components/Card'

function App() {
  const [count, setCount] = useState(0)
  const [text, setText] = useState('')

  return (
    <div className='text-[18px] p-5 my-8 mx-auto font-sans grid gap-[30px] justify-items-center'>
      <h1 className='text-3xl font-bold'>Phase 1, get something on screen</h1>

      {/* Widget 1*/}
      <Card>
        <section>
          <h2 className='text-xl font-semibold mb-3'>Interactive counter widget</h2>
          <p className='mb-3'>Count: {count}</p>
          <div className='flex gap-2'>
            <button 
            className='text-black bg-green-300 cursor-pointer px-2 py-1 rounded'
            onClick={() => setCount((count) => count + 1)}
            >
            Increase    
            </button>
            <button 
            className='text-black bg-red-500 cursor-pointer px-2 py-1 rounded'
            onClick={() => setCount((count) => count - 1)}
            >
            Decrease    
            </button>
          </div>
        </section>
      </Card>

      {/* Widget 2*/}
      <Card>
        <section>
          <h2 className='text-xl font-semibold mb-3'>Display for text</h2>
          <p className='text-xs'>
            The purpose of this widget is to display text.
            Idk what else to put here, We can finally be Bees. 
          </p>
        </section>
      </Card>

      {/* Widget 3*/}
      <Card>
        <section>
          <h2 className='text-xl font-semibold mb-3'>Form for inputting information</h2>
          <form 
          onSubmit={(data) => {data.preventDefault();
            alert("You really said that, okay then: " + text)
          }}
          >
            <input 
            className='border border-gray-400 rounded px-3 py-2'
            type="text"
            value={text}
            onChange={(data) => setText(data.target.value)}
            placeholder='Say something'
            />
            <button 
            className='cursor-pointer bg-cyan-400 text-black px-3 py-2 rounded' 
            type='submit'>Show us what you said</button>
          
          </form>
        </section>
      </Card>
    </div>

  )
}

export default App
