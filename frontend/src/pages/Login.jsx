import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authAPI } from '../services/api'

export default function Login({ setToken, setUser }) {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      console.log('🔐 Attempting login...')
      const response = await authAPI.login(formData)
      console.log('✅ Login response received:', response.status)
      console.log('Response data:', response.data)
      
      if (!response.data || !response.data.token) {
        console.error('❌ Invalid response structure:', response.data)
        setError('Invalid server response')
        setLoading(false)
        return
      }
      
      const { token, user } = response.data
      console.log('User role:', user?.role)

      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      setToken(token)
      setUser(user)

      console.log('✅ Data saved, navigating...')
      
      setTimeout(() => {
        if (user.role === 'ADMIN') {
          navigate('/admin/dashboard')
        } else {
          navigate('/user/dashboard')
        }
      }, 500)
      
    } catch (err) {
      console.error('❌ Login error caught:')
      console.error('  Error object:', err)
      console.error('  Message:', err.message)
      console.error('  Response:', err.response)
      console.error('  Request:', err.request?.status)
      
      // Set user-friendly error message
      if (err.response?.data?.message) {
        setError(err.response.data.message)
      } else if (err.response?.status === 401) {
        setError('Invalid email or password')
      } else if (err.code === 'ERR_NETWORK') {
        setError('Cannot connect to server')
      } else {
        setError('Login failed')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="form-container">
      <h1>NGO Donation System - Login</h1>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="Enter your email"
          />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            placeholder="Enter your password"
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <p style={{ marginTop: '1rem', textAlign: 'center' }}>
        Don't have an account? <Link to="/register">Register here</Link>
      </p>
    </div>
  )
}
