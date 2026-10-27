import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Eye,
  Trash2,
} from 'lucide-react';
import { salesApi } from '../api/sales.api';
import { customersApi } from '../api/customers.api';
import { productsApi } from '../api/products.api';
import { Modal } from '../components/common/Modal';
import { TableSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { Pagination } from '../components/common/Pagination';
import { Badge } from '../components/common/Badge';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDate } from '../utils/format';

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
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [orderItems, setOrderItems] = useState([{ product_id: '', quantity: 1 }]);
  const [formError, setFormError] = useState('');

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
  }, [statusFilter, startDate, endDate]);

  const handleOpenCreateModal = async () => {
    setFormError('');
    setIsCreateOpen(true);
    try {
      const [cRes, pRes] = await Promise.all([
        customersApi.getCustomers({ limit: 100, status: 'active' }),
        productsApi.getProducts({ limit: 100, isActive: 'true' }),
      ]);
      setCustomersList(cRes.data || []);
      setProductsList(pRes.data || []);
      if (cRes.data?.length > 0) setSelectedCustomerId(cRes.data[0].id);
      if (pRes.data?.length > 0) setOrderItems([{ product_id: pRes.data[0].id, quantity: 1 }]);
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

  const handleAddItem = () => {
    const defaultProdId = productsList[0]?.id || '';
    setOrderItems([...orderItems, { product_id: defaultProdId, quantity: 1 }]);
  };

  const handleRemoveItem = (index) => {
    if (orderItems.length <= 1) return;
    setOrderItems(orderItems.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index, field, val) => {
    const updated = [...orderItems];
    updated[index][field] = field === 'quantity' ? parseInt(val, 10) || 1 : val;
    setOrderItems(updated);
  };

  const calculatePreviewTotal = () => {
    return orderItems.reduce((acc, item) => {
      const prod = productsList.find((p) => p.id === parseInt(item.product_id, 10));
      const price = prod ? parseFloat(prod.unit_price) : 0;
      return acc + price * (item.quantity || 1);
    }, 0);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      setFormError('Please select a customer');
      return;
    }

    const formattedItems = orderItems.map((item) => ({
      product_id: parseInt(item.product_id, 10),
      quantity: parseInt(item.quantity, 10),
    }));

    setCreateLoading(true);
    setFormError('');

    try {
      const newSale = await salesApi.createSale({
        customer_id: parseInt(selectedCustomerId, 10),
        sale_date: saleDate,
        items: formattedItems,
      });

      showToast(`Sale #${newSale.id} created successfully`, 'success');
      setIsCreateOpen(false);
      fetchSales(1);
    } catch (err) {
      setFormError(err.message || 'Failed to create sale');
    } finally {
      setCreateLoading(false);
    }
  };

  const [sortField, setSortField] = useState('sale_date');
  const [sortAsc, setSortAsc] = useState(false);

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
      const numA = parseFloat(a.total_amount) || 0;
      const numB = parseFloat(b.total_amount) || 0;
      return sortAsc ? numA - numB : numB - numA;
    }
    const valA = (a[sortField] || '').toString();
    const valB = (b[sortField] || '').toString();
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2>Sales</h2>
          <p className="page-subtitle">Customer transactions and order records</p>
        </div>

        {canManage && (
          <button
            className="btn btn-primary btn-sm"
            onClick={handleOpenCreateModal}
          >
            <Plus size={14} />
            <span>New Sale</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
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

      {/* Table Panel */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        {loading ? (
          <TableSkeleton rows={5} columns={6} />
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
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleOpenCreateModal}
                >
                  <Plus size={14} />
                  <span>Record First Sale</span>
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
                    <th onClick={() => handleSort('id')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                      Sale ID {sortField === 'id' ? (sortAsc ? '↑' : '↓') : ''}
                    </th>
                    <th onClick={() => handleSort('customer_name')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                      Customer {sortField === 'customer_name' ? (sortAsc ? '↑' : '↓') : ''}
                    </th>
                    <th onClick={() => handleSort('sale_date')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                      Date {sortField === 'sale_date' ? (sortAsc ? '↑' : '↓') : ''}
                    </th>
                    <th onClick={() => handleSort('total_amount')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                      Total Amount {sortField === 'total_amount' ? (sortAsc ? '↑' : '↓') : ''}
                    </th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedSales.map((s) => (
                    <tr key={s.id}>
                      <td className="tabular-nums" style={{ fontWeight: 500, color: 'var(--primary)' }}>#{s.id}</td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{s.customer_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{s.city}</div>
                      </td>
                      <td className="tabular-nums">{formatDate(s.sale_date)}</td>
                      <td className="tabular-nums" style={{ fontWeight: 600 }}>{formatCurrency(s.total_amount)}</td>
                      <td>
                        <Badge status={s.status} />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleViewSale(s.id)}
                          title="View sale items"
                          style={{ padding: '4px 8px' }}
                        >
                          <Eye size={13} />
                        </button>
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
              onPageChange={(p) => fetchSales(p)}
            />
          </>
        )}
      </div>

      {/* View Sale Modal */}
      {viewingSale && (
        <Modal
          isOpen={Boolean(viewingSale)}
          onClose={() => setViewingSale(null)}
          title={`Sale Details #${viewingSale.id}`}
          footer={
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setViewingSale(null)}
            >
              Close
            </button>
          }
        >
          {viewLoading ? (
            <p>Loading sale details...</p>
          ) : (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Customer</div>
                  <div style={{ fontWeight: 500 }}>{viewingSale.customer_name}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Date</div>
                  <div>{formatDate(viewingSale.sale_date)}</div>
                </div>
              </div>

              <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px' }}>Line Items</div>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Unit Price</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingSale.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.product_name}</td>
                        <td className="tabular-nums">{item.quantity}</td>
                        <td className="tabular-nums">{formatCurrency(item.unit_price)}</td>
                        <td className="tabular-nums" style={{ fontWeight: 600 }}>{formatCurrency(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'right', fontWeight: 600 }}>Total</td>
                      <td className="tabular-nums" style={{ fontWeight: 700, color: 'var(--primary)' }}>
                        {formatCurrency(viewingSale.total_amount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Create Sale Modal */}
      {isCreateOpen && (
        <Modal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title="New Sale Order"
          footer={
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsCreateOpen(false)}
                disabled={createLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="sale-create-form"
                className="btn btn-primary"
                disabled={createLoading}
              >
                {createLoading ? 'Saving...' : 'Create Sale'}
              </button>
            </>
          }
        >
          <form id="sale-create-form" onSubmit={handleCreateSubmit}>
            {formError && (
              <div style={{ color: 'var(--danger)', fontSize: '0.8125rem', marginBottom: '12px' }}>
                {formError}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Customer *</label>
              <select
                className="form-control"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                required
              >
                <option value="">Select a customer</option>
                {customersList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.customer_name} ({c.city})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Sale Date *</label>
              <input
                type="date"
                className="form-control"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                required
              />
            </div>

            <div style={{ marginTop: '16px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Products
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleAddItem}
              >
                Add Item
              </button>
            </div>

            {orderItems.map((item, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                <select
                  className="form-control"
                  value={item.product_id}
                  onChange={(e) => handleItemChange(idx, 'product_id', e.target.value)}
                  required
                >
                  <option value="">Select product</option>
                  {productsList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.product_name} (₹{p.unit_price})
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min="1"
                  className="form-control"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                  required
                />

                {orderItems.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleRemoveItem(idx)}
                    style={{ padding: '6px' }}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}

            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', textAlign: 'right', fontWeight: 600 }}>
              Estimated Total: {formatCurrency(calculatePreviewTotal())}
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Sales;
