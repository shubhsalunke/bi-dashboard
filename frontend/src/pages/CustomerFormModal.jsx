import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../components/common/Modal';
import { customersApi } from '../api/customers.api';
import { useToast } from '../context/ToastContext';
import {
  CUSTOMER_INDUSTRIES,
  CUSTOMER_TYPES,
  CUSTOMER_STATUSES,
  INDIAN_STATES,
  GSTIN_REGEX,
} from '../utils/customerOptions';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const INITIAL_FORM_DATA = {
  customer_code: '',
  customer_name: '',
  email: '',
  phone: '',
  city: '',
  status: 'active',
  industry: '',
  customer_type: '',
  contact_person: '',
  state: '',
  gst_number: '',
  address: '',
  notes: '',
};

export const CustomerFormModal = ({ isOpen, onClose, customer = null, onSaved }) => {
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
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
        industry: customer.industry || '',
        customer_type: customer.customer_type || '',
        contact_person: customer.contact_person || '',
        state: customer.state || '',
        gst_number: (customer.gst_number || '').toUpperCase(),
        address: customer.address || '',
        notes: customer.notes || '',
      });
    } else {
      setFormData(INITIAL_FORM_DATA);
    }
    setErrors({});
    setTouched({});
    setSubmitted(false);
  }, [customer, isOpen]);

  const markTouched = (field) => {
    setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

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

    if (formData.contact_person && formData.contact_person.trim().length > 100) {
      errs.contact_person = 'Contact person name must not exceed 100 characters';
    }

    const trimmedGst = formData.gst_number.trim().toUpperCase();
    if (trimmedGst && !GSTIN_REGEX.test(trimmedGst)) {
      errs.gst_number = 'GST number must be a valid 15-character GSTIN (e.g. 27AAACA1234A1Z5)';
    }

    if (formData.address && formData.address.trim().length > 500) {
      errs.address = 'Address must not exceed 500 characters';
    }

    if (formData.notes && formData.notes.trim().length > 1000) {
      errs.notes = 'Notes must not exceed 1000 characters';
    }

    return errs;
  }, [formData]);

  const getFieldError = (field) => {
    if (errors[field]) return errors[field];
    if (touched[field] || submitted) return validationErrors[field] || '';
    return '';
  };

  const isValid = Object.keys(validationErrors).length === 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
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
        industry: formData.industry || null,
        customer_type: formData.customer_type || null,
        contact_person: formData.contact_person.trim() || null,
        state: formData.state || null,
        gst_number: formData.gst_number.trim().toUpperCase() || null,
        address: formData.address.trim() || null,
        notes: formData.notes.trim() || null,
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

  const codeError = getFieldError('customer_code');
  const nameError = getFieldError('customer_name');
  const emailError = getFieldError('email');
  const phoneError = getFieldError('phone');
  const cityError = getFieldError('city');
  const contactPersonError = getFieldError('contact_person');
  const gstError = getFieldError('gst_number');
  const addressError = getFieldError('address');
  const notesError = getFieldError('notes');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="660px"
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
      <form id="customer-form" onSubmit={handleSubmit} noValidate className="stack-md">
        <div className="form-grid-2">
          <div className="form-group form-group-flush">
            <label htmlFor="customer-code" className="form-label">Customer Code *</label>
            <input
              id="customer-code"
              type="text"
              className="form-control"
              placeholder="e.g. CUST-045"
              maxLength={50}
              value={formData.customer_code}
              onChange={(e) => updateField('customer_code', e.target.value)}
              onBlur={() => markTouched('customer_code')}
              aria-invalid={Boolean(codeError)}
              required
            />
            {codeError && (
              <div className="form-error">{codeError}</div>
            )}
          </div>

          <div className="form-group form-group-flush">
            <label htmlFor="customer-name" className="form-label">Company / Client Name *</label>
            <input
              id="customer-name"
              type="text"
              className="form-control"
              placeholder="e.g. Nova Innovations Corp"
              maxLength={100}
              value={formData.customer_name}
              onChange={(e) => updateField('customer_name', e.target.value)}
              onBlur={() => markTouched('customer_name')}
              aria-invalid={Boolean(nameError)}
              required
            />
            {nameError && (
              <div className="form-error">{nameError}</div>
            )}
          </div>
        </div>

        <div className="form-grid-2">
          <div className="form-group form-group-flush">
            <label htmlFor="customer-email" className="form-label">Primary Email *</label>
            <input
              id="customer-email"
              type="email"
              className="form-control"
              placeholder="billing@company.com"
              maxLength={254}
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              onBlur={() => markTouched('email')}
              aria-invalid={Boolean(emailError)}
              required
            />
            {emailError && (
              <div className="form-error">{emailError}</div>
            )}
          </div>

          <div className="form-group form-group-flush">
            <label htmlFor="customer-phone" className="form-label">Phone Number (10 Digits)</label>
            <input
              id="customer-phone"
              type="tel"
              className="form-control tabular-nums"
              placeholder="9820111001"
              maxLength={10}
              value={formData.phone}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                updateField('phone', digits);
                markTouched('phone');
              }}
              onBlur={() => markTouched('phone')}
              aria-invalid={Boolean(phoneError)}
            />
            {phoneError && (
              <div className="form-error">{phoneError}</div>
            )}
          </div>
        </div>

        <div className="form-grid-2">
          <div className="form-group form-group-flush">
            <label htmlFor="customer-city" className="form-label">City *</label>
            <input
              id="customer-city"
              type="text"
              className="form-control"
              placeholder="e.g. Pune"
              maxLength={100}
              value={formData.city}
              onChange={(e) => updateField('city', e.target.value)}
              onBlur={() => markTouched('city')}
              aria-invalid={Boolean(cityError)}
              required
            />
            {cityError && (
              <div className="form-error">{cityError}</div>
            )}
          </div>

          <div className="form-group form-group-flush">
            <label htmlFor="customer-status" className="form-label">Status</label>
            <select
              id="customer-status"
              className="form-control"
              value={formData.status}
              onChange={(e) => updateField('status', e.target.value)}
            >
              {CUSTOMER_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-grid-2">
          <div className="form-group form-group-flush">
            <label htmlFor="customer-industry" className="form-label">Industry</label>
            <select
              id="customer-industry"
              className="form-control"
              value={formData.industry}
              onChange={(e) => updateField('industry', e.target.value)}
            >
              <option value="">Select industry</option>
              {CUSTOMER_INDUSTRIES.map((ind) => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
          </div>

          <div className="form-group form-group-flush">
            <label htmlFor="customer-type" className="form-label">Customer Type</label>
            <select
              id="customer-type"
              className="form-control"
              value={formData.customer_type}
              onChange={(e) => updateField('customer_type', e.target.value)}
            >
              <option value="">Select customer type</option>
              {CUSTOMER_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-grid-2">
          <div className="form-group form-group-flush">
            <label htmlFor="customer-contact-person" className="form-label">Contact Person Name</label>
            <input
              id="customer-contact-person"
              type="text"
              className="form-control"
              placeholder="e.g. Rajesh Kulkarni"
              maxLength={100}
              value={formData.contact_person}
              onChange={(e) => updateField('contact_person', e.target.value)}
              onBlur={() => markTouched('contact_person')}
              aria-invalid={Boolean(contactPersonError)}
            />
            {contactPersonError && (
              <div className="form-error">{contactPersonError}</div>
            )}
          </div>

          <div className="form-group form-group-flush">
            <label htmlFor="customer-state" className="form-label">State</label>
            <select
              id="customer-state"
              className="form-control"
              value={formData.state}
              onChange={(e) => updateField('state', e.target.value)}
            >
              <option value="">Select state</option>
              {INDIAN_STATES.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-grid-2">
          <div className="form-group form-group-flush">
            <label htmlFor="customer-gst-number" className="form-label">GST Number</label>
            <input
              id="customer-gst-number"
              type="text"
              className="form-control tabular-nums"
              placeholder="e.g. 27AAACA1234A1Z5"
              maxLength={15}
              value={formData.gst_number}
              onChange={(e) => {
                const upper = e.target.value.toUpperCase().slice(0, 15);
                updateField('gst_number', upper);
              }}
              onBlur={() => markTouched('gst_number')}
              aria-invalid={Boolean(gstError)}
            />
            {gstError && (
              <div className="form-error">{gstError}</div>
            )}
          </div>
        </div>

        <div className="form-group form-group-flush">
          <label htmlFor="customer-address" className="form-label">Address</label>
          <textarea
            id="customer-address"
            className="form-control"
            rows={2}
            placeholder="Street address, area, and PIN code..."
            maxLength={500}
            value={formData.address}
            onChange={(e) => updateField('address', e.target.value)}
            onBlur={() => markTouched('address')}
            aria-invalid={Boolean(addressError)}
          />
          {addressError && (
            <div className="form-error">{addressError}</div>
          )}
        </div>

        <div className="form-group form-group-flush">
          <label htmlFor="customer-notes" className="form-label">Notes</label>
          <textarea
            id="customer-notes"
            className="form-control"
            rows={3}
            placeholder="Account notes, preferences, or billing remarks..."
            maxLength={1000}
            value={formData.notes}
            onChange={(e) => updateField('notes', e.target.value)}
            onBlur={() => markTouched('notes')}
            aria-invalid={Boolean(notesError)}
          />
          {notesError && (
            <div className="form-error">{notesError}</div>
          )}
        </div>
      </form>
    </Modal>
  );
};

export default CustomerFormModal;
