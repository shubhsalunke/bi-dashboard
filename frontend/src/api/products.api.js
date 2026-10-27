import apiClient from './client';

export const productsApi = {
  getProducts: async (params, signal = null) => {
    const { data } = await apiClient.get('/products', { params, signal });
    return data;
  },

  getProductById: async (id) => {
    const { data } = await apiClient.get(`/products/${id}`);
    return data.data;
  },

  getProductDetails: async (id) => {
    const { data } = await apiClient.get(`/products/${id}/details`);
    return data.data;
  },

  createProduct: async (productData) => {
    const { data } = await apiClient.post('/products', productData);
    return data.data;
  },

  updateProduct: async (id, productData) => {
    const { data } = await apiClient.put(`/products/${id}`, productData);
    return data.data;
  },

  deleteProduct: async (id) => {
    const { data } = await apiClient.delete(`/products/${id}`);
    return data;
  },
};
