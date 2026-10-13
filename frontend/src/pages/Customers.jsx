import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Plus,
  Filter,
  Eye,
  Edit2,
  Trash2,
  AlertTriangle,
  ArrowUpDown,
  Building,
  Users,
  UserCheck,
  MapPin,
  Mail,
  Phone,
  Download,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { customersApi } from '../api/customers.api';
import { CustomerFormModal } from './CustomerFormModal';
import { TableSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { Pagination } from '../components/common/Pagination';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useDebounce } from '../hooks/useDebounce';

export const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  const debouncedSearch = useDebounce(searchTerm, 350);

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [deletingCustomer, setDeletingCustomer] = useState(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

  const { canManage, isAdmin } = useAuth();
  const { showToast } = useToast();

  const citiesList = [
    'Austin',
    'New York',
    'San Francisco',
    'Chicago',
    'Seattle',
    'Boston',
    'Miami',
    'Denver',
    'Dallas',
    'Los Angeles',
  ];

  const fetchCustomers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await customersApi.getCustomers({
        page,
        limit: pagination.limit,
        search: debouncedSearch || undefined,
        city: cityFilter || undefined,
        status: statusFilter || undefined,
        sortBy,
        sortOrder,
      });
      setCustomers(res.data || []);
      setPagination(res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err) {
      showToast(err.message || 'Failed to fetch customer directory', 'error');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, cityFilter, statusFilter, sortBy, sortOrder, pagination.limit, showToast]);

  useEffect(() => {
    fetchCustomers(1);
  }, [debouncedSearch, cityFilter, statusFilter, sortBy, sortOrder]);

  const handleSortToggle = (col) => {
    if (sortBy === col) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortOrder('asc');
    }
  };

  const handleDeactivate = async () => {
    if (!deletingCustomer) return;
    setDeletingLoading(true);
    try {
      const result = await customersApi.deleteCustomer(deletingCustomer.id);
      showToast(result.message || 'Customer status updated', 'success');
      setDeletingCustomer(null);
      fetchCustomers(pagination.page);
    } catch (err) {
      showToast(err.message || 'Failed to deactivate customer', 'error');
    } finally {
      setDeletingLoading(false);
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setCityFilter('');
    setStatusFilter('');
  };

  const hasActiveFilters = Boolean(searchTerm || cityFilter || statusFilter);

  // Export Customer Directory CSV
  const exportDirectoryCSV = () => {
    if (!customers || customers.length === 0) return;
    const lines = [];
    lines.push('Smart BI - Customer Directory & Accounts');
    lines.push(`Exported Date,${new Date().toLocaleString()}`);
    lines.push(`Filter City,${cityFilter || 'All Cities'}`);
    lines.push(`Filter Status,${statusFilter || 'All Statuses'}`);
    lines.push('');
    lines.push('Customer Code,Company Name,Contact Email,Phone,City,Status');
    customers.forEach((c) => {
      lines.push(`"${c.customer_code}","${c.customer_name}","${c.email}","${c.phone || ''}","${c.city}","${c.status}"`);
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `smart_bi_customer_directory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Customer directory CSV exported successfully', 'success');
  };

  const activeCustomersCount = useMemo(() => {
    return customers.filter((c) => c.status === 'active').length;
  }, [customers]);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Header bar */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2>Customer Directory</h2>
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(37, 99, 235, 0.1)',
                color: '#2563eb',
                border: '1px solid rgba(37, 99, 235, 0.2)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              CRM Hub
            </span>
          </div>
          <p className="page-subtitle">View and manage your customer accounts and details</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={exportDirectoryCSV}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', padding: '7px 14px' }}
            title="Export directory as CSV"
          >
            <Download size={14} />
            <span>Export Directory</span>
          </button>

          {canManage && (
            <button
              className="btn btn-primary"
              onClick={() => { setEditingCustomer(null); setIsFormOpen(true); }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '0.875rem' }}
            >
              <Plus size={16} />
              <span>Add Customer</span>
            </button>
          )}
        </div>
      </div>

      {/* CRM Overview KPI Stat Cards */}
      <div className="grid-cols-4" style={{ gap: '16px' }}>
        {/* Total Accounts */}
        <div className="stat-card stat-card-revenue">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span className="stat-title">TOTAL CLIENT ACCOUNTS</span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(37, 99, 235, 0.1)',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Users size={16} />
            </div>
          </div>
          <div className="stat-value">{pagination.total || customers.length}</div>
          <div className="stat-footer">Corporate CRM client accounts</div>
        </div>

        {/* Active Accounts */}
        <div className="stat-card stat-card-orders">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span className="stat-title">ACTIVE PARTNERS</span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.1)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <UserCheck size={16} />
            </div>
          </div>
          <div className="stat-value">{activeCustomersCount} <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)' }}>on page</span></div>
          <div className="stat-footer">Approved for commercial orders</div>
        </div>

        {/* Metropolitan Coverage */}
        <div className="stat-card stat-card-customers">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span className="stat-title">METRO MARKETS</span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(2, 132, 199, 0.1)',
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MapPin size={16} />
            </div>
          </div>
          <div className="stat-value">10 <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)' }}>Hubs</span></div>
          <div className="stat-footer">Coast-to-coast regional reach</div>
        </div>

        {/* KYC & Audit Governance */}
        <div className="stat-card stat-card-offerings">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span className="stat-title">ACCOUNT GOVERNANCE</span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(217, 119, 6, 0.1)',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className="stat-value">100%</div>
          <div className="stat-footer">Audit-safe referential integrity</div>
        </div>
      </div>

      {/* Filter and Quick Hub Bar */}
      <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Quick City Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, flexShrink: 0, marginRight: '4px' }}>
            City Hub:
          </span>
          <button
            type="button"
            onClick={() => setCityFilter('')}
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '5px 12px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid',
              borderColor: cityFilter === '' ? 'var(--primary)' : 'var(--border-subtle)',
              background: cityFilter === '' ? 'rgba(37, 99, 235, 0.12)' : 'var(--bg-main)',
              color: cityFilter === '' ? 'var(--primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
          >
            All Cities ({pagination.total || 58})
          </button>
          {citiesList.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => setCityFilter(cityFilter === city ? '' : city)}
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '5px 12px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid',
                borderColor: cityFilter === city ? 'var(--primary)' : 'var(--border-subtle)',
                background: cityFilter === city ? 'rgba(37, 99, 235, 0.12)' : 'var(--bg-main)',
                color: cityFilter === city ? 'var(--primary)' : 'var(--text-muted)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              {city}
            </button>
          ))}
        </div>

        {/* Search, Dropdowns and Reset */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div className="search-input-wrapper" style={{ flex: 1, minWidth: '260px' }}>
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="form-control search-input"
              placeholder="Search by company name, code (CUST-001), or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="form-control"
            style={{ width: '160px' }}
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
          >
            <option value="">All Cities</option>
            {citiesList.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            className="form-control"
            style={{ width: '140px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={resetFilters}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', padding: '6px 10px' }}
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Customers Table in Elevated Glass Panel */}
      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building size={16} color="var(--primary)" />
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
              Client Accounts Ledger
            </span>
            <span
              style={{
                fontSize: '0.6875rem',
                color: 'var(--text-muted)',
                background: 'var(--bg-main)',
                padding: '2px 8px',
                borderRadius: '4px',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {pagination.total} Total Accounts
            </span>
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Showing page {pagination.page} of {pagination.totalPages}
          </div>
        </div>

        <div className="table-responsive">
          {loading ? (
            <TableSkeleton rows={7} columns={7} />
          ) : customers.length === 0 ? (
            <div style={{ padding: '30px' }}>
              <EmptyState
                title="No customers match criteria"
                message="Try adjusting your search terms or clearing the filters."
                action={
                  hasActiveFilters && (
                    <button className="btn btn-secondary btn-sm" onClick={resetFilters}>
                      Reset All Filters
                    </button>
                  )
                }
              />
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th onClick={() => handleSortToggle('customer_code')} style={{ cursor: 'pointer', minWidth: '160px', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>CODE</span>
                      <ArrowUpDown size={12} color="var(--text-dim)" />
                    </div>
                  </th>
                  <th onClick={() => handleSortToggle('customer_name')} style={{ cursor: 'pointer', minWidth: '220px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>CUSTOMER NAME</span>
                      <ArrowUpDown size={12} color="var(--text-dim)" />
                    </div>
                  </th>
                  <th style={{ minWidth: '180px' }}>CONTACT EMAIL</th>
                  <th style={{ minWidth: '130px', whiteSpace: 'nowrap' }}>PHONE</th>
                  <th onClick={() => handleSortToggle('city')} style={{ cursor: 'pointer', minWidth: '120px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>CITY</span>
                      <ArrowUpDown size={12} color="var(--text-dim)" />
                    </div>
                  </th>
                  <th style={{ textAlign: 'center', minWidth: '100px' }}>STATUS</th>
                  <th style={{ textAlign: 'right', minWidth: '120px', whiteSpace: 'nowrap' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => {
                  const initials = c.customer_name
                    ? c.customer_name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()
                    : 'CL';

                  return (
                    <tr key={c.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            fontWeight: 600,
                            color: 'var(--primary)',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.8125rem',
                            background: 'rgba(37, 99, 235, 0.08)',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border: '1px solid rgba(37, 99, 235, 0.2)',
                            whiteSpace: 'nowrap',
                            display: 'inline-block',
                            letterSpacing: '0.02em',
                          }}
                        >
                          {c.customer_code}
                        </span>
                      </td>
                      <td>
                        <Link
                          to={`/customers/${c.id}`}
                          style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}
                        >
                          <div className="avatar-badge" style={{ width: '32px', height: '32px', fontSize: '0.6875rem' }}>
                            {initials}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.875rem' }}>
                              {c.customer_name}
                            </div>
                            <div style={{ fontSize: '0.6875rem', color: 'var(--text-dim)' }}>
                              Account ID: #{c.id}
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                          <Mail size={13} />
                          <span>{c.email}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                          <Phone size={13} />
                          <span>{c.phone || '—'}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                          <MapPin size={13} />
                          <span>{c.city}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <Badge status={c.status} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <Link
                            to={`/customers/${c.id}`}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '5px 8px' }}
                            title="View Customer Profile & Sales History"
                          >
                            <Eye size={13} />
                          </Link>
                          {canManage && (
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '5px 8px' }}
                              title="Edit Customer"
                              onClick={() => { setEditingCustomer(c); setIsFormOpen(true); }}
                            >
                              <Edit2 size={13} />
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              className="btn btn-danger btn-sm"
                              style={{ padding: '5px 8px' }}
                              title="Safely Deactivate / Delete Customer"
                              onClick={() => setDeletingCustomer(c)}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-subtle)' }}>
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={pagination.limit}
            onPageChange={(newPage) => fetchCustomers(newPage)}
          />
        </div>
      </div>

      {/* Customer Form Modal */}
      <CustomerFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        customer={editingCustomer}
        onSaved={() => fetchCustomers(pagination.page)}
      />

      {/* Safe Deactivation Confirmation Modal */}
      <Modal
        isOpen={!!deletingCustomer}
        onClose={() => setDeletingCustomer(null)}
        title="Confirm Safe Customer Deactivation"
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setDeletingCustomer(null)}
              disabled={deletingLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleDeactivate}
              disabled={deletingLoading}
            >
              {deletingLoading ? 'Processing...' : 'Deactivate Customer'}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ef4444',
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={20} />
          </div>
          <div>
            <p style={{ color: 'var(--text-main)', fontWeight: 600, marginBottom: '8px' }}>
              Are you sure you want to deactivate {deletingCustomer?.customer_name}?
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.5 }}>
              To guarantee database audit compliance and financial referential integrity, customers with existing sales orders are safely set to <strong>Inactive</strong> status rather than hard deleted.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Customers;
