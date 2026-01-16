import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import Login from './pages/Login'
import Register from './pages/Register'
import UserDashboard from './pages/UserDashboard'
import AdminDashboard from './pages/AdminDashboard'
import DonationForm from './pages/DonationForm'
import DonationHistory from './pages/DonationHistory'
import PaymentProcessing from './pages/PaymentProcessing'

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [user, setUser] = useState(null)

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [token])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }

  const ProtectedRoute = ({ children, requiredRole = null }) => {
    if (!token) {
      return <Navigate to="/login" replace />
    }
    if (requiredRole && user?.role !== requiredRole) {
      return <Navigate to="/login" replace />
    }
    return children
  }

  return (
    <Router>
      <nav className="navbar">
        <div className="navbar-container">
          <div className="navbar-brand">NGO Donation System</div>
          {token && (
            <div className="navbar-menu">
              {user?.role === 'ADMIN' ? (
                <>
                  <span className="user-info">Admin: {user?.name}</span>
                  <button onClick={handleLogout} className="logout-btn">Logout</button>
                </>
              ) : (
                <>
                  <span className="user-info">Welcome: {user?.name}</span>
                  <button onClick={handleLogout} className="logout-btn">Logout</button>
                </>
              )}
            </div>
          )}
        </div>
      </nav>

      <Routes>
        <Route path="/login" element={<Login setToken={setToken} setUser={setUser} />} />
        <Route path="/register" element={<Register setToken={setToken} setUser={setUser} />} />
        
        <Route 
          path="/user/dashboard" 
          element={
            <ProtectedRoute requiredRole="USER">
              <UserDashboard user={user} />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/user/donate" 
          element={
            <ProtectedRoute requiredRole="USER">
              <DonationForm user={user} />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/user/donations" 
          element={
            <ProtectedRoute requiredRole="USER">
              <DonationHistory user={user} />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/payment/processing" 
          element={
            <ProtectedRoute>
              <PaymentProcessing />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminDashboard user={user} />
            </ProtectedRoute>
          } 
        />

        <Route path="/" element={<Navigate to={token ? (user?.role === 'ADMIN' ? '/admin/dashboard' : '/user/dashboard') : '/login'} replace />} />
      </Routes>
    </Router>
  )
}

export default App
