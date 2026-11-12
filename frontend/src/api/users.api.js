import apiClient from './client';

export const usersApi = {
  getUsers: async (params = {}) => {
    const { data } = await apiClient.get('/users', { params });
    return data;
  },
  getUserById: async (id) => {
    const { data } = await apiClient.get(`/users/${id}`);
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
  updateUserStatus: async (id, isActive) => {
    const { data } = await apiClient.patch(`/users/${id}/status`, { is_active: isActive });
    return data.data;
  },
  resetPassword: async (id) => {
    const { data } = await apiClient.post(`/users/${id}/reset-password`);
    return data.data;
  },
  deleteUser: async (id) => {
    const { data } = await apiClient.delete(`/users/${id}`);
    return data;
  },
  getUserActivity: async (id, params = {}) => {
    const { data } = await apiClient.get(`/users/${id}/activity`, { params });
    return data;
  },
  getAuditLogs: async (params = {}) => {
    const { data } = await apiClient.get('/users/audit-logs', { params });
    return data;
  },
  getResetRequests: async () => {
    const { data } = await apiClient.get('/users/reset-requests');
    return data.data;
  },
  completeResetRequest: async (requestId) => {
    const { data } = await apiClient.post(`/users/reset-requests/${requestId}/complete`);
    return data.data;
  },
  dismissResetRequest: async (requestId) => {
    const { data } = await apiClient.patch(`/users/reset-requests/${requestId}/dismiss`);
    return data.data;
  },
};
