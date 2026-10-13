import apiClient from './client';

export const usersApi = {
  getUsers: async () => {
    const { data } = await apiClient.get('/users');
    return data.data;
  },

  createUser: async (userData) => {
    const { data } = await apiClient.post('/users', userData);
    return data.data;
  },

  updateUser: async (id, userData) => {
    const { data } = await apiClient.put(`/users/${id}`, userData);
    return data.data;
  },

  deleteUser: async (id) => {
    const { data } = await apiClient.delete(`/users/${id}`);
    return data;
  },

  getAuditLogs: async (params = {}) => {
    const { data } = await apiClient.get('/users/audit-logs', { params });
    return data;
  },
};
