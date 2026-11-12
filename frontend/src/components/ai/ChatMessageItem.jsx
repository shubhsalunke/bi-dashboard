import React, { useState } from 'react';
import {
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  Pin,
  Download,
  FileSpreadsheet,
  Table as TableIcon,
  BarChart3,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Badge } from '../common/Badge';
import { formatCurrency } from '../../utils/format';
import AIChartView from './AIChartView';

const isNumericValue = (val) => {
  if (typeof val === 'number') return true;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return false;
    if (/^[-+]?₹[\d,]+(\.\d+)?$/.test(trimmed)) return true;
    if (!isNaN(Number(trimmed))) return true;
  }
  return false;
};

const isMoneyMetricKey = (key) => {
  const lower = String(key || '').toLowerCase();
  if (
    lower.includes('count') ||
    lower.includes('percent') ||
    lower.includes('pct') ||
    lower.includes('orders')
  ) {
    return false;
  }
  return (
    lower.includes('revenue') ||
    lower.includes('spend') ||
    lower.includes('spent') ||
    lower.includes('amount') ||
    lower.includes('price') ||
    lower.includes('ordervalue') ||
    lower.includes('order_value') ||
    lower.includes('stock_value') ||
    lower.includes('avg_order') ||
    lower.includes('difference') ||
    lower.includes('drop') ||
    lower.includes('movingaverage') ||
    lower.includes('estimatednextmonth')
  );
};

