import { useEffect, useState } from 'react'
import Skeleton from 'react-loading-skeleton'
import CardWithCss from '../components/CardWithCSS'
import './Phase2.css'
import useBackendMessage from '../hooks/useBackendMessage'


export default function Phase2() {
  const [count, setCount] = useState(0)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)

  const {message, error} = useBackendMessage()

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 5000)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return(
      <div className='Phase2-Code'>
        <h1>
          <Skeleton width={300} />
        </h1>

        <CardWithCss>
          <section className='Counter-Widget2'>
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
        </CardWithCss>

        <CardWithCss>
          <section className='Text-Display2'>
            <h2>
              <Skeleton width={130} />
            </h2>
            <p className='text-data2'>
              <Skeleton count={3} />
            </p>
          </section>
        </CardWithCss>

        <CardWithCss>
          <section className='Form-Input2'>
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
        </CardWithCss>
      </div>
    )
  }
  
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
            {error || message} 
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

