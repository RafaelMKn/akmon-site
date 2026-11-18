import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// ?movimento=forcar: revisão da animação mesmo com "reduzir movimento" ligado no sistema
if (new URLSearchParams(window.location.search).get('movimento') === 'forcar') {
  document.documentElement.classList.add('movimento-forcado')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
