import { useState, useEffect } from 'react'
import { adminAPI } from '../services/api'

export default function AdminDashboard({ user }) {
  const [dashboard, setDashboard] = useState({
    totalRegistrations: 0,
    totalDonations: 0,
    totalAmount: 0,
    registrations: [],
    donations: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  const [filters, setFilters] = useState({ search: '', status: '' })

  useEffect(() => {
    fetchDashboard()
  }, [filters])

  const fetchDashboard = async () => {
    try {
      const [dashRes, regsRes, donRes] = await Promise.all([
        adminAPI.getDashboard(),
        adminAPI.getRegistrations(filters),
        adminAPI.getDonations(filters),
      ])

      setDashboard({
        totalRegistrations: dashRes.data?.totalRegistrations || 0,
        totalDonations: dashRes.data?.totalDonations || 0,
        totalAmount: dashRes.data?.totalAmount || 0,
        registrations: regsRes.data || [],
        donations: donRes.data || [],
      })
      setError('')
    } catch (err) {
      setError('Failed to load dashboard data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const response = await adminAPI.exportRegistrations()
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'registrations.csv')
      document.body.appendChild(link)
      link.click()
      link.parentChild.removeChild(link)
    } catch (err) {
      alert('Export failed: ' + (err.response?.data?.message || err.message))
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
      <h1>Admin Dashboard</h1>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Statistics Cards */}
      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-label">Total Registrations</div>
          <div className="stat-number">{dashboard.totalRegistrations}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Donations</div>
          <div className="stat-number">{dashboard.totalDonations}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Amount Received</div>
          <div className="stat-number">₹{dashboard.totalAmount}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '2px solid #eee' }}>
          <button
            onClick={() => setActiveTab('registrations')}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              background: activeTab === 'registrations' ? '#1e3c72' : '#f5f5f5',
              color: activeTab === 'registrations' ? 'white' : '#333',
              cursor: 'pointer',
              borderBottom: activeTab === 'registrations' ? '3px solid #1e3c72' : 'none',
            }}
          >
            Registrations
          </button>
          <button
            onClick={() => setActiveTab('donations')}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              background: activeTab === 'donations' ? '#1e3c72' : '#f5f5f5',
              color: activeTab === 'donations' ? 'white' : '#333',
              cursor: 'pointer',
              borderBottom: activeTab === 'donations' ? '3px solid #1e3c72' : 'none',
            }}
          >
            Donations
          </button>
        </div>

        {/* Registrations Tab */}
        {activeTab === 'registrations' && (
          <>
            <div className="filter-section">
              <div className="form-group">
                <label>Search by Name/Email</label>
                <input
                  type="text"
                  placeholder="Search..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>
              <button onClick={handleExport} className="btn btn-success">
                📥 Export CSV
              </button>
            </div>

            {dashboard.registrations.length === 0 ? (
              <p>No registrations found.</p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>City</th>
                      <th>State</th>
                      <th>Cause</th>
                      <th>Registered On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.registrations
                      .filter((reg) => {
                        const searchLower = filters.search.toLowerCase()
                        return (
                          !filters.search ||
                          reg.userId?.name?.toLowerCase().includes(searchLower) ||
                          reg.userId?.email?.toLowerCase().includes(searchLower) ||
                          reg.userId?.phone?.includes(filters.search) ||
                          reg.city?.toLowerCase().includes(searchLower)
                        )
                      })
                      .map((reg) => (
                      <tr key={reg._id}>
                        <td>{reg.userId?.name}</td>
                        <td>{reg.userId?.email}</td>
                        <td>{reg.userId?.phone || '-'}</td>
                        <td>{reg.city || '-'}</td>
                        <td>{reg.state || '-'}</td>
                        <td>{reg.cause || '-'}</td>
                        <td>{new Date(reg.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Donations Tab */}
        {activeTab === 'donations' && (
          <>
            <div className="filter-section">
              <div className="form-group">
                <label>Filter by Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                  <option value="">All Statuses</option>
                  <option value="SUCCESS">Success</option>
                  <option value="PENDING">Pending</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>
            </div>

            {dashboard.donations.length === 0 ? (
              <p>No donations found.</p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>User Name</th>
                      <th>Transaction ID</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Verified At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.donations
                      .filter((donation) => !filters.status || donation.status === filters.status)
                      .map((donation) => (
                      <tr key={donation._id}>
                        <td>{donation.userId?.name || 'Unknown'}</td>
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
            )}
          </>
        )}
      </div>
    </div>
  )
}
