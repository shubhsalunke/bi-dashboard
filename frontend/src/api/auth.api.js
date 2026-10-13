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
};
