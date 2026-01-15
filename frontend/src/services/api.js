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
  initiatePayment: (data) => api.post('/payment/initiate', data),
  verifyPayment: (data) => api.post('/payment/verify', data),
}

export default api
