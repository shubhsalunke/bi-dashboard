import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';

export const ProductFormModal = ({
  isOpen,
  product,
  categories,
  onClose,
  onSubmit,
  loading,
}) => {
  const [formData, setFormData] = useState({
    product_name: '',
    category: categories[0] || 'Cloud Infrastructure',
    unit_price: '',
    is_active: true,
  });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (product) {
      setFormData({
        product_name: product.product_name,
        category: product.category,
        unit_price: product.unit_price,
        is_active: product.is_active,
      });
    } else {
      setFormData({
        product_name: '',
        category: categories[0] || 'Cloud Infrastructure',
        unit_price: '',
        is_active: true,
      });
    }
    setFormError('');
  }, [product, categories]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const priceNum = parseFloat(formData.unit_price);
    if (!formData.product_name.trim()) {
      setFormError('Product name is required');
      return;
    }
    if (isNaN(priceNum) || priceNum <= 0) {
      setFormError('Unit price must be a valid number greater than zero');
      return;
    }
    onSubmit({
      product_name: formData.product_name.trim(),
      category: formData.category,
      unit_price: priceNum,
      is_active: formData.is_active,
    }, setFormError);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product ? 'Edit Product' : 'Add Product'}
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
            type="submit"
            form="product-form"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Saving...' : product ? 'Save Changes' : 'Add Product'}
          </button>
        </>
      }
    >
      <form id="product-form" onSubmit={handleSubmit}>
        {formError && (
          <div style={{ color: 'var(--danger)', fontSize: '0.8125rem', marginBottom: '12px' }}>
            {formError}
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Product Name *</label>
          <input
            type="text"
            className="form-control"
            placeholder="Product name"
            value={formData.product_name}
            onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Category *</label>
          <select
            className="form-control"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Unit Price (₹) *</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            className="form-control"
            placeholder="0.00"
            value={formData.unit_price}
            onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Status</label>
          <select
            className="form-control"
            value={formData.is_active ? 'true' : 'false'}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </form>
    </Modal>
  );
};

export default ProductFormModal;
