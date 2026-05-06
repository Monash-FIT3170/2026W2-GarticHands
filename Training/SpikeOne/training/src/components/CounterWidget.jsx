import { useState } from 'react'
import './CounterWidget.css'

function CounterWidget() {
  const [count, setCount] = useState(0)
  return (
    <div className="counter-widget">
      <h2>Counter</h2>
      <p>{count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  )
}

export default CounterWidget