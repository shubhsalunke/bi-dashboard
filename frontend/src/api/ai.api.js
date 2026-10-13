import apiClient from './client';

export const aiApi = {
  /**
   * Send a business question to the AI Business Assistant
   * @param {string} question - Natural language business question
   * @returns {Promise<Object>} Formatted report and executive narrative
   */
  askQuestion: async (question) => {
    const { data } = await apiClient.post('/ai/ask', { question });
    return data.data;
  },
};

export default aiApi;
