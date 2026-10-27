import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Plus,
  Eye,
  Edit2,
  Trash2,
  Download,
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

  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const debouncedSearch = useDebounce(searchTerm, 300);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [deletingCustomer, setDeletingCustomer] = useState(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

  const { canManage } = useAuth();
  const { showToast } = useToast();

  const citiesList = [
    'Pune',
    'Mumbai',
    'Nagpur',
    'Nashik',
    'Aurangabad',
    'Hyderabad',
    'Delhi',
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
      });
      setCustomers(res.data || []);
      setPagination(res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err) {
      showToast(err.message || 'Failed to load customers', 'error');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, cityFilter, statusFilter, pagination.limit, showToast]);

  useEffect(() => {
    fetchCustomers(1);
  }, [debouncedSearch, cityFilter, statusFilter]);

  const handleDeactivate = async () => {
    if (!deletingCustomer) return;
    setDeletingLoading(true);
    try {
      const result = await customersApi.deleteCustomer(deletingCustomer.id);
      showToast(result.message || 'Customer deleted', 'success');
      setDeletingCustomer(null);
      fetchCustomers(pagination.page);
    } catch (err) {
      showToast(err.message || 'Failed to delete customer', 'error');
    } finally {
      setDeletingLoading(false);
    }
  };

  const exportDirectoryCSV = () => {
    if (!customers || customers.length === 0) return;
    const lines = [];
    lines.push('Customer Code,Company Name,Contact Email,Phone,City,Status');
    customers.forEach((c) => {
      lines.push(`"${c.customer_code}","${c.customer_name}","${c.email}","${c.phone || ''}","${c.city}","${c.status}"`);
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `customers_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    showToast('Exported customers to CSV', 'success');
  };

  const searchInputRef = React.useRef(null);
  const [sortField, setSortField] = useState('customer_name');
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.key === '/' &&
        document.activeElement !== searchInputRef.current &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedCustomers = [...customers].sort((a, b) => {
    const valA = (a[sortField] || '').toString().toLowerCase();
    const valB = (b[sortField] || '').toString().toLowerCase();
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2>Customer Directory</h2>
          <p className="page-subtitle">Manage customer records and contact details</p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={exportDirectoryCSV}
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>

          {canManage && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => { setEditingCustomer(null); setIsFormOpen(true); }}
            >
              <Plus size={14} />
              <span>Add Customer</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search size={15} className="search-icon" />
          <input
            ref={searchInputRef}
            type="text"
            className="form-control search-input"
            placeholder="Search by company name, contact, code... (Press / to search)"
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
          style={{ width: '130px' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        {(searchTerm || cityFilter || statusFilter) && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => { setSearchTerm(''); setCityFilter(''); setStatusFilter(''); }}
          >
            Reset
          </button>
        )}
      </div>

      {/* Table Panel */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        {loading ? (
          <TableSkeleton rows={5} columns={6} />
        ) : customers.length === 0 ? (
          <EmptyState
            title="No customers found"
            description={
              searchTerm || cityFilter || statusFilter
                ? 'No customer records match your filter criteria.'
                : 'No customers recorded yet.'
            }
            action={
              (searchTerm || cityFilter || statusFilter) ? (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => { setSearchTerm(''); setCityFilter(''); setStatusFilter(''); }}
                >
                  Clear Filters
                </button>
              ) : canManage ? (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => { setEditingCustomer(null); setIsFormOpen(true); }}
                >
                  <Plus size={14} />
                  <span>Add First Customer</span>
                </button>
              ) : null
            }
          />
        ) : (
          <>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('customer_code')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                      Code {sortField === 'customer_code' ? (sortAsc ? '↑' : '↓') : ''}
                    </th>
                    <th onClick={() => handleSort('customer_name')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                      Company Name {sortField === 'customer_name' ? (sortAsc ? '↑' : '↓') : ''}
                    </th>
                    <th>Contact Email</th>
                    <th>Phone</th>
                    <th onClick={() => handleSort('city')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                      City {sortField === 'city' ? (sortAsc ? '↑' : '↓') : ''}
                    </th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCustomers.map((c) => (
                    <tr key={c.id}>
                      <td className="tabular-nums" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                        {c.customer_code}
                      </td>
                      <td style={{ fontWeight: 500 }}>
                        <Link to={`/customers/${c.id}`} style={{ color: 'var(--primary)' }}>
                          {c.customer_name}
                        </Link>
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{c.email}</td>
                      <td className="tabular-nums" style={{ color: 'var(--text-muted)' }}>{c.phone || '-'}</td>
                      <td>{c.city}</td>
                      <td>
                        <Badge status={c.status} />
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <Link
                            to={`/customers/${c.id}`}
                            className="btn btn-secondary btn-sm"
                            title="View customer"
                            style={{ padding: '4px 8px' }}
                          >
                            <Eye size={13} />
                          </Link>
                          {canManage && (
                            <>
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => { setEditingCustomer(c); setIsFormOpen(true); }}
                                title="Edit customer"
                                style={{ padding: '4px 8px' }}
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                type="button"
                                className="btn btn-danger btn-sm"
                                onClick={() => setDeletingCustomer(c)}
                                title="Delete customer"
                                style={{ padding: '4px 8px' }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              limit={pagination.limit}
              onPageChange={(p) => fetchCustomers(p)}
            />
          </>
        )}
      </div>

      {/* Customer Form Modal */}
      {isFormOpen && (
        <CustomerFormModal
          isOpen={isFormOpen}
          customer={editingCustomer}
          onClose={() => { setIsFormOpen(false); setEditingCustomer(null); }}
          onSaved={() => fetchCustomers(pagination.page)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingCustomer && (
        <Modal
          isOpen={Boolean(deletingCustomer)}
          onClose={() => setDeletingCustomer(null)}
          title="Delete Customer"
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
                {deletingLoading ? 'Deleting...' : 'Delete'}
              </button>
            </>
          }
        >
          <p style={{ color: 'var(--text-main)', fontSize: '0.875rem' }}>
            Are you sure you want to delete customer <strong>{deletingCustomer.customer_name}</strong>?
          </p>
        </Modal>
      )}
    </div>
  );
};

export default Customers;
