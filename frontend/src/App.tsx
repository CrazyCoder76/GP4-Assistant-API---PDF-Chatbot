import { Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import Dashboard from './pages/dashboard/dashboard'
import Login from './pages/auth/login'
import Register from './pages/auth/register'
import AuthRoute from './components/authRoute'
import NotFound from './pages/auth/notfound'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { ToastProvider } from './components/toast.tsx'
import { useEffect, useState } from 'react'
function App() {
  const [theme, setTheme] = useState('')
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) setTheme(savedTheme)
    else setTheme('winter')
  }, [])
  return (
    <div data-theme={theme}>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID
      }>
        <ToastProvider>
          <Router>
            <Routes>
              <Route path='/' element={<AuthRoute><Dashboard /></AuthRoute>} />
              <Route path='/login' element={<Login />} />
              <Route path='/register' element={<Register />} />
              <Route path='*' element={<NotFound />} />
            </Routes>
          </Router>
          <div className='fixed right-1 top-1'>
            <label className="flex cursor-pointer gap-2 items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" /></svg>
              <input type="checkbox"
                className="toggle"
                onClick={() => {
                  setTheme(cur => {
                    const newTheme = cur == 'winter' ? 'dim' : 'winter'
                    localStorage.setItem('theme', newTheme)
                    return newTheme
                  })
                }}
              />
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
            </label>
          </div>
        </ToastProvider>
      </GoogleOAuthProvider >
    </div>
  )
}

export default App
