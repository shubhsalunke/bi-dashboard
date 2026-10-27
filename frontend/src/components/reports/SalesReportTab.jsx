import React from 'react';
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
import { StatCard } from '../common/StatCard';
import { CardSkeleton } from '../common/LoadingSkeleton';
import { formatCurrency, formatCompactCurrency } from '../../utils/format';

const CITIES = ['Pune', 'Mumbai', 'Nagpur', 'Nashik', 'Aurangabad', 'Hyderabad', 'Delhi'];

export const SalesReportTab = ({
  loading,
  salesReport,
  startDate,
  endDate,
  cityFilter,
  setStartDate,
  setEndDate,
  setCityFilter,
  handlePreset,
  monthlyTimeline,
  peakMonth,
  peakCity,
  totalPeriodRevenue,
}) => {
  return (
    <>
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
          style={{ width: '140px' }}
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
        >
          <option value="">All Cities</option>
          {CITIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {(startDate || endDate || cityFilter) && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => { setStartDate(''); setEndDate(''); setCityFilter(''); }}
          >
            Reset
          </button>
        )}
      </div>

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
              title="Total Sales"
              value={salesReport.summary?.total_orders || 0}
              subtitle="Orders processed"
            />
            <StatCard
              title="Total Revenue"
              value={formatCurrency(salesReport.summary?.total_revenue)}
              subtitle="Gross revenue"
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

      <div className="grid-cols-2" style={{ marginBottom: '20px' }}>
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
  );
};

export default SalesReportTab;
