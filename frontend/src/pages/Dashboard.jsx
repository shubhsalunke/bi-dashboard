import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  ShoppingCart,
  Users,
  Award,
  Calendar,
  ArrowUpRight,
  RefreshCw,
  TrendingUp,
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

export const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const { showToast } = useToast();

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

  return (
    <div className="animate-fade-in">
      {/* Date Filter & Refresh Header */}
      <div className="page-header">
        <div>
          <h2>Business Performance Overview</h2>
          <p className="page-subtitle">Live overview of sales, revenue, and customer metrics</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
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
            <div className="stat-card">
              <div className="stat-header">
                <span className="stat-title">Total Revenue</span>
                <div className="stat-icon-wrapper" style={{ background: 'var(--info-bg)', color: 'var(--primary)' }}>
                  <DollarSign size={20} />
                </div>
              </div>
              <div className="stat-value">{formatCurrency(data.kpi?.total_revenue)}</div>
              <div className="stat-footer">
                <span style={{ color: 'var(--success)', fontWeight: 600 }}>Completed</span>
                <span>sales orders</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <span className="stat-title">Total Orders</span>
                <div className="stat-icon-wrapper" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
                  <ShoppingCart size={20} />
                </div>
              </div>
              <div className="stat-value">{data.kpi?.total_sales_count || 0}</div>
              <div className="stat-footer">
                <span>Avg. Order Value:</span>
                <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{formatCurrency(data.kpi?.average_order_value)}</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <span className="stat-title">Customer Accounts</span>
                <div className="stat-icon-wrapper" style={{ background: 'var(--info-bg)', color: 'var(--info)' }}>
                  <Users size={20} />
                </div>
              </div>
              <div className="stat-value">{data.kpi?.total_customers || 0}</div>
              <div className="stat-footer">
                <span style={{ color: 'var(--success)', fontWeight: 600 }}>{data.kpi?.active_customers || 0} active</span>
                <span>registered clients</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <span className="stat-title">Catalog Offerings</span>
                <div className="stat-icon-wrapper" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>
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
                      <div style={{ fontWeight: 600 }}>{c.customer_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{c.customer_code}</div>
                    </td>
                    <td>{c.city}</td>
                    <td>{c.orders_count}</td>
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
                {data?.topProducts?.map((p) => (
                  <tr key={p.product_id}>
                    <td style={{ fontWeight: 600 }}>{p.product_name}</td>
                    <td><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.category}</span></td>
                    <td>{p.units_sold}</td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{formatCurrency(p.total_revenue)}</td>
                  </tr>
                ))}
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
                      <div>{s.customer_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{s.city}</div>
                    </td>
                    <td>{s.sale_date}</td>
                    <td style={{ fontWeight: 700 }}>{formatCurrency(s.total_amount)}</td>
                    <td><Badge status={s.status} /></td>
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
