import React, { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export const Modal = ({
  isOpen,
  onClose,
  title,
  headerExtra = null,
  children,
  footer = null,
  maxWidth = '600px',
}) => {
  const titleId = useId();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalElement = (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        className="modal-dialog"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap', minWidth: 0, flex: 1 }}>
            <h3 id={titleId} className="modal-title">{title}</h3>
            {headerExtra}
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalElement, document.body)
    : modalElement;
};

export default Modal;
