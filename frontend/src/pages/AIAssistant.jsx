import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  RotateCcw,
  AlertCircle,
  Sparkles,
  PanelLeft,
  Square,
  Mic,
  MicOff,
} from 'lucide-react';
import { aiApi } from '../api/ai.api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ChatMessageItem } from '../components/ai/ChatMessageItem';
import { AIInitialState } from '../components/ai/AIInitialState';
import ChatHistorySidebar from '../components/ai/ChatHistorySidebar';

const WELCOME_TEXT = 'Ask a question about your sales, customers, or products.';

const DEFAULT_TOPIC_GROUPS = [
  {
    topic: 'Sales',
    questions: [
      'What were total sales last month?',
      'Give me city-wise sales for the last three months.',
      'Summarize business performance for the current quarter.',
      'What is our total revenue in this financial year?',
    ],
  },
  {
    topic: 'Customers',
    questions: [
      'Show customer list',
      'Show the top 10 customers by sales.',
      'Which customers have reduced their purchases?',
      'Show completed revenue by industry and customer type',
    ],
  },
  {
    topic: 'Products',
    questions: [
      'Show product list',
      'Which product generated the highest revenue?',
      'Which active products are low on stock?',
    ],
  },
  {
    topic: 'Trends',
    questions: [
      'Compare this month with the previous month.',
      'Predict next month revenue',
      'Pichle mahine total sales kitni hui?',
    ],
  },
];

const createWelcomeMessage = (id = 'welcome-1') => ({
  id,
  role: 'assistant',
  text: WELCOME_TEXT,
  report: null,
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
});

