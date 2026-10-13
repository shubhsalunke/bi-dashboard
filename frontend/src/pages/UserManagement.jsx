import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Shield,
  UserPlus,
  Edit2,
  Trash2,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Search,
  KeyRound,
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
    if (!formData.name.trim()) errors.name = 'Full name is required';
    if (!formData.email.trim()) errors.email = 'Email address is required';
    if (!editingUser && !formData.password) {
      errors.password = 'Password is required for new accounts';
    } else if (formData.password && formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }
    if (!['admin', 'manager', 'analyst'].includes(formData.role)) {
      errors.role = 'Invalid role specified';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

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
        return <Badge variant="danger">Admin</Badge>;
      case 'manager':
        return <Badge variant="primary">Manager</Badge>;
      case 'analyst':
        return <Badge variant="neutral">Analyst</Badge>;
      default:
        return <Badge variant="neutral">{role}</Badge>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 700, margin: 0 }}>
              User & Role Management
            </h1>
            <Badge variant="danger">
              <Shield size={12} style={{ display: 'inline', marginRight: 4 }} />
              Admin Only
            </Badge>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', margin: 'var(--space-1) 0 0 0', fontSize: 'var(--font-sm)' }}>
            Manage staff accounts, assign granular role permissions, and inspect system audit trail.
          </p>
        </div>

        {activeTab === 'users' && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleOpenCreate}
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
          >
            <UserPlus size={16} />
            <span>Add User</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', borderBottom: '1px solid var(--color-border)' }}>
        <button
          type="button"
          onClick={() => setActiveTab('users')}
          style={{
            padding: 'var(--space-2) var(--space-4)',
            fontSize: 'var(--font-sm)',
            fontWeight: 600,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            borderBottom: activeTab === 'users' ? '2px solid var(--color-primary)' : '2px solid transparent',
            color: activeTab === 'users' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
          }}
        >
          <Users size={16} />
          <span>Active Users ({users.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          style={{
            padding: 'var(--space-2) var(--space-4)',
            fontSize: 'var(--font-sm)',
            fontWeight: 600,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            borderBottom: activeTab === 'audit' ? '2px solid var(--color-primary)' : '2px solid transparent',
            color: activeTab === 'audit' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
          }}
        >
          <Activity size={16} />
          <span>Audit Logs</span>
        </button>
      </div>

      {/* TAB 1: USERS DIRECTORY */}
      {activeTab === 'users' && (
        <div className="card" style={{ padding: 0 }}>
          {/* Search bar */}
          <div
            style={{
              padding: 'var(--space-4)',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              gap: 'var(--space-3)',
              alignItems: 'center',
            }}
          >
            <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: 'var(--space-3)',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-text-muted)',
                }}
              />
              <input
                type="text"
                placeholder="Search users by name, email, or role..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="input"
                style={{ paddingLeft: 'var(--space-9)' }}
              />
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={loadUsers}
              title="Refresh list"
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}
            >
              <RefreshCw size={15} />
            </button>
          </div>

          {/* Table */}
          {loadingUsers ? (
            <div style={{ padding: 'var(--space-4)' }}>
              <LoadingSkeleton count={4} height={48} />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div style={{ padding: 'var(--space-6)' }}>
              <EmptyState
                icon={Users}
                title="No users found"
                description={userSearch ? 'No accounts matched your search.' : 'No system users found.'}
              />
            </div>
          ) : (
            <div className="table-container" style={{ margin: 0, border: 'none' }}>
              <table className="table">
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
                      <td style={{ fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 'var(--radius-full)',
                              background: 'var(--color-primary-light, #e0e7ff)',
                              color: 'var(--color-primary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: 'var(--font-xs)',
                            }}
                          >
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div>{u.name}</div>
                            {currentUser && currentUser.id === u.id && (
                              <span style={{ fontSize: '10px', color: 'var(--color-primary)', fontWeight: 600 }}>
                                (You)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>{u.email}</td>
                      <td>{getRoleBadge(u.role)}</td>
                      <td>
                        {u.is_active ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-success)', fontSize: 'var(--font-xs)', fontWeight: 600 }}>
                            <CheckCircle size={14} /> Active
                          </span>
                        ) : (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-danger)', fontSize: 'var(--font-xs)', fontWeight: 600 }}>
                            <XCircle size={14} /> Inactive
                          </span>
                        )}
                      </td>
                      <td style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-secondary)' }}>
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ padding: 'var(--space-1) var(--space-2)', fontSize: 'var(--font-xs)' }}
                            onClick={() => handleOpenEdit(u)}
                            title="Edit User"
                          >
                            <Edit2 size={13} /> Edit
                          </button>
                          {currentUser && currentUser.id !== u.id && u.is_active && (
                            <button
                              type="button"
                              className="btn btn-danger"
                              style={{ padding: 'var(--space-1) var(--space-2)', fontSize: 'var(--font-xs)' }}
                              onClick={() => setUserToDeactivate(u)}
                              title="Deactivate User"
                            >
                              <Trash2 size={13} /> Deactivate
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

      {/* TAB 2: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="card" style={{ padding: 0 }}>
          <div
            style={{
              padding: 'var(--space-4)',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 600, margin: 0 }}>System Security Audit Trail</h3>
              <p style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-secondary)', margin: '2px 0 0 0' }}>
                Immutable ledger of critical system changes, authentication events, and administrative actions.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => loadLogs(logPagination.page)}
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}
            >
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          {loadingLogs ? (
            <div style={{ padding: 'var(--space-4)' }}>
              <LoadingSkeleton count={6} height={44} />
            </div>
          ) : logs.length === 0 ? (
            <div style={{ padding: 'var(--space-6)' }}>
              <EmptyState
                icon={Activity}
                title="No audit entries"
                description="No system audit events recorded yet."
              />
            </div>
          ) : (
            <>
              <div className="table-container" style={{ margin: 0, border: 'none' }}>
                <table className="table">
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
                        <td style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td style={{ fontWeight: 600, fontSize: 'var(--font-xs)' }}>
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
                        <td style={{ fontSize: 'var(--font-xs)', fontWeight: 600 }}>
                          {log.entity} #{log.entity_id || '-'}
                        </td>
                        <td style={{ fontSize: 'var(--font-xs)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {log.details ? JSON.stringify(log.details) : '-'}
                        </td>
                        <td style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-muted)' }}>
                          {log.ip_address || '127.0.0.1'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {logPagination.totalPages > 1 && (
                <div style={{ padding: 'var(--space-4)', borderTop: '1px solid var(--color-border)' }}>
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

      {/* CREATE / EDIT USER MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? `Edit User: ${editingUser.name}` : 'Create New User'}
      >
        <form onSubmit={handleSubmitUser} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div>
            <label className="form-label" htmlFor="user-name">Full Name *</label>
            <input
              id="user-name"
              type="text"
              className="input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Alex Johnson"
            />
            {formErrors.name && <span className="form-error">{formErrors.name}</span>}
          </div>

          <div>
            <label className="form-label" htmlFor="user-email">Email Address *</label>
            <input
              id="user-email"
              type="email"
              className="input"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="e.g. alex@bi.corp"
            />
            {formErrors.email && <span className="form-error">{formErrors.email}</span>}
          </div>

          <div>
            <label className="form-label" htmlFor="user-role">Assigned Role *</label>
            <select
              id="user-role"
              className="select"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="analyst">Analyst (Read-only dashboard, queries, and reports)</option>
              <option value="manager">Manager (Manage customers, products, and record sales)</option>
              <option value="admin">Administrator (Full administrative access & user control)</option>
            </select>
            {formErrors.role && <span className="form-error">{formErrors.role}</span>}
          </div>

          <div>
            <label className="form-label" htmlFor="user-password">
              {editingUser ? 'Password (leave blank to keep unchanged)' : 'Password *'}
            </label>
            <input
              id="user-password"
              type="password"
              className="input"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder={editingUser ? '••••••••' : 'Enter strong password (min 6 chars)'}
            />
            {formErrors.password && <span className="form-error">{formErrors.password}</span>}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <input
              type="checkbox"
              id="user-is-active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              style={{ width: 16, height: 16, cursor: 'pointer' }}
            />
            <label htmlFor="user-is-active" style={{ fontSize: 'var(--font-sm)', fontWeight: 500, cursor: 'pointer' }}>
              Account is Active and authorized to log in
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>

      {/* CONFIRM DEACTIVATE MODAL */}
      <Modal
        isOpen={!!userToDeactivate}
        onClose={() => setUserToDeactivate(null)}
        title="Confirm Deactivation"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <p style={{ margin: 0, fontSize: 'var(--font-sm)', lineHeight: 1.5 }}>
            Are you sure you want to deactivate user <strong>{userToDeactivate?.name}</strong> (
            <code>{userToDeactivate?.email}</code>)?
          </p>
          <div
            style={{
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              fontSize: 'var(--font-xs)',
              color: 'var(--color-danger)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
            }}
          >
            <AlertCircle size={16} />
            <span>This user will immediately be barred from logging into the platform.</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
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
