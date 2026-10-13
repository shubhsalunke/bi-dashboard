import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
  Copy,
  Check,
  Plus,
  Bot,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { customersApi } from '../api/customers.api';
import { CustomerFormModal } from './CustomerFormModal';
import { Badge } from '../components/common/Badge';
import { CardSkeleton } from '../components/common/LoadingSkeleton';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const CustomerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

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
      maximumFractionDigits: 2,
    }).format(val || 0);
  };

  const formatDate = (val) => {
    if (!val) return '—';
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return val.split('T')[0] || val;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return val;
    }
  };

  const getInitials = (name) => {
    if (!name) return 'C';
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

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
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <CardSkeleton />
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

  const totalRev = Number(customer.metrics?.total_revenue) || 0;
  const totalOrders = Number(customer.metrics?.total_orders) || 0;

  // Account tier classification
  const tierInfo =
    totalRev >= 100000
      ? { label: 'Tier 1 Enterprise Partner', color: '#7c3aed', bg: 'rgba(124, 58, 237, 0.1)', border: 'rgba(124, 58, 237, 0.25)' }
      : totalRev >= 25000
      ? { label: 'Tier 2 Growth Client', color: '#2563eb', bg: 'rgba(37, 99, 235, 0.1)', border: 'rgba(37, 99, 235, 0.25)' }
      : totalRev > 0
      ? { label: 'Commercial Partner', color: '#059669', bg: 'rgba(5, 150, 105, 0.1)', border: 'rgba(5, 150, 105, 0.25)' }
      : { label: 'New Commercial Prospect', color: '#d97706', bg: 'rgba(217, 119, 6, 0.1)', border: 'rgba(217, 119, 6, 0.25)' };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Top Breadcrumb & Action Strip */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem' }}>
          <Link
            to="/customers"
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 10px', fontSize: '0.75rem' }}
          >
            <ArrowLeft size={13} />
            <span>Customer Directory</span>
          </Link>
          <span style={{ color: 'var(--text-dim)' }}>/</span>
          <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{customer.customer_name}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <Link
            to={`/ai-assistant?prompt=${encodeURIComponent(`Show intelligence summary and sales history for customer ${customer.customer_name}`)}`}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', padding: '6px 12px' }}
          >
            <Sparkles size={14} color="var(--primary)" />
            <span>Ask AI Copilot</span>
          </Link>

          <Link
            to="/sales"
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', padding: '6px 12px' }}
          >
            <Plus size={14} />
            <span>New Order</span>
          </Link>

          {canManage && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setIsEditOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', padding: '6px 14px' }}
            >
              <Edit2 size={13} />
              <span>Edit Account</span>
            </button>
          )}
        </div>
      </div>

      {/* Customer Header Panel */}
      <div className="glass-panel" style={{ padding: '26px 28px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            {/* Elevated Gradient Avatar */}
            <div
              className="avatar-badge"
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                fontSize: '1.35rem',
                fontWeight: 800,
                boxShadow: '0 8px 16px rgba(37, 99, 235, 0.25)',
              }}
            >
              {getInitials(customer.customer_name)}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                  {customer.customer_name}
                </h2>
                <Badge status={customer.status} />
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-full)',
                    background: tierInfo.bg,
                    color: tierInfo.color,
                    border: `1px solid ${tierInfo.border}`,
                  }}
                >
                  {tierInfo.label}
                </span>
              </div>

              {/* Code Pill with 1-Click Copy */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Account Code:</span>
                <button
                  type="button"
                  onClick={() => handleCopyCode(customer.customer_code)}
                  style={{
                    background: 'rgba(37, 99, 235, 0.08)',
                    border: '1px solid rgba(37, 99, 235, 0.2)',
                    borderRadius: '5px',
                    padding: '2px 8px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: 'var(--primary)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                  title="Click to copy code"
                >
                  <span>{customer.customer_code}</span>
                  {copiedCode ? <Check size={11} color="#10b981" /> : <Copy size={11} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Metadata Bar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginTop: '22px',
            paddingTop: '20px',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'var(--bg-main)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Mail size={15} color="var(--primary)" />
            </div>
            <div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Contact Email</div>
              <a href={`mailto:${customer.email}`} style={{ fontSize: '0.875rem', color: 'var(--text-main)', fontWeight: 500, textDecoration: 'none' }}>
                {customer.email}
              </a>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'var(--bg-main)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Phone size={15} color="var(--primary)" />
            </div>
            <div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Phone Number</div>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-main)', fontWeight: 500 }}>
                {customer.phone || 'No phone recorded'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'var(--bg-main)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MapPin size={15} color="var(--primary)" />
            </div>
            <div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Regional Hub</div>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-main)', fontWeight: 500 }}>
                {customer.city}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'var(--bg-main)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={15} color="var(--primary)" />
            </div>
            <div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Member Since</div>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-main)', fontWeight: 500 }}>
                {formatDate(customer.created_at)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Lifetime Metrics KPI Cards */}
      <div className="grid-cols-4" style={{ gap: '16px' }}>
        {/* Lifetime Revenue */}
        <div className="stat-card stat-card-revenue">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span className="stat-title">LIFETIME REVENUE</span>
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
              <DollarSign size={16} />
            </div>
          </div>
          <div className="stat-value">{formatCurrency(customer.metrics?.total_revenue)}</div>
          <div className="stat-footer">Total verified money spent</div>
        </div>

        {/* Total Orders */}
        <div className="stat-card stat-card-orders">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span className="stat-title">TOTAL ORDERS</span>
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
              <ShoppingCart size={16} />
            </div>
          </div>
          <div className="stat-value">{totalOrders}</div>
          <div className="stat-footer">Completed sales transactions</div>
        </div>

        {/* Average Order Value */}
        <div className="stat-card stat-card-customers">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span className="stat-title">AVERAGE ORDER VALUE</span>
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
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="stat-value">{formatCurrency(customer.metrics?.average_order_value)}</div>
          <div className="stat-footer">Average per order ticket</div>
        </div>

        {/* Last Activity Date */}
        <div className="stat-card stat-card-offerings">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span className="stat-title">LAST ACTIVITY DATE</span>
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
              <Calendar size={16} />
            </div>
          </div>
          <div className="stat-value" style={{ fontSize: '1.25rem' }}>
            {customer.metrics?.last_order_date ? formatDate(customer.metrics.last_order_date) : 'No orders yet'}
          </div>
          <div className="stat-footer">Last verified purchase date</div>
        </div>
      </div>

      {/* Two-Column Lower Workspace */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        {/* Recent Orders Section */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
              Recent Orders
            </h3>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
              {customer.recentSales?.length || 0} Records
            </span>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Latest purchase history for {customer.customer_name}
          </p>

          <div className="table-responsive" style={{ flex: 1 }}>
            {customer.recentSales && customer.recentSales.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ORDER ID</th>
                    <th>SALE DATE</th>
                    <th style={{ textAlign: 'right' }}>TOTAL AMOUNT</th>
                    <th style={{ textAlign: 'center' }}>STATUS</th>
                    <th>CREATED AT</th>
                  </tr>
                </thead>
                <tbody>
                  {customer.recentSales.map((sale) => (
                    <tr key={sale.id}>
                      <td>
                        <span
                          style={{
                            fontWeight: 600,
                            color: 'var(--primary)',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.8125rem',
                          }}
                        >
                          #{sale.id}
                        </span>
                      </td>
                      <td>{formatDate(sale.sale_date)}</td>
                      <td style={{ fontWeight: 700, color: 'var(--success)', textAlign: 'right' }}>
                        {formatCurrency(sale.total_amount)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <Badge status={sale.status} />
                      </td>
                      <td style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                        {formatDate(sale.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              /* High-Aesthetic Empty Orders Canvas */
              <div
                style={{
                  padding: '36px 20px',
                  textAlign: 'center',
                  background: 'var(--bg-main)',
                  borderRadius: '12px',
                  border: '1px dashed var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: 'rgba(37, 99, 235, 0.08)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ShoppingCart size={22} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    No purchase history found for this account.
                  </h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)', maxWidth: '380px' }}>
                    {customer.customer_name} is active in your CRM and ready for their initial commercial deal.
                  </p>
                </div>
                <Link
                  to="/sales"
                  className="btn btn-primary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', padding: '7px 14px' }}
                >
                  <Plus size={14} />
                  <span>Create First Order</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Account Intelligence & Copilot Insights */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} color="#10b981" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                Account Intelligence
              </h3>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Governance and relationship profile
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.8125rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-main)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-muted)' }}>KYC Verification:</span>
              <span style={{ fontWeight: 600, color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={13} />
                <span>Verified</span>
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-main)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Assigned Market:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{customer.city} Region</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-main)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Financial Ledger:</span>
              <span style={{ fontWeight: 600, color: 'var(--primary)' }}>Audit Compliant</span>
            </div>
          </div>

          {/* AI Quick Query Card */}
          <div
            style={{
              marginTop: 'auto',
              padding: '16px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.06) 0%, rgba(124, 58, 237, 0.06) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bot size={16} color="var(--primary)" />
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Smart BI Copilot Prompt
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              Query AI to analyze deal history, lifetime value projection, or purchase trends for this account.
            </p>
            <Link
              to={`/ai-assistant?prompt=${encodeURIComponent(`Analyze purchasing trend and revenue history for ${customer.customer_name}`)}`}
              className="btn btn-secondary btn-sm"
              style={{
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 12px',
                background: 'var(--bg-card)',
              }}
            >
              <span>Analyze with AI</span>
              <ArrowRight size={13} color="var(--primary)" />
            </Link>
          </div>
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
