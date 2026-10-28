import React, { useState, useEffect, useMemo } from 'react';
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
  }, [product, categories, isOpen]);

  // Handle number key down: block 'e', 'E', '+', '-' and '.' on integer inputs
  const handleNumberKeyDown = (e, isInteger = false) => {
    if (['e', 'E', '+', '-'].includes(e.key) || (isInteger && e.key === '.')) {
      e.preventDefault();
    }
  };

  // Strip leading zeros (000123 -> 123)
  const handleNumberChange = (field, rawValue, isInteger = false) => {
    let val = rawValue;
    if (val !== '') {
      if (/^0[0-9]+/.test(val)) {
        val = val.replace(/^0+/, '');
        if (val === '') val = '0';
      } else if (!isInteger && /^0[0-9]/.test(val)) {
        val = val.replace(/^0+(?=\d)/, '');
      }
    }
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  // Live validation calculations
  const fieldErrors = useMemo(() => {
    const errs = {};

    // Product Name
    if (!formData.product_name || !formData.product_name.trim()) {
      errs.product_name = 'Product name is required';
    } else if (formData.product_name.length > 150) {
      errs.product_name = 'Product name must not exceed 150 characters';
    }

    // Product Code (SKU)
    if (formData.sku) {
      if (formData.sku.length > 30) {
        errs.sku = 'Product Code must not exceed 30 characters';
      } else if (!/^[A-Z0-9-]+$/.test(formData.sku)) {
        errs.sku = 'Product Code must only contain letters, numbers, and hyphens';
      }
    }

    // Brand
    if (formData.brand && formData.brand.length > 60) {
      errs.brand = 'Brand must not exceed 60 characters';
    }

    // Supplier
    if (formData.supplier && formData.supplier.length > 100) {
      errs.supplier = 'Supplier must not exceed 100 characters';
    }

    // Unit
    if (formData.unit && formData.unit.length > 30) {
      errs.unit = 'Unit must not exceed 30 characters';
    }

    // Unit Price
    const priceNum = parseFloat(formData.unit_price);
    if (formData.unit_price === '' || formData.unit_price === null || formData.unit_price === undefined || isNaN(priceNum) || priceNum <= 0) {
      errs.unit_price = 'Unit price must be a valid number greater than zero';
    } else if (priceNum < 0.01) {
      errs.unit_price = 'Unit price must be at least ₹0.01';
    } else if (priceNum > 10000000) {
      errs.unit_price = 'Unit price cannot exceed ₹10,000,000 (1 crore)';
    } else if (!/^\d+(\.\d{1,2})?$/.test(String(formData.unit_price).trim())) {
      errs.unit_price = 'Unit price cannot have more than 2 decimal places';
    }

    // Cost Price
    let costNum = null;
    if (formData.cost_price !== '' && formData.cost_price !== null && formData.cost_price !== undefined) {
      costNum = parseFloat(formData.cost_price);
      if (isNaN(costNum) || costNum < 0) {
        errs.cost_price = 'Cost price must be a valid number greater than or equal to zero';
      } else if (costNum > 10000000) {
        errs.cost_price = 'Cost price cannot exceed ₹10,000,000';
      } else if (!/^\d+(\.\d{1,2})?$/.test(String(formData.cost_price).trim())) {
        errs.cost_price = 'Cost price cannot have more than 2 decimal places';
      } else if (!isNaN(priceNum) && costNum > priceNum) {
        errs.cost_price = 'Cost price must not be greater than Unit Price';
      }
    }

    // GST %
    if (formData.gst_percent !== '' && formData.gst_percent !== null && formData.gst_percent !== undefined) {
      const gstNum = parseFloat(formData.gst_percent);
      if (isNaN(gstNum) || gstNum < 0 || gstNum > 28) {
        errs.gst_percent = 'GST % must be a number between 0 and 28';
      } else if (!/^\d+(\.\d{1,2})?$/.test(String(formData.gst_percent).trim())) {
        errs.gst_percent = 'GST % cannot have more than 2 decimal places';
      }
    }

    // Stock Quantity
    if (formData.stock_quantity === '' || formData.stock_quantity === null || formData.stock_quantity === undefined) {
      errs.stock_quantity = 'Stock quantity is required';
    } else {
      const stockNum = Number(formData.stock_quantity);
      if (isNaN(stockNum) || !Number.isInteger(stockNum) || stockNum < 0) {
        errs.stock_quantity = 'Stock quantity must be a whole number greater than or equal to zero';
      } else if (stockNum > 1000000) {
        errs.stock_quantity = 'Stock quantity cannot exceed 1,000,000';
      }
    }

    // Reorder Level
    if (formData.reorder_level === '' || formData.reorder_level === null || formData.reorder_level === undefined) {
      errs.reorder_level = 'Reorder level is required';
    } else {
      const reorderNum = Number(formData.reorder_level);
      if (isNaN(reorderNum) || !Number.isInteger(reorderNum) || reorderNum < 0) {
        errs.reorder_level = 'Reorder level must be a whole number greater than or equal to zero';
      } else if (reorderNum > 1000000) {
        errs.reorder_level = 'Reorder level cannot exceed 1,000,000';
      }
    }

    // Warranty
    if (formData.warranty_months !== '' && formData.warranty_months !== null && formData.warranty_months !== undefined) {
      const warrantyNum = Number(formData.warranty_months);
      if (isNaN(warrantyNum) || !Number.isInteger(warrantyNum) || warrantyNum < 0) {
        errs.warranty_months = 'Warranty months must be a whole number greater than or equal to zero';
      } else if (warrantyNum > 120) {
        errs.warranty_months = 'Warranty months cannot exceed 120';
      }
    }

    // Description
    if (formData.description && formData.description.length > 1000) {
      errs.description = 'Description cannot exceed 1000 characters';
    }

    return errs;
  }, [formData]);

  const isFormValid = Object.keys(fieldErrors).length === 0;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!isFormValid) {
      return;
    }

    const priceNum = parseFloat(formData.unit_price);
    let costNum = null;
    if (formData.cost_price !== '' && formData.cost_price !== null && formData.cost_price !== undefined) {
      costNum = parseFloat(formData.cost_price);
    }
    const stockNum = parseInt(formData.stock_quantity, 10);
    const gstNum = parseFloat(formData.gst_percent);
    const reorderNum = parseInt(formData.reorder_level, 10);

    let warrantyNum = null;
    if (formData.warranty_months !== '' && formData.warranty_months !== null && formData.warranty_months !== undefined) {
      warrantyNum = parseInt(formData.warranty_months, 10);
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
            disabled={loading || !isFormValid}
          >
            {loading ? 'Saving...' : product ? 'Save Changes' : 'Add Product'}
          </button>
        </>
      }
    >
      <form id="product-form" onSubmit={handleSubmit} noValidate>
        {formError && (
          <div style={{ color: 'var(--danger)', fontSize: '0.8125rem', marginBottom: '12px' }}>
            {formError}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group">
            <label htmlFor="product-sku" className="form-label">Product Code</label>
            <input
              id="product-sku"
              type="text"
              className="form-control"
              placeholder="e.g. PRD-001"
              maxLength={30}
              value={formData.sku}
              onChange={(e) => {
                const upper = e.target.value.toUpperCase();
                setFormData((prev) => ({ ...prev, sku: upper }));
              }}
            />
            {fieldErrors.sku && (
              <div className="form-error" style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '2px' }}>
                {fieldErrors.sku}
              </div>
            )}
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
            maxLength={150}
            value={formData.product_name}
            onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
            required
          />
          {fieldErrors.product_name && (
            <div className="form-error" style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '2px' }}>
              {fieldErrors.product_name}
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group">
            <label htmlFor="product-brand" className="form-label">Brand</label>
            <input
              id="product-brand"
              type="text"
              className="form-control"
              placeholder="e.g. Tata, Infosys, Reliance"
              maxLength={60}
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
            />
            {fieldErrors.brand && (
              <div className="form-error" style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '2px' }}>
                {fieldErrors.brand}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="product-supplier" className="form-label">Supplier</label>
            <input
              id="product-supplier"
              type="text"
              className="form-control"
              placeholder="Supplier or distributor name"
              maxLength={100}
              value={formData.supplier}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
            />
            {fieldErrors.supplier && (
              <div className="form-error" style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '2px' }}>
                {fieldErrors.supplier}
              </div>
            )}
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
              max="10000000"
              className="form-control"
              placeholder="0.00"
              value={formData.unit_price}
              onKeyDown={(e) => handleNumberKeyDown(e, false)}
              onChange={(e) => handleNumberChange('unit_price', e.target.value, false)}
              required
            />
            {fieldErrors.unit_price && (
              <div className="form-error" style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '2px' }}>
                {fieldErrors.unit_price}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="product-cost-price" className="form-label">Cost Price (₹)</label>
            <input
              id="product-cost-price"
              type="number"
              step="0.01"
              min="0"
              max="10000000"
              className="form-control"
              placeholder="0.00"
              value={formData.cost_price}
              onKeyDown={(e) => handleNumberKeyDown(e, false)}
              onChange={(e) => handleNumberChange('cost_price', e.target.value, false)}
            />
            {fieldErrors.cost_price && (
              <div className="form-error" style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '2px' }}>
                {fieldErrors.cost_price}
              </div>
            )}
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
              maxLength={30}
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            />
            {fieldErrors.unit && (
              <div className="form-error" style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '2px' }}>
                {fieldErrors.unit}
              </div>
            )}
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
              onKeyDown={(e) => handleNumberKeyDown(e, false)}
              onChange={(e) => handleNumberChange('gst_percent', e.target.value, false)}
            />
            {fieldErrors.gst_percent && (
              <div className="form-error" style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '2px' }}>
                {fieldErrors.gst_percent}
              </div>
            )}
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
              max="1000000"
              className="form-control"
              placeholder="0"
              value={formData.stock_quantity}
              onKeyDown={(e) => handleNumberKeyDown(e, true)}
              onChange={(e) => handleNumberChange('stock_quantity', e.target.value, true)}
              required
            />
            {fieldErrors.stock_quantity && (
              <div className="form-error" style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '2px' }}>
                {fieldErrors.stock_quantity}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="product-reorder-level" className="form-label">Reorder Level *</label>
            <input
              id="product-reorder-level"
              type="number"
              step="1"
              min="0"
              max="1000000"
              className="form-control"
              placeholder="10"
              value={formData.reorder_level}
              onKeyDown={(e) => handleNumberKeyDown(e, true)}
              onChange={(e) => handleNumberChange('reorder_level', e.target.value, true)}
              required
            />
            {fieldErrors.reorder_level && (
              <div className="form-error" style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '2px' }}>
                {fieldErrors.reorder_level}
              </div>
            )}
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
              max="120"
              className="form-control"
              placeholder="e.g. 12"
              value={formData.warranty_months}
              onKeyDown={(e) => handleNumberKeyDown(e, true)}
              onChange={(e) => handleNumberChange('warranty_months', e.target.value, true)}
            />
            {fieldErrors.warranty_months && (
              <div className="form-error" style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '2px' }}>
                {fieldErrors.warranty_months}
              </div>
            )}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label htmlFor="product-description" className="form-label">Description</label>
            <span style={{ fontSize: '0.75rem', color: (formData.description || '').length >= 1000 ? 'var(--danger)' : 'var(--text-muted)' }}>
              {(formData.description || '').length}/1000
            </span>
          </div>
          <textarea
            id="product-description"
            className="form-control"
            rows="3"
            placeholder="Product description and technical specifications..."
            maxLength={1000}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          {fieldErrors.description && (
            <div className="form-error" style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '2px' }}>
              {fieldErrors.description}
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
};

export default ProductFormModal;
