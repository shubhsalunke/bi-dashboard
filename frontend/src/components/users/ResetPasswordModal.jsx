import React, { useState } from 'react';
import { KeyRound, Copy, Check, AlertCircle, CheckCircle2 } from 'lucide-react';
import Modal from '../common/Modal';

export const ResetPasswordModal = ({
  isOpen,
  onClose,
  targetUser,
  onConfirmReset,
  initialTemporaryPassword = '',
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState(initialTemporaryPassword);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async () => {
    if (!targetUser) return;
    setSubmitting(true);
    setError('');
    try {
      const result = await onConfirmReset(targetUser.id);
      setTemporaryPassword(result?.temporaryPassword || '');
    } catch (err) {
      setError(err?.message || 'Failed to reset password');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = async () => {
    if (!temporaryPassword) return;
    try {
      await navigator.clipboard.writeText(temporaryPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth={480}
      title="Reset User Password"
      footer={
        temporaryPassword ? (
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Done
          </button>
        ) : (
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleReset}
              disabled={submitting}
            >
              <KeyRound size={14} aria-hidden="true" />
              <span>{submitting ? 'Generating...' : 'Generate Temporary Password'}</span>
            </button>
          </>
        )
      }
    >
      <div className="stack-md">
        {error && (
          <div className="alert alert-danger" role="alert">
            <AlertCircle size={16} aria-hidden="true" style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {!temporaryPassword ? (
          <>
            <p style={{ fontSize: '0.875rem', lineHeight: 1.5, color: 'var(--text-primary)' }}>
              Generate a secure one-time temporary password for{' '}
              <strong>{targetUser?.name}</strong> (<code>{targetUser?.email}</code>)?
            </p>
            <div className="alert alert-warning" style={{ fontSize: '0.8125rem' }}>
              <AlertCircle size={16} aria-hidden="true" style={{ flexShrink: 0 }} />
              <span>
                Their current password will be replaced immediately. Share the temporary
                password securely with the user.
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="alert alert-success">
              <CheckCircle2 size={16} aria-hidden="true" style={{ flexShrink: 0 }} />
              <span>
                Temporary password generated for <strong>{targetUser?.name}</strong>.
              </span>
            </div>

            <div>
              <div className="form-label">Temporary Password (shown once)</div>
              <div className="temp-password-box">
                <code data-testid="temporary-password-value">{temporaryPassword}</code>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <>
                      <Check size={13} aria-hidden="true" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} aria-hidden="true" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <div className="form-helper-text">
                Make sure to copy this password now — for security, it cannot be retrieved again after closing this window.
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default ResetPasswordModal;

