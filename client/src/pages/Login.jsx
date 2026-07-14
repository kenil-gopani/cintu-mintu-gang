import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { toast } from 'sonner'
import Loader from '../components/common/Loader'

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const { login }   = useAuth()
  const navigate    = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
      navigate('/home')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        .background-wrapper {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-image: url('/login-bg.png');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          background-color: #fcebeb; /* Fallback base */
          padding: 2rem;
        }

        .glass-container {
          display: flex;
          max-width: 960px;
          width: 100%;
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.7);
          border-radius: 24px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.05);
          overflow: hidden;
          padding: 2rem;
          gap: 2rem;
        }

        .illustration-section {
          flex: 1.1;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 16px;
          overflow: hidden;
        }

        .family-illustration {
          max-width: 110%;
          width: 110%;
          transform: translateX(-5%);
          height: auto;
          object-fit: contain;
        }

        .form-section {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 1rem 2rem;
        }

        .title {
          font-size: 2.2rem;
          color: #112A46;
          line-height: 1.2;
          margin-bottom: 0.5rem;
          font-weight: 700;
        }

        .subtitle {
          color: #334155;
          font-size: 0.95rem;
          margin-bottom: 2rem;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .input-group {
          position: relative;
          width: 100%;
        }

        .base-input {
          width: 100%;
          padding: 14px 16px;
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.8);
          background: rgba(255, 255, 255, 0.8);
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.02);
          font-size: 1rem;
          color: #334155;
          transition: all 0.2s ease;
          outline: none;
        }

        .base-input:focus {
          border-color: #2A9D8F;
          background: #ffffff;
        }

        .base-input::placeholder {
          color: #94A3B8;
        }

        .password-group .icon-button {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #94A3B8;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .primary-button {
          width: 100%;
          padding: 14px;
          margin-top: 0.5rem;
          border-radius: 20px;
          border: none;
          background-color: #2A9D8F;
          color: white;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(42, 157, 143, 0.2);
          transition: background-color 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .primary-button:hover {
          background-color: #248277;
        }

        .primary-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .divider {
          text-align: center;
          margin: 1.5rem 0;
          position: relative;
        }

        .divider span {
          background: transparent;
          padding: 0 10px;
          color: #475569;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .social-login-group {
          display: flex;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .social-button {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: none;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .social-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        @media (max-width: 768px) {
          .glass-container {
            flex-direction: column;
            padding: 1rem;
          }
          
          .form-section {
            padding: 1rem;
          }
          
          .illustration-section {
            display: none;
          }
        }
      `}</style>
      <div className="background-wrapper">
        <div className="glass-container">
          
          <div className="illustration-section">
            <img 
              src="/family-hero.png" 
              alt="Family picnic illustration" 
              className="family-illustration"
            />
          </div>

          <div className="form-section">
            <h1 className="title">Welcome back<br />to Family Hub!</h1>
            <p className="subtitle">Organize your family's life, stay connected.</p>

            <form className="login-form" onSubmit={handleSubmit}>
              <div className="input-group">
                <input 
                  type="email" 
                  placeholder="Enter Email" 
                  className="base-input"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="input-group password-group">
                <input 
                  type={showPw ? "text" : "password"} 
                  placeholder="Password" 
                  className="base-input" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button 
                  type="button" 
                  className="icon-button" 
                  aria-label="Toggle password visibility"
                  onClick={() => setShowPw(!showPw)}
                >
                  {showPw ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>

              <button type="submit" className="primary-button" disabled={loading}>
                {loading ? <Loader scale={0.25} /> : 'Sign In'}
              </button>
            </form>

            <div className="divider">
              <span>or continue with</span>
            </div>

            <div className="social-login-group">
              <button className="social-button" aria-label="Login with Google" type="button" onClick={() => window.location.href = 'https://google.com'}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#DB4437" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#0F9D58"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#F4B400"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#4285F4"/>
                </svg>
              </button>
              <button className="social-button" aria-label="Login with Apple" type="button" onClick={() => window.location.href = 'https://apple.com'}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="black" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.05 2.27.7 2.82.7.55 0 1.71-.85 3.33-.76 1.48.06 2.6.58 3.36 1.55-2.92 1.62-2.39 5.8.55 7.02-.75 1.79-1.52 3.4-2.06 4.46zm-2.88-15.3c-.56 1.25-1.85 2.25-3.05 2.22-.19-1.29.53-2.62 1.16-3.35 1.03-1.15 2.62-1.88 3.16-1.92.17 1.21-.57 2.24-1.27 3.05z" />
                </svg>
              </button>
              <button className="social-button" aria-label="Login with Facebook" type="button" onClick={() => window.location.href = 'https://facebook.com'}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2" xmlns="http://www.w3.org/2000/svg">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </button>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
