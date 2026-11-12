import React, { useState, useRef, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { formatCurrency, formatChartValue } from '../../utils/format';

const CHART_COLORS = [
  '#2563eb',
  '#0f766e',
  '#d97706',
  '#7c3aed',
  '#dc2626',
  '#0891b2',
];

const parseChartNum = (val) => {
  if (typeof val === 'number') return Number.isFinite(val) ? val : 0;
  if (typeof val === 'string') {
    const clean = val.trim().replace(/₹|,/g, '');
    const num = Number(clean);
    return Number.isFinite(num) ? num : 0;
  }
  return 0;
};

export const AIChartView = ({
  chartConfig,
  rows = [],
  title = 'AI Chart',
  activeChartType = null,
  onChartTypeChange = null,
  compact = false,
}) => {
  const [localChartType, setLocalChartType] = useState(
    () => chartConfig?.chartType || 'bar'
  );
  const [exportingPng, setExportingPng] = useState(false);
  const chartBoxRef = useRef(null);

  const currentType = activeChartType || localChartType;
  const setType = (next) => {
    if (onChartTypeChange) {
      onChartTypeChange(next);
    } else {
      setLocalChartType(next);
    }
  };

  const yKeys = useMemo(() => chartConfig?.yKeys || [], [chartConfig]);
  const xKey = chartConfig?.xKey || '';
  const primaryY = yKeys[0];

  const chartData = useMemo(() => {
    if (!xKey || yKeys.length === 0 || !Array.isArray(rows)) return [];
    return rows.slice(0, 24).map((r) => {
      const point = {
        ...r,
        __label: String(r[xKey] ?? '-'),
      };
      yKeys.forEach((yk) => {
        point[yk.key] = parseChartNum(r[yk.key]);
      });
      return point;
    });
  }, [rows, xKey, yKeys]);

  if (!chartConfig || chartData.length === 0 || !primaryY) {
    return null;
  }

  const supportedTypes = chartConfig.supportedTypes || ['bar', 'line', 'donut'];

  const handleDownloadPng = async () => {
    if (!chartBoxRef.current || exportingPng) return;
    setExportingPng(true);
    try {
      const canvas = await html2canvas(chartBoxRef.current, {
        backgroundColor: null,
        scale: 2,
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      const slug = String(title || 'ai-chart')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .slice(0, 40);
      link.href = dataUrl;
      link.download = `${slug || 'ai-chart'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      // Ignore canvas capture failure in headless test environments
    } finally {
      setExportingPng(false);
    }
  };

  const tooltipFormatter = (value, name) => {
    const matched = yKeys.find((yk) => yk.label === name || yk.key === name);
    if (matched?.isCurrency || primaryY.isCurrency) {
      return [formatCurrency(value), matched?.label || name];
    }
    return [Number(value).toLocaleString('en-IN'), matched?.label || name];
  };

  const chartHeight = compact ? 220 : 260;

  return (
    <div className="ai-chart-card">
      <div className="ai-chart-toolbar">
        <div className="segmented-group" role="group" aria-label="Chart type">
          {supportedTypes.map((typeOption) => (
            <button
              key={typeOption}
              type="button"
              className={`segmented-btn ${currentType === typeOption ? 'active' : ''}`}
              onClick={() => setType(typeOption)}
            >
              {typeOption === 'bar' ? 'Bar' : typeOption === 'line' ? 'Line' : 'Donut'}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={handleDownloadPng}
          disabled={exportingPng}
          aria-label="Download chart as PNG"
        >
          <Download size={13} aria-hidden="true" />
          <span>{exportingPng ? 'Saving...' : 'PNG'}</span>
        </button>
      </div>

      <div ref={chartBoxRef} className="ai-chart-canvas" style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          {currentType === 'line' ? (
            <LineChart data={chartData} margin={{ top: 10, right: 16, left: 4, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis
                dataKey="__label"
                tick={{ fill: 'var(--chart-axis)', fontSize: 11 }}
                axisLine={{ stroke: 'var(--border)' }}
              />
              <YAxis
                tick={{ fill: 'var(--chart-axis)', fontSize: 11 }}
                axisLine={{ stroke: 'var(--border)' }}
                tickFormatter={(val) =>
                  primaryY.isCurrency ? formatChartValue(val) : Number(val).toLocaleString('en-IN')
                }
              />
              <Tooltip
                formatter={tooltipFormatter}
                contentStyle={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-strong)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                }}
              />
              {yKeys.length > 1 && <Legend />}
              {yKeys.map((yk, idx) => (
                <Line
                  key={yk.key}
                  type="monotone"
                  dataKey={yk.key}
                  name={yk.label}
                  stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              ))}
            </LineChart>
          ) : currentType === 'donut' ? (
            <PieChart>
              <Pie
                data={chartData}
                dataKey={primaryY.key}
                nameKey="__label"
                innerRadius={compact ? 48 : 56}
                outerRadius={compact ? 78 : 88}
                paddingAngle={2}
              >
                {chartData.map((entry, idx) => (
                  <Cell key={entry.__label} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={tooltipFormatter}
                contentStyle={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-strong)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
            </PieChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 10, right: 16, left: 4, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis
                dataKey="__label"
                tick={{ fill: 'var(--chart-axis)', fontSize: 11 }}
                axisLine={{ stroke: 'var(--border)' }}
              />
              <YAxis
                tick={{ fill: 'var(--chart-axis)', fontSize: 11 }}
                axisLine={{ stroke: 'var(--border)' }}
                tickFormatter={(val) =>
                  primaryY.isCurrency ? formatChartValue(val) : Number(val).toLocaleString('en-IN')
                }
              />
              <Tooltip
                formatter={tooltipFormatter}
                contentStyle={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-strong)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                }}
              />
              {yKeys.length > 1 && <Legend />}
              {yKeys.map((yk, idx) => (
                <Bar
                  key={yk.key}
                  dataKey={yk.key}
                  name={yk.label}
                  fill={CHART_COLORS[idx % CHART_COLORS.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AIChartView;

