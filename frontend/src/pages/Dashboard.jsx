import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  RefreshCw,
  AlertCircle,
  Download,
  ChevronDown,
  FileText,
  FileSpreadsheet,
  Printer,
  SlidersHorizontal,
  ArrowRight,
  PinOff,
  Sparkles,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { dashboardApi } from '../api/dashboard.api';
import { aiApi } from '../api/ai.api';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { CardSkeleton, TableSkeleton } from '../components/common/LoadingSkeleton';
import { MonthlyRevenueChart } from '../components/charts/MonthlyRevenueChart';
import { CustomerStatusChart } from '../components/charts/CustomerStatusChart';
import { RevenueDonutChart } from '../components/charts/RevenueDonutChart';
import { RevenueBreakdownChart } from '../components/reports/RevenueBreakdownChart';
import { BrandSalesChart } from '../components/reports/BrandSalesChart';
import { AIChartView } from '../components/ai/AIChartView';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDate, formatMonth } from '../utils/format';
import {
  CUSTOMER_INDUSTRIES,
  CUSTOMER_TYPES,
  CUSTOMER_STATUSES,
} from '../utils/customerOptions';
import {
  DATE_PRESETS,
  DEFAULT_CITIES,
  DEFAULT_CATEGORIES,
  DEFAULT_BRANDS,
  getPresetDates,
  buildPeriodComparison,
  escapeCsvCell,
} from '../utils/reportFilters';

const WIDGET_STORAGE_KEY = 'bi_dashboard_widgets';

const DEFAULT_WIDGETS = {
  kpis: true,
  trendChart: true,
  customerStatusChart: true,
  breakdownCharts: true,
  topTables: true,
  recentSales: true,
  lowStockAlerts: true,
};

const WIDGET_LABELS = [
  { key: 'kpis', label: 'KPI Summary Cards' },
  { key: 'trendChart', label: 'Revenue & Orders Trend' },
  { key: 'customerStatusChart', label: 'Customers by Status Donut' },
  { key: 'breakdownCharts', label: 'Sales Breakdown Charts' },
  { key: 'topTables', label: 'Top Products & Top Customers' },
  { key: 'recentSales', label: 'Recent Sales' },
  { key: 'lowStockAlerts', label: 'Low Stock Alerts' },
];

const AUTO_REFRESH_OPTIONS = [
  { value: '0', label: 'Auto refresh: Off' },
  { value: '30000', label: 'Every 30s' },
  { value: '60000', label: 'Every 1 min' },
  { value: '300000', label: 'Every 5 min' },
];

function loadSavedWidgets() {
  try {
    const raw = localStorage.getItem(WIDGET_STORAGE_KEY);
    if (!raw) return DEFAULT_WIDGETS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_WIDGETS, ...parsed };
  } catch {
    return DEFAULT_WIDGETS;
  }
}

