import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  UserPlus,
  AlertCircle,
  RefreshCw,
  Search,
  Download,
  X,
  KeyRound,
} from 'lucide-react';
import { usersApi } from '../api/users.api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Badge from '../components/common/Badge';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';
import Pagination from '../components/common/Pagination';
import UsersTable from '../components/users/UsersTable';
import UserFormModal from '../components/users/UserFormModal';
import ResetPasswordModal from '../components/users/ResetPasswordModal';
import UserConfirmModal from '../components/users/UserConfirmModal';
import UserActivityDrawer from '../components/users/UserActivityDrawer';
import { USER_ROLES, USER_STATUS_OPTIONS, getRoleLabel } from '../utils/userOptions';

const PAGE_SIZE = 10;

const escapeCsvCell = (value) => {
  if (value === null || value === undefined) return '';
  let str = String(value);
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const normalizeUsersResponse = (res) => {
  if (Array.isArray(res)) {
    return {
      list: res,
      pagination: {
        page: 1,
        limit: Math.max(PAGE_SIZE, res.length),
        total: res.length,
        totalPages: 1,
      },
      activeAdminCount: res.filter((u) => u.role === 'admin' && Boolean(u.is_active)).length,
    };
  }
  const list = Array.isArray(res?.data) ? res.data : [];
  const pag = res?.pagination || {
    page: 1,
    limit: PAGE_SIZE,
    total: list.length,
    totalPages: 1,
  };
  const adminCount =
    typeof res?.activeAdminCount === 'number'
      ? res.activeAdminCount
      : list.filter((u) => u.role === 'admin' && Boolean(u.is_active)).length;
  return {
    list,
    pagination: pag,
    activeAdminCount: adminCount,
  };
};

export const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const { showSuccess, showError } = useToast();

  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'audit'

  // Users query state
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState(null);
  const [activeAdminCount, setActiveAdminCount] = useState(1);

  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });
  const [exportingCsv, setExportingCsv] = useState(false);

  // Form Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Confirm Modal state (deactivate / delete)
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    mode: 'deactivate', // 'deactivate' | 'delete'
    user: null,
  });
  const [confirmProcessing, setConfirmProcessing] = useState(false);

  // Reset Password Modal state
  const [resetTargetUser, setResetTargetUser] = useState(null);
  const [resetTempPassword, setResetTempPassword] = useState('');

  // Pending Password Reset Requests state
  const [resetRequests, setResetRequests] = useState([]);
  const [processingRequestId, setProcessingRequestId] = useState(null);

  // Per-user Activity Drawer state
  const [activityTargetUser, setActivityTargetUser] = useState(null);

  // Audit logs state
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logsError, setLogsError] = useState(null);
  const [logPagination, setLogPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (userSearch.trim()) count += 1;
    if (roleFilter) count += 1;
    if (statusFilter) count += 1;
    return count;
  }, [userSearch, roleFilter, statusFilter]);

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    setUsersError(null);
    try {
      const res = await usersApi.getUsers({
        page,
        limit: PAGE_SIZE,
        search: userSearch.trim() || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        sortBy,
        sortOrder,
      });
      const normalized = normalizeUsersResponse(res);
      setUsers(normalized.list);
      setPagination(normalized.pagination);
      setActiveAdminCount(normalized.activeAdminCount);

      if (typeof usersApi.getResetRequests === 'function') {
        try {
          const pending = await usersApi.getResetRequests();
          setResetRequests(Array.isArray(pending) ? pending : []);
        } catch {
          // Non-fatal if reset requests endpoint unavailable
        }
      }
    } catch (err) {
      const msg = err.message || 'Failed to load system users';
      setUsersError(msg);
      showError(msg);
    } finally {
      setLoadingUsers(false);
    }
  }, [page, userSearch, roleFilter, statusFilter, sortBy, sortOrder, showError]);

  const loadLogs = useCallback(
    async (targetPage = 1) => {
      setLoadingLogs(true);
      setLogsError(null);
      try {
        const res = await usersApi.getAuditLogs({ page: targetPage, limit: 20 });
        setLogs(res.data || []);
        if (res.pagination) {
          setLogPagination(res.pagination);
        }
      } catch (err) {
        const msg = err.message || 'Failed to load audit logs';
        setLogsError(msg);
        showError(msg);
      } finally {
        setLoadingLogs(false);
      }
    },
    [showError]
  );

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (activeTab === 'audit') {
      loadLogs(logPagination.page);
    }
  }, [activeTab, logPagination.page, loadLogs]);

  const handleSearchChange = (e) => {
    setUserSearch(e.target.value);
    setPage(1);
  };

  const handleRoleFilterChange = (e) => {
    setRoleFilter(e.target.value);
    setPage(1);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  const handleClearFilters = () => {
    setUserSearch('');
    setRoleFilter('');
    setStatusFilter('');
    setPage(1);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder(field === 'created_at' || field === 'last_login_at' ? 'desc' : 'asc');
    }
    setPage(1);
  };

  const handleOpenCreate = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (targetUser) => {
    setEditingUser(targetUser);
    setIsModalOpen(true);
  };

  const handleSubmitUser = async (payload) => {
    if (editingUser) {
      await usersApi.updateUser(editingUser.id, payload);
      showSuccess(`User '${payload.name}' updated successfully.`);
    } else {
      await usersApi.createUser(payload);
      showSuccess(`User '${payload.name}' created successfully.`);
    }
    setIsModalOpen(false);
    setEditingUser(null);
    await loadUsers();
  };

  const handleToggleStatus = async (targetUser) => {
    if (targetUser.is_active) {
      setConfirmState({
        isOpen: true,
        mode: 'deactivate',
        user: targetUser,
      });
      return;
    }

    try {
      await usersApi.updateUserStatus(targetUser.id, true);
      showSuccess(`User '${targetUser.name}' activated successfully.`);
      await loadUsers();
    } catch (err) {
      showError(err?.message || 'Failed to activate user');
    }
  };

  const handleRequestDelete = (targetUser) => {
    setConfirmState({
      isOpen: true,
      mode: 'delete',
      user: targetUser,
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmState.user) return;
    setConfirmProcessing(true);
    try {
      if (confirmState.mode === 'delete') {
        await usersApi.deleteUser(confirmState.user.id);
        showSuccess(`User '${confirmState.user.name}' deleted successfully.`);
      } else {
        await usersApi.updateUserStatus(confirmState.user.id, false);
        showSuccess(`User '${confirmState.user.name}' deactivated successfully.`);
      }
      setConfirmState({ isOpen: false, mode: 'deactivate', user: null });
      await loadUsers();
    } catch (err) {
      showError(err?.message || 'Action failed');
    } finally {
      setConfirmProcessing(false);
    }
  };

  const handleResetPassword = async (userId) => {
    const res = await usersApi.resetPassword(userId);
    showSuccess('Temporary password generated successfully.');
    loadUsers();
    return res;
  };

  const handleCompleteResetRequest = async (reqItem) => {
    setProcessingRequestId(reqItem.id);
    try {
      const res = await usersApi.completeResetRequest(reqItem.id);
      setResetTempPassword(res.temporaryPassword || '');
      setResetTargetUser(
        res.user || {
          id: reqItem.user_id,
          name: reqItem.user_name,
          email: reqItem.email,
        }
      );
      showSuccess(`Temporary password generated for '${reqItem.user_name}'.`);
      await loadUsers();
    } catch (err) {
      showError(err?.message || 'Failed to generate temporary password');
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleDismissResetRequest = async (reqItem) => {
    setProcessingRequestId(reqItem.id);
    try {
      await usersApi.dismissResetRequest(reqItem.id);
      showSuccess(`Dismissed reset request for '${reqItem.email}'.`);
      await loadUsers();
    } catch (err) {
      showError(err?.message || 'Failed to dismiss reset request');
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleExportCsv = async () => {
    setExportingCsv(true);
    try {
      const res = await usersApi.getUsers({
        page: 1,
        limit: 500,
        search: userSearch.trim() || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        sortBy,
        sortOrder,
      });
      const { list } = normalizeUsersResponse(res);
      if (list.length === 0) {
        showError('No matching users to export.');
        return;
      }

      const headers = [
        'ID',
        'Name',
        'Email',
        'Role',
        'Department',
        'Phone',
        'Status',
        'Last Login',
        'Created Date',
      ];
      const rows = list.map((u) => [
        u.id,
        u.name,
        u.email,
        getRoleLabel(u.role),
        u.department || '',
        u.phone || '',
        u.is_active ? 'Active' : 'Inactive',
        u.last_login_at ? new Date(u.last_login_at).toISOString() : '',
        u.created_at ? new Date(u.created_at).toISOString() : '',
      ]);

      const csvContent = [headers, ...rows]
        .map((row) => row.map(escapeCsvCell).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `users-export-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showSuccess(`Exported ${list.length} user(s) to CSV.`);
    } catch (err) {
      showError(err?.message || 'Failed to export users CSV');
    } finally {
      setExportingCsv(false);
    }
  };

  return (
    <div className="stack-lg">
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h2>Users</h2>
        </div>

        <div className="header-actions">
          <div className="segmented-group" role="tablist" aria-label="User management views">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'users'}
              className={`segmented-btn ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              Users ({pagination.total})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'audit'}
              className={`segmented-btn ${activeTab === 'audit' ? 'active' : ''}`}
              onClick={() => setActiveTab('audit')}
            >
              Audit Logs
            </button>
          </div>

          {activeTab === 'users' && (
            <>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleExportCsv}
                disabled={exportingCsv}
              >
                <Download size={14} aria-hidden="true" />
                <span>{exportingCsv ? 'Exporting...' : 'Export CSV'}</span>
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleOpenCreate}
              >
                <UserPlus size={14} aria-hidden="true" />
                <span>Add User</span>
              </button>
            </>
          )}
        </div>
      </div>

      {activeTab === 'users' && (
        <div className="stack-md">
          {resetRequests.length > 0 && (
            <div className="card" role="region" aria-label="Pending Password Reset Requests">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 'var(--space-3)',
                  gap: 'var(--space-2)',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <KeyRound size={16} style={{ color: 'var(--warning)' }} aria-hidden="true" />
                  <h3 className="section-heading" style={{ marginBottom: 0 }}>
                    Pending Password Reset Requests ({resetRequests.length})
                  </h3>
                </div>
              </div>

              <div className="stack-sm">
                {resetRequests.map((reqItem) => (
                  <div
                    key={reqItem.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 'var(--space-3)',
                      padding: 'var(--space-2) var(--space-3)',
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ fontSize: '0.875rem' }}>
                      <strong>{reqItem.user_name}</strong>{' '}
                      <span style={{ color: 'var(--text-secondary)' }}>({reqItem.email})</span>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Requested {new Date(reqItem.created_at).toLocaleString()} • Expires{' '}
                        {new Date(reqItem.expires_at).toLocaleTimeString()}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={processingRequestId === reqItem.id}
                        onClick={() => handleCompleteResetRequest(reqItem)}
                      >
                        <KeyRound size={13} aria-hidden="true" />
                        <span>Generate Temp Password</span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        disabled={processingRequestId === reqItem.id}
                        onClick={() => handleDismissResetRequest(reqItem)}
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="filter-bar">
            <div className="search-input-wrapper">
              <Search size={15} className="search-icon" aria-hidden="true" />
              <input
                type="text"
                aria-label="Search users"
                placeholder="Search users by name, email, department, or phone..."
                maxLength={100}
                value={userSearch}
                onChange={handleSearchChange}
                className="form-control search-input"
              />
            </div>

            <select
              aria-label="Filter by role"
              className="form-control filter-select"
              value={roleFilter}
              onChange={handleRoleFilterChange}
            >
              <option value="">All Roles</option>
              {USER_ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by status"
              className="form-control filter-select"
              value={statusFilter}
              onChange={handleStatusFilterChange}
            >
              <option value="">All Statuses</option>
              {USER_STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>

            {activeFilterCount > 0 && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleClearFilters}
              >
                <X size={13} aria-hidden="true" />
                <span>Clear Filters ({activeFilterCount})</span>
              </button>
            )}

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={loadUsers}
              title="Refresh list"
            >
              <RefreshCw size={14} aria-hidden="true" />
              <span>Refresh</span>
            </button>
          </div>

          <div className="card card-flush">
            {loadingUsers ? (
              <LoadingSkeleton rows={5} columns={8} />
            ) : usersError && users.length === 0 ? (
              <EmptyState
                icon={AlertCircle}
                title="Unable to load users"
                description={usersError}
                action={
                  <button type="button" className="btn btn-secondary btn-sm" onClick={loadUsers}>
                    Retry
                  </button>
                }
              />
            ) : users.length === 0 ? (
              <EmptyState
                title="No users found"
                message={
                  activeFilterCount > 0
                    ? 'No accounts matched your active search or filter criteria.'
                    : 'No system users found.'
                }
                action={
                  activeFilterCount > 0 && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={handleClearFilters}
                    >
                      Clear Filters
                    </button>
                  )
                }
              />
            ) : (
              <UsersTable
                users={users}
                currentUser={currentUser}
                activeAdminCount={activeAdminCount}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
                pagination={pagination}
                onPageChange={(nextPage) => setPage(nextPage)}
                onEdit={handleOpenEdit}
                onResetPassword={(u) => {
                  setResetTempPassword('');
                  setResetTargetUser(u);
                }}
                onToggleStatus={handleToggleStatus}
                onDelete={handleRequestDelete}
                onViewActivity={(u) => setActivityTargetUser(u)}
              />
            )}
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="card card-flush">
          <div className="card-header">
            <h3 className="section-heading" style={{ marginBottom: 0 }}>
              Audit Log
            </h3>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => loadLogs(logPagination.page)}
            >
              <RefreshCw size={14} aria-hidden="true" />
              <span>Refresh</span>
            </button>
          </div>

          {loadingLogs ? (
            <LoadingSkeleton rows={6} columns={6} />
          ) : logsError && logs.length === 0 ? (
            <EmptyState
              icon={AlertCircle}
              title="Unable to load audit logs"
              description={logsError}
              action={
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => loadLogs(logPagination.page)}
                >
                  Retry
                </button>
              }
            />
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
                        <td
                          className="tabular-nums cell-secondary"
                          style={{ whiteSpace: 'nowrap', fontSize: '0.8125rem' }}
                        >
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="cell-primary" style={{ fontSize: '0.8125rem' }}>
                          {log.user_email || `User #${log.user_id}` || 'System'}
                        </td>
                        <td>
                          <Badge
                            variant={
                              log.action.includes('FAIL') ||
                              log.action.includes('DEACT') ||
                              log.action.includes('DELETE')
                                ? 'danger'
                                : log.action.includes('LOGIN')
                                ? 'primary'
                                : 'neutral'
                            }
                          >
                            {log.action}
                          </Badge>
                        </td>
                        <td
                          className="tabular-nums"
                          style={{
                            fontSize: '0.8125rem',
                            fontWeight: 500,
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {log.entity} #{log.entity_id || '-'}
                        </td>
                        <td
                          style={{
                            fontSize: '0.8125rem',
                            maxWidth: 280,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {log.details ? JSON.stringify(log.details) : '-'}
                        </td>
                        <td
                          className="tabular-nums"
                          style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}
                        >
                          {log.ip_address || '127.0.0.1'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {logPagination.totalPages > 1 && (
                <Pagination
                  currentPage={logPagination.page}
                  totalPages={logPagination.totalPages}
                  totalItems={logPagination.total}
                  pageSize={logPagination.limit}
                  onPageChange={(p) => loadLogs(p)}
                />
              )}
            </>
          )}
        </div>
      )}

      {isModalOpen && (
        <UserFormModal
          key={editingUser ? `edit-${editingUser.id}` : 'create-user'}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingUser(null);
          }}
          editingUser={editingUser}
          currentUser={currentUser}
          activeAdminCount={activeAdminCount}
          onSubmit={handleSubmitUser}
        />
      )}

      {Boolean(resetTargetUser) && (
        <ResetPasswordModal
          key={`reset-${resetTargetUser.id}-${resetTempPassword ? 'ready' : 'prompt'}`}
          isOpen={Boolean(resetTargetUser)}
          onClose={() => {
            setResetTargetUser(null);
            setResetTempPassword('');
          }}
          targetUser={resetTargetUser}
          initialTemporaryPassword={resetTempPassword}
          onConfirmReset={handleResetPassword}
        />
      )}

      <UserConfirmModal
        isOpen={confirmState.isOpen}
        mode={confirmState.mode}
        targetUser={confirmState.user}
        processing={confirmProcessing}
        onClose={() => {
          if (!confirmProcessing) {
            setConfirmState({ isOpen: false, mode: 'deactivate', user: null });
          }
        }}
        onConfirm={handleConfirmAction}
      />

      <UserActivityDrawer
        isOpen={Boolean(activityTargetUser)}
        user={activityTargetUser}
        onClose={() => setActivityTargetUser(null)}
      />
    </div>
  );
};

export default UserManagement;
