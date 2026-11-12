import apiClient from './client';

export const dashboardApi = {
  getSummary: async (params = {}) => {
    const { data } = await apiClient.get('/dashboard/summary', { params });
    return data.data;
  },

  getSalesReport: async (params = {}) => {
    const { data } = await apiClient.get('/reports/sales', { params });
    return data.data;
  },

  getCustomerInsights: async (params = {}) => {
    const { data } = await apiClient.get('/reports/customer-insights', { params });
    return data.data;
  },

  getBrandSalesReport: async (params = {}) => {
    const { data } = await apiClient.get('/reports/brand-sales', { params });
    return data.data;
  },
};
