import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'

const BACKEND_URL = 'http://localhost:5000'

export default function PaymentProcessing() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('PENDING')
  const [donation, setDonation] = useState(null)
  const [pollCount, setPollCount] = useState(0)
  const orderId = searchParams.get('order_id')

  useEffect(() => {
    if (!orderId) {
      navigate('/user/donations')
      return
    }

    // Poll for donation status
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(
          `${BACKEND_URL}/api/user/donations/by-order/${orderId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        )

        if (res.ok) {
          const data = await res.json()
          console.log('📊 Donation status:', data.paymentStatus)
          setDonation(data)
          setStatus(data.paymentStatus)

          // Stop polling if status is not PENDING
          if (data.paymentStatus === 'SUCCESS' || data.paymentStatus === 'FAILED') {
            clearInterval(pollInterval)
          }
        }

        setPollCount((c) => c + 1)
      } catch (err) {
        console.error('Polling error:', err)
      }
    }, 2000) // Poll every 2 seconds

    // Stop polling after 60 seconds (safety)
    const timeout = setTimeout(() => {
      clearInterval(pollInterval)
    }, 60000)

    return () => {
      clearInterval(pollInterval)
      clearTimeout(timeout)
    }
  }, [orderId, navigate])

  const handleBackToDonations = () => {
    navigate('/user/donations')
  }

  return (
    <div className="form-container">
      <h1>Payment Processing</h1>

      <div style={{ textAlign: 'center', padding: '2rem' }}>
        {status === 'PENDING' && (
          <>
            <div
              style={{
                fontSize: '3rem',
                marginBottom: '1rem',
                animation: 'spin 2s linear infinite',
              }}
            >
              ⏳
            </div>
            <p style={{ fontSize: '1.2rem', color: '#666' }}>
              Verifying your payment...
            </p>
            <p style={{ fontSize: '0.9rem', color: '#999' }}>
              Please don't close this page. (Checked {pollCount} times)
            </p>
          </>
        )}

        {status === 'SUCCESS' && (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
            <p style={{ fontSize: '1.5rem', color: '#4CAF50' }}>
              <strong>Donation Successful!</strong>
            </p>
            <p style={{ color: '#666', marginBottom: '1.5rem' }}>
              Thank you for your generous donation of LKR {donation?.amount}.
            </p>
            <p style={{ color: '#999', fontSize: '0.9rem' }}>
              Order ID: {orderId}
            </p>
          </>
        )}

        {status === 'FAILED' && (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
            <p style={{ fontSize: '1.5rem', color: '#f44336' }}>
              <strong>Payment Failed</strong>
            </p>
            <p style={{ color: '#666', marginBottom: '1.5rem' }}>
              Your payment could not be processed. Please try again.
            </p>
            <p style={{ color: '#999', fontSize: '0.9rem' }}>
              Order ID: {orderId}
            </p>
          </>
        )}

        {status !== 'PENDING' && (
          <button
            onClick={handleBackToDonations}
            className="btn btn-primary"
            style={{ marginTop: '2rem' }}
          >
            Back to Donations
          </button>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}
