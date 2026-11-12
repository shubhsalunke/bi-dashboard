import React, { useState, useMemo } from 'react';
import { StatCard } from '../common/StatCard';
import { EmptyState } from '../common/EmptyState';
import { CardSkeleton } from '../common/LoadingSkeleton';
import { TableHeader } from '../common/TableHeader';
import { MonthlyRevenueChart } from '../charts/MonthlyRevenueChart';
import { BrandSalesChart } from './BrandSalesChart';
import { RevenueBreakdownChart } from './RevenueBreakdownChart';
import { CustomerTypeDonutChart } from './CustomerTypeDonutChart';
import { TopCustomersBarChart } from './TopCustomersBarChart';
import { formatCurrency } from '../../utils/format';

function buildPeriodComparison(pctValue) {
  if (pctValue === null || pctValue === undefined) {
    return {
      text: '— vs previous period',
      isNeutral: true,
    };
  }
  const num = Number(pctValue);
  if (Number.isNaN(num)) {
    return {
      text: '— vs previous period',
      isNeutral: true,
    };
  }
  const sign = num > 0 ? '+' : '';
  return {
    text: `${sign}${num.toFixed(1)}% vs previous period`,
    isPositive: num >= 0,
    isNeutral: false,
  };
}

export const SalesReportTab = ({
  loading,
  salesReport,
  brandSales,
  periodTimeline,
  metric,
  granularity,
  onMetricChange,
  onGranularityChange,
  cityFilter,
  brandFilter,
  industryFilter,
  customerTypeFilter,
  stateFilter,
  onSelectCity,
  onSelectBrand,
  onSelectIndustry,
  onSelectCustomerType,
  onSelectState,
  totalPeriodRevenue,
}) => {
  const [catSortField, setCatSortField] = useState('category_revenue');
  const [catSortAsc, setCatSortAsc] = useState(false);

  const handleCategorySort = (field) => {
    if (catSortField === field) {
      setCatSortAsc(!catSortAsc);
    } else {
      setCatSortField(field);
      setCatSortAsc(field === 'category');
    }
  };

  const sortedCategories = useMemo(() => {
    const list = [...(salesReport?.byCategory || [])];
    list.sort((a, b) => {
      if (catSortField === 'category') {
        const valA = (a.category || '').toLowerCase();
        const valB = (b.category || '').toLowerCase();
        if (valA < valB) return catSortAsc ? -1 : 1;
        if (valA > valB) return catSortAsc ? 1 : -1;
        return 0;
      }
      const getNumeric = (row) => {
        if (catSortField === 'units_sold') return Number(row.units_sold) || 0;
        if (catSortField === 'share') return Number(row.category_revenue) || 0;
        return Number(row.category_revenue) || 0;
      };
      const diff = getNumeric(a) - getNumeric(b);
      return catSortAsc ? diff : -diff;
    });
    return list;
  }, [salesReport?.byCategory, catSortField, catSortAsc]);

  const summary = salesReport?.summary;
  const comparison = salesReport?.comparison;
  const topCustomer = summary?.top_customer;

  return (
    <div className="stack-lg">
      <div className="stats-grid-6">
        {loading || !salesReport ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title="Total Sales"
              value={summary?.total_orders || 0}
              comparison={buildPeriodComparison(comparison?.total_orders_pct)}
            />
            <StatCard
              title="Total Revenue"
              value={formatCurrency(summary?.total_revenue)}
              comparison={buildPeriodComparison(comparison?.total_revenue_pct)}
            />
            <StatCard
              title="Unique Customers"
              value={summary?.unique_customers || 0}
            />
            <StatCard
              title="Average Order Value"
              value={formatCurrency(summary?.average_order_value)}
              comparison={buildPeriodComparison(comparison?.average_order_value_pct)}
            />
            <StatCard
              title="Units Sold"
              value={summary?.total_units ?? 0}
            />
            <StatCard
              title="Top Customer"
              value={topCustomer ? topCustomer.customer_name : '—'}
              subtitle={
                topCustomer
                  ? `${formatCurrency(topCustomer.total_revenue)} · ${topCustomer.orders_count} ${
                      topCustomer.orders_count === 1 ? 'order' : 'orders'
                    }`
                  : 'No orders in selection'
              }
            />
          </>
        )}
      </div>

      <MonthlyRevenueChart
        data={periodTimeline}
        loading={loading || !salesReport}
        metric={metric}
        granularity={granularity}
        onMetricChange={onMetricChange}
        onGranularityChange={onGranularityChange}
        emptyTitle={granularity === 'weekly' ? 'No weekly sales data' : 'No monthly sales data'}
        emptyDescription="No revenue records match the selected filters."
      />

      <div className="grid-cols-2">
        <RevenueBreakdownChart
          title="Sales by City"
          data={salesReport?.byCity}
          dataKey="city"
          valueKey="revenue"
          loading={loading || !salesReport}
          emptyTitle="No city data"
          emptyDescription="No city-level sales recorded for this filter."
          activeValue={cityFilter}
          onSelect={onSelectCity}
        />

        <section className="card card-flush" aria-label="Sales by Category">
          <div className="card-header">
            <h3 className="section-heading" style={{ marginBottom: 0 }}>Sales by Category</h3>
          </div>

          {loading || !salesReport ? (
            <div className="card-body">
              <div className="chart-box-sm">
                <div className="skeleton" style={{ width: '100%', height: '100%' }} />
              </div>
            </div>
          ) : sortedCategories.length === 0 ? (
            <EmptyState
              title="No category breakdown"
              description="No category sales found for the selected filters."
            />
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <TableHeader
                      label="Category"
                      field="category"
                      sortField={catSortField}
                      sortAsc={catSortAsc}
                      onSort={handleCategorySort}
                    />
                    <TableHeader
                      label="Units"
                      field="units_sold"
                      sortField={catSortField}
                      sortAsc={catSortAsc}
                      onSort={handleCategorySort}
                      align="right"
                    />
                    <TableHeader
                      label="Share"
                      field="share"
                      sortField={catSortField}
                      sortAsc={catSortAsc}
                      onSort={handleCategorySort}
                      align="right"
                    />
                    <TableHeader
                      label="Revenue"
                      field="category_revenue"
                      sortField={catSortField}
                      sortAsc={catSortAsc}
                      onSort={handleCategorySort}
                      align="right"
                    />
                  </tr>
                </thead>
                <tbody>
                  {sortedCategories.map((cat) => {
                    const sharePct = Math.round(((Number(cat.category_revenue) || 0) / totalPeriodRevenue) * 100);
                    return (
                      <tr key={cat.category}>
                        <td className="cell-primary">{cat.category}</td>
                        <td className="num">{cat.units_sold}</td>
                        <td className="num">
                          <div className="share-bar-cell">
                            <div className="share-bar-track" aria-hidden="true">
                              <div
                                className="share-bar-fill"
                                style={{ width: `${Math.min(sharePct, 100)}%` }}
                              />
                            </div>
                            <span className="tabular-nums" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', minWidth: '32px' }}>
                              {sharePct}%
                            </span>
                          </div>
                        </td>
                        <td className="num cell-primary">{formatCurrency(cat.category_revenue)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <div className="grid-cols-2">
        <BrandSalesChart
          brandSales={brandSales}
          loading={loading}
          activeBrand={brandFilter}
          onSelectBrand={onSelectBrand}
        />

        <RevenueBreakdownChart
          title="Revenue by Industry"
          data={salesReport?.byIndustry}
          dataKey="industry"
          valueKey="revenue"
          loading={loading || !salesReport}
          emptyTitle="No industry data"
          emptyDescription="No industry-level sales recorded for this filter."
          activeValue={industryFilter}
          onSelect={onSelectIndustry}
        />
      </div>

      <div className="grid-cols-2">
        <CustomerTypeDonutChart
          data={salesReport?.byCustomerType}
          loading={loading || !salesReport}
          activeCustomerType={customerTypeFilter}
          onSelectCustomerType={onSelectCustomerType}
        />

        <RevenueBreakdownChart
          title="Revenue by State"
          data={salesReport?.byState}
          dataKey="state"
          valueKey="revenue"
          loading={loading || !salesReport}
          emptyTitle="No state data"
          emptyDescription="No state-level sales recorded for this filter."
          activeValue={stateFilter}
          onSelect={onSelectState}
        />
      </div>

      <TopCustomersBarChart
        data={salesReport?.topCustomers}
        loading={loading || !salesReport}
      />
    </div>
  );
};

export default SalesReportTab;
