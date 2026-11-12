import React, { useState } from 'react';
import { MessageSquare, Plus, Edit2, Trash2, Check, X } from 'lucide-react';
import Modal from '../common/Modal';

export const ChatHistorySidebar = ({
  conversations = [],
  activeConversationId,
  loading = false,
  isOpen = true,
  onNewChat,
  onSelectConversation,
  onRenameConversation,
  onDeleteConversation,
  onClearAllConversations,
}) => {
  const [editingId, setEditingId] = useState(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);

  if (!isOpen) return null;

  const handleConfirmClearAll = async () => {
    if (!onClearAllConversations || clearingAll) return;
    setClearingAll(true);
    try {
      await onClearAllConversations();
      setConfirmClearOpen(false);
    } finally {
      setClearingAll(false);
    }
  };

  const startEdit = (conv, e) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setDraftTitle(conv.title || '');
  };

  const saveEdit = async (convId, e) => {
    e.stopPropagation();
    const clean = draftTitle.trim();
    if (!clean) return;
    await onRenameConversation(convId, clean);
    setEditingId(null);
  };

  const cancelEdit = (e) => {
    e.stopPropagation();
    setEditingId(null);
  };

  return (
    <aside className="chat-history-sidebar" aria-label="Past conversations">
      <div className="chat-history-header">
        <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
          History
        </span>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {conversations.length > 0 && onClearAllConversations && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setConfirmClearOpen(true)}
              disabled={loading || clearingAll}
              title="Clear all conversation history"
            >
              <Trash2 size={12} aria-hidden="true" />
              <span>Clear All</span>
            </button>
          )}
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onNewChat}
            disabled={loading}
          >
            <Plus size={13} aria-hidden="true" />
            <span>New Chat</span>
          </button>
        </div>
      </div>

      <Modal
        isOpen={confirmClearOpen}
        onClose={() => !clearingAll && setConfirmClearOpen(false)}
        maxWidth={420}
        title="Clear All Chat History"
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setConfirmClearOpen(false)}
              disabled={clearingAll}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleConfirmClearAll}
              disabled={clearingAll}
            >
              {clearingAll ? 'Clearing...' : 'Confirm Clear All'}
            </button>
          </>
        }
      >
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
          Are you sure you want to delete all <strong>{conversations.length}</strong> saved
          conversation{conversations.length === 1 ? '' : 's'}? This cannot be undone.
        </p>
      </Modal>

      <div className="chat-history-list">
        {conversations.length === 0 ? (
          <div className="chat-history-empty">
            No saved conversations yet. Start asking questions to build history.
          </div>
        ) : (
          conversations.map((conv) => {
            const isActive = Number(conv.id) === Number(activeConversationId);
            const isEditing = editingId === conv.id;

            return (
              <div
                key={conv.id}
                role="button"
                tabIndex={0}
                className={`chat-history-item ${isActive ? 'active' : ''}`}
                onClick={() => !isEditing && onSelectConversation(conv.id)}
                onKeyDown={(e) => {
                  if (!isEditing && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onSelectConversation(conv.id);
                  }
                }}
              >
                {isEditing ? (
                  <div
                    className="chat-history-edit-row"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="text"
                      aria-label="Rename conversation"
                      className="form-control form-control-sm"
                      maxLength={150}
                      value={draftTitle}
                      onChange={(e) => setDraftTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit(conv.id, e);
                        if (e.key === 'Escape') cancelEdit(e);
                      }}
                      autoFocus
                    />
                    <button
                      type="button"
                      className="chat-icon-btn"
                      aria-label="Save conversation name"
                      onClick={(e) => saveEdit(conv.id, e)}
                    >
                      <Check size={13} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="chat-icon-btn"
                      aria-label="Cancel rename"
                      onClick={cancelEdit}
                    >
                      <X size={13} aria-hidden="true" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="chat-history-item-main">
                      <MessageSquare size={13} style={{ flexShrink: 0, color: 'var(--text-muted)' }} aria-hidden="true" />
                      <span className="chat-history-item-title">{conv.title}</span>
                    </div>
                    <div className="chat-history-item-actions">
                      <button
                        type="button"
                        className="chat-icon-btn"
                        aria-label={`Rename ${conv.title}`}
                        onClick={(e) => startEdit(conv, e)}
                      >
                        <Edit2 size={12} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="chat-icon-btn chat-icon-btn-danger"
                        aria-label={`Delete ${conv.title}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteConversation(conv.id);
                        }}
                      >
                        <Trash2 size={12} aria-hidden="true" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};

export default ChatHistorySidebar;