export const Dashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialPreset = searchParams.get('preset') || 'all';
  const initialDates =
    initialPreset !== 'all' && !searchParams.get('startDate') && !searchParams.get('endDate')
      ? getPresetDates(initialPreset)
      : { startDate: searchParams.get('startDate') || '', endDate: searchParams.get('endDate') || '' };

  const [activePreset, setActivePreset] = useState(initialPreset);
  const [startDate, setStartDate] = useState(initialDates.startDate);
  const [endDate, setEndDate] = useState(initialDates.endDate);
  const [cityFilter, setCityFilter] = useState(() => searchParams.get('city') || '');
  const [categoryFilter, setCategoryFilter] = useState(() => searchParams.get('category') || '');
  const [brandFilter, setBrandFilter] = useState(() => searchParams.get('brand') || '');
  const [customerTypeFilter, setCustomerTypeFilter] = useState(() => searchParams.get('customer_type') || '');
  const [industryFilter, setIndustryFilter] = useState(() => searchParams.get('industry') || '');

  const [granularity, setGranularity] = useState(() =>
    searchParams.get('granularity') === 'weekly' ? 'weekly' : 'monthly'
  );
  const [metric, setMetric] = useState(() =>
    searchParams.get('metric') === 'orders' ? 'orders' : 'revenue'
  );

  const [topProductsSort, setTopProductsSort] = useState(() =>
    searchParams.get('topProductsSort') === 'units' ? 'units' : 'revenue'
  );
  const [topProductsLimit, setTopProductsLimit] = useState(() =>
    searchParams.get('topProductsLimit') === '10' ? 10 : 5
  );
  const [topCustomersSort, setTopCustomersSort] = useState(() =>
    searchParams.get('topCustomersSort') === 'orders' ? 'orders' : 'spent'
  );
  const [topCustomersLimit, setTopCustomersLimit] = useState(() =>
    searchParams.get('topCustomersLimit') === '10' ? 10 : 5
  );
  const [recentSalesStatus, setRecentSalesStatus] = useState(
    () => searchParams.get('recentSalesStatus') || ''
  );

  const [autoRefreshMs, setAutoRefreshMs] = useState('0');
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [widgets, setWidgets] = useState(loadSavedWidgets);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const customizeRef = useRef(null);
  const exportRef = useRef(null);
  const { showToast } = useToast();

  // Persist widget customization
  useEffect(() => {
    try {
      localStorage.setItem(WIDGET_STORAGE_KEY, JSON.stringify(widgets));
    } catch {
      // Ignore storage quota errors
    }
  }, [widgets]);

  // Sync filters and preferences to URL query params
  useEffect(() => {
    const next = new URLSearchParams();
    if (activePreset && activePreset !== 'all') next.set('preset', activePreset);
    if (startDate) next.set('startDate', startDate);
    if (endDate) next.set('endDate', endDate);
    if (cityFilter) next.set('city', cityFilter);
    if (categoryFilter) next.set('category', categoryFilter);
    if (brandFilter) next.set('brand', brandFilter);
    if (customerTypeFilter) next.set('customer_type', customerTypeFilter);
    if (industryFilter) next.set('industry', industryFilter);
    if (granularity !== 'monthly') next.set('granularity', granularity);
    if (metric !== 'revenue') next.set('metric', metric);
    if (topProductsSort !== 'revenue') next.set('topProductsSort', topProductsSort);
    if (topProductsLimit !== 5) next.set('topProductsLimit', String(topProductsLimit));
    if (topCustomersSort !== 'spent') next.set('topCustomersSort', topCustomersSort);
    if (topCustomersLimit !== 5) next.set('topCustomersLimit', String(topCustomersLimit));
    if (recentSalesStatus) next.set('recentSalesStatus', recentSalesStatus);

    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [
    activePreset,
    startDate,
    endDate,
    cityFilter,
    categoryFilter,
    brandFilter,
    customerTypeFilter,
    industryFilter,
    granularity,
    metric,
    topProductsSort,
    topProductsLimit,
    topCustomersSort,
    topCustomersLimit,
    recentSalesStatus,
    searchParams,
    setSearchParams,
  ]);

  const queryParams = useMemo(
    () => ({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      preset: activePreset && activePreset !== 'all' && activePreset !== 'custom' ? activePreset : undefined,
      city: cityFilter || undefined,
      category: categoryFilter || undefined,
      brand: brandFilter || undefined,
      customer_type: customerTypeFilter || undefined,
      industry: industryFilter || undefined,
      granularity,
      recentSalesStatus: recentSalesStatus || undefined,
      topProductsSort,
      topProductsLimit,
      topCustomersSort,
      topCustomersLimit,
    }),
    [
      startDate,
      endDate,
      activePreset,
      cityFilter,
      categoryFilter,
      brandFilter,
      customerTypeFilter,
      industryFilter,
      granularity,
      recentSalesStatus,
      topProductsSort,
      topProductsLimit,
      topCustomersSort,
      topCustomersLimit,
    ]
  );

  const fetchDashboard = useCallback(async () => {
    if (startDate && endDate && startDate > endDate) {
      setError('Start date cannot be after end date.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const summary = await dashboardApi.getSummary(queryParams);
      setData(summary);
      setLastUpdatedAt(new Date());
    } catch (err) {
      const msg = err.message || 'Failed to load dashboard summary';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [queryParams, startDate, endDate, showToast]);

  const [pinnedWidgets, setPinnedWidgets] = useState([]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    if (typeof aiApi.getPinnedWidgets !== 'function') return;
    aiApi
      .getPinnedWidgets()
      .then((list) => {
        if (Array.isArray(list)) setPinnedWidgets(list);
      })
      .catch(() => {});
  }, []);

  const handleUnpinWidget = async (widgetId) => {
    if (typeof aiApi.unpinWidget !== 'function') return;
    try {
      await aiApi.unpinWidget(widgetId);
      setPinnedWidgets((prev) => prev.filter((w) => w.id !== widgetId));
      showToast('Widget unpinned from Dashboard', 'info');
    } catch (err) {
      showToast(err?.message || 'Failed to unpin widget', 'error');
    }
  };

  // Auto-refresh timer
  useEffect(() => {
    const intervalMs = Number(autoRefreshMs);
    if (!intervalMs || intervalMs <= 0) return undefined;
    const timer = setInterval(() => {
      fetchDashboard();
    }, intervalMs);
    return () => clearInterval(timer);
  }, [autoRefreshMs, fetchDashboard]);

  // Close menus on outside click or Escape
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setCustomizeOpen(false);
        setExportOpen(false);
      }
    };
    const onMouseDown = (e) => {
      if (customizeRef.current && !customizeRef.current.contains(e.target)) {
        setCustomizeOpen(false);
      }
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setExportOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onMouseDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onMouseDown);
    };
  }, []);

  const handlePreset = (presetId) => {
    setActivePreset(presetId);
    const { startDate: s, endDate: e } = getPresetDates(presetId);
    setStartDate(s);
    setEndDate(e);
  };

  const handleCustomStartDate = (val) => {
    setStartDate(val);
    setActivePreset(val || endDate ? 'custom' : 'all');
  };

  const handleCustomEndDate = (val) => {
    setEndDate(val);
    setActivePreset(startDate || val ? 'custom' : 'all');
  };

  const clearAllFilters = () => {
    setActivePreset('all');
    setStartDate('');
    setEndDate('');
    setCityFilter('');
    setCategoryFilter('');
    setBrandFilter('');
    setCustomerTypeFilter('');
    setIndustryFilter('');
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (startDate || endDate || (activePreset && activePreset !== 'all')) count += 1;
    if (cityFilter) count += 1;
    if (categoryFilter) count += 1;
    if (brandFilter) count += 1;
    if (customerTypeFilter) count += 1;
    if (industryFilter) count += 1;
    return count;
  }, [startDate, endDate, activePreset, cityFilter, categoryFilter, brandFilter, customerTypeFilter, industryFilter]);

  const cityOptions = useMemo(() => {
    const dbCities = data?.filterOptions?.cities || [];
    return Array.from(new Set([...DEFAULT_CITIES, ...dbCities])).sort();
  }, [data?.filterOptions?.cities]);

  const categoryOptions = useMemo(() => {
    const dbCategories = data?.filterOptions?.categories || [];
    return Array.from(new Set([...DEFAULT_CATEGORIES, ...dbCategories])).sort();
  }, [data?.filterOptions?.categories]);

  const brandOptions = useMemo(() => {
    const dbBrands = data?.filterOptions?.brands || [];
    return Array.from(new Set([...DEFAULT_BRANDS, ...dbBrands])).sort();
  }, [data?.filterOptions?.brands]);

  const periodChartData = useMemo(() => {
    if (granularity === 'weekly' && Array.isArray(data?.weeklySales)) {
      return data.weeklySales.map((w) => ({
        ...w,
        periodLabel: formatDate(w.week_start),
        revenueNum: parseFloat(w.revenue) || 0,
        ordersNum: Number(w.sales_count) || 0,
      }));
    }
    return (data?.monthlySales || []).map((m) => ({
      ...m,
      monthLabel: formatMonth(m.month),
      periodLabel: formatMonth(m.month),
      revenueNum: parseFloat(m.revenue) || 0,
      ordersNum: Number(m.sales_count) || 0,
    }));
  }, [data, granularity]);

  const revenueSparkline = useMemo(
    () => (data?.monthlySales || []).map((m) => ({ value: parseFloat(m.revenue) || 0 })),
    [data?.monthlySales]
  );

  const ordersSparkline = useMemo(
    () => (data?.monthlySales || []).map((m) => ({ value: Number(m.sales_count) || 0 })),
    [data?.monthlySales]
  );

  // Fallback month-over-month comparison when bounded previous-period comparison is not set
  const fallbackRevenueComparison = useMemo(() => {
    const list = data?.monthlySales;
    if (!list || list.length < 2) {
      return { text: '— vs previous period', isNeutral: true };
    }
    const curr = parseFloat(list[list.length - 1].revenue) || 0;
    const prev = parseFloat(list[list.length - 2].revenue) || 0;
    if (prev <= 0) {
      return { text: '— vs previous period', isNeutral: true };
    }
    const diff = ((curr - prev) / prev) * 100;
    return {
      text: `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}% vs previous period`,
      isPositive: diff >= 0,
      isNeutral: false,
    };
  }, [data?.monthlySales]);

  const revenueComparison = data?.comparison
    ? buildPeriodComparison(data.comparison.total_revenue_pct)
    : fallbackRevenueComparison;
  const ordersComparison = buildPeriodComparison(data?.comparison?.total_orders_pct);
  const aovComparison = buildPeriodComparison(data?.comparison?.average_order_value_pct);

  const customerStatusSubtitle = useMemo(() => {
    const kpi = data?.kpi;
    if (!kpi) return null;

    const countsByKey = {
      active: Number(kpi.active_customers) || 0,
      inactive: Number(kpi.inactive_customers) || 0,
      on_hold: Number(kpi.on_hold_customers) || 0,
      prospect: Number(kpi.prospect_customers) || 0,
      churned: Number(kpi.churned_customers) || 0,
    };

    if (Array.isArray(data?.customersByStatus)) {
      data.customersByStatus.forEach((item) => {
        countsByKey[item.status] = Number(item.count) || 0;
      });
    }

    const parts = CUSTOMER_STATUSES
      .filter((s) => s.value === 'active' || countsByKey[s.value] > 0)
      .map((s) => `${countsByKey[s.value]} ${s.label.toLowerCase()}`);

    return parts.join(' · ');
  }, [data]);

  const sortedTopProducts = useMemo(() => {
    const list = [...(data?.topProducts || [])];
    list.sort((a, b) => {
      if (topProductsSort === 'units') {
        return (Number(b.units_sold) || 0) - (Number(a.units_sold) || 0);
      }
      return (Number(b.total_revenue) || 0) - (Number(a.total_revenue) || 0);
    });
    return list.slice(0, topProductsLimit);
  }, [data?.topProducts, topProductsSort, topProductsLimit]);

  const sortedTopCustomers = useMemo(() => {
    const list = [...(data?.topCustomers || [])];
    list.sort((a, b) => {
      if (topCustomersSort === 'orders') {
        return (Number(b.orders_count) || 0) - (Number(a.orders_count) || 0);
      }
      return (Number(b.total_spent) || 0) - (Number(a.total_spent) || 0);
    });
    return list.slice(0, topCustomersLimit);
  }, [data?.topCustomers, topCustomersSort, topCustomersLimit]);

  const filteredRecentSales = useMemo(() => {
    const list = data?.recentSales || [];
    if (!recentSalesStatus) return list.slice(0, 10);
    return list.filter((s) => (s.status || 'completed') === recentSalesStatus).slice(0, 10);
  }, [data?.recentSales, recentSalesStatus]);

  const getDashboardFilenameBase = () => `dashboard_${new Date().toISOString().split('T')[0]}`;

  const exportCSV = () => {
    setExportOpen(false);
    if (!data) return;
    const filenameBase = getDashboardFilenameBase();
    const lines = ['Section,Name,Metric 1,Metric 2,Amount'];
    lines.push(`KPI,Total Revenue,,,${data.kpi?.total_revenue || 0}`);
    lines.push(`KPI,Total Orders,${data.kpi?.total_sales_count || 0},,`);
    lines.push(`KPI,Average Order Value,,,${data.kpi?.average_order_value || 0}`);
    lines.push(`KPI,Units Sold,${data.kpi?.total_units || 0},,`);
    lines.push(`KPI,Customers,${data.kpi?.total_customers || 0},New: ${data.kpi?.new_customers || 0},`);
    lines.push(`KPI,Products,${data.kpi?.active_products || 0},Low stock: ${data.kpi?.low_stock_products || 0},Out of stock: ${data.kpi?.out_of_stock_products || 0}`);

    periodChartData.forEach((p) => {
      lines.push(`Trend,${escapeCsvCell(p.periodLabel)},${p.ordersNum} orders,,${p.revenueNum}`);
    });
    (data.byCity || []).forEach((c) => {
      lines.push(`City,${escapeCsvCell(c.city)},${c.orders_count} orders,,${c.revenue}`);
    });
    (data.byCategory || []).forEach((c) => {
      lines.push(`Category,${escapeCsvCell(c.category)},${c.units_sold} units,,${c.revenue}`);
    });
    (data.byBrand || []).forEach((b) => {
      lines.push(`Brand,${escapeCsvCell(b.brand)},${b.units_sold} units,,${b.total_revenue}`);
    });
    (data.byCustomerType || []).forEach((t) => {
      lines.push(`Customer Type,${escapeCsvCell(t.customer_type)},${t.orders_count} orders,,${t.revenue}`);
    });
    sortedTopProducts.forEach((p) => {
      lines.push(`Top Product,${escapeCsvCell(p.product_name)},${p.units_sold} units,${escapeCsvCell(p.category)},${p.total_revenue}`);
    });
    sortedTopCustomers.forEach((c) => {
      lines.push(`Top Customer,${escapeCsvCell(c.customer_name)},${c.orders_count} orders,${escapeCsvCell(c.city)},${c.total_spent}`);
    });
    filteredRecentSales.forEach((s) => {
      lines.push(`Recent Sale,#${s.id},${escapeCsvCell(s.customer_name)},${escapeCsvCell(s.status)},${s.total_amount}`);
    });
    (data.lowStockProducts || []).forEach((p) => {
      lines.push(`Low Stock,${escapeCsvCell(p.product_name)},Stock: ${p.stock_quantity},Reorder: ${p.reorder_level},${p.unit_price}`);
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filenameBase}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${filenameBase}.csv`, 'success');
  };

  const exportExcel = () => {
    setExportOpen(false);
    if (!data) return;
    const filenameBase = getDashboardFilenameBase();
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet([
        { Metric: 'Total Revenue (INR)', Value: Number(data.kpi?.total_revenue) || 0 },
        { Metric: 'Total Orders', Value: data.kpi?.total_sales_count || 0 },
        { Metric: 'Average Order Value (INR)', Value: Number(data.kpi?.average_order_value) || 0 },
        { Metric: 'Units Sold', Value: data.kpi?.total_units || 0 },
        { Metric: 'Customers', Value: data.kpi?.total_customers || 0 },
        { Metric: 'New Customers (This Period)', Value: data.kpi?.new_customers || 0 },
        { Metric: 'Active Products', Value: data.kpi?.active_products || 0 },
        { Metric: 'Low Stock Products', Value: data.kpi?.low_stock_products || 0 },
        { Metric: 'Out of Stock Products', Value: data.kpi?.out_of_stock_products || 0 },
      ]),
      'KPIs'
    );

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        periodChartData.map((p) => ({
          Period: p.periodLabel,
          Orders: p.ordersNum,
          Revenue: p.revenueNum,
        }))
      ),
      granularity === 'weekly' ? 'Weekly Trend' : 'Monthly Trend'
    );

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        sortedTopProducts.map((p) => ({
          Product: p.product_name,
          Category: p.category,
          UnitsSold: p.units_sold,
          Revenue: Number(p.total_revenue) || 0,
        }))
      ),
      'Top Products'
    );

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        sortedTopCustomers.map((c) => ({
          Customer: c.customer_name,
          Code: c.customer_code,
          City: c.city,
          Orders: c.orders_count,
          TotalSpent: Number(c.total_spent) || 0,
        }))
      ),
      'Top Customers'
    );

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        filteredRecentSales.map((s) => ({
          SaleID: s.id,
          Customer: s.customer_name,
          City: s.city,
          Date: formatDate(s.sale_date),
          Amount: Number(s.total_amount) || 0,
          Status: s.status,
        }))
      ),
      'Recent Sales'
    );

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        (data.lowStockProducts || []).map((p) => ({
          SKU: p.sku,
          Product: p.product_name,
          Category: p.category,
          Stock: p.stock_quantity,
          ReorderLevel: p.reorder_level,
        }))
      ),
      'Low Stock Alerts'
    );

    XLSX.writeFile(wb, `${filenameBase}.xlsx`);
    showToast(`Exported ${filenameBase}.xlsx`, 'success');
  };

  const exportPrintPdf = () => {
    setExportOpen(false);
    const prevTitle = document.title;
    document.title = getDashboardFilenameBase();
    window.print();
    document.title = prevTitle;
  };

  const lastUpdatedText = lastUpdatedAt
    ? lastUpdatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
    : null;

  return (
    <div className="stack-lg">
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h2>Dashboard</h2>
        </div>

        <div className="header-actions no-print">
          {lastUpdatedText && (
            <span className="last-updated-label tabular-nums" aria-label="Last updated time">
              Last updated at {lastUpdatedText}
            </span>
          )}

          <select
            className="form-control form-control-sm"
            style={{ width: '150px' }}
            aria-label="Auto refresh interval"
            value={autoRefreshMs}
            onChange={(e) => setAutoRefreshMs(e.target.value)}
          >
            {AUTO_REFRESH_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={fetchDashboard}
            disabled={loading}
          >
            <RefreshCw size={14} aria-hidden="true" />
            <span>Refresh</span>
          </button>

          <div className="dropdown-wrapper" ref={customizeRef}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              aria-haspopup="menu"
              aria-expanded={customizeOpen}
              onClick={() => setCustomizeOpen((prev) => !prev)}
            >
              <SlidersHorizontal size={14} aria-hidden="true" />
              <span>Customize</span>
            </button>

            {customizeOpen && (
              <div className="dropdown-menu customize-menu" role="menu" aria-label="Customize dashboard widgets">
                {WIDGET_LABELS.map((w) => (
                  <label key={w.key} className="customize-item">
                    <input
                      type="checkbox"
                      className="checkbox-input"
                      checked={Boolean(widgets[w.key])}
                      onChange={(e) =>
                        setWidgets((prev) => ({ ...prev, [w.key]: e.target.checked }))
                      }
                    />
                    <span>{w.label}</span>
                  </label>
                ))}
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ marginTop: '4px' }}
                  onClick={() => setWidgets(DEFAULT_WIDGETS)}
                >
                  Reset Layout
                </button>
              </div>
            )}
          </div>

          <div className="dropdown-wrapper" ref={exportRef}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              aria-haspopup="menu"
              aria-expanded={exportOpen}
              onClick={() => setExportOpen((prev) => !prev)}
            >
              <Download size={14} aria-hidden="true" />
              <span>Export</span>
              <ChevronDown size={13} aria-hidden="true" />
            </button>

            {exportOpen && (
              <div className="dropdown-menu" role="menu" aria-label="Export dashboard options">
                <button type="button" className="dropdown-item" role="menuitem" onClick={exportCSV}>
                  <FileText size={14} aria-hidden="true" />
                  <span>Export CSV</span>
                </button>
                <button type="button" className="dropdown-item" role="menuitem" onClick={exportExcel}>
                  <FileSpreadsheet size={14} aria-hidden="true" />
                  <span>Export Excel (.xlsx)</span>
                </button>
                <button type="button" className="dropdown-item" role="menuitem" onClick={exportPrintPdf}>
                  <Printer size={14} aria-hidden="true" />
                  <span>Print / PDF</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="filter-bar no-print" style={{ marginBottom: 0 }}>
        <div className="segmented-group report-preset-group" role="group" aria-label="Date range presets">
          {DATE_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`segmented-btn ${activePreset === p.id ? 'active' : ''}`}
              onClick={() => handlePreset(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="date-range-group">
          <input
            type="date"
            aria-label="Start date"
            className="form-control form-control-sm"
            style={{ width: '138px' }}
            value={startDate}
            onChange={(e) => handleCustomStartDate(e.target.value)}
          />
          <span className="date-range-sep">to</span>
          <input
            type="date"
            aria-label="End date"
            className="form-control form-control-sm"
            style={{ width: '138px' }}
            value={endDate}
            onChange={(e) => handleCustomEndDate(e.target.value)}
          />
        </div>

        <select
          className="form-control form-control-sm filter-select"
          aria-label="Filter by city"
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
        >
          <option value="">All Cities</option>
          {cityOptions.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          className="form-control form-control-sm filter-select"
          aria-label="Filter by category"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          {categoryOptions.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          className="form-control form-control-sm filter-select"
          aria-label="Filter by brand"
          value={brandFilter}
          onChange={(e) => setBrandFilter(e.target.value)}
        >
          <option value="">All Brands</option>
          {brandOptions.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>

        <select
          className="form-control form-control-sm filter-select"
          aria-label="Filter by customer type"
          value={customerTypeFilter}
          onChange={(e) => setCustomerTypeFilter(e.target.value)}
        >
          <option value="">All Customer Types</option>
          {CUSTOMER_TYPES.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>

        <select
          className="form-control form-control-sm filter-select"
          aria-label="Filter by industry"
          value={industryFilter}
          onChange={(e) => setIndustryFilter(e.target.value)}
        >
          <option value="">All Industries</option>
          {CUSTOMER_INDUSTRIES.map((ind) => (
            <option key={ind} value={ind}>{ind}</option>
          ))}
        </select>

        {activeFilterCount > 0 && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span className="badge badge-primary tabular-nums" aria-label="Active filter count">
              {activeFilterCount} active
            </span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={clearAllFilters}
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {!loading && error && !data ? (
        <div className="card">
          <EmptyState
            icon={AlertCircle}
            title="Unable to load dashboard"
            description={error}
            action={
              <button type="button" className="btn btn-secondary btn-sm" onClick={fetchDashboard}>
                Retry
              </button>
            }
          />
        </div>
      ) : (
        <>
          {widgets.kpis && (
            <div className="stats-grid-6" style={{ marginBottom: 0 }}>
              {loading || !data ? (
                <>
                  <CardSkeleton />
                  <CardSkeleton />
                  <CardSkeleton />
                  <CardSkeleton />
                  <CardSkeleton />
                  <CardSkeleton />
                  <CardSkeleton />
                  <CardSkeleton />
                  <CardSkeleton />
                </>
              ) : (
                <>
                  <Link to="/sales" className="stat-card-link">
                    <StatCard
                      title="Total Revenue"
                      value={formatCurrency(data.kpi?.total_revenue)}
                      comparison={revenueComparison}
                      sparklineData={revenueSparkline}
                    />
                  </Link>
                  <Link to="/sales" className="stat-card-link">
                    <StatCard
                      title="Total Orders"
                      value={data.kpi?.total_sales_count || 0}
                      comparison={ordersComparison}
                      sparklineData={ordersSparkline}
                    />
                  </Link>
                  <Link to="/reports" className="stat-card-link">
                    <StatCard
                      title="Average Order Value"
                      value={formatCurrency(data.kpi?.average_order_value)}
                      comparison={aovComparison}
                    />
                  </Link>
                  <Link to="/reports" className="stat-card-link">
                    <StatCard
                      title="Units Sold"
                      value={data.kpi?.total_units ?? 0}
                      subtitle="Completed sales units"
                    />
                  </Link>
                  <Link to="/customers" className="stat-card-link">
                    <StatCard
                      title="Customers"
                      value={data.kpi?.total_customers || 0}
                      subtitle={customerStatusSubtitle}
                    />
                  </Link>
                  <Link to="/customers" className="stat-card-link">
                    <StatCard
                      title="New Customers"
                      value={data.kpi?.new_customers ?? 0}
                      subtitle="Added this period"
                    />
                  </Link>
                  <Link to="/products" className="stat-card-link">
                    <StatCard
                      title="Products"
                      value={data.kpi?.active_products || 0}
                      subtitle="Active catalog items"
                    />
                  </Link>
                  <Link to="/products?stock_status=low" className="stat-card-link">
                    <StatCard
                      title="Low stock products"
                      value={data.kpi?.low_stock_products ?? 0}
                      subtitle="At or below reorder level"
                    />
                  </Link>
                  <Link to="/products?stock_status=out_of_stock" className="stat-card-link">
                    <StatCard
                      title="Out of Stock products"
                      value={data.kpi?.out_of_stock_products ?? 0}
                      subtitle="Zero units available"
                    />
                  </Link>
                </>
              )}
            </div>
          )}

          {(widgets.trendChart || widgets.customerStatusChart) && (
            <div className={widgets.trendChart && widgets.customerStatusChart ? 'dashboard-charts-top' : 'stack-lg'}>
              {widgets.trendChart && (
                <MonthlyRevenueChart
                  data={periodChartData}
                  loading={loading || !data}
                  metric={metric}
                  granularity={granularity}
                  ordersLabel="Orders"
                  onMetricChange={setMetric}
                  onGranularityChange={setGranularity}
                />
              )}

              {widgets.customerStatusChart && (
                <CustomerStatusChart
                  customersByStatus={data?.customersByStatus}
                  kpi={data?.kpi}
                  loading={loading || !data}
                />
              )}
            </div>
          )}

          {widgets.breakdownCharts && (
            <>
              <div className="grid-cols-2">
                <RevenueBreakdownChart
                  title="Sales by City"
                  data={data?.byCity}
                  dataKey="city"
                  valueKey="revenue"
                  loading={loading || !data}
                  emptyTitle="No city sales"
                  emptyDescription="No city-level sales match the active filters."
                  activeValue={cityFilter}
                  onSelect={setCityFilter}
                />

                <RevenueDonutChart
                  title="Revenue by Category"
                  data={data?.byCategory}
                  dataKey="category"
                  valueKey="revenue"
                  loading={loading || !data}
                  emptyTitle="No category sales"
                  emptyDescription="No category sales match the active filters."
                  activeValue={categoryFilter}
                  onSelect={setCategoryFilter}
                />
              </div>

              <div className="grid-cols-2">
                <BrandSalesChart
                  brandSales={data?.byBrand}
                  loading={loading || !data}
                  activeBrand={brandFilter}
                  onSelectBrand={setBrandFilter}
                />

                <RevenueBreakdownChart
                  title="Revenue by Customer Type"
                  data={data?.byCustomerType}
                  dataKey="customer_type"
                  valueKey="revenue"
                  loading={loading || !data}
                  emptyTitle="No customer type data"
                  emptyDescription="No customer segment sales match the active filters."
                  activeValue={customerTypeFilter}
                  onSelect={setCustomerTypeFilter}
                />
              </div>
            </>
          )}

          {widgets.topTables && (
            <div className="grid-cols-2">
              <section className="card card-flush" aria-label="Top Products">
                <div className="card-header">
                  <h3 className="section-heading" style={{ marginBottom: 0 }}>Top Products</h3>
                  <div className="card-header-controls no-print">
                    <div className="segmented-group" role="group" aria-label="Top products sort">
                      <button
                        type="button"
                        className={`segmented-btn ${topProductsSort === 'revenue' ? 'active' : ''}`}
                        onClick={() => setTopProductsSort('revenue')}
                      >
                        Revenue
                      </button>
                      <button
                        type="button"
                        className={`segmented-btn ${topProductsSort === 'units' ? 'active' : ''}`}
                        onClick={() => setTopProductsSort('units')}
                      >
                        Units
                      </button>
                    </div>
                    <select
                      className="form-control form-control-sm"
                      style={{ width: '90px' }}
                      aria-label="Top products limit"
                      value={topProductsLimit}
                      onChange={(e) => setTopProductsLimit(Number(e.target.value))}
                    >
                      <option value={5}>Top 5</option>
                      <option value={10}>Top 10</option>
                    </select>
                  </div>
                </div>

                {loading || !data ? (
                  <TableSkeleton rows={4} columns={4} />
                ) : sortedTopProducts.length === 0 ? (
                  <EmptyState
                    title="No product sales yet"
                    description="Top performing products will appear once orders are recorded."
                  />
                ) : (
                  <div className="table-responsive">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Category</th>
                          <th className="num">Units</th>
                          <th className="num">Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedTopProducts.map((p) => (
                          <tr key={p.product_id}>
                            <td className="cell-primary">{p.product_name}</td>
                            <td style={{ color: 'var(--text-secondary)' }}>{p.category}</td>
                            <td className="num">{p.units_sold}</td>
                            <td className="num cell-primary">{formatCurrency(p.total_revenue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section className="card card-flush" aria-label="Top Customers">
                <div className="card-header">
                  <h3 className="section-heading" style={{ marginBottom: 0 }}>Top Customers</h3>
                  <div className="card-header-controls no-print">
                    <div className="segmented-group" role="group" aria-label="Top customers sort">
                      <button
                        type="button"
                        className={`segmented-btn ${topCustomersSort === 'spent' ? 'active' : ''}`}
                        onClick={() => setTopCustomersSort('spent')}
                      >
                        Total Spent
                      </button>
                      <button
                        type="button"
                        className={`segmented-btn ${topCustomersSort === 'orders' ? 'active' : ''}`}
                        onClick={() => setTopCustomersSort('orders')}
                      >
                        Orders
                      </button>
                    </div>
                    <select
                      className="form-control form-control-sm"
                      style={{ width: '90px' }}
                      aria-label="Top customers limit"
                      value={topCustomersLimit}
                      onChange={(e) => setTopCustomersLimit(Number(e.target.value))}
                    >
                      <option value={5}>Top 5</option>
                      <option value={10}>Top 10</option>
                    </select>
                  </div>
                </div>

                {loading || !data ? (
                  <TableSkeleton rows={4} columns={4} />
                ) : sortedTopCustomers.length === 0 ? (
                  <EmptyState
                    title="No customer activity"
                    description="Top customer accounts will appear once orders are recorded."
                  />
                ) : (
                  <div className="table-responsive">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Customer</th>
                          <th>City</th>
                          <th className="num">Orders</th>
                          <th className="num">Total Spent</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedTopCustomers.map((c) => (
                          <tr key={c.customer_id}>
                            <td>
                              <Link to={`/customers/${c.customer_id}`} className="table-link cell-primary">
                                {c.customer_name}
                              </Link>
                              <div className="cell-secondary tabular-nums">{c.customer_code}</div>
                            </td>
                            <td style={{ color: 'var(--text-secondary)' }}>{c.city}</td>
                            <td className="num">{c.orders_count}</td>
                            <td className="num cell-primary">{formatCurrency(c.total_spent)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          )}

          {widgets.recentSales && (
            <section className="card card-flush" aria-label="Recent Sales">
              <div className="card-header">
                <h3 className="section-heading" style={{ marginBottom: 0 }}>Recent Sales</h3>
                <div className="card-header-controls no-print">
                  <select
                    className="form-control form-control-sm"
                    style={{ width: '140px' }}
                    aria-label="Filter recent sales by status"
                    value={recentSalesStatus}
                    onChange={(e) => setRecentSalesStatus(e.target.value)}
                  >
                    <option value="">All Statuses</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <Link to="/sales" className="btn btn-secondary btn-sm">
                    <span>View all</span>
                    <ArrowRight size={13} aria-hidden="true" />
                  </Link>
                </div>
              </div>

              {loading || !data ? (
                <TableSkeleton rows={5} columns={5} />
              ) : filteredRecentSales.length === 0 ? (
                <EmptyState
                  title="No recent orders"
                  description="Recent sales activity will appear here once transactions match the filter."
                />
              ) : (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Customer</th>
                        <th>Date</th>
                        <th className="num">Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecentSales.map((s) => (
                        <tr key={s.id}>
                          <td className="tabular-nums" style={{ fontWeight: 500 }}>#{s.id}</td>
                          <td>
                            <div className="cell-primary">{s.customer_name}</div>
                            <div className="cell-secondary">{s.city}</div>
                          </td>
                          <td className="tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                            {formatDate(s.sale_date)}
                          </td>
                          <td className="num cell-primary">{formatCurrency(s.total_amount)}</td>
                          <td>
                            <Badge status={s.status || 'completed'} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {widgets.lowStockAlerts && (
            <section className="card card-flush" aria-label="Low Stock Alerts">
              <div className="card-header">
                <h3 className="section-heading" style={{ marginBottom: 0 }}>Low Stock Alerts</h3>
                <Link to="/products?stock_status=low" className="btn btn-secondary btn-sm no-print">
                  <span>View all</span>
                  <ArrowRight size={13} aria-hidden="true" />
                </Link>
              </div>

              {loading || !data ? (
                <TableSkeleton rows={3} columns={5} />
              ) : !data.lowStockProducts || data.lowStockProducts.length === 0 ? (
                <EmptyState
                  title="All stock levels healthy"
                  description="No active products are at or below their reorder level."
                />
              ) : (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Category</th>
                        <th className="num">Stock</th>
                        <th className="num">Reorder Level</th>
                        <th>Alert</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.lowStockProducts.map((p) => {
                        const isOutOfStock = Number(p.stock_quantity) === 0;
                        return (
                          <tr key={p.id}>
                            <td>
                              <Link
                                to={`/products?stock_status=low&search=${encodeURIComponent(p.sku || p.product_name)}`}
                                className="table-link cell-primary"
                              >
                                {p.product_name}
                              </Link>
                              <div className="cell-secondary tabular-nums">{p.sku}</div>
                            </td>
                            <td style={{ color: 'var(--text-secondary)' }}>{p.category}</td>
                            <td className="num cell-primary">{p.stock_quantity}</td>
                            <td className="num" style={{ color: 'var(--text-secondary)' }}>{p.reorder_level}</td>
                            <td>
                              <Badge
                                variant={isOutOfStock ? 'danger' : 'warning'}
                                label={isOutOfStock ? 'Out of Stock' : 'Low Stock'}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {pinnedWidgets.length > 0 && (
            <section className="stack-md" aria-label="Pinned AI Insights">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 className="section-heading" style={{ marginBottom: 0, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={16} aria-hidden="true" style={{ color: 'var(--accent-text)' }} />
                  <span>Pinned AI Insights</span>
                </h3>
                <Link to="/ai-assistant" className="btn btn-secondary btn-sm no-print">
                  <span>Ask AI Assistant</span>
                  <ArrowRight size={13} aria-hidden="true" />
                </Link>
              </div>

              <div className="dashboard-grid-2">
                {pinnedWidgets.map((w) => (
                  <div key={w.id} className="card">
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: 'var(--space-2)',
                        marginBottom: 'var(--space-3)',
                      }}
                    >
                      <div>
                        <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600 }}>
                          {w.title}
                        </h4>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          {w.question}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm no-print"
                        onClick={() => handleUnpinWidget(w.id)}
                        aria-label={`Unpin ${w.title}`}
                        title="Unpin widget"
                      >
                        <PinOff size={13} aria-hidden="true" />
                      </button>
                    </div>

                    {w.chartConfig && w.chartType !== 'table' ? (
                      <AIChartView
                        chartConfig={{ ...w.chartConfig, chartType: w.chartType }}
                        rows={w.rows || []}
                        title={w.title}
                        compact
                      />
                    ) : (
                      <div className="table-responsive" style={{ maxHeight: 220, overflowY: 'auto' }}>
                        <table className="data-table" style={{ fontSize: '0.8125rem' }}>
                          <thead>
                            <tr>
                              {(w.columns || []).map((c) => (
                                <th key={c.key}>{c.label}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {(w.rows || []).slice(0, 8).map((row, idx) => (
                              <tr key={idx}>
                                {(w.columns || []).map((c) => (
                                  <td key={c.key}>{String(row[c.key] ?? '-')}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;
