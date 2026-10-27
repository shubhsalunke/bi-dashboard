import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Download } from 'lucide-react';
import { dashboardApi } from '../api/dashboard.api';
import { SalesReportTab } from '../components/reports/SalesReportTab';
import { CustomerInsightsTab } from '../components/reports/CustomerInsightsTab';
import { BrandSalesChart } from '../components/reports/BrandSalesChart';
import { useToast } from '../context/ToastContext';

export const Reports = () => {
  const [salesReport, setSalesReport] = useState(null);
  const [customerInsights, setCustomerInsights] = useState([]);
  const [brandSales, setBrandSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sales');

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [cityFilter, setCityFilter] = useState('');

  const [insightSearch, setInsightSearch] = useState('');
  const [trendFilter, setTrendFilter] = useState('all');
  const searchInputRef = useRef(null);

  const { showToast } = useToast();

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const [salesRes, insightsRes, brandRes] = await Promise.all([
        dashboardApi.getSalesReport({
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          city: cityFilter || undefined,
        }),
        dashboardApi.getCustomerInsights(),
        dashboardApi.getBrandSalesReport(),
      ]);
      setSalesReport(salesRes);
      setCustomerInsights(insightsRes || []);
      setBrandSales(brandRes || []);
    } catch (err) {
      showToast(err.message || 'Failed to load reports', 'error');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, cityFilter, showToast]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.key === '/' &&
        document.activeElement !== searchInputRef.current &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handlePreset = (days) => {
    if (!days) {
      setStartDate('');
      setEndDate('');
      return;
    }
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const monthlyTimeline = useMemo(() => {
    if (!salesReport?.byMonth || salesReport.byMonth.length === 0) return [];
    return [...salesReport.byMonth].reverse().map((m) => ({
      ...m,
      revenueNum: Number(m.revenue) || 0,
      ordersNum: Number(m.order_count) || 0,
    }));
  }, [salesReport]);

  const peakMonth = useMemo(() => {
    if (!monthlyTimeline || monthlyTimeline.length === 0) return null;
    return monthlyTimeline.reduce(
      (max, item) => (item.revenueNum > (max?.revenueNum || 0) ? item : max),
      null
    );
  }, [monthlyTimeline]);

  const peakCity = useMemo(() => {
    if (!salesReport?.byCity || salesReport.byCity.length === 0) return null;
    return salesReport.byCity.reduce(
      (max, item) => (Number(item.revenue) > (Number(max?.revenue) || 0) ? item : max),
      null
    );
  }, [salesReport]);

  const totalPeriodRevenue = Number(salesReport?.summary?.total_revenue) || 1;

  const exportSalesReportCSV = () => {
    if (!salesReport) return;
    const lines = ['Month,Orders,Revenue'];
    (salesReport.byMonth || []).forEach((m) => {
      lines.push(`"${m.month}",${m.order_count},${m.revenue}`);
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sales_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    showToast('Exported sales report to CSV', 'success');
  };

  const exportCustomerInsightsCSV = () => {
    if (!customerInsights || customerInsights.length === 0) return;
    const lines = ['Customer Name,Customer Code,City,Value Tier,Lifetime Spend,Recent 30d Spend,Trend'];
    customerInsights.forEach((ci) => {
      lines.push(`"${ci.customer_name}","${ci.customer_code}","${ci.city}","${ci.value_tier}",${ci.lifetime_spend},${ci.recent_30d_spend},"${ci.purchase_trend}"`);
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `customer_trends_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    showToast('Exported customer trends to CSV', 'success');
  };

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

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Reports</h2>
          <p className="page-subtitle">Revenue, geographic trends, and customer purchase patterns</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'sales' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('sales')}
            >
              Sales Summary
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'insights' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('insights')}
            >
              Customer Trends
            </button>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={activeTab === 'sales' ? exportSalesReportCSV : exportCustomerInsightsCSV}
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {activeTab === 'sales' ? (
        <>
          <SalesReportTab
            loading={loading}
            salesReport={salesReport}
            startDate={startDate}
            endDate={endDate}
            cityFilter={cityFilter}
            setStartDate={setStartDate}
            setEndDate={setEndDate}
            setCityFilter={setCityFilter}
            handlePreset={handlePreset}
            monthlyTimeline={monthlyTimeline}
            peakMonth={peakMonth}
            peakCity={peakCity}
            totalPeriodRevenue={totalPeriodRevenue}
          />
          <BrandSalesChart brandSales={brandSales} loading={loading} />
        </>
      ) : (
        <CustomerInsightsTab
          insights={filteredInsights}
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
