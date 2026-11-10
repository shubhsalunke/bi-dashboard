import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { EmptyState } from '../common/EmptyState';
import { formatCurrency, formatCompactCurrency } from '../../utils/format';

export const BrandSalesChart = ({ brandSales = [], loading = false }) => {
  const chartData = useMemo(() => {
    return (brandSales || []).map((b) => ({
      brand: b.brand,
      revenue: Number(b.total_revenue) || 0,
      units: Number(b.units_sold) || 0,
    }));
  }, [brandSales]);

  const topBrand = useMemo(() => {
    if (!chartData || chartData.length === 0) return null;
    return chartData.reduce(
      (max, item) => (item.revenue > (max?.revenue || 0) ? item : max),
      chartData[0]
    );
  }, [chartData]);

  return (
    <section className="card" aria-label="Revenue by Brand">
      <h3 className="section-heading">Revenue by Brand</h3>
      <p className="section-subheading" style={{ marginBottom: topBrand && topBrand.revenue > 0 ? 'var(--space-1)' : 'var(--space-4)' }}>
        Total sales revenue per product brand
      </p>

      {topBrand && topBrand.revenue > 0 && (
        <p className="chart-insight-sentence">
          {topBrand.brand} generated the highest revenue among all brands at{' '}
          <span className="chart-insight-highlight">{formatCurrency(topBrand.revenue)}</span>.
        </p>
      )}

      <div className="chart-box">
        {loading ? (
          <div className="skeleton" style={{ width: '100%', height: '100%' }} />
        ) : chartData.length === 0 ? (
          <EmptyState
            title="No brand revenue data"
            description="Brand sales breakdown will appear once product sales are recorded."
          />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 16, left: 4, bottom: 4 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis
                dataKey="brand"
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
              <Bar dataKey="revenue" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                {chartData.map((entry, index) => {
                  const isTop = topBrand && entry.brand === topBrand.brand;
                  return (
                    <Cell
                      key={`brand-cell-${index}`}
                      fill={isTop ? 'var(--accent)' : 'var(--chart-muted)'}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
};

export default BrandSalesChart;
