import React, { useState, useEffect, useCallback } from 'react';
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
      setCustomers(res.data);
      setPagination(res.pagination);
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

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h2>Customer Directory</h2>
          <p className="page-subtitle">View and manage your customer accounts and details</p>
        </div>

        {canManage && (
          <button
            className="btn btn-primary"
            onClick={() => { setEditingCustomer(null); setIsFormOpen(true); }}
          >
            <Plus size={16} />
            <span>Add Customer</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
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
          <option value="New York">New York</option>
          <option value="San Francisco">San Francisco</option>
          <option value="Chicago">Chicago</option>
          <option value="Austin">Austin</option>
          <option value="Seattle">Seattle</option>
          <option value="Boston">Boston</option>
          <option value="Miami">Miami</option>
          <option value="Denver">Denver</option>
          <option value="Dallas">Dallas</option>
          <option value="Los Angeles">Los Angeles</option>
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
      </div>

      {/* Customers Table */}
      <div className="table-responsive">
        {loading ? (
          <TableSkeleton rows={7} columns={6} />
        ) : customers.length === 0 ? (
          <EmptyState
            title="No customers match criteria"
            message="Try adjusting your search terms or clearing the filters."
            action={
              (searchTerm || cityFilter || statusFilter) && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => { setSearchTerm(''); setCityFilter(''); setStatusFilter(''); }}
                >
                  Reset All Filters
                </button>
              )
            }
          />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th onClick={() => handleSortToggle('customer_code')} style={{ cursor: 'pointer' }}>
                  Code <ArrowUpDown size={12} style={{ display: 'inline', marginLeft: 4 }} />
                </th>
                <th onClick={() => handleSortToggle('customer_name')} style={{ cursor: 'pointer' }}>
                  Customer Name <ArrowUpDown size={12} style={{ display: 'inline', marginLeft: 4 }} />
                </th>
                <th>Contact Email</th>
                <th>Phone</th>
                <th onClick={() => handleSortToggle('city')} style={{ cursor: 'pointer' }}>
                  City <ArrowUpDown size={12} style={{ display: 'inline', marginLeft: 4 }} />
                </th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600, color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
                    {c.customer_code}
                  </td>
                  <td>
                    <Link
                      to={`/customers/${c.id}`}
                      style={{ fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      <Building size={16} color="var(--text-muted)" />
                      <span>{c.customer_name}</span>
                    </Link>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{c.email}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{c.phone || '—'}</td>
                  <td>{c.city}</td>
                  <td><Badge status={c.status} /></td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <Link
                        to={`/customers/${c.id}`}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '6px' }}
                        title="View Customer Profile & Sales History"
                      >
                        <Eye size={14} />
                      </Link>
                      {canManage && (
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '6px' }}
                          title="Edit Customer"
                          onClick={() => { setEditingCustomer(c); setIsFormOpen(true); }}
                        >
                          <Edit2 size={14} />
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          className="btn btn-danger btn-sm"
                          style={{ padding: '6px' }}
                          title="Safely Deactivate / Delete Customer"
                          onClick={() => setDeletingCustomer(c)}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        limit={pagination.limit}
        onPageChange={(newPage) => fetchCustomers(newPage)}
      />

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
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ef4444',
            flexShrink: 0,
          }}>
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
