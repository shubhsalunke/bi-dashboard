import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { dashboardApi } from '../api/dashboard.api';
import { StatCard } from '../components/common/StatCard';
import { CardSkeleton } from '../components/common/LoadingSkeleton';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatCompactCurrency, formatDate } from '../utils/format';

export const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  const { showToast } = useToast();

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const summary = await dashboardApi.getSummary({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setData(summary);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      showToast(err.message || 'Failed to load dashboard summary', 'error');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, showToast]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const setPreset = (days) => {
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

  // Compute comparison numbers from existing monthly sales data
  const { revenueComparison, ordersComparison } = useMemo(() => {
    const list = data?.monthlySales;
    if (!list || list.length < 2) {
      return { revenueComparison: null, ordersComparison: null };
    }
    const curr = list[list.length - 1];
    const prev = list[list.length - 2];
    const currRev = parseFloat(curr.revenue) || 0;
    const prevRev = parseFloat(prev.revenue) || 0;
    const currOrders = parseInt(curr.sales_count, 10) || 0;
    const prevOrders = parseInt(prev.sales_count, 10) || 0;

    let revComp = null;
    if (prevRev > 0) {
      const diff = ((currRev - prevRev) / prevRev) * 100;
      revComp = {
        text: `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}% vs last month`,
        isPositive: diff >= 0,
      };
    }

    let ordersComp = null;
    if (prevOrders > 0) {
      const diff = ((currOrders - prevOrders) / prevOrders) * 100;
      ordersComp = {
        text: `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}% vs last month`,
        isPositive: diff >= 0,
      };
    }

    return { revenueComparison: revComp, ordersComparison: ordersComp };
  }, [data]);

  // Highest revenue point in monthly timeline
  const maxRevenuePoint = useMemo(() => {
    const list = data?.monthlySales;
    if (!list || list.length === 0) return null;
    return list.reduce((max, cur) => (parseFloat(cur.revenue) > parseFloat(max.revenue) ? cur : max), list[0]);
  }, [data]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p className="page-subtitle">Overview of sales, orders, and customer activity</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {lastUpdated && (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginRight: '4px' }}>
              Last updated: {lastUpdated}
            </span>
          )}

          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              type="button"
              className={`btn btn-sm ${!startDate && !endDate ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setPreset(null)}
            >
              All Time
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setPreset(30)}
            >
              30 Days
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setPreset(90)}
            >
              90 Days
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input
              type="date"
              className="form-control"
              style={{ width: '130px', padding: '4px 8px', fontSize: '0.8rem' }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>to</span>
            <input
              type="date"
              className="form-control"
              style={{ width: '130px', padding: '4px 8px', fontSize: '0.8rem' }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={fetchDashboard}
            disabled={loading}
          >
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="grid-cols-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '20px' }}>
        {loading || !data ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title="Total Revenue"
              value={formatCurrency(data.kpi?.total_revenue)}
              comparison={revenueComparison}
              subtitle="Completed sales orders"
            />
            <StatCard
              title="Total Orders"
              value={data.kpi?.total_sales_count || 0}
              comparison={ordersComparison}
              subtitle={`Avg: ${formatCurrency(data.kpi?.average_order_value)}`}
            />
            <StatCard
              title="Customer Accounts"
              value={data.kpi?.total_customers || 0}
              subtitle={`${data.kpi?.active_customers || 0} active clients`}
            />
            <StatCard
              title="Catalog Offerings"
              value={data.kpi?.active_products || 0}
              subtitle="Active offerings"
            />
            <Link to="/products?stock_status=low" style={{ textDecoration: 'none', color: 'inherit' }}>
              <StatCard
                title="Low stock products"
                value={data.kpi?.low_stock_products ?? 0}
                subtitle="At or below reorder level"
              />
            </Link>
          </>
        )}
      </div>

      <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '2px' }}>Monthly Revenue</h3>

        {/* Dynamic sentence derived from chart data */}
        {maxRevenuePoint && (
          <p className="chart-insight-sentence">
            Highest sales in {maxRevenuePoint.month}: <span className="chart-insight-highlight">{formatCompactCurrency(maxRevenuePoint.revenue)}</span>
          </p>
        )}

        <div style={{ width: '100%', height: 260 }}>
          {loading || !data ? (
            <div className="skeleton" style={{ width: '100%', height: '100%' }} />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.monthlySales || []} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey="month" stroke="var(--chart-axis)" fontSize={12} tickLine={false} />
                <YAxis
                  stroke="var(--chart-axis)"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(v) => formatCompactCurrency(v)}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '4px',
                    color: 'var(--text-main)',
                  }}
                  formatter={(val) => [formatCurrency(val), 'Revenue']}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--text-dim)"
                  strokeWidth={2}
                  dot={(props) => {
                    const isMax = props.payload.month === maxRevenuePoint?.month;
                    return (
                      <circle
                        key={props.key || props.index}
                        cx={props.cx}
                        cy={props.cy}
                        r={isMax ? 5 : 3}
                        fill={isMax ? 'var(--primary)' : 'var(--text-dim)'}
                        stroke={isMax ? 'var(--primary)' : 'var(--text-dim)'}
                      />
                    );
                  }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid-cols-2" style={{ marginBottom: '20px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '4px' }}>Top Products</h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
            Products by sales revenue
          </p>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Units</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data?.topProducts?.map((p) => (
                  <tr key={p.product_id}>
                    <td style={{ fontWeight: 500 }}>{p.product_name}</td>
                    <td>{p.category}</td>
                    <td className="tabular-nums">{p.units_sold}</td>
                    <td style={{ fontWeight: 600 }} className="tabular-nums">
                      {formatCurrency(p.total_revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '4px' }}>Top Client Accounts</h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
            Customers by total spent
          </p>

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
                      <div style={{ fontWeight: 500 }}>{c.customer_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{c.customer_code}</div>
                    </td>
                    <td>{c.city}</td>
                    <td className="tabular-nums">{c.orders_count}</td>
                    <td style={{ fontWeight: 600 }} className="tabular-nums">
                      {formatCurrency(c.total_spent)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '4px' }}>Recent Sales Activity</h3>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
          Latest orders placed in the system
        </p>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data?.recentSales?.map((s) => (
                <tr key={s.id}>
                  <td>#{s.id}</td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{s.customer_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{s.city}</div>
                  </td>
                  <td>{formatDate(s.sale_date)}</td>
                  <td style={{ fontWeight: 600 }} className="tabular-nums">
                    {formatCurrency(s.total_amount)}
                  </td>
                  <td>
                    <span className="badge badge-active">{s.status || 'Completed'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
