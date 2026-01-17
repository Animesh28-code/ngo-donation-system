import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { userAPI } from '../services/api'

const BACKEND_URL = 'http://localhost:5000'

export default function DonationForm({ user }) {
  const navigate = useNavigate()
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const startPayHerePayment = async (donationData) => {
    try {
      setSuccess('⏳ Initializing PayHere payment...')
      const url = `${BACKEND_URL}/api/payhere/init`
      console.log('🔗 Calling URL:', url)

      // Call backend to get payment object with hash
      const res = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          amount: donationData.amount,
          items: 'NGO Donation',
          donor: {
            first_name: user.name.split(' ')[0] || 'Donor',
            last_name: user.name.split(' ').slice(1).join(' ') || user.name,
            email: user.email,
            phone: user.phone || '',
            address: donationData.address || '',
            city: donationData.city || '',
          },
        }),
      })

      if (!res.ok) {
        // Get raw response to debug
        const text = await res.text()
        console.error('❌ Response status:', res.status)
        console.error('❌ Response body (first 500 chars):', text.substring(0, 500))
        
        // Try to parse as JSON
        let errData
        try {
          errData = JSON.parse(text)
        } catch {
          errData = { message: `Server error (${res.status}): ${text.substring(0, 200)}` }
        }
        throw new Error(errData.message || 'Failed to initialize payment')
      }

      const payment = await res.json()
      console.log('✅ Payment object received:', payment)

      // Check if PayHere is loaded
      if (!window.payhere) {
        throw new Error('PayHere library not loaded. Please refresh the page.')
      }

      setSuccess('⏳ Opening PayHere payment gateway...')

      // Handle payment completion
      window.payhere.onCompleted = function (orderId) {
        console.log('✅ Payment completed. Order ID: ' + orderId)
        setSuccess('⏳ Payment processing, please wait for confirmation...')
        // Redirect to processing page to poll status
        setTimeout(() => {
          navigate(`/payment/processing?order_id=${orderId}`)
        }, 500)
      }

      // Handle payment dismissal
      window.payhere.onDismissed = function () {
        console.log('⚠️ Payment dismissed by user')
        setError('Payment cancelled by user')
        setLoading(false)
        setSuccess('')
      }

      // Handle payment error
      window.payhere.onError = function (error) {
        console.error('❌ Payment error:', error)
        setError('Payment error: ' + error)
        setLoading(false)
        setSuccess('')
      }

      // Start PayHere payment
      window.payhere.startPayment(payment)

    } catch (err) {
      console.error('PayHere integration error:', err)
      setError(err.message || 'Failed to initialize payment')
      setLoading(false)
      setSuccess('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (!amount || amount < 30) {
        setError('Please enter a valid amount (minimum LKR 30)')
        setLoading(false)
        return
      }

      // Start PayHere payment
      await startPayHerePayment({
        amount: parseFloat(amount),
      })

    } catch (err) {
      console.error('Donation form error:', err)
      setError(err.message || 'An error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="form-container">
      <h1>Make a Donation</h1>
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="amount">Donation Amount (LKR)</label>
          <input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            placeholder="Enter amount (minimum LKR 30)"
            min="30"
            step="1"
          />
        </div>

        <div className="alert alert-info">
          <strong>PayHere Sandbox Payment:</strong> You will be redirected to PayHere to complete your donation securely.
          Use test card: 4111111111111111 (exp: 12/26, CVV: 123)
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Processing...' : 'Donate Now'}
        </button>
      </form>

      <p style={{ marginTop: '1rem', textAlign: 'center' }}>
        <button
          type="button"
          className="btn btn-link"
          style={{ padding: 0, border: 'none', background: 'none', color: '#007bff', textDecoration: 'underline', cursor: 'pointer' }}
          onClick={() => navigate('/user/donations')}
        >
          View Donation History
        </button>
      </p>
    </div>
  )
}
