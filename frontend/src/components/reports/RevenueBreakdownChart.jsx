import React, { useMemo } from 'react';
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
import { EmptyState } from '../common/EmptyState';
import { formatCurrency, formatChartValue } from '../../utils/format';

export const RevenueBreakdownChart = ({
  title,
  data = [],
  dataKey,
  valueKey = 'revenue',
  loading = false,
  emptyTitle = 'No data available',
  emptyDescription = 'No sales records match the active filters.',
  activeValue = '',
  onSelect = null,
}) => {
  const chartData = useMemo(() => {
    return (data || []).map((item) => ({
      ...item,
      label: item[dataKey] || 'Unspecified',
      revenueNum: Number(item[valueKey]) || 0,
    }));
  }, [data, dataKey, valueKey]);

  const peakItem = useMemo(() => {
    if (chartData.length === 0) return null;
    return chartData.reduce(
      (max, item) => (item.revenueNum > (max?.revenueNum || 0) ? item : max),
      chartData[0]
    );
  }, [chartData]);

  const handleBarClick = (entry) => {
    if (!onSelect || !entry?.label || entry.label === 'Unspecified') return;
    onSelect(entry.label === activeValue ? '' : entry.label);
  };

  return (
    <section className="card card-flush" aria-label={title}>
      <div className="card-header">
        <h3 className="section-heading" style={{ marginBottom: 0 }}>{title}</h3>
        {onSelect && (
          <span className="chart-hint">
            {activeValue ? `Filtered: ${activeValue} (click bar to clear)` : 'Click a bar to filter'}
          </span>
        )}
      </div>

      <div className="card-body">
        <div className="chart-box-sm">
          {loading ? (
            <div className="skeleton" style={{ width: '100%', height: '100%' }} />
          ) : chartData.length === 0 ? (
            <EmptyState title={emptyTitle} description={emptyDescription} />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                barCategoryGap="24%"
                margin={{ top: chartData.length <= 6 ? 20 : 12, right: 8, left: 0, bottom: 4 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis
                  dataKey="label"
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
                <Bar
                  dataKey="revenueNum"
                  radius={[2, 2, 0, 0]}
                  maxBarSize={52}
                  isAnimationActive={false}
                  cursor={onSelect ? 'pointer' : 'default'}
                  onClick={(barData) => handleBarClick(barData?.payload || barData)}
                >
                  {chartData.map((entry, index) => {
                    const isHighlighted = activeValue
                      ? entry.label === activeValue
                      : peakItem && entry.label === peakItem.label;
                    return (
                      <Cell
                        key={`${title}-cell-${index}`}
                        fill={isHighlighted ? 'var(--accent)' : 'var(--chart-muted)'}
                      />
                    );
                  })}
                  {chartData.length <= 6 && (
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
  );
};

export default RevenueBreakdownChart;

