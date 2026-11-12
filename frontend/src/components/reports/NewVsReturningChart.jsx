import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { EmptyState } from '../common/EmptyState';
import { formatMonth } from '../../utils/format';

export const NewVsReturningChart = ({ data = [], loading = false }) => {
  const chartData = useMemo(() => {
    return (data || []).map((row) => ({
      ...row,
      monthLabel: formatMonth(row.month),
      newCount: Number(row.new_customers) || 0,
      returningCount: Number(row.returning_customers) || 0,
    }));
  }, [data]);

  return (
    <section className="card card-flush" aria-label="New vs Returning Customers per Month">
      <div className="card-header">
        <h3 className="section-heading" style={{ marginBottom: 0 }}>New vs Returning Customers</h3>
      </div>

      <div className="card-body">
        <div className="chart-box-sm">
          {loading ? (
            <div className="skeleton" style={{ width: '100%', height: '100%' }} />
          ) : chartData.length === 0 ? (
            <EmptyState
              title="No monthly customer trend data"
              description="New vs returning customer counts will appear once sales match the active filters."
            />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barCategoryGap="24%" margin={{ top: 16, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis
                  dataKey="monthLabel"
                  axisLine={{ stroke: 'var(--border)' }}
                  tickLine={false}
                  tick={{ fill: 'var(--chart-axis)', fontSize: 12 }}
                  dy={6}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--chart-axis)', fontSize: 12 }}
                  width={40}
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
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar
                  dataKey="newCount"
                  name="New Customers"
                  fill="var(--accent)"
                  radius={[2, 2, 0, 0]}
                  maxBarSize={36}
                  isAnimationActive={false}
                />
                <Bar
                  dataKey="returningCount"
                  name="Returning Customers"
                  fill="var(--success)"
                  radius={[2, 2, 0, 0]}
                  maxBarSize={36}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </section>
  );
};

export default NewVsReturningChart;

