import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@fontsource-variable/mona-sans/index.css'
import '@fontsource-variable/hubot-sans/index.css'
import '@fontsource/martian-mono/400.css'
import '@fontsource/martian-mono/500.css'

import { App } from './App.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
