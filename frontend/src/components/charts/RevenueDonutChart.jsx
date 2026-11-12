import React, { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { EmptyState } from '../common/EmptyState';
import { formatCurrency } from '../../utils/format';

const DONUT_COLORS = [
  'var(--accent)',
  'var(--success)',
  'var(--warning)',
  'var(--chart-muted)',
  'var(--danger)',
];

const RevenueDonutTooltip = ({ active, payload, totalRevenue }) => {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0]?.payload;
  const pct = totalRevenue > 0 ? ((row.revenueNum / totalRevenue) * 100).toFixed(1) : '0.0';

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
      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.label}</div>
      <div className="tabular-nums" style={{ color: 'var(--accent-text)', fontWeight: 600 }}>
        {formatCurrency(row.revenueNum)} ({pct}%)
      </div>
      {row.units_sold !== undefined && (
        <div className="tabular-nums" style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
          {Number(row.units_sold)} units
        </div>
      )}
    </div>
  );
};

export const RevenueDonutChart = ({
  title,
  data = [],
  dataKey,
  valueKey = 'revenue',
  loading = false,
  emptyTitle = 'No data available',
  emptyDescription = 'No records match the active filters.',
  activeValue = '',
  onSelect = null,
}) => {
  const chartData = useMemo(() => {
    return (data || [])
      .map((item) => ({
        ...item,
        label: item[dataKey] || 'Unspecified',
        revenueNum: Number(item[valueKey]) || 0,
      }))
      .filter((item) => item.revenueNum > 0);
  }, [data, dataKey, valueKey]);

  const totalRevenue = useMemo(
    () => chartData.reduce((sum, item) => sum + item.revenueNum, 0),
    [chartData]
  );

  const handleSelect = (entry) => {
    if (!onSelect || !entry?.label || entry.label === 'Unspecified') return;
    onSelect(entry.label === activeValue ? '' : entry.label);
  };

  return (
    <section className="card card-flush" aria-label={title}>
      <div className="card-header">
        <h3 className="section-heading" style={{ marginBottom: 0 }}>{title}</h3>
        {onSelect && (
          <span className="chart-hint">
            {activeValue ? `Filtered: ${activeValue} (click to clear)` : 'Click slice to filter'}
          </span>
        )}
      </div>

      <div className="card-body">
        {loading ? (
          <div className="chart-box-sm">
            <div className="skeleton" style={{ width: '100%', height: '100%' }} />
          </div>
        ) : chartData.length === 0 ? (
          <div className="chart-box-sm">
            <EmptyState title={emptyTitle} description={emptyDescription} />
          </div>
        ) : (
          <div className="donut-layout">
            <div className="donut-chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="revenueNum"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius="55%"
                    outerRadius="82%"
                    paddingAngle={2}
                    isAnimationActive={false}
                    cursor={onSelect ? 'pointer' : 'default'}
                    onClick={(slice) => handleSelect(slice?.payload || slice)}
                  >
                    {chartData.map((entry, idx) => (
                      <Cell
                        key={`${title}-${entry.label}`}
                        fill={DONUT_COLORS[idx % DONUT_COLORS.length]}
                        stroke="var(--bg-surface)"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<RevenueDonutTooltip totalRevenue={totalRevenue} />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="donut-legend">
              {chartData.map((item, idx) => {
                const pct = totalRevenue > 0 ? Math.round((item.revenueNum / totalRevenue) * 100) : 0;
                const isActive = activeValue === item.label;
                return (
                  <button
                    key={item.label}
                    type="button"
                    className={`donut-legend-item ${isActive ? 'active' : ''}`}
                    onClick={() => handleSelect(item)}
                    disabled={!onSelect || item.label === 'Unspecified'}
                  >
                    <span
                      className="donut-legend-swatch"
                      style={{ backgroundColor: DONUT_COLORS[idx % DONUT_COLORS.length] }}
                      aria-hidden="true"
                    />
                    <span className="donut-legend-name">{item.label}</span>
                    <span className="donut-legend-val tabular-nums">
                      {formatCurrency(item.revenueNum)} ({pct}%)
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default RevenueDonutChart;

