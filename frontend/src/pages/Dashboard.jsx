import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  DollarSign,
  ShoppingCart,
  Users,
  Award,
  Calendar,
  ArrowUpRight,
  RefreshCw,
  TrendingUp,
  ShieldCheck,
  Zap,
  Sparkles,
  Bot,
  PlusCircle,
  ArrowRight,
  Activity,
  UserCheck,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { dashboardApi } from '../api/dashboard.api';
import { CardSkeleton } from '../components/common/LoadingSkeleton';
import { Badge } from '../components/common/Badge';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export const Dashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [analystQuestion, setAnalystQuestion] = useState('');
  const { showToast } = useToast();
  const { user, isAdmin, isManager, isAnalyst } = useAuth();


  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const summary = await dashboardApi.getSummary({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setData(summary);
    } catch (err) {
      showToast(err.message || 'Failed to load dashboard summary', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [startDate, endDate]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const formatDate = (val) => {
    if (!val) return '—';
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return val;
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return val;
    }
  };

  const getInitials = (name) => {
    if (!name) return 'CU';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const setPresetRange = (days) => {
    if (!days) {
      setStartDate('');
      setEndDate('');
      return;
    }
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  return (
    <div className="animate-fade-in">
      {/* Date Filter & Refresh Header */}
      <div className="page-header">
        <div>
          <h2>Business Performance Overview</h2>
          <p className="page-subtitle">
            {isAdmin && 'Superadmin Console: Enterprise sales, user access, and system telemetry'}
            {isManager && 'Operations Lead: Active transactions, pipeline conversions, and inventory'}
            {!isAdmin && !isManager && 'Analyst Workspace: Sales metrics, revenue distribution, and AI query engine'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Quick Preset Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg-card)', padding: '3px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <button
              type="button"
              className={`btn btn-sm ${!startDate && !endDate ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '3px 9px', fontSize: '0.75rem' }}
              onClick={() => setPresetRange(null)}
            >
              All
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ padding: '3px 9px', fontSize: '0.75rem' }}
              onClick={() => setPresetRange(30)}
            >
              30D
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ padding: '3px 9px', fontSize: '0.75rem' }}
              onClick={() => setPresetRange(90)}
            >
              90D
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-card)', padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <Calendar size={16} color="var(--text-muted)" />
            <input
              type="date"
              className="form-control"
              style={{ width: '135px', padding: '4px 8px', fontSize: '0.8rem' }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>to</span>
            <input
              type="date"
              className="form-control"
              style={{ width: '135px', padding: '4px 8px', fontSize: '0.8rem' }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            {(startDate || endDate) && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => { setStartDate(''); setEndDate(''); }}
                style={{ padding: '4px 8px', fontSize: '0.75rem' }}
              >
                Clear
              </button>
            )}
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={fetchDashboard}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Role Personalized Command Hub */}
      {isAdmin && (
        <>
          <div className="role-hub-banner role-hub-admin">
            <div className="role-hub-content">
              <div className="role-hub-icon-wrapper">
                <ShieldCheck size={26} />
              </div>
              <div>
                <div className="role-hub-title">
                  <span>Executive Governance & Administration Console</span>
                  <span className="role-hub-badge">Superadmin Control</span>
                </div>
                <p className="role-hub-desc">
                  Full operational authority active across RBAC accounts, audit logs, and system data infrastructure.
                </p>
              </div>
            </div>
            <div className="role-hub-actions">
              <Link to="/users" className="role-action-btn primary-btn">
                <UserCheck size={15} />
                <span>Manage Staff & Access</span>
              </Link>
              <Link to="/ai-assistant" className="role-action-btn">
                <Bot size={15} />
                <span>AI Executive Copilot</span>
              </Link>
              <Link to="/products" className="role-action-btn">
                <Award size={15} />
                <span>Catalog Offerings</span>
              </Link>
            </div>
          </div>

          <div className="role-feature-panel">
            <div className="role-panel-header">
              <div className="role-panel-title">
                <ShieldCheck size={20} color="#8b5cf6" />
                <span>Security Governance & RBAC Control Center</span>
              </div>
              <Link to="/users" className="role-action-btn primary-btn">
                <UserCheck size={14} />
                <span>Open User Management</span>
              </Link>
            </div>
            <div className="grid-cols-3">
              <div className="role-mini-card">
                <span className="role-mini-card-title">Staff Provisioning</span>
                <span className="role-mini-card-val">3 Provisioned Roles</span>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Admin (Root) • Manager (Orders/CRM) • Analyst (Read-Only)
                </p>
              </div>
              <div className="role-mini-card">
                <span className="role-mini-card-title">Security & Destructive Operations</span>
                <span className="role-mini-card-val" style={{ color: '#059669' }}>Protected</span>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Customer and product deletions strictly restricted to Administrators.
                </p>
              </div>
              <div className="role-mini-card">
                <span className="role-mini-card-title">Database & Engine Health</span>
                <span className="role-mini-card-val" style={{ color: 'var(--primary)' }}>Enterprise Data Engine</span>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Cloud Database Cluster Online • Port 5432 Healthy
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {isManager && (
        <>
          <div className="role-hub-banner role-hub-manager">
            <div className="role-hub-content">
              <div className="role-hub-icon-wrapper">
                <Zap size={26} />
              </div>
              <div>
                <div className="role-hub-title">
                  <span>Sales & Operations Command Center</span>
                  <span className="role-hub-badge">Operations Lead</span>
                </div>
                <p className="role-hub-desc">
                  Track sales velocity, customer accounts, and record real-time sales transactions.
                </p>
              </div>
            </div>
            <div className="role-hub-actions">
              <Link to="/sales" className="role-action-btn primary-btn">
                <PlusCircle size={15} />
                <span>Record New Sale</span>
              </Link>
              <Link to="/customers" className="role-action-btn">
                <Users size={15} />
                <span>Client Accounts</span>
              </Link>
              <Link to="/products" className="role-action-btn">
                <Award size={15} />
                <span>Manage Products</span>
              </Link>
            </div>
          </div>

          <div className="role-feature-panel">
            <div className="role-panel-header">
              <div className="role-panel-title">
                <Zap size={20} color="#2563eb" />
                <span>Sales Operations & Client Fulfillment Radar</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Link to="/sales" className="role-action-btn primary-btn">
                  <PlusCircle size={14} />
                  <span>+ Record New Sale</span>
                </Link>
                <Link to="/customers" className="role-action-btn">
                  <Users size={14} />
                  <span>+ Add Client</span>
                </Link>
              </div>
            </div>
            <div className="grid-cols-3">
              <div className="role-mini-card">
                <span className="role-mini-card-title">Order Fulfillment Rate</span>
                <span className="role-mini-card-val" style={{ color: 'var(--success)' }}>100% Completed</span>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {data?.kpi?.total_sales_count || 0} customer orders successfully processed
                </p>
              </div>
              <div className="role-mini-card">
                <span className="role-mini-card-title">Active Account Retention</span>
                <span className="role-mini-card-val" style={{ color: 'var(--primary)' }}>
                  {data?.kpi?.active_customers || 0} / {data?.kpi?.total_customers || 0} Clients
                </span>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Active corporate accounts in current billing cycle
                </p>
              </div>
              <div className="role-mini-card">
                <span className="role-mini-card-title">Catalog Inventory</span>
                <span className="role-mini-card-val">{data?.kpi?.active_products || 0} Offerings</span>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Enterprise items available for immediate sales quoting
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {(!isAdmin && !isManager) && (
        <>
          <div className="role-hub-banner role-hub-analyst">
            <div className="role-hub-content">
              <div className="role-hub-icon-wrapper">
                <Sparkles size={26} />
              </div>
              <div>
                <div className="role-hub-title">
                  <span>Business Intelligence & Analytics Hub</span>
                  <span className="role-hub-badge">Data Analyst (Read-Only)</span>
                </div>
                <p className="role-hub-desc">
                  Explore sales telemetry, examine revenue distributions, and query the AI Copilot for predictive insights.
                </p>
              </div>
            </div>
            <div className="role-hub-actions">
              <Link to="/ai-assistant" className="role-action-btn primary-btn">
                <Sparkles size={15} />
                <span>Ask AI Assistant</span>
              </Link>
              <Link to="/sales" className="role-action-btn">
                <TrendingUp size={15} />
                <span>Sales Ledger</span>
              </Link>
              <Link to="/customers" className="role-action-btn">
                <Users size={15} />
                <span>Customer Cohorts</span>
              </Link>
            </div>
          </div>

          <div className="role-feature-panel">
            <div className="role-panel-header">
              <div className="role-panel-title">
                <Sparkles size={20} color="#10b981" />
                <span>Interactive AI Copilot & Query Studio</span>
              </div>
              <Link to="/ai-assistant" className="role-action-btn primary-btn">
                <Bot size={14} />
                <span>Open Copilot Studio</span>
              </Link>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (analystQuestion.trim()) {
                  navigate(`/ai-assistant?prompt=${encodeURIComponent(analystQuestion.trim())}`);
                }
              }}
              className="role-prompt-search"
            >
              <input
                type="text"
                className="role-prompt-input"
                placeholder="Ask AI Copilot: e.g. What were total sales last month? Show top 10 customers..."
                value={analystQuestion}
                onChange={(e) => setAnalystQuestion(e.target.value)}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.875rem' }}>
                <Sparkles size={14} />
                <span>Query Copilot</span>
              </button>
            </form>

            <div className="grid-cols-4">
              <Link to="/ai-assistant?prompt=What%20were%20total%20sales%20last%20month%3F" className="query-deck-card">
                <div className="query-deck-header">
                  <span className="query-deck-badge">Monthly Revenue</span>
                  <DollarSign size={15} color="var(--primary)" />
                </div>
                <div className="query-deck-text">What were total sales last month?</div>
                <div className="query-deck-action">
                  <span>Run Query</span>
                  <ArrowRight size={12} />
                </div>
              </Link>

              <Link to="/ai-assistant?prompt=Show%20the%20top%2010%20customers%20by%20sales." className="query-deck-card">
                <div className="query-deck-header">
                  <span className="query-deck-badge">Client Ranking</span>
                  <Users size={15} color="#059669" />
                </div>
                <div className="query-deck-text">Show top 10 customers by sales</div>
                <div className="query-deck-action">
                  <span>Run Query</span>
                  <ArrowRight size={12} />
                </div>
              </Link>

              <Link to="/ai-assistant?prompt=Which%20product%20generated%20the%20highest%20revenue%3F" className="query-deck-card">
                <div className="query-deck-header">
                  <span className="query-deck-badge">Product Margin</span>
                  <Award size={15} color="#7c3aed" />
                </div>
                <div className="query-deck-text">Highest revenue product in catalog?</div>
                <div className="query-deck-action">
                  <span>Run Query</span>
                  <ArrowRight size={12} />
                </div>
              </Link>

              <Link to="/ai-assistant?prompt=Compare%20this%20month%20with%20the%20previous%20month." className="query-deck-card">
                <div className="query-deck-header">
                  <span className="query-deck-badge">Trend Comparison</span>
                  <TrendingUp size={15} color="#0284c7" />
                </div>
                <div className="query-deck-text">Compare this month with previous month</div>
                <div className="query-deck-action">
                  <span>Run Query</span>
                  <ArrowRight size={12} />
                </div>
              </Link>
            </div>
          </div>
        </>
      )}

      {/* KPI Cards */}
      <div className="grid-cols-4" style={{ marginBottom: '24px' }}>
        {loading || !data ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            <div className="stat-card stat-card-revenue">
              <div className="stat-header">
                <span className="stat-title">Total Revenue</span>
                <div className="stat-icon-wrapper" style={{ background: '#eff6ff', color: 'var(--primary)', borderColor: '#bfdbfe' }}>
                  <DollarSign size={20} />
                </div>
              </div>
              <div className="stat-value">{formatCurrency(data.kpi?.total_revenue)}</div>
              <div className="stat-footer">
                <span style={{ color: 'var(--success)', fontWeight: 600 }}>Completed</span>
                <span>sales orders</span>
              </div>
            </div>

            <div className="stat-card stat-card-orders">
              <div className="stat-header">
                <span className="stat-title">Total Orders</span>
                <div className="stat-icon-wrapper" style={{ background: '#ecfdf5', color: '#059669', borderColor: '#a7f3d0' }}>
                  <ShoppingCart size={20} />
                </div>
              </div>
              <div className="stat-value">{data.kpi?.total_sales_count || 0}</div>
              <div className="stat-footer">
                <span>Avg. Order Value:</span>
                <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{formatCurrency(data.kpi?.average_order_value)}</span>
              </div>
            </div>

            <div className="stat-card stat-card-customers">
              <div className="stat-header">
                <span className="stat-title">Customer Accounts</span>
                <div className="stat-icon-wrapper" style={{ background: '#e0f2fe', color: '#0284c7', borderColor: '#bae6fd' }}>
                  <Users size={20} />
                </div>
              </div>
              <div className="stat-value">{data.kpi?.total_customers || 0}</div>
              <div className="stat-footer">
                <span style={{ color: 'var(--success)', fontWeight: 600 }}>{data.kpi?.active_customers || 0} active</span>
                <span>registered clients</span>
              </div>
            </div>

            <div className="stat-card stat-card-offerings">
              <div className="stat-header">
                <span className="stat-title">Catalog Offerings</span>
                <div className="stat-icon-wrapper" style={{ background: '#fffbeb', color: '#d97706', borderColor: '#fde68a' }}>
                  <Award size={20} />
                </div>
              </div>
              <div className="stat-value">{data.kpi?.active_products || 0}</div>
              <div className="stat-footer">
                <span>Active products in catalog</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Chart & Top Customers Row */}
      <div className="grid-cols-2" style={{ marginBottom: '24px' }}>
        {/* Monthly Revenue Chart */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Monthly Revenue Trend</h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Monthly sales revenue over time</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: 'var(--primary)', fontWeight: 600 }}>
              <TrendingUp size={16} />
              <span>Revenue Growth</span>
            </div>
          </div>

          <div style={{ width: '100%', height: 280 }}>
            {loading || !data ? (
              <div className="skeleton" style={{ width: '100%', height: '100%' }} />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.monthlySales || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis dataKey="month" stroke="var(--chart-axis)" fontSize={12} tickLine={false} />
                  <YAxis
                    stroke="var(--chart-axis)"
                    fontSize={12}
                    tickLine={false}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      color: 'var(--text-main)',
                      boxShadow: 'var(--shadow-md)',
                    }}
                    formatter={(val) => [formatCurrency(val), 'Revenue']}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#revenueGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top 5 Customers by Sales */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '4px' }}>Top Client Accounts</h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '16px' }}>Top customers by total purchases</p>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>City</th>
                  <th>Orders</th>
                  <th>Total Spent</th>
                </tr>
              </thead>
              <tbody>
                {data?.topCustomers?.map((c) => (
                  <tr key={c.customer_id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="avatar-badge">{getInitials(c.customer_name)}</div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{c.customer_name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{c.customer_code}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{c.city}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{c.orders_count} orders</span>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(c.total_spent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Top Products & Recent Sales Row */}
      <div className="grid-cols-2">
        {/* Top Products */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '4px' }}>Top Revenue Products</h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '16px' }}>Best selling products by revenue</p>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Units</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data?.topProducts?.map((p) => {
                  const catClass = p.category?.includes('AI')
                    ? 'category-ai'
                    : p.category?.includes('Cloud')
                    ? 'category-cloud'
                    : 'category-services';
                  return (
                    <tr key={p.product_id}>
                      <td style={{ fontWeight: 600 }}>{p.product_name}</td>
                      <td>
                        <span className={`category-pill ${catClass}`}>{p.category}</span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{p.units_sold}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginLeft: '4px' }}>units</span>
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{formatCurrency(p.total_revenue)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Completed Sales */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '4px' }}>Recent Sales Activity</h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '16px' }}>Latest sales orders in system</p>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Sale ID</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data?.recentSales?.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600, color: 'var(--primary)' }}>#{s.id}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{s.customer_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{s.city}</div>
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {formatDate(s.sale_date)}
                    </td>
                    <td style={{ fontWeight: 700 }}>{formatCurrency(s.total_amount)}</td>
                    <td>
                      <span className="status-pill status-completed">
                        <span className="status-pulse-dot" />
                        <span>Completed</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