export const AIAssistant = () => {
  const [searchParams] = useSearchParams();
  const initialPromptChecked = useRef(false);
  const { isAdmin } = useAuth();
  const { showToast } = useToast();

  const [messages, setMessages] = useState(() => [createWelcomeMessage('welcome-1')]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamStatus, setStreamStatus] = useState('');
  const [lastError, setLastError] = useState(null);
  const [unconfiguredNotice, setUnconfiguredNotice] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // History sidebar
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);

  // Dynamic topic suggestions
  const [topicGroups, setTopicGroups] = useState(DEFAULT_TOPIC_GROUPS);

  // Voice input
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  const chatScrollRef = useRef(null);
  const inputRef = useRef(null);
  const abortControllerRef = useRef(null);

  const SpeechRecognitionApi =
    typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;

  const scrollToBottom = () => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const loadConversations = useCallback(async () => {
    if (typeof aiApi.getConversations !== 'function') return;
    try {
      const list = await aiApi.getConversations();
      if (Array.isArray(list)) {
        setConversations(list);
      }
    } catch {
      // Non-fatal
    }
  }, []);

  useEffect(() => {
    loadConversations();
    if (typeof aiApi.getSuggestions === 'function') {
      aiApi
        .getSuggestions()
        .then((groups) => {
          if (Array.isArray(groups) && groups.length > 0) {
            setTopicGroups(groups);
          }
        })
        .catch(() => { });
    }
  }, [loadConversations]);

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
    for (let i = 0; i < msgList.length; i += 1) {
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

  const handleStopStream = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
    setStreamStatus('');
  };

  const handleSend = useCallback(
    async (questionToSend) => {
      const q = (questionToSend || inputQuery).trim();
      if (!q || loading) return;

      const history = buildHistory(messages);

      setInputQuery('');
      setLastError(null);

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const userMsgId = `u-${Date.now()}`;
      const newUserMessage = {
        id: userMsgId,
        role: 'user',
        text: q,
        timestamp: timeStr,
      };

      if (q.length < 3) {
        const assistantMsg = {
          id: `a-${Date.now() + 1}`,
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
      setStreamStatus('Querying your data...');

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const streamingMsgId = `a-${Date.now() + 1}`;
      const canStream = typeof aiApi.askQuestionStream === 'function';

      try {
        let data = null;

        if (canStream) {
          setMessages((prev) => [
            ...prev,
            {
              id: streamingMsgId,
              role: 'assistant',
              question: q,
              text: '',
              report: null,
              isStreaming: true,
              timestamp: timeStr,
            },
          ]);

          data = await aiApi.askQuestionStream({
            question: q,
            history,
            conversationId: activeConversationId,
            signal: controller.signal,
            onStatus: (s) => {
              if (s?.message) setStreamStatus(s.message);
            },
            onChunk: (chunkText) => {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === streamingMsgId ? { ...m, text: `${m.text}${chunkText}` } : m
                )
              );
            },
          });

          setMessages((prev) =>
            prev.map((m) =>
              m.id === streamingMsgId
                ? {
                  ...m,
                  text: data?.answer ?? m.text,
                  report: data || null,
                  sql: data?.sql || null,
                  assumptions: data?.assumptions || null,
                  isClarification: Boolean(data?.isClarification),
                  isStreaming: false,
                  timestamp: new Date().toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  }),
                }
                : m
            )
          );
        } else {
          data =
            history.length > 0 || activeConversationId
              ? await aiApi.askQuestion(q, history, activeConversationId)
              : await aiApi.askQuestion(q);

          const assistantMsg = {
            id: streamingMsgId,
            role: 'assistant',
            question: q,
            text: data.answer,
            report: data,
            sql: data.sql || null,
            assumptions: data.assumptions || null,
            isClarification: Boolean(data.isClarification),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setMessages((prev) => [...prev, assistantMsg]);
        }

        if (data?.conversationId && data.conversationId !== activeConversationId) {
          setActiveConversationId(data.conversationId);
        }
        loadConversations();
      } catch (err) {
        if (err.name === 'AbortError') {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === streamingMsgId
                ? { ...m, text: m.text || 'Response stopped by user.', isStreaming: false }
                : m
            )
          );
          return;
        }

        const errorMsg =
          err.details?.[0]?.message ||
          err.response?.data?.error?.details?.[0]?.message ||
          err.response?.data?.error?.message ||
          err.response?.data?.message ||
          err.message ||
          'Failed to process query. Please try again.';
        setLastError({ question: q, message: errorMsg });

        if (
          err.code === 'AI_NOT_CONFIGURED' ||
          err.response?.data?.error?.code === 'AI_NOT_CONFIGURED'
        ) {
          setUnconfiguredNotice(true);
        }

        showToast(errorMsg, 'error');

        setMessages((prev) => {
          const exists = prev.some((m) => m.id === streamingMsgId);
          if (exists) {
            return prev.map((m) =>
              m.id === streamingMsgId
                ? {
                  ...m,
                  isError: true,
                  isStreaming: false,
                  text: errorMsg,
                }
                : m
            );
          }
          return [
            ...prev,
            {
              id: streamingMsgId,
              role: 'assistant',
              isError: true,
              text: errorMsg,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ];
        });
      } finally {
        abortControllerRef.current = null;
        setLoading(false);
        setStreamStatus('');
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    },
    [inputQuery, loading, messages, buildHistory, activeConversationId, loadConversations, showToast]
  );

  const handleGenerateInsights = async () => {
    if (loading || typeof aiApi.generateInsights !== 'function') return;
    setLoading(true);
    setLastError(null);
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = {
      id: `u-ins-${Date.now()}`,
      role: 'user',
      text: 'Quick Summary',
      timestamp: timeStr,
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const data = await aiApi.generateInsights({ conversationId: activeConversationId });
      setMessages((prev) => [
        ...prev,
        {
          id: `a-ins-${Date.now() + 1}`,
          role: 'assistant',
          question: 'Quick Summary',
          text: data.answer,
          report: data,
          sql: data.sql || null,
          assumptions: data.assumptions || null,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      if (data?.conversationId && data.conversationId !== activeConversationId) {
        setActiveConversationId(data.conversationId);
      }
      loadConversations();
    } catch (err) {
      const msg = err?.message || 'Unable to generate insights.';
      showToast(msg, 'error');
      setMessages((prev) => [
        ...prev,
        {
          id: `a-ins-err-${Date.now() + 1}`,
          role: 'assistant',
          isError: true,
          text: msg,
          timestamp: timeStr,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = async (convId) => {
    if (typeof aiApi.getConversationMessages !== 'function') return;
    try {
      const res = await aiApi.getConversationMessages(convId);
      setActiveConversationId(convId);
      const loaded = (res?.messages || []).map((m) => ({
        ...m,
        timestamp: m.createdAt
          ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '',
      }));
      setMessages(loaded.length > 0 ? loaded : [createWelcomeMessage(`welcome-${convId}`)]);
      setLastError(null);
    } catch (err) {
      showToast(err?.message || 'Failed to load conversation.', 'error');
    }
  };

  const handleNewChat = () => {
    setActiveConversationId(null);
    setMessages([createWelcomeMessage(`welcome-${Date.now()}`)]);
    setLastError(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleRenameConversation = async (convId, title) => {
    if (typeof aiApi.renameConversation !== 'function') return;
    try {
      const updated = await aiApi.renameConversation(convId, title);
      setConversations((prev) =>
        prev.map((c) => (Number(c.id) === Number(convId) ? { ...c, title: updated.title } : c))
      );
    } catch (err) {
      showToast(err?.message || 'Failed to rename conversation.', 'error');
    }
  };

  const handleDeleteConversation = async (convId) => {
    if (typeof aiApi.deleteConversation !== 'function') return;
    try {
      await aiApi.deleteConversation(convId);
      setConversations((prev) => prev.filter((c) => Number(c.id) !== Number(convId)));
      if (Number(activeConversationId) === Number(convId)) {
        handleNewChat();
      }
      showToast('Conversation deleted', 'info');
    } catch (err) {
      showToast(err?.message || 'Failed to delete conversation.', 'error');
    }
  };

  const handleClearAllConversations = async () => {
    if (typeof aiApi.clearAllConversations !== 'function') return;
    try {
      await aiApi.clearAllConversations();
      setConversations([]);
      setActiveConversationId(null);
      setMessages([createWelcomeMessage(`welcome-${Date.now()}`)]);
      setLastError(null);
      showToast('All conversations cleared', 'info');
    } catch (err) {
      showToast(err?.message || 'Failed to clear conversations.', 'error');
    }
  };

  const handleFeedback = async (messageId, rating, localMsgId) => {
    if (typeof aiApi.submitFeedback !== 'function') return;
    try {
      await aiApi.submitFeedback({ messageId, rating });
      setMessages((prev) =>
        prev.map((m) => (m.id === localMsgId ? { ...m, feedback: rating } : m))
      );
      showToast('Thank you for your feedback', 'success');
    } catch (err) {
      showToast(err?.message || 'Unable to save feedback.', 'error');
    }
  };

  const handlePinWidget = async (widgetPayload) => {
    if (typeof aiApi.pinWidget !== 'function') return;
    try {
      await aiApi.pinWidget(widgetPayload);
      showToast('Pinned to Dashboard', 'success');
    } catch (err) {
      showToast(err?.message || 'Failed to pin widget.', 'error');
    }
  };

  const handleToggleVoice = () => {
    if (!SpeechRecognitionApi) return;
    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }

    const recognition = new SpeechRecognitionApi();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      if (transcript) {
        setInputQuery((prev) => (prev ? `${prev} ${transcript}` : transcript).slice(0, 500));
      }
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
      return;
    }
    if (
      e.key === 'ArrowUp' &&
      (!inputQuery || e.target.selectionStart === 0)
    ) {
      const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
      if (lastUserMsg?.text) {
        e.preventDefault();
        setInputQuery(lastUserMsg.text);
      }
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
    setActiveConversationId(null);
    setMessages([createWelcomeMessage('welcome-reset')]);
    setLastError(null);
    showToast('Conversation cleared', 'info');
  };

  const isInitialState = messages.length <= 1;

  return (
    <div className="chat-page">
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setSidebarOpen((prev) => !prev)}
            aria-label={sidebarOpen ? 'Hide chat history' : 'Show chat history'}
          >
            <PanelLeft size={14} aria-hidden="true" />
          </button>
          <h2>AI Assistant</h2>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleGenerateInsights}
            disabled={loading}
          >
            <Sparkles size={14} aria-hidden="true" />
            <span>Quick Summary</span>
          </button>

          <button type="button" className="btn btn-secondary btn-sm" onClick={handleClearChat}>
            <RotateCcw size={14} aria-hidden="true" />
            <span>Clear Chat</span>
          </button>
        </div>
      </div>

      {unconfiguredNotice && (
        <div className="alert alert-warning" role="alert">
          <AlertCircle
            size={18}
            style={{ color: 'var(--warning)', flexShrink: 0, marginTop: '2px' }}
            aria-hidden="true"
          />
          <div>
            <div className="alert-warning-title">AI Provider Configuration Notice</div>
            <p style={{ marginTop: 'var(--space-1)', color: 'var(--text-primary)' }}>
              AI provider API key is not configured in root <code>.env</code>. Set{' '}
              <code>GEMINI_API_KEY</code> or <code>OPENAI_API_KEY</code>, or keep{' '}
              <code>AI_PROVIDER=mock</code>.
            </p>
          </div>
        </div>
      )}

      <div className="chat-workspace">
        <ChatHistorySidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          loading={loading}
          isOpen={sidebarOpen}
          onNewChat={handleNewChat}
          onSelectConversation={handleSelectConversation}
          onRenameConversation={handleRenameConversation}
          onDeleteConversation={handleDeleteConversation}
          onClearAllConversations={handleClearAllConversations}
        />

        <div className="chat-panel">
          <div ref={chatScrollRef} className="chat-scroll-area">
            {isInitialState ? (
              <AIInitialState
                welcomeText={WELCOME_TEXT}
                topicGroups={topicGroups}
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
                    onFeedback={handleFeedback}
                    onPinWidget={handlePinWidget}
                    onSelectFollowUp={handleSend}
                    isAdmin={isAdmin}
                  />
                ))}

                {loading && (
                  <div
                    role="status"
                    aria-live="polite"
                    style={{
                      alignSelf: 'flex-start',
                      color: 'var(--text-muted)',
                      fontSize: '0.875rem',
                      padding: 'var(--space-2)',
                    }}
                  >
                    {streamStatus || 'Querying your data...'}
                  </div>
                )}
              </div>
            )}
          </div>

          {lastError && !loading && (
            <div className="chat-retry-bar" role="alert">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  color: 'var(--danger)',
                }}
              >
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
              <textarea
                ref={inputRef}
                rows={1}
                aria-label="Ask a question"
                className="form-control chat-textarea"
                placeholder="Ask about revenue, customer spending, or product metrics... (e.g. Which customer spent the most?)"
                maxLength={500}
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                autoFocus
              />

              {SpeechRecognitionApi && (
                <button
                  type="button"
                  className={`btn btn-secondary ${listening ? 'btn-danger' : ''}`}
                  onClick={handleToggleVoice}
                  aria-label={listening ? 'Stop voice input' : 'Start voice input'}
                  title="Voice input"
                  disabled={loading}
                >
                  {listening ? <MicOff size={15} aria-hidden="true" /> : <Mic size={15} aria-hidden="true" />}
                </button>
              )}

              {loading && (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleStopStream}
                >
                  <Square size={13} aria-hidden="true" />
                  <span>Stop</span>
                </button>
              )}

              <button
                type="button"
                className="btn btn-primary"
                disabled={!inputQuery.trim() || inputQuery.length > 500 || loading}
                onClick={() => handleSend()}
              >
                <span>Send</span>
              </button>
            </div>
            <div
              className={`chat-char-count tabular-nums ${inputQuery.length >= 500 ? 'form-counter-limit' : ''
                }`}
            >
              <span>Enter to send • Shift+Enter for new line • ↑ last question</span>
              <span>{inputQuery.length}/500</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
