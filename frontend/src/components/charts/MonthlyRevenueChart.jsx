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

const PeriodTrendTooltip = ({ active, payload, label, metric }) => {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0]?.payload;
  const count = row?.ordersVal ?? 0;

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
      {metric === 'orders' ? (
        <>
          <div className="tabular-nums" style={{ color: 'var(--accent-text)', fontWeight: 600 }}>
            {count} {count === 1 ? 'sale' : 'sales'}
          </div>
          <div className="tabular-nums" style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
            {formatCurrency(row?.revenueVal)}
          </div>
        </>
      ) : (
        <>
          <div className="tabular-nums" style={{ color: 'var(--accent-text)', fontWeight: 600 }}>
            {formatCurrency(row?.revenueVal)}
          </div>
          <div className="tabular-nums" style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
            {count} {count === 1 ? 'order' : 'orders'}
          </div>
        </>
      )}
    </div>
  );
};

export const MonthlyRevenueChart = ({
  data = [],
  loading = false,
  emptyTitle = 'No revenue data',
  emptyDescription = 'No monthly sales were found for the selected date range.',
  metric = 'revenue',
  granularity = 'monthly',
  ordersLabel = 'Number of Sales',
  onMetricChange = null,
  onGranularityChange = null,
}) => {
  const normalizedData = useMemo(() => {
    return (data || []).map((item) => {
      const revenueVal = Number(item.revenueNum ?? item.revenue) || 0;
      const ordersVal = Number(item.ordersNum ?? item.order_count ?? item.sales_count) || 0;
      return {
        ...item,
        axisLabel: item.periodLabel || item.monthLabel || item.period || item.month || '',
        revenueVal,
        ordersVal,
        activeVal: metric === 'orders' ? ordersVal : revenueVal,
      };
    });
  }, [data, metric]);

  const avgValue = useMemo(() => {
    if (normalizedData.length === 0) return 0;
    const total = normalizedData.reduce((sum, item) => sum + item.activeVal, 0);
    return total / normalizedData.length;
  }, [normalizedData]);

  const showPointLabels = normalizedData.length > 0 && normalizedData.length <= 10;
  const heading =
    granularity === 'weekly'
      ? metric === 'orders'
        ? 'Weekly Sales'
        : 'Weekly Revenue'
      : metric === 'orders'
        ? 'Monthly Sales'
        : 'Monthly Revenue';

  return (
    <section className="card card-flush" aria-label={heading}>
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <h3 className="section-heading" style={{ marginBottom: 0 }}>{heading}</h3>
          {!loading && normalizedData.length > 0 && (
            <span className="tabular-nums" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Avg:{' '}
              {metric === 'orders'
                ? `${avgValue.toFixed(1)} sales`
                : formatCurrency(avgValue)}{' '}
              / {granularity === 'weekly' ? 'week' : 'month'}
            </span>
          )}
        </div>

        {(onMetricChange || onGranularityChange) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            {onMetricChange && (
              <div className="segmented-group" role="group" aria-label="Chart metric toggle">
                <button
                  type="button"
                  className={`segmented-btn ${metric === 'revenue' ? 'active' : ''}`}
                  onClick={() => onMetricChange('revenue')}
                >
                  Revenue
                </button>
                <button
                  type="button"
                  className={`segmented-btn ${metric === 'orders' ? 'active' : ''}`}
                  onClick={() => onMetricChange('orders')}
                >
                  {ordersLabel}
                </button>
              </div>
            )}

            {onGranularityChange && (
              <div className="segmented-group" role="group" aria-label="Chart period toggle">
                <button
                  type="button"
                  className={`segmented-btn ${granularity === 'monthly' ? 'active' : ''}`}
                  onClick={() => onGranularityChange('monthly')}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  className={`segmented-btn ${granularity === 'weekly' ? 'active' : ''}`}
                  onClick={() => onGranularityChange('weekly')}
                >
                  Weekly
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="card-body">
        <div className="chart-box">
          {loading ? (
            <div className="skeleton" style={{ width: '100%', height: '100%' }} />
          ) : normalizedData.length === 0 ? (
            <EmptyState
              title={emptyTitle}
              description={emptyDescription}
            />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={normalizedData}
                margin={{ top: showPointLabels ? 24 : 12, right: 28, left: 4, bottom: 4 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis
                  dataKey="axisLabel"
                  axisLine={{ stroke: 'var(--border)' }}
                  tickLine={false}
                  tick={{ fill: 'var(--chart-axis)', fontSize: 12 }}
                  padding={{ left: 28, right: 28 }}
                  dy={6}
                />
                <YAxis
                  allowDecimals={metric !== 'orders'}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--chart-axis)', fontSize: 12 }}
                  tickFormatter={(v) => (metric === 'orders' ? String(v) : formatChartValue(v))}
                  padding={{ top: 20 }}
                  width={52}
                />
                <Tooltip
                  cursor={{ stroke: 'var(--border-strong)', strokeWidth: 1, strokeDasharray: '3 3' }}
                  content={<PeriodTrendTooltip metric={metric} />}
                />
                <Line
                  type="linear"
                  dataKey="activeVal"
                  stroke="var(--accent)"
                  strokeWidth={2}
                  dot={{ r: 4.5, fill: 'var(--bg-surface)', stroke: 'var(--accent)', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: 'var(--accent)', stroke: 'var(--bg-surface)', strokeWidth: 2 }}
                  isAnimationActive={false}
                >
                  {showPointLabels && (
                    <LabelList
                      dataKey="activeVal"
                      position="top"
                      offset={10}
                      formatter={(v) => {
                        const n = Number(v);
                        if (n <= 0) return '';
                        return metric === 'orders' ? String(n) : formatChartValue(n);
                      }}
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
