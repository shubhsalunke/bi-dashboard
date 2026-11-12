import React from 'react';
import { AlertCircle } from 'lucide-react';
import Modal from '../common/Modal';

export const UserConfirmModal = ({
  isOpen,
  mode, // 'deactivate' | 'delete'
  targetUser,
  processing = false,
  onClose,
  onConfirm,
}) => {
  const isDelete = mode === 'delete';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth={460}
      title={isDelete ? 'Confirm User Deletion' : 'Confirm Deactivation'}
      footer={
        <>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={processing}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={onConfirm}
            disabled={processing}
          >
            {processing
              ? isDelete
                ? 'Deleting...'
                : 'Deactivating...'
              : isDelete
              ? 'Delete User'
              : 'Confirm Deactivation'}
          </button>
        </>
      }
    >
      <div className="stack-md">
        <p style={{ fontSize: '0.875rem', lineHeight: 1.5, color: 'var(--text-primary)' }}>
          Are you sure you want to {isDelete ? 'permanently delete' : 'deactivate'} user{' '}
          <strong>{targetUser?.name}</strong> (<code>{targetUser?.email}</code>)?
        </p>
        <div className="alert alert-danger">
          <AlertCircle size={18} style={{ flexShrink: 0 }} aria-hidden="true" />
          <span>
            {isDelete
              ? 'This permanently removes the account. Users with recorded sales cannot be deleted and must be deactivated instead.'
              : 'This user will immediately be prevented from logging into the platform until reactivated.'}
          </span>
        </div>
      </div>
    </Modal>
  );
};

export default UserConfirmModal;

