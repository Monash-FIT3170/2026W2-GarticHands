import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import GarticHands from './GarticHands.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GarticHands />
  </StrictMode>,
)