import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Download,
  RotateCcw,
  Search,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  Cell,
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
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatCompactCurrency } from '../utils/format';

export const Reports = () => {
  const [salesReport, setSalesReport] = useState(null);
  const [customerInsights, setCustomerInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sales');

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [cityFilter, setCityFilter] = useState('');

  const [insightSearch, setInsightSearch] = useState('');
  const [trendFilter, setTrendFilter] = useState('all');

  const { showToast } = useToast();

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const [salesRes, insightsRes] = await Promise.all([
        dashboardApi.getSalesReport({
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          city: cityFilter || undefined,
        }),
        dashboardApi.getCustomerInsights(),
      ]);
      setSalesReport(salesRes);
      setCustomerInsights(insightsRes || []);
    } catch (err) {
      showToast(err.message || 'Failed to load reports', 'error');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, cityFilter, showToast]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handlePreset = (days) => {
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

  const monthlyTimeline = useMemo(() => {
    if (!salesReport?.byMonth || salesReport.byMonth.length === 0) return [];
    return [...salesReport.byMonth].reverse().map((m) => ({
      ...m,
      revenueNum: Number(m.revenue) || 0,
      ordersNum: Number(m.order_count) || 0,
    }));
  }, [salesReport]);

  const peakMonth = useMemo(() => {
    if (!monthlyTimeline || monthlyTimeline.length === 0) return null;
    return monthlyTimeline.reduce(
      (max, item) => (item.revenueNum > (max?.revenueNum || 0) ? item : max),
      null
    );
  }, [monthlyTimeline]);

  const peakCity = useMemo(() => {
    if (!salesReport?.byCity || salesReport.byCity.length === 0) return null;
    return salesReport.byCity.reduce(
      (max, item) => (Number(item.revenue) > (Number(max?.revenue) || 0) ? item : max),
      null
    );
  }, [salesReport]);

  const searchInputRef = React.useRef(null);
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.key === '/' &&
        document.activeElement !== searchInputRef.current &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const totalPeriodRevenue = Number(salesReport?.summary?.total_revenue) || 1;

  const exportSalesReportCSV = () => {
    if (!salesReport) return;
    const lines = [];
    lines.push('Month,Orders,Revenue');
    (salesReport.byMonth || []).forEach((m) => {
      lines.push(`"${m.month}",${m.order_count},${m.revenue}`);
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sales_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    showToast('Exported sales report to CSV', 'success');
  };

  const exportCustomerInsightsCSV = () => {
    if (!customerInsights || customerInsights.length === 0) return;
    const lines = [];
    lines.push('Customer Name,Customer Code,City,Value Tier,Lifetime Spend,Recent 30d Spend,Trend');
    customerInsights.forEach((ci) => {
      lines.push(`"${ci.customer_name}","${ci.customer_code}","${ci.city}","${ci.value_tier}",${ci.lifetime_spend},${ci.recent_30d_spend},"${ci.purchase_trend}"`);
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `customer_trends_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    showToast('Exported customer trends to CSV', 'success');
  };

  const filteredInsights = useMemo(() => {
    return customerInsights.filter((ci) => {
      const matchSearch =
        insightSearch === '' ||
        ci.customer_name?.toLowerCase().includes(insightSearch.toLowerCase()) ||
        ci.customer_code?.toLowerCase().includes(insightSearch.toLowerCase()) ||
        ci.city?.toLowerCase().includes(insightSearch.toLowerCase());
      const matchTrend = trendFilter === 'all' || ci.purchase_trend === trendFilter;
      return matchSearch && matchTrend;
    });
  }, [customerInsights, insightSearch, trendFilter]);

  return (
    <div>
      {/* Header and Tab Switcher */}
      <div className="page-header">
        <div>
          <h2>Reports</h2>
          <p className="page-subtitle">Revenue, geographic trends, and customer purchase patterns</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'sales' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('sales')}
            >
              Sales Summary
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'insights' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('insights')}
            >
              Customer Trends
            </button>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={activeTab === 'sales' ? exportSalesReportCSV : exportCustomerInsightsCSV}
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {activeTab === 'sales' ? (
        <>
          {/* Sales Filter Bar */}
          <div className="filter-bar">
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                type="button"
                className={`btn btn-sm ${!startDate && !endDate ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handlePreset(null)}
              >
                All Time
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handlePreset(30)}
              >
                30 Days
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handlePreset(90)}
              >
                90 Days
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input
                type="date"
                className="form-control"
                style={{ width: '135px' }}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>to</span>
              <input
                type="date"
                className="form-control"
                style={{ width: '135px' }}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <select
              className="form-control"
              style={{ width: '160px' }}
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
            >
              <option value="">All Cities</option>
              <option value="Pune">Pune</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Nagpur">Nagpur</option>
              <option value="Nashik">Nashik</option>
              <option value="Aurangabad">Aurangabad</option>
              <option value="Hyderabad">Hyderabad</option>
              <option value="Delhi">Delhi</option>
            </select>

            {(startDate || endDate || cityFilter) && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => { setStartDate(''); setEndDate(''); setCityFilter(''); }}
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* KPI Summary Cards */}
          <div className="grid-cols-4" style={{ marginBottom: '20px' }}>
            {loading || !salesReport ? (
              <>
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </>
            ) : (
              <>
                <StatCard
                  title="Total Revenue"
                  value={formatCurrency(salesReport.summary?.total_revenue)}
                  subtitle="In selected period"
                />
                <StatCard
                  title="Total Orders"
                  value={salesReport.summary?.total_orders || 0}
                  subtitle="Completed orders"
                />
                <StatCard
                  title="Unique Customers"
                  value={salesReport.summary?.unique_customers || 0}
                  subtitle="Active buyers"
                />
                <StatCard
                  title="Average Order Value"
                  value={formatCurrency(salesReport.summary?.average_order_value)}
                  subtitle="Per order"
                />
              </>
            )}
          </div>

          {/* Monthly Revenue Trend LineChart */}
          <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '4px' }}>Monthly Revenue</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Monthly sales revenue over time
            </p>
            {peakMonth && (
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-main)', marginBottom: '16px', fontWeight: 500 }}>
                Highest sales in {peakMonth.month}: {formatCompactCurrency(peakMonth.revenueNum)}
              </p>
            )}

            <div style={{ width: '100%', height: 260 }}>
              {loading || !salesReport ? (
                <div className="skeleton" style={{ width: '100%', height: '100%' }} />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyTimeline} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
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
                      dataKey="revenueNum"
                      stroke="#78716c"
                      strokeWidth={2}
                      dot={(props) => {
                        const isPeak = peakMonth && props.payload.month === peakMonth.month;
                        return (
                          <circle
                            key={props.key || props.index}
                            cx={props.cx}
                            cy={props.cy}
                            r={isPeak ? 5 : 3}
                            fill={isPeak ? '#0f766e' : '#a8a29e'}
                            stroke={isPeak ? '#0f766e' : '#a8a29e'}
                            strokeWidth={1}
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

          {/* 2 Breakdowns: Sales by City & Sales by Category */}
          <div className="grid-cols-2" style={{ marginBottom: '20px' }}>
            {/* Sales by City Bar Chart */}
            <div className="glass-panel" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '4px' }}>Sales by City</h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                Revenue generated per city
              </p>
              {peakCity && (
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-main)', marginBottom: '14px', fontWeight: 500 }}>
                  Highest city sales in {peakCity.city}: {formatCompactCurrency(peakCity.revenue)}
                </p>
              )}

              <div style={{ width: '100%', height: 240 }}>
                {loading || !salesReport ? (
                  <div className="skeleton" style={{ width: '100%', height: '100%' }} />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesReport.byCity || []} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                      <XAxis dataKey="city" stroke="var(--chart-axis)" fontSize={11} tickLine={false} />
                      <YAxis
                        stroke="var(--chart-axis)"
                        fontSize={11}
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
                      <Bar dataKey="revenue" isAnimationActive={false}>
                        {(salesReport.byCity || []).map((entry, index) => {
                          const isPeak = peakCity && entry.city === peakCity.city;
                          return <Cell key={`cell-${index}`} fill={isPeak ? '#0f766e' : '#cbd5e1'} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Sales by Category Table */}
            <div className="glass-panel" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '4px' }}>Sales by Category</h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                Revenue contribution per category
              </p>

              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Units</th>
                      <th>Share</th>
                      <th style={{ textAlign: 'right' }}>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesReport?.byCategory?.map((cat) => {
                      const sharePct = Math.round(((Number(cat.category_revenue) || 0) / totalPeriodRevenue) * 100);
                      return (
                        <tr key={cat.category}>
                          <td style={{ fontWeight: 500 }}>{cat.category}</td>
                          <td className="tabular-nums">{cat.units_sold}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <div
                                style={{
                                  width: '50px',
                                  height: '5px',
                                  borderRadius: '2px',
                                  background: 'var(--border-subtle)',
                                  overflow: 'hidden',
                                }}
                              >
                                <div
                                  style={{
                                    width: `${Math.min(sharePct, 100)}%`,
                                    height: '100%',
                                    background: 'var(--primary)',
                                  }}
                                />
                              </div>
                              <span className="tabular-nums" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sharePct}%</span>
                            </div>
                          </td>
                          <td className="tabular-nums" style={{ textAlign: 'right', fontWeight: 600 }}>
                            {formatCurrency(cat.category_revenue)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Customer Trends Tab */
        <div>
          <div className="filter-bar">
            <div className="search-input-wrapper">
              <Search size={15} className="search-icon" />
              <input
                ref={searchInputRef}
                type="text"
                className="form-control search-input"
                placeholder="Search customers by name, code, or city... (Press / to search)"
                value={insightSearch}
                onChange={(e) => setInsightSearch(e.target.value)}
              />
            </div>

            <select
              className="form-control"
              style={{ width: '150px' }}
              value={trendFilter}
              onChange={(e) => setTrendFilter(e.target.value)}
            >
              <option value="all">All Trends</option>
              <option value="Growing">Growing</option>
              <option value="Stable">Stable</option>
              <option value="Decreased">Decreased</option>
            </select>

            {(insightSearch || trendFilter !== 'all') && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => { setInsightSearch(''); setTrendFilter('all'); }}
              >
                Reset
              </button>
            )}
          </div>

          <div className="glass-panel" style={{ padding: '20px' }}>
            {filteredInsights.length === 0 ? (
              <EmptyState
                title="No customer insights found"
                description={
                  insightSearch || trendFilter !== 'all'
                    ? 'No customer records match your filter criteria.'
                    : 'No customer trend data available yet.'
                }
                action={
                  (insightSearch || trendFilter !== 'all') ? (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => { setInsightSearch(''); setTrendFilter('all'); }}
                    >
                      Clear Filters
                    </button>
                  ) : null
                }
              />
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>City</th>
                      <th>Tier</th>
                      <th>Lifetime Spend</th>
                      <th>Last 30 Days</th>
                      <th>Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInsights.map((ci) => {
                      const badgeStatus =
                        ci.purchase_trend === 'Growing'
                          ? 'active'
                          : ci.purchase_trend === 'Decreased'
                          ? 'danger'
                          : 'pending';
                      return (
                        <tr key={ci.customer_code}>
                          <td>
                            <div style={{ fontWeight: 500 }}>{ci.customer_name}</div>
                            <div className="tabular-nums" style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{ci.customer_code}</div>
                          </td>
                          <td>{ci.city}</td>
                          <td>{ci.value_tier}</td>
                          <td className="tabular-nums" style={{ fontWeight: 600 }}>{formatCurrency(ci.lifetime_spend)}</td>
                          <td className="tabular-nums">{formatCurrency(ci.recent_30d_spend)}</td>
                          <td>
                            <Badge status={badgeStatus} label={ci.purchase_trend} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
