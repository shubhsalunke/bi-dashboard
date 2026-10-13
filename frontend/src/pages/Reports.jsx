import React, { useState, useEffect, useCallback } from 'react';
import {
  FileBarChart,
  Calendar,
  MapPin,
  TrendingUp,
  Download,
  Users,
} from 'lucide-react';
import {
  BarChart,
  Bar,
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
      setCustomerInsights(insightsRes);
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

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h2>Sales & Business Reports</h2>
          <p className="page-subtitle">Track sales revenue, orders, and customer trends</p>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-card)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <button
            className={`btn btn-sm ${activeTab === 'sales' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('sales')}
          >
            <FileBarChart size={14} /> Sales Summary
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'insights' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('insights')}
          >
            <Users size={14} /> Customer Trends
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      {activeTab === 'sales' && (
        <div className="filter-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={16} color="var(--text-muted)" />
            <input
              type="date"
              className="form-control"
              style={{ width: '145px' }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>to</span>
            <input
              type="date"
              className="form-control"
              style={{ width: '145px' }}
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
            <option value="">All Regions / Cities</option>
            <option value="New York">New York</option>
            <option value="San Francisco">San Francisco</option>
            <option value="Chicago">Chicago</option>
            <option value="Austin">Austin</option>
            <option value="Seattle">Seattle</option>
            <option value="Boston">Boston</option>
            <option value="Miami">Miami</option>
            <option value="Denver">Denver</option>
          </select>
        </div>
      )}

      {activeTab === 'sales' ? (
        <>
          {/* Summary KPIs */}
          <div className="grid-cols-4" style={{ marginBottom: '24px' }}>
            <div className="stat-card">
              <span className="stat-title">Period Revenue</span>
              <div className="stat-value">{formatCurrency(salesReport?.summary?.total_revenue)}</div>
              <div className="stat-footer">Total sales revenue</div>
            </div>
            <div className="stat-card">
              <span className="stat-title">Total Orders</span>
              <div className="stat-value">{salesReport?.summary?.total_orders || 0}</div>
              <div className="stat-footer">In selected dates</div>
            </div>
            <div className="stat-card">
              <span className="stat-title">Unique Clients</span>
              <div className="stat-value">{salesReport?.summary?.unique_customers || 0}</div>
              <div className="stat-footer">Active buying customers</div>
            </div>
            <div className="stat-card">
              <span className="stat-title">Avg Order Value</span>
              <div className="stat-value">{formatCurrency(salesReport?.summary?.average_order_value)}</div>
              <div className="stat-footer">Average per order</div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid-cols-2" style={{ marginBottom: '24px' }}>
            {/* City Distribution Chart */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '4px' }}>Sales by City</h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '16px' }}>Top cities by sales revenue</p>

              <div style={{ width: '100%', height: 260 }}>
                {loading || !salesReport ? (
                  <div className="skeleton" style={{ width: '100%', height: '100%' }} />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesReport.byCity || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
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
                        formatter={(val) => [formatCurrency(val), 'Revenue']}
                      />
                      <Bar dataKey="revenue" fill="var(--chart-primary)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Category Breakdown Table */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '4px' }}>Sales by Category</h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '16px' }}>Units sold and revenue per category</p>

              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Units Sold</th>
                      <th>Total Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesReport?.byCategory?.map((cat) => (
                      <tr key={cat.category}>
                        <td style={{ fontWeight: 600 }}>{cat.category}</td>
                        <td>{cat.units_sold} units</td>
                        <td style={{ fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(cat.category_revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Customer Insights Tab */
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '4px' }}>Customer Purchasing Trends</h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
            Comparing recent 30-day sales with previous months to identify changes in purchasing
          </p>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Client Account</th>
                  <th>City</th>
                  <th>Value Tier</th>
                  <th>Lifetime Spend</th>
                  <th>Prior 30d Spend</th>
                  <th>Recent 30d Spend</th>
                  <th>30d Trend</th>
                </tr>
              </thead>
              <tbody>
                {customerInsights.map((ci) => {
                  const trendColor = ci.purchase_trend === 'Growing' ? 'var(--success)' : ci.purchase_trend === 'Decreased' ? 'var(--danger)' : 'var(--text-muted)';
                  return (
                    <tr key={ci.customer_id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{ci.customer_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{ci.customer_code}</div>
                      </td>
                      <td>{ci.city}</td>
                      <td>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: ci.value_tier.includes('Tier 1') ? 'var(--info-bg)' : 'var(--bg-card-hover)',
                          color: ci.value_tier.includes('Tier 1') ? 'var(--primary)' : 'var(--text-muted)',
                          border: `1px solid ${ci.value_tier.includes('Tier 1') ? 'var(--info-border)' : 'var(--border-subtle)'}`,
                        }}>
                          {ci.value_tier}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700 }}>{formatCurrency(ci.lifetime_spend)}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{formatCurrency(ci.prior_30d_spend)}</td>
                      <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{formatCurrency(ci.recent_30d_spend)}</td>
                      <td>
                        <span style={{ fontWeight: 700, color: trendColor }}>
                          {ci.purchase_trend === 'Growing' ? '▲ Growing' : ci.purchase_trend === 'Decreased' ? '▼ Decreased' : '● Stable'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
