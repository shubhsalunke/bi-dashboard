import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, RotateCcw, AlertCircle } from 'lucide-react';
import { aiApi } from '../api/ai.api';
import { ChatMessageItem } from '../components/ai/ChatMessageItem';
import { AIInitialState } from '../components/ai/AIInitialState';
import { useToast } from '../context/ToastContext';

const WELCOME_TEXT = 'Ask a question about your sales, customers, or products.';

const SAMPLE_QUESTIONS = [
  'What were total sales last month?',
  'Show customer list',
  'Show product list',
  'Show the top 10 customers by sales.',
  'Which product generated the highest revenue?',
  'Compare this month with the previous month.',
  'Give me city-wise sales for the last three months.',
  'Summarize business performance for the current quarter.',
  'Which customers have reduced their purchases?',
];

export const AIAssistant = () => {
  const [searchParams] = useSearchParams();
  const initialPromptChecked = useRef(false);

  const [messages, setMessages] = useState(() => [
    {
      id: 'welcome-1',
      role: 'assistant',
      text: WELCOME_TEXT,
      report: null,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState(null);
  const [unconfiguredNotice, setUnconfiguredNotice] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const chatScrollRef = useRef(null);
  const inputRef = useRef(null);
  const { showToast } = useToast();

  const scrollToBottom = () => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleCopyMessage = (text, id) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      showToast('Copied to clipboard', 'info');
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const buildHistory = useCallback((msgList) => {
    const pairs = [];
    for (let i = 0; i < msgList.length; i++) {
      const m = msgList[i];
      if (m.role === 'user') {
        const next = msgList[i + 1];
        if (next && next.role === 'assistant' && !next.isError && next.text) {
          pairs.push({
            question: m.text.slice(0, 500),
            answer: next.text.slice(0, 400),
          });
        }
      }
    }
    return pairs.slice(-3);
  }, []);

  const handleSend = useCallback(async (questionToSend) => {
    const q = (questionToSend || inputQuery).trim();
    if (!q || loading) return;

    const history = buildHistory(messages);

    setInputQuery('');
    setLastError(null);

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsgId = Date.now().toString();
    const newUserMessage = {
      id: userMsgId,
      role: 'user',
      text: q,
      timestamp: timeStr,
    };

    if (q.length < 3) {
      const assistantMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: 'Please ask a question with at least 3 characters.',
        report: null,
        timestamp: timeStr,
      };
      setMessages((prev) => [...prev, newUserMessage, assistantMsg]);
      return;
    }

    setMessages((prev) => [...prev, newUserMessage]);
    setLoading(true);

    try {
      const data = history.length > 0
        ? await aiApi.askQuestion(q, history)
        : await aiApi.askQuestion(q);
      const assistantMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: data.answer,
        report: data,
        sql: data.sql || null,
        assumptions: data.assumptions || null,
        isClarification: Boolean(data.isClarification),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg =
        err.details?.[0]?.message ||
        err.response?.data?.error?.details?.[0]?.message ||
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        'Failed to process query. Please try again.';
      setLastError({ question: q, message: errorMsg });

      if (err.code === 'AI_NOT_CONFIGURED' || err.response?.data?.error?.code === 'AI_NOT_CONFIGURED') {
        setUnconfiguredNotice(true);
      }

      showToast(errorMsg, 'error');

      const assistantErrMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        isError: true,
        text: errorMsg,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantErrMsg]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [inputQuery, loading, messages, buildHistory, showToast]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    const promptParam = searchParams.get('prompt') || searchParams.get('q');
    if (promptParam && !initialPromptChecked.current) {
      initialPromptChecked.current = true;
      handleSend(promptParam);
    }
  }, [searchParams, handleSend]);

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        text: WELCOME_TEXT,
        report: null,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setLastError(null);
    showToast('Conversation cleared', 'info');
  };

  const isInitialState = messages.length <= 1;

  return (
    <div className="chat-page">
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h2>AI Business Assistant</h2>
          <p className="page-subtitle">Answers come from your sales database.</p>
        </div>

        <button type="button" className="btn btn-secondary btn-sm" onClick={handleClearChat}>
          <RotateCcw size={14} aria-hidden="true" />
          <span>Clear Chat</span>
        </button>
      </div>

      {unconfiguredNotice && (
        <div className="alert alert-warning" role="alert">
          <AlertCircle size={18} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
          <div>
            <div className="alert-warning-title">AI Provider Configuration Notice</div>
            <p style={{ marginTop: 'var(--space-1)', color: 'var(--text-primary)' }}>
              AI provider API key is not configured in root <code>.env</code>. Set <code>GEMINI_API_KEY</code> or <code>OPENAI_API_KEY</code>, or keep <code>AI_PROVIDER=mock</code>.
            </p>
          </div>
        </div>
      )}

      <div className="chat-panel">
        <div ref={chatScrollRef} className="chat-scroll-area">
          {isInitialState ? (
            <AIInitialState
              welcomeText={WELCOME_TEXT}
              sampleQuestions={SAMPLE_QUESTIONS}
              loading={loading}
              onSelectQuestion={handleSend}
            />
          ) : (
            <div className="chat-thread">
              {messages.map((msg) => (
                <ChatMessageItem
                  key={msg.id}
                  msg={msg}
                  copiedId={copiedId}
                  onCopy={handleCopyMessage}
                />
              ))}

              {loading && (
                <div
                  role="status"
                  aria-live="polite"
                  style={{ alignSelf: 'flex-start', color: 'var(--text-muted)', fontSize: '0.875rem', padding: 'var(--space-2)' }}
                >
                  Querying your data...
                </div>
              )}
            </div>
          )}
        </div>

        {lastError && !loading && (
          <div className="chat-retry-bar" role="alert">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--danger)' }}>
              <AlertCircle size={14} aria-hidden="true" />
              <span>Question failed to process</span>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleSend(lastError.question)}
            >
              Retry Query
            </button>
          </div>
        )}

        <div className="chat-input-dock">
          <div className="chat-input-row">
            <input
              ref={inputRef}
              type="text"
              aria-label="Ask a business intelligence question"
              className="form-control"
              placeholder="Ask about revenue, customer spending, or product metrics... (e.g. Which customer spent the most?)"
              maxLength={500}
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              autoFocus
            />
            <button
              type="button"
              className="btn btn-primary"
              disabled={!inputQuery.trim() || inputQuery.length > 500 || loading}
              onClick={() => handleSend()}
            >
              <Send size={14} aria-hidden="true" />
              <span>Ask AI</span>
            </button>
          </div>
          <div
            className={`chat-char-count tabular-nums ${
              inputQuery.length >= 500 ? 'form-counter-limit' : ''
            }`}
          >
            {inputQuery.length}/500
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
