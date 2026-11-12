import apiClient from './client';
import { getAccessToken } from '../utils/authStorage';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const aiApi = {
  /**
   * Standard JSON AI query (kept for compatibility and non-streaming callers)
   */
  askQuestion: async (question, history = [], conversationId = null) => {
    const payload = { question };
    if (Array.isArray(history) && history.length > 0) {
      payload.history = history.slice(-3).map((item) => ({
        question: String(item.question || '').slice(0, 500),
        answer: String(item.answer || '').slice(0, 600),
      }));
    }
    if (conversationId) {
      payload.conversationId = conversationId;
    }
    const { data } = await apiClient.post('/ai/ask', payload, { timeout: 60000 });
    return data.data;
  },

  /**
   * Stream AI answer over SSE with AbortSignal support for the Stop button
   */
  askQuestionStream: async ({
    question,
    history = [],
    conversationId = null,
    signal,
    onStatus,
    onChunk,
  }) => {
    const token = getAccessToken();
    const payload = { question };
    if (Array.isArray(history) && history.length > 0) {
      payload.history = history.slice(-3).map((item) => ({
        question: String(item.question || '').slice(0, 500),
        answer: String(item.answer || '').slice(0, 600),
      }));
    }
    if (conversationId) {
      payload.conversationId = conversationId;
    }

    const response = await fetch(`${API_BASE_URL}/ai/ask/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
      signal,
    });

    if (!response.ok) {
      let errData = null;
      try {
        errData = await response.json();
      } catch {
        // Ignore parse failure
      }
      const err = new Error(
        errData?.error?.message || errData?.message || `Request failed (${response.status})`
      );
      err.code = errData?.error?.code;
      err.status = response.status;
      throw err;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Streaming is not supported by this browser.');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let finalPayload = null;

    const processEventBlock = (block) => {
      const lines = block.split(/\r?\n/);
      let eventType = 'message';
      let dataStr = '';
      for (const line of lines) {
        if (line.startsWith('event:')) {
          eventType = line.slice(6).trim();
        } else if (line.startsWith('data:')) {
          dataStr += line.slice(5).trim();
        }
      }
      if (!dataStr) return;
      const parsed = JSON.parse(dataStr);
      if (eventType === 'status') {
        onStatus?.(parsed);
      } else if (eventType === 'chunk') {
        onChunk?.(parsed.text || '');
      } else if (eventType === 'done') {
        finalPayload = parsed;
      } else if (eventType === 'error') {
        const err = new Error(parsed.message || 'Streaming query failed.');
        err.code = parsed.code;
        throw err;
      }
    };

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split('\n\n');
      buffer = blocks.pop() || '';
      for (const block of blocks) {
        if (block.trim()) {
          processEventBlock(block);
        }
      }
    }

    if (buffer.trim()) {
      processEventBlock(buffer);
    }

    return finalPayload;
  },

  generateInsights: async ({ conversationId = null, language = 'en' } = {}) => {
    const { data } = await apiClient.post(
      '/ai/insights',
      { conversationId, language },
      { timeout: 60000 }
    );
    return data.data;
  },

  getSuggestions: async () => {
    const { data } = await apiClient.get('/ai/suggestions');
    return data.data;
  },

  getConversations: async () => {
    const { data } = await apiClient.get('/ai/conversations');
    return data.data;
  },

  createConversation: async (title) => {
    const { data } = await apiClient.post('/ai/conversations', { title });
    return data.data;
  },

  renameConversation: async (id, title) => {
    const { data } = await apiClient.patch(`/ai/conversations/${id}`, { title });
    return data.data;
  },

  deleteConversation: async (id) => {
    const { data } = await apiClient.delete(`/ai/conversations/${id}`);
    return data.data;
  },

  clearAllConversations: async () => {
    const { data } = await apiClient.delete('/ai/conversations');
    return data.data;
  },

  getConversationMessages: async (id) => {
    const { data } = await apiClient.get(`/ai/conversations/${id}/messages`);
    return data.data;
  },

  submitFeedback: async ({ messageId, rating, comment = '' }) => {
    const { data } = await apiClient.post('/ai/feedback', { messageId, rating, comment });
    return data.data;
  },

  getPinnedWidgets: async () => {
    const { data } = await apiClient.get('/ai/pinned-widgets');
    return data.data;
  },

  pinWidget: async (widgetData) => {
    const { data } = await apiClient.post('/ai/pinned-widgets', widgetData);
    return data.data;
  },

  unpinWidget: async (id) => {
    const { data } = await apiClient.delete(`/ai/pinned-widgets/${id}`);
    return data.data;
  },

  getSqlLogs: async (params = {}) => {
    const { data } = await apiClient.get('/ai/sql-logs', { params });
    return data;
  },
};

export default aiApi;
