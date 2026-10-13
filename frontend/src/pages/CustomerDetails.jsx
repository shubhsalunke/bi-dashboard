import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Edit2,
} from 'lucide-react';
import { customersApi } from '../api/customers.api';
import { CustomerFormModal } from './CustomerFormModal';
import { Badge } from '../components/common/Badge';
import { CardSkeleton } from '../components/common/LoadingSkeleton';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const CustomerDetails = () => {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const { canManage } = useAuth();
  const { showToast } = useToast();

  const fetchCustomer = async () => {
    setLoading(true);
    try {
      const data = await customersApi.getCustomerById(id);
      setCustomer(data);
    } catch (err) {
      showToast(err.message || 'Failed to load customer profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomer();
  }, [id]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(val || 0);
  };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="glass-panel" style={{ padding: '48px', textAlign: 'center' }}>
        <h2>Customer Not Found</h2>
        <p style={{ color: 'var(--text-muted)', margin: '12px 0 24px' }}>
          The requested customer profile does not exist or has been removed.
        </p>
        <Link to="/customers" className="btn btn-secondary">
          <ArrowLeft size={16} /> Back to Directory
        </Link>
      </div>
    );
  }

  const getInitials = (name) => {
    if (!name) return 'C';
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
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
      {/* Breadcrumb Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '0.875rem' }}>
        <Link to="/customers" style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ArrowLeft size={14} />
          <span>Customers</span>
        </Link>
        <span style={{ color: 'var(--text-dim)' }}>/</span>
        <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{customer.customer_name}</span>
      </div>

      {/* Customer Header Panel */}
      <div className="glass-panel" style={{ padding: '28px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '12px',
              background: 'var(--info-bg)',
              border: '1px solid var(--info-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)',
              fontWeight: 800,
              fontSize: '1.25rem',
              letterSpacing: '-0.02em',
            }}>
              {getInitials(customer.customer_name)}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{customer.customer_name}</h2>
                <Badge status={customer.status} />
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                Account Code: <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{customer.customer_code}</span>
              </div>
            </div>
          </div>

          {canManage && (
            <button className="btn btn-secondary btn-sm" onClick={() => setIsEditOpen(true)}>
              <Edit2 size={14} />
              <span>Edit Account</span>
            </button>
          )}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginTop: '24px',
          paddingTop: '20px',
          borderTop: '1px solid var(--border-subtle)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)' }}>
            <Mail size={16} color="var(--primary)" />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-main)' }}>{customer.email}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)' }}>
            <Phone size={16} color="var(--primary)" />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-main)' }}>{customer.phone || 'No phone recorded'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)' }}>
            <MapPin size={16} color="var(--primary)" />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-main)' }}>{customer.city}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)' }}>
            <Calendar size={16} color="var(--primary)" />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-main)' }}>
              Joined {formatDate(customer.created_at)}
            </span>
          </div>
        </div>
      </div>

      {/* Lifetime Metrics KPI Cards */}
      <div className="grid-cols-4" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Lifetime Revenue</span>
            <div className="stat-icon-wrapper" style={{ background: 'var(--info-bg)', color: 'var(--primary)' }}>
              <DollarSign size={20} />
            </div>
          </div>
          <div className="stat-value">{formatCurrency(customer.metrics?.total_revenue)}</div>
          <div className="stat-footer">Total money spent</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Total Orders</span>
            <div className="stat-icon-wrapper" style={{ color: 'var(--success)', background: 'var(--success-bg)' }}>
              <ShoppingCart size={20} />
            </div>
          </div>
          <div className="stat-value">{customer.metrics?.total_orders || 0}</div>
          <div className="stat-footer">Completed orders</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Average Order Value</span>
            <div className="stat-icon-wrapper" style={{ color: 'var(--info)', background: 'var(--info-bg)' }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="stat-value">{formatCurrency(customer.metrics?.average_order_value)}</div>
          <div className="stat-footer">Average per order</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Last Activity Date</span>
            <div className="stat-icon-wrapper" style={{ color: 'var(--warning)', background: 'var(--warning-bg)' }}>
              <Calendar size={20} />
            </div>
          </div>
          <div className="stat-value" style={{ fontSize: '1.4rem' }}>
            {formatDate(customer.metrics?.last_order_date)}
          </div>
          <div className="stat-footer">Last purchase date</div>
        </div>
      </div>

      {/* Recent Sales History */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '4px' }}>Recent Orders</h3>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Latest purchase history for {customer.customer_name}
        </p>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Sale Date</th>
                <th>Total Amount</th>
                <th>Status</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {customer.recentSales?.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    No purchase history found for this account.
                  </td>
                </tr>
              ) : (
                customer.recentSales?.map((sale) => (
                  <tr key={sale.id}>
                    <td style={{ fontWeight: 600, color: 'var(--primary)' }}>#{sale.id}</td>
                    <td>{formatDate(sale.sale_date)}</td>
                    <td style={{ fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(sale.total_amount)}</td>
                    <td><Badge status={sale.status} /></td>
                    <td style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                      {formatDate(sale.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Customer Modal */}
      <CustomerFormModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        customer={customer}
        onSaved={fetchCustomer}
      />
    </div>
  );
};

export default CustomerDetails;
