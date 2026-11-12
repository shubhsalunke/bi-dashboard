import React, { useState } from 'react';
import { Eye, EyeOff, KeyRound, Copy, Check, AlertCircle } from 'lucide-react';
import Modal from '../common/Modal';
import {
  USER_ROLES,
  PHONE_REGEX,
  getRoleDescription,
  evaluatePasswordStrength,
  generateStrongPassword,
} from '../../utils/userOptions';

export const UserFormModal = ({
  isOpen,
  onClose,
  editingUser,
  currentUser,
  activeAdminCount = 1,
  onSubmit,
}) => {
  const isEditing = Boolean(editingUser);
  const isSelf = Boolean(editingUser && currentUser && Number(editingUser.id) === Number(currentUser.id));
  const isLastActiveAdmin = Boolean(
    editingUser &&
      editingUser.role === 'admin' &&
      Boolean(editingUser.is_active) &&
      activeAdminCount <= 1
  );
  const lockRoleAndStatus = isSelf || isLastActiveAdmin;

  const [formData, setFormData] = useState({
    name: editingUser?.name || '',
    email: editingUser?.email || '',
    role: editingUser?.role || 'analyst',
    phone: editingUser?.phone || '',
    department: editingUser?.department || '',
    password: '',
    confirmPassword: '',
    is_active: editingUser ? Boolean(editingUser.is_active) : true,
  });

  const [formErrors, setFormErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  const strength = evaluatePasswordStrength(formData.password);
  const passwordEntered = formData.password.length > 0;
  const confirmRequired = !isEditing || passwordEntered;

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
    if (submitError) setSubmitError('');
  };

  const handleGeneratePassword = () => {
    const generated = generateStrongPassword(14);
    setFormData((prev) => ({
      ...prev,
      password: generated,
      confirmPassword: generated,
    }));
    setFormErrors((prev) => {
      const next = { ...prev };
      delete next.password;
      delete next.confirmPassword;
      return next;
    });
    setShowPassword(true);
    setCopiedPassword(false);
  };

  const handleCopyPassword = async () => {
    if (!formData.password) return;
    try {
      await navigator.clipboard.writeText(formData.password);
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
    } catch {
      // Fallback ignored if clipboard blocked
    }
  };

  const validate = () => {
    const errors = {};
    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim();
    const trimmedPhone = formData.phone.trim();

    if (!trimmedName) {
      errors.name = 'Full name is required';
    } else if (trimmedName.length > 100) {
      errors.name = 'Name must not exceed 100 characters';
    }

    if (!trimmedEmail) {
      errors.email = 'Email address is required';
    } else if (trimmedEmail.length > 254) {
      errors.email = 'Email must not exceed 254 characters';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = 'Please provide a valid email address';
    }

    if (!['admin', 'manager', 'analyst'].includes(formData.role)) {
      errors.role = 'Please select a valid role';
    } else if (lockRoleAndStatus && formData.role !== 'admin') {
      errors.role = isSelf
        ? 'You cannot change your own role away from Administrator'
        : 'Cannot demote the last active Administrator';
    }

    if (trimmedPhone && !PHONE_REGEX.test(trimmedPhone)) {
      errors.phone = 'Enter a valid phone number (7-20 digits, +, -, spaces, parentheses)';
    }

    if (formData.department.trim().length > 100) {
      errors.department = 'Department must not exceed 100 characters';
    }

    if (!isEditing && !formData.password) {
      errors.password = 'Password is required for new accounts';
    } else if (formData.password && formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    } else if (formData.password && formData.password.length > 128) {
      errors.password = 'Password must not exceed 128 characters';
    }

    if (confirmRequired) {
      if (!formData.confirmPassword) {
        errors.confirmPassword = 'Please confirm the password';
      } else if (formData.confirmPassword !== formData.password) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }

    if (lockRoleAndStatus && !formData.is_active) {
      errors.is_active = isSelf
        ? 'You cannot deactivate your own account'
        : 'Cannot deactivate the last active Administrator';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      role: formData.role,
      phone: formData.phone.trim() || null,
      department: formData.department.trim() || null,
      is_active: formData.is_active,
    };

    // Never send empty password in edit mode so existing password remains untouched
    if (formData.password.length > 0) {
      payload.password = formData.password;
    }

    setSubmitting(true);
    setSubmitError('');
    try {
      await onSubmit(payload);
    } catch (err) {
      const apiErrors = {};
      if (Array.isArray(err?.details)) {
        err.details.forEach((d) => {
          if (d?.field && d?.message) {
            apiErrors[d.field] = d.message;
          }
        });
      }
      if (
        err?.status === 409 ||
        (err?.message && err.message.toLowerCase().includes('email'))
      ) {
        apiErrors.email = err.message;
      }

      if (Object.keys(apiErrors).length > 0) {
        setFormErrors((prev) => ({ ...prev, ...apiErrors }));
      } else {
        setSubmitError(err?.message || 'Unable to save user');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth={640}
      title={isEditing ? `Edit User: ${editingUser.name}` : 'Create New User Account'}
      footer={
        <>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="user-form"
            className="btn btn-primary"
            disabled={submitting}
          >
            {submitting ? 'Saving...' : isEditing ? 'Update User' : 'Create User'}
          </button>
        </>
      }
    >
      <form id="user-form" onSubmit={handleSubmit} className="stack-md" autoComplete="off" noValidate>
        {submitError && (
          <div className="alert alert-danger" role="alert">
            <AlertCircle size={16} aria-hidden="true" style={{ flexShrink: 0 }} />
            <span>{submitError}</span>
          </div>
        )}

        <div className="form-grid-2">
          <div className="form-group form-group-flush">
            <label className="form-label" htmlFor="user-name">
              Full Name *
            </label>
            <input
              id="user-name"
              name="user-full-name"
              type="text"
              className="form-control"
              maxLength={100}
              autoComplete="off"
              aria-invalid={Boolean(formErrors.name)}
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="e.g. Alex Johnson"
            />
            {formErrors.name && <div className="form-error">{formErrors.name}</div>}
          </div>

          <div className="form-group form-group-flush">
            <label className="form-label" htmlFor="user-email">
              Email Address *
            </label>
            <input
              id="user-email"
              name="user-email-address"
              type="email"
              className="form-control"
              maxLength={254}
              autoComplete="off"
              aria-invalid={Boolean(formErrors.email)}
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="e.g. alex@bi.corp"
            />
            {formErrors.email && <div className="form-error">{formErrors.email}</div>}
          </div>

          <div className="form-group form-group-flush">
            <label className="form-label" htmlFor="user-phone">
              Phone
            </label>
            <input
              id="user-phone"
              name="user-phone"
              type="tel"
              className="form-control"
              maxLength={30}
              autoComplete="off"
              aria-invalid={Boolean(formErrors.phone)}
              value={formData.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder="e.g. +91 98765 43210"
            />
            {formErrors.phone && <div className="form-error">{formErrors.phone}</div>}
          </div>

          <div className="form-group form-group-flush">
            <label className="form-label" htmlFor="user-department">
              Department
            </label>
            <input
              id="user-department"
              name="user-department"
              type="text"
              className="form-control"
              maxLength={100}
              autoComplete="off"
              aria-invalid={Boolean(formErrors.department)}
              value={formData.department}
              onChange={(e) => updateField('department', e.target.value)}
              placeholder="e.g. Finance, Operations"
            />
            {formErrors.department && <div className="form-error">{formErrors.department}</div>}
          </div>
        </div>

        <div className="form-group form-group-flush">
          <label className="form-label" htmlFor="user-role">
            Role *
          </label>
          <select
            id="user-role"
            className="form-control"
            value={formData.role}
            disabled={lockRoleAndStatus}
            aria-invalid={Boolean(formErrors.role)}
            onChange={(e) => updateField('role', e.target.value)}
          >
            {USER_ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <div className="form-helper-text">{getRoleDescription(formData.role)}</div>
          {lockRoleAndStatus && (
            <div className="form-helper-text" style={{ color: 'var(--warning)' }}>
              {isSelf
                ? 'Your own Administrator role cannot be changed.'
                : 'Last active Administrator role cannot be demoted.'}
            </div>
          )}
          {formErrors.role && <div className="form-error">{formErrors.role}</div>}
        </div>

        <div className="form-group form-group-flush">
          <div className="password-field-header">
            <label className="form-label" htmlFor="user-password">
              {isEditing ? 'Password (leave blank to keep unchanged)' : 'Password *'}
            </label>
            <div className="password-action-row">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleGeneratePassword}
              >
                <KeyRound size={13} aria-hidden="true" />
                <span>Generate strong password</span>
              </button>
              {passwordEntered && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleCopyPassword}
                  aria-label="Copy password"
                >
                  {copiedPassword ? (
                    <>
                      <Check size={13} aria-hidden="true" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} aria-hidden="true" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="password-input-wrap">
            <input
              id="user-password"
              name="user-new-password"
              type={showPassword ? 'text' : 'password'}
              className="form-control"
              maxLength={128}
              autoComplete="new-password"
              aria-invalid={Boolean(formErrors.password)}
              value={formData.password}
              onChange={(e) => updateField('password', e.target.value)}
              placeholder={
                isEditing
                  ? 'Leave empty to keep current password'
                  : 'Enter password (min 6 characters)'
              }
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
            </button>
          </div>

          {passwordEntered && (
            <div className="password-strength" aria-live="polite">
              <div className="password-strength-track">
                <div
                  className={`password-strength-fill ${strength.level}`}
                  style={{ width: `${strength.percent}%` }}
                />
              </div>
              <span className={`password-strength-label ${strength.level}`}>
                Password strength: {strength.label}
              </span>
            </div>
          )}

          {formErrors.password && <div className="form-error">{formErrors.password}</div>}
        </div>

        <div className="form-group form-group-flush">
          <label className="form-label" htmlFor="user-confirm-password">
            Confirm Password {confirmRequired ? '*' : '(optional)'}
          </label>
          <div className="password-input-wrap">
            <input
              id="user-confirm-password"
              name="user-confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              className="form-control"
              maxLength={128}
              autoComplete="new-password"
              aria-invalid={Boolean(formErrors.confirmPassword)}
              value={formData.confirmPassword}
              onChange={(e) => updateField('confirmPassword', e.target.value)}
              placeholder={
                confirmRequired
                  ? 'Re-enter password to confirm'
                  : 'Required only if setting a new password'
              }
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
            >
              {showConfirmPassword ? (
                <EyeOff size={16} aria-hidden="true" />
              ) : (
                <Eye size={16} aria-hidden="true" />
              )}
            </button>
          </div>
          {formErrors.confirmPassword && (
            <div className="form-error">{formErrors.confirmPassword}</div>
          )}
        </div>

        <div>
          <div className="checkbox-row">
            <input
              type="checkbox"
              id="user-is-active"
              className="checkbox-input"
              disabled={lockRoleAndStatus}
              checked={formData.is_active}
              onChange={(e) => updateField('is_active', e.target.checked)}
            />
            <label htmlFor="user-is-active" className="checkbox-label">
              Account is Active and authorized to log in
            </label>
          </div>
          {formErrors.is_active && <div className="form-error">{formErrors.is_active}</div>}
        </div>
      </form>
    </Modal>
  );
};

export default UserFormModal;

