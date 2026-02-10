import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const companyId = localStorage.getItem('companyId');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (companyId) {
      // Only set if not already set in the request
      if (!config.headers['X-Company-Id']) {
        config.headers['X-Company-Id'] = companyId;
      }
    }

    console.log('API Request:', {
      url: config.url,
      method: config.method,
      headers: {
        Authorization: config.headers.Authorization ? 'Bearer ***' : 'Not set',
        'X-Company-Id': config.headers['X-Company-Id'] || 'Not set',
      },
      data: config.data,
    });

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });

    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('companyId');
      localStorage.removeItem('user');
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export { api };
