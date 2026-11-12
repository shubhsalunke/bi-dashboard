import apiClient from './client';

export const authApi = {
  login: async (credentials) => {
    const { data } = await apiClient.post('/auth/login', credentials);
    return data.data;
  },

  getCurrentUser: async () => {
    const { data } = await apiClient.get('/auth/me');
    return data.data.user;
  },

  refreshToken: async (refreshToken) => {
    const { data } = await apiClient.post('/auth/refresh', { refreshToken });
    return data.data;
  },

  forgotPassword: async (email) => {
    const { data } = await apiClient.post('/auth/forgot-password', { email });
    return data;
  },

  resetPasswordWithToken: async ({ token, password }) => {
    const { data } = await apiClient.post('/auth/reset-password-token', {
      token,
      password,
    });
    return data;
  },
};
