import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../components/common/Modal';
import { customersApi } from '../api/customers.api';
import { useToast } from '../context/ToastContext';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
        phone: (customer.phone || '').replace(/\D/g, '').slice(0, 10),
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

  const validationErrors = useMemo(() => {
    const errs = {};
    if (!formData.customer_code.trim()) {
      errs.customer_code = 'Customer code is required';
    } else if (formData.customer_code.length > 50) {
      errs.customer_code = 'Customer code must not exceed 50 characters';
    }

    if (!formData.customer_name.trim()) {
      errs.customer_name = 'Customer name is required';
    } else if (formData.customer_name.length > 100) {
      errs.customer_name = 'Customer name must not exceed 100 characters';
    }

    if (!formData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (formData.email.length > 254) {
      errs.email = 'Email must not exceed 254 characters';
    } else if (!EMAIL_REGEX.test(formData.email.trim())) {
      errs.email = 'Please provide a valid email format';
    }

    if (formData.phone && formData.phone.length > 0 && formData.phone.length !== 10) {
      errs.phone = 'Phone number must be exactly 10 digits';
    }

    if (!formData.city.trim()) {
      errs.city = 'City is required';
    } else if (formData.city.length > 100) {
      errs.city = 'City must not exceed 100 characters';
    }

    return errs;
  }, [formData]);

  const isValid = Object.keys(validationErrors).length === 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        customer_code: formData.customer_code.trim(),
        customer_name: formData.customer_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        city: formData.city.trim(),
        status: formData.status,
      };

      if (customer) {
        await customersApi.updateCustomer(customer.id, payload);
        showToast(`Customer '${payload.customer_name}' updated successfully!`, 'success');
      } else {
        await customersApi.createCustomer(payload);
        showToast(`Customer '${payload.customer_name}' created successfully!`, 'success');
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
          <button type="submit" form="customer-form" className="btn btn-primary" disabled={loading || !isValid}>
            {loading ? 'Saving...' : customer ? 'Update Customer' : 'Create Customer'}
          </button>
        </>
      }
    >
      <form id="customer-form" onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Customer Code *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. CUST-045"
              maxLength={50}
              value={formData.customer_code}
              onChange={(e) => setFormData({ ...formData, customer_code: e.target.value })}
              required
            />
            {(errors.customer_code || validationErrors.customer_code) && (
              <div className="form-error" style={{ color: 'var(--danger)', fontSize: '0.8125rem', marginTop: '4px' }}>
                {errors.customer_code || validationErrors.customer_code}
              </div>
            )}
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Company / Client Name *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Nova Innovations Corp"
              maxLength={100}
              value={formData.customer_name}
              onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
              required
            />
            {(errors.customer_name || validationErrors.customer_name) && (
              <div className="form-error" style={{ color: 'var(--danger)', fontSize: '0.8125rem', marginTop: '4px' }}>
                {errors.customer_name || validationErrors.customer_name}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Primary Email *</label>
            <input
              type="email"
              className="form-control"
              placeholder="billing@company.com"
              maxLength={254}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            {(errors.email || validationErrors.email) && (
              <div className="form-error" style={{ color: 'var(--danger)', fontSize: '0.8125rem', marginTop: '4px' }}>
                {errors.email || validationErrors.email}
              </div>
            )}
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Phone Number (10 Digits)</label>
            <input
              type="tel"
              className="form-control"
              placeholder="9820111001"
              maxLength={10}
              value={formData.phone}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                setFormData({ ...formData, phone: digits });
              }}
            />
            {(errors.phone || validationErrors.phone) && (
              <div className="form-error" style={{ color: 'var(--danger)', fontSize: '0.8125rem', marginTop: '4px' }}>
                {errors.phone || validationErrors.phone}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">City *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Pune"
              maxLength={100}
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              required
            />
            {(errors.city || validationErrors.city) && (
              <div className="form-error" style={{ color: 'var(--danger)', fontSize: '0.8125rem', marginTop: '4px' }}>
                {errors.city || validationErrors.city}
              </div>
            )}
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

export default CustomerFormModal;
