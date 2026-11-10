import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { formatCurrency } from '../../utils/format';

export const SaleCreateModal = ({
  isOpen,
  onClose,
  onSubmit,
  loading,
  customers,
  products,
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [saleDate, setSaleDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [orderItems, setOrderItems] = useState([{ product_id: '', quantity: 1 }]);
  const [formError, setFormError] = useState('');

  const handleAddItem = () => {
    setOrderItems([...orderItems, { product_id: '', quantity: 1 }]);
  };

  const handleRemoveItem = (index) => {
    if (orderItems.length <= 1) return;
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handleNumberKeyDown = (e) => {
    if (['e', 'E', '+', '-', '.'].includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...orderItems];
    if (field === 'quantity') {
      let clean = String(value);
      if (/^0[0-9]+/.test(clean)) {
        clean = clean.replace(/^0+/, '');
      }
      const parsed = parseInt(clean, 10);
      updated[index][field] = isNaN(parsed) ? '' : parsed;
    } else {
      updated[index][field] = value;
    }
    setOrderItems(updated);
  };

  const calculatePreviewTotal = () => {
    return orderItems.reduce((acc, item) => {
      const prod = products.find((p) => p.id === parseInt(item.product_id, 10));
      if (!prod) return acc;
      return acc + (parseFloat(prod.unit_price) * (item.quantity || 1));
    }, 0);
  };

  const isFormValid =
    !!selectedCustomerId &&
    orderItems.length > 0 &&
    orderItems.every(
      (it) =>
        Boolean(it.product_id) &&
        Number.isInteger(Number(it.quantity)) &&
        Number(it.quantity) >= 1 &&
        Number(it.quantity) <= 100000
    );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      setFormError('Please select a customer');
      return;
    }
    const invalidItem = orderItems.find(
      (it) =>
        !it.product_id ||
        !Number.isInteger(Number(it.quantity)) ||
        Number(it.quantity) < 1 ||
        Number(it.quantity) > 100000
    );
    if (invalidItem) {
      setFormError('All items must have a selected product and whole quantity between 1 and 100,000');
      return;
    }

    const payload = {
      customer_id: parseInt(selectedCustomerId, 10),
      sale_date: saleDate,
      items: orderItems.map((item) => ({
        product_id: parseInt(item.product_id, 10),
        quantity: parseInt(item.quantity, 10),
      })),
    };

    onSubmit(payload, setFormError);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New Sale Order"
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
            form="sale-create-form"
            className="btn btn-primary"
            disabled={loading || !isFormValid}
          >
            {loading ? 'Saving...' : 'Create Sale'}
          </button>
        </>
      }
    >
      <form id="sale-create-form" onSubmit={handleSubmit} noValidate>
        {formError && (
          <div className="alert alert-danger" style={{ marginBottom: 'var(--space-4)' }}>
            {formError}
          </div>
        )}

        <div className="form-grid-2" style={{ marginBottom: 'var(--space-4)' }}>
          <div className="form-group form-group-flush">
            <label htmlFor="sale-customer" className="form-label">Customer *</label>
            <select
              id="sale-customer"
              className="form-control"
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              required
            >
              <option value="">Select a customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.customer_name} ({c.city})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group form-group-flush">
            <label htmlFor="sale-date" className="form-label">Sale Date *</label>
            <input
              id="sale-date"
              type="date"
              className="form-control"
              value={saleDate}
              onChange={(e) => setSaleDate(e.target.value)}
              required
            />
          </div>
        </div>

        <div style={{ marginBottom: 'var(--space-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="form-label" style={{ fontWeight: 600 }}>Products</span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleAddItem}
          >
            Add Item
          </button>
        </div>

        <div className="stack-md" style={{ gap: 'var(--space-3)' }}>
          {orderItems.map((item, idx) => {
            const itemQty = Number(item.quantity);
            const hasQtyError = item.quantity !== '' && (!Number.isInteger(itemQty) || itemQty < 1 || itemQty > 100000);
            return (
              <div key={idx}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 96px auto', gap: 'var(--space-2)', alignItems: 'center' }}>
                  <select
                    aria-label={`Product line ${idx + 1}`}
                    className="form-control"
                    value={item.product_id}
                    onChange={(e) => handleItemChange(idx, 'product_id', e.target.value)}
                    required
                  >
                    <option value="">Select product</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.product_name} ({formatCurrency(p.unit_price)})
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    aria-label={`Quantity line ${idx + 1}`}
                    min="1"
                    max="100000"
                    step="1"
                    className="form-control tabular-nums"
                    placeholder="Qty"
                    value={item.quantity}
                    onKeyDown={handleNumberKeyDown}
                    onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                    required
                  />

                  {orderItems.length > 1 && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-icon"
                      onClick={() => handleRemoveItem(idx)}
                      aria-label={`Remove item ${idx + 1}`}
                      title="Remove item"
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                  )}
                </div>
                {hasQtyError && (
                  <div className="form-error">
                    Quantity must be a whole number between 1 and 100,000
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div
          className="tabular-nums"
          style={{
            marginTop: 'var(--space-4)',
            paddingTop: 'var(--space-3)',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontWeight: 600,
          }}
        >
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Estimated Total</span>
          <span>{formatCurrency(calculatePreviewTotal())}</span>
        </div>
      </form>
    </Modal>
  );
};

export default SaleCreateModal;
