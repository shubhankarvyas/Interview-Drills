import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { authAPI } from './api'
import LandingPage from './pages/LandingPage'
import Dashboard from './pages/Dashboard'
import DrillPage from './pages/DrillPage'
import HistoryPage from './pages/HistoryPage'
import Navbar from './components/Navbar'
import { AuthContext } from './contexts/AuthContext'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const location = useLocation()

  useEffect(() => {
    checkAuth()
  }, [])

  // Re-check auth when navigating to dashboard (after OAuth redirect)
  useEffect(() => {
    if (location.pathname === '/dashboard' && !user) {
      checkAuth()
    }
  }, [location.pathname, user])

  const checkAuth = async () => {
    try {
      const response = await authAPI.me()
      setUser(response.data)
    } catch (error) {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await authAPI.logout()
      setUser(null)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const authContextValue = {
    user,
    logout: handleLogout,
    login: (userData) => setUser(userData)
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass rounded-2xl p-8 text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-white/80">Loading your experience...</p>
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={authContextValue}>
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="floating-orb w-64 h-64 -top-32 -left-32" />
        <div className="floating-orb w-96 h-96 top-1/4 right-0" style={{ animationDelay: '1s' }} />
        <div className="floating-orb w-48 h-48 bottom-0 left-1/4" style={{ animationDelay: '2s' }} />
      </div>

      <Navbar />
      
      <div className="container fade-in">
        <Routes>
          <Route 
            path="/" 
            element={user ? <Navigate to="/dashboard" /> : <LandingPage />} 
          />
          <Route 
            path="/dashboard" 
            element={user ? <Dashboard /> : <Navigate to="/" />} 
          />
          <Route 
            path="/drill/:id" 
            element={user ? <DrillPage /> : <Navigate to="/" />} 
          />
          <Route 
            path="/history" 
            element={user ? <HistoryPage /> : <Navigate to="/" />} 
          />
        </Routes>
      </div>
    </AuthContext.Provider>
  )
}

export default App
