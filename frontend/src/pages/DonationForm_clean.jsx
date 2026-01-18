import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const BACKEND_URL = 'http://localhost:5000'

export default function DonationForm({ user }) {
  const navigate = useNavigate()
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const startPayHerePayment = async (donationData) => {
    try {
      setSuccess('⏳ Initializing PayHere payment gateway...')
      const url = `${BACKEND_URL}/api/payhere/init`
      console.log('🔗 Calling PayHere Init:', url)

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
        const text = await res.text()
        console.error('❌ Response status:', res.status)
        let errData
        try {
          errData = JSON.parse(text)
        } catch {
          errData = { message: `Server error (${res.status})` }
        }
        throw new Error(errData.message || 'Failed to initialize payment')
      }

      const payment = await res.json()
      console.log('✅ Payment object:', payment)

      if (!window.payhere) {
        throw new Error('PayHere library not loaded. Please refresh the page.')
      }

      setSuccess('⏳ Opening PayHere payment gateway...')

      window.payhere.onCompleted = async function (orderId) {
        console.log('✅ Payment completed. Order ID: ' + orderId)
        setSuccess('⏳ Processing payment...')
        
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
        
        setTimeout(() => {
          navigate(`/payment/processing?order_id=${orderId}`)
        }, 1500)
      }

      window.payhere.onDismissed = function () {
        console.log('⚠️ Payment dismissed by user')
        setError('Payment cancelled by user')
        setLoading(false)
        setSuccess('')
      }

      window.payhere.onError = function (error) {
        console.error('❌ Payment error:', error)
        setError('Payment error: ' + error)
        setLoading(false)
        setSuccess('')
      }

      console.log('🚀 Launching PayHere gateway')
      window.payhere.startPayment(payment)

    } catch (err) {
      console.error('PayHere error:', err)
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

      await startPayHerePayment({
        amount: parseFloat(amount),
      })

    } catch (err) {
      console.error('Donation error:', err)
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

        <div style={{ 
          padding: '20px', 
          backgroundColor: '#f0f7ff', 
          borderRadius: '8px', 
          border: '2px solid #007bff',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <h3 style={{ marginTop: 0, color: '#0056b3' }}>💳 PayHere Secure Payment</h3>
          <p style={{ marginBottom: '0.5rem', color: '#333' }}>
            ✅ Multiple payment methods available
          </p>
          <p style={{ marginBottom: '1rem', color: '#666', fontSize: '14px' }}>
            Bank Cards • Mobile Money • eWallets • Digital Banking
          </p>
          <p style={{ marginBottom: 0, color: '#888', fontSize: '12px' }}>
            🔒 256-bit SSL encrypted • PCI DSS Compliant
          </p>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="btn btn-primary"
          style={{ 
            width: '100%', 
            padding: '12px',
            fontSize: '16px',
            fontWeight: 'bold',
            backgroundColor: loading ? '#ccc' : '#007bff',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '⏳ Processing...' : '💳 Proceed to PayHere'}
        </button>
      </form>

      <p style={{ 
        marginTop: '20px', 
        fontSize: '13px', 
        color: '#666', 
        textAlign: 'center',
        lineHeight: '1.6'
      }}>
        After clicking "Proceed to PayHere", you'll be taken to a<br/>
        <strong>secure PayHere payment page</strong> where you can choose<br/>
        from multiple payment options including cards, mobile money, and more.
      </p>
    </div>
  )
}
