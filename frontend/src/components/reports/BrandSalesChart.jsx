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

export const BrandSalesChart = ({
  brandSales = [],
  loading = false,
  activeBrand = '',
  onSelectBrand = null,
}) => {
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

  const handleBarClick = (entry) => {
    if (!onSelectBrand || !entry?.brand || entry.brand === 'Unspecified') return;
    onSelectBrand(entry.brand === activeBrand ? '' : entry.brand);
  };

  return (
    <section className="card card-flush" aria-label="Revenue by Brand">
      <div className="card-header">
        <h3 className="section-heading" style={{ marginBottom: 0 }}>Revenue by Brand</h3>
        {onSelectBrand && (
          <span className="chart-hint">
            {activeBrand ? `Filtered: ${activeBrand} (click bar to clear)` : 'Click a bar to filter'}
          </span>
        )}
      </div>

      <div className="card-body">
        <div className="chart-box-sm">
          {loading ? (
            <div className="skeleton" style={{ width: '100%', height: '100%' }} />
          ) : chartData.length === 0 ? (
            <EmptyState
              title="No brand revenue data"
              description="Brand sales breakdown will appear once product sales match the active filters."
            />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barCategoryGap="24%" margin={{ top: chartData.length <= 6 ? 20 : 12, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis
                  dataKey="brand"
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
                  dataKey="revenue"
                  radius={[2, 2, 0, 0]}
                  maxBarSize={52}
                  isAnimationActive={false}
                  cursor={onSelectBrand ? 'pointer' : 'default'}
                  onClick={(barData) => handleBarClick(barData?.payload || barData)}
                >
                  {chartData.map((entry, index) => {
                    const isHighlighted = activeBrand
                      ? entry.brand === activeBrand
                      : topBrand && entry.brand === topBrand.brand;
                    return (
                      <Cell
                        key={`brand-cell-${index}`}
                        fill={isHighlighted ? 'var(--accent)' : 'var(--chart-muted)'}
                      />
                    );
                  })}
                  {chartData.length <= 6 && (
                    <LabelList
                      dataKey="revenue"
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

export default BrandSalesChart;
