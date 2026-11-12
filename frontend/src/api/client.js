import axios from 'axios';
import {
  getAccessToken,
  getRefreshToken,
  updateAuthTokens,
  clearAuthTokens,
} from '../utils/authStorage';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const redirectToSessionExpiredLogin = () => {
  clearAuthTokens();
  const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const params = new URLSearchParams({ reason: 'session_expired' });
  if (currentPath && !currentPath.startsWith('/login')) {
    params.set('redirect', currentPath);
  }
  window.location.href = `/login?${params.toString()}`;
};

// Request Interceptor: Attach JWT Access Token
apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Token Refresh & Unified Errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Detect 401 and attempt automatic token refresh (skip for public auth endpoints)
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/auth/login') &&
      !originalRequest.url.includes('/auth/refresh') &&
      !originalRequest.url.includes('/auth/forgot-password') &&
      !originalRequest.url.includes('/auth/reset-password-token')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        isRefreshing = false;
        redirectToSessionExpiredLogin();
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const newAccessToken = data.data.accessToken;
        const newRefreshToken = data.data.refreshToken;

        updateAuthTokens({ accessToken: newAccessToken, refreshToken: newRefreshToken });

        apiClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        redirectToSessionExpiredLogin();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    const errorPayload = {
      status: error.response?.status || 500,
      code: error.response?.data?.error?.code || 'NETWORK_ERROR',
      message:
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        error.message ||
        'An unexpected error occurred. Please try again.',
      details: error.response?.data?.error?.details || null,
    };

    return Promise.reject(errorPayload);
  }
);

export default apiClient;
