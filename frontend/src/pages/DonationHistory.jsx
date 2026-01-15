import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { userAPI } from '../services/api'

export default function DonationHistory({ user }) {
  const [donations, setDonations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDonations()
  }, [])

  const fetchDonations = async () => {
    try {
      const response = await userAPI.listDonations()
      setDonations(response.data || [])
      setError('')
    } catch (err) {
      setError('Failed to load donations')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      'SUCCESS': 'badge-success',
      'PENDING': 'badge-warning',
      'FAILED': 'badge-danger',
    }
    return badges[status] || 'badge-info'
  }

  if (loading) {
    return <div className="container"><div className="loading">Loading...</div></div>
  }

  return (
    <div className="container">
      <h1>Your Donation History</h1>

      {error && <div className="alert alert-error">{error}</div>}

      {donations.length === 0 ? (
        <div className="card">
          <p>You haven't made any donations yet.</p>
          <Link to="/user/donate" className="btn btn-primary">
            Make Your First Donation
          </Link>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Amount (₹)</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Verified At</th>
                </tr>
              </thead>
              <tbody>
                {donations.map((donation) => (
                  <tr key={donation._id}>
                    <td>{donation.transactionId}</td>
                    <td>₹{donation.amount}</td>
                    <td>
                      <span className={`badge ${getStatusBadge(donation.status)}`}>
                        {donation.status}
                      </span>
                    </td>
                    <td>{new Date(donation.createdAt).toLocaleDateString()}</td>
                    <td>
                      {donation.verifiedAt
                        ? new Date(donation.verifiedAt).toLocaleDateString()
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
            <Link to="/user/donate" className="btn btn-success">
              Make Another Donation
            </Link>
            <Link to="/user/dashboard" className="btn btn-secondary">
              Back to Dashboard
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
