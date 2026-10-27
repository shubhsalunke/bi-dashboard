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
    sku: '',
    product_name: '',
    category: categories[0] || 'Cloud Infrastructure',
    brand: '',
    supplier: '',
    unit: 'per unit',
    unit_price: '',
    cost_price: '',
    stock_quantity: 0,
    gst_percent: 18,
    reorder_level: 10,
    warranty_months: '',
    description: '',
    is_active: true,
  });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (product) {
      setFormData({
        sku: product.sku || '',
        product_name: product.product_name || '',
        category: product.category || categories[0] || 'Cloud Infrastructure',
        brand: product.brand || '',
        supplier: product.supplier || '',
        unit: product.unit || 'per unit',
        unit_price: product.unit_price ?? '',
        cost_price: product.cost_price !== null && product.cost_price !== undefined ? product.cost_price : '',
        stock_quantity: product.stock_quantity ?? 0,
        gst_percent: product.gst_percent ?? 18,
        reorder_level: product.reorder_level ?? 10,
        warranty_months: product.warranty_months !== null && product.warranty_months !== undefined ? product.warranty_months : '',
        description: product.description || '',
        is_active: product.is_active !== undefined ? product.is_active : true,
      });
    } else {
      setFormData({
        sku: '',
        product_name: '',
        category: categories[0] || 'Cloud Infrastructure',
        brand: '',
        supplier: '',
        unit: 'per unit',
        unit_price: '',
        cost_price: '',
        stock_quantity: 0,
        gst_percent: 18,
        reorder_level: 10,
        warranty_months: '',
        description: '',
        is_active: true,
      });
    }
    setFormError('');
  }, [product, categories]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.product_name.trim()) {
      setFormError('Product name is required');
      return;
    }

    const priceNum = parseFloat(formData.unit_price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setFormError('Unit price must be a valid number greater than zero');
      return;
    }

    let costNum = null;
    if (formData.cost_price !== '' && formData.cost_price !== null && formData.cost_price !== undefined) {
      costNum = parseFloat(formData.cost_price);
      if (isNaN(costNum) || costNum < 0) {
        setFormError('Cost price must be a valid number greater than or equal to zero');
        return;
      }
    }

    const stockNum = parseInt(formData.stock_quantity, 10);
    if (isNaN(stockNum) || stockNum < 0 || stockNum !== Number(formData.stock_quantity)) {
      setFormError('Stock quantity must be a whole number greater than or equal to zero');
      return;
    }

    const gstNum = parseFloat(formData.gst_percent);
    if (isNaN(gstNum) || gstNum < 0 || gstNum > 28) {
      setFormError('GST % must be a number between 0 and 28');
      return;
    }

    const reorderNum = parseInt(formData.reorder_level, 10);
    if (isNaN(reorderNum) || reorderNum < 0 || reorderNum !== Number(formData.reorder_level)) {
      setFormError('Reorder level must be a whole number greater than or equal to zero');
      return;
    }

    let warrantyNum = null;
    if (formData.warranty_months !== '' && formData.warranty_months !== null && formData.warranty_months !== undefined) {
      warrantyNum = parseInt(formData.warranty_months, 10);
      if (isNaN(warrantyNum) || warrantyNum < 0 || warrantyNum !== Number(formData.warranty_months)) {
        setFormError('Warranty months must be a whole number greater than or equal to zero');
        return;
      }
    }

    const payload = {
      product_name: formData.product_name.trim(),
      category: formData.category,
      brand: formData.brand ? formData.brand.trim() : null,
      supplier: formData.supplier ? formData.supplier.trim() : null,
      unit: formData.unit ? formData.unit.trim() : 'per unit',
      unit_price: priceNum,
      cost_price: costNum,
      stock_quantity: stockNum,
      gst_percent: gstNum,
      reorder_level: reorderNum,
      warranty_months: warrantyNum,
      description: formData.description ? formData.description.trim() : null,
      is_active: formData.is_active,
    };

    if (formData.sku.trim()) {
      payload.sku = formData.sku.trim();
    }

    onSubmit(payload, setFormError);
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group">
            <label htmlFor="product-sku" className="form-label">SKU</label>
            <input
              id="product-sku"
              type="text"
              className="form-control"
              placeholder="e.g. SKU-PRD-001"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label htmlFor="product-category" className="form-label">Category *</label>
            <select
              id="product-category"
              className="form-control"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="product-name" className="form-label">Product Name *</label>
          <input
            id="product-name"
            type="text"
            className="form-control"
            placeholder="Product name"
            value={formData.product_name}
            onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group">
            <label htmlFor="product-brand" className="form-label">Brand</label>
            <input
              id="product-brand"
              type="text"
              className="form-control"
              placeholder="e.g. Tata, Infosys, Reliance"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label htmlFor="product-supplier" className="form-label">Supplier</label>
            <input
              id="product-supplier"
              type="text"
              className="form-control"
              placeholder="Supplier or distributor name"
              value={formData.supplier}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group">
            <label htmlFor="product-unit-price" className="form-label">Unit Price (₹) *</label>
            <input
              id="product-unit-price"
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
            <label htmlFor="product-cost-price" className="form-label">Cost Price (₹)</label>
            <input
              id="product-cost-price"
              type="number"
              step="0.01"
              min="0"
              className="form-control"
              placeholder="0.00"
              value={formData.cost_price}
              onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group">
            <label htmlFor="product-unit" className="form-label">Unit</label>
            <input
              id="product-unit"
              type="text"
              className="form-control"
              placeholder="e.g. per unit, per mo"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label htmlFor="product-gst" className="form-label">GST %</label>
            <input
              id="product-gst"
              type="number"
              step="0.01"
              min="0"
              max="28"
              className="form-control"
              placeholder="18"
              value={formData.gst_percent}
              onChange={(e) => setFormData({ ...formData, gst_percent: e.target.value })}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group">
            <label htmlFor="product-stock" className="form-label">Stock Quantity *</label>
            <input
              id="product-stock"
              type="number"
              step="1"
              min="0"
              className="form-control"
              placeholder="0"
              value={formData.stock_quantity}
              onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="product-reorder-level" className="form-label">Reorder Level *</label>
            <input
              id="product-reorder-level"
              type="number"
              step="1"
              min="0"
              className="form-control"
              placeholder="10"
              value={formData.reorder_level}
              onChange={(e) => setFormData({ ...formData, reorder_level: e.target.value })}
              required
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group">
            <label htmlFor="product-warranty" className="form-label">Warranty (months)</label>
            <input
              id="product-warranty"
              type="number"
              step="1"
              min="0"
              className="form-control"
              placeholder="e.g. 12"
              value={formData.warranty_months}
              onChange={(e) => setFormData({ ...formData, warranty_months: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label htmlFor="product-status" className="form-label">Status</label>
            <select
              id="product-status"
              className="form-control"
              value={formData.is_active ? 'true' : 'false'}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="product-description" className="form-label">Description</label>
          <textarea
            id="product-description"
            className="form-control"
            rows="3"
            placeholder="Product description and technical specifications..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>
      </form>
    </Modal>
  );
};

export default ProductFormModal;
