import axios from 'axios';

// ─── BASE URL ──────────────────────────────────────────────────────────────
// Set REACT_APP_API_URL in .env for local or production
// Local:       REACT_APP_API_URL=http://localhost:5001
// Production:  REACT_APP_API_URL=https://your-backend.railway.app
const BASE_URL = process.env.REACT_APP_API_URL ;
console.log("API URL:", BASE_URL);

// ─── AXIOS INSTANCE ────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── REQUEST INTERCEPTOR: attach JWT ──────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('mediqueue_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── RESPONSE INTERCEPTOR: handle auth errors ─────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear stale token and redirect to login
      localStorage.removeItem('mediqueue_token');
      localStorage.removeItem('mediqueue_admin');
      if (window.location.pathname.startsWith('/admin') &&
          !window.location.pathname.includes('/login')) {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

// ─── API METHODS ────────────────────────────────────────────────────────────

// Auth
export const adminLogin = (username, password) =>
  api.post('/api/admin/login', { username, password });

export const verifyAdmin = () =>
  api.get('/api/admin/me');

// Public (no auth)
export const checkPatient = (mobile) =>
  api.get(`/api/patient/check/${mobile}`);

export const registerPatient = (data) =>
  api.post('/api/register', data);

// Admin (auth required)
export const getDashboard = () =>
  api.get('/api/dashboard');

export const getTodayQueue = (status) =>
  api.get('/api/queue/today', { params: status ? { status } : {} });

export const searchPatients = (q, type, date) =>
  api.get('/api/search', { params: { q, type, date } });

export const getPatientHistory = (id) =>
  api.get(`/api/patient/id/${id}/history`);

export const getVisit = (id) =>
  api.get(`/api/visit/${id}`);

export const updateVisit = (id, data) =>
  api.put(`/api/visit/${id}`, data);

export const getAllPatients = (page = 1, limit = 25) =>
  api.get('/api/patients', { params: { page, limit } });

export default api;
