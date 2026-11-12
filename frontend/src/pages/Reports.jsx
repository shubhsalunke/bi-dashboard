import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, ChevronDown, AlertCircle, FileSpreadsheet, FileText, Printer } from 'lucide-react';
import * as XLSX from 'xlsx';
import { dashboardApi } from '../api/dashboard.api';
import { EmptyState } from '../components/common/EmptyState';
import { SalesReportTab } from '../components/reports/SalesReportTab';
import { CustomerInsightsTab } from '../components/reports/CustomerInsightsTab';
import { useToast } from '../context/ToastContext';
import { formatMonth, formatDate } from '../utils/format';
import {
  CUSTOMER_INDUSTRIES,
  CUSTOMER_TYPES,
  CUSTOMER_STATUSES,
  CUSTOMER_STATUS_LABELS,
  INDIAN_STATES,
} from '../utils/customerOptions';

const DEFAULT_CITIES = ['Pune', 'Mumbai', 'Nagpur', 'Nashik', 'Aurangabad', 'Hyderabad', 'Delhi'];
const DEFAULT_CATEGORIES = [
  'Cloud Infrastructure',
  'Enterprise Software',
  'Cybersecurity',
  'Analytics & AI',
  'Professional Services',
];
const DEFAULT_BRANDS = ['Tata', 'Infosys', 'Reliance', 'Mahindra', 'Bharat'];

const DATE_PRESETS = [
  { id: 'all', label: 'All Time' },
  { id: '7d', label: '7 Days' },
  { id: '30d', label: '30 Days' },
  { id: '90d', label: '90 Days' },
  { id: 'this_month', label: 'This Month' },
  { id: 'last_month', label: 'Last Month' },
  { id: 'this_quarter', label: 'This Quarter' },
  { id: 'this_fy', label: 'This Financial Year' },
];

