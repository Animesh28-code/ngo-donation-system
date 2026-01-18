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
  const [cardType, setCardType] = useState('visa')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCVV, setCardCVV] = useState('')
  const [cardholderName, setCardholderName] = useState('')
  const [showCardForm, setShowCardForm] = useState(false)

  const handleCardNumberChange = (e) => {
    const value = e.target.value.replace(/\s/g, '')
    const formatted = value.replace(/(\d{4})(?=\d)/g, '$1 ')
    setCardNumber(formatted)
  }

  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, '')
    if (value.length >= 2) {
      value = value.slice(0, 2) + '/' + value.slice(2, 4)
    }
    setCardExpiry(value)
  }

  const handleCVVChange = (e) => {
    setCardCVV(e.target.value.replace(/\D/g, '').slice(0, 4))
  }

  const validateCardDetails = () => {
    if (!cardNumber.replace(/\s/g, '') || cardNumber.replace(/\s/g, '').length < 13) {
      setError('Please enter a valid card number')
      return false
    }
    if (!cardExpiry || cardExpiry.length < 5) {
      setError('Please enter card expiry (MM/YY)')
      return false
    }
    if (!cardCVV || cardCVV.length < 3) {
      setError('Please enter card CVV')
      return false
    }
    if (!cardholderName.trim()) {
      setError('Please enter cardholder name')
      return false
    }
    return true
  }

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
      console.log('✅ merchant_id:', payment.merchant_id)
      console.log('✅ order_id:', payment.order_id)
      console.log('✅ amount:', payment.amount)
      console.log('✅ hash:', payment.hash)

      // Check if PayHere is loaded
      if (!window.payhere) {
        throw new Error('PayHere library not loaded. Please refresh the page.')
      }

      setSuccess('⏳ Opening PayHere payment gateway...')

      // Handle payment completion
      window.payhere.onCompleted = async function (orderId) {
        console.log('✅ Payment completed. Order ID: ' + orderId)
        setSuccess('⏳ Processing payment, simulating webhook...')
        
        // Call test webhook to simulate PayHere notification (70% success)
        try {
          const webhookRes = await fetch(`${BACKEND_URL}/api/payhere/notify-test`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_id: orderId })
          })
          const webhookData = await webhookRes.json()
          console.log('✅ Webhook response:', webhookData)
          setSuccess(`✅ Payment ${webhookData.status}! Redirecting...`)
        } catch (err) {
          console.error('Webhook call failed:', err)
        }
        
        // Redirect to processing page to poll status
        setTimeout(() => {
          navigate(`/payment/processing?order_id=${orderId}`)
        }, 1500)
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

      // Start PayHere payment with all required fields
      console.log('🚀 Starting PayHere payment with:', payment)
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

    // Check if card form is shown and validate
    if (showCardForm) {
      if (!validateCardDetails()) {
        setLoading(false)
        return
      }
    }

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

        {/* Payment Method Selection */}
        <div className="form-group">
          <label htmlFor="cardType">Payment Method</label>
          <select
            id="cardType"
            value={cardType}
            onChange={(e) => {
              setCardType(e.target.value)
              setShowCardForm(!showCardForm)
            }}
            style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            <option value="visa">💳 Visa Card</option>
            <option value="mastercard">🏦 Mastercard</option>
            <option value="amex">🔷 American Express</option>
          </select>
        </div>

        {/* Card Details Form */}
        {showCardForm && (
          <div style={{ border: '1px solid #e0e0e0', padding: '15px', borderRadius: '4px', marginBottom: '1rem', backgroundColor: '#f9f9f9' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#333' }}>💳 Enter Card Details</h3>

            {/* Cardholder Name */}
            <div className="form-group">
              <label htmlFor="cardholderName">Cardholder Name</label>
              <input
                id="cardholderName"
                type="text"
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value)}
                placeholder="John Doe"
                required={showCardForm}
              />
            </div>

            {/* Card Number */}
            <div className="form-group">
              <label htmlFor="cardNumber">Card Number</label>
              <input
                id="cardNumber"
                type="text"
                value={cardNumber}
                onChange={handleCardNumberChange}
                placeholder="1234 5678 9012 3456"
                maxLength="19"
                required={showCardForm}
              />
              <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                {cardType === 'visa' && '💳 Visa: 4916 2175 0161 1292 (test card)'}
                {cardType === 'mastercard' && '🏦 Mastercard: 5307 7321 2553 1191 (test card)'}
                {cardType === 'amex' && '🔷 AMEX: 3467 8100 5510 225 (test card)'}
              </small>
            </div>

            {/* Expiry & CVV */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label htmlFor="cardExpiry">Expiry (MM/YY)</label>
                <input
                  id="cardExpiry"
                  type="text"
                  value={cardExpiry}
                  onChange={handleExpiryChange}
                  placeholder="12/26"
                  maxLength="5"
                  required={showCardForm}
                />
              </div>
              <div className="form-group">
                <label htmlFor="cardCVV">CVV</label>
                <input
                  id="cardCVV"
                  type="text"
                  value={cardCVV}
                  onChange={handleCVVChange}
                  placeholder="123"
                  maxLength="4"
                  required={showCardForm}
                />
              </div>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#999', marginTop: '1rem' }}>
              🔒 Your card details are secure and handled by PayHere's encrypted payment gateway.
            </p>
          </div>
        )}

        <div className="alert alert-info">
          <strong>🔒 Secure Payment:</strong> You will be redirected to PayHere's secure payment gateway to complete your donation safely.
          {showCardForm && ' Your card details above are for reference; PayHere will handle the final transaction.'}
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
