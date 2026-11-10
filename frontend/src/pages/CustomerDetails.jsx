import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Edit2, Copy, Check, AlertCircle } from 'lucide-react';
import { customersApi } from '../api/customers.api';
import { CustomerFormModal } from './CustomerFormModal';
import { Badge } from '../components/common/Badge';
import { StatCard } from '../components/common/StatCard';
import { EmptyState } from '../components/common/EmptyState';
import { CardSkeleton } from '../components/common/LoadingSkeleton';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDate } from '../utils/format';

export const CustomerDetails = () => {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const { canManage } = useAuth();
  const { showToast } = useToast();

  const fetchCustomer = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await customersApi.getCustomerById(id);
      setCustomer(data);
    } catch (err) {
      const msg = err.message || 'Failed to load customer profile';
      setError(msg);
      showToast(msg, 'error');
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
      <div className="grid-cols-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (!customer && error) {
    return (
      <div className="card">
        <EmptyState
          icon={AlertCircle}
          title="Unable to load customer profile"
          description={error}
          action={
            <button type="button" className="btn btn-secondary btn-sm" onClick={fetchCustomer}>
              Retry
            </button>
          }
        />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="card">
        <EmptyState
          title="Customer Not Found"
          description="The requested customer profile does not exist."
          action={
            <Link to="/customers" className="btn btn-secondary btn-sm">
              <ArrowLeft size={14} aria-hidden="true" />
              <span>Back to Customers</span>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="stack-lg">
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '0.875rem' }}>
          <Link to="/customers" className="btn btn-secondary btn-sm">
            <ArrowLeft size={14} aria-hidden="true" />
            <span>Customers</span>
          </Link>
          <span style={{ color: 'var(--text-muted)' }}>/</span>
          <span style={{ fontWeight: 600 }}>{customer.customer_name}</span>
        </div>

        <div className="header-actions">
          <Link
            to={`/ai-assistant?prompt=${encodeURIComponent(`Show sales summary for customer ${customer.customer_name}`)}`}
            className="btn btn-secondary btn-sm"
          >
            Ask AI
          </Link>

          {canManage && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setIsEditOpen(true)}
            >
              <Edit2 size={14} aria-hidden="true" />
              <span>Edit Customer</span>
            </button>
          )}
        </div>
      </div>

      <section className="card" aria-label="Customer overview">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{customer.customer_name}</h2>
            <Badge status={customer.status} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span className="detail-label">Code:</span>
            <button
              type="button"
              className="btn btn-secondary btn-sm tabular-nums"
              onClick={() => handleCopyCode(customer.customer_code)}
              aria-label={`Copy customer code ${customer.customer_code}`}
              title="Click to copy"
            >
              <span>{customer.customer_code}</span>
              {copiedCode ? (
                <Check size={12} style={{ color: 'var(--success)' }} aria-hidden="true" />
              ) : (
                <Copy size={12} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 'var(--space-4)',
            paddingTop: 'var(--space-4)',
            borderTop: '1px solid var(--border)',
          }}
        >
          <div>
            <div className="detail-label">Email</div>
            <a href={`mailto:${customer.email}`} className="table-link" style={{ fontSize: '0.875rem' }}>
              {customer.email}
            </a>
          </div>

          <div>
            <div className="detail-label">Phone</div>
            <span className="tabular-nums" style={{ fontSize: '0.875rem' }}>{customer.phone || '-'}</span>
          </div>

          <div>
            <div className="detail-label">City</div>
            <span style={{ fontSize: '0.875rem' }}>{customer.city}</span>
          </div>

          <div>
            <div className="detail-label">Created</div>
            <span className="tabular-nums" style={{ fontSize: '0.875rem' }}>{formatDate(customer.created_at)}</span>
          </div>
        </div>
      </section>

      <div className="grid-cols-4">
        <StatCard
          title="Total Spent"
          value={formatCurrency(customer.metrics?.total_revenue)}
        />
        <StatCard
          title="Total Orders"
          value={customer.metrics?.total_orders || 0}
        />
        <StatCard
          title="Average Order"
          value={formatCurrency(customer.metrics?.avg_order_value)}
        />
        <StatCard
          title="Last Order Date"
          value={formatDate(customer.metrics?.last_order_date)}
        />
      </div>

      <section className="card card-flush" aria-label="Order History">
        <div className="card-header">
          <h3 className="section-heading" style={{ marginBottom: 0 }}>Order History</h3>
        </div>

        {customer.sales?.length > 0 ? (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Date</th>
                  <th className="num">Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {customer.sales.map((s) => (
                  <tr key={s.id}>
                    <td className="tabular-nums" style={{ fontWeight: 500, color: 'var(--accent-text)' }}>
                      #{s.id}
                    </td>
                    <td className="tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                      {formatDate(s.sale_date)}
                    </td>
                    <td className="num cell-primary">{formatCurrency(s.total_amount)}</td>
                    <td>
                      <Badge status={s.status || 'completed'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No orders recorded"
            description="No sales orders have been recorded for this customer yet."
          />
        )}
      </section>

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
