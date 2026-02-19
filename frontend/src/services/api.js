import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
};

// Requests API
export const requestsAPI = {
  create: (data) => api.post('/requests', data),
  getAll: (params) => api.get('/requests', { params }),
  getMy: () => api.get('/requests/my-requests'),
  getById: (id) => api.get(`/requests/${id}`),
  updateStatus: (id, data) => api.patch(`/requests/${id}/status`, data),
  delete: (id) => api.delete(`/requests/${id}`),
};

// Feedback API
export const feedbackAPI = {
  submit: (data) => api.post('/feedback', data),
  getByRequest: (requestId) => api.get(`/feedback/request/${requestId}`),
  getAll: (params) => api.get('/feedback', { params }),
};

// Analytics API
export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getDepartmentWorkload: () => api.get('/analytics/department-workload'),
  getServicePerformance: () => api.get('/analytics/service-performance'),
  getPriorityDistribution: () => api.get('/analytics/priority-distribution'),
  getFeedbackRatings: () => api.get('/analytics/feedback-ratings'),
  getPrioritySummary: () => api.get('/analytics/priority-summary'),
  getMonthlyAnalytics: (months) => api.get('/analytics/monthly', { params: { months } }),
  getSLACompliance: () => api.get('/analytics/sla-compliance'),
  getUserActivity: (days) => api.get('/analytics/user-activity', { params: { days } }),
};

// Services API
export const servicesAPI = {
  getAllDepartments: () => api.get('/departments'),
  getAllServices: (deptId) => api.get('/services', { params: { deptId } }),
  getServiceById: (id) => api.get(`/services/${id}`),
  createService: (data) => api.post('/services', data),
  createDepartment: (data) => api.post('/departments', data),
  updateDepartment: (id, data) => api.patch(`/departments/${id}`, data),
};

export default api;
