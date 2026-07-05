import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './styles/index.css'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { SocketProvider } from './context/SocketContext.jsx'
import { Toaster } from 'react-hot-toast'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <App />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3500,
                style: {
                  background: 'var(--toast-bg, #1A1A2E)',
                  color: '#E2E8F0',
                  borderRadius: '16px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  fontFamily: 'Nunito, sans-serif',
                  fontWeight: 600,
                },
                success: { iconTheme: { primary: '#4ECDC4', secondary: '#fff' } },
                error:   { iconTheme: { primary: '#FF6B6B', secondary: '#fff' } },
              }}
            />
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
)
