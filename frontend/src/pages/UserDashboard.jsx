import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { userAPI } from '../services/api'

export default function UserDashboard({ user }) {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await userAPI.getProfile()
      setProfile(response.data)
      setError('')
    } catch (err) {
      setError('Failed to load profile')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="container"><div className="loading">Loading...</div></div>
  }

  return (
    <div className="container">
      <h1>User Dashboard</h1>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="dashboard-grid">
        <Link to="/user/donate" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ cursor: 'pointer', transition: 'transform 0.2s' }}>
            <div className="card-title">💳 Make a Donation</div>
            <p>Contribute to the cause</p>
          </div>
        </Link>

        <Link to="/user/donations" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ cursor: 'pointer', transition: 'transform 0.2s' }}>
            <div className="card-title">📋 Donation History</div>
            <p>View your donations</p>
          </div>
        </Link>
      </div>

      <div className="card">
        <div className="card-title">Your Registration Details</div>
        <div className="card-content">
          <p><strong>Name:</strong> {profile?.registration?.userId?.name || user?.name || 'N/A'}</p>
          <p><strong>Email:</strong> {profile?.registration?.userId?.email || user?.email || 'N/A'}</p>
          <p><strong>Phone:</strong> {profile?.registration?.userId?.phone || 'N/A'}</p>
          <p><strong>Address:</strong> {profile?.registration?.address || 'N/A'}</p>
          <p><strong>City:</strong> {profile?.registration?.city || 'N/A'}</p>
          <p><strong>State:</strong> {profile?.registration?.state || 'N/A'}</p>
          <p><strong>Pincode:</strong> {profile?.registration?.pincode || 'N/A'}</p>
          <p><strong>Cause:</strong> {profile?.registration?.cause || 'N/A'}</p>
        </div>
      </div>
    </div>
  )
}
