import React, { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { salesApi } from '../api/sales.api';
import { customersApi } from '../api/customers.api';
import { productsApi } from '../api/products.api';
import { TableSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { Pagination } from '../components/common/Pagination';
import { SaleDetailModal } from '../components/sales/SaleDetailModal';
import { SaleCreateModal } from '../components/sales/SaleCreateModal';
import { SalesTable } from '../components/sales/SalesTable';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const Sales = () => {
  const [sales, setSales] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [viewingSale, setViewingSale] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [customersList, setCustomersList] = useState([]);
  const [productsList, setProductsList] = useState([]);

  const [sortField, setSortField] = useState('sale_date');
  const [sortAsc, setSortAsc] = useState(false);

  const { canManage } = useAuth();
  const { showToast } = useToast();

  const fetchSales = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await salesApi.getSales({
        page,
        limit: pagination.limit,
        status: statusFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setSales(res.data);
      setPagination(res.pagination);
    } catch (err) {
      showToast(err.message || 'Failed to load sales', 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, startDate, endDate, pagination.limit, showToast]);

  useEffect(() => {
    fetchSales(1);
  }, [fetchSales]);

  const handleOpenCreateModal = async () => {
    setIsCreateOpen(true);
    try {
      const [cRes, pRes] = await Promise.all([
        customersApi.getCustomers({ limit: 100, status: 'active' }),
        productsApi.getProducts({ limit: 100, isActive: 'true' }),
      ]);
      setCustomersList(cRes.data || []);
      setProductsList(pRes.data || []);
    } catch {
      showToast('Failed to load customers or products list', 'error');
    }
  };

  const handleViewSale = async (id) => {
    setViewLoading(true);
    setViewingSale(null);
    try {
      const data = await salesApi.getSaleById(id);
      setViewingSale(data);
    } catch (err) {
      showToast(err.message || 'Failed to load sale details', 'error');
    } finally {
      setViewLoading(false);
    }
  };

  const handleCreateSubmit = async (payload, setFormError) => {
    setCreateLoading(true);
    try {
      const newSale = await salesApi.createSale(payload);
      showToast(`Sale #${newSale.id} created successfully`, 'success');
      setIsCreateOpen(false);
      fetchSales(1);
    } catch (err) {
      setFormError(err.message || 'Failed to create sale');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedSales = [...sales].sort((a, b) => {
    if (sortField === 'id') {
      return sortAsc ? a.id - b.id : b.id - a.id;
    }
    if (sortField === 'total_amount') {
      return sortAsc
        ? parseFloat(a.total_amount) - parseFloat(b.total_amount)
        : parseFloat(b.total_amount) - parseFloat(a.total_amount);
    }
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
          <h2>Sales Transactions</h2>
          <p className="page-subtitle">Historical sales and line items</p>
        </div>

        {canManage && (
          <button className="btn btn-primary btn-sm" onClick={handleOpenCreateModal}>
            <Plus size={14} />
            <span>New Sale</span>
          </button>
        )}
      </div>

      <div className="filter-bar">
        <select
          className="form-control"
          style={{ width: '150px' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <input
            type="date"
            className="form-control"
            style={{ width: '135px' }}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>to</span>
          <input
            type="date"
            className="form-control"
            style={{ width: '135px' }}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        {(statusFilter || startDate || endDate) && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => { setStatusFilter(''); setStartDate(''); setEndDate(''); }}
          >
            Reset
          </button>
        )}
      </div>

      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : sales.length === 0 ? (
          <EmptyState
            title="No sales found"
            description={
              statusFilter || startDate || endDate
                ? 'No sales match your current date or status filters.'
                : 'No sales transactions recorded yet.'
            }
            action={
              (statusFilter || startDate || endDate) ? (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => { setStatusFilter(''); setStartDate(''); setEndDate(''); }}
                >
                  Clear Filters
                </button>
              ) : canManage ? (
                <button className="btn btn-primary btn-sm" onClick={handleOpenCreateModal}>
                  <Plus size={14} />
                  <span>Record First Sale</span>
                </button>
              ) : null
            }
          />
        ) : (
          <>
            <SalesTable
              sales={sortedSales}
              sortField={sortField}
              sortAsc={sortAsc}
              onSort={handleSort}
              onView={handleViewSale}
            />

            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              limit={pagination.limit}
              onPageChange={(p) => fetchSales(p)}
            />
          </>
        )}
      </div>

      <SaleDetailModal
        sale={viewingSale}
        loading={viewLoading}
        onClose={() => setViewingSale(null)}
      />

      {isCreateOpen && (
        <SaleCreateModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onSubmit={handleCreateSubmit}
          loading={createLoading}
          customers={customersList}
          products={productsList}
        />
      )}
    </div>
  );
};

export default Sales;
