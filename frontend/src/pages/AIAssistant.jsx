import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  Send,
  RotateCcw,
  AlertCircle,
  Database,
  Table as TableIcon,
  TrendingUp,
  HelpCircle,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { aiApi } from '../api/ai.api';
import { useToast } from '../context/ToastContext';
import { Badge } from '../components/common/Badge';

export const AIAssistant = () => {
  const [messages, setMessages] = useState([
    {
      id: 'welcome-1',
      role: 'assistant',
      text: 'Welcome! I am your AI Business Intelligence Assistant. I analyze live business records across Sales, Customers, Products, and Performance Trends. Ask me a question or select from the approved queries below.',
      report: null,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState(null);
  const [unconfiguredNotice, setUnconfiguredNotice] = useState(false);

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
        text: 'Hello! I am your AI Business Assistant. Please ask a business question with at least 3 characters (e.g. "Total sales last month", "Top customers", "Highest revenue products"). You can also click any of the queries below.',
        report: {
          suggestions: [
            'What were total sales last month?',
            'Show the top 10 customers by sales.',
            'Which product generated the highest revenue?',
            'Compare this month with the previous month.',
          ],
        },
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
        'Failed to process AI query. Please try again.';
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minHeight: 'calc(100vh - 120px)' }}>
      {/* Header bar */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2>AI Business Assistant</h2>
            <Badge variant="primary" label="Phase 4 Active" />
          </div>
          <p className="page-subtitle">
            Natural language analysis grounded strictly in verified business transactions
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
            <ShieldCheck size={16} color="#10b981" />
            <span>Strict Parameterized Query Safety</span>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setMessages([
                {
                  id: 'welcome-1',
                  role: 'assistant',
                  text: 'Welcome! I am your AI Business Intelligence Assistant. I analyze live business records across Sales, Customers, Products, and Performance Trends. Ask me a question or select from the approved queries below.',
                  report: null,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                },
              ]);
              setLastError(null);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', padding: '6px 12px' }}
          >
            <RotateCcw size={13} />
            <span>Clear Chat</span>
          </button>
        </div>
      </div>

      {/* Unconfigured Provider Notice (if triggered) */}
      {unconfiguredNotice && (
        <div
          className="glass-panel"
          style={{
            padding: '16px 20px',
            borderColor: 'rgba(245, 158, 11, 0.4)',
            background: 'rgba(245, 158, 11, 0.08)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
          }}
        >
          <AlertCircle size={20} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>
            <strong style={{ color: '#fbbf24' }}>AI Provider Configuration Notice:</strong>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-main)' }}>
              OpenAI API key is currently not configured in <code>backend/.env</code>. To enable live OpenAI responses, add your <code>OPENAI_API_KEY</code> and set <code>AI_PROVIDER=openai</code>, or keep <code>AI_PROVIDER=mock</code> for deterministic business records insights.
            </p>
          </div>
        </div>
      )}

      {/* Main Conversation Panel */}
      <div
        className="glass-panel"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '520px',
          padding: 0,
          overflow: 'hidden',
        }}
      >
        {/* Messages Stream */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                gap: '12px',
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: msg.role === 'user' ? '80%' : '90%',
              }}
            >
              {msg.role === 'assistant' && (
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: msg.isError
                      ? 'var(--danger-bg)'
                      : 'var(--primary)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Bot size={18} />
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  width: '100%',
                }}
              >
                <div
                  style={{
                    background:
                      msg.role === 'user'
                        ? 'var(--primary)'
                        : msg.isError
                        ? 'var(--danger-bg)'
                        : 'var(--bg-card)',
                    border:
                      msg.role === 'user'
                        ? 'none'
                        : msg.isError
                        ? '1px solid var(--danger-border)'
                        : '1px solid var(--border-subtle)',
                    padding: '16px 20px',
                    borderRadius: '14px',
                    color:
                      msg.role === 'user'
                        ? '#ffffff'
                        : msg.isError
                        ? 'var(--danger)'
                        : 'var(--text-main)',
                    boxShadow: 'var(--shadow-sm)',
                    fontSize: '0.9375rem',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {msg.text}

                  {/* Summary Metric Badges (if present in report) */}
                  {msg.report?.summaryMetrics && Object.keys(msg.report.summaryMetrics).length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '8px',
                        marginTop: '12px',
                        paddingTop: '12px',
                        borderTop: '1px solid var(--border-subtle)',
                      }}
                    >
                      {Object.entries(msg.report.summaryMetrics).map(([key, val]) => (
                        <div
                          key={key}
                          style={{
                            background: 'var(--bg-card-hover)',
                            border: '1px solid var(--border-subtle)',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            display: 'flex',
                            gap: '6px',
                            alignItems: 'center',
                          }}
                        >
                          <span style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                            {key.replace(/([A-Z])/g, ' $1')}:
                          </span>
                          <span style={{ color: 'var(--primary)', fontWeight: 600 }}>
                            {typeof val === 'number' && key.toLowerCase().includes('revenue')
                              ? `$${val.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                              : String(val)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Structured Data Table (if present in report) */}
                  {msg.report?.rows && msg.report.rows.length > 0 && msg.report?.columns && (
                    <div style={{ marginTop: '16px' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '0.8125rem',
                          color: 'var(--text-muted)',
                          marginBottom: '8px',
                          fontWeight: 600,
                        }}
                      >
                        <TableIcon size={14} color="#6366f1" />
                        <span>{msg.report.reportTitle || 'Database Report'}</span>
                      </div>
                      <div className="table-responsive" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                        <table className="data-table" style={{ fontSize: '0.8125rem' }}>
                          <thead>
                            <tr>
                              {msg.report.columns.map((col) => (
                                <th key={col.key} style={{ padding: '8px 12px' }}>
                                  {col.label}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {msg.report.rows.map((row, rIdx) => (
                              <tr key={rIdx}>
                                {msg.report.columns.map((col) => (
                                  <td key={col.key} style={{ padding: '8px 12px' }}>
                                    {row[col.key]}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Suggested Follow-up Questions (if returned) */}
                  {msg.report?.suggestions && (
                    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                        Try asking one of these verified questions:
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {msg.report.suggestions.map((sug, sIdx) => (
                          <button
                            key={sIdx}
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                            onClick={() => handleSend(sug)}
                          >
                            {sug}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <span
                  style={{
                    fontSize: '0.6875rem',
                    color: 'var(--text-dim)',
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    padding: '0 4px',
                  }}
                >
                  {msg.timestamp}
                </span>
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {loading && (
            <div style={{ display: 'flex', gap: '12px', alignSelf: 'flex-start', maxWidth: '85%' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'var(--primary)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Bot size={18} />
              </div>
              <div
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  padding: '16px 20px',
                  borderRadius: '14px',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '0.875rem',
                }}
              >
                <div
                  style={{
                    width: '18px',
                    height: '18px',
                    border: '2px solid rgba(99, 102, 241, 0.2)',
                    borderTopColor: '#6366f1',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
                <span>Analyzing business records and generating intelligence report...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Retry Banner on Error */}
        {lastError && !loading && (
          <div
            style={{
              padding: '8px 24px',
              background: 'rgba(239, 68, 68, 0.15)',
              borderTop: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.8125rem',
            }}
          >
            <span style={{ color: '#f87171' }}>{lastError.message}</span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}
              onClick={() => handleSend(lastError.question)}
            >
              <RotateCcw size={13} />
              <span>Retry Query</span>
            </button>
          </div>
        )}

        {/* Example Questions Pills Bar */}
        <div
          style={{
            padding: '12px 24px',
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-card-hover)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            <Sparkles size={13} color="var(--primary)" />
            <span>Recommended Business Reporting Queries:</span>
          </div>
          <div
            style={{
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              paddingBottom: '4px',
            }}
          >
            {sampleQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                className="btn btn-secondary btn-sm"
                style={{
                  fontSize: '0.75rem',
                  whiteSpace: 'nowrap',
                  borderRadius: 'var(--radius-full)',
                  padding: '5px 12px',
                  background: 'var(--bg-card)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-main)',
                }}
                disabled={loading}
                onClick={() => handleSend(q)}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-card)',
          }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            style={{ display: 'flex', gap: '12px' }}
          >
            <input
              ref={inputRef}
              type="text"
              className="form-control"
              placeholder="Ask about revenue, customer rankings, products, MoM growth, or city sales..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              maxLength={500}
              style={{ flex: 1, padding: '12px 16px', fontSize: '0.9375rem' }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !inputQuery.trim()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
              }}
            >
              <span>Ask AI</span>
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
