import { useEffect, useState } from 'react'
import Skeleton from 'react-loading-skeleton'
import Card from '../components/Card'
import useBackendMessage from '../hooks/useBackendMessage'
import SubmitWidget from '../components/submitWidget'
import RecentSubmissions from '../components/recentSubmissions'

export default function Phase12() {
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
        <div className='text-[18px] p-5 my-8 mx-auto font-sans grid gap-[30px] justify-items-center'>
        <h1 className='text-3xl font-bold'>
          <Skeleton width={260} />
        </h1>

        {/* Widget 1 */}
        <Card>
          <section>
            <h2 className='text-xl font-semibold mb-3'>
              <Skeleton width={200} />
            </h2>
            <p className='mb-3'>
              <Skeleton width={80} />
            </p>
            <div className='flex gap-2'>
              <Skeleton width={80} height={32} />
              <Skeleton width={80} height={32} />
            </div>
          </section>
        </Card>

        {/* Widget 2 */}
        <Card>
          <section>
            <h2 className='text-xl font-semibold mb-3'>
              <Skeleton width={130} />
            </h2>
            <p className='text-xs'>
              <Skeleton count={3} />
            </p>
          </section>
        </Card>

        {/* Widget 3 */}
        <Card>
          <section>
            <h2 className='text-xl font-semibold mb-3'>
              <Skeleton width={220} />
            </h2>
            <div className='flex flex-col gap-2'>
              <Skeleton height={40} />
              <Skeleton width={180} height={40} />
            </div>
          </section>
        </Card>
      </div>
      )
    }
    
    return (
        <div className='text-[18px] p-5 my-8 mx-auto font-sans grid gap-[30px] justify-items-center'>
      <h1 className='text-3xl font-bold'>Phase 12: Completing the Loop</h1>

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
            {error || message} 
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

      <Card>
          <SubmitWidget />
      </Card>

      <Card>
          <RecentSubmissions />
      </Card>
    </div>
    )
}