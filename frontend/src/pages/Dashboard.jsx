import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, AlertCircle } from 'lucide-react';
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
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { CardSkeleton, TableSkeleton } from '../components/common/LoadingSkeleton';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatCompactCurrency, formatDate } from '../utils/format';

export const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activePreset, setActivePreset] = useState('all');
  const [lastUpdated, setLastUpdated] = useState('');
  const { showToast } = useToast();

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const summary = await dashboardApi.getSummary({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setData(summary);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      const msg = err.message || 'Failed to load dashboard summary';
      setError(msg);
      showToast(msg, 'error');
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
      setActivePreset('all');
      return;
    }
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
    setActivePreset(String(days));
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

  const monthlyChartData = useMemo(() => {
    return (data?.monthlySales || []).map((m) => ({
      ...m,
      revenueNum: parseFloat(m.revenue) || 0,
    }));
  }, [data]);

  // Highest revenue point in monthly timeline
  const maxRevenuePoint = useMemo(() => {
    if (!monthlyChartData || monthlyChartData.length === 0) return null;
    return monthlyChartData.reduce(
      (max, cur) => (cur.revenueNum > max.revenueNum ? cur : max),
      monthlyChartData[0]
    );
  }, [monthlyChartData]);

  return (
    <div className="stack-lg">
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h2>Dashboard</h2>
          <p className="page-subtitle">Overview of sales, orders, and customer activity</p>
        </div>

        <div className="header-actions">
          {lastUpdated && (
            <span className="cell-secondary tabular-nums" style={{ marginRight: 'var(--space-1)' }}>
              Last updated: {lastUpdated}
            </span>
          )}

          <div className="segmented-group" role="group" aria-label="Date range presets">
            <button
              type="button"
              className={`segmented-btn ${activePreset === 'all' ? 'active' : ''}`}
              onClick={() => setPreset(null)}
            >
              All Time
            </button>
            <button
              type="button"
              className={`segmented-btn ${activePreset === '30' ? 'active' : ''}`}
              onClick={() => setPreset(30)}
            >
              30 Days
            </button>
            <button
              type="button"
              className={`segmented-btn ${activePreset === '90' ? 'active' : ''}`}
              onClick={() => setPreset(90)}
            >
              90 Days
            </button>
          </div>

          <div className="date-range-group">
            <input
              type="date"
              aria-label="Start date"
              className="form-control form-control-sm"
              style={{ width: '132px' }}
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setActivePreset('custom');
              }}
            />
            <span className="date-range-sep">to</span>
            <input
              type="date"
              aria-label="End date"
              className="form-control form-control-sm"
              style={{ width: '132px' }}
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setActivePreset('custom');
              }}
            />
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={fetchDashboard}
            disabled={loading}
          >
            <RefreshCw size={14} aria-hidden="true" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {!loading && error && !data ? (
        <div className="card">
          <EmptyState
            icon={AlertCircle}
            title="Unable to load dashboard"
            description={error}
            action={
              <button type="button" className="btn btn-secondary btn-sm" onClick={fetchDashboard}>
                Retry
              </button>
            }
          />
        </div>
      ) : (
        <>
          <div className="stats-grid" style={{ marginBottom: 0 }}>
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
            <Link to="/products?stock_status=low" className="stat-card-link">
              <StatCard
                title="Low stock products"
                value={data.kpi?.low_stock_products ?? 0}
                subtitle="At or below reorder level"
              />
            </Link>
          </>
        )}
      </div>

      <section className="card" aria-label="Monthly Revenue">
        <h3 className="section-heading">Monthly Revenue</h3>

        {maxRevenuePoint ? (
          <p className="chart-insight-sentence">
            Highest sales in {maxRevenuePoint.month}:{' '}
            <span className="chart-insight-highlight">{formatCompactCurrency(maxRevenuePoint.revenueNum)}</span>
          </p>
        ) : (
          <p className="section-subheading">Revenue trajectory over time</p>
        )}

        <div className="chart-box">
          {loading || !data ? (
            <div className="skeleton" style={{ width: '100%', height: '100%' }} />
          ) : monthlyChartData.length === 0 ? (
            <EmptyState
              title="No revenue data"
              description="No monthly sales were found for the selected date range."
            />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyChartData} margin={{ top: 8, right: 16, left: 4, bottom: 4 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--chart-axis)', fontSize: 12 }}
                  dy={6}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--chart-axis)', fontSize: 12 }}
                  tickFormatter={(v) => formatCompactCurrency(v)}
                  width={56}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-md)',
                    color: 'var(--text-primary)',
                    fontSize: '0.8125rem',
                  }}
                  formatter={(val) => [formatCurrency(val), 'Revenue']}
                />
                <Line
                  type="monotone"
                  dataKey="revenueNum"
                  stroke="var(--accent-text)"
                  strokeWidth={2}
                  dot={(props) => {
                    const isMax = maxRevenuePoint && props.payload.month === maxRevenuePoint.month;
                    return (
                      <circle
                        key={props.key || props.index}
                        cx={props.cx}
                        cy={props.cy}
                        r={isMax ? 5 : 3}
                        fill={isMax ? 'var(--accent-text)' : 'var(--bg-surface)'}
                        stroke="var(--accent-text)"
                        strokeWidth={2}
                      />
                    );
                  }}
                  activeDot={{ r: 5, fill: 'var(--accent)', stroke: 'var(--bg-surface)', strokeWidth: 2 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <div className="grid-cols-2">
        <section className="card card-flush" aria-label="Top Products">
          <div className="card-header">
            <div>
              <h3 className="section-heading" style={{ marginBottom: 0 }}>Top Products</h3>
              <p className="section-subheading" style={{ marginBottom: 0 }}>Products by sales revenue</p>
            </div>
          </div>

          {loading || !data ? (
            <TableSkeleton rows={4} columns={4} />
          ) : !data.topProducts || data.topProducts.length === 0 ? (
            <EmptyState
              title="No product sales yet"
              description="Top performing products will appear once orders are recorded."
            />
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th className="num">Units</th>
                    <th className="num">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topProducts.map((p) => (
                    <tr key={p.product_id}>
                      <td className="cell-primary">{p.product_name}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{p.category}</td>
                      <td className="num">{p.units_sold}</td>
                      <td className="num cell-primary">{formatCurrency(p.total_revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card card-flush" aria-label="Top Client Accounts">
          <div className="card-header">
            <div>
              <h3 className="section-heading" style={{ marginBottom: 0 }}>Top Client Accounts</h3>
              <p className="section-subheading" style={{ marginBottom: 0 }}>Customers by total spent</p>
            </div>
          </div>

          {loading || !data ? (
            <TableSkeleton rows={4} columns={4} />
          ) : !data.topCustomers || data.topCustomers.length === 0 ? (
            <EmptyState
              title="No customer activity"
              description="Top customer accounts will appear once orders are recorded."
            />
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>City</th>
                    <th className="num">Orders</th>
                    <th className="num">Total Spent</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topCustomers.map((c) => (
                    <tr key={c.customer_id}>
                      <td>
                        <div className="cell-primary">{c.customer_name}</div>
                        <div className="cell-secondary tabular-nums">{c.customer_code}</div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{c.city}</td>
                      <td className="num">{c.orders_count}</td>
                      <td className="num cell-primary">{formatCurrency(c.total_spent)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <section className="card card-flush" aria-label="Recent Sales Activity">
        <div className="card-header">
          <div>
            <h3 className="section-heading" style={{ marginBottom: 0 }}>Recent Sales Activity</h3>
            <p className="section-subheading" style={{ marginBottom: 0 }}>Latest orders placed in the system</p>
          </div>
        </div>

        {loading || !data ? (
          <TableSkeleton rows={5} columns={5} />
        ) : !data.recentSales || data.recentSales.length === 0 ? (
          <EmptyState
            title="No recent orders"
            description="Recent sales activity will appear here once transactions are placed."
          />
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th className="num">Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recentSales.map((s) => (
                  <tr key={s.id}>
                    <td className="tabular-nums" style={{ fontWeight: 500 }}>#{s.id}</td>
                    <td>
                      <div className="cell-primary">{s.customer_name}</div>
                      <div className="cell-secondary">{s.city}</div>
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
        )}
      </section>
        </>
      )}
    </div>
  );
};

export default Dashboard;
