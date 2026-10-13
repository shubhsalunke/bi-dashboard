import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FileBarChart,
  Calendar,
  MapPin,
  TrendingUp,
  Download,
  Users,
  DollarSign,
  ShoppingCart,
  RotateCcw,
  Sparkles,
  ArrowUpRight,
  Search,
  Building2,
  Filter,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { dashboardApi } from '../api/dashboard.api';
import { useToast } from '../context/ToastContext';

export const Reports = () => {
  const [salesReport, setSalesReport] = useState(null);
  const [customerInsights, setCustomerInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sales'); // 'sales' or 'insights'

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [presetActive, setPresetActive] = useState('all');

  // Customer Insights local filter
  const [insightSearch, setInsightSearch] = useState('');
  const [trendFilter, setTrendFilter] = useState('all'); // 'all', 'Growing', 'Decreased', 'Stable'

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
      showToast(err.message || 'Failed to load business reports', 'error');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, cityFilter, showToast]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const handlePreset = (type) => {
    setPresetActive(type);
    const today = new Date();
    const formatIso = (d) => d.toISOString().split('T')[0];
    const end = formatIso(today);

    if (type === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (type === '30d') {
      const start = new Date(today);
      start.setDate(today.getDate() - 30);
      setStartDate(formatIso(start));
      setEndDate(end);
    } else if (type === '90d') {
      const start = new Date(today);
      start.setDate(today.getDate() - 90);
      setStartDate(formatIso(start));
      setEndDate(end);
    } else if (type === 'ytd') {
      const start = new Date(today.getFullYear(), 0, 1);
      setStartDate(formatIso(start));
      setEndDate(end);
    }
  };

  const resetFilters = () => {
    setStartDate('');
    setEndDate('');
    setCityFilter('');
    setPresetActive('all');
  };

  const hasActiveFilters = Boolean(startDate || endDate || cityFilter);

  // Chronological Monthly data for Area Chart
  const monthlyTimeline = useMemo(() => {
    if (!salesReport?.byMonth || salesReport.byMonth.length === 0) return [];
    return [...salesReport.byMonth].reverse().map((m) => {
      const parts = m.month.split('-');
      const label = parts.length === 2 ? `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(parts[1], 10) - 1]} '${parts[0].slice(2)}` : m.month;
      return {
        ...m,
        label,
        revenueNum: Number(m.revenue) || 0,
        ordersNum: Number(m.order_count) || 0,
      };
    });
  }, [salesReport]);

  const totalPeriodRevenue = Number(salesReport?.summary?.total_revenue) || 1;

  // CSV Export for Sales Report
  const exportSalesReportCSV = () => {
    if (!salesReport) return;
    const lines = [];
    lines.push('Smart BI - Executive Sales & Business Report');
    lines.push(`Generated,${new Date().toLocaleString()}`);
    lines.push(`Filter Window,${startDate || 'Start'} to ${endDate || 'Current'}`);
    lines.push(`Region Filter,${cityFilter || 'All Cities'}`);
    lines.push('');
    lines.push('--- PERIOD SUMMARY ---');
    lines.push(`Total Revenue,${salesReport.summary?.total_revenue || 0}`);
    lines.push(`Total Orders,${salesReport.summary?.total_orders || 0}`);
    lines.push(`Unique Clients,${salesReport.summary?.unique_customers || 0}`);
    lines.push(`Average Order Value,${salesReport.summary?.average_order_value || 0}`);
    lines.push('');
    lines.push('--- MONTHLY REVENUE TIMELINE ---');
    lines.push('Month,Orders,Revenue ($)');
    (salesReport.byMonth || []).forEach((m) => {
      lines.push(`"${m.month}",${m.order_count},${m.revenue}`);
    });
    lines.push('');
    lines.push('--- SALES BY CITY ---');
    lines.push('City,Customers,Orders,Revenue ($)');
    (salesReport.byCity || []).forEach((c) => {
      lines.push(`"${c.city}",${c.customers_count},${c.orders_count},${c.revenue}`);
    });
    lines.push('');
    lines.push('--- SALES BY CATEGORY ---');
    lines.push('Category,Products Count,Units Sold,Revenue ($)');
    (salesReport.byCategory || []).forEach((cat) => {
      lines.push(`"${cat.category}",${cat.products_count},${cat.units_sold},${cat.category_revenue}`);
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `smart_bi_sales_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Sales Report CSV exported successfully', 'success');
  };

  // CSV Export for Customer Insights
  const exportCustomerInsightsCSV = () => {
    if (!customerInsights || customerInsights.length === 0) return;
    const lines = [];
    lines.push('Smart BI - Customer Purchasing Trends');
    lines.push(`Generated,${new Date().toLocaleString()}`);
    lines.push('');
    lines.push('Customer Name,Customer Code,City,Value Tier,Lifetime Spend ($),Prior 30d Spend ($),Recent 30d Spend ($),Trend');
    customerInsights.forEach((ci) => {
      lines.push(`"${ci.customer_name}","${ci.customer_code}","${ci.city}","${ci.value_tier}",${ci.lifetime_spend},${ci.prior_30d_spend},${ci.recent_30d_spend},"${ci.purchase_trend}"`);
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `smart_bi_customer_trends_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Customer Trends CSV exported successfully', 'success');
  };

  const getCategoryClass = (cat) => {
    const c = (cat || '').toLowerCase();
    if (c.includes('ai') || c.includes('analytics')) return 'category-ai';
    if (c.includes('cloud')) return 'category-cloud';
    if (c.includes('services') || c.includes('software')) return 'category-services';
    return 'category-default';
  };

  // Filtered customer insights
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

  const growingCount = customerInsights.filter((c) => c.purchase_trend === 'Growing').length;
  const decreasedCount = customerInsights.filter((c) => c.purchase_trend === 'Decreased').length;
  const stableCount = customerInsights.filter((c) => c.purchase_trend === 'Stable').length;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Header bar */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2>Sales & Business Reports</h2>
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(37, 99, 235, 0.1)',
                color: '#2563eb',
                border: '1px solid rgba(37, 99, 235, 0.2)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Enterprise Analytics
            </span>
          </div>
          <p className="page-subtitle">Track sales revenue, orders, and customer trends</p>
        </div>

        {/* Tab Switcher & Export */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'flex',
              gap: '6px',
              background: 'var(--bg-card)',
              padding: '4px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <button
              className={`btn btn-sm ${activeTab === 'sales' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('sales')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem' }}
            >
              <FileBarChart size={14} />
              <span>Sales Summary</span>
            </button>
            <button
              className={`btn btn-sm ${activeTab === 'insights' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('insights')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem' }}
            >
              <Users size={14} />
              <span>Customer Trends</span>
            </button>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={activeTab === 'sales' ? exportSalesReportCSV : exportCustomerInsightsCSV}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', padding: '7px 14px' }}
            title="Download CSV dataset"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Bar (Sales Summary Tab) */}
      {activeTab === 'sales' && (
        <div className="filter-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Date Inputs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-main)', padding: '5px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <Calendar size={15} color="var(--primary)" />
              <input
                type="date"
                className="form-control"
                style={{ width: '135px', padding: '4px 6px', fontSize: '0.8125rem', border: 'none', background: 'transparent' }}
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPresetActive('custom');
                }}
              />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>to</span>
              <input
                type="date"
                className="form-control"
                style={{ width: '135px', padding: '4px 6px', fontSize: '0.8125rem', border: 'none', background: 'transparent' }}
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPresetActive('custom');
                }}
              />
            </div>

            {/* Quick Presets */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {[
                { id: 'all', label: 'All Time' },
                { id: '30d', label: '30D' },
                { id: '90d', label: '90D' },
                { id: 'ytd', label: 'YTD' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handlePreset(p.id)}
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '5px 11px',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid',
                    borderColor: presetActive === p.id ? 'var(--primary)' : 'var(--border-subtle)',
                    background: presetActive === p.id ? 'rgba(37, 99, 235, 0.12)' : 'var(--bg-main)',
                    color: presetActive === p.id ? 'var(--primary)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* City Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-main)', padding: '5px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <MapPin size={14} color="var(--text-muted)" />
              <select
                className="form-control"
                style={{ width: '155px', border: 'none', background: 'transparent', padding: '3px 4px', fontSize: '0.8125rem' }}
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
              >
                <option value="">All Regions / Cities</option>
                <option value="New York">New York</option>
                <option value="San Francisco">San Francisco</option>
                <option value="Chicago">Chicago</option>
                <option value="Austin">Austin</option>
                <option value="Seattle">Seattle</option>
                <option value="Boston">Boston</option>
                <option value="Miami">Miami</option>
                <option value="Denver">Denver</option>
                <option value="Dallas">Dallas</option>
                <option value="Los Angeles">Los Angeles</option>
              </select>
            </div>
          </div>

          {/* Reset Filters Action */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 8px',
                borderRadius: '4px',
              }}
            >
              <RotateCcw size={13} />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      )}

      {/* SALES SUMMARY TAB CONTENT */}
      {activeTab === 'sales' ? (
        <>
          {/* Executive KPI Stat Cards */}
          <div className="grid-cols-4" style={{ gap: '16px' }}>
            {/* Period Revenue */}
            <div className="stat-card stat-card-revenue">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span className="stat-title">PERIOD REVENUE</span>
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
              <div className="stat-value">{formatCurrency(salesReport?.summary?.total_revenue)}</div>
              <div className="stat-footer" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
                <CheckCircle2 size={13} color="#10b981" />
                <span>Total verified sales revenue</span>
              </div>
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
              <div className="stat-value">{salesReport?.summary?.total_orders || 0}</div>
              <div className="stat-footer" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
                <span>In selected dates • 100% completed</span>
              </div>
            </div>

            {/* Unique Clients */}
            <div className="stat-card stat-card-customers">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span className="stat-title">UNIQUE CLIENTS</span>
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
                  <Users size={16} />
                </div>
              </div>
              <div className="stat-value">{salesReport?.summary?.unique_customers || 0}</div>
              <div className="stat-footer" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
                <span>Active transacting corporate accounts</span>
              </div>
            </div>

            {/* Avg Order Value */}
            <div className="stat-card stat-card-offerings">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span className="stat-title">AVG ORDER VALUE</span>
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
                  <TrendingUp size={16} />
                </div>
              </div>
              <div className="stat-value">{formatCurrency(salesReport?.summary?.average_order_value)}</div>
              <div className="stat-footer" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
                <span>Average revenue per order ticket</span>
              </div>
            </div>
          </div>

          {/* Monthly Revenue Run-Rate Section */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                  Monthly Revenue Momentum & Run-Rate
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  Transaction volume and revenue pacing aggregated across calendar months
                </p>
              </div>

              {monthlyTimeline.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-full)',
                      background: 'rgba(37, 99, 235, 0.08)',
                      color: 'var(--primary)',
                      border: '1px solid rgba(37, 99, 235, 0.2)',
                    }}
                  >
                    {monthlyTimeline.length} Months Tracked
                  </span>
                </div>
              )}
            </div>

            <div style={{ width: '100%', height: 260 }}>
              {loading || !salesReport ? (
                <div className="skeleton" style={{ width: '100%', height: '100%', borderRadius: '12px' }} />
              ) : monthlyTimeline.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  No monthly transaction records found for the selected filter range.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyTimeline} margin={{ top: 10, right: 15, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="reportsRevGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                    <XAxis
                      dataKey="label"
                      stroke="var(--chart-axis)"
                      fontSize={11}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="var(--chart-axis)"
                      fontSize={11}
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
                      formatter={(val, name) => [
                        name === 'revenueNum' ? formatCurrency(val) : val,
                        name === 'revenueNum' ? 'Revenue' : 'Orders',
                      ]}
                      labelFormatter={(label) => `Period: ${label}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenueNum"
                      stroke="#2563eb"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#reportsRevGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Regional & Category Breakdowns Row */}
          <div className="grid-cols-2" style={{ gap: '20px' }}>
            {/* Sales by City Bar Chart */}
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                  Sales by City
                </h3>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Top Markets</span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Top cities by sales revenue
              </p>

              {/* City Top 3 Quick Badges */}
              {salesReport?.byCity && salesReport.byCity.length >= 3 && (
                <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                  {salesReport.byCity.slice(0, 3).map((c, i) => (
                    <div
                      key={c.city}
                      style={{
                        fontSize: '0.6875rem',
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--bg-card-hover)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} {c.city}
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>{formatCurrency(c.revenue)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ width: '100%', height: 260, flex: 1 }}>
                {loading || !salesReport ? (
                  <div className="skeleton" style={{ width: '100%', height: '100%', borderRadius: '12px' }} />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesReport.byCity || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                      <XAxis dataKey="city" stroke="var(--chart-axis)" fontSize={11} tickLine={false} />
                      <YAxis stroke="var(--chart-axis)" fontSize={11} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip
                        contentStyle={{
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '8px',
                          color: 'var(--text-main)',
                          boxShadow: 'var(--shadow-md)',
                        }}
                        formatter={(val, name, props) => [
                          `${formatCurrency(val)} (${props.payload.orders_count || 0} orders)`,
                          'Revenue',
                        ]}
                      />
                      <Bar dataKey="revenue" fill="var(--chart-primary)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Category Breakdown Table */}
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                  Sales by Category
                </h3>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Catalog Mix</span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Units sold and revenue per category
              </p>

              <div className="table-responsive" style={{ flex: 1 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>CATEGORY</th>
                      <th>UNITS SOLD</th>
                      <th style={{ width: '120px' }}>SHARE</th>
                      <th style={{ textAlign: 'right' }}>TOTAL REVENUE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesReport?.byCategory?.map((cat) => {
                      const sharePct = Math.round(((Number(cat.category_revenue) || 0) / totalPeriodRevenue) * 100);
                      return (
                        <tr key={cat.category}>
                          <td>
                            <span className={`category-pill ${getCategoryClass(cat.category)}`}>
                              {cat.category}
                            </span>
                          </td>
                          <td style={{ color: 'var(--text-main)', fontWeight: 500 }}>
                            {cat.units_sold} units
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div
                                style={{
                                  flex: 1,
                                  height: '6px',
                                  borderRadius: '3px',
                                  background: 'var(--border-subtle)',
                                  overflow: 'hidden',
                                }}
                              >
                                <div
                                  style={{
                                    width: `${Math.min(sharePct, 100)}%`,
                                    height: '100%',
                                    background: 'linear-gradient(90deg, #2563eb, #7c3aed)',
                                    borderRadius: '3px',
                                  }}
                                />
                              </div>
                              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', width: '28px', textAlign: 'right' }}>
                                {sharePct}%
                              </span>
                            </div>
                          </td>
                          <td style={{ fontWeight: 700, color: 'var(--success)', textAlign: 'right' }}>
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
        /* CUSTOMER INSIGHTS TAB */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Customer Trends KPI Metrics Row */}
          <div className="grid-cols-4" style={{ gap: '16px' }}>
            <div className="stat-card">
              <span className="stat-title">MONITORED CLIENTS</span>
              <div className="stat-value">{customerInsights.length}</div>
              <div className="stat-footer">Tracked corporate accounts</div>
            </div>
            <div className="stat-card">
              <span className="stat-title">EXPANDING ACCOUNTS</span>
              <div className="stat-value" style={{ color: 'var(--success)' }}>{growingCount}</div>
              <div className="stat-footer">▲ Growing 30-day spend pace</div>
            </div>
            <div className="stat-card">
              <span className="stat-title">AT-RISK / DECREASED</span>
              <div className="stat-value" style={{ color: 'var(--danger)' }}>{decreasedCount}</div>
              <div className="stat-footer">▼ Reduced purchase volume</div>
            </div>
            <div className="stat-card">
              <span className="stat-title">STABLE PARTNERS</span>
              <div className="stat-value" style={{ color: 'var(--primary)' }}>{stableCount}</div>
              <div className="stat-footer">● Consistent re-order velocity</div>
            </div>
          </div>

          {/* Table Container */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                  Customer Purchasing Trends
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  Comparing recent 30-day sales with previous months to identify changes in purchasing
                </p>
              </div>

              {/* Local Filter Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                {/* Search */}
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search client or city..."
                    value={insightSearch}
                    onChange={(e) => setInsightSearch(e.target.value)}
                    style={{ paddingLeft: '32px', fontSize: '0.8125rem', width: '200px' }}
                  />
                </div>

                {/* Trend Pills */}
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[
                    { id: 'all', label: `All (${customerInsights.length})` },
                    { id: 'Growing', label: `Growing (${growingCount})` },
                    { id: 'Decreased', label: `Decreased (${decreasedCount})` },
                    { id: 'Stable', label: `Stable (${stableCount})` },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTrendFilter(t.id)}
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '5px 10px',
                        borderRadius: 'var(--radius-full)',
                        border: '1px solid',
                        borderColor: trendFilter === t.id ? 'var(--primary)' : 'var(--border-subtle)',
                        background: trendFilter === t.id ? 'rgba(37, 99, 235, 0.12)' : 'var(--bg-main)',
                        color: trendFilter === t.id ? 'var(--primary)' : 'var(--text-muted)',
                        cursor: 'pointer',
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Client Account</th>
                    <th>City</th>
                    <th>Value Tier</th>
                    <th style={{ textAlign: 'right' }}>Lifetime Spend</th>
                    <th style={{ textAlign: 'right' }}>Prior 30d Spend</th>
                    <th style={{ textAlign: 'right' }}>Recent 30d Spend</th>
                    <th style={{ textAlign: 'center' }}>30d Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInsights.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                        No clients matched the selected trend and search filters.
                      </td>
                    </tr>
                  ) : (
                    filteredInsights.map((ci) => {
                      const trendColor =
                        ci.purchase_trend === 'Growing'
                          ? 'var(--success)'
                          : ci.purchase_trend === 'Decreased'
                          ? 'var(--danger)'
                          : 'var(--text-muted)';
                      const trendBg =
                        ci.purchase_trend === 'Growing'
                          ? 'var(--success-bg)'
                          : ci.purchase_trend === 'Decreased'
                          ? 'var(--danger-bg)'
                          : 'var(--bg-card-hover)';
                      const trendBorder =
                        ci.purchase_trend === 'Growing'
                          ? 'var(--success-border)'
                          : ci.purchase_trend === 'Decreased'
                          ? 'var(--danger-border)'
                          : 'var(--border-subtle)';

                      const initials = ci.customer_name
                        ? ci.customer_name
                            .split(' ')
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()
                        : 'CL';

                      return (
                        <tr key={ci.customer_id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div className="avatar-badge" style={{ width: '32px', height: '32px', fontSize: '0.6875rem' }}>
                                {initials}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{ci.customer_name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{ci.customer_code}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)' }}>
                              <MapPin size={13} />
                              <span>{ci.city}</span>
                            </div>
                          </td>
                          <td>
                            <span
                              style={{
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                padding: '3px 8px',
                                borderRadius: '6px',
                                background: ci.value_tier.includes('Tier 1') ? 'var(--info-bg)' : 'var(--bg-card-hover)',
                                color: ci.value_tier.includes('Tier 1') ? 'var(--primary)' : 'var(--text-muted)',
                                border: `1px solid ${ci.value_tier.includes('Tier 1') ? 'var(--info-border)' : 'var(--border-subtle)'}`,
                              }}
                            >
                              {ci.value_tier}
                            </span>
                          </td>
                          <td style={{ fontWeight: 700, textAlign: 'right' }}>{formatCurrency(ci.lifetime_spend)}</td>
                          <td style={{ color: 'var(--text-muted)', textAlign: 'right' }}>{formatCurrency(ci.prior_30d_spend)}</td>
                          <td style={{ fontWeight: 600, color: 'var(--text-main)', textAlign: 'right' }}>{formatCurrency(ci.recent_30d_spend)}</td>
                          <td style={{ textAlign: 'center' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 10px',
                                borderRadius: 'var(--radius-full)',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                color: trendColor,
                                background: trendBg,
                                border: `1px solid ${trendBorder}`,
                              }}
                            >
                              {ci.purchase_trend === 'Growing' ? '▲ Growing' : ci.purchase_trend === 'Decreased' ? '▼ Decreased' : '● Stable'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
