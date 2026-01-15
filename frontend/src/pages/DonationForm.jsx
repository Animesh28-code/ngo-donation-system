import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { userAPI, paymentAPI } from '../services/api'

export default function DonationForm({ user }) {
  const navigate = useNavigate()
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (!amount || amount < 1) {
        setError('Please enter a valid amount (minimum 1)')
        setLoading(false)
        return
      }

      // Step 1: Create donation record with PENDING status
      const donationResponse = await userAPI.createDonation({
        amount: parseFloat(amount),
      })

      const donation = donationResponse.data

      // Step 2: Initiate payment through gateway
      // In production, this would redirect to Razorpay/Stripe/PayPal checkout
      setSuccess('⏳ Redirecting to payment gateway...')

      // For now, simulate payment verification
      // In production: gateway returns paymentId after user completes payment
      setTimeout(async () => {
        try {
          // Step 3: Verify payment (in production, after user returns from gateway)
          const verifyResponse = await paymentAPI.verifyPayment({
            transactionId: donation.transactionId,
            paymentId: 'test_payment_' + Date.now(),
            signature: 'test_signature',
          })

          if (verifyResponse.data.donation?.status === 'SUCCESS') {
            setSuccess('✅ Payment verified successfully! Donation completed.')
            setTimeout(() => {
              navigate('/user/donations')
            }, 1500)
          }
        } catch (verifyErr) {
          setError('Payment verification failed: ' + verifyErr.response?.data?.message)
          setLoading(false)
        }
      }, 2000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create donation. Please try again.')
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
          <label htmlFor="amount">Donation Amount (₹)</label>
          <input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            placeholder="Enter amount (minimum ₹1)"
            min="1"
            step="1"
          />
        </div>

        <div className="alert alert-info">
          <strong>Note:</strong> Your donation record will be saved regardless of payment outcome.
          You can track the status of your donation in your donation history.
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Processing...' : 'Proceed to Payment'}
        </button>
      </form>

      <p style={{ marginTop: '1rem', textAlign: 'center' }}>
        <a href="/user/donations">View Donation History</a>
      </p>
    </div>
  )
}