function formatDateInput(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getPresetDates(presetId) {
  if (!presetId || presetId === 'all') {
    return { startDate: '', endDate: '' };
  }
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();

  switch (presetId) {
    case '7d':
      return {
        startDate: formatDateInput(new Date(year, month, day - 7)),
        endDate: formatDateInput(now),
      };
    case '30d':
      return {
        startDate: formatDateInput(new Date(year, month, day - 30)),
        endDate: formatDateInput(now),
      };
    case '90d':
      return {
        startDate: formatDateInput(new Date(year, month, day - 90)),
        endDate: formatDateInput(now),
      };
    case 'this_month':
      return {
        startDate: formatDateInput(new Date(year, month, 1)),
        endDate: formatDateInput(now),
      };
    case 'last_month':
      return {
        startDate: formatDateInput(new Date(year, month - 1, 1)),
        endDate: formatDateInput(new Date(year, month, 0)),
      };
    case 'this_quarter': {
      const qStart = Math.floor(month / 3) * 3;
      return {
        startDate: formatDateInput(new Date(year, qStart, 1)),
        endDate: formatDateInput(now),
      };
    }
    case 'this_fy': {
      const fyStartYear = month >= 3 ? year : year - 1;
      return {
        startDate: formatDateInput(new Date(fyStartYear, 3, 1)),
        endDate: formatDateInput(now),
      };
    }
    default:
      return { startDate: '', endDate: '' };
  }
}

function escapeCsvCell(value) {
  const str = value === null || value === undefined ? '' : String(value);
  return `"${str.replace(/"/g, '""')}"`;
}

export const Reports = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialPreset = searchParams.get('preset') || 'all';
  const initialPresetDates = initialPreset !== 'all' && !searchParams.get('startDate') && !searchParams.get('endDate')
    ? getPresetDates(initialPreset)
    : { startDate: searchParams.get('startDate') || '', endDate: searchParams.get('endDate') || '' };

  const [activeTab, setActiveTab] = useState(() => (searchParams.get('tab') === 'insights' ? 'insights' : 'sales'));
  const [preset, setPreset] = useState(initialPreset);
  const [startDate, setStartDate] = useState(initialPresetDates.startDate);
  const [endDate, setEndDate] = useState(initialPresetDates.endDate);
  const [cityFilter, setCityFilter] = useState(() => searchParams.get('city') || '');
  const [categoryFilter, setCategoryFilter] = useState(() => searchParams.get('category') || '');
  const [brandFilter, setBrandFilter] = useState(() => searchParams.get('brand') || '');
  const [industryFilter, setIndustryFilter] = useState(() => searchParams.get('industry') || '');
  const [customerTypeFilter, setCustomerTypeFilter] = useState(() => searchParams.get('customer_type') || '');
  const [stateFilter, setStateFilter] = useState(() => searchParams.get('state') || '');
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') || '');
  const [granularity, setGranularity] = useState(() =>
    searchParams.get('granularity') === 'weekly' ? 'weekly' : 'monthly'
  );
  const [metric, setMetric] = useState(() =>
    searchParams.get('metric') === 'orders' ? 'orders' : 'revenue'
  );

  const [salesReport, setSalesReport] = useState(null);
  const [customerInsights, setCustomerInsights] = useState([]);
  const [brandSales, setBrandSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [insightSearch, setInsightSearch] = useState('');
  const [trendFilter, setTrendFilter] = useState('all');
  const [exportOpen, setExportOpen] = useState(false);

  const searchInputRef = useRef(null);
  const exportMenuRef = useRef(null);
  const { showToast } = useToast();

  // Sync URL query parameters with active filters
  useEffect(() => {
    const next = new URLSearchParams();
    if (activeTab !== 'sales') next.set('tab', activeTab);
    if (preset && preset !== 'all') next.set('preset', preset);
    if (startDate) next.set('startDate', startDate);
    if (endDate) next.set('endDate', endDate);
    if (cityFilter) next.set('city', cityFilter);
    if (categoryFilter) next.set('category', categoryFilter);
    if (brandFilter) next.set('brand', brandFilter);
    if (industryFilter) next.set('industry', industryFilter);
    if (customerTypeFilter) next.set('customer_type', customerTypeFilter);
    if (stateFilter) next.set('state', stateFilter);
    if (statusFilter) next.set('status', statusFilter);
    if (granularity !== 'monthly') next.set('granularity', granularity);
    if (metric !== 'revenue') next.set('metric', metric);

    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [
    activeTab,
    preset,
    startDate,
    endDate,
    cityFilter,
    categoryFilter,
    brandFilter,
    industryFilter,
    customerTypeFilter,
    stateFilter,
    statusFilter,
    granularity,
    metric,
    searchParams,
    setSearchParams,
  ]);

  const queryFilters = useMemo(
    () => ({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      preset: preset && preset !== 'all' && preset !== 'custom' ? preset : undefined,
      city: cityFilter || undefined,
      category: categoryFilter || undefined,
      brand: brandFilter || undefined,
      industry: industryFilter || undefined,
      customer_type: customerTypeFilter || undefined,
      state: stateFilter || undefined,
      status: statusFilter || undefined,
      granularity,
    }),
    [
      startDate,
      endDate,
      preset,
      cityFilter,
      categoryFilter,
      brandFilter,
      industryFilter,
      customerTypeFilter,
      stateFilter,
      statusFilter,
      granularity,
    ]
  );

  const fetchReports = useCallback(async () => {
    if (startDate && endDate && startDate > endDate) {
      setError('Start date cannot be after end date.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [salesRes, insightsRes, brandRes] = await Promise.all([
        dashboardApi.getSalesReport(queryFilters),
        dashboardApi.getCustomerInsights(queryFilters),
        dashboardApi.getBrandSalesReport(queryFilters),
      ]);
      setSalesReport(salesRes);
      setCustomerInsights(insightsRes || []);
      setBrandSales(brandRes || []);
    } catch (err) {
      const msg = err.message || 'Failed to load reports';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [queryFilters, startDate, endDate, showToast]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setExportOpen(false);
      }
      if (
        e.key === '/' &&
        document.activeElement !== searchInputRef.current &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    const handleClickOutside = (e) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) {
        setExportOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handlePreset = (presetId) => {
    setPreset(presetId);
    const { startDate: s, endDate: e } = getPresetDates(presetId);
    setStartDate(s);
    setEndDate(e);
  };

  const handleCustomStartDate = (val) => {
    setStartDate(val);
    setPreset(val || endDate ? 'custom' : 'all');
  };

  const handleCustomEndDate = (val) => {
    setEndDate(val);
    setPreset(startDate || val ? 'custom' : 'all');
  };

  const clearAllFilters = () => {
    setPreset('all');
    setStartDate('');
    setEndDate('');
    setCityFilter('');
    setCategoryFilter('');
    setBrandFilter('');
    setIndustryFilter('');
    setCustomerTypeFilter('');
    setStateFilter('');
    setStatusFilter('');
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (startDate || endDate || (preset && preset !== 'all')) count += 1;
    if (cityFilter) count += 1;
    if (categoryFilter) count += 1;
    if (brandFilter) count += 1;
    if (industryFilter) count += 1;
    if (customerTypeFilter) count += 1;
    if (stateFilter) count += 1;
    if (statusFilter) count += 1;
    return count;
  }, [
    startDate,
    endDate,
    preset,
    cityFilter,
    categoryFilter,
    brandFilter,
    industryFilter,
    customerTypeFilter,
    stateFilter,
    statusFilter,
  ]);

  const cityOptions = useMemo(() => {
    const dbCities = salesReport?.filterOptions?.cities || [];
    return Array.from(new Set([...DEFAULT_CITIES, ...dbCities])).sort();
  }, [salesReport?.filterOptions?.cities]);

  const categoryOptions = useMemo(() => {
    const dbCategories = salesReport?.filterOptions?.categories || [];
    return Array.from(new Set([...DEFAULT_CATEGORIES, ...dbCategories])).sort();
  }, [salesReport?.filterOptions?.categories]);

  const brandOptions = useMemo(() => {
    const dbBrands = salesReport?.filterOptions?.brands || [];
    return Array.from(new Set([...DEFAULT_BRANDS, ...dbBrands])).sort();
  }, [salesReport?.filterOptions?.brands]);

  const periodTimeline = useMemo(() => {
    if (granularity === 'weekly') {
      return (salesReport?.byWeek || []).map((w) => ({
        ...w,
        period: w.week_start,
        periodLabel: formatDate(w.week_start),
        revenueNum: Number(w.revenue) || 0,
        ordersNum: Number(w.order_count) || 0,
      }));
    }
    if (!salesReport?.byMonth || salesReport.byMonth.length === 0) return [];
    return [...salesReport.byMonth].reverse().map((m) => ({
      ...m,
      period: m.month,
      periodLabel: formatMonth(m.month),
      revenueNum: Number(m.revenue) || 0,
      ordersNum: Number(m.order_count) || 0,
    }));
  }, [salesReport, granularity]);

  const totalPeriodRevenue = Number(salesReport?.summary?.total_revenue) || 1;

  const filteredInsights = useMemo(() => {
    return customerInsights.filter((ci) => {
      const matchSearch =
        insightSearch === '' ||
        ci.customer_name?.toLowerCase().includes(insightSearch.toLowerCase()) ||
        ci.customer_code?.toLowerCase().includes(insightSearch.toLowerCase()) ||
        ci.city?.toLowerCase().includes(insightSearch.toLowerCase());
      const matchTrend = trendFilter === 'all' || ci.purchase_trend === trendFilter;
      return matchSearch && matchTrend;
    });
  }, [customerInsights, insightSearch, trendFilter]);

  const getReportFilenameBase = () => `reports_${new Date().toISOString().split('T')[0]}`;

  const exportCSV = () => {
    setExportOpen(false);
    const filenameBase = getReportFilenameBase();
    let lines = [];

    if (activeTab === 'sales') {
      if (!salesReport) return;
      lines.push('Section,Label,Metric 1,Metric 2,Revenue');
      lines.push(
        `Summary,Total Sales,${salesReport.summary?.total_orders || 0},,${salesReport.summary?.total_revenue || 0}`
      );
      lines.push(
        `Summary,Unique Customers,${salesReport.summary?.unique_customers || 0},Average Order Value,${
          salesReport.summary?.average_order_value || 0
        }`
      );
      lines.push(`Summary,Units Sold,${salesReport.summary?.total_units || 0},,`);

      periodTimeline.forEach((p) => {
        lines.push(
          `${granularity === 'weekly' ? 'Weekly' : 'Monthly'},${escapeCsvCell(p.periodLabel)},${p.ordersNum} orders,${
            p.units_sold || 0
          } units,${p.revenueNum}`
        );
      });
      (salesReport.byCity || []).forEach((c) => {
        lines.push(`City,${escapeCsvCell(c.city)},${c.orders_count} orders,${c.customers_count} customers,${c.revenue}`);
      });
      (salesReport.byCategory || []).forEach((c) => {
        lines.push(`Category,${escapeCsvCell(c.category)},${c.units_sold} units,,${c.category_revenue}`);
      });
      (brandSales || []).forEach((b) => {
        lines.push(`Brand,${escapeCsvCell(b.brand)},${b.units_sold} units,,${b.total_revenue}`);
      });
      (salesReport.byIndustry || []).forEach((i) => {
        lines.push(`Industry,${escapeCsvCell(i.industry)},${i.orders_count} orders,,${i.revenue}`);
      });
      (salesReport.byCustomerType || []).forEach((t) => {
        lines.push(`Customer Type,${escapeCsvCell(t.customer_type)},${t.orders_count} orders,,${t.revenue}`);
      });
      (salesReport.byState || []).forEach((s) => {
        lines.push(`State,${escapeCsvCell(s.state)},${s.orders_count} orders,,${s.revenue}`);
      });
      (salesReport.topCustomers || []).forEach((tc) => {
        lines.push(`Top Customer,${escapeCsvCell(tc.customer_name)},${tc.orders_count} orders,,${tc.total_revenue}`);
      });
    } else {
      if (!filteredInsights) return;
      lines = ['Customer Name,Customer Code,City,State,Industry,Customer Type,Status,Value Tier,Lifetime Spend,Recent 30d Spend,Trend'];
      filteredInsights.forEach((ci) => {
        lines.push(
          [
            escapeCsvCell(ci.customer_name),
            escapeCsvCell(ci.customer_code),
            escapeCsvCell(ci.city),
            escapeCsvCell(ci.state || ''),
            escapeCsvCell(ci.industry || ''),
            escapeCsvCell(ci.customer_type || ''),
            escapeCsvCell(CUSTOMER_STATUS_LABELS[ci.status] || ci.status),
            escapeCsvCell(ci.value_tier),
            ci.lifetime_spend,
            ci.recent_30d_spend,
            escapeCsvCell(ci.purchase_trend),
          ].join(',')
        );
      });
    }

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
    const filenameBase = getReportFilenameBase();
    const workbook = XLSX.utils.book_new();

    if (activeTab === 'sales') {
      if (!salesReport) return;
      const summaryRows = [
        { Metric: 'Total Sales', Value: salesReport.summary?.total_orders || 0 },
        { Metric: 'Total Revenue (INR)', Value: Number(salesReport.summary?.total_revenue) || 0 },
        { Metric: 'Unique Customers', Value: salesReport.summary?.unique_customers || 0 },
        { Metric: 'Average Order Value (INR)', Value: Number(salesReport.summary?.average_order_value) || 0 },
        { Metric: 'Units Sold', Value: salesReport.summary?.total_units || 0 },
        {
          Metric: 'Top Customer',
          Value: salesReport.summary?.top_customer?.customer_name || 'N/A',
        },
      ];
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(summaryRows), 'Summary');

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(
          periodTimeline.map((p) => ({
            Period: p.periodLabel,
            Orders: p.ordersNum,
            Units: p.units_sold || 0,
            Revenue: p.revenueNum,
          }))
        ),
        granularity === 'weekly' ? 'Weekly Sales' : 'Monthly Sales'
      );

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(
          (salesReport.byCity || []).map((c) => ({
            City: c.city,
            Customers: c.customers_count,
            Orders: c.orders_count,
            Revenue: Number(c.revenue) || 0,
          }))
        ),
        'By City'
      );

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(
          (salesReport.byCategory || []).map((c) => ({
            Category: c.category,
            Units: c.units_sold,
            Revenue: Number(c.category_revenue) || 0,
          }))
        ),
        'By Category'
      );

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(
          (brandSales || []).map((b) => ({
            Brand: b.brand,
            Units: b.units_sold,
            Revenue: Number(b.total_revenue) || 0,
          }))
        ),
        'By Brand'
      );

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(
          (salesReport.byIndustry || []).map((i) => ({
            Industry: i.industry,
            Customers: i.customers_count,
            Orders: i.orders_count,
            Revenue: Number(i.revenue) || 0,
          }))
        ),
        'By Industry'
      );

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(
          (salesReport.byCustomerType || []).map((t) => ({
            CustomerType: t.customer_type,
            Customers: t.customers_count,
            Orders: t.orders_count,
            Revenue: Number(t.revenue) || 0,
          }))
        ),
        'By Customer Type'
      );

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(
          (salesReport.byState || []).map((s) => ({
            State: s.state,
            Customers: s.customers_count,
            Orders: s.orders_count,
            Revenue: Number(s.revenue) || 0,
          }))
        ),
        'By State'
      );

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(
          (salesReport.topCustomers || []).map((tc) => ({
            Customer: tc.customer_name,
            Code: tc.customer_code,
            City: tc.city,
            Orders: tc.orders_count,
            Revenue: Number(tc.total_revenue) || 0,
          }))
        ),
        'Top Customers'
      );
    } else {
      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(
          filteredInsights.map((ci) => ({
            CustomerName: ci.customer_name,
            CustomerCode: ci.customer_code,
            City: ci.city,
            State: ci.state || '',
            Industry: ci.industry || '',
            CustomerType: ci.customer_type || '',
            Status: CUSTOMER_STATUS_LABELS[ci.status] || ci.status,
            ValueTier: ci.value_tier,
            LifetimeSpend: Number(ci.lifetime_spend) || 0,
            Recent30dSpend: Number(ci.recent_30d_spend) || 0,
            Trend: ci.purchase_trend,
          }))
        ),
        'Customer Trends'
      );

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(
          (salesReport?.newVsReturningByMonth || []).map((row) => ({
            Month: row.month,
            NewCustomers: row.new_customers,
            ReturningCustomers: row.returning_customers,
          }))
        ),
        'New vs Returning'
      );

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(
          (salesReport?.customersByStatus || []).map((row) => ({
            Status: CUSTOMER_STATUS_LABELS[row.status] || row.status,
            Count: row.count,
          }))
        ),
        'By Status'
      );
    }

    XLSX.writeFile(workbook, `${filenameBase}.xlsx`);
    showToast(`Exported ${filenameBase}.xlsx`, 'success');
  };

  const exportPrintPdf = () => {
    setExportOpen(false);
    const prevTitle = document.title;
    document.title = getReportFilenameBase();
    window.print();
    document.title = prevTitle;
  };

  return (
    <div className="stack-lg">
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h2>Reports</h2>
        </div>

        <div className="header-actions no-print">
          <div className="segmented-group" role="tablist" aria-label="Report views">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'sales'}
              className={`segmented-btn ${activeTab === 'sales' ? 'active' : ''}`}
              onClick={() => setActiveTab('sales')}
            >
              Sales Summary
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'insights'}
              className={`segmented-btn ${activeTab === 'insights' ? 'active' : ''}`}
              onClick={() => setActiveTab('insights')}
            >
              Customer Trends
            </button>
          </div>

          <div className="dropdown-wrapper" ref={exportMenuRef}>
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
              <div className="dropdown-menu" role="menu" aria-label="Export report options">
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

      <div className="filter-bar report-filter-bar no-print" style={{ marginBottom: 0 }}>
        <div className="segmented-group report-preset-group" role="group" aria-label="Report date presets">
          {DATE_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`segmented-btn ${preset === p.id ? 'active' : ''}`}
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
          aria-label="Filter by industry"
          value={industryFilter}
          onChange={(e) => setIndustryFilter(e.target.value)}
        >
          <option value="">All Industries</option>
          {CUSTOMER_INDUSTRIES.map((ind) => (
            <option key={ind} value={ind}>{ind}</option>
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
          aria-label="Filter by state"
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
        >
          <option value="">All States</option>
          {INDIAN_STATES.map((st) => (
            <option key={st} value={st}>{st}</option>
          ))}
        </select>

        <select
          className="form-control form-control-sm filter-select"
          aria-label="Filter by customer status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          {CUSTOMER_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
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

      {!loading && error && !salesReport ? (
        <div className="card">
          <EmptyState
            icon={AlertCircle}
            title="Unable to load reports"
            description={error}
            action={
              <button type="button" className="btn btn-secondary btn-sm" onClick={fetchReports}>
                Retry
              </button>
            }
          />
        </div>
      ) : activeTab === 'sales' ? (
        <SalesReportTab
          loading={loading}
          salesReport={salesReport}
          brandSales={brandSales}
          periodTimeline={periodTimeline}
          metric={metric}
          granularity={granularity}
          onMetricChange={setMetric}
          onGranularityChange={setGranularity}
          cityFilter={cityFilter}
          brandFilter={brandFilter}
          industryFilter={industryFilter}
          customerTypeFilter={customerTypeFilter}
          stateFilter={stateFilter}
          onSelectCity={setCityFilter}
          onSelectBrand={setBrandFilter}
          onSelectIndustry={setIndustryFilter}
          onSelectCustomerType={setCustomerTypeFilter}
          onSelectState={setStateFilter}
          totalPeriodRevenue={totalPeriodRevenue}
        />
      ) : (
        <CustomerInsightsTab
          insights={filteredInsights}
          newVsReturningByMonth={salesReport?.newVsReturningByMonth || []}
          customersByStatus={salesReport?.customersByStatus || []}
          loading={loading}
          search={insightSearch}
          setSearch={setInsightSearch}
          trendFilter={trendFilter}
          setTrendFilter={setTrendFilter}
          searchInputRef={searchInputRef}
        />
      )}
    </div>
  );
};

export default Reports;
