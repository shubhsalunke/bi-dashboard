import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Plus, Download, AlertCircle } from 'lucide-react';
import { customersApi } from '../api/customers.api';
import { CustomerFormModal } from './CustomerFormModal';
import { TableSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { Pagination } from '../components/common/Pagination';
import { Modal } from '../components/common/Modal';
import { CustomersTable } from '../components/customers/CustomersTable';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useDebounce } from '../hooks/useDebounce';
import {
  CUSTOMER_INDUSTRIES,
  CUSTOMER_TYPES,
  CUSTOMER_STATUSES,
} from '../utils/customerOptions';

const CITIES = ['Pune', 'Mumbai', 'Nagpur', 'Nashik', 'Aurangabad', 'Hyderabad', 'Delhi'];

export const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [customerTypeFilter, setCustomerTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [deletingCustomer, setDeletingCustomer] = useState(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

  const [sortField, setSortField] = useState('customer_name');
  const [sortAsc, setSortAsc] = useState(true);
  const searchInputRef = useRef(null);

  const { canManage } = useAuth();
  const { showToast } = useToast();

  const fetchCustomers = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await customersApi.getCustomers({
        page,
        limit: pagination.limit,
        search: debouncedSearch || undefined,
        city: cityFilter || undefined,
        industry: industryFilter || undefined,
        customer_type: customerTypeFilter || undefined,
        status: statusFilter || undefined,
      });
      setCustomers(res.data || []);
      setPagination(res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err) {
      const msg = err.message || 'Failed to load customers';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, cityFilter, industryFilter, customerTypeFilter, statusFilter, pagination.limit, showToast]);

  useEffect(() => {
    fetchCustomers(1);
  }, [fetchCustomers]);

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
    const lines = ['Customer Code,Company Name,Contact Email,Phone,City,State,Industry,Customer Type,Contact Person,GST Number,Status'];
    customers.forEach((c) => {
      lines.push(
        `"${c.customer_code}","${c.customer_name}","${c.email}","${c.phone || ''}","${c.city}","${c.state || ''}","${c.industry || ''}","${c.customer_type || ''}","${c.contact_person || ''}","${c.gst_number || ''}","${c.status}"`
      );
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `customers_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    showToast('Exported customers to CSV', 'success');
  };

  const hasActiveFilters = Boolean(searchTerm || cityFilter || industryFilter || customerTypeFilter || statusFilter);
  const resetFilters = () => {
    setSearchTerm('');
    setCityFilter('');
    setIndustryFilter('');
    setCustomerTypeFilter('');
    setStatusFilter('');
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
      <div className="page-header">
        <div>
          <h2>Customers</h2>
        </div>

        <div className="header-actions">
          <button type="button" className="btn btn-secondary btn-sm" onClick={exportDirectoryCSV}>
            <Download size={14} aria-hidden="true" />
            <span>Export CSV</span>
          </button>
          {canManage && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => { setEditingCustomer(null); setIsFormOpen(true); }}
            >
              <Plus size={14} aria-hidden="true" />
              <span>Add Customer</span>
            </button>
          )}
        </div>
      </div>

      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search size={15} className="search-icon" aria-hidden="true" />
          <input
            ref={searchInputRef}
            type="text"
            aria-label="Search customers"
            className="form-control search-input"
            placeholder="Search by company name, email, or code... (Press / to search)"
            maxLength={100}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="form-control filter-select"
          aria-label="Filter by city"
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
        >
          <option value="">All Cities</option>
          {CITIES.map((city) => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>

        <select
          className="form-control filter-select"
          aria-label="Filter by industry"
          value={industryFilter}
          onChange={(e) => setIndustryFilter(e.target.value)}
        >
          <option value="">All Industries</option>
          {CUSTOMER_INDUSTRIES.map((industry) => (
            <option key={industry} value={industry}>{industry}</option>
          ))}
        </select>

        <select
          className="form-control filter-select"
          aria-label="Filter by customer type"
          value={customerTypeFilter}
          onChange={(e) => setCustomerTypeFilter(e.target.value)}
        >
          <option value="">All Types</option>
          {CUSTOMER_TYPES.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>

        <select
          className="form-control filter-select"
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          {CUSTOMER_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={resetFilters}
          >
            Reset
          </button>
        )}
      </div>

      <div className="card card-flush">
        {loading ? (
          <TableSkeleton rows={8} columns={9} />
        ) : error && customers.length === 0 ? (
          <EmptyState
            icon={AlertCircle}
            title="Unable to load customers"
            description={error}
            action={
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => fetchCustomers(1)}>
                Retry
              </button>
            }
          />
        ) : sortedCustomers.length === 0 ? (
          <EmptyState
            title="No customers found"
            description={
              hasActiveFilters
                ? 'Try adjusting your search criteria or filters.'
                : 'No customers recorded yet.'
            }
            action={
              hasActiveFilters ? (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={resetFilters}
                >
                  Clear Filters
                </button>
              ) : canManage ? (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => { setEditingCustomer(null); setIsFormOpen(true); }}
                >
                  <Plus size={14} aria-hidden="true" />
                  <span>Add First Customer</span>
                </button>
              ) : null
            }
          />
        ) : (
          <>
            <CustomersTable
              customers={sortedCustomers}
              sortField={sortField}
              sortAsc={sortAsc}
              onSort={handleSort}
              canManage={canManage}
              onEdit={(c) => { setEditingCustomer(c); setIsFormOpen(true); }}
              onDelete={(c) => setDeletingCustomer(c)}
            />

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

      {isFormOpen && (
        <CustomerFormModal
          isOpen={isFormOpen}
          customer={editingCustomer}
          onClose={() => { setIsFormOpen(false); setEditingCustomer(null); }}
          onSaved={() => fetchCustomers(pagination.page)}
        />
      )}

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
          <p style={{ color: 'var(--text-primary)', fontSize: '0.875rem' }}>
            Are you sure you want to delete customer <strong>{deletingCustomer.customer_name}</strong>?
          </p>
        </Modal>
      )}
    </div>
  );
};

export default Customers;
