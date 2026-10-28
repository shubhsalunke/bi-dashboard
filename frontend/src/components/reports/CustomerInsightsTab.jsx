import React from 'react';
import { Search } from 'lucide-react';
import { EmptyState } from '../common/EmptyState';
import { Badge } from '../common/Badge';
import { formatCurrency } from '../../utils/format';

export const CustomerInsightsTab = ({
  insights,
  search,
  setSearch,
  trendFilter,
  setTrendFilter,
  searchInputRef,
}) => {
  return (
    <div>
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search size={15} className="search-icon" />
          <input
            ref={searchInputRef}
            type="text"
            className="form-control search-input"
            placeholder="Search customers by name, code, or city... (Press / to search)"
            maxLength={100}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="form-control"
          style={{ width: '150px' }}
          value={trendFilter}
          onChange={(e) => setTrendFilter(e.target.value)}
        >
          <option value="all">All Trends</option>
          <option value="Growing">Growing</option>
          <option value="Stable">Stable</option>
          <option value="Decreased">Decreased</option>
        </select>

        {(search || trendFilter !== 'all') && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => { setSearch(''); setTrendFilter('all'); }}
          >
            Reset
          </button>
        )}
      </div>

      <div className="glass-panel" style={{ padding: '20px' }}>
        {insights.length === 0 ? (
          <EmptyState
            title="No customer insights found"
            description={
              search || trendFilter !== 'all'
                ? 'No customer records match your filter criteria.'
                : 'No customer trend data available yet.'
            }
            action={
              (search || trendFilter !== 'all') ? (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => { setSearch(''); setTrendFilter('all'); }}
                >
                  Clear Filters
                </button>
              ) : null
            }
          />
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>City</th>
                  <th>Tier</th>
                  <th>Lifetime Spend</th>
                  <th>Last 30 Days</th>
                  <th>Trend</th>
                </tr>
              </thead>
              <tbody>
                {insights.map((ci) => {
                  const badgeStatus =
                    ci.purchase_trend === 'Growing'
                      ? 'active'
                      : ci.purchase_trend === 'Decreased'
                      ? 'danger'
                      : 'pending';
                  return (
                    <tr key={ci.customer_code}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{ci.customer_name}</div>
                        <div className="tabular-nums" style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{ci.customer_code}</div>
                      </td>
                      <td>{ci.city}</td>
                      <td>{ci.value_tier}</td>
                      <td className="tabular-nums" style={{ fontWeight: 600 }}>{formatCurrency(ci.lifetime_spend)}</td>
                      <td className="tabular-nums">{formatCurrency(ci.recent_30d_spend)}</td>
                      <td>
                        <Badge status={badgeStatus} label={ci.purchase_trend} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerInsightsTab;
