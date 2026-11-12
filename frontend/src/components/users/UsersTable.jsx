import React, { useState, useEffect, useRef } from 'react';
import {
  MoreVertical,
  Edit2,
  KeyRound,
  UserCheck,
  UserX,
  Trash2,
  History,
} from 'lucide-react';
import Badge from '../common/Badge';
import TableHeader from '../common/TableHeader';
import Pagination from '../common/Pagination';
import { formatDate } from '../../utils/format';
import { getRoleLabel } from '../../utils/userOptions';

const formatLastLogin = (val) => {
  if (!val) return 'Never';
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const UsersTable = ({
  users,
  currentUser,
  activeAdminCount,
  sortBy,
  sortOrder,
  onSort,
  pagination,
  onPageChange,
  onEdit,
  onResetPassword,
  onToggleStatus,
  onDelete,
  onViewActivity,
}) => {
  const [openMenuUserId, setOpenMenuUserId] = useState(null);
  const menuContainerRef = useRef(null);

  useEffect(() => {
    if (openMenuUserId === null) return undefined;

    const handleClickOutside = (e) => {
      if (menuContainerRef.current && !menuContainerRef.current.contains(e.target)) {
        setOpenMenuUserId(null);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setOpenMenuUserId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [openMenuUserId]);

  const sortAsc = sortOrder === 'asc';

  return (
    <>
      <div className="table-responsive" ref={menuContainerRef}>
        <table className="data-table">
          <thead>
            <tr>
              <TableHeader
                label="User"
                field="name"
                sortField={sortBy}
                sortAsc={sortAsc}
                onSort={onSort}
              />
              <TableHeader
                label="Email"
                field="email"
                sortField={sortBy}
                sortAsc={sortAsc}
                onSort={onSort}
              />
              <TableHeader
                label="Department"
                field="department"
                sortField={sortBy}
                sortAsc={sortAsc}
                onSort={onSort}
              />
              <TableHeader
                label="Role"
                field="role"
                sortField={sortBy}
                sortAsc={sortAsc}
                onSort={onSort}
              />
              <TableHeader
                label="Status"
                field="is_active"
                sortField={sortBy}
                sortAsc={sortAsc}
                onSort={onSort}
              />
              <TableHeader
                label="Last Login"
                field="last_login_at"
                sortField={sortBy}
                sortAsc={sortAsc}
                onSort={onSort}
              />
              <TableHeader
                label="Created Date"
                field="created_at"
                sortField={sortBy}
                sortAsc={sortAsc}
                onSort={onSort}
              />
              <th className="num">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isSelf = currentUser && Number(currentUser.id) === Number(u.id);
              const isLastActiveAdmin =
                u.role === 'admin' && Boolean(u.is_active) && activeAdminCount <= 1;
              const cannotDeactivateOrDelete = isSelf || isLastActiveAdmin;
              const disabledReason = isSelf
                ? 'You cannot perform this action on your own account'
                : isLastActiveAdmin
                ? 'Cannot modify or remove the last active Administrator'
                : '';

              const isMenuOpen = openMenuUserId === u.id;

              return (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <div className="user-avatar" aria-hidden="true">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="cell-primary">
                          {u.name}{' '}
                          {isSelf && (
                            <span
                              style={{
                                fontSize: '0.75rem',
                                color: 'var(--accent-text)',
                                fontWeight: 500,
                              }}
                            >
                              (You)
                            </span>
                          )}
                        </div>
                        {u.phone && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {u.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {u.department || <span style={{ color: 'var(--text-muted)' }}>-</span>}
                  </td>
                  <td>
                    <Badge variant={u.role}>{getRoleLabel(u.role)}</Badge>
                  </td>
                  <td>
                    <Badge status={u.is_active ? 'active' : 'inactive'} />
                  </td>
                  <td
                    className="tabular-nums"
                    style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', whiteSpace: 'nowrap' }}
                  >
                    {formatLastLogin(u.last_login_at)}
                  </td>
                  <td
                    className="tabular-nums"
                    style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}
                  >
                    {formatDate(u.created_at)}
                  </td>
                  <td className="num">
                    <div className="dropdown-wrapper">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        aria-haspopup="menu"
                        aria-expanded={isMenuOpen}
                        aria-label={`Actions for ${u.name}`}
                        onClick={() => setOpenMenuUserId(isMenuOpen ? null : u.id)}
                      >
                        <MoreVertical size={14} aria-hidden="true" />
                        <span>Actions</span>
                      </button>

                      {isMenuOpen && (
                        <div className="dropdown-menu" role="menu" aria-label={`Actions menu for ${u.name}`}>
                          <button
                            type="button"
                            role="menuitem"
                            className="dropdown-item"
                            onClick={() => {
                              setOpenMenuUserId(null);
                              onEdit(u);
                            }}
                          >
                            <Edit2 size={14} aria-hidden="true" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            role="menuitem"
                            className="dropdown-item"
                            onClick={() => {
                              setOpenMenuUserId(null);
                              onViewActivity(u);
                            }}
                          >
                            <History size={14} aria-hidden="true" />
                            <span>Activity Log</span>
                          </button>

                          <button
                            type="button"
                            role="menuitem"
                            className="dropdown-item"
                            onClick={() => {
                              setOpenMenuUserId(null);
                              onResetPassword(u);
                            }}
                          >
                            <KeyRound size={14} aria-hidden="true" />
                            <span>Reset Password</span>
                          </button>

                          <button
                            type="button"
                            role="menuitem"
                            className="dropdown-item"
                            disabled={u.is_active && cannotDeactivateOrDelete}
                            title={u.is_active && cannotDeactivateOrDelete ? disabledReason : undefined}
                            onClick={() => {
                              setOpenMenuUserId(null);
                              onToggleStatus(u);
                            }}
                          >
                            {u.is_active ? (
                              <>
                                <UserX size={14} aria-hidden="true" />
                                <span>Deactivate</span>
                              </>
                            ) : (
                              <>
                                <UserCheck size={14} aria-hidden="true" />
                                <span>Activate</span>
                              </>
                            )}
                          </button>

                          <div className="dropdown-divider" />

                          <button
                            type="button"
                            role="menuitem"
                            className="dropdown-item dropdown-item-danger"
                            disabled={cannotDeactivateOrDelete}
                            title={cannotDeactivateOrDelete ? disabledReason : undefined}
                            onClick={() => {
                              setOpenMenuUserId(null);
                              onDelete(u);
                            }}
                          >
                            <Trash2 size={14} aria-hidden="true" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pagination && pagination.total > 0 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          pageSize={pagination.limit}
          onPageChange={onPageChange}
        />
      )}
    </>
  );
};

export default UsersTable;

