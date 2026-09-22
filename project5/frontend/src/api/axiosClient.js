import axios from 'axios';

const axiosClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to attach JWT Access Token
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for automatic refresh token handling & error extraction
axiosClient.interceptors.response.use(
  (response) => {
    const data = response.data;
    // Handle Blob downloads (e.g. PDF, Excel reports)
    if (typeof Blob !== 'undefined' && data instanceof Blob) {
      if (!data.data) {
        try {
          Object.defineProperty(data, 'data', {
            value: data,
            writable: true,
            configurable: true,
            enumerable: false,
          });
        } catch (_e) {}
      }
      return data;
    }

    // Unify ApiResponse payload access:
    // If response.data is an ApiResponse envelope { success: true, data: <payload>, message: '...' }
    // ensure that both `res.data` and legacy `res.data.data` resolve directly to <payload>.
    if (data && typeof data === 'object' && 'data' in data) {
      const payload = data.data;
      if (payload && typeof payload === 'object' && !('data' in payload)) {
        try {
          Object.defineProperty(payload, 'data', {
            value: payload,
            writable: true,
            configurable: true,
            enumerable: false,
          });
        } catch (_e) {}
      }
    }
    return data;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized (Token Expired)
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/login') && !originalRequest.url.includes('/auth/refresh')) {
      originalRequest._retry = true;
      try {
        const refreshResponse = await axios.post(
          '/api/auth/refresh',
          {},
          { withCredentials: true }
        );

        if (refreshResponse.data?.data?.token) {
          const newToken = refreshResponse.data.data.token;
          localStorage.setItem('token', newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axios(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login?session_expired=1';
        }
      }
    }

    const customError = {
      message: error.response?.data?.message || error.message || 'An unexpected error occurred',
      errors: error.response?.data?.errors || null,
      status: error.response?.status || 500,
    };

    return Promise.reject(customError);
  }
);

export default axiosClient;
