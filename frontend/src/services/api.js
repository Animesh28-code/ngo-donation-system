import axios from 'axios'

const API_BASE_URL = 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle response errors
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.config.method, response.config.url, response.status)
    return response
  },
  (error) => {
    console.error('API Error:', error.config?.method, error.config?.url, error.response?.status, error.response?.data)
    return Promise.reject(error)
  }
)

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
}

// User APIs
export const userAPI = {
  getProfile: () => api.get('/user/profile'),
  createDonation: (data) => api.post('/user/donate', data),
  updateDonationStatus: (data) => api.post('/user/donate/status', data),
  listDonations: () => api.get('/user/donations'),
  getDonationByOrderId: (orderId) => api.get(`/user/donations/by-order/${orderId}`),
}

// Admin APIs
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getRegistrations: (filters = {}) => api.get('/admin/registrations', { params: filters }),
  getDonations: (filters = {}) => api.get('/admin/donations', { params: filters }),
  exportRegistrations: () => api.get('/admin/registrations/export', { responseType: 'blob' }),
}

// Payment APIs
export const paymentAPI = {
  initiatePayment: (data) => api.get(`/payment/init/${data.donationId}`),
  verifyPayment: (data) => api.post('/payment/verify', data),
  getPaymentStatus: (donationId) => api.get(`/payment/status/${donationId}`),
  initPayHerePayment: (data) => api.post('/payhere/init', data),
}

export default api
