import React from 'react';
import { Modal } from '../common/Modal';

export const ProductDeleteModal = ({ product, loading, onConfirm, onClose }) => {
  if (!product) return null;

  return (
    <Modal
      isOpen={Boolean(product)}
      onClose={onClose}
      title="Update Product Status"
      footer={
        <>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Confirm'}
          </button>
        </>
      }
    >
      <p style={{ color: 'var(--text-main)', fontSize: '0.875rem' }}>
        Are you sure you want to deactivate <strong>{product.product_name}</strong>?
      </p>
    </Modal>
  );
};

export default ProductDeleteModal;
