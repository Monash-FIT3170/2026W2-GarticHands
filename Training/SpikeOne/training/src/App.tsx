import CounterWidget from './components/CounterWidget'
import TextWidget from './components/TextWidget'
import FormWidget from './components/FormWidget'

function App() {
  return (
    <div style={{ display: 'flex', gap: '20px', padding: '20px' }}>
      <CounterWidget />
      <TextWidget />
      <FormWidget />
    </div>
  )
}

export default App