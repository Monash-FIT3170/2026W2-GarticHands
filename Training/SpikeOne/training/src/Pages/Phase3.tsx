import { useEffect, useState } from 'react'
import Skeleton from 'react-loading-skeleton'
import CardNoCss from '../components/CardNoCss'

export default function Phase3() {
  const [count, setCount] = useState(0)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 5000)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return(
      <div className='Phase3-Code'>
        <h1>
          <Skeleton width={260} />
        </h1>

        <CardNoCss>
          <section className='Counter-Widget'>
            <h2>
              <Skeleton width={200} />
            </h2>
            <p>
              <Skeleton width={80} />
            </p>
            <div>
              <Skeleton width={80} height={28} inline />
              <span style={{ marginLeft: '8px' }} />
              <Skeleton width={80} height={28} inline />
            </div>
          </section>
        </CardNoCss>

        <CardNoCss>
          <section className='Text-Display'>
            <h2>
              <Skeleton width={130} />
            </h2>
            <p className='text-data'>
              <Skeleton count={3} />
            </p>
          </section>
        </CardNoCss>

        <CardNoCss>
          <section className='Form-Input'>
            <h2>
              <Skeleton width={220} />
            </h2>
            <div>
              <Skeleton height={30} />
            </div>
            <div style={{ marginTop: '10px' }}>
              <Skeleton width={170} height={30} />
            </div>
          </section>
        </CardNoCss>
      </div>
    )
  }
  
  return (
    <div className='Phase3-Code'>
      <h1>Phase 3: Removing CSS Files</h1>

      {/* Widget 1*/}
      <CardNoCss>
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
      </CardNoCss>

      {/* Widget 2*/}
      <CardNoCss>
        <section className='Text-Display'>
          <h2>Display for text</h2>
          <p className='text-data'>
            The purpose of this widget is to display text.
            Idk what else to put here, We can finally be Bees. 
          </p>
        </section>
      </CardNoCss>

      {/* Widget 3*/}
      <CardNoCss>
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
      </CardNoCss>
    </div>

  )
}