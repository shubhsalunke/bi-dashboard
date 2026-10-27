import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Send,
  RotateCcw,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import { aiApi } from '../api/ai.api';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDate } from '../utils/format';

export const AIAssistant = () => {
  const [searchParams] = useSearchParams();
  const initialPromptChecked = useRef(false);

  const welcomeText = 'Ask a question about your sales, customers, or products.';

  const [messages, setMessages] = useState([
    {
      id: 'welcome-1',
      role: 'assistant',
      text: welcomeText,
      report: null,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState(null);
  const [unconfiguredNotice, setUnconfiguredNotice] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const { showToast } = useToast();

  const sampleQuestions = [
    'What were total sales last month?',
    'Show the top 10 customers by sales.',
    'Which product generated the highest revenue?',
    'Compare this month with the previous month.',
    'Give me city-wise sales for the last three months.',
    'Summarize business performance for the current quarter.',
    'Which customers have reduced their purchases?',
  ];

  const scrollToBottom = () => {
    if (typeof messagesEndRef.current?.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
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

  const handleSend = async (questionToSend) => {
    const q = (questionToSend || inputQuery).trim();
    if (!q || loading) return;

    setInputQuery('');
    setLastError(null);

    const userMsgId = Date.now().toString();
    const newUserMessage = {
      id: userMsgId,
      role: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    if (q.length < 3) {
      const assistantMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: 'Please ask a question with at least 3 characters.',
        report: null,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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
  };

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
  }, [searchParams]);

  const isInitialState = messages.length <= 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minHeight: 'calc(100vh - 120px)' }}>
      {/* Header Bar */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h2 className="brand-title-serif">AI Business Assistant</h2>
          <p className="page-subtitle">
            Ask questions about your sales, customers, and products
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Strict Parameterized Query Safety
          </span>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setMessages([
                {
                  id: 'welcome-1',
                  role: 'assistant',
                  text: welcomeText,
                  report: null,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                },
              ]);
              setLastError(null);
            }}
          >
            <RotateCcw size={13} />
            <span>Clear Chat</span>
          </button>
        </div>
      </div>

      {/* Unconfigured Provider Notice */}
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

      {/* Main Chat Panel */}
      <div className="copilot-main-panel">
        <div
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
            <div style={{ maxWidth: '720px', margin: '20px auto', width: '100%' }}>
              <div
                className="glass-panel"
                style={{
                  padding: '20px',
                  marginBottom: '20px',
                }}
              >
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '6px' }}>
                  Ask a question
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                  {welcomeText}
                </p>
              </div>

              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Sample questions:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {sampleQuestions.map((q) => (
                    <button
                      key={q}
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ textAlign: 'left', justifyContent: 'flex-start', padding: '8px 12px' }}
                      disabled={loading}
                      onClick={() => handleSend(q)}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Conversation Stream */
            messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: msg.role === 'user' ? '75%' : '88%',
                }}
              >
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    lineHeight: 1.5,
                    backgroundColor: msg.role === 'user' ? 'var(--primary)' : 'var(--bg-card)',
                    color: msg.role === 'user' ? '#ffffff' : msg.isError ? 'var(--danger)' : 'var(--text-main)',
                    border: msg.role === 'user' ? 'none' : '1px solid var(--border-subtle)',
                  }}
                >
                  {msg.role === 'assistant' && !msg.isError && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '8px',
                        paddingBottom: '6px',
                        borderBottom: '1px solid var(--border-subtle)',
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <span>Assistant</span>
                      <button
                        type="button"
                        onClick={() => handleCopyMessage(msg.text, msg.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.75rem',
                        }}
                      >
                        {copiedId === msg.id ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
                        <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  )}

                  <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>

                  {/* Summary Metric Badges */}
                  {msg.report?.summaryMetrics && Object.keys(msg.report.summaryMetrics).length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '8px',
                        marginTop: '12px',
                        paddingTop: '10px',
                        borderTop: '1px solid var(--border-subtle)',
                      }}
                    >
                      {Object.entries(msg.report.summaryMetrics).map(([key, val]) => (
                        <div
                          key={key}
                          style={{
                            background: 'var(--bg-dark)',
                            border: '1px solid var(--border-subtle)',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            display: 'flex',
                            gap: '4px',
                          }}
                        >
                          <span style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                            {key.replace(/([A-Z])/g, ' $1')}:
                          </span>
                          <span className="tabular-nums" style={{ fontWeight: 600 }}>
                            {typeof val === 'number' &&
                            (key.toLowerCase().includes('revenue') ||
                              key.toLowerCase().includes('spend') ||
                              key.toLowerCase().includes('amount') ||
                              key.toLowerCase().includes('price'))
                              ? formatCurrency(val, { decimals: 2 })
                              : String(val)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Structured Data Table */}
                  {msg.report?.rows && msg.report.rows.length > 0 && msg.report?.columns && (
                    <div
                      style={{
                        marginTop: '12px',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '4px',
                        overflow: 'hidden',
                      }}
                    >
                      {msg.report.reportTitle && (
                        <div
                          style={{
                            padding: '8px 12px',
                            background: 'var(--bg-dark)',
                            borderBottom: '1px solid var(--border-subtle)',
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                          }}
                        >
                          {msg.report.reportTitle}
                        </div>
                      )}
                      <div className="table-responsive" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                        <table className="data-table" style={{ fontSize: '0.8125rem' }}>
                          <thead>
                            <tr>
                              {msg.report.columns.map((col) => (
                                <th key={col.key}>{col.label}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {msg.report.rows.map((row, rIdx) => (
                              <tr key={rIdx}>
                                {msg.report.columns.map((col) => {
                                  const cellVal = row[col.key];
                                  const isNumeric = typeof cellVal === 'number' || (!isNaN(Number(cellVal)) && cellVal !== '');
                                  return (
                                    <td key={col.key} className={isNumeric ? 'tabular-nums' : ''}>
                                      {cellVal}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                <span
                  style={{
                    fontSize: '0.6875rem',
                    color: 'var(--text-dim)',
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  {msg.timestamp}
                </span>
              </div>
            ))
          )}

          {loading && (
            <div style={{ alignSelf: 'flex-start', color: 'var(--text-muted)', fontSize: '0.875rem', padding: '10px' }}>
              Thinking...
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Retry Banner on Error */}
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
            <span style={{ color: 'var(--danger)' }}>{lastError.message}</span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleSend(lastError.question)}
            >
              Retry Query
            </button>
          </div>
        )}

        {/* Quick Prompts Bar during active conversation */}
        {!isInitialState && (
          <div className="copilot-pills-bar">
            {sampleQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                className="copilot-quick-chip"
                disabled={loading}
                onClick={() => handleSend(q)}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div className="copilot-input-dock">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask about revenue, top customers, products..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              maxLength={500}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !inputQuery.trim()}
              style={{ padding: '6px 14px' }}
            >
              <span>Ask AI</span>
              <Send size={14} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
