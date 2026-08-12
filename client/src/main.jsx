import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from "react-router";
import { Toaster } from "react-hot-toast";
import { warmBackend } from './api/axios.js'

// Kick the sleeping Render services awake as early as possible — before React
// even mounts — so their cold start overlaps with the first page render.
warmBackend()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Toaster />
    </BrowserRouter>
  </StrictMode>,
)
