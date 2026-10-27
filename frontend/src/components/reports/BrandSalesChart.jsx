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
    <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '4px' }}>Revenue by Brand</h3>
      <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
        Total sales revenue per product brand
      </p>

      {topBrand && topBrand.revenue > 0 ? (
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-main)', marginBottom: '14px', fontWeight: 500 }}>
          {topBrand.brand} generated the highest revenue among all brands at {formatCurrency(topBrand.revenue)}.
        </p>
      ) : (
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
          No brand revenue data available.
        </p>
      )}

      <div style={{ width: '100%', height: 260 }}>
        {loading ? (
          <div className="skeleton" style={{ width: '100%', height: '100%' }} />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="brand" stroke="var(--chart-axis)" fontSize={11} tickLine={false} />
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
                {chartData.map((entry, index) => {
                  const isTop = topBrand && entry.brand === topBrand.brand;
                  return <Cell key={`brand-cell-${index}`} fill={isTop ? '#0d9488' : '#94a3b8'} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default BrandSalesChart;
