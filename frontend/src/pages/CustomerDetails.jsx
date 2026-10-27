import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit2,
  Copy,
  Check,
} from 'lucide-react';
import { customersApi } from '../api/customers.api';
import { CustomerFormModal } from './CustomerFormModal';
import { Badge } from '../components/common/Badge';
import { StatCard } from '../components/common/StatCard';
import { CardSkeleton } from '../components/common/LoadingSkeleton';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDate } from '../utils/format';

export const CustomerDetails = () => {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const { canManage } = useAuth();
  const { showToast } = useToast();

  const fetchCustomer = useCallback(async () => {
    setLoading(true);
    try {
      const data = await customersApi.getCustomerById(id);
      setCustomer(data);
    } catch (err) {
      showToast(err.message || 'Failed to load customer profile', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  const handleCopyCode = (code) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(code);
      setCopiedCode(true);
      showToast(`Copied ${code} to clipboard`, 'info');
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="glass-panel" style={{ padding: '36px', textAlign: 'center' }}>
        <h3>Customer Not Found</h3>
        <p style={{ color: 'var(--text-muted)', margin: '8px 0 16px' }}>
          The requested customer profile does not exist.
        </p>
        <Link to="/customers" className="btn btn-secondary btn-sm">
          <ArrowLeft size={14} /> Back to Customers
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem' }}>
          <Link to="/customers" className="btn btn-secondary btn-sm">
            <ArrowLeft size={14} />
            <span>Customers</span>
          </Link>
          <span style={{ color: 'var(--text-dim)' }}>/</span>
          <span style={{ fontWeight: 600 }}>{customer.customer_name}</span>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Link
            to={`/ai-assistant?prompt=${encodeURIComponent(`Show sales summary for customer ${customer.customer_name}`)}`}
            className="btn btn-secondary btn-sm"
          >
            Ask AI
          </Link>

          {canManage && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setIsEditOpen(true)}
            >
              <Edit2 size={13} />
              <span>Edit Customer</span>
            </button>
          )}
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>
              {customer.customer_name}
            </h2>
            <Badge status={customer.status} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Code:</span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleCopyCode(customer.customer_code)}
              style={{ padding: '3px 8px', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}
              title="Click to copy"
            >
              <span>{customer.customer_code}</span>
              {copiedCode ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '2px' }}>Email</div>
            <a href={`mailto:${customer.email}`} style={{ fontSize: '0.875rem', color: 'var(--primary)' }}>
              {customer.email}
            </a>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '2px' }}>Phone</div>
            <span style={{ fontSize: '0.875rem' }}>{customer.phone || '-'}</span>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '2px' }}>City</div>
            <span style={{ fontSize: '0.875rem' }}>{customer.city}</span>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '2px' }}>Created</div>
            <span style={{ fontSize: '0.875rem' }}>{formatDate(customer.created_at)}</span>
          </div>
        </div>
      </div>

      <div className="grid-cols-4" style={{ marginBottom: '20px' }}>
        <StatCard
          title="Total Spent"
          value={formatCurrency(customer.metrics?.total_revenue)}
          subtitle="Verified sales orders"
        />
        <StatCard
          title="Total Orders"
          value={customer.metrics?.total_orders || 0}
          subtitle="Completed orders"
        />
        <StatCard
          title="Average Order"
          value={formatCurrency(customer.metrics?.avg_order_value)}
          subtitle="Revenue per order"
        />
        <StatCard
          title="Last Order Date"
          value={formatDate(customer.metrics?.last_order_date)}
          subtitle="Recent purchase"
        />
      </div>

      <div className="glass-panel" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '4px' }}>Order History</h3>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
          Past orders placed by this customer
        </p>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {customer.sales?.length > 0 ? (
                customer.sales.map((s) => (
                  <tr key={s.id}>
                    <td className="tabular-nums" style={{ fontWeight: 500, color: 'var(--primary)' }}>#{s.id}</td>
                    <td className="tabular-nums">{formatDate(s.sale_date)}</td>
                    <td className="tabular-nums" style={{ fontWeight: 600 }}>{formatCurrency(s.total_amount)}</td>
                    <td>
                      <span className="badge badge-active">{s.status || 'Completed'}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                    No orders recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isEditOpen && (
        <CustomerFormModal
          isOpen={isEditOpen}
          customer={customer}
          onClose={() => setIsEditOpen(false)}
          onSaved={fetchCustomer}
        />
      )}
    </div>
  );
};

export default CustomerDetails;
