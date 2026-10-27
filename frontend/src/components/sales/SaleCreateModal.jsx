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

  const handleItemChange = (index, field, value) => {
    const updated = [...orderItems];
    updated[index][field] = field === 'quantity' ? parseInt(value, 10) || 1 : value;
    setOrderItems(updated);
  };

  const calculatePreviewTotal = () => {
    return orderItems.reduce((acc, item) => {
      const prod = products.find((p) => p.id === parseInt(item.product_id, 10));
      if (!prod) return acc;
      return acc + (parseFloat(prod.unit_price) * (item.quantity || 1));
    }, 0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      setFormError('Please select a customer');
      return;
    }
    const invalidItem = orderItems.find((it) => !it.product_id || it.quantity < 1);
    if (invalidItem) {
      setFormError('All items must have a selected product and quantity >= 1');
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
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Create Sale'}
          </button>
        </>
      }
    >
      <form id="sale-create-form" onSubmit={handleSubmit}>
        {formError && (
          <div style={{ color: 'var(--danger)', fontSize: '0.8125rem', marginBottom: '12px' }}>
            {formError}
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Customer *</label>
          <select
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

        <div className="form-group">
          <label className="form-label">Sale Date *</label>
          <input
            type="date"
            className="form-control"
            value={saleDate}
            onChange={(e) => setSaleDate(e.target.value)}
            required
          />
        </div>

        <div style={{ marginTop: '16px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            Products
          </span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleAddItem}
          >
            Add Item
          </button>
        </div>

        {orderItems.map((item, idx) => (
          <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
            <select
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
              min="1"
              className="form-control"
              value={item.quantity}
              onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
              required
            />

            {orderItems.length > 1 && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleRemoveItem(idx)}
                style={{ padding: '6px' }}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}

        <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', textAlign: 'right', fontWeight: 600 }}>
          Estimated Total: {formatCurrency(calculatePreviewTotal())}
        </div>
      </form>
    </Modal>
  );
};

export default SaleCreateModal;
