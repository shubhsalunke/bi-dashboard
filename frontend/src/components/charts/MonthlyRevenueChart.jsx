import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
  ResponsiveContainer,
} from 'recharts';
import { EmptyState } from '../common/EmptyState';
import { formatCurrency, formatChartValue } from '../../utils/format';

const MonthlyRevenueTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0]?.payload;
  const count = row?.sales_count ?? row?.ordersNum;

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-strong)',
        borderRadius: 'var(--radius-md)',
        padding: '8px 12px',
        boxShadow: 'var(--shadow-md)',
        fontSize: '13px',
        lineHeight: 1.5,
      }}
    >
      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
        {label}
      </div>
      <div className="tabular-nums" style={{ color: 'var(--accent-text)', fontWeight: 600 }}>
        {formatCurrency(row?.revenueNum)}
      </div>
      {count !== undefined && count !== null && (
        <div className="tabular-nums" style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
          {Number(count)} {Number(count) === 1 ? 'order' : 'orders'}
        </div>
      )}
    </div>
  );
};

export const MonthlyRevenueChart = ({
  data = [],
  loading = false,
  emptyTitle = 'No revenue data',
  emptyDescription = 'No monthly sales were found for the selected date range.',
}) => {
  const avgMonthly = useMemo(() => {
    if (!data || data.length === 0) return 0;
    const total = data.reduce((sum, item) => sum + (Number(item.revenueNum) || 0), 0);
    return total / data.length;
  }, [data]);

  const showPointLabels = data.length > 0 && data.length <= 8;

  return (
    <section className="card card-flush" aria-label="Monthly Revenue">
      <div className="card-header">
        <h3 className="section-heading" style={{ marginBottom: 0 }}>Monthly Revenue</h3>
        {!loading && data.length > 0 && (
          <span className="tabular-nums" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Avg: {formatCurrency(avgMonthly)} / month
          </span>
        )}
      </div>

      <div className="card-body">
        <div className="chart-box">
          {loading ? (
            <div className="skeleton" style={{ width: '100%', height: '100%' }} />
          ) : data.length === 0 ? (
            <EmptyState
              title={emptyTitle}
              description={emptyDescription}
            />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{ top: showPointLabels ? 24 : 12, right: 28, left: 4, bottom: 4 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis
                  dataKey="monthLabel"
                  axisLine={{ stroke: 'var(--border)' }}
                  tickLine={false}
                  tick={{ fill: 'var(--chart-axis)', fontSize: 12 }}
                  padding={{ left: 28, right: 28 }}
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
                  cursor={{ stroke: 'var(--border-strong)', strokeWidth: 1, strokeDasharray: '3 3' }}
                  content={<MonthlyRevenueTooltip />}
                />
                <Line
                  type="linear"
                  dataKey="revenueNum"
                  stroke="var(--accent)"
                  strokeWidth={2}
                  dot={{ r: 4.5, fill: 'var(--bg-surface)', stroke: 'var(--accent)', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: 'var(--accent)', stroke: 'var(--bg-surface)', strokeWidth: 2 }}
                  isAnimationActive={false}
                >
                  {showPointLabels && (
                    <LabelList
                      dataKey="revenueNum"
                      position="top"
                      offset={10}
                      formatter={(v) => (Number(v) > 0 ? formatChartValue(v) : '')}
                      fill="var(--text-secondary)"
                      fontSize={12}
                    />
                  )}
                </Line>
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </section>
  );
};

export default MonthlyRevenueChart;
