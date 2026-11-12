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

const TopCustomerTooltip = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0]?.payload;

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
      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.customer_name}</div>
      <div className="tabular-nums" style={{ color: 'var(--accent-text)', fontWeight: 600 }}>
        {formatCurrency(row.revenueNum)}
      </div>
      <div className="tabular-nums" style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
        {row.orders_count} {row.orders_count === 1 ? 'order' : 'orders'} · {row.city}
      </div>
    </div>
  );
};

export const TopCustomersBarChart = ({ data = [], loading = false }) => {
  const chartData = useMemo(() => {
    return (data || []).slice(0, 10).map((item) => ({
      ...item,
      revenueNum: Number(item.total_revenue) || 0,
      shortName:
        item.customer_name && item.customer_name.length > 22
          ? `${item.customer_name.slice(0, 20)}...`
          : item.customer_name || '',
    }));
  }, [data]);

  const chartHeight = Math.max(240, chartData.length * 36 + 32);

  return (
    <section className="card card-flush" aria-label="Top 10 Customers by Revenue">
      <div className="card-header">
        <h3 className="section-heading" style={{ marginBottom: 0 }}>Top 10 Customers by Revenue</h3>
      </div>

      <div className="card-body">
        {loading ? (
          <div className="chart-box-sm">
            <div className="skeleton" style={{ width: '100%', height: '100%' }} />
          </div>
        ) : chartData.length === 0 ? (
          <div className="chart-box-sm">
            <EmptyState
              title="No customer revenue data"
              description="No top customer records match the active filters."
            />
          </div>
        ) : (
          <div style={{ width: '100%', height: `${chartHeight}px` }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 8, right: 56, left: 8, bottom: 8 }}
              >
                <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis
                  type="number"
                  axisLine={{ stroke: 'var(--border)' }}
                  tickLine={false}
                  tick={{ fill: 'var(--chart-axis)', fontSize: 12 }}
                  tickFormatter={(v) => formatChartValue(v)}
                />
                <YAxis
                  type="category"
                  dataKey="shortName"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                  width={150}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(37, 99, 235, 0.06)' }}
                  content={<TopCustomerTooltip />}
                />
                <Bar dataKey="revenueNum" radius={[0, 2, 2, 0]} maxBarSize={24} isAnimationActive={false}>
                  {chartData.map((entry, idx) => (
                    <Cell
                      key={`top-cust-${entry.customer_id || idx}`}
                      fill={idx === 0 ? 'var(--accent)' : 'var(--chart-muted)'}
                    />
                  ))}
                  <LabelList
                    dataKey="revenueNum"
                    position="right"
                    offset={6}
                    formatter={(v) => formatChartValue(v)}
                    fill="var(--text-secondary)"
                    fontSize={12}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </section>
  );
};

export default TopCustomersBarChart;

