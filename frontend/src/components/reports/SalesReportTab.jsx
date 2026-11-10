import React from 'react';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
  ResponsiveContainer,
} from 'recharts';
import { StatCard } from '../common/StatCard';
import { EmptyState } from '../common/EmptyState';
import { CardSkeleton } from '../common/LoadingSkeleton';
import { MonthlyRevenueChart } from '../charts/MonthlyRevenueChart';
import { formatCurrency, formatChartValue, formatMonth } from '../../utils/format';

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
  peakCity,
  totalPeriodRevenue,
}) => {
  const diffDays = startDate && endDate
    ? Math.round((Date.parse(endDate) - Date.parse(startDate)) / 86400000)
    : null;
  const isAllTime = !startDate && !endDate;
  const is30Days = diffDays === 30;
  const is90Days = diffDays === 90;

  const monthlyChartData = (monthlyTimeline || []).map((m) => ({
    ...m,
    monthLabel: formatMonth(m.month),
  }));

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
            />
            <StatCard
              title="Total Revenue"
              value={formatCurrency(salesReport.summary?.total_revenue)}
            />
            <StatCard
              title="Unique Customers"
              value={salesReport.summary?.unique_customers || 0}
            />
            <StatCard
              title="Average Order Value"
              value={formatCurrency(salesReport.summary?.average_order_value)}
            />
          </>
        )}
      </div>

      <MonthlyRevenueChart
        data={monthlyChartData}
        loading={loading || !salesReport}
        emptyTitle="No monthly sales data"
        emptyDescription="No revenue records match the selected date and city filters."
      />

      <div className="grid-cols-2">
        <section className="card card-flush" aria-label="Sales by City">
          <div className="card-header">
            <h3 className="section-heading" style={{ marginBottom: 0 }}>Sales by City</h3>
          </div>

          <div className="card-body">
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
                  <BarChart data={cityChartData} barCategoryGap="24%" margin={{ top: cityChartData.length <= 6 ? 20 : 12, right: 8, left: 0, bottom: 4 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--chart-grid)" />
                    <XAxis
                      dataKey="city"
                      axisLine={{ stroke: 'var(--border)' }}
                      tickLine={false}
                      tick={{ fill: 'var(--chart-axis)', fontSize: 12 }}
                      dy={6}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'var(--chart-axis)', fontSize: 12 }}
                      tickFormatter={(v) => formatChartValue(v)}
                      padding={{ top: 20 }}
                      width={52}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(37, 99, 235, 0.06)' }}
                      contentStyle={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-strong)',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: 'var(--shadow-md)',
                        color: 'var(--text-primary)',
                        fontSize: '0.8125rem',
                      }}
                      formatter={(val) => [formatCurrency(val), 'Revenue']}
                    />
                    <Bar dataKey="revenueNum" radius={[2, 2, 0, 0]} maxBarSize={52} isAnimationActive={false}>
                      {cityChartData.map((entry, index) => {
                        const isPeak = peakCity && entry.city === peakCity.city;
                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={isPeak ? 'var(--accent)' : 'var(--chart-muted)'}
                          />
                        );
                      })}
                      {cityChartData.length <= 6 && (
                        <LabelList
                          dataKey="revenueNum"
                          position="top"
                          offset={6}
                          formatter={(v) => (Number(v) > 0 ? formatChartValue(v) : '')}
                          fill="var(--text-secondary)"
                          fontSize={12}
                        />
                      )}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </section>

        <section className="card card-flush" aria-label="Sales by Category">
          <div className="card-header">
            <h3 className="section-heading" style={{ marginBottom: 0 }}>Sales by Category</h3>
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
