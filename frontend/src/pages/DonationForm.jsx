import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const BACKEND_URL = 'http://localhost:5000'

export default function DonationForm({ user }) {
  const navigate = useNavigate()
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [showBankForm, setShowBankForm] = useState(false)
  const [showPaymentMethods, setShowPaymentMethods] = useState(false)
  const [cardholderName, setCardholderName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [cvv, setCvv] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cardErrors, setCardErrors] = useState({})

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

  const validateCardForm = () => {
    const errors = {}
    if (!cardholderName.trim()) {
      errors.cardholderName = 'The card holder name is required'
    }
    if (!cardNumber.replace(/\s/g, '')) {
      errors.cardNumber = 'Credit Card Number is required'
    } else if (cardNumber.replace(/\s/g, '').length < 13) {
      errors.cardNumber = 'Invalid card number'
    }
    if (!cvv || cvv.length < 3) {
      errors.cvv = 'CVV is required'
    }
    if (!expiry || !expiry.includes('/')) {
      errors.expiry = 'Expiry MM/YY is required'
    }
    setCardErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCardNumberChange = (e) => {
    let value = e.target.value.replace(/\s/g, '')
    if (value.length > 19) value = value.slice(0, 19)
    const formatted = value.replace(/(\d{4})/g, '$1 ').trim()
    setCardNumber(formatted)
  }

  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, '')
    if (value.length >= 2) {
      value = value.slice(0, 2) + '/' + value.slice(2, 4)
    }
    setExpiry(value)
  }

  const handleCVVChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4)
    setCvv(value)
  }

  const handleProceedToPayHere = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      if (!amount || amount < 30) {
        setError('Please enter a valid amount (minimum LKR 30)')
        return
      }
      setShowPaymentMethods(true)
    } catch (err) {
      setError(err.message || 'An error occurred')
    }
  }

  const handleSelectPaymentMethod = (method) => {
    if (method === 'bank-card') {
      setShowPaymentMethods(false)
      setShowBankForm(true)
    } else {
      setError(`${method} payment method coming soon`)
    }
  }

  const handleBackFromPaymentMethods = () => {
    setShowPaymentMethods(false)
    setError('')
  }

  const handleCardPayment = async (e) => {
    e.preventDefault()
    setCardErrors({})

    if (!validateCardForm()) {
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await startPayHerePayment({
        amount: parseFloat(amount),
        cardholderName,
        cardNumber: cardNumber.replace(/\s/g, ''),
        cvv,
        expiry,
      })
    } catch (err) {
      console.error('Payment error:', err)
      setError(err.message || 'An error occurred')
      setLoading(false)
    }
  }

  const handleBackFromCard = () => {
    setShowBankForm(false)
    setShowPaymentMethods(true)
    setCardholderName('')
    setCardNumber('')
    setCvv('')
    setExpiry('')
    setCardErrors({})
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    await handleProceedToPayHere(e)
  }

  if (showPaymentMethods) {
    return (
      <div className="form-container">
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
          <button
            onClick={handleBackFromPaymentMethods}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              marginRight: '10px',
              padding: 0
            }}
          >
            ← 
          </button>
          <div style={{ flex: 1 }}>
            <div style={{
              backgroundColor: '#007bff',
              color: 'white',
              padding: '15px',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{ width: '50px', height: '50px', backgroundColor: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '24px' }}>💳</span>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <h3 style={{ margin: 0, fontSize: '14px' }}>Student Project</h3>
                  <p style={{ margin: 0, fontSize: '12px' }}>NGO Donation</p>
                </div>
              </div>
              <h2 style={{ marginTop: '10px', marginBottom: 0 }}>Rs. {parseFloat(amount).toFixed(2)}</h2>
            </div>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <h3 style={{ marginTop: '30px', marginBottom: '20px', fontSize: '16px', fontWeight: '600' }}>Pay with</h3>

        {/* Bank Card Section */}
        <div style={{ marginBottom: '30px' }}>
          <p style={{ color: '#999', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '15px' }}>Bank Card</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px' }}>
            <button
              onClick={() => handleSelectPaymentMethod('bank-card')}
              style={{
                padding: '20px 15px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: '#fff',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#fff'}
            >
              <span style={{ fontSize: '28px', marginBottom: '8px' }}>💳</span>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#333' }}>VISA</span>
            </button>

            <button
              onClick={() => handleSelectPaymentMethod('bank-card')}
              style={{
                padding: '20px 15px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: '#fff',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#fff'}
            >
              <span style={{ fontSize: '28px', marginBottom: '8px' }}>🟠🔴</span>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#333' }}>Mastercard</span>
            </button>

            <button
              onClick={() => handleSelectPaymentMethod('bank-card')}
              style={{
                padding: '20px 15px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: '#fff',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#fff'}
            >
              <span style={{ fontSize: '28px', marginBottom: '8px' }}>💎</span>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#333' }}>Amex</span>
            </button>

            <button
              onClick={() => handleSelectPaymentMethod('discover')}
              style={{
                padding: '20px 15px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: '#fff',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#fff'}
            >
              <span style={{ fontSize: '28px', marginBottom: '8px' }}>🔍</span>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#333' }}>Discover</span>
            </button>

            <button
              onClick={() => handleSelectPaymentMethod('diners')}
              style={{
                padding: '20px 15px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: '#fff',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#fff'}
            >
              <span style={{ fontSize: '28px', marginBottom: '8px' }}>🔷</span>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#333' }}>Diners</span>
            </button>
          </div>
        </div>

        {/* Other Payment Methods */}
        <div>
          <p style={{ color: '#999', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '15px' }}>Other</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px' }}>
            {[
              { name: 'Genie', emoji: '✨' },
              { name: 'ezCash', emoji: '💰' },
              { name: 'mCash', emoji: '📱' },
              { name: 'Flipp', emoji: '🎫' },
              { name: 'Temple', emoji: '🛕' },
              { name: 'Q', emoji: 'Q' },
              { name: 'iPay', emoji: '💳' }
            ].map((method, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectPaymentMethod(method.name.toLowerCase())}
                style={{
                  padding: '20px 15px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s',
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#fff'}
              >
                <span style={{ fontSize: '28px', marginBottom: '8px' }}>{method.emoji}</span>
                <span style={{ fontSize: '11px', fontWeight: '600', color: '#333' }}>{method.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (showBankForm) {
    return (
      <div className="form-container">
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
          <button
            onClick={handleBackFromCard}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              marginRight: '10px',
              padding: 0
            }}
          >
            ← 
          </button>
          <h2 style={{ margin: 0 }}>Bank Card</h2>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div style={{
          backgroundColor: '#007bff',
          color: 'white',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '5px' }}>💳 Student Project</h3>
          <p style={{ marginTop: 0, marginBottom: '10px' }}>NGO Donation</p>
          <h2 style={{ marginTop: 0 }}>Rs. {parseFloat(amount).toFixed(2)}</h2>
        </div>

        <form onSubmit={handleCardPayment}>
          <div className="form-group">
            <label htmlFor="cardholderName">Name on Card</label>
            <input
              id="cardholderName"
              type="text"
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value)}
              placeholder="Name on Card"
              style={{ borderColor: cardErrors.cardholderName ? '#dc3545' : '#ddd' }}
            />
            {cardErrors.cardholderName && (
              <p style={{ color: '#dc3545', fontSize: '12px', marginTop: '5px' }}>
                {cardErrors.cardholderName}
              </p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="cardNumber">Credit Card Number</label>
            <input
              id="cardNumber"
              type="text"
              value={cardNumber}
              onChange={handleCardNumberChange}
              placeholder="Credit Card Number"
              style={{ borderColor: cardErrors.cardNumber ? '#dc3545' : '#ddd' }}
            />
            {cardErrors.cardNumber && (
              <p style={{ color: '#dc3545', fontSize: '12px', marginTop: '5px' }}>
                {cardErrors.cardNumber}
              </p>
            )}
            <p style={{ color: '#666', fontSize: '12px', marginTop: '5px', marginBottom: 0 }}>
              Test: 4916 2175 0161 1292
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="form-group">
              <label htmlFor="cvv">CVV</label>
              <input
                id="cvv"
                type="text"
                value={cvv}
                onChange={handleCVVChange}
                placeholder="CVV"
                maxLength="4"
                style={{ borderColor: cardErrors.cvv ? '#dc3545' : '#ddd' }}
              />
              {cardErrors.cvv && (
                <p style={{ color: '#dc3545', fontSize: '12px', marginTop: '5px' }}>
                  {cardErrors.cvv}
                </p>
              )}
              <p style={{ color: '#666', fontSize: '12px', marginTop: '5px', marginBottom: 0 }}>
                Test: 123
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="expiry">Expiry MM/YY</label>
              <input
                id="expiry"
                type="text"
                value={expiry}
                onChange={handleExpiryChange}
                placeholder="MM/YY"
                maxLength="5"
                style={{ borderColor: cardErrors.expiry ? '#dc3545' : '#ddd' }}
              />
              {cardErrors.expiry && (
                <p style={{ color: '#dc3545', fontSize: '12px', marginTop: '5px' }}>
                  {cardErrors.expiry}
                </p>
              )}
              <p style={{ color: '#666', fontSize: '12px', marginTop: '5px', marginBottom: 0 }}>
                Test: 12/25
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '15px',
              backgroundColor: loading ? '#ccc' : '#ffc107',
              color: '#000',
              border: 'none',
              fontSize: '16px',
              fontWeight: 'bold',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '20px'
            }}
          >
            {loading ? '⏳ Processing...' : 'Pay'}
          </button>
        </form>

        <p style={{
          marginTop: '20px',
          fontSize: '12px',
          color: '#888',
          textAlign: 'center'
        }}>
          PayHere is a Central Bank approved Secure Payment Gateway Service
        </p>
      </div>
    )
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
          className="btn btn-primary"
          style={{ 
            width: '100%', 
            padding: '12px',
            fontSize: '16px',
            fontWeight: 'bold',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          💳 Proceed to PayHere
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
