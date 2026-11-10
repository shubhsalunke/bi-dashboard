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
import { EmptyState } from '../common/EmptyState';
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
  const diffDays = startDate && endDate
    ? Math.round((Date.parse(endDate) - Date.parse(startDate)) / 86400000)
    : null;
  const isAllTime = !startDate && !endDate;
  const is30Days = diffDays === 30;
  const is90Days = diffDays === 90;

  const cityChartData = (salesReport?.byCity || []).map((c) => ({
    ...c,
    revenueNum: Number(c.revenue) || 0,
  }));

  return (
    <div className="stack-lg">
      <div className="filter-bar" style={{ marginBottom: 0 }}>
        <div className="segmented-group" role="group" aria-label="Report date presets">
          <button
            type="button"
            className={`segmented-btn ${isAllTime ? 'active' : ''}`}
            onClick={() => handlePreset(null)}
          >
            All Time
          </button>
          <button
            type="button"
            className={`segmented-btn ${is30Days ? 'active' : ''}`}
            onClick={() => handlePreset(30)}
          >
            30 Days
          </button>
          <button
            type="button"
            className={`segmented-btn ${is90Days ? 'active' : ''}`}
            onClick={() => handlePreset(90)}
          >
            90 Days
          </button>
        </div>

        <div className="date-range-group">
          <input
            type="date"
            aria-label="Start date"
            className="form-control"
            style={{ width: '144px' }}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <span className="date-range-sep">to</span>
          <input
            type="date"
            aria-label="End date"
            className="form-control"
            style={{ width: '144px' }}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <select
          className="form-control filter-select"
          aria-label="Filter by city"
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

      <div className="grid-cols-4">
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

      <section className="card" aria-label="Monthly Revenue">
        <h3 className="section-heading">Monthly Revenue</h3>
        <p className="section-subheading" style={{ marginBottom: peakMonth ? 'var(--space-1)' : 'var(--space-4)' }}>
          Monthly sales revenue over time
        </p>
        {peakMonth && (
          <p className="chart-insight-sentence">
            Highest sales in {peakMonth.month}:{' '}
            <span className="chart-insight-highlight">{formatCompactCurrency(peakMonth.revenueNum)}</span>
          </p>
        )}

        <div className="chart-box">
          {loading || !salesReport ? (
            <div className="skeleton" style={{ width: '100%', height: '100%' }} />
          ) : monthlyTimeline.length === 0 ? (
            <EmptyState
              title="No monthly sales data"
              description="No revenue records match the selected date and city filters."
            />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTimeline} margin={{ top: 8, right: 16, left: 4, bottom: 4 }}>
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
                    const isPeak = peakMonth && props.payload.month === peakMonth.month;
                    return (
                      <circle
                        key={props.key || props.index}
                        cx={props.cx}
                        cy={props.cy}
                        r={isPeak ? 5 : 3}
                        fill={isPeak ? 'var(--accent-text)' : 'var(--bg-surface)'}
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
        <section className="card" aria-label="Sales by City">
          <h3 className="section-heading">Sales by City</h3>
          <p className="section-subheading" style={{ marginBottom: peakCity ? 'var(--space-1)' : 'var(--space-4)' }}>
            Revenue generated per city
          </p>
          {peakCity && (
            <p className="chart-insight-sentence">
              Highest city sales in {peakCity.city}:{' '}
              <span className="chart-insight-highlight">{formatCompactCurrency(peakCity.revenue)}</span>
            </p>
          )}

          <div className="chart-box-sm">
            {loading || !salesReport ? (
              <div className="skeleton" style={{ width: '100%', height: '100%' }} />
            ) : cityChartData.length === 0 ? (
              <EmptyState
                title="No city data"
                description="No city-level sales recorded for this filter."
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cityChartData} margin={{ top: 8, right: 8, left: 4, bottom: 4 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--chart-grid)" />
                  <XAxis
                    dataKey="city"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--chart-axis)', fontSize: 11 }}
                    dy={6}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--chart-axis)', fontSize: 11 }}
                    tickFormatter={(v) => formatCompactCurrency(v)}
                    width={54}
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
                  <Bar dataKey="revenueNum" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                    {cityChartData.map((entry, index) => {
                      const isPeak = peakCity && entry.city === peakCity.city;
                      return (
                        <Cell
                          key={`cell-${index}`}
                          fill={isPeak ? 'var(--accent)' : 'var(--chart-muted)'}
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="card card-flush" aria-label="Sales by Category">
          <div className="card-header">
            <div>
              <h3 className="section-heading" style={{ marginBottom: 0 }}>Sales by Category</h3>
              <p className="section-subheading" style={{ marginBottom: 0 }}>
                Revenue contribution per category
              </p>
            </div>
          </div>

          {!salesReport?.byCategory || salesReport.byCategory.length === 0 ? (
            <EmptyState
              title="No category breakdown"
              description="No category sales found for the selected filters."
            />
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th className="num">Units</th>
                    <th className="num">Share</th>
                    <th className="num">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {salesReport.byCategory.map((cat) => {
                    const sharePct = Math.round(((Number(cat.category_revenue) || 0) / totalPeriodRevenue) * 100);
                    return (
                      <tr key={cat.category}>
                        <td className="cell-primary">{cat.category}</td>
                        <td className="num">{cat.units_sold}</td>
                        <td className="num">
                          <div className="share-bar-cell">
                            <div className="share-bar-track" aria-hidden="true">
                              <div
                                className="share-bar-fill"
                                style={{ width: `${Math.min(sharePct, 100)}%` }}
                              />
                            </div>
                            <span className="tabular-nums" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', minWidth: '32px' }}>
                              {sharePct}%
                            </span>
                          </div>
                        </td>
                        <td className="num cell-primary">{formatCurrency(cat.category_revenue)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default SalesReportTab;
