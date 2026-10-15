import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Sparkles,
  Bot,
  Send,
  RotateCcw,
  AlertCircle,
  Table as TableIcon,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Users,
  Package,
  BarChart3,
  ArrowRight,
  Database,
  Zap,
} from 'lucide-react';
import { aiApi } from '../api/ai.api';
import { useToast } from '../context/ToastContext';
import { Badge } from '../components/common/Badge';

export const AIAssistant = () => {
  const [searchParams] = useSearchParams();
  const initialPromptChecked = useRef(false);
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

  const categorizedModules = [
    {
      id: 'revenue',
      title: 'Revenue & Growth Velocity',
      icon: TrendingUp,
      accentColor: '#10b981',
      description: 'Analyze monthly sales pace, revenue benchmarks, and MoM expansion',
      questions: [
        'What were total sales last month?',
        'Compare this month with the previous month.',
      ],
    },
    {
      id: 'customers',
      title: 'Customer Intelligence & CRM',
      icon: Users,
      accentColor: '#6366f1',
      description: 'Identify top corporate spenders, purchase drop-offs, and churn risk',
      questions: [
        'Show the top 10 customers by sales.',
        'Which customers have reduced their purchases?',
      ],
    },
    {
      id: 'products',
      title: 'Product Catalog & Margins',
      icon: Package,
      accentColor: '#f59e0b',
      description: 'Audit grossing product inventory, category drivers, and sales rank',
      questions: [
        'Which product generated the highest revenue?',
      ],
    },
    {
      id: 'regional',
      title: 'Geographic & Executive Briefing',
      icon: BarChart3,
      accentColor: '#0284c7',
      description: 'Multi-city distributions and executive quarterly business performance',
      questions: [
        'Give me city-wise sales for the last three months.',
        'Summarize business performance for the current quarter.',
      ],
    },
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

  useEffect(() => {
    const promptParam = searchParams.get('prompt') || searchParams.get('q');
    if (promptParam && !initialPromptChecked.current) {
      initialPromptChecked.current = true;
      handleSend(promptParam);
    }
  }, [searchParams]);

  const isInitialState = messages.length <= 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', minHeight: 'calc(100vh - 120px)' }}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
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
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', padding: '6px 14px' }}
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

      {/* Main Conversation & Intelligence Panel */}
      <div className="copilot-main-panel">
        {/* Messages / Welcome View Area */}
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
          {/* WELCOME HERO & CAPABILITY MATRIX (Displayed on Initial State) */}
          {isInitialState ? (
            <div className="copilot-hero-wrapper">
              {/* Executive Welcome Card */}
              <div className="copilot-welcome-card">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                      flexShrink: 0,
                    }}
                  >
                    <Bot size={24} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        Smart BI Business Intelligence Copilot
                      </h3>
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          background: 'rgba(37, 99, 235, 0.1)',
                          color: '#2563eb',
                          border: '1px solid rgba(37, 99, 235, 0.2)',
                        }}
                      >
                        Live Database Grounded
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.9375rem', lineHeight: 1.6, color: 'var(--text-muted)' }}>
                      Welcome! I am your AI Business Intelligence Assistant. I analyze live business records across Sales, Customers, Products, and Performance Trends. Ask me a question or select from the approved queries below.
                    </p>

                    {/* Operational Highlights */}
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '12px',
                        marginTop: '16px',
                        paddingTop: '14px',
                        borderTop: '1px solid rgba(99, 102, 241, 0.12)',
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ShieldCheck size={14} color="#10b981" />
                        <span>Read-Only Parameterized Guardrails</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Database size={14} color="#2563eb" />
                        <span>Enterprise Real-Time Ledger Verification</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Zap size={14} color="#f59e0b" />
                        <span>Instant Deterministic Synthesis</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Categorized AI Capability Grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  <Sparkles size={14} color="var(--primary)" />
                  <span>Recommended Business Reporting Queries:</span>
                </div>

                <div className="copilot-capabilities-grid">
                  {categorizedModules.map((mod) => {
                    const ModIcon = mod.icon;
                    return (
                      <div key={mod.id} className="copilot-cap-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              background: `${mod.accentColor}18`,
                              color: mod.accentColor,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <ModIcon size={16} />
                          </div>
                          <div>
                            <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
                              {mod.title}
                            </h4>
                            <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {mod.description}
                            </p>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                          {mod.questions.map((q) => (
                            <button
                              key={q}
                              type="button"
                              className="copilot-cap-pill"
                              disabled={loading}
                              onClick={() => handleSend(q)}
                            >
                              <span>{q}</span>
                              <ArrowRight size={13} style={{ flexShrink: 0, opacity: 0.7 }} />
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* CONVERSATION MESSAGE STREAM */
            messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  gap: '12px',
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: msg.role === 'user' ? '80%' : '92%',
                }}
              >
                {msg.role === 'assistant' && (
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: msg.isError
                        ? 'var(--danger-bg)'
                        : 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: msg.isError ? 'none' : '0 2px 8px rgba(37, 99, 235, 0.25)',
                    }}
                  >
                    <Bot size={18} />
                  </div>
                )}

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    width: '100%',
                  }}
                >
                  <div
                    className={
                      msg.role === 'user'
                        ? 'copilot-msg-card-user'
                        : 'copilot-msg-card-assistant'
                    }
                    style={{
                      background: msg.isError ? 'var(--danger-bg)' : undefined,
                      borderColor: msg.isError ? 'var(--danger-border)' : undefined,
                      color: msg.isError ? 'var(--danger)' : undefined,
                    }}
                  >
                    {/* Header bar for assistant response */}
                    {msg.role === 'assistant' && !msg.isError && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '10px',
                          paddingBottom: '8px',
                          borderBottom: '1px solid var(--border-subtle)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>
                            Smart BI Copilot
                          </span>
                          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                            • Grounded Query Result
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyMessage(msg.text, msg.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.6875rem',
                            padding: '2px 6px',
                            borderRadius: '4px',
                          }}
                          title="Copy response"
                        >
                          {copiedId === msg.id ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                          <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    )}

                    <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>

                    {/* Summary Metric Badges (if present in report) */}
                    {msg.report?.summaryMetrics && Object.keys(msg.report.summaryMetrics).length > 0 && (
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '10px',
                          marginTop: '14px',
                          paddingTop: '12px',
                          borderTop: '1px solid var(--border-subtle)',
                        }}
                      >
                        {Object.entries(msg.report.summaryMetrics).map(([key, val]) => (
                          <div
                            key={key}
                            style={{
                              background: 'var(--bg-main)',
                              border: '1px solid var(--border-subtle)',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              fontSize: '0.8125rem',
                              display: 'flex',
                              gap: '6px',
                              alignItems: 'center',
                            }}
                          >
                            <span style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                              {key.replace(/([A-Z])/g, ' $1')}:
                            </span>
                            <span style={{ color: 'var(--primary)', fontWeight: 700 }}>
                              {typeof val === 'number' && (
                                key.toLowerCase().includes('revenue') ||
                                key.toLowerCase().includes('value') ||
                                key.toLowerCase().includes('spend') ||
                                key.toLowerCase().includes('amount') ||
                                key.toLowerCase().includes('price') ||
                                key.toLowerCase().includes('order') && key.toLowerCase().includes('avg')
                              )
                                ? `$${val.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                                : String(val)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Structured Data Table (if present in report) */}
                    {msg.report?.rows && msg.report.rows.length > 0 && msg.report?.columns && (
                      <div
                        style={{
                          marginTop: '16px',
                          background: 'var(--bg-main)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '10px',
                          padding: '12px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '10px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)' }}>
                            <TableIcon size={14} color="#6366f1" />
                            <span>{msg.report.reportTitle || 'Database Report'}</span>
                          </div>
                          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', background: 'var(--bg-card)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                            {msg.report.rows.length} records returned
                          </span>
                        </div>
                        <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                          <table className="data-table" style={{ fontSize: '0.8125rem', width: '100%' }}>
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
                    {msg.report?.suggestions && msg.report.suggestions.length > 0 && (
                      <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                          <Sparkles size={12} color="var(--primary)" />
                          <span>Try asking one of these verified questions:</span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {msg.report.suggestions.map((sug, sIdx) => (
                            <button
                              key={sIdx}
                              type="button"
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: '0.75rem', padding: '5px 10px', borderRadius: 'var(--radius-full)' }}
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
            ))
          )}

          {/* Loading Indicator */}
          {loading && (
            <div style={{ display: 'flex', gap: '12px', alignSelf: 'flex-start', maxWidth: '85%' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
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
                  borderRadius: '16px',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '0.875rem',
                  boxShadow: 'var(--shadow-sm)',
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
              padding: '10px 24px',
              background: 'rgba(239, 68, 68, 0.12)',
              borderTop: '1px solid rgba(239, 68, 68, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.8125rem',
            }}
          >
            <span style={{ color: '#f87171', fontWeight: 500 }}>{lastError.message}</span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', padding: '4px 10px' }}
              onClick={() => handleSend(lastError.question)}
            >
              <RotateCcw size={13} />
              <span>Retry Query</span>
            </button>
          </div>
        )}

        {/* Quick Prompts Pills Bar (Visible during conversation mode) */}
        {!isInitialState && (
          <div className="copilot-pills-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              <Sparkles size={13} color="var(--primary)" />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Quick Prompts:
              </span>
            </div>
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

        {/* Input Bar Dock */}
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
              placeholder="Ask about revenue, customer rankings, products, MoM growth, or city sales..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              maxLength={500}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <kbd
                style={{
                  fontSize: '0.6875rem',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)',
                }}
              >
                ↵
              </kbd>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !inputQuery.trim()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 18px',
                  fontSize: '0.875rem',
                }}
              >
                <span>Ask AI</span>
                <Send size={15} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