const escapeCsvCell = (val) => {
  if (val === null || val === undefined) return '';
  let str = String(val);
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const renderMessageText = (text) => {
  if (!text || !text.includes('```')) {
    return <div style={{ whiteSpace: 'pre-wrap' }}>{text}</div>;
  }

  const segments = text.split(/(```[\s\S]*?```)/g);
  return (
    <div style={{ whiteSpace: 'pre-wrap' }}>
      {segments.map((seg, idx) => {
        if (seg.startsWith('```') && seg.endsWith('```')) {
          const code = seg.replace(/^```[^\n]*\n?/, '').replace(/\n?```$/, '');
          return (
            <pre key={idx} className="chat-code-block">
              <code>{code}</code>
            </pre>
          );
        }
        return <React.Fragment key={idx}>{seg}</React.Fragment>;
      })}
    </div>
  );
};

export const ChatMessageItem = ({
  msg,
  copiedId,
  onCopy,
  onFeedback,
  onPinWidget,
  onSelectFollowUp,
  isAdmin = false,
}) => {
  const isUser = msg.role === 'user';
  const chartConfig = msg.report?.chartConfig || null;
  const hasRows = Boolean(msg.report?.rows?.length > 0 && msg.report?.columns);

  const [viewMode, setViewMode] = useState('both'); // 'both' | 'table' | 'chart'
  const [selectedChartType, setSelectedChartType] = useState(
    () => chartConfig?.chartType || 'bar'
  );
  const [pinning, setPinning] = useState(false);

  const bubbleClass = isUser
    ? 'chat-bubble chat-bubble-user'
    : msg.isError
    ? 'chat-bubble chat-bubble-error'
    : 'chat-bubble chat-bubble-assistant';

  const columnNumericMap = {};
  if (hasRows) {
    msg.report.columns.forEach((col) => {
      columnNumericMap[col.key] = msg.report.rows.some((row) => isNumericValue(row[col.key]));
    });
  }

  const sqlText = isAdmin ? msg.sql || msg.report?.sql || null : null;
  const assumptionsText = msg.assumptions || msg.report?.assumptions || null;
  const followUps = msg.report?.followUps || [];
  const relatedQuestions = msg.report?.relatedQuestions || [];
  const promptSuggestions =
    followUps.length > 0 ? followUps.slice(0, 3) : relatedQuestions.slice(0, 2);

  const handleExportCsv = () => {
    if (!hasRows) return;
    const cols = msg.report.columns;
    const headerRow = cols.map((c) => escapeCsvCell(c.label)).join(',');
    const bodyRows = msg.report.rows.map((r) =>
      cols.map((c) => escapeCsvCell(r[c.key])).join(',')
    );
    const csv = [headerRow, ...bodyRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai-report-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    if (!hasRows) return;
    const cols = msg.report.columns;
    const formattedRows = msg.report.rows.map((row) => {
      const obj = {};
      cols.forEach((c) => {
        obj[c.label] = row[c.key] ?? '';
      });
      return obj;
    });
    const worksheet = XLSX.utils.json_to_sheet(formattedRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'AI Report');
    XLSX.writeFile(workbook, `ai-report-${Date.now()}.xlsx`);
  };

  const handlePin = async () => {
    if (!onPinWidget || !hasRows || pinning) return;
    setPinning(true);
    try {
      await onPinWidget({
        title: msg.report?.reportTitle || msg.question || 'Pinned AI Insight',
        question: msg.question || msg.report?.question || msg.report?.reportTitle || 'AI Insight',
        sql: sqlText,
        chartType: chartConfig ? selectedChartType : 'table',
        chartConfig,
        columns: msg.report.columns,
        rows: msg.report.rows,
      });
    } finally {
      setPinning(false);
    }
  };

  return (
    <div className={`chat-msg-row ${isUser ? 'chat-msg-row-user' : 'chat-msg-row-assistant'}`}>
      <div className={bubbleClass}>
        {!isUser && !msg.isError && (
          <div className="chat-assistant-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span>Assistant</span>
              {msg.report?.isEstimate && <Badge variant="warning" label="Estimate" />}
            </div>

            <div className="chat-header-actions">
              {hasRows && onPinWidget && (
                <button
                  type="button"
                  onClick={handlePin}
                  disabled={pinning}
                  className="chat-copy-btn"
                  aria-label="Pin to dashboard"
                  title="Pin to Dashboard"
                >
                  <Pin size={12} aria-hidden="true" />
                  <span>{pinning ? 'Pinning...' : 'Pin'}</span>
                </button>
              )}

              {onFeedback && msg.report?.messageId && (
                <>
                  <button
                    type="button"
                    onClick={() => onFeedback(msg.report.messageId, 'up', msg.id)}
                    className={`chat-copy-btn ${msg.feedback === 'up' ? 'active-feedback' : ''}`}
                    aria-label="Thumbs up feedback"
                    aria-pressed={msg.feedback === 'up'}
                  >
                    <ThumbsUp size={12} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onFeedback(msg.report.messageId, 'down', msg.id)}
                    className={`chat-copy-btn ${msg.feedback === 'down' ? 'active-feedback-down' : ''}`}
                    aria-label="Thumbs down feedback"
                    aria-pressed={msg.feedback === 'down'}
                  >
                    <ThumbsDown size={12} aria-hidden="true" />
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => onCopy(msg.text, msg.id)}
                className="chat-copy-btn"
                aria-label="Copy response"
              >
                {copiedId === msg.id ? (
                  <Check size={12} style={{ color: 'var(--success)' }} aria-hidden="true" />
                ) : (
                  <Copy size={12} aria-hidden="true" />
                )}
                <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        )}

        {renderMessageText(msg.text)}

        {msg.report?.summaryMetrics && Object.keys(msg.report.summaryMetrics).length > 0 && (
          <div className="chat-metrics-row">
            {Object.entries(msg.report.summaryMetrics).map(([key, val]) => (
              <div key={key} className="chat-metric-item">
                <span style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                  {key.replace(/([A-Z])/g, ' $1')}:
                </span>
                <span className="tabular-nums" style={{ fontWeight: 600 }}>
                  {typeof val === 'number' && isMoneyMetricKey(key)
                    ? formatCurrency(val, { decimals: 2 })
                    : String(val)}
                </span>
              </div>
            ))}
          </div>
        )}

        {hasRows && (
          <div className="chat-table-card">
            <div className="chat-table-header-bar">
              <div className="chat-table-title" style={{ borderBottom: 'none', padding: 0, background: 'transparent' }}>
                {msg.report.reportTitle || 'Query Results'}
              </div>

              <div className="chat-table-toolbar">
                {chartConfig && (
                  <div className="segmented-group" role="group" aria-label="View toggle">
                    <button
                      type="button"
                      className={`segmented-btn ${viewMode === 'table' ? 'active' : ''}`}
                      onClick={() => setViewMode('table')}
                    >
                      <TableIcon size={12} aria-hidden="true" />
                      <span>Table</span>
                    </button>
                    <button
                      type="button"
                      className={`segmented-btn ${viewMode === 'chart' ? 'active' : ''}`}
                      onClick={() => setViewMode('chart')}
                    >
                      <BarChart3 size={12} aria-hidden="true" />
                      <span>Chart</span>
                    </button>
                    <button
                      type="button"
                      className={`segmented-btn ${viewMode === 'both' ? 'active' : ''}`}
                      onClick={() => setViewMode('both')}
                    >
                      <span>Both</span>
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleExportCsv}
                  aria-label="Download CSV"
                >
                  <Download size={12} aria-hidden="true" />
                  <span>CSV</span>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleExportExcel}
                  aria-label="Download Excel"
                >
                  <FileSpreadsheet size={12} aria-hidden="true" />
                  <span>Excel</span>
                </button>
              </div>
            </div>

            {chartConfig && (viewMode === 'chart' || viewMode === 'both') && (
              <div style={{ padding: 'var(--space-3)', borderBottom: viewMode === 'both' ? '1px solid var(--border)' : 'none' }}>
                <AIChartView
                  chartConfig={chartConfig}
                  rows={msg.report.rows}
                  title={msg.report.reportTitle}
                  activeChartType={selectedChartType}
                  onChartTypeChange={setSelectedChartType}
                />
              </div>
            )}

            {(!chartConfig || viewMode === 'table' || viewMode === 'both') && (
              <div className="table-responsive" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                <table className="data-table" style={{ fontSize: '0.8125rem' }}>
                  <thead>
                    <tr>
                      {msg.report.columns.map((col) => (
                        <th key={col.key} className={columnNumericMap[col.key] ? 'num' : ''}>
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {msg.report.rows.map((row, rIdx) => (
                      <tr key={rIdx}>
                        {msg.report.columns.map((col) => {
                          const cellVal = row[col.key];
                          const isNumericInput =
                            typeof cellVal === 'number' ||
                            (typeof cellVal === 'string' && /^-?\d+(\.\d+)?$/.test(cellVal.trim()));
                          const isMoney = isMoneyMetricKey(col.key) && isNumericInput;
                          const displayVal = isMoney ? formatCurrency(cellVal) : cellVal;
                          const isNum = columnNumericMap[col.key];
                          return (
                            <td key={col.key} className={isNum ? 'num' : ''}>
                              {col.key === 'status' && typeof cellVal === 'string' ? (
                                <Badge status={cellVal} />
                              ) : (
                                displayVal
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {!isUser && !msg.isError && assumptionsText && (
          <div className="chat-how-calculated">
            <strong>How I calculated this:</strong> {assumptionsText}
            {msg.report?.durationMs !== undefined && msg.report?.durationMs !== null
              ? ` (${msg.report.rowCount ?? msg.report.rows?.length ?? 0} row(s), ${msg.report.durationMs}ms)`
              : ''}
          </div>
        )}

        {!isUser && !msg.isError && sqlText && (
          <details className="chat-calc-details">
            <summary className="chat-calc-summary">Show SQL</summary>
            <div className="chat-calc-body">
              <pre className="chat-code-block">
                <code>{sqlText}</code>
              </pre>
            </div>
          </details>
        )}

        {!isUser && !msg.isError && promptSuggestions.length > 0 && onSelectFollowUp && (
          <div className="chat-followups">
            <span className="chat-followups-label">Suggested next:</span>
            <div className="chat-followups-list">
              {promptSuggestions.map((q) => (
                <button
                  key={q}
                  type="button"
                  className="btn btn-secondary btn-sm chat-followup-pill"
                  onClick={() => onSelectFollowUp(q)}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="chat-timestamp">{msg.timestamp}</div>
    </div>
  );
};

export default ChatMessageItem;
