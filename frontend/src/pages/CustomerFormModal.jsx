import React, { useState, useEffect } from 'react';
import { Modal } from '../components/common/Modal';
import { customersApi } from '../api/customers.api';
import { useToast } from '../context/ToastContext';

export const CustomerFormModal = ({ isOpen, onClose, customer = null, onSaved }) => {
  const [formData, setFormData] = useState({
    customer_code: '',
    customer_name: '',
    email: '',
    phone: '',
    city: '',
    status: 'active',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { showToast } = useToast();

  useEffect(() => {
    if (customer) {
      setFormData({
        customer_code: customer.customer_code || '',
        customer_name: customer.customer_name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        city: customer.city || '',
        status: customer.status || 'active',
      });
    } else {
      setFormData({
        customer_code: '',
        customer_name: '',
        email: '',
        phone: '',
        city: '',
        status: 'active',
      });
    }
    setErrors({});
  }, [customer, isOpen]);

  const validate = () => {
    const errs = {};
    if (!formData.customer_code.trim()) errs.customer_code = 'Customer code is required';
    if (!formData.customer_name.trim()) errs.customer_name = 'Customer name is required';
    if (!formData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errs.email = 'Please provide a valid email format';
    }
    if (!formData.city.trim()) errs.city = 'City is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      if (customer) {
        await customersApi.updateCustomer(customer.id, formData);
        showToast(`Customer '${formData.customer_name}' updated successfully!`, 'success');
      } else {
        await customersApi.createCustomer(formData);
        showToast(`Customer '${formData.customer_name}' created successfully!`, 'success');
      }
      onSaved();
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to save customer', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={customer ? `Edit Customer: ${customer.customer_name}` : 'Create New Customer Account'}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="submit" form="customer-form" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : customer ? 'Update Customer' : 'Create Customer'}
          </button>
        </>
      }
    >
      <form id="customer-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Customer Code *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. CUST-045"
              value={formData.customer_code}
              onChange={(e) => setFormData({ ...formData, customer_code: e.target.value })}
              required
            />
            {errors.customer_code && <div className="form-error">{errors.customer_code}</div>}
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Company / Client Name *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Nova Innovations Corp"
              value={formData.customer_name}
              onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
              required
            />
            {errors.customer_name && <div className="form-error">{errors.customer_name}</div>}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Primary Email *</label>
            <input
              type="email"
              className="form-control"
              placeholder="billing@company.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            {errors.email && <div className="form-error">{errors.email}</div>}
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Phone Number</label>
            <input
              type="text"
              className="form-control"
              placeholder="+1-555-0123"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">City *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Chicago"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              required
            />
            {errors.city && <div className="form-error">{errors.city}</div>}
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Status</label>
            <select
              className="form-control"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </form>
    </Modal>
  );
};
