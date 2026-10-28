import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users,
  Shield,
  UserPlus,
  Edit2,
  Trash2,
  Activity,
  AlertCircle,
  RefreshCw,
  Search,
} from 'lucide-react';
import { usersApi } from '../api/users.api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';
import Pagination from '../components/common/Pagination';

export const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const { showSuccess, showError } = useToast();

  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'audit'

  // Users state
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userSearch, setUserSearch] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'analyst',
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Deactivate state
  const [userToDeactivate, setUserToDeactivate] = useState(null);

  // Audit logs state
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logPagination, setLogPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });

  // Load users
  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const data = await usersApi.getUsers();
      setUsers(data || []);
    } catch (err) {
      showError(err.message || 'Failed to load system users');
    } finally {
      setLoadingUsers(false);
    }
  }, [showError]);

  // Load audit logs
  const loadLogs = useCallback(async (page = 1) => {
    setLoadingLogs(true);
    try {
      const res = await usersApi.getAuditLogs({ page, limit: 20 });
      setLogs(res.data || []);
      if (res.pagination) {
        setLogPagination(res.pagination);
      }
    } catch (err) {
      showError(err.message || 'Failed to load audit logs');
    } finally {
      setLoadingLogs(false);
    }
  }, [showError]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (activeTab === 'audit') {
      loadLogs(logPagination.page);
    }
  }, [activeTab, logPagination.page, loadLogs]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'analyst',
      is_active: true,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (targetUser) => {
    setEditingUser(targetUser);
    setFormData({
      name: targetUser.name,
      email: targetUser.email,
      password: '',
      role: targetUser.role,
      is_active: targetUser.is_active,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Form Validation
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Full name is required';
    } else if (formData.name.length > 100) {
      errors.name = 'Name must not exceed 100 characters';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (formData.email.length > 254) {
      errors.email = 'Email must not exceed 254 characters';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please provide a valid email address';
    }

    if (!editingUser && !formData.password) {
      errors.password = 'Password is required for new accounts';
    } else if (formData.password && formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    } else if (formData.password && formData.password.length > 128) {
      errors.password = 'Password must not exceed 128 characters';
    }

    if (!['admin', 'manager', 'analyst'].includes(formData.role)) {
      errors.role = 'Invalid role specified';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isUserFormValid = useMemo(() => {
    if (!formData.name.trim() || formData.name.length > 100) return false;
    if (!formData.email.trim() || formData.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) return false;
    if (!['admin', 'manager', 'analyst'].includes(formData.role)) return false;
    if (!editingUser) {
      if (!formData.password || formData.password.length < 6 || formData.password.length > 128) return false;
    } else {
      if (formData.password && (formData.password.length < 6 || formData.password.length > 128)) return false;
    }
    return true;
  }, [formData, editingUser]);

  // Submit User Form
  const handleSubmitUser = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      if (editingUser) {
        const payload = {
          name: formData.name.trim(),
          email: formData.email.trim(),
          role: formData.role,
          is_active: formData.is_active,
        };
        if (formData.password) {
          payload.password = formData.password;
        }
        await usersApi.updateUser(editingUser.id, payload);
        showSuccess(`User '${payload.name}' updated successfully.`);
      } else {
        await usersApi.createUser({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          role: formData.role,
          is_active: formData.is_active,
        });
        showSuccess(`User '${formData.name}' created successfully.`);
      }
      setIsModalOpen(false);
      loadUsers();
    } catch (err) {
      showError(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Deactivate User
  const handleConfirmDeactivate = async () => {
    if (!userToDeactivate) return;
    try {
      await usersApi.deleteUser(userToDeactivate.id);
      showSuccess(`User '${userToDeactivate.name}' deactivated successfully.`);
      setUserToDeactivate(null);
      loadUsers();
    } catch (err) {
      showError(err.message || 'Deactivation failed');
    }
  };

  // Filtered users
  const filteredUsers = users.filter((u) => {
    if (!userSearch) return true;
    const term = userSearch.toLowerCase();
    return (
      u.name.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.role.toLowerCase().includes(term)
    );
  });

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <Badge variant="admin">Admin</Badge>;
      case 'manager':
        return <Badge variant="manager">Manager</Badge>;
      case 'analyst':
        return <Badge variant="analyst">Analyst</Badge>;
      default:
        return <Badge status="default">{role}</Badge>;
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ margin: 0 }}>User & Role Management</h2>
            <Badge variant="admin">
              <Shield size={12} style={{ display: 'inline', marginRight: 4 }} />
              Admin Only
            </Badge>
          </div>
          <p className="page-subtitle">
            Manage staff accounts, assign granular role permissions, and inspect system audit trail.
          </p>
        </div>

        {activeTab === 'users' && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleOpenCreate}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <UserPlus size={16} />
            <span>Add User</span>
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          type="button"
          className={`btn btn-sm ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('users')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <Users size={15} />
          <span>Active Users ({users.length})</span>
        </button>

        <button
          type="button"
          className={`btn btn-sm ${activeTab === 'audit' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('audit')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <Activity size={15} />
          <span>Audit Logs</span>
        </button>
      </div>

      {activeTab === 'users' && (
        <div>
          <div className="filter-bar">
            <div className="search-input-wrapper">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search users by name, email, or role..."
                maxLength={100}
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="form-control search-input"
              />
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={loadUsers}
              title="Refresh list"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={15} />
              <span>Refresh</span>
            </button>
          </div>

          {loadingUsers ? (
            <div style={{ padding: '24px 0' }}>
              <LoadingSkeleton count={5} height={52} />
            </div>
          ) : filteredUsers.length === 0 ? (
            <EmptyState
              title="No users found"
              message={userSearch ? 'No accounts matched your search criteria.' : 'No system users found.'}
              action={
                userSearch && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setUserSearch('')}
                  >
                    Clear Search
                  </button>
                )
              }
            />
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: '50%',
                              background: 'var(--primary-glow)',
                              color: 'var(--primary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.8125rem',
                              border: '1px solid rgba(37, 99, 235, 0.2)',
                              flexShrink: 0,
                            }}
                          >
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{u.name}</div>
                            {currentUser && currentUser.id === u.id && (
                              <span style={{ fontSize: '0.6875rem', color: 'var(--primary)', fontWeight: 600 }}>
                                (You)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                      <td>{getRoleBadge(u.role)}</td>
                      <td>
                        <Badge status={u.is_active ? 'active' : 'inactive'} />
                      </td>
                      <td style={{ fontSize: '0.8125rem', color: 'var(--text-dim)' }}>
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                            onClick={() => handleOpenEdit(u)}
                            title="Edit User"
                          >
                            <Edit2 size={13} />
                            <span>Edit</span>
                          </button>
                          {currentUser && currentUser.id !== u.id && u.is_active && (
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                              onClick={() => setUserToDeactivate(u)}
                              title="Deactivate User"
                            >
                              <Trash2 size={13} />
                              <span>Deactivate</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'audit' && (
        <div>
          <div className="filter-bar" style={{ justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                System Security Audit Trail
              </h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Immutable ledger of critical system changes, authentication events, and administrative actions.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => loadLogs(logPagination.page)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={14} />
              <span>Refresh</span>
            </button>
          </div>

          {loadingLogs ? (
            <div style={{ padding: '24px 0' }}>
              <LoadingSkeleton count={6} height={44} />
            </div>
          ) : logs.length === 0 ? (
            <EmptyState
              title="No audit entries"
              message="No system audit events recorded in database yet."
            />
          ) : (
            <>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Actor</th>
                      <th>Action</th>
                      <th>Entity</th>
                      <th>Details</th>
                      <th>IP Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id}>
                        <td style={{ fontSize: '0.8125rem', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-main)' }}>
                          {log.user_email || `User #${log.user_id}` || 'System'}
                        </td>
                        <td>
                          <Badge
                            variant={
                              log.action.includes('FAIL') || log.action.includes('DEACT')
                                ? 'danger'
                                : log.action.includes('LOGIN')
                                ? 'primary'
                                : 'neutral'
                            }
                          >
                            {log.action}
                          </Badge>
                        </td>
                        <td style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                          {log.entity} #{log.entity_id || '-'}
                        </td>
                        <td style={{ fontSize: '0.8125rem', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                          {log.details ? JSON.stringify(log.details) : '-'}
                        </td>
                        <td style={{ fontSize: '0.8125rem', color: 'var(--text-dim)' }}>
                          {log.ip_address || '127.0.0.1'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {logPagination.totalPages > 1 && (
                <div style={{ marginTop: '16px' }}>
                  <Pagination
                    currentPage={logPagination.page}
                    totalPages={logPagination.totalPages}
                    totalItems={logPagination.total}
                    pageSize={logPagination.limit}
                    onPageChange={(p) => loadLogs(p)}
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? `Edit User: ${editingUser.name}` : 'Create New User Account'}
      >
        <form onSubmit={handleSubmitUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="user-name">Full Name *</label>
            <input
              id="user-name"
              type="text"
              className="form-control"
              maxLength={100}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Alex Johnson"
            />
            {formErrors.name && <div className="form-error" style={{ color: 'var(--danger)', fontSize: '0.8125rem', marginTop: '4px' }}>{formErrors.name}</div>}
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="user-email">Email Address *</label>
            <input
              id="user-email"
              type="email"
              className="form-control"
              maxLength={254}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="e.g. alex@bi.corp"
            />
            {formErrors.email && <div className="form-error" style={{ color: 'var(--danger)', fontSize: '0.8125rem', marginTop: '4px' }}>{formErrors.email}</div>}
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="user-role">Assigned Role *</label>
            <select
              id="user-role"
              className="form-control"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="analyst">Analyst (Read-only dashboard, queries, and reports)</option>
              <option value="manager">Manager (Manage customers, products, and record sales)</option>
              <option value="admin">Administrator (Full administrative access & user control)</option>
            </select>
            {formErrors.role && <div className="form-error" style={{ color: 'var(--danger)', fontSize: '0.8125rem', marginTop: '4px' }}>{formErrors.role}</div>}
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="user-password">
              {editingUser ? 'Password (leave blank to keep unchanged)' : 'Password *'}
            </label>
            <input
              id="user-password"
              type="password"
              className="form-control"
              maxLength={128}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder={editingUser ? '••••••••' : 'Enter strong password (min 6 chars)'}
            />
            {formErrors.password && <div className="form-error" style={{ color: 'var(--danger)', fontSize: '0.8125rem', marginTop: '4px' }}>{formErrors.password}</div>}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
            <input
              type="checkbox"
              id="user-is-active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              style={{ width: 16, height: 16, cursor: 'pointer' }}
            />
            <label htmlFor="user-is-active" style={{ fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', color: 'var(--text-main)' }}>
              Account is Active and authorized to log in
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting || !isUserFormValid}>
              {submitting ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!userToDeactivate}
        onClose={() => setUserToDeactivate(null)}
        title="Confirm Deactivation"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.5, color: 'var(--text-main)' }}>
            Are you sure you want to deactivate user <strong>{userToDeactivate?.name}</strong> (
            <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--bg-dark)', padding: '2px 6px', borderRadius: '4px' }}>
              {userToDeactivate?.email}
            </code>)?
          </p>
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--danger-bg)',
              border: '1px solid var(--danger-border)',
              fontSize: '0.8125rem',
              color: 'var(--danger)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <AlertCircle size={18} flexShrink={0} />
            <span>This user will immediately be barred from logging into the platform.</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setUserToDeactivate(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleConfirmDeactivate}
            >
              Confirm Deactivation
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserManagement;
