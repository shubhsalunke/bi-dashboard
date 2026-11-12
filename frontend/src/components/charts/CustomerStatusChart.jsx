import React, { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { EmptyState } from '../common/EmptyState';
import {
  CUSTOMER_STATUSES,
  CUSTOMER_STATUS_COLORS,
} from '../../utils/customerOptions';

const CustomerStatusTooltip = ({ active, payload, totalCount }) => {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0]?.payload;
  const pct = totalCount > 0 ? ((row.count / totalCount) * 100).toFixed(1) : '0.0';

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
        {row?.label}
      </div>
      <div className="tabular-nums" style={{ color: 'var(--text-secondary)' }}>
        {Number(row?.count || 0)} {Number(row?.count || 0) === 1 ? 'customer' : 'customers'} ({pct}%)
      </div>
    </div>
  );
};

export const CustomerStatusChart = ({
  customersByStatus = null,
  kpi = null,
  loading = false,
}) => {
  const statusItems = useMemo(() => {
    const map = new Map();
    if (Array.isArray(customersByStatus) && customersByStatus.length > 0) {
      customersByStatus.forEach((item) => {
        map.set(item.status, Number(item.count) || 0);
      });
    } else if (kpi) {
      map.set('active', Number(kpi.active_customers) || 0);
      map.set('inactive', Number(kpi.inactive_customers) || 0);
      map.set('on_hold', Number(kpi.on_hold_customers) || 0);
      map.set('prospect', Number(kpi.prospect_customers) || 0);
      map.set('churned', Number(kpi.churned_customers) || 0);
    }

    return CUSTOMER_STATUSES.map((s) => ({
      status: s.value,
      label: s.label,
      count: map.get(s.value) || 0,
      color: CUSTOMER_STATUS_COLORS[s.value] || 'var(--chart-muted)',
    }));
  }, [customersByStatus, kpi]);

  const pieData = useMemo(
    () => statusItems.filter((item) => item.count > 0),
    [statusItems]
  );

  const totalCount = useMemo(
    () => statusItems.reduce((sum, item) => sum + item.count, 0),
    [statusItems]
  );

  return (
    <section className="card card-flush" aria-label="Customers by Status">
      <div className="card-header">
        <h3 className="section-heading" style={{ marginBottom: 0 }}>Customers by Status</h3>
        {!loading && totalCount > 0 && (
          <span className="tabular-nums" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Total: {totalCount}
          </span>
        )}
      </div>

      <div className="card-body">
        {loading ? (
          <div className="chart-box-sm">
            <div className="skeleton" style={{ width: '100%', height: '100%' }} />
          </div>
        ) : totalCount === 0 ? (
          <div className="chart-box-sm">
            <EmptyState
              title="No customer data"
              description="Customer counts by status will appear once accounts are added."
            />
          </div>
        ) : (
          <div className="donut-layout donut-layout-compact">
            <div className="donut-chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius="56%"
                    outerRadius="84%"
                    paddingAngle={2}
                    isAnimationActive={false}
                  >
                    {pieData.map((entry) => (
                      <Cell
                        key={`status-slice-${entry.status}`}
                        fill={entry.color}
                        stroke="var(--bg-surface)"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomerStatusTooltip totalCount={totalCount} />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="donut-legend">
              {statusItems.map((item) => {
                const pct = totalCount > 0 ? Math.round((item.count / totalCount) * 100) : 0;
                return (
                  <div key={item.status} className="donut-legend-item">
                    <span
                      className="donut-legend-swatch"
                      style={{ backgroundColor: item.color }}
                      aria-hidden="true"
                    />
                    <span className="donut-legend-name">{item.label}</span>
                    <span className="donut-legend-val tabular-nums">
                      {item.count} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default CustomerStatusChart;
