import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { dashboardApi } from '../api/dashboard.api';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { CardSkeleton, TableSkeleton } from '../components/common/LoadingSkeleton';
import { MonthlyRevenueChart } from '../components/charts/MonthlyRevenueChart';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDate, formatMonth } from '../utils/format';

export const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activePreset, setActivePreset] = useState('all');
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

  // Compute month-over-month revenue comparison from existing monthly sales data
  const revenueComparison = useMemo(() => {
    const list = data?.monthlySales;
    if (!list || list.length < 2) {
      return null;
    }
    const curr = list[list.length - 1];
    const prev = list[list.length - 2];
    const currRev = parseFloat(curr.revenue) || 0;
    const prevRev = parseFloat(prev.revenue) || 0;

    if (prevRev <= 0) {
      return null;
    }
    const diff = ((currRev - prevRev) / prevRev) * 100;
    return {
      text: `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}% vs last month`,
      isPositive: diff >= 0,
    };
  }, [data]);

  const monthlyChartData = useMemo(() => {
    return (data?.monthlySales || []).map((m) => ({
      ...m,
      monthLabel: formatMonth(m.month),
      revenueNum: parseFloat(m.revenue) || 0,
    }));
  }, [data]);

  return (
    <div className="stack-lg">
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h2>Dashboard</h2>
        </div>

        <div className="header-actions">

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
            />
            <StatCard
              title="Total Orders"
              value={data.kpi?.total_sales_count || 0}
              subtitle={`Avg: ${formatCurrency(data.kpi?.average_order_value)}`}
            />
            <StatCard
              title="Customers"
              value={data.kpi?.total_customers || 0}
            />
            <StatCard
              title="Products"
              value={data.kpi?.active_products || 0}
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

      <MonthlyRevenueChart
        data={monthlyChartData}
        loading={loading || !data}
      />

      <div className="grid-cols-2">
        <section className="card card-flush" aria-label="Top Products">
          <div className="card-header">
            <h3 className="section-heading" style={{ marginBottom: 0 }}>Top Products</h3>
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

        <section className="card card-flush" aria-label="Top Customers">
          <div className="card-header">
            <h3 className="section-heading" style={{ marginBottom: 0 }}>Top Customers</h3>
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

      <section className="card card-flush" aria-label="Recent Sales">
        <div className="card-header">
          <h3 className="section-heading" style={{ marginBottom: 0 }}>Recent Sales</h3>
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
