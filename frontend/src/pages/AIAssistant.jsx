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

  const handleSend = useCallback(async (questionToSend) => {
    const q = (questionToSend || inputQuery).trim();
    if (!q || loading) return;

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
      const data = await aiApi.askQuestion(q);
      const assistantMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: data.answer,
        report: data,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg =
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
  }, [inputQuery, loading, showToast]);

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: 'calc(100vh - 120px)', boxSizing: 'border-box' }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h2 className="brand-title-serif">AI Business Assistant</h2>
          <p className="page-subtitle">Answers come from your sales database.</p>
        </div>

        <button type="button" className="btn btn-secondary btn-sm" onClick={handleClearChat}>
          <RotateCcw size={14} />
          <span>Clear Chat</span>
        </button>
      </div>

      {unconfiguredNotice && (
        <div
          className="glass-panel"
          style={{
            padding: '12px 16px',
            borderColor: 'var(--warning-border)',
            background: 'var(--warning-bg)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
          }}
        >
          <AlertCircle size={18} color="var(--warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.875rem' }}>
            <strong style={{ color: 'var(--warning)' }}>AI Provider Configuration Notice</strong>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-main)' }}>
              OpenAI API key is currently not configured in <code>backend/.env</code>. Set <code>OPENAI_API_KEY</code> or keep <code>AI_PROVIDER=mock</code>.
            </p>
          </div>
        </div>
      )}

      <div className="copilot-main-panel" style={{ minHeight: 0 }}>
        <div
          ref={chatScrollRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {isInitialState ? (
            <AIInitialState
              welcomeText={WELCOME_TEXT}
              sampleQuestions={SAMPLE_QUESTIONS}
              loading={loading}
              onSelectQuestion={handleSend}
            />
          ) : (
            messages.map((msg) => (
              <ChatMessageItem
                key={msg.id}
                msg={msg}
                copiedId={copiedId}
                onCopy={handleCopyMessage}
              />
            ))
          )}

          {loading && (
            <div style={{ alignSelf: 'flex-start', color: 'var(--text-muted)', fontSize: '0.875rem', padding: '10px' }}>
              Thinking...
            </div>
          )}
        </div>

        {lastError && !loading && (
          <div
            style={{
              padding: '8px 16px',
              background: 'var(--danger-bg)',
              borderTop: '1px solid var(--danger-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.8125rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--danger)' }}>
              <AlertCircle size={14} />
              <span>Question failed to process</span>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ padding: '3px 8px', fontSize: '0.75rem' }}
              onClick={() => handleSend(lastError.question)}
            >
              Retry Query
            </button>
          </div>
        )}

        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-card)',
          }}
        >
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              ref={inputRef}
              type="text"
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
              <Send size={15} />
              <span>Ask AI</span>
            </button>
          </div>
          <div style={{ textAlign: 'right', fontSize: '0.75rem', color: inputQuery.length >= 500 ? 'var(--danger)' : 'var(--text-muted)', marginTop: '4px' }}>
            {inputQuery.length}/500
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
