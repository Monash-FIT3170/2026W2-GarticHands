import { useState } from 'react'
import './FormWidget.css'

function FormWidget() {
  const [value, setValue] = useState('')
  const [submitted, setSubmitted] = useState('')

  function handleSubmit() {
    setSubmitted(value)
    setValue('')
  }

  return (
    <div className="form-widget">
      <h2>Form Input</h2>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Type something..."
      />
      <button onClick={handleSubmit}>Submit</button>
      {submitted && <p>Last submitted: {submitted}</p>}
    </div>
  )
}

export default FormWidget