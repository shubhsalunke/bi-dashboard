import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Eye,
  Calendar,
  Trash2,
  AlertCircle,
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

export const Sales = () => {
  const [sales, setSales] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // View Sale Modal
  const [viewingSale, setViewingSale] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  // Create Sale Modal
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
      showToast(err.message || 'Failed to fetch sales records', 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, startDate, endDate, pagination.limit, showToast]);

  useEffect(() => {
    fetchSales(1);
  }, [statusFilter, startDate, endDate]);

  // Load active customers and products when opening create modal
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
    } catch (err) {
      showToast('Failed to load customers or products catalog', 'error');
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
      setFormError('Please select a customer account');
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

      showToast(`Sale #${newSale.id} created successfully ($${newSale.total_amount})!`, 'success');
      setIsCreateOpen(false);
      fetchSales(1);
    } catch (err) {
      setFormError(err.message || 'Sale creation failed');
    } finally {
      setCreateLoading(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(val || 0);
  };

  const formatDate = (val) => {
    if (!val) return '—';
    try {
      return val.split('T')[0];
    } catch {
      return val;
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h2>Sales & Order Transactions</h2>
          <p className="page-subtitle">Track orders, invoices, and server-validated transactional totals</p>
        </div>

        {canManage && (
          <button className="btn btn-primary" onClick={handleOpenCreateModal}>
            <Plus size={16} />
            <span>Create New Sale</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <select
          className="form-control"
          style={{ width: '160px' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={16} color="var(--text-muted)" />
          <input
            type="date"
            className="form-control"
            style={{ width: '145px' }}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>to</span>
          <input
            type="date"
            className="form-control"
            style={{ width: '145px' }}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          {(startDate || endDate || statusFilter) && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => { setStartDate(''); setEndDate(''); setStatusFilter(''); }}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Sales Table */}
      <div className="table-responsive">
        {loading ? (
          <TableSkeleton rows={7} columns={7} />
        ) : sales.length === 0 ? (
          <EmptyState title="No sales found" message="Try adjusting your date range or status filters." />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Client Customer</th>
                <th>Sale Date</th>
                <th>Items</th>
                <th>Total Revenue</th>
                <th>Created By</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 700, color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
                    #{s.id}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{s.customer_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{s.customer_code} • {s.city}</div>
                  </td>
                  <td>{formatDate(s.sale_date)}</td>
                  <td>{s.item_count} item(s)</td>
                  <td style={{ fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(s.total_amount)}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{s.created_by_name || 'System'}</td>
                  <td><Badge status={s.status} /></td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '6px' }}
                      title="View Order Details & Line Items"
                      onClick={() => handleViewSale(s.id)}
                    >
                      <Eye size={14} />
                    </button>
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
        onPageChange={(p) => fetchSales(p)}
      />

      {/* View Sale Details Modal */}
      <Modal
        isOpen={!!viewingSale || viewLoading}
        onClose={() => setViewingSale(null)}
        title={viewingSale ? `Sale Order #${viewingSale.id}` : 'Loading Sale Details...'}
        footer={
          <button className="btn btn-secondary" onClick={() => setViewingSale(null)}>
            Close
          </button>
        }
      >
        {viewLoading || !viewingSale ? (
          <TableSkeleton rows={3} columns={4} />
        ) : (
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '16px',
              padding: '16px',
              background: 'var(--bg-input)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '20px',
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Customer</div>
                <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{viewingSale.customer_name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{viewingSale.customer_code}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sale Date</div>
                <div style={{ fontWeight: 600 }}>{formatDate(viewingSale.sale_date)}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Status</div>
                <Badge status={viewingSale.status} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Amount</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--success)' }}>
                  {formatCurrency(viewingSale.total_amount)}
                </div>
              </div>
            </div>

            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px' }}>Order Line Items</h4>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {viewingSale.items?.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600 }}>{item.product_name}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{item.category}</td>
                      <td>{item.quantity}</td>
                      <td>{formatCurrency(item.unit_price)}</td>
                      <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{formatCurrency(item.line_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Transactional Sale Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Transactional Sale Order"
        maxWidth="680px"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsCreateOpen(false)} disabled={createLoading}>
              Cancel
            </button>
            <button type="submit" form="create-sale-form" className="btn btn-primary" disabled={createLoading}>
              {createLoading ? 'Processing Transaction...' : 'Submit & Execute Sale'}
            </button>
          </>
        }
      >
        <form id="create-sale-form" onSubmit={handleCreateSubmit}>
          {formError && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '16px',
            }}>
              <AlertCircle size={18} />
              <span>{formError}</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div className="form-group">
              <label className="form-label">Client Customer Account *</label>
              <select
                className="form-control"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                required
              >
                {customersList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.customer_name} ({c.customer_code} • {c.city})
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
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="form-label">Order Line Items *</label>
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddItem}>
                <Plus size={14} /> Add Line Item
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {orderItems.map((item, index) => {
                const prod = productsList.find((p) => p.id === parseInt(item.product_id, 10));
                const price = prod ? parseFloat(prod.unit_price) : 0;
                const lineTotal = price * (item.quantity || 1);

                return (
                  <div
                    key={index}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '3fr 1fr 1.5fr auto',
                      gap: '10px',
                      alignItems: 'center',
                      background: 'var(--bg-input)',
                      padding: '10px 14px',
                      borderRadius: '8px',
                    }}
                  >
                    <select
                      className="form-control"
                      value={item.product_id}
                      onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                      required
                    >
                      {productsList.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.product_name} - {formatCurrency(p.unit_price)}
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min="1"
                      className="form-control"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      required
                    />

                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#34d399', textAlign: 'right' }}>
                      {formatCurrency(lineTotal)}
                    </div>

                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => handleRemoveItem(index)}
                      disabled={orderItems.length <= 1}
                      style={{ padding: '6px' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px',
            background: '#131d31',
            borderRadius: '8px',
            marginTop: '20px',
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Estimated Order Total (Calculated by Server)
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                Guaranteed secure transaction with atomic database protection
              </div>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#34d399' }}>
              {formatCurrency(calculatePreviewTotal())}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Sales;
