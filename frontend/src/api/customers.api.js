import apiClient from './client';

export const customersApi = {
  getCustomers: async (params, signal = null) => {
    const { data } = await apiClient.get('/customers', { params, signal });
    return data;
  },

  getCustomerById: async (id) => {
    const { data } = await apiClient.get(`/customers/${id}`);
    return data.data;
  },

  createCustomer: async (customerData) => {
    const { data } = await apiClient.post('/customers', customerData);
    return data.data;
  },

  updateCustomer: async (id, customerData) => {
    const { data } = await apiClient.put(`/customers/${id}`, customerData);
    return data.data;
  },

  deleteCustomer: async (id) => {
    const { data } = await apiClient.delete(`/customers/${id}`);
    return data;
  },
};
