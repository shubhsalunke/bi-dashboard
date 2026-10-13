import apiClient from './client';

export const salesApi = {
  getSales: async (params, signal = null) => {
    const { data } = await apiClient.get('/sales', { params, signal });
    return data;
  },

  getSaleById: async (id) => {
    const { data } = await apiClient.get(`/sales/${id}`);
    return data.data;
  },

  createSale: async (saleData) => {
    const { data } = await apiClient.post('/sales', saleData);
    return data.data;
  },
};
