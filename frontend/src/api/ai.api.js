import apiClient from './client';

export const aiApi = {
  /**
   * Send a business question (with optional last 3 Q&A turns) to the AI Business Assistant
   * @param {string} question - Natural language business question
   * @param {Array<{question: string, answer: string}>} [history] - Last 3 Q&A pairs
   * @returns {Promise<Object>} Formatted report and executive narrative
   */
  askQuestion: async (question, history = []) => {
    const payload =
      Array.isArray(history) && history.length > 0
        ? {
            question,
            history: history.slice(-3).map((item) => ({
              question: String(item.question || '').slice(0, 500),
              answer: String(item.answer || '').slice(0, 600),
            })),
          }
        : { question };
    const { data } = await apiClient.post('/ai/ask', payload, { timeout: 60000 });
    return data.data;
  },
};

export default aiApi;
