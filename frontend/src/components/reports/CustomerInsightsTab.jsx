import React from 'react';
import { Search } from 'lucide-react';
import { EmptyState } from '../common/EmptyState';
import { Badge } from '../common/Badge';
import { NewVsReturningChart } from './NewVsReturningChart';
import { CustomerStatusChart } from '../charts/CustomerStatusChart';
import { formatCurrency } from '../../utils/format';

export const CustomerInsightsTab = ({
  insights,
  newVsReturningByMonth = [],
  customersByStatus = [],
  loading = false,
  search,
  setSearch,
  trendFilter,
  setTrendFilter,
  searchInputRef,
}) => {
  return (
    <div className="stack-lg">
      <div className="grid-cols-2">
        <NewVsReturningChart data={newVsReturningByMonth} loading={loading} />
        <CustomerStatusChart customersByStatus={customersByStatus} loading={loading} />
      </div>

      <div>
        <div className="filter-bar">
          <div className="search-input-wrapper">
            <Search size={15} className="search-icon" aria-hidden="true" />
            <input
              ref={searchInputRef}
              type="text"
              aria-label="Search customer insights"
              className="form-control search-input"
              placeholder="Search customers by name, code, or city... (Press / to search)"
              maxLength={100}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="form-control filter-select"
            aria-label="Filter by trend"
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

        <div className="card card-flush">
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
                    <th className="num">Lifetime Spend</th>
                    <th className="num">Last 30 Days</th>
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
                          <div className="cell-primary">{ci.customer_name}</div>
                          <div className="cell-secondary tabular-nums">{ci.customer_code}</div>
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>{ci.city}</td>
                        <td>{ci.value_tier}</td>
                        <td className="num cell-primary">{formatCurrency(ci.lifetime_spend)}</td>
                        <td className="num">{formatCurrency(ci.recent_30d_spend)}</td>
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
    </div>
  );
};

export default CustomerInsightsTab;
