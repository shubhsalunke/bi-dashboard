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

const CustomerTypeTooltip = ({ active, payload, totalRevenue }) => {
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
      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.customer_type}</div>
      <div className="tabular-nums" style={{ color: 'var(--accent-text)', fontWeight: 600 }}>
        {formatCurrency(row.revenueNum)} ({pct}%)
      </div>
      <div className="tabular-nums" style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
        {row.orders_count} {row.orders_count === 1 ? 'order' : 'orders'} · {row.customers_count}{' '}
        {row.customers_count === 1 ? 'customer' : 'customers'}
      </div>
    </div>
  );
};

export const CustomerTypeDonutChart = ({
  data = [],
  loading = false,
  activeCustomerType = '',
  onSelectCustomerType = null,
}) => {
  const chartData = useMemo(() => {
    return (data || [])
      .map((item) => ({
        ...item,
        customer_type: item.customer_type || 'Unspecified',
        revenueNum: Number(item.revenue) || 0,
      }))
      .filter((item) => item.revenueNum > 0);
  }, [data]);

  const totalRevenue = useMemo(
    () => chartData.reduce((sum, item) => sum + item.revenueNum, 0),
    [chartData]
  );

  const handleSelect = (entry) => {
    if (!onSelectCustomerType || !entry?.customer_type || entry.customer_type === 'Unspecified') return;
    onSelectCustomerType(entry.customer_type === activeCustomerType ? '' : entry.customer_type);
  };

  return (
    <section className="card card-flush" aria-label="Revenue by Customer Type">
      <div className="card-header">
        <h3 className="section-heading" style={{ marginBottom: 0 }}>Revenue by Customer Type</h3>
        {onSelectCustomerType && (
          <span className="chart-hint">
            {activeCustomerType ? `Filtered: ${activeCustomerType}` : 'Click slice to filter'}
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
            <EmptyState
              title="No customer type data"
              description="No revenue records match the active filters."
            />
          </div>
        ) : (
          <div className="donut-layout">
            <div className="donut-chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="revenueNum"
                    nameKey="customer_type"
                    cx="50%"
                    cy="50%"
                    innerRadius="55%"
                    outerRadius="82%"
                    paddingAngle={2}
                    isAnimationActive={false}
                    cursor={onSelectCustomerType ? 'pointer' : 'default'}
                    onClick={(slice) => handleSelect(slice?.payload || slice)}
                  >
                    {chartData.map((entry, idx) => (
                      <Cell
                        key={`ctype-${entry.customer_type}`}
                        fill={DONUT_COLORS[idx % DONUT_COLORS.length]}
                        stroke="var(--bg-surface)"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomerTypeTooltip totalRevenue={totalRevenue} />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="donut-legend">
              {chartData.map((item, idx) => {
                const pct = totalRevenue > 0 ? Math.round((item.revenueNum / totalRevenue) * 100) : 0;
                const isActive = activeCustomerType === item.customer_type;
                return (
                  <button
                    key={item.customer_type}
                    type="button"
                    className={`donut-legend-item ${isActive ? 'active' : ''}`}
                    onClick={() => handleSelect(item)}
                    disabled={!onSelectCustomerType || item.customer_type === 'Unspecified'}
                  >
                    <span
                      className="donut-legend-swatch"
                      style={{ backgroundColor: DONUT_COLORS[idx % DONUT_COLORS.length] }}
                      aria-hidden="true"
                    />
                    <span className="donut-legend-name">{item.customer_type}</span>
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

export default CustomerTypeDonutChart;

